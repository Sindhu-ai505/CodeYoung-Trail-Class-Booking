import { DateTime } from 'luxon';
import { MENTORS } from '../data/mentors.js';
import { SUBJECTS } from '../data/subjects.js';
import { queryAll, queryOne } from '../db.js';

export const MENTOR_TIMEZONE = 'Asia/Kolkata';
export const CLASS_DURATION_MINUTES = 30;
export const MAX_DAILY_CLASSES_PER_MENTOR = 2;
export const TOTAL_SYSTEM_DAILY_CAPACITY = 20;

/**
 * Validates an IANA timezone string
 */
export function isValidTimezone(zoneName) {
  if (!zoneName || typeof zoneName !== 'string') return false;
  const dt = DateTime.now().setZone(zoneName);
  return dt.isValid;
}

/**
 * Get mentor's active booking count for their local calendar date
 */
export function getMentorBookingsForDate(mentorId, mentorLocalDateStr) {
  const row = queryOne(
    `SELECT COUNT(*) as count FROM bookings 
     WHERE mentor_id = ? AND mentor_local_date = ? AND status = 'CONFIRMED'`,
    [mentorId, mentorLocalDateStr]
  );
  return row ? row.count : 0;
}

/**
 * Get total system bookings across all mentors for a given calendar date (in IST)
 */
export function getSystemBookingsForDate(mentorLocalDateStr) {
  const row = queryOne(
    `SELECT COUNT(*) as count FROM bookings 
     WHERE mentor_local_date = ? AND status = 'CONFIRMED'`,
    [mentorLocalDateStr]
  );
  return row ? row.count : 0;
}

/**
 * Checks if a mentor is busy during a 30-minute UTC interval
 */
export function isMentorBusyAtUtc(mentorId, startUtcIso, endUtcIso) {
  const row = queryOne(
    `SELECT id FROM bookings 
     WHERE mentor_id = ? 
       AND status = 'CONFIRMED'
       AND (
         (start_time_utc < ? AND end_time_utc > ?)
       )`,
    [mentorId, endUtcIso, startUtcIso]
  );
  return !!row;
}

/**
 * Generate available slots for a given date in parent's timezone and selected subject
 */
export function getAvailableSlots({ subjectId, dateStr, parentTimezone }) {
  if (!isValidTimezone(parentTimezone)) {
    throw { status: 400, code: 'INVALID_TIMEZONE', message: `Invalid parent timezone: ${parentTimezone}` };
  }

  // Parse start of parent's day
  const parentDay = DateTime.fromISO(dateStr, { zone: parentTimezone });
  if (!parentDay.isValid) {
    throw { status: 400, code: 'INVALID_DATE', message: `Invalid date format: ${dateStr}. Use YYYY-MM-DD.` };
  }

  // Filter mentors supporting the subject
  const subjectMentors = MENTORS.filter(m => m.supportedSubjects.includes(subjectId));
  if (subjectMentors.length === 0) {
    return {
      date: dateStr,
      parentTimezone,
      subjectId,
      slots: [],
      reason: 'No mentors found for this subject'
    };
  }

  const slots = [];
  // Parent booking window: from 07:00 AM to 22:30 PM in parent's local timezone
  // Generate every 30-minute interval
  const startLocal = parentDay.set({ hour: 7, minute: 0, second: 0, millisecond: 0 });
  const endLocal = parentDay.set({ hour: 22, minute: 30, second: 0, millisecond: 0 });

  const nowUtc = DateTime.utc();

  let current = startLocal;
  while (current <= endLocal) {
    const parentSlotStart = current;
    const parentSlotEnd = current.plus({ minutes: CLASS_DURATION_MINUTES });
    const slotUtcStart = parentSlotStart.toUTC();
    const slotUtcEnd = parentSlotEnd.toUTC();

    // Skip past slots (allow 10-minute buffer)
    if (slotUtcStart < nowUtc.minus({ minutes: 10 })) {
      current = current.plus({ minutes: CLASS_DURATION_MINUTES });
      continue;
    }

    // Convert instant to mentor timezone (Asia/Kolkata)
    const mentorInstant = slotUtcStart.setZone(MENTOR_TIMEZONE);
    const mentorEndInstant = slotUtcEnd.setZone(MENTOR_TIMEZONE);
    const mentorLocalDate = mentorInstant.toFormat('yyyy-MM-dd');
    const mentorHour = mentorInstant.hour + mentorInstant.minute / 60;

    // Check system capacity on mentor's date
    const systemBookings = getSystemBookingsForDate(mentorLocalDate);
    const isSystemFull = systemBookings >= TOTAL_SYSTEM_DAILY_CAPACITY;

    // Filter available mentors for this specific slot
    const eligibleMentors = [];
    let mentorsAtDailyLimit = 0;

    if (!isSystemFull) {
      for (const mentor of subjectMentors) {
        // 1. Operating hours check (10:00 to 20:00 IST)
        if (mentorHour < mentor.workingHours.start || mentorHour + (CLASS_DURATION_MINUTES / 60) > mentor.workingHours.end) {
          continue;
        }

        // 2. Daily limit check (2 classes per mentor on their local calendar date)
        const dailyCount = getMentorBookingsForDate(mentor.id, mentorLocalDate);
        if (dailyCount >= mentor.maxDailyClasses) {
          mentorsAtDailyLimit++;
          continue;
        }

        // 3. Busy check (overlapping bookings)
        if (isMentorBusyAtUtc(mentor.id, slotUtcStart.toISO(), slotUtcEnd.toISO())) {
          continue;
        }

        eligibleMentors.push({
          mentor,
          dailyCount
        });
      }
    }

    if (eligibleMentors.length > 0) {
      // Balanced assignment strategy:
      // 1. Group by minimum daily bookings count today
      const minDaily = Math.min(...eligibleMentors.map(e => e.dailyCount));
      const leastBooked = eligibleMentors.filter(e => e.dailyCount === minDaily);

      // 2. Stable sort by ID
      leastBooked.sort((a, b) => a.mentor.id.localeCompare(b.mentor.id));

      // 3. Time-slot round-robin dispersion so different time slots alternate mentors
      const slotBucket = Math.floor(slotUtcStart.toMillis() / (CLASS_DURATION_MINUTES * 60 * 1000));
      const chosenIndex = Math.abs(slotBucket) % leastBooked.length;
      const topMentor = leastBooked[chosenIndex].mentor;

      slots.push({
        id: `slot_${slotUtcStart.toMillis()}`,
        parentLocalTime: parentSlotStart.toFormat('h:mm a'),
        parentLocalTime24: parentSlotStart.toFormat('HH:mm'),
        parentIso: parentSlotStart.toISO(),
        utcStart: slotUtcStart.toISO(),
        utcEnd: slotUtcEnd.toISO(),
        mentorLocalDate: mentorLocalDate,
        mentorLocalTime: mentorInstant.toFormat('h:mm a'),
        mentorTimezone: MENTOR_TIMEZONE,
        availableMentorCount: eligibleMentors.length,
        candidateMentor: {
          id: topMentor.id,
          name: topMentor.name,
          role: topMentor.role,
          specialization: topMentor.specialization
        },
        availableMentors: eligibleMentors.map(e => ({
          id: e.mentor.id,
          name: e.mentor.name,
          role: e.mentor.role,
          dailyCount: e.dailyCount
        }))
      });
    }

    current = current.plus({ minutes: CLASS_DURATION_MINUTES });
  }

  return {
    date: dateStr,
    parentTimezone,
    subjectId,
    slots,
    totalSlotsAvailable: slots.length
  };
}
