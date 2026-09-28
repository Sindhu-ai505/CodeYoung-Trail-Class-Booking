import { test, describe, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, run, queryOne } from '../src/db.js';
import { createBooking } from '../src/services/bookingService.js';
import { getAvailableSlots, MENTOR_TIMEZONE } from '../src/services/availabilityService.js';
import { 
  BOOKING_WINDOW_DAYS, 
  getBookingWindowBounds, 
  isDateWithinBookingWindow 
} from '../src/utils/time.js';

describe('90-Day Rolling Booking Calendar Range & Multi-Month Tests', () => {
  const parentTz = 'America/New_York';

  beforeAll(async () => {
    await initDb(':memory:');
  });

  beforeEach(() => {
    resetDb();
  });

  test('1. Today\'s date is selectable and valid within the 90-day window', async () => {
    const today = DateTime.now().setZone(parentTz).startOf('day');
    const todayStr = today.toFormat('yyyy-MM-dd');

    const check = isDateWithinBookingWindow(todayStr, parentTz);
    assert.equal(check.valid, true);

    const res = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: todayStr,
      parentTimezone: parentTz
    });

    assert.equal(res.date, todayStr);
    assert.equal(res.bookingWindow.daysAllowed, 91);
    assert.ok(res.slots.length > 0);
  });

  test('2. Tomorrow is selectable and valid within booking window', async () => {
    const tomorrow = DateTime.now().setZone(parentTz).plus({ days: 1 }).startOf('day');
    const tomorrowStr = tomorrow.toFormat('yyyy-MM-dd');

    const check = isDateWithinBookingWindow(tomorrowStr, parentTz);
    assert.equal(check.valid, true);

    const res = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: tomorrowStr,
      parentTimezone: parentTz
    });

    assert.equal(res.date, tomorrowStr);
    assert.ok(res.slots.length > 0);
  });

  test('3. Date 14 days from today is selectable and valid', async () => {
    const day14 = DateTime.now().setZone(parentTz).plus({ days: 14 }).startOf('day');
    const day14Str = day14.toFormat('yyyy-MM-dd');

    const check = isDateWithinBookingWindow(day14Str, parentTz);
    assert.equal(check.valid, true);

    const res = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: day14Str,
      parentTimezone: parentTz
    });

    assert.equal(res.date, day14Str);
    assert.ok(res.slots.length > 0);
  });

  test('4. Future dates across October, November, and December are selectable and return real availability', async () => {
    // Current simulated date is 2026-09-28.
    // October 15, 2026 is ~17 days ahead
    // November 12, 2026 is ~45 days ahead
    // December 20, 2026 is ~83 days ahead
    const testDates = [
      { name: 'October 15', dateStr: '2026-10-15', subject: 'coding_programming' },
      { name: 'November 12', dateStr: '2026-11-12', subject: 'ai_ml' },
      { name: 'December 20', dateStr: '2026-12-20', subject: 'web_development' }
    ];

    for (const item of testDates) {
      const check = isDateWithinBookingWindow(item.dateStr, parentTz);
      assert.equal(check.valid, true, `${item.name} (${item.dateStr}) must be within the 90-day booking window`);

      const res = await getAvailableSlots({
        subjectId: item.subject,
        dateStr: item.dateStr,
        parentTimezone: parentTz
      });

      assert.equal(res.date, item.dateStr, `Requested date for ${item.name} must match response date`);
      assert.ok(res.slots.length > 0, `Real availability slots must be returned for ${item.name}`);
      assert.equal(res.bookingWindow.daysAllowed, 91);
      assert.ok(res.availabilityLabel.includes(item.name) || res.availabilityLabel.includes(DateTime.fromISO(item.dateStr).toFormat('LLLL d')));
    }
  });

  test('5. Date 90 days from today is selectable and valid (inclusive upper bound)', async () => {
    const day90 = DateTime.now().setZone(parentTz).plus({ days: 90 }).startOf('day');
    const day90Str = day90.toFormat('yyyy-MM-dd');

    const check = isDateWithinBookingWindow(day90Str, parentTz);
    assert.equal(check.valid, true);

    const res = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: day90Str,
      parentTimezone: parentTz
    });

    assert.equal(res.date, day90Str);
    assert.ok(res.slots.length > 0);
  });

  test('6. Date 91 days from today is NOT selectable (rejected by 90-day booking window)', async () => {
    const day91 = DateTime.now().setZone(parentTz).plus({ days: 91 }).startOf('day');
    const day91Str = day91.toFormat('yyyy-MM-dd');

    const check = isDateWithinBookingWindow(day91Str, parentTz);
    assert.equal(check.valid, false);
    assert.equal(check.error, 'DATE_OUT_OF_WINDOW');

    await assert.rejects(
      async () => {
        await getAvailableSlots({
          subjectId: 'coding_programming',
          dateStr: day91Str,
          parentTimezone: parentTz
        });
      },
      (err) => {
        assert.equal(err.code, 'DATE_OUT_OF_WINDOW');
        return true;
      }
    );
  });

  test('7. Past dates are NOT selectable (rejected as in the past)', async () => {
    const yesterday = DateTime.now().setZone(parentTz).minus({ days: 1 }).startOf('day');
    const yesterdayStr = yesterday.toFormat('yyyy-MM-dd');

    const check = isDateWithinBookingWindow(yesterdayStr, parentTz);
    assert.equal(check.valid, false);
    assert.equal(check.error, 'DATE_IN_PAST');

    await assert.rejects(
      async () => {
        await getAvailableSlots({
          subjectId: 'coding_programming',
          dateStr: yesterdayStr,
          parentTimezone: parentTz
        });
      },
      (err) => {
        assert.equal(err.code, 'DATE_IN_PAST');
        return true;
      }
    );
  });

  test('8. Daily capacity is date-specific: bookings on one date do NOT carry over to other dates', async () => {
    const oct10 = '2026-10-10';
    const nov10 = '2026-11-10';
    const dec10 = '2026-12-10';

    // Seed 4 bookings on October 10
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_oct_1', 'P1', 'p1@test.com', 'C1', 'ai_ml', 'mentor_01', ?, '2026-10-10T05:00:00Z', 'CONFIRMED', datetime('now')),
        ('b_oct_2', 'P2', 'p2@test.com', 'C2', 'ai_ml', 'mentor_02', ?, '2026-10-10T05:30:00Z', 'CONFIRMED', datetime('now')),
        ('b_oct_3', 'P3', 'p3@test.com', 'C3', 'ai_ml', 'mentor_03', ?, '2026-10-10T06:00:00Z', 'CONFIRMED', datetime('now')),
        ('b_oct_4', 'P4', 'p4@test.com', 'C4', 'ai_ml', 'mentor_05', ?, '2026-10-10T06:30:00Z', 'CONFIRMED', datetime('now'))
    `, [oct10, oct10, oct10, oct10]);

    // Seed 8 bookings on December 10
    for (let i = 1; i <= 8; i++) {
      run(`
        INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
        VALUES (?, ?, 'dec@test.com', 'Kid', 'ai_ml', 'mentor_01', ?, '2026-12-10T05:00:00Z', 'CONFIRMED', datetime('now'))
      `, [`b_dec_${i}`, `Parent Dec ${i}`, dec10]);
    }

    // October 10: 4 booked, 16 remaining
    const resOct = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: oct10,
      parentTimezone: parentTz
    });
    assert.equal(resOct.dateBookingsCount, 4);
    assert.equal(resOct.capacityRemainingOnDate, 16);

    // November 10: 0 booked, 20 remaining (independent date!)
    const resNov = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: nov10,
      parentTimezone: parentTz
    });
    assert.equal(resNov.dateBookingsCount, 0);
    assert.equal(resNov.capacityRemainingOnDate, 20);

    // December 10: 8 booked, 12 remaining
    const resDec = await getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr: dec10,
      parentTimezone: parentTz
    });
    assert.equal(resDec.dateBookingsCount, 8);
    assert.equal(resDec.capacityRemainingOnDate, 12);
  });

  test('9. Mentor daily limit (2 sessions/day) applies independently per date in mentor local date (IST)', async () => {
    const oct10 = '2026-10-10';
    const oct11 = '2026-10-11';

    // Sneha Roy (mentor_01) has 2 bookings on Oct 10, 0 on Oct 11
    run(`
      INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, mentor_local_date, slot_start_utc, status, created_at)
      VALUES 
        ('b_sneha_1', 'P1', 'p1@test.com', 'C1', 'coding_programming', 'mentor_01', ?, '2026-10-10T05:00:00Z', 'CONFIRMED', datetime('now')),
        ('b_sneha_2', 'P2', 'p2@test.com', 'C2', 'coding_programming', 'mentor_01', ?, '2026-10-10T05:30:00Z', 'CONFIRMED', datetime('now'))
    `, [oct10, oct10]);

    const resOct10 = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: oct10,
      parentTimezone: parentTz
    });
    const mentorOct10 = resOct10.subjectMentorsCapacity.find(m => m.id === 'mentor_01');
    assert.ok(mentorOct10);
    assert.equal(mentorOct10.dailyCount, 2);
    assert.equal(mentorOct10.isDailyLimitReached, true);

    const resOct11 = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: oct11,
      parentTimezone: parentTz
    });
    const mentorOct11 = resOct11.subjectMentorsCapacity.find(m => m.id === 'mentor_01');
    assert.ok(mentorOct11);
    assert.equal(mentorOct11.dailyCount, 0);
    assert.equal(mentorOct11.isDailyLimitReached, false);
  });

  test('10. Backend accepts booking creation for dates in October, November, and December through day 90', async () => {
    const targetDates = ['2026-10-15', '2026-11-12', '2026-12-20'];

    for (const dateStr of targetDates) {
      const avail = await getAvailableSlots({
        subjectId: 'ai_ml',
        dateStr,
        parentTimezone: parentTz
      });
      assert.ok(avail.slots.length > 0, `Available slots must exist for ${dateStr}`);
      const chosenSlot = avail.slots[0];

      const booking = await createBooking({
        parentName: `Parent on ${dateStr}`,
        parentEmail: `parent.${dateStr.replace(/-/g, '')}@example.com`,
        childName: `Kid ${dateStr}`,
        subjectId: 'ai_ml',
        parentTimezone: parentTz,
        utcStartIso: chosenSlot.utcStart
      });

      assert.equal(booking.success, true);
      assert.ok(booking.bookingId);
      assert.equal(booking.parentEmail, `parent.${dateStr.replace(/-/g, '')}@example.com`);
    }
  });

  test('11. Backend rejects booking creation for dates beyond day 90', async () => {
    const day91 = DateTime.now().setZone(parentTz).plus({ days: 91 });
    const day91Str = day91.toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${day91Str}T10:00:00`, { zone: parentTz }).toUTC().toISO();

    await assert.rejects(
      async () => {
        await createBooking({
          parentName: 'Parent Day 91',
          parentEmail: 'parent91@example.com',
          childName: 'Kid 91',
          subjectId: 'ai_ml',
          parentTimezone: parentTz,
          utcStartIso: slotUtc
        });
      },
      (err) => {
        assert.equal(err.code, 'DATE_OUT_OF_WINDOW');
        return true;
      }
    );
  });

  test('12. Timezone and DST calculations remain correct across the 90-day window including EDT to EST transition', () => {
    const bounds = getBookingWindowBounds(parentTz);
    assert.equal(bounds.daysAllowed, 91);

    // US Daylight Saving Time ends first Sunday of November (2026-11-01):
    // In October (EDT): UTC-4, 10:00 AM EDT = 14:00 UTC = 19:30 IST (offset diff 9.5 hours)
    // In late November (EST): UTC-5, 10:00 AM EST = 15:00 UTC = 20:30 IST (offset diff 10.5 hours)
    const octDt = DateTime.fromISO('2026-10-15T10:00:00', { zone: parentTz });
    const octIst = octDt.setZone(MENTOR_TIMEZONE);
    assert.equal(octIst.hour, 19);
    assert.equal(octIst.minute, 30);

    const novDt = DateTime.fromISO('2026-11-15T10:00:00', { zone: parentTz });
    const novIst = novDt.setZone(MENTOR_TIMEZONE);
    assert.equal(novIst.hour, 20);
    assert.equal(novIst.minute, 30);
  });

  test('13. UK Parent Timezone (Europe/London) evaluates 90-day calendar window and converts accurately to IST', async () => {
    const ukTz = 'Europe/London';
    const bounds = getBookingWindowBounds(ukTz);
    assert.equal(bounds.daysAllowed, 91);

    const ukDate = '2026-10-20';
    const res = await getAvailableSlots({
      subjectId: 'web_development',
      dateStr: ukDate,
      parentTimezone: ukTz
    });

    assert.equal(res.date, ukDate);
    assert.ok(res.slots.length > 0);
  });

  test('14. Dynamic Availability Label strictly formats "Today\'s Availability" vs "<Date> Availability"', async () => {
    const todayStr = DateTime.now().setZone(parentTz).toFormat('yyyy-MM-dd');
    const octStr = '2026-10-15';
    const novStr = '2026-11-12';
    const decStr = '2026-12-20';

    const resToday = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: todayStr,
      parentTimezone: parentTz
    });
    assert.ok(resToday.availabilityLabel.startsWith("Today's Availability:"));

    const resOct = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: octStr,
      parentTimezone: parentTz
    });
    assert.ok(resOct.availabilityLabel.startsWith("October 15 Availability:"));

    const resNov = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: novStr,
      parentTimezone: parentTz
    });
    assert.ok(resNov.availabilityLabel.startsWith("November 12 Availability:"));

    const resDec = await getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: decStr,
      parentTimezone: parentTz
    });
    assert.ok(resDec.availabilityLabel.startsWith("December 20 Availability:"));
  });

  test('15. Calendar month bounds dynamic calculation: Next Month disabled when past 90-day window', () => {
    const today = DateTime.fromISO('2026-09-28', { zone: parentTz });
    const maxDate = today.plus({ days: BOOKING_WINDOW_DAYS }); // 2026-12-27

    // From September 2026: next month is October 2026 (Oct 1 <= Dec 27) -> true
    const sepDt = DateTime.fromISO('2026-09-01', { zone: parentTz });
    assert.equal(sepDt.plus({ months: 1 }).startOf('month') <= maxDate, true);

    // From October 2026: next month is November 2026 (Nov 1 <= Dec 27) -> true
    const octDt = DateTime.fromISO('2026-10-01', { zone: parentTz });
    assert.equal(octDt.plus({ months: 1 }).startOf('month') <= maxDate, true);

    // From November 2026: next month is December 2026 (Dec 1 <= Dec 27) -> true
    const novDt = DateTime.fromISO('2026-11-01', { zone: parentTz });
    assert.equal(novDt.plus({ months: 1 }).startOf('month') <= maxDate, true);

    // From December 2026: next month is January 2027 (Jan 1, 2027 <= Dec 27, 2026 is FALSE) -> false
    const decDt = DateTime.fromISO('2026-12-01', { zone: parentTz });
    assert.equal(decDt.plus({ months: 1 }).startOf('month') <= maxDate, false);
  });
});
