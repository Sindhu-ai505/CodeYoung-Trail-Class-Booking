import { test, describe, beforeAll as before, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, getDb } from '../src/db.js';
import { createBooking } from '../src/services/bookingService.js';
import { getAvailableSlots } from '../src/services/availabilityService.js';
import { MENTORS } from '../src/data/mentors.js';

describe('Universal Timezone Automatic Mentor Matching (Sections 13-17 & 22)', () => {
  before(async () => {
    await initDb(':memory:');
  });

  beforeEach(() => {
    resetDb();
  });

  // SECTION 13: TEST ALL 7 TIMEZONES
  const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata'
  ];

  for (const tz of TIMEZONES) {
    test(`SECTION 13: Timezone [${tz}] automatically matches an available mentor without manual input`, async () => {
      const dateStr = DateTime.now().setZone(tz).plus({ days: 3 }).toFormat('yyyy-MM-dd');
      
      // Calculate available slots for this date and timezone
      const slotsData = getAvailableSlots({
        dateStr,
        parentTimezone: tz,
        subjectId: 'ai_ml'
      });

      assert.ok(slotsData.slots.length > 0, `Must have available slots for timezone ${tz}`);
      const testSlot = slotsData.slots[0];
      assert.ok(testSlot.candidateMentor, 'Slot must have a system candidate mentor');

      // Attempt booking without any mentorId provided
      const booking = await createBooking({
        parentName: `Parent ${tz.replace('/', '_')}`,
        parentEmail: `parent.${tz.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@example.com`,
        childName: 'Leo',
        subjectId: 'ai_ml',
        parentTimezone: tz,
        utcStartIso: testSlot.utcStart
      });

      assert.equal(booking.success, true);
      assert.ok(booking.mentorId, 'System must automatically assign a mentor ID');
      assert.ok(booking.mentorName, 'System must automatically assign a mentor Name');

      // Assigned mentor must be qualified for ai_ml
      const assigned = MENTORS.find(m => m.id === booking.mentorId);
      assert.ok(assigned.supportedSubjects.includes('ai_ml'), 'Assigned mentor must support ai_ml');
    });
  }

  // SECTION 14: TEST DIFFERENT COURSES
  const COURSES = [
    { id: 'ai_ml', title: 'AI & Machine Learning' },
    { id: 'web_development', title: 'Web Development' },
    { id: 'game_development', title: 'Game Development' },
    { id: 'robotics', title: 'Robotics & Hardware' }
  ];

  for (const course of COURSES) {
    test(`SECTION 14: Course [${course.title}] automatically matches compatible mentors`, async () => {
      const parentTz = 'America/New_York';
      const dateStr = DateTime.now().setZone(parentTz).plus({ days: 5 }).toFormat('yyyy-MM-dd');

      const slotsData = getAvailableSlots({
        dateStr,
        parentTimezone: parentTz,
        subjectId: course.id
      });

      assert.ok(slotsData.slots.length > 0, `Must have slots for course ${course.id}`);
      const testSlot = slotsData.slots[0];

      const booking = await createBooking({
        parentName: `Parent ${course.id}`,
        parentEmail: `parent.${course.id}@testdomain.com`,
        childName: 'Maya',
        subjectId: course.id,
        parentTimezone: parentTz,
        utcStartIso: testSlot.utcStart
      });

      assert.equal(booking.success, true);
      const assigned = MENTORS.find(m => m.id === booking.mentorId);
      assert.ok(
        assigned.supportedSubjects.includes(course.id),
        `Assigned mentor ${assigned.name} must support course ${course.id}`
      );
    });
  }

  // SECTION 15: TEST DIFFERENT TIMES (10:00 AM, 12:00 PM, 4:00 PM, and Outside Hours)
  test('SECTION 15: Different times automatically assign mentor, and off-hours reject cleanly', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 6 }).toFormat('yyyy-MM-dd');

    // Slot 1: 10:00 AM EDT -> 7:30 PM IST (within 10-20 IST)
    const slot10amUtc = DateTime.fromISO(`${dateStr}T10:00:00`, { zone: parentTz }).toUTC().toISO();
    const booking1 = await createBooking({
      parentName: 'Parent 10am',
      parentEmail: 'parent.10am@example.com',
      childName: 'Lucas',
      subjectId: 'coding_programming',
      parentTimezone: parentTz,
      utcStartIso: slot10amUtc
    });
    assert.equal(booking1.success, true);
    assert.ok(booking1.mentorId);

    // Slot 2: 7:00 AM EDT -> 4:30 PM IST (within 10-20 IST)
    const slot7amUtc = DateTime.fromISO(`${dateStr}T07:00:00`, { zone: parentTz }).toUTC().toISO();
    const booking2 = await createBooking({
      parentName: 'Parent 7am',
      parentEmail: 'parent.7am@example.com',
      childName: 'Emma',
      subjectId: 'coding_programming',
      parentTimezone: parentTz,
      utcStartIso: slot7amUtc
    });
    assert.equal(booking2.success, true);
    assert.ok(booking2.mentorId);

    // Slot 3: Outside mentor shifts (e.g. 11:00 PM EDT -> 8:30 AM IST, before 10:00 AM IST)
    const offHoursUtc = DateTime.fromISO(`${dateStr}T23:00:00`, { zone: parentTz }).toUTC().toISO();
    await assert.rejects(
      async () => {
        await createBooking({
          parentName: 'Parent OffHours',
          parentEmail: 'parent.offhours@example.com',
          childName: 'Noah',
          subjectId: 'coding_programming',
          parentTimezone: parentTz,
          utcStartIso: offHoursUtc
        });
      },
      (err) => {
        assert.ok(err.status === 409 || err.code === 'NO_MENTOR_AVAILABLE' || err.code === 'NO_MENTORS_AVAILABLE');
        return true;
      }
    );
  });

  // SECTION 16: TEST DAILY LIMIT (2/2 Exclusion & Automatic Fallback)
  test('SECTION 16: When a mentor reaches 2/2 daily limit, backend excludes them and reassigns', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 7 }).toFormat('yyyy-MM-dd');
    const slot1Utc = DateTime.fromISO(`${dateStr}T06:00:00`, { zone: parentTz }).toUTC().toISO();
    const slot2Utc = DateTime.fromISO(`${dateStr}T06:30:00`, { zone: parentTz }).toUTC().toISO();
    const slot3Utc = DateTime.fromISO(`${dateStr}T07:00:00`, { zone: parentTz }).toUTC().toISO();

    // Book slot 1
    const b1 = await createBooking({
      parentName: 'Parent Cap 1',
      parentEmail: 'parent.cap1@example.com',
      childName: 'Child 1',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: slot1Utc
    });
    const firstMentorId = b1.mentorId;

    // Book slot 2 with firstMentorId forced to have a second booking (to reach 2/2)
    const db = getDb();
    const mentorDate = DateTime.fromISO(slot2Utc).setZone('Asia/Kolkata').toFormat('yyyy-MM-dd');
    db.prepare(`
      INSERT INTO bookings (
        id, parent_id, parent_name, parent_email, child_name, subject_id, subject_title,
        mentor_id, mentor_name, mentor_timezone, mentor_local_date, mentor_local_time,
        slot_start_utc, slot_end_utc, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', datetime('now'))
    `).run(
      'bk_cap_fill', 'p_test', 'Parent Filler', 'filler@example.com', 'Filler',
      'ai_ml', 'AI & Machine Learning',
      firstMentorId, b1.mentorName, 'Asia/Kolkata', mentorDate, '4:00 PM',
      slot2Utc, DateTime.fromISO(slot2Utc).plus({ minutes: 30 }).toISO()
    );

    // Verify firstMentorId now has 2 bookings on this date
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM bookings WHERE mentor_id = ? AND mentor_local_date = ? AND status = 'CONFIRMED'
    `).get(firstMentorId, mentorDate).count;
    assert.equal(count, 2, 'First mentor must have reached 2/2 sessions');

    // Now book slot 3 for ai_ml: backend MUST automatically exclude firstMentorId and assign an alternative
    const b3 = await createBooking({
      parentName: 'Parent Cap 3',
      parentEmail: 'parent.cap3@example.com',
      childName: 'Child 3',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: slot3Utc
    });

    assert.equal(b3.success, true);
    assert.notEqual(b3.mentorId, firstMentorId, 'Backend must NOT assign the mentor who reached 2/2 limit');
    assert.ok(b3.mentorId, 'Backend must assign another eligible mentor');
  });

  // SECTION 17: TEST SECURITY (Client attempts to forge mentorId)
  test('SECTION 17: Backend ignores arbitrary client mentorId and strictly assigns authoritative mentor', async () => {
    const parentTz = 'Europe/London';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 8 }).toFormat('yyyy-MM-dd');
    // 12:00 PM BST -> 4:30 PM IST
    const slotUtc = DateTime.fromISO(`${dateStr}T12:00:00`, { zone: parentTz }).toUTC().toISO();

    // Attacker sends mentorId = 'mentor_03' or an unqualified mentor
    const booking = await createBooking({
      parentName: 'Security Tester',
      parentEmail: 'security@example.com',
      childName: 'Hacker',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: slotUtc,
      mentorId: 'mentor_99_bogus' // Should be completely ignored!
    });

    assert.equal(booking.success, true);
    assert.notEqual(booking.mentorId, 'mentor_99_bogus', 'Backend must ignore bogus mentorId');
    assert.ok(booking.mentorId.startsWith('mentor_'), 'Backend must assign valid mentor');
    
    // Check that the assigned mentor supports ai_ml
    const assigned = MENTORS.find(m => m.id === booking.mentorId);
    assert.ok(assigned.supportedSubjects.includes('ai_ml'));
  });
});
