import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { createIsolatedDb } from '../src/db/index.js';
import { findAvailableMentor } from '../src/services/mentorAssignment.js';
import {
  mentorLocalDate,
  isWithinMentorWorkingHours,
  resolveLocalTimeToUTC,
  validateOrNormalizeLocalTime,
  generateCandidateSlotsUTC
} from '../src/utils/time.js';

describe('Timezone, DST & Mentor Assignment Unit Tests', () => {
  let db;

  beforeEach(() => {
    // Each test sets up its own isolated in-memory SQLite database
    db = createIsolatedDb();
  });

  // 1. US spring-forward edge case
  it('1. US spring-forward: nonexistent local time normalizes sanely via Luxon without wrong UTC instant', () => {
    const parentTz = 'America/New_York';
    const springForwardDate = '2026-03-08';
    const nonexistentLocalTime = '02:30'; // 2:00 AM jumps to 3:00 AM on this date in NY

    // Verify detection and sane normalization
    const validation = validateOrNormalizeLocalTime(springForwardDate, nonexistentLocalTime, parentTz);
    expect(validation.valid).toBe(true);
    expect(validation.wasNormalizedInGap).toBe(true);
    expect(validation.normalizedHour).toBe(3); // Shifted forward into valid EDT
    expect(validation.offset).toBe(-240); // EDT is UTC-4

    // Resolving nonexistent local time produces a valid, verified UTC instant (07:30 UTC)
    const resolvedUtc = resolveLocalTimeToUTC(`${springForwardDate}T${nonexistentLocalTime}:00`, parentTz);
    expect(resolvedUtc).toBe('2026-03-08T07:30:00.000Z');
    const parsedBack = DateTime.fromISO(resolvedUtc, { zone: 'utc' });
    expect(parsedBack.isValid).toBe(true);

    // Generating candidate slots for that day handles the 23-hour transition cleanly
    const candidateSlots = generateCandidateSlotsUTC(springForwardDate, parentTz);
    expect(candidateSlots.length).toBeGreaterThan(0);
    for (const slot of candidateSlots) {
      expect(DateTime.fromISO(slot.slotStartUTC, { zone: 'utc' }).isValid).toBe(true);
      expect(DateTime.fromISO(slot.slotEndUTC, { zone: 'utc' }).isValid).toBe(true);
    }
  });

  // 2. US fall-back edge case
  it('2. US fall-back: ambiguous repeated hour resolves consistently and prevents double counting', () => {
    const parentTz = 'America/New_York';
    const fallBackDate = '2026-11-01';
    const repeatedLocalTime = `${fallBackDate}T01:30:00`;

    // Resolving ambiguous 1:30 AM repeatedly yields a deterministic, single UTC instant
    const utc1 = resolveLocalTimeToUTC(repeatedLocalTime, parentTz);
    const utc2 = resolveLocalTimeToUTC(repeatedLocalTime, parentTz);
    expect(utc1).toBe(utc2);
    expect(utc1).toBe('2026-11-01T05:30:00.000Z');

    // 05:30 UTC corresponds to 11:00 AM IST in Asia/Kolkata (within mentor working hours)
    const targetMentorDate = mentorLocalDate(utc1, 'Asia/Kolkata');
    expect(targetMentorDate).toBe('2026-11-01');

    // Book one slot at this resolved UTC instant
    const nowUtc = DateTime.utc().toISO();
    db.prepare(`
      INSERT INTO bookings (
        id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc,
        mentor_local_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'bk_fallback_1',
      'mentor_01',
      utc1,
      '2026-11-01T06:00:00.000Z',
      utc1,
      '2026-11-01T06:00:00.000Z',
      targetMentorDate,
      'CONFIRMED',
      nowUtc
    );

    // Query booking count for mentor_01 on that local date: must be exactly 1 (not double counted)
    const countRow = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE mentor_id = 'mentor_01' AND mentor_local_date = ? AND status = 'CONFIRMED'
    `).get(targetMentorDate);

    expect(countRow.count).toBe(1);
  });

  // 3. Mentor capacity cap
  it('3. Mentor capacity cap: 2 bookings succeed; 3rd on same local date excludes mentor and assigns another', () => {
    const localDate = '2026-10-15';
    const nowUtc = DateTime.utc().toISO();

    // Book 2 slots for mentor_01 on their local date (10:30-11:00 IST and 11:30-12:00 IST)
    const slot1Start = '2026-10-15T05:00:00.000Z';
    const slot1End = '2026-10-15T05:30:00.000Z';
    const slot2Start = '2026-10-15T06:00:00.000Z';
    const slot2End = '2026-10-15T06:30:00.000Z';

    db.prepare(`
      INSERT INTO bookings (id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc, mentor_local_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('bk_cap_1', 'mentor_01', slot1Start, slot1End, slot1Start, slot1End, localDate, 'CONFIRMED', nowUtc);

    db.prepare(`
      INSERT INTO bookings (id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc, mentor_local_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('bk_cap_2', 'mentor_01', slot2Start, slot2End, slot2Start, slot2End, localDate, 'CONFIRMED', nowUtc);

    // Verify mentor_01 has reached 2/2 limit
    const mentor1Count = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE mentor_id = 'mentor_01' AND mentor_local_date = ? AND status = 'CONFIRMED'
    `).get(localDate).count;
    expect(mentor1Count).toBe(2);

    // Request 3rd slot on the same mentor-local date (12:30-13:00 IST / 07:00-07:30 UTC)
    const slot3Start = '2026-10-15T07:00:00.000Z';
    const slot3End = '2026-10-15T07:30:00.000Z';

    const assigned = findAvailableMentor(slot3Start, slot3End, { db });
    expect(assigned).not.toBeNull();
    // mentor_01 must be excluded; another eligible mentor must be assigned
    expect(assigned.id).not.toBe('mentor_01');
    expect(typeof assigned.id).toBe('string');
  });

  // 4. Mentor-local-date boundary
  it('4. Mentor-local-date boundary: daily cap is calculated against MENTOR local date, not parent or UTC', () => {
    // 10:30 PM on Oct 15 in Los Angeles (America/Los_Angeles, UTC-7)
    // is 05:30 AM on Oct 16 in UTC
    // and 11:00 AM on Oct 16 in Asia/Kolkata (IST, UTC+5:30)
    const parentDate = '2026-10-15';
    const mentorDate = '2026-10-16';
    const slotStartUTC = '2026-10-16T05:30:00.000Z';
    const slotEndUTC = '2026-10-16T06:00:00.000Z';

    expect(mentorLocalDate(slotStartUTC, 'Asia/Kolkata')).toBe(mentorDate);
    expect(DateTime.fromISO(slotStartUTC, { zone: 'America/Los_Angeles' }).toFormat('yyyy-MM-dd')).toBe(parentDate);

    // Give mentor_01 0 bookings on Oct 15, but 2 bookings on Oct 16 (mentor's date)
    const nowUtc = DateTime.utc().toISO();
    db.prepare(`
      INSERT INTO bookings (id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc, mentor_local_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('bk_bnd_1', 'mentor_01', '2026-10-16T06:30:00.000Z', '2026-10-16T07:00:00.000Z', '2026-10-16T06:30:00.000Z', '2026-10-16T07:00:00.000Z', mentorDate, 'CONFIRMED', nowUtc);

    db.prepare(`
      INSERT INTO bookings (id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc, mentor_local_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('bk_bnd_2', 'mentor_01', '2026-10-16T07:30:00.000Z', '2026-10-16T08:00:00.000Z', '2026-10-16T07:30:00.000Z', '2026-10-16T08:00:00.000Z', mentorDate, 'CONFIRMED', nowUtc);

    // Set other mentors to 0 capacity so only mentor_01 would be considered if date check was wrong
    db.prepare(`UPDATE mentors SET max_daily_classes = 0 WHERE id != 'mentor_01'`).run();

    // Capacity must evaluate against mentorDate (Oct 16), seeing 2 bookings and excluding mentor_01
    const result = findAvailableMentor(slotStartUTC, slotEndUTC, { db });
    expect(result).toBeNull();
  });

  // 5. Overlap prevention
  it('5. Overlap prevention: cannot assign overlapping 10:30-11:30, but CAN assign adjacent 11:00-12:00', () => {
    const existingStart = '2026-10-15T10:00:00.000Z';
    const existingEnd = '2026-10-15T11:00:00.000Z';
    const mentorDate = '2026-10-15';
    const nowUtc = DateTime.utc().toISO();

    // Disable all other mentors so mentor_02 is the only potential candidate
    db.prepare(`UPDATE mentors SET max_daily_classes = 0 WHERE id != 'mentor_02'`).run();

    // Book mentor_02 from 10:00 to 11:00 UTC (15:30 to 16:30 IST, within working hours 13-20)
    db.prepare(`
      INSERT INTO bookings (id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc, mentor_local_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('bk_ov_1', 'mentor_02', existingStart, existingEnd, existingStart, existingEnd, mentorDate, 'CONFIRMED', nowUtc);

    // Overlapping attempt: 10:30 to 11:30 UTC -> MUST BE REJECTED (returns null)
    const overlapSlotStart = '2026-10-15T10:30:00.000Z';
    const overlapSlotEnd = '2026-10-15T11:30:00.000Z';
    const overlapResult = findAvailableMentor(overlapSlotStart, overlapSlotEnd, { db });
    expect(overlapResult).toBeNull();

    // Adjacent non-overlapping attempt: 11:00 to 12:00 UTC -> MUST SUCCEED (returns mentor_02)
    const adjacentSlotStart = '2026-10-15T11:00:00.000Z';
    const adjacentSlotEnd = '2026-10-15T12:00:00.000Z';
    const adjacentResult = findAvailableMentor(adjacentSlotStart, adjacentSlotEnd, { db });
    expect(adjacentResult).not.toBeNull();
    expect(adjacentResult.id).toBe('mentor_02');
  });

  // 6. No mentor available
  it('6. No-mentor-available: returns null cleanly (not throw) when all mentors are exhausted', () => {
    // 10:00 UTC (15:30 IST) is a time where all 10 mentors are within working hours
    const slotStart = '2026-10-15T10:00:00.000Z';
    const slotEnd = '2026-10-15T10:30:00.000Z';
    const localDate = '2026-10-15';
    const nowUtc = DateTime.utc().toISO();

    // Exhaust all 10 mentors by creating an overlapping booking for each of them
    const allMentors = db.prepare(`SELECT id FROM mentors`).all();
    expect(allMentors.length).toBe(10);

    for (const m of allMentors) {
      db.prepare(`
        INSERT INTO bookings (id, mentor_id, slot_start_utc, slot_end_utc, start_time_utc, end_time_utc, mentor_local_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`bk_ex_${m.id}`, m.id, slotStart, slotEnd, slotStart, slotEnd, localDate, 'CONFIRMED', nowUtc);
    }

    // Call findAvailableMentor: must return null cleanly without throwing any error
    expect(() => {
      const result = findAvailableMentor(slotStart, slotEnd, { db });
      expect(result).toBeNull();
    }).not.toThrow();
  });
});
