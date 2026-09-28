import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { getAvailableSlots } from '../src/services/availabilityService.js';
import { createBooking } from '../src/services/bookingService.js';
import { initDb, resetDb, run, queryOne } from '../src/db.js';
import { MENTORS } from '../src/data/mentors.js';
import { SUBJECTS } from '../src/data/subjects.js';

describe('Date & Time Slot Selection Regression & State Verification', () => {
  beforeAll(async () => {
    await initDb(':memory:');
  });

  beforeEach(() => {
    resetDb();
  });

  it('1. Today in Asia/Kolkata returns valid slots and non-blank structure', () => {
    const today = DateTime.now().setZone('Asia/Kolkata').toFormat('yyyy-MM-dd');
    const result = getAvailableSlots({
      subjectId: 'coding_programming',
      date: today,
      parentTimezone: 'Asia/Kolkata'
    });

    expect(result).toBeDefined();
    expect(result.date).toBe(today);
    expect(result.parentTimezone).toBe('Asia/Kolkata');
    expect(result.slots).toBeInstanceOf(Array);
    expect(result.subjectMentorsCapacity).toBeInstanceOf(Array);
    expect(result.subjectMentorsCapacity.length).toBeGreaterThan(0);
    expect(result.dailyCapacity).toBe(20);
    expect(result.capacityRemainingOnDate).toBeDefined();
  });

  it('2. Tomorrow in Asia/Kolkata returns full slot options and mentor details', () => {
    const tomorrow = DateTime.now().setZone('Asia/Kolkata').plus({ days: 1 }).toFormat('yyyy-MM-dd');
    const result = getAvailableSlots({
      subjectId: 'coding_programming',
      date: tomorrow,
      parentTimezone: 'Asia/Kolkata'
    });

    expect(result.slots.length).toBeGreaterThan(0);
    const firstSlot = result.slots[0];
    expect(firstSlot.parentLocalTime).toBeDefined();
    expect(firstSlot.mentorLocalTime).toBeDefined();
    expect(firstSlot.candidateMentor).toBeDefined();
    expect(firstSlot.candidateMentor.name).toBeDefined();
    expect(firstSlot.candidateMentor.dailyCount).toBeDefined();
  });

  it('3. Date 7 days from today returns available slots', () => {
    const day7 = DateTime.now().setZone('Asia/Kolkata').plus({ days: 7 }).toFormat('yyyy-MM-dd');
    const result = getAvailableSlots({
      subjectId: 'coding_programming',
      date: day7,
      parentTimezone: 'Asia/Kolkata'
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.date).toBe(day7);
    expect(result.dateBookingsCount).toBe(0);
    expect(result.capacityRemainingOnDate).toBe(20);
  });

  it('4. Date 14 days from today (inclusive boundary) returns slots', () => {
    const day14 = DateTime.now().setZone('Asia/Kolkata').plus({ days: 14 }).toFormat('yyyy-MM-dd');
    const result = getAvailableSlots({
      subjectId: 'coding_programming',
      date: day14,
      parentTimezone: 'Asia/Kolkata'
    });

    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.date).toBe(day14);
  });

  it('5. Date switching does not leak stale date or capacity metrics', () => {
    const day1 = DateTime.now().setZone('Asia/Kolkata').plus({ days: 1 }).toFormat('yyyy-MM-dd');
    const day2 = DateTime.now().setZone('Asia/Kolkata').plus({ days: 2 }).toFormat('yyyy-MM-dd');

    // First request day 1
    const res1 = getAvailableSlots({ subjectId: 'coding_programming', date: day1, parentTimezone: 'Asia/Kolkata' });
    expect(res1.date).toBe(day1);

    // Then switch to day 2
    const res2 = getAvailableSlots({ subjectId: 'coding_programming', date: day2, parentTimezone: 'Asia/Kolkata' });
    expect(res2.date).toBe(day2);

    // Switch back to day 1
    const res1Again = getAvailableSlots({ subjectId: 'coding_programming', date: day1, parentTimezone: 'Asia/Kolkata' });
    expect(res1Again.date).toBe(day1);
    expect(res1Again.slots.length).toBe(res1.slots.length);
  });

  it('6. Parent timezone America/New_York with mentor timezone Asia/Kolkata preserves DST & dual timezone display', () => {
    const targetDate = DateTime.now().setZone('America/New_York').plus({ days: 2 }).toFormat('yyyy-MM-dd');
    const result = getAvailableSlots({
      subjectId: 'coding_programming',
      date: targetDate,
      parentTimezone: 'America/New_York'
    });

    expect(result.slots.length).toBeGreaterThan(0);
    result.slots.forEach(slot => {
      // Parent local time is in America/New_York
      expect(slot.parentLocalTime).toMatch(/AM|PM/);
      // Mentor local time is in Asia/Kolkata
      expect(slot.mentorLocalTime).toMatch(/AM|PM/);
      expect(slot.mentorTimezone).toBe('Asia/Kolkata');
      // UTC start must parse cleanly
      const utcDt = DateTime.fromISO(slot.utcStart, { zone: 'utc' });
      expect(utcDt.isValid).toBe(true);
      // The parent slot instant must match utcStart
      expect(utcDt.setZone('America/New_York').toFormat('h:mm a')).toBe(slot.parentLocalTime);
    });
  });

  it('7. Full mentor capacity on date returns proper no availability reason and zero slots', () => {
    const targetDate = DateTime.now().setZone('Asia/Kolkata').plus({ days: 3 }).toFormat('yyyy-MM-dd');
    const subjectId = 'ai_ml';
    const mentors = MENTORS.filter(m => m.supportedSubjects.includes(subjectId));

    // Fill all mentors for this subject on this date to max limit (2 bookings each)
    mentors.forEach(m => {
      for (let i = 0; i < 2; i++) {
        const dummyUtc = DateTime.fromISO(targetDate, { zone: 'Asia/Kolkata' })
          .set({ hour: 10 + i, minute: 0 })
          .toUTC().toISO();
        const dummyEndUtc = DateTime.fromISO(dummyUtc).plus({ minutes: 30 }).toISO();
        run(
          `INSERT INTO bookings (id, parent_name, parent_email, child_name, subject_id, mentor_id, start_time_utc, end_time_utc, slot_start_utc, slot_end_utc, parent_timezone, mentor_local_date, mentor_local_time, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', datetime('now'))`,
          [`bk_fill_${m.id}_${i}`, 'Test Parent', 'parent@test.com', 'Child', subjectId, m.id, dummyUtc, dummyEndUtc, dummyUtc, dummyEndUtc, 'Asia/Kolkata', targetDate, '10:00 AM']
        );
      }
    });

    const result = getAvailableSlots({
      subjectId,
      date: targetDate,
      parentTimezone: 'Asia/Kolkata'
    });

    expect(result.slots.length).toBe(0);
    expect(result.allSubjectMentorsFull).toBe(true);
    expect(result.noAvailabilityReason).toBe('MENTOR_DAILY_LIMIT_REACHED');
    expect(result.noAvailabilityMessage).toMatch(/daily limit of 2 trial sessions/i);
    expect(result.subjectMentorsCapacity.every(m => m.isDailyLimitReached)).toBe(true);
  });
});
