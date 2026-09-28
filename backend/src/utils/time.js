import { DateTime } from 'luxon';

export const DEFAULT_MENTOR_TIMEZONE = 'Asia/Kolkata';
export const CLASS_DURATION_MINUTES = 30;

/**
 * Standard central booking window: parents can book starting Today up to 90 days in advance (inclusive).
 * Total selectable days = 91 days (Day 0 = Today through Day 90).
 */
export const BOOKING_WINDOW_DAYS = 90;

/**
 * Returns the start and end boundary dates (YYYY-MM-DD) of the allowed booking window in the parent timezone.
 * @param {string} [parentTimezone='America/New_York']
 * @returns {{ minDateStr: string, maxDateStr: string, daysAllowed: number }}
 */
export function getBookingWindowBounds(parentTimezone = 'America/New_York') {
  const today = DateTime.now().setZone(parentTimezone).startOf('day');
  const maxDate = today.plus({ days: BOOKING_WINDOW_DAYS });
  return {
    minDateStr: today.toFormat('yyyy-MM-dd'),
    maxDateStr: maxDate.toFormat('yyyy-MM-dd'),
    daysAllowed: BOOKING_WINDOW_DAYS + 1
  };
}

/**
 * Validates whether a requested booking date or instant falls strictly within the allowable booking window:
 * [Today, Today + 14 days] in the parent's local timezone.
 *
 * @param {string|DateTime} dateOrDt - 'YYYY-MM-DD', ISO string, or DateTime instance
 * @param {string} parentTimezone - IANA timezone string
 * @param {object} [options]
 * @param {boolean} [options.allowPast=false]
 * @returns {{ valid: boolean, error?: string, message?: string, minDateStr?: string, maxDateStr?: string }}
 */
export function isDateWithinBookingWindow(dateOrDt, parentTimezone = 'America/New_York', options = {}) {
  const dt = typeof dateOrDt === 'string'
    ? (dateOrDt.includes('T') ? DateTime.fromISO(dateOrDt, { zone: 'utc' }).setZone(parentTimezone) : DateTime.fromISO(dateOrDt, { zone: parentTimezone }))
    : dateOrDt.setZone(parentTimezone);

  if (!dt.isValid) {
    return {
      valid: false,
      error: 'INVALID_DATE',
      message: `Invalid date format: ${dateOrDt}. Use YYYY-MM-DD.`
    };
  }

  const todayStart = DateTime.now().setZone(parentTimezone).startOf('day');
  const targetStart = dt.startOf('day');
  const maxAllowedDate = todayStart.plus({ days: BOOKING_WINDOW_DAYS });

  if (!options.allowPast && targetStart < todayStart) {
    return {
      valid: false,
      error: 'DATE_IN_PAST',
      message: 'Cannot select or book trial classes in the past.',
      minDateStr: todayStart.toFormat('yyyy-MM-dd'),
      maxDateStr: maxAllowedDate.toFormat('yyyy-MM-dd')
    };
  }

  if (targetStart > maxAllowedDate) {
    return {
      valid: false,
      error: 'DATE_OUT_OF_WINDOW',
      message: `Booking date must be within the next ${BOOKING_WINDOW_DAYS} days (up to ${maxAllowedDate.toFormat('yyyy-MM-dd')}).`,
      minDateStr: todayStart.toFormat('yyyy-MM-dd'),
      maxDateStr: maxAllowedDate.toFormat('yyyy-MM-dd')
    };
  }

  return {
    valid: true,
    minDateStr: todayStart.toFormat('yyyy-MM-dd'),
    maxDateStr: maxAllowedDate.toFormat('yyyy-MM-dd')
  };
}

/**
 * Returns the mentor's local calendar date (yyyy-MM-dd) for a given UTC instant.
 * @param {string|DateTime} utcIso
 * @param {string} [mentorTimezone='Asia/Kolkata']
 * @returns {string}
 */
export function mentorLocalDate(utcIso, mentorTimezone = DEFAULT_MENTOR_TIMEZONE) {
  const dt = typeof utcIso === 'string'
    ? DateTime.fromISO(utcIso, { zone: 'utc' })
    : utcIso;
  
  if (!dt.isValid) {
    throw new Error(`Invalid UTC instant: ${utcIso}`);
  }

  return dt.setZone(mentorTimezone).toFormat('yyyy-MM-dd');
}

/**
 * Formats a UTC instant in the target timezone with the given format string.
 * @param {string|DateTime} utcIso
 * @param {string} zone
 * @param {string} [formatStr='yyyy-MM-dd HH:mm:ss']
 * @returns {string}
 */
export function formatInZone(utcIso, zone, formatStr = 'yyyy-MM-dd HH:mm:ss') {
  const dt = typeof utcIso === 'string'
    ? DateTime.fromISO(utcIso, { zone: 'utc' })
    : utcIso;

  if (!dt.isValid) {
    throw new Error(`Invalid UTC instant: ${utcIso}`);
  }

  return dt.setZone(zone).toFormat(formatStr);
}

/**
 * Checks whether a 30-minute slot falls completely within a mentor's operating hours in their local timezone.
 * @param {string|DateTime} slotStartUTC
 * @param {string|DateTime} slotEndUTC
 * @param {{ start: number, end: number }} [mentorWorkingHours={ start: 10, end: 20 }]
 * @param {string} [mentorTimezone='Asia/Kolkata']
 * @returns {boolean}
 */
