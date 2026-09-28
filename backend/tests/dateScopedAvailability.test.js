import { test, describe, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, run, queryOne } from '../src/db.js';
import { createBooking } from '../src/services/bookingService.js';
import { getAvailableSlots, MENTOR_TIMEZONE } from '../src/services/availabilityService.js';
import { getSystemBookingsForDate, getMentorBookingsForDate } from '../src/services/availabilityService.js';
import { MENTORS } from '../src/data/mentors.js';

describe('Date-Scoped Availability & Capacity Specification Tests', () => {
  beforeAll(async () => {
    await initDb(':memory:');
  });

  beforeEach(() => {
    resetDb();
  });

  test('TEST 1: Today has 2 bookings, Tomorrow has 0 bookings -> Today: 18 remaining, Tomorrow: 20 remaining', async () => {
    const nowMentor = DateTime.now().setZone(MENTOR_TIMEZONE);
    const todayStr = nowMentor.toFormat('yyyy-MM-dd');
    const tomorrowStr = nowMentor.plus({ days: 1 }).toFormat('yyyy-MM-dd');

    // Create 2 bookings for Today
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_today_1', 'P1', 'p1@test.com', 'C1', 'ai_ml', 'mentor_01', ?, '2026-09-28T05:30:00Z', 'CONFIRMED', datetime('now')),
        ('b_today_2', 'P2', 'p2@test.com', 'C2', 'ai_ml', 'mentor_02', ?, '2026-09-28T06:00:00Z', 'CONFIRMED', datetime('now'))
    `, [todayStr, todayStr]);

    assert.equal(getSystemBookingsForDate(todayStr), 2);
    assert.equal(getSystemBookingsForDate(tomorrowStr), 0);

    // Query availability for Today
    const todayAvailability = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: todayStr,
      parentTimezone: MENTOR_TIMEZONE
    });

    assert.equal(todayAvailability.dateBookingsCount, 2);
    assert.equal(todayAvailability.capacityRemainingOnDate, 18);
    assert.equal(todayAvailability.dailyCapacity, 20);
    assert.equal(todayAvailability.isToday, true);

    // Query availability for Tomorrow
    const tomorrowAvailability = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: tomorrowStr,
      parentTimezone: MENTOR_TIMEZONE
    });

    assert.equal(tomorrowAvailability.dateBookingsCount, 0);
    assert.equal(tomorrowAvailability.capacityRemainingOnDate, 20);
    assert.equal(tomorrowAvailability.dailyCapacity, 20);
    assert.equal(tomorrowAvailability.isToday, false);
  });

  test('TEST 2: Today has 2 bookings, Tomorrow has 7 bookings -> Today: 18 remaining, Tomorrow: 13 remaining', async () => {
    const nowMentor = DateTime.now().setZone(MENTOR_TIMEZONE);
    const todayStr = nowMentor.toFormat('yyyy-MM-dd');
    const tomorrowStr = nowMentor.plus({ days: 1 }).toFormat('yyyy-MM-dd');

    // Insert 2 bookings for today directly into DB across mentors
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_today_1', 'P1', 'p1@test.com', 'C1', 'coding_programming', 'mentor_01', ?, '2026-09-28T05:30:00Z', 'CONFIRMED', datetime('now')),
        ('b_today_2', 'P2', 'p2@test.com', 'C2', 'coding_programming', 'mentor_02', ?, '2026-09-28T06:00:00Z', 'CONFIRMED', datetime('now'))
    `, [todayStr, todayStr]);

    // Insert 7 bookings for tomorrow directly into DB across mentors
    const tomorrowMentors = ['mentor_01', 'mentor_02', 'mentor_03', 'mentor_04', 'mentor_05', 'mentor_06', 'mentor_07'];
    for (let i = 0; i < 7; i++) {
      run(`
        INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
        VALUES (?, 'P', 'p@test.com', 'C', 'coding_programming', ?, ?, '2026-09-29T05:30:00Z', 'CONFIRMED', datetime('now'))
      `, [`b_tomorrow_${i}`, tomorrowMentors[i], tomorrowStr]);
    }

    // Verify system bookings count
    assert.equal(getSystemBookingsForDate(todayStr), 2);
    assert.equal(getSystemBookingsForDate(tomorrowStr), 7);

    // Verify availability service for Today
    const todayRes = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: todayStr,
      parentTimezone: MENTOR_TIMEZONE
    });
    assert.equal(todayRes.dateBookingsCount, 2);
    assert.equal(todayRes.capacityRemainingOnDate, 18);

    // Verify availability service for Tomorrow
    const tomorrowRes = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: tomorrowStr,
      parentTimezone: MENTOR_TIMEZONE
    });
    assert.equal(tomorrowRes.dateBookingsCount, 7);
    assert.equal(tomorrowRes.capacityRemainingOnDate, 13);
  });

  test('TEST 3: Mentor has 2 bookings today and 0 tomorrow -> Mentor unavailable today, available tomorrow', async () => {
    const targetMentorId = 'mentor_01'; // Sneha Roy
    const nowMentor = DateTime.now().setZone(MENTOR_TIMEZONE);
    const todayStr = nowMentor.toFormat('yyyy-MM-dd');
    const tomorrowStr = nowMentor.plus({ days: 1 }).toFormat('yyyy-MM-dd');

    // Give mentor_01 two bookings today
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_m1_1', 'P1', 'p1@test.com', 'C1', 'coding_programming', ?, ?, '2026-09-28T05:00:00Z', 'CONFIRMED', datetime('now')),
        ('b_m1_2', 'P2', 'p2@test.com', 'C2', 'coding_programming', ?, ?, '2026-09-28T06:00:00Z', 'CONFIRMED', datetime('now'))
    `, [targetMentorId, todayStr, targetMentorId, todayStr]);

    assert.equal(getMentorBookingsForDate(targetMentorId, todayStr), 2);
    assert.equal(getMentorBookingsForDate(targetMentorId, tomorrowStr), 0);

    // Today: mentor_01 has reached maxDailyClasses (2/2)
    const todaySlots = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: todayStr,
      parentTimezone: MENTOR_TIMEZONE
    });

    const mentor01InToday = todaySlots.subjectMentorsCapacity.find(m => m.id === targetMentorId);
    assert.ok(mentor01InToday);
    assert.equal(mentor01InToday.dailyCount, 2);
    assert.equal(mentor01InToday.isDailyLimitReached, true);

    // Tomorrow: mentor_01 has 0/2 and is eligible
    const tomorrowSlots = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: tomorrowStr,
      parentTimezone: MENTOR_TIMEZONE
    });

    const mentor01InTomorrow = tomorrowSlots.subjectMentorsCapacity.find(m => m.id === targetMentorId);
    assert.ok(mentor01InTomorrow);
    assert.equal(mentor01InTomorrow.dailyCount, 0);
    assert.equal(mentor01InTomorrow.isDailyLimitReached, false);
  });

  test('TEST 4: Parent timezone differs from mentor timezone -> Daily mentor count uses mentor-local calendar date', async () => {
    // Parent in America/New_York (UTC-4 in EDT)
    // 8:00 AM EDT on 2026-09-28 is 5:30 PM IST on 2026-09-28!
    const parentTz = 'America/New_York';
    const parentSlotMorning = DateTime.fromISO('2026-09-28T08:00:00', { zone: parentTz });
    const mentorInstant = parentSlotMorning.setZone(MENTOR_TIMEZONE);

    assert.equal(parentSlotMorning.toFormat('yyyy-MM-dd'), '2026-09-28');
    assert.equal(mentorInstant.toFormat('yyyy-MM-dd'), '2026-09-28');

    // Insert a booking for mentor_01 on 2026-09-28 in mentor's calendar
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES ('b_tz_1', 'P', 'p@test.com', 'C', 'ai_ml', 'mentor_01', '2026-09-28', ?, 'CONFIRMED', datetime('now'))
    `, [parentSlotMorning.toUTC().toISO()]);

    assert.equal(getMentorBookingsForDate('mentor_01', '2026-09-28'), 1);
    assert.equal(getMentorBookingsForDate('mentor_01', '2026-09-29'), 0);
  });

  test('TEST 5: Booking crosses a UTC date boundary -> Availability uses correct local date semantics', async () => {
    const slotUtcIso = '2026-09-29T05:00:00.000Z'; // 10:30 AM IST on Sep 29, 01:00 AM EDT on Sep 29
    const dtUtc = DateTime.fromISO(slotUtcIso);
    const dtIst = dtUtc.setZone('Asia/Kolkata');
    const dtEdt = dtUtc.setZone('America/New_York');

    assert.equal(dtIst.toFormat('yyyy-MM-dd'), '2026-09-29');
    assert.equal(dtEdt.toFormat('yyyy-MM-dd'), '2026-09-29');

    // Create booking for this slot
    await createBooking({
      parentName: 'Boundary Parent',
      parentEmail: 'boundary@test.com',
      childName: 'Boundary Kid',
      subjectId: 'ai_ml',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtcIso
    });

    const b = queryOne("SELECT * FROM bookings WHERE parent_email = 'boundary@test.com'");
    assert.ok(b);
    assert.equal(b.mentor_local_date, '2026-09-29', 'Booking must be stored under mentor local date in IST');
  });

  test('TEST 6: Change selected date in the query -> Availability is recomputed for the new date', async () => {
    // Seed 3 bookings on 2026-10-01 and 0 on 2026-10-02
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_oct1_1', 'P1', 'p1@test.com', 'C1', 'ai_ml', 'mentor_01', '2026-10-01', '2026-10-01T05:00:00Z', 'CONFIRMED', datetime('now')),
        ('b_oct1_2', 'P2', 'p2@test.com', 'C2', 'ai_ml', 'mentor_02', '2026-10-01', '2026-10-01T05:30:00Z', 'CONFIRMED', datetime('now')),
        ('b_oct1_3', 'P3', 'p3@test.com', 'C3', 'ai_ml', 'mentor_03', '2026-10-01', '2026-10-01T06:00:00Z', 'CONFIRMED', datetime('now'))
    `);

    // Date 1: 2026-10-01
    const res1 = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: '2026-10-01',
      parentTimezone: 'America/New_York'
    });
    assert.equal(res1.dateBookingsCount, 3);
    assert.equal(res1.capacityRemainingOnDate, 17);
    assert.equal(res1.formattedDate, 'October 1');

    // Date 2: 2026-10-02
    const res2 = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: '2026-10-02',
      parentTimezone: 'America/New_York'
    });
    assert.equal(res2.dateBookingsCount, 0);
    assert.equal(res2.capacityRemainingOnDate, 20);
    assert.equal(res2.formattedDate, 'October 2');
  });

  test('TEST 7: Return from September 29 to September 28 -> Correct September 28 value returns with no stale data', async () => {
    // 2026-09-28 has 2 bookings
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_s28_1', 'P1', 'p1@test.com', 'C1', 'coding_programming', 'mentor_01', '2026-09-28', '2026-09-28T05:00:00Z', 'CONFIRMED', datetime('now')),
        ('b_s28_2', 'P2', 'p2@test.com', 'C2', 'coding_programming', 'mentor_02', '2026-09-28', '2026-09-28T06:00:00Z', 'CONFIRMED', datetime('now'))
    `);

    // Step A: Select September 28
    const sep28Initial = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: '2026-09-28',
      parentTimezone: 'America/New_York'
    });
    assert.equal(sep28Initial.dateBookingsCount, 2);
    assert.equal(sep28Initial.capacityRemainingOnDate, 18);
    assert.equal(sep28Initial.formattedDate, 'September 28');

    // Step B: Select September 29
    const sep29 = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: '2026-09-29',
      parentTimezone: 'America/New_York'
    });
    assert.equal(sep29.dateBookingsCount, 0);
    assert.equal(sep29.capacityRemainingOnDate, 20);
    assert.equal(sep29.formattedDate, 'September 29');

    // Step C: Return to September 28
    const sep28Return = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: '2026-09-28',
      parentTimezone: 'America/New_York'
    });
    assert.equal(sep28Return.dateBookingsCount, 2);
    assert.equal(sep28Return.capacityRemainingOnDate, 18);
    assert.equal(sep28Return.formattedDate, 'September 28');
    assert.ok(sep28Return.availabilityLabel.includes('18 slots remaining (2/20 booked)'));
  });
});
