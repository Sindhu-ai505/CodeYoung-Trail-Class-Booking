import { test, describe, beforeAll as before, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, getDb } from '../src/db.js';
import { createBooking } from '../src/services/bookingService.js';
import { getAvailableSlots, MENTOR_TIMEZONE } from '../src/services/availabilityService.js';
import { MENTORS } from '../src/data/mentors.js';

describe('Automatic Mentor Matching System (Section 15 Tests)', () => {
  before(async () => {
    await initDb(':memory:');
  });

  beforeEach(() => {
    resetDb();
  });

  // TEST 1: Parent selects Course + Date + Time -> System automatically finds a mentor
  test('TEST 1: System automatically finds and assigns an available mentor with no mentor input', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 3 }).toFormat('yyyy-MM-dd');
    // 7:00 AM EDT -> 4:30 PM IST (within working hours 10-20 IST)
    const testUtcStart = DateTime.fromISO(`${dateStr}T07:00:00`, { zone: parentTz }).toUTC().toISO();

    const booking = await createBooking({
      parentName: 'Parent One',
      parentEmail: 'parent.one@example.com',
      childName: 'Aria',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: testUtcStart
      // No mentorId provided!
    });

    assert.equal(booking.success, true);
    assert.ok(booking.mentorId, 'System must assign a mentor ID');
    assert.ok(booking.mentorName, 'System must assign a mentor name');
    
    // Mentor must be qualified for ai_ml
    const mentorObj = MENTORS.find(m => m.id === booking.mentorId);
    assert.ok(mentorObj.supportedSubjects.includes('ai_ml'), 'Assigned mentor must be qualified for course');
  });

  // TEST 2: Change the time -> Potentially different mentor based on real availability
  test('TEST 2: Changing time assigns mentor based on operating hours and availability', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 4 }).toFormat('yyyy-MM-dd');
    
    // Time slot 1: 6:00 AM EDT -> 3:30 PM IST
    const slot1Utc = DateTime.fromISO(`${dateStr}T06:00:00`, { zone: parentTz }).toUTC().toISO();
    const booking1 = await createBooking({
      parentName: 'Parent Two',
      parentEmail: 'parent.two@example.com',
      childName: 'Ethan',
      subjectId: 'coding_programming',
      parentTimezone: parentTz,
      utcStartIso: slot1Utc
    });

    assert.equal(booking1.success, true);
    assert.ok(booking1.mentorId);

    // Book another time slot for a different student
    const slot2Utc = DateTime.fromISO(`${dateStr}T09:00:00`, { zone: parentTz }).toUTC().toISO();
    const booking2 = await createBooking({
      parentName: 'Parent Three',
      parentEmail: 'parent.three@example.com',
      childName: 'Chloe',
      subjectId: 'coding_programming',
      parentTimezone: parentTz,
      utcStartIso: slot2Utc
    });

    assert.equal(booking2.success, true);
    assert.ok(booking2.mentorId);
  });

  // TEST 3: Change the course -> Different eligible mentor pool and assignment
  test('TEST 3: Changing course filters mentor pool strictly to course-compatible mentors', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 5 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${dateStr}T08:00:00`, { zone: parentTz }).toUTC().toISO();

    // Booking for ai_ml
    const bookingAi = await createBooking({
      parentName: 'Parent AI',
      parentEmail: 'parent.ai@example.com',
      childName: 'Sam',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: slotUtc
    });

    const mentorAi = MENTORS.find(m => m.id === bookingAi.mentorId);
    assert.ok(mentorAi.supportedSubjects.includes('ai_ml'), 'Must support ai_ml');

    // Reset DB and book for web_development at same time
    resetDb();
    const bookingWeb = await createBooking({
      parentName: 'Parent Web',
      parentEmail: 'parent.web@example.com',
      childName: 'Mia',
      subjectId: 'web_development',
      parentTimezone: parentTz,
      utcStartIso: slotUtc
    });

    const mentorWeb = MENTORS.find(m => m.id === bookingWeb.mentorId);
    assert.ok(mentorWeb.supportedSubjects.includes('web_development'), 'Must support web_development');
  });

  // TEST 4: Give Mentor A two bookings for their local date -> Mentor B is automatically assigned
  test('TEST 4: When Mentor A reaches 2 bookings for their local date, Mentor B is automatically assigned', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 6 }).toFormat('yyyy-MM-dd');
    
    // Slot 1: 6:30 AM EDT -> 4:00 PM IST (mentor_02 and mentor_05 teach game_development)
    const slot1Utc = DateTime.fromISO(`${dateStr}T06:30:00`, { zone: parentTz }).toUTC().toISO();
    const booking1 = await createBooking({
      parentName: 'Parent A',
      parentEmail: 'parent.a@example.com',
      childName: 'Child A',
      subjectId: 'game_development',
      parentTimezone: parentTz,
      utcStartIso: slot1Utc
    });
    const mentorAId = booking1.mentorId;
    const mentorDate = booking1.mentorLocalDate;

    const db = getDb();
    const nowIso = DateTime.utc().toISO();
    
    // Insert a second booking directly for mentorAId on that date to cap them at 2/2
    db.prepare(`
      INSERT INTO bookings (
        id, parent_id, parent_name, parent_email, child_name,
        subject_id, subject_title, parent_timezone, parent_local_datetime,
        mentor_id, mentor_name, mentor_timezone, mentor_local_date, mentor_local_time,
        slot_start_utc, slot_end_utc, start_time_utc, end_time_utc,
        meeting_link, duration_minutes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'bk_fill_2', 'p_fill', 'Parent Fill', 'fill@example.com', 'Student Fill',
      'game_development', 'Game Development', parentTz, 'datetime',
      mentorAId, 'Mentor A Name', MENTOR_TIMEZONE, mentorDate, '5:00 PM',
      DateTime.fromISO(slot1Utc).plus({ hours: 1 }).toISO(),
      DateTime.fromISO(slot1Utc).plus({ hours: 1, minutes: 30 }).toISO(),
      DateTime.fromISO(slot1Utc).plus({ hours: 1 }).toISO(),
      DateTime.fromISO(slot1Utc).plus({ hours: 1, minutes: 30 }).toISO(),
      'https://demo.example.com/class/bk_fill_2', 30, 'CONFIRMED', nowIso
    );

    // Verify Mentor A has reached 2/2
    const mentorACount = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE mentor_id = ? AND mentor_local_date = ? AND status = 'CONFIRMED'`).get(mentorAId, mentorDate).count;
    assert.equal(mentorACount, 2, 'Mentor A must have reached 2/2 bookings');

    // Slot 3: Book another session for game_development
    const slot3Utc = DateTime.fromISO(`${dateStr}T08:30:00`, { zone: parentTz }).toUTC().toISO();
    const booking3 = await createBooking({
      parentName: 'Parent B',
      parentEmail: 'parent.b@example.com',
      childName: 'Child B',
      subjectId: 'game_development',
      parentTimezone: parentTz,
      utcStartIso: slot3Utc
    });

    assert.equal(booking3.success, true);
    assert.notEqual(booking3.mentorId, mentorAId, 'Mentor A cannot receive another booking once at 2/2');
    
    // Mentor B must be a compatible mentor
    const mentorBObj = MENTORS.find(m => m.id === booking3.mentorId);
    assert.ok(mentorBObj.supportedSubjects.includes('game_development'), 'Mentor B must support game_development');
  });

  // TEST 5: Make all compatible mentors unavailable -> NO MENTOR AVAILABLE
  test('TEST 5: When all compatible mentors are at 2/2 daily limit, booking rejects with NO MENTOR AVAILABLE', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 7 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${dateStr}T06:00:00`, { zone: parentTz }).toUTC().toISO();
    const mentorDate = DateTime.fromISO(slotUtc, { zone: MENTOR_TIMEZONE }).toFormat('yyyy-MM-dd');

    // Find all mentors supporting robotics (mentor_04 and mentor_09)
    const subjectId = 'robotics';
    const compatibleMentors = MENTORS.filter(m => m.supportedSubjects.includes(subjectId));
    assert.ok(compatibleMentors.length > 0);

    const db = getDb();
    const nowIso = DateTime.utc().toISO();

    // Cap each compatible mentor at 2 bookings for that date
    for (const mentor of compatibleMentors) {
      for (let i = 1; i <= 2; i++) {
        db.prepare(`
          INSERT INTO bookings (
            id, parent_id, parent_name, parent_email, child_name,
            subject_id, subject_title, parent_timezone, parent_local_datetime,
            mentor_id, mentor_name, mentor_timezone, mentor_local_date, mentor_local_time,
            slot_start_utc, slot_end_utc, start_time_utc, end_time_utc,
            meeting_link, duration_minutes, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `bk_cap_${mentor.id}_${i}`, 'p_cap', 'Parent Cap', 'cap@example.com', 'Student Cap',
          subjectId, 'Robotics', parentTz, 'datetime',
          mentor.id, mentor.name, MENTOR_TIMEZONE, mentorDate, `${10 + i}:00 AM`,
          DateTime.fromISO(slotUtc).plus({ hours: i * 2 }).toISO(),
          DateTime.fromISO(slotUtc).plus({ hours: i * 2, minutes: 30 }).toISO(),
          DateTime.fromISO(slotUtc).plus({ hours: i * 2 }).toISO(),
          DateTime.fromISO(slotUtc).plus({ hours: i * 2, minutes: 30 }).toISO(),
          `https://demo.example.com/class/bk_cap_${mentor.id}_${i}`, 30, 'CONFIRMED', nowIso
        );
      }
    }

    // Now attempt to book robotics for that date
    await assert.rejects(
      async () => {
        await createBooking({
          parentName: 'Parent Blocked',
          parentEmail: 'blocked@example.com',
          childName: 'Student Blocked',
          subjectId,
          parentTimezone: parentTz,
          utcStartIso: slotUtc
        });
      },
      (err) => {
        assert.ok(
          err.code === 'MENTOR_DAILY_LIMIT_REACHED' || err.code === 'NO_MENTORS_AVAILABLE' || err.code === 'NO_MENTOR_AVAILABLE',
          `Expected limit reached error code, got: ${err.code}`
        );
        return true;
      }
    );
  });

  // TEST 6: Attempt to modify mentorId in request -> Backend still assigns the correct eligible mentor
  test('TEST 6: Frontend cannot force an arbitrary mentorId; backend authoritative matching applies', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 8 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${dateStr}T07:30:00`, { zone: parentTz }).toUTC().toISO();

    // Client passes a malicious or arbitrary mentorId (e.g. mentor_99 which doesn't exist, or mentor_04 which doesn't teach ai_ml)
    const booking = await createBooking({
      parentName: 'Security Tester',
      parentEmail: 'security@example.com',
      childName: 'Alex',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: slotUtc,
      mentorId: 'mentor_04', // mentor_04 is Rohan Kulkarni (Robotics, not AI & ML)
      mentor_id: 'mentor_04'
    });

    assert.equal(booking.success, true);
    // Backend must NOT have assigned mentor_04
    assert.notEqual(booking.mentorId, 'mentor_04', 'Backend must not allow arbitrary mentorId injection');
    
    // True assigned mentor must support ai_ml
    const trueMentor = MENTORS.find(m => m.id === booking.mentorId);
    assert.ok(trueMentor.supportedSubjects.includes('ai_ml'), 'Backend assigned mentor must support ai_ml');
  });

  // TEST 7: Create simultaneous bookings for the same slot -> Atomic transaction prevents double-booking
  test('TEST 7: Concurrent atomic bookings for the same slot assign distinct mentors without double-booking', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 9 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${dateStr}T07:00:00`, { zone: parentTz }).toUTC().toISO();

    // 2 parents attempt to book the exact same slot concurrently for coding_programming
    const [bookingA, bookingB] = await Promise.all([
      createBooking({
        clientRequestId: 'req_conc_1',
        parentName: 'Parent Conc 1',
        parentEmail: 'conc1@example.com',
        childName: 'Student 1',
        subjectId: 'coding_programming',
        parentTimezone: parentTz,
        utcStartIso: slotUtc
      }),
      createBooking({
        clientRequestId: 'req_conc_2',
        parentName: 'Parent Conc 2',
        parentEmail: 'conc2@example.com',
        childName: 'Student 2',
        subjectId: 'coding_programming',
        parentTimezone: parentTz,
        utcStartIso: slotUtc
      })
    ]);

    assert.equal(bookingA.success, true);
    assert.equal(bookingB.success, true);
    assert.notEqual(bookingA.mentorId, bookingB.mentorId, 'Mentors must be distinct: no double booking for the same time slot');
  });
});