export function isWithinMentorWorkingHours(
  slotStartUTC,
  slotEndUTC,
  mentorWorkingHours = { start: 10, end: 20 },
  mentorTimezone = DEFAULT_MENTOR_TIMEZONE
) {
  const startDt = typeof slotStartUTC === 'string'
    ? DateTime.fromISO(slotStartUTC, { zone: 'utc' })
    : slotStartUTC;
  const endDt = typeof slotEndUTC === 'string'
    ? DateTime.fromISO(slotEndUTC, { zone: 'utc' })
    : slotEndUTC;

  if (!startDt.isValid || !endDt.isValid) {
    return false;
  }

  const mentorStart = startDt.setZone(mentorTimezone);
  const mentorEnd = endDt.setZone(mentorTimezone);

  // If slot crosses midnight in mentor's timezone, it is outside normal working hours
  if (mentorStart.toFormat('yyyy-MM-dd') !== mentorEnd.toFormat('yyyy-MM-dd')) {
    return false;
  }

  const startHour = mentorStart.hour + mentorStart.minute / 60;
  const endHour = mentorEnd.hour + mentorEnd.minute / 60;

  const minHour = mentorWorkingHours.start ?? 10;
  const maxHour = mentorWorkingHours.end ?? 20;

  return startHour >= minHour && endHour <= maxHour;
}

/**
 * Generates candidate UTC slots for a given date in the parent's timezone.
 * Luxon automatically handles 23-hour spring-forward days and 25-hour fall-back days.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} parentTimezone
 * @param {object} [options]
 * @returns {Array<{ parentLocalTime: string, slotStartUTC: string, slotEndUTC: string, mentorLocalDate: string }>}
 */
export function generateCandidateSlotsUTC(dateStr, parentTimezone, options = {}) {
  const startHour = options.startHour ?? 7;
  const endHour = options.endHour ?? 22.5;
  const duration = options.durationMinutes ?? CLASS_DURATION_MINUTES;

  const parentDay = DateTime.fromISO(dateStr, { zone: parentTimezone });
  if (!parentDay.isValid) {
    throw new Error(`Invalid date format or timezone: ${dateStr}, ${parentTimezone}`);
  }

  const startLocal = parentDay.set({
    hour: Math.floor(startHour),
    minute: (startHour % 1) * 60,
    second: 0,
    millisecond: 0
  });

  const endLocal = parentDay.set({
    hour: Math.floor(endHour),
    minute: (endHour % 1) * 60,
    second: 0,
    millisecond: 0
  });

  const slots = [];
  let current = startLocal;

  while (current <= endLocal) {
    const parentSlotStart = current;
    const parentSlotEnd = current.plus({ minutes: duration });
    const slotStartUTC = parentSlotStart.toUTC().toISO();
    const slotEndUTC = parentSlotEnd.toUTC().toISO();

    slots.push({
      parentLocalTime: parentSlotStart.toFormat('h:mm a'),
      parentLocalTime24: parentSlotStart.toFormat('HH:mm'),
      parentIso: parentSlotStart.toISO(),
      slotStartUTC,
      slotEndUTC,
      mentorLocalDate: mentorLocalDate(slotStartUTC, DEFAULT_MENTOR_TIMEZONE),
      mentorLocalTime: formatInZone(slotStartUTC, DEFAULT_MENTOR_TIMEZONE, 'h:mm a')
    });

    current = current.plus({ minutes: duration });
  }

  return slots;
}

/**
 * Resolves a local ISO datetime string in a given timezone to UTC.
 * On US spring-forward, Luxon sanely normalizes nonexistent gap times to valid UTC instants.
 * @param {string} localIsoString - e.g. '2026-03-08T02:30:00'
 * @param {string} timezone - e.g. 'America/New_York'
 * @returns {string} ISO UTC string
 */
export function resolveLocalTimeToUTC(localIsoString, timezone) {
  const dt = DateTime.fromISO(localIsoString, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid local datetime: ${localIsoString} (${dt.invalidReason})`);
  }
  return dt.toUTC().toISO();
}

/**
 * Validates whether a local date and time string exists without falling into a DST gap.
 * If in a spring-forward gap, returns information about the sane normalization or validation failure.
 * @param {string} dateStr - 'yyyy-MM-dd'
 * @param {string} timeStr - 'HH:mm'
 * @param {string} timezone
 */
export function validateOrNormalizeLocalTime(dateStr, timeStr, timezone) {
  const iso = `${dateStr}T${timeStr}`;
  const dt = DateTime.fromISO(iso, { zone: timezone });

  if (!dt.isValid) {
    return {
      valid: false,
      error: 'INVALID_DATETIME',
      message: `Invalid datetime: ${dt.invalidReason}`
    };
  }

  const requestedHour = parseInt(timeStr.split(':')[0], 10);
  const wasNormalizedInGap = dt.hour !== requestedHour;

  return {
    valid: true,
    utcIso: dt.toUTC().toISO(),
    wasNormalizedInGap,
    normalizedHour: dt.hour,
    normalizedLocalTime: dt.toFormat('HH:mm'),
    zoneName: dt.zoneName,
    offset: dt.offset
  };
}
