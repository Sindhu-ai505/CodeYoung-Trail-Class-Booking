import { DateTime } from 'luxon';
import { getDb } from '../db/index.js';
import { MENTORS } from '../data/mentors.js';
import { isWithinMentorWorkingHours, mentorLocalDate } from '../utils/time.js';

/**
 * Finds an available mentor for a requested UTC time interval.
 * Filters mentors by:
 *  1. Operating working hours in mentor's timezone
 *  2. Maximum 2 confirmed bookings on their LOCAL calendar date
 *  3. No time overlap with any existing confirmed booking
 * 
 * If all mentors are unavailable, returns null cleanly (does NOT throw).
 *
 * @param {string} slotStartUTC - ISO 8601 UTC start string
 * @param {string} slotEndUTC - ISO 8601 UTC end string
 * @param {object|import('better-sqlite3').Database} [optionsOrDb={}] - Options or database instance
 * @returns {object|null} Assigned mentor record or null
 */
export function findAvailableMentor(slotStartUTC, slotEndUTC, optionsOrDb = {}) {
  // Resolve DB instance: supports passing options object { db: ... } or db instance directly
  const activeDb = (optionsOrDb && typeof optionsOrDb.prepare === 'function')
    ? optionsOrDb
    : (optionsOrDb?.db || getDb());

  const subjectId = optionsOrDb?.subjectId || null;

  // Retrieve mentors from database or fallback to seeded list
  let mentors = [];
  try {
    mentors = activeDb.prepare(`SELECT * FROM mentors`).all();
  } catch (err) {
    // If table doesn't exist yet, fallback
    mentors = [];
  }

  if (!mentors || mentors.length === 0) {
    mentors = MENTORS.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role || 'Trial Class Mentor',
      specialization: m.specialization || 'Coding & STEM',
      timezone: m.timezone || 'Asia/Kolkata',
      working_hours_start: m.workingHours?.start ?? 10,
      working_hours_end: m.workingHours?.end ?? 20,
      max_daily_classes: m.maxDailyClasses ?? 2,
      supported_subjects: JSON.stringify(m.supportedSubjects || [])
    }));
  }

  const eligibleCandidates = [];

  for (const mentor of mentors) {
    const mentorTz = mentor.timezone || 'Asia/Kolkata';

    // 1. Working hours check in mentor's timezone
    const workingHours = {
      start: mentor.working_hours_start ?? 10,
      end: mentor.working_hours_end ?? 20
    };
    if (!isWithinMentorWorkingHours(slotStartUTC, slotEndUTC, workingHours, mentorTz)) {
      continue;
    }

    // 2. Capacity check on mentor's LOCAL calendar date
    const targetMentorDate = mentorLocalDate(slotStartUTC, mentorTz);
    const dailyCountRow = activeDb.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE mentor_id = ? 
        AND mentor_local_date = ? 
        AND status = 'CONFIRMED'
    `).get(mentor.id, targetMentorDate);

    const dailyCount = dailyCountRow ? dailyCountRow.count : 0;
    const maxDaily = mentor.max_daily_classes ?? 2;
    if (dailyCount >= maxDaily) {
      continue;
    }

    // 3. Overlap check with existing confirmed bookings
    // Two intervals [A_start, A_end] and [B_start, B_end] overlap if A_start < B_end AND A_end > B_start
    const overlapRow = activeDb.prepare(`
      SELECT id FROM bookings
      WHERE mentor_id = ?
        AND status = 'CONFIRMED'
        AND (
          (slot_start_utc < ? AND slot_end_utc > ?)
          OR
          (start_time_utc IS NOT NULL AND start_time_utc < ? AND end_time_utc > ?)
        )
      LIMIT 1
    `).get(mentor.id, slotEndUTC, slotStartUTC, slotEndUTC, slotStartUTC);

    if (overlapRow) {
      continue;
    }

    // 4. Optional Subject compatibility check
    if (subjectId) {
      let supported = [];
      try {
        supported = JSON.parse(mentor.supported_subjects || '[]');
      } catch (e) {
        supported = [];
      }
      if (supported.length > 0 && !supported.includes(subjectId)) {
        continue;
      }
    }

    eligibleCandidates.push({
      mentor,
      dailyCount
    });
  }

  // If no mentors available, return null cleanly (do not throw)
  if (eligibleCandidates.length === 0) {
    return null;
  }

  // Load balancing strategy:
  // 1. Prioritize mentors with fewer bookings today on this local date
  const minDaily = Math.min(...eligibleCandidates.map(c => c.dailyCount));
  const leastBooked = eligibleCandidates.filter(c => c.dailyCount === minDaily);

  // 2. Deterministic stable tie-breaking by mentor ID
  leastBooked.sort((a, b) => a.mentor.id.localeCompare(b.mentor.id));

  // Time-slot round-robin dispersion so different hours rotate across available mentors
  const startMillis = DateTime.fromISO(slotStartUTC, { zone: 'utc' }).toMillis();
  const slotBucket = Math.floor(startMillis / (30 * 60 * 1000));
  const chosenIndex = Math.abs(slotBucket) % leastBooked.length;

  return leastBooked[chosenIndex].mentor;
}

export default findAvailableMentor;
