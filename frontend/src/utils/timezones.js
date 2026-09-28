import { DateTime } from 'luxon';

export const POPULAR_TIMEZONES = [
  { value: 'America/New_York', label: 'US Eastern (New York, Miami, Boston)', region: 'North America' },
  { value: 'America/Chicago', label: 'US Central (Chicago, Dallas, Houston)', region: 'North America' },
  { value: 'America/Denver', label: 'US Mountain (Denver, Phoenix, Salt Lake)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'US Pacific (Los Angeles, San Francisco, Seattle)', region: 'North America' },
  { value: 'Europe/London', label: 'UK & Ireland (London, Dublin)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Central Europe (Paris, Berlin, Amsterdam)', region: 'Europe' },
  { value: 'Asia/Kolkata', label: 'India (IST - Delhi, Mumbai, Bengaluru)', region: 'Asia' },
  { value: 'Asia/Dubai', label: 'UAE & Gulf (Dubai, Abu Dhabi)', region: 'Middle East' },
  { value: 'Asia/Singapore', label: 'Singapore & Malaysia', region: 'Asia' },
  { value: 'Australia/Sydney', label: 'Australia Eastern (Sydney, Melbourne)', region: 'Oceania' }
];

export function getDefaultTimezone() {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      if (detected === 'Asia/Calcutta') return 'Asia/Kolkata';
      // If detected is in our popular list or valid, return it
      const match = POPULAR_TIMEZONES.find(tz => tz.value === detected);
      if (match) return match.value;
      return detected;
    }
  } catch (e) {
    // fallback
  }
  return 'America/New_York';
}

export function getTimezoneLabel(zoneValue) {
  const normalized = zoneValue === 'Asia/Calcutta' ? 'Asia/Kolkata' : zoneValue;
  const match = POPULAR_TIMEZONES.find(tz => tz.value === normalized);
  return match ? match.label : zoneValue;
}

/**
 * Standard central booking window: parents can book starting Today up to 90 days in advance (inclusive).
 * Total selectable days = 91 days (Day 0 = Today through Day 90).
 */
export const BOOKING_WINDOW_DAYS = 90;

/**
 * Returns bounds for the 90-day booking window [Today, Today + 90 days] in the parent timezone.
 */
export function getBookingWindowBounds(parentTimezone) {
  const baseDate = DateTime.now().setZone(parentTimezone).startOf('day');
  const maxDate = baseDate.plus({ days: BOOKING_WINDOW_DAYS });
  return {
    minDateStr: baseDate.toFormat('yyyy-MM-dd'),
    maxDateStr: maxDate.toFormat('yyyy-MM-dd'),
    totalDays: BOOKING_WINDOW_DAYS + 1
  };
}

/**
 * Generates the full 91 selectable dates (Today + 90 days) in the parent timezone.
 */
export function generateBookingDateOptions(parentTimezone) {
  const dateOptions = [];
  const baseDate = DateTime.now().setZone(parentTimezone);
  for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
    const d = baseDate.plus({ days: i });
    dateOptions.push({
      index: i,
      weekNumber: Math.floor(i / 7) + 1,
      dateStr: d.toFormat('yyyy-MM-dd'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toFormat('ccc'),
      dayNumber: d.toFormat('d'),
      monthName: d.toFormat('LLL'),
      fullDateLabel: d.toFormat('LLLL d, yyyy')
    });
  }
  return dateOptions;
}

/**
 * Validates if date string falls inside the 90-day booking window [Today, Today + 90 days].
 */
export function isDateWithinBookingWindow(dateStr, parentTimezone) {
  const dt = DateTime.fromISO(dateStr, { zone: parentTimezone });
  if (!dt.isValid) return false;
  const todayStart = DateTime.now().setZone(parentTimezone).startOf('day');
  const targetStart = dt.startOf('day');
  const maxDate = todayStart.plus({ days: BOOKING_WINDOW_DAYS });
  return targetStart >= todayStart && targetStart <= maxDate;
}

/**
 * Checks whether user can navigate to the previous month within the booking window.
 */
export function canNavigatePrevMonth(viewMonthDt, parentTimezone) {
  const today = DateTime.now().setZone(parentTimezone).startOf('day');
  return viewMonthDt.startOf('month') > today.startOf('month');
}

/**
 * Checks whether user can navigate to the next month within the booking window.
 * Returns true if the next month contains at least one selectable day on or before maxDate.
 */
export function canNavigateNextMonth(viewMonthDt, parentTimezone) {
  const today = DateTime.now().setZone(parentTimezone).startOf('day');
  const maxDate = today.plus({ days: BOOKING_WINDOW_DAYS }).startOf('day');
  const nextMonthStart = viewMonthDt.plus({ months: 1 }).startOf('month');
  return nextMonthStart <= maxDate;
}

/**
 * Builds the month calendar days matrix for the given month in parent's timezone.
 */
export function getMonthCalendarGrid(viewMonthDt, parentTimezone) {
  const today = DateTime.now().setZone(parentTimezone).startOf('day');
  const todayStr = today.toFormat('yyyy-MM-dd');
  const maxDate = today.plus({ days: BOOKING_WINDOW_DAYS });
  const maxDateStr = maxDate.toFormat('yyyy-MM-dd');

  const startOfMonth = viewMonthDt.startOf('month');
  const daysInMonth = viewMonthDt.daysInMonth;
  // Sunday is 0, Monday is 1, ..., Saturday is 6
  const leadingBlanks = startOfMonth.weekday % 7;

  const days = [];

  // Previous month trailing days (padding, disabled)
  const prevMonth = viewMonthDt.minus({ months: 1 });
  const daysInPrevMonth = prevMonth.daysInMonth;
  for (let i = leadingBlanks - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const d = prevMonth.set({ day: dayNum });
    days.push({
      key: `prev-${dayNum}`,
      dateStr: d.toFormat('yyyy-MM-dd'),
      dayNumber: dayNum,
      isCurrentMonth: false,
      isDisabled: true,
      isToday: false,
      isPast: true,
      isOutsideWindow: true,
      isValid: false
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = viewMonthDt.set({ day: dayNum });
    const dateStr = d.toFormat('yyyy-MM-dd');
    const isPast = d < today;
    const isOutsideWindow = d > maxDate;
    const isToday = (dateStr === todayStr);
    const isDisabled = isPast || isOutsideWindow;

    days.push({
      key: `curr-${dayNum}`,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isDisabled,
      isToday,
      isPast,
      isOutsideWindow,
      isValid: !isDisabled,
      fullDateLabel: d.toFormat('LLLL d, yyyy')
    });
  }

  // Next month leading days (padding to complete grid)
  const trailingBlanks = (7 - (days.length % 7)) % 7;
  const nextMonth = viewMonthDt.plus({ months: 1 });
  for (let dayNum = 1; dayNum <= trailingBlanks; dayNum++) {
    const d = nextMonth.set({ day: dayNum });
    days.push({
      key: `next-${dayNum}`,
      dateStr: d.toFormat('yyyy-MM-dd'),
      dayNumber: dayNum,
      isCurrentMonth: false,
      isDisabled: true,
      isToday: false,
      isPast: false,
      isOutsideWindow: true,
      isValid: false
    });
  }

  return {
    monthName: viewMonthDt.toFormat('LLLL'),
    year: viewMonthDt.year,
    monthYearLabel: viewMonthDt.toFormat('LLLL yyyy'),
    days,
    todayStr,
    minDateStr: todayStr,
    maxDateStr
  };
}
