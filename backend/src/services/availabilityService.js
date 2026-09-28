import { DateTime } from 'luxon';
import { MENTORS } from '../data/mentors.js';
import { SUBJECTS } from '../data/subjects.js';
import { queryAll, queryOne } from '../db.js';
import { 
  BOOKING_WINDOW_DAYS, 
  getBookingWindowBounds, 
  isDateWithinBookingWindow 
} from '../utils/time.js';

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
export function getAvailableSlots({ subjectId, dateStr, date, parentTimezone, skipWindowCheck = false }) {
  const targetDateStr = dateStr || date;
  if (!isValidTimezone(parentTimezone)) {
    throw { status: 400, code: 'INVALID_TIMEZONE', message: `Invalid parent timezone: ${parentTimezone}` };
  }

  // Parse start of parent's day
  const parentDay = DateTime.fromISO(targetDateStr, { zone: parentTimezone });
  if (!parentDay.isValid) {
    throw { status: 400, code: 'INVALID_DATE', message: `Invalid date format: ${targetDateStr}. Use YYYY-MM-DD.` };
  }

  // Validate that the requested date is strictly within the allowable 14-day booking window
  const windowBounds = getBookingWindowBounds(parentTimezone);
  let windowCheck = { valid: true, minDateStr: windowBounds.minDateStr, maxDateStr: windowBounds.maxDateStr };
  if (!skipWindowCheck) {
    windowCheck = isDateWithinBookingWindow(targetDateStr, parentTimezone);
    if (!windowCheck.valid) {
      throw {
        status: 400,
        code: windowCheck.error,
        message: windowCheck.message,
        minDate: windowCheck.minDateStr,
        maxDate: windowCheck.maxDateStr
      };
    }
  }

  // Filter mentors supporting the subject
  const subjectMentors = MENTORS.filter(m => m.supportedSubjects.includes(subjectId));
  if (subjectMentors.length === 0) {
    const parentTodayStr = DateTime.now().setZone(parentTimezone).toFormat('yyyy-MM-dd');
    const isToday = (targetDateStr === parentTodayStr);
    const formattedDate = parentDay.toFormat('LLLL d');
    const primaryMentorDate = parentDay.set({ hour: 9, minute: 0 }).setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');
    const dateBookingsCount = getSystemBookingsForDate(primaryMentorDate);
    const capacityRemainingOnDate = Math.max(0, TOTAL_SYSTEM_DAILY_CAPACITY - dateBookingsCount);

    return {
      date: targetDateStr,
      parentTimezone,
      subjectId,
      mentorLocalDate: primaryMentorDate,
      dailyCapacity: TOTAL_SYSTEM_DAILY_CAPACITY,
      dateBookingsCount,
      capacityRemainingOnDate,
      isToday,
      formattedDate,
      dateLabel: isToday ? 'Today' : formattedDate,
      availabilityLabel: isToday
        ? `Today's Availability: ${capacityRemainingOnDate} slots remaining (${dateBookingsCount}/${TOTAL_SYSTEM_DAILY_CAPACITY} booked)`
        : `${formattedDate} Availability: ${capacityRemainingOnDate} slots remaining (${dateBookingsCount}/${TOTAL_SYSTEM_DAILY_CAPACITY} booked)`,
      bookingWindow: {
        daysAllowed: BOOKING_WINDOW_DAYS + 1,
        minDate: windowCheck.minDateStr,
        maxDate: windowCheck.maxDateStr
      },
      slots: [],
      totalSlotsAvailable: 0,
      subjectMentorsCapacity: [],
      allSubjectMentorsFull: false,
      reason: 'No mentors found for this subject'
    };
  }

  const slots = [];
  // Parent booking window: from 06:00 AM to 22:30 PM in parent's local timezone
  // Generate every 30-minute interval
  const startLocal = parentDay.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
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
      // Also build real-time status of all subject mentors for this slot's local date/time
      const slotMentorsCapacity = subjectMentors.map(m => {
        const count = getMentorBookingsForDate(m.id, mentorLocalDate);
        const max = m.maxDailyClasses || MAX_DAILY_CLASSES_PER_MENTOR;
        const isLimitReached = count >= max;
        const isBusy = isMentorBusyAtUtc(m.id, slotUtcStart.toISO(), slotUtcEnd.toISO());
        const isOutsideHours = mentorHour < m.workingHours.start || mentorHour + (CLASS_DURATION_MINUTES / 60) > m.workingHours.end;
        return {
          id: m.id,
          name: m.name,
          role: m.role,
          specialization: m.specialization,
          avatar: m.avatar,
          mentorLocalDate,
          dailyCount: count,
          maxDailyClasses: max,
          remainingClassesToday: Math.max(0, max - count),
          isDailyLimitReached: isLimitReached,
          isBusy,
          isOutsideHours,
          isEligible: !isLimitReached && !isBusy && !isOutsideHours
        };
      });

      const topMentor = leastBooked[chosenIndex].mentor;
      const chosenDailyCount = leastBooked[chosenIndex].dailyCount;
      const topMentorMax = topMentor.maxDailyClasses || MAX_DAILY_CLASSES_PER_MENTOR;

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
          specialization: topMentor.specialization,
          avatar: topMentor.avatar,
          dailyCount: chosenDailyCount,
          maxDailyClasses: topMentorMax,
          remainingClassesToday: Math.max(0, topMentorMax - chosenDailyCount),
          isDailyLimitReached: chosenDailyCount >= topMentorMax
        },
        availableMentors: eligibleMentors.map(e => {
          const max = e.mentor.maxDailyClasses || MAX_DAILY_CLASSES_PER_MENTOR;
          return {
            id: e.mentor.id,
            name: e.mentor.name,
            role: e.mentor.role,
            specialization: e.mentor.specialization,
            avatar: e.mentor.avatar,
            dailyCount: e.dailyCount,
            maxDailyClasses: max,
            remainingClassesToday: Math.max(0, max - e.dailyCount),
            isDailyLimitReached: e.dailyCount >= max
          };
        }),
        slotMentorsCapacity
      });
    }

    current = current.plus({ minutes: CLASS_DURATION_MINUTES });
  }

  // Date-level capacity summary across all qualified mentors for this subject (evaluated on mentor's local date in IST)
  // Derive primary mentor local date: if slots exist, use the exact mentor date of the slots; otherwise derive from parent date in mentor timezone during teaching hours
  const primaryMentorDate = (slots.length > 0)
    ? slots[0].mentorLocalDate
    : parentDay.set({ hour: 9, minute: 0 }).setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');

  const subjectMentorsCapacity = subjectMentors.map(m => {
    const count = getMentorBookingsForDate(m.id, primaryMentorDate);
    const max = m.maxDailyClasses || MAX_DAILY_CLASSES_PER_MENTOR;
    return {
      id: m.id,
      name: m.name,
      role: m.role,
      specialization: m.specialization,
      avatar: m.avatar,
      mentorLocalDate: primaryMentorDate,
      dailyCount: count,
      maxDailyClasses: max,
      remainingClassesToday: Math.max(0, max - count),
      isDailyLimitReached: count >= max
    };
  });
  const allSubjectMentorsFull = subjectMentorsCapacity.length > 0 && subjectMentorsCapacity.every(m => m.isDailyLimitReached);

  // System-level 20-booking daily capacity evaluated for the selected date
  const dateBookingsCount = getSystemBookingsForDate(primaryMentorDate);
  const dailyCapacity = TOTAL_SYSTEM_DAILY_CAPACITY; // 20
  const capacityRemainingOnDate = Math.max(0, dailyCapacity - dateBookingsCount);

  // Parent date formatting & dynamic label
  const parentTodayStr = DateTime.now().setZone(parentTimezone).toFormat('yyyy-MM-dd');
  const isToday = (targetDateStr === parentTodayStr);
  const formattedDate = parentDay.toFormat('LLLL d'); // e.g. "September 29"
  const dateLabel = isToday ? 'Today' : formattedDate;
  const availabilityLabel = isToday
    ? `Today's Availability: ${capacityRemainingOnDate} slots remaining (${dateBookingsCount}/${dailyCapacity} booked)`
    : `${formattedDate} Availability: ${capacityRemainingOnDate} slots remaining (${dateBookingsCount}/${dailyCapacity} booked)`;

  return {
    date: targetDateStr,
    parentTimezone,
    subjectId,
    mentorLocalDate: primaryMentorDate,
    dailyCapacity,
    dateBookingsCount,
    capacityRemainingOnDate,
    isToday,
    formattedDate,
    dateLabel,
    availabilityLabel,
    bookingWindow: {
      daysAllowed: BOOKING_WINDOW_DAYS + 1,
      minDate: windowCheck.minDateStr,
      maxDate: windowCheck.maxDateStr
    },
    slots,
    totalSlotsAvailable: slots.length,
    subjectMentorsCapacity,
    allSubjectMentorsFull,
    noAvailabilityReason: allSubjectMentorsFull
      ? 'MENTOR_DAILY_LIMIT_REACHED'
      : (slots.length === 0 ? 'NO_SLOTS_AVAILABLE' : null),
    noAvailabilityMessage: allSubjectMentorsFull
      ? 'All mentors qualified for this course have reached their daily limit of 2 trial sessions for this date.'
      : (slots.length === 0 ? 'No mentor available for this date.' : null)
  };
}
