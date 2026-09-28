import { test, describe, beforeAll as before, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, queryOne } from '../src/db.js';
import { createBooking, getBookingById } from '../src/services/bookingService.js';
import { getAvailableSlots, MENTOR_TIMEZONE } from '../src/services/availabilityService.js';
import { MENTORS } from '../src/data/mentors.js';

describe('Trial Class Booking System Tests', () => {
  before(async () => {
    // Initialize in-memory database for testing
    await initDb(':memory:');
  });

  beforeEach(() => {
    resetDb();
  });

  test('1. Subject Compatibility: assigns mentor qualified for the subject', async () => {
    const parentTz = 'America/New_York';
    // Midday New York corresponds to evening IST
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 2 }).toFormat('yyyy-MM-dd');
    const testUtcStart = DateTime.fromISO(`${dateStr}T10:00:00`, { zone: parentTz }).toUTC().toISO();

    const result = await createBooking({
      parentName: 'Sarah Jenkins',
      parentEmail: 'sarah.jenkins@example.com',
      childName: 'Leo',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: testUtcStart
    });

    assert.equal(result.success, true);
    assert.equal(result.subject.id, 'ai_ml');
    
    // Mentor must actually support ai_ml
    const assignedMentor = MENTORS.find(m => m.id === result.mentorTime.mentorId);
    assert.ok(assignedMentor, 'Assigned mentor must exist');
    assert.ok(assignedMentor.supportedSubjects.includes('ai_ml'), 'Mentor must support ai_ml');
  });

  test('2. Timezone & Cross-Date Conversion: accurately evaluates mentor local calendar date', async () => {
    // 10:30 PM New York is 8:00 AM next day in IST!
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 2 }).toFormat('yyyy-MM-dd');
    const parentInstant = DateTime.fromISO(`${dateStr}T22:30:00`, { zone: parentTz });
    const utcStart = parentInstant.toUTC().toISO();

    const mentorInstant = parentInstant.setZone(MENTOR_TIMEZONE);
    const expectedNextDay = DateTime.fromISO(dateStr).plus({ days: 1 }).toFormat('yyyy-MM-dd');
    assert.equal(mentorInstant.toFormat('yyyy-MM-dd'), expectedNextDay, 'Must roll over to next calendar day in IST');

    // 8:00 AM IST is outside mentor operating hours (10:00 to 20:00 IST), so should fail with no mentor available
    await assert.rejects(
      async () => {
        await createBooking({
          parentName: 'Test Parent',
          parentEmail: 'test@example.com',
          childName: 'Emma',
          subjectId: 'coding_programming',
          parentTimezone: parentTz,
          utcStartIso: utcStart
        });
      },
      (err) => {
        assert.equal(err.code, 'NO_MENTOR_AVAILABLE');
        return true;
      }
    );
  });

  test('3. Mentor Assignment Strategy: assigns least booked mentor', async () => {
    const parentTz = 'Asia/Kolkata';
    const testDate = DateTime.now().setZone(parentTz).plus({ days: 3 }).toFormat('yyyy-MM-dd');

    // Slots at 11:00 AM and 12:00 PM IST
    const slot1Utc = DateTime.fromISO(`${testDate}T11:00:00`, { zone: MENTOR_TIMEZONE }).toUTC().toISO();
    const slot2Utc = DateTime.fromISO(`${testDate}T12:00:00`, { zone: MENTOR_TIMEZONE }).toUTC().toISO();

    // First booking
    const booking1 = await createBooking({
      parentName: 'Parent One',
      parentEmail: 'p1@example.com',
      childName: 'Child One',
      subjectId: 'robotics',
      parentTimezone: parentTz,
      utcStartIso: slot1Utc
    });

    const firstMentorId = booking1.mentorTime.mentorId;

    // Second booking for robotics at a different time on same date
    const booking2 = await createBooking({
      parentName: 'Parent Two',
      parentEmail: 'p2@example.com',
      childName: 'Child Two',
      subjectId: 'robotics',
      parentTimezone: parentTz,
      utcStartIso: slot2Utc
    });

    const secondMentorId = booking2.mentorTime.mentorId;

    // Because robotics has Vikram Patel (mentor_04) and Rahul Deshmukh (mentor_08),
    // the system should balance the load and assign the other mentor!
    assert.notEqual(firstMentorId, secondMentorId, 'Second booking should be assigned to the other available robotics mentor');
  });

  test('4. Mentor Daily Limit: maximum 2 demo classes per mentor per day enforced', async () => {
    const parentTz = 'Asia/Kolkata';
    const testDate = DateTime.now().setZone(parentTz).plus({ days: 4 }).toFormat('yyyy-MM-dd');

    // Robotics is supported by exactly two mentors: mentor_04 and mentor_08.
    // Each can take at most 2 classes. Total capacity for robotics on this date = 4 classes.
    const slots = [
      '10:30:00',
      '11:30:00',
      '14:00:00',
      '15:00:00'
    ];

    for (let i = 0; i < slots.length; i++) {
      const utcIso = DateTime.fromISO(`${testDate}T${slots[i]}`, { zone: MENTOR_TIMEZONE }).toUTC().toISO();
      const res = await createBooking({
        parentName: `Parent ${i + 1}`,
        parentEmail: `parent${i + 1}@example.com`,
        childName: `Kid ${i + 1}`,
        subjectId: 'robotics',
        parentTimezone: parentTz,
        utcStartIso: utcIso
      });
      assert.equal(res.success, true);
    }

    // Now all robotics mentors have 2 bookings on 2026-10-22.
    // Attempting a 5th booking on this date must be rejected with MENTOR_DAILY_LIMIT_REACHED!
    const extraSlotUtc = DateTime.fromISO(`${testDate}T15:30:00`, { zone: MENTOR_TIMEZONE }).toUTC().toISO();

    await assert.rejects(
      async () => {
        await createBooking({
          parentName: 'Parent Extra',
          parentEmail: 'extra@example.com',
          childName: 'Kid Extra',
          subjectId: 'robotics',
          parentTimezone: parentTz,
          utcStartIso: extraSlotUtc
        });
      },
      (err) => {
        assert.equal(err.code, 'MENTOR_DAILY_LIMIT_REACHED', 'Should indicate mentors reached daily limit');
        return true;
      }
    );
  });

  test('5. Duplicate / Overlapping Booking Protection: rejects conflicting slot', async () => {
    const parentTz = 'Asia/Kolkata';
    const testDate = DateTime.now().setZone(parentTz).plus({ days: 5 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${testDate}T11:00:00`, { zone: MENTOR_TIMEZONE }).toUTC().toISO();

    // First booking occupies the on-duty mentor for algorithms_math at 11:00 AM
    await createBooking({
      parentName: 'First Parent',
      parentEmail: 'first@example.com',
      childName: 'First Child',
      subjectId: 'algorithms_math',
      parentTimezone: parentTz,
      utcStartIso: slotUtc
    });

    // Attempting a second booking for the exact same slot must be rejected with SLOT_UNAVAILABLE
    await assert.rejects(
      async () => {
        await createBooking({
          parentName: 'Conflict Parent',
          parentEmail: 'conflict@example.com',
          childName: 'Conflict Child',
          subjectId: 'algorithms_math',
          parentTimezone: parentTz,
          utcStartIso: slotUtc
        });
      },
      (err) => {
        assert.equal(err.code, 'SLOT_UNAVAILABLE', `Expected SLOT_UNAVAILABLE, got ${err.code}`);
        return true;
      }
    );
  });

  test('6. No Phone Number Required: booking succeeds with only parent name, email and child name', async () => {
    const parentTz = 'Europe/London';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 2 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${dateStr}T10:00:00`, { zone: parentTz }).toUTC().toISO();

    const booking = await createBooking({
      parentName: 'David Miller',
      parentEmail: 'david.miller@example.co.uk',
      childName: 'Oliver',
      subjectId: 'web_development',
      parentTimezone: parentTz,
      utcStartIso: slotUtc
    });

    assert.equal(booking.parentName, 'David Miller');
    assert.equal(booking.parentEmail, 'david.miller@example.co.uk');
    assert.equal(booking.childName, 'Oliver');
    assert.ok(booking.bookingId.startsWith('bk_'));
    assert.ok(booking.dummyClassLink.includes(booking.bookingId));

    // Verify database persistence
    const saved = getBookingById(booking.bookingId);
    assert.ok(saved, 'Booking must be persisted in SQLite');
    assert.equal(saved.child_name, 'Oliver');
  });

  test('7. Daylight Saving Time (DST) Handling: handles offsets across time boundaries dynamically', () => {
    // Luxon parses IANA zones with actual historical and future DST transitions
    const nySummer = DateTime.fromISO('2027-07-15T12:00:00', { zone: 'America/New_York' });
    const nyWinter = DateTime.fromISO('2027-01-15T12:00:00', { zone: 'America/New_York' });

    // Summer is EDT: UTC-4 (-240 minutes)
    assert.equal(nySummer.offset, -240);

    // Winter is EST: UTC-5 (-300 minutes)
    assert.equal(nyWinter.offset, -300);

    // Dynamic 60 minute shift between summer and winter
    assert.equal(nySummer.offset - nyWinter.offset, 60, 'Should demonstrate a 1-hour DST offset change');

    // Slots generated reflect local time automatically for future summer date
    const summerSlots = getAvailableSlots({
      subjectId: 'coding_programming',
      dateStr: '2027-07-15',
      parentTimezone: 'America/New_York',
      skipWindowCheck: true
    });

    assert.ok(summerSlots.slots.length > 0, 'Summer slots should be generated successfully');
  });

  test('8. Mentor Daily Capacity Visibility: getAvailableSlots exposes real candidate & date capacity', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 3 }).toFormat('yyyy-MM-dd');

    const availability = getAvailableSlots({
      subjectId: 'ai_ml',
      dateStr,
      parentTimezone: parentTz
    });

    assert.ok(availability.slots.length > 0, 'Slots must be available');
    assert.ok(Array.isArray(availability.subjectMentorsCapacity), 'Must return subjectMentorsCapacity array');
    assert.ok(availability.subjectMentorsCapacity.length > 0, 'Must have subject mentors');

    // Each mentor in subjectMentorsCapacity has real capacity structure
    for (const m of availability.subjectMentorsCapacity) {
      assert.ok('dailyCount' in m);
      assert.equal(m.maxDailyClasses, 2);
      assert.ok('remainingClassesToday' in m);
      assert.ok('isDailyLimitReached' in m);
    }

    // Candidate mentor on slot also includes dailyCount and maxDailyClasses
    const firstSlot = availability.slots[0];
    assert.ok(firstSlot.candidateMentor);
    assert.ok('dailyCount' in firstSlot.candidateMentor);
    assert.equal(firstSlot.candidateMentor.maxDailyClasses, 2);
    assert.ok('remainingClassesToday' in firstSlot.candidateMentor);
    assert.ok('isDailyLimitReached' in firstSlot.candidateMentor);
  });

  test('9. Booking Record Mentor Daily Capacity: formatBookingRecord reflects real capacity data', async () => {
    const parentTz = 'America/New_York';
    const dateStr = DateTime.now().setZone(parentTz).plus({ days: 3 }).toFormat('yyyy-MM-dd');
    const slotUtc = DateTime.fromISO(`${dateStr}T08:00:00`, { zone: parentTz }).toUTC().toISO();

    const booking = await createBooking({
      parentName: 'Elena Rostova',
      parentEmail: 'elena@example.com',
      childName: 'Sasha',
      subjectId: 'ai_ml',
      parentTimezone: parentTz,
      utcStartIso: slotUtc
    });

    assert.ok(booking.mentorDailyCapacity, 'Booking must include mentorDailyCapacity');
    assert.equal(booking.mentorDailyCapacity.maxDailyClasses, 2);
    assert.equal(booking.mentorDailyCapacity.bookedCount, 1);
    assert.ok(
      booking.mentorDailyCapacity.label.includes('1 of 2 trial sessions scheduled for this date') ||
      booking.mentorDailyCapacity.label.includes('1 of 2 trial sessions scheduled today')
    );
  });
});
