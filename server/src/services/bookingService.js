import { DateTime } from 'luxon';
import { MENTORS, getMentorById } from '../data/mentors.js';
import { SUBJECTS, getSubjectById } from '../data/subjects.js';
import { queryAll, queryOne, run } from '../db.js';
import {
  MENTOR_TIMEZONE,
  CLASS_DURATION_MINUTES,
  MAX_DAILY_CLASSES_PER_MENTOR,
  TOTAL_SYSTEM_DAILY_CAPACITY,
  isValidTimezone,
  getMentorBookingsForDate,
  getSystemBookingsForDate,
  isMentorBusyAtUtc
} from './availabilityService.js';

// Simple email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates a trial class booking
 */
export async function createBooking({
  parentName,
  parentEmail,
  childName,
  subjectId,
  parentTimezone,
  utcStartIso
}) {
  // 1. Input validations
  if (!parentName || typeof parentName !== 'string' || !parentName.trim()) {
    throw { status: 400, code: 'INVALID_REQUEST', message: 'Parent name is required.' };
  }
  if (!parentEmail || typeof parentEmail !== 'string' || !EMAIL_REGEX.test(parentEmail.trim())) {
    throw { status: 400, code: 'INVALID_REQUEST', message: 'A valid parent email address is required.' };
  }
  if (!childName || typeof childName !== 'string' || !childName.trim()) {
    throw { status: 400, code: 'INVALID_REQUEST', message: "Child's name is required." };
  }
  if (!subjectId) {
    throw { status: 400, code: 'INVALID_REQUEST', message: 'Please select a trial subject.' };
  }

  const subject = getSubjectById(subjectId);
  if (!subject) {
    throw { status: 400, code: 'INVALID_SUBJECT', message: `Subject '${subjectId}' is not offered.` };
  }

  if (!isValidTimezone(parentTimezone)) {
    throw { status: 400, code: 'INVALID_TIMEZONE', message: `Invalid parent timezone: '${parentTimezone}'.` };
  }

  const startUtc = DateTime.fromISO(utcStartIso, { zone: 'utc' });
  if (!startUtc.isValid) {
    throw { status: 400, code: 'INVALID_DATETIME', message: `Invalid UTC start time: '${utcStartIso}'.` };
  }

  const endUtc = startUtc.plus({ minutes: CLASS_DURATION_MINUTES });
  const startUtcStr = startUtc.toISO();
  const endUtcStr = endUtc.toISO();

  // Convert to mentor timezone (Asia/Kolkata)
  const mentorInstant = startUtc.setZone(MENTOR_TIMEZONE);
  const mentorLocalDate = mentorInstant.toFormat('yyyy-MM-dd');
  const mentorLocalTime = mentorInstant.toFormat('h:mm a');
  const mentorHour = mentorInstant.hour + mentorInstant.minute / 60;

  // Convert to parent timezone
  const parentInstant = startUtc.setZone(parentTimezone);
  const parentLocalDatetimeStr = parentInstant.toFormat('cccc, LLLL d, yyyy • h:mm a');

  // 2. Check system-wide limit (up to 20 bookings per day in IST)
  const systemBookings = getSystemBookingsForDate(mentorLocalDate);
  if (systemBookings >= TOTAL_SYSTEM_DAILY_CAPACITY) {
    throw {
      status: 409,
      code: 'DAILY_CAPACITY_REACHED',
      message: 'All trial class slots across all mentors have reached maximum capacity (20 classes) for this day. Please select another date.'
    };
  }

  // 3. Find mentors who support the requested subject
  const candidateMentors = MENTORS.filter(m => m.supportedSubjects.includes(subjectId));
  if (candidateMentors.length === 0) {
    throw {
      status: 404,
      code: 'NO_MENTOR_AVAILABLE',
      message: 'No mentors are qualified to teach the selected subject.'
    };
  }

  // 4. Evaluate mentor availability & daily limits
  const eligibleCandidates = [];
  let reachedDailyLimitCount = 0;
  let outOfOperatingHoursCount = 0;
  let busyWithOtherStudentCount = 0;

  for (const mentor of candidateMentors) {
    // Check operating hours
    if (mentorHour < mentor.workingHours.start || mentorHour + (CLASS_DURATION_MINUTES / 60) > mentor.workingHours.end) {
      outOfOperatingHoursCount++;
      continue;
    }

    // Check daily limit for this mentor on their local calendar date
    const dailyCount = getMentorBookingsForDate(mentor.id, mentorLocalDate);
    if (dailyCount >= mentor.maxDailyClasses) {
      reachedDailyLimitCount++;
      continue;
    }

    // Check conflict (another booking at the same UTC instant)
    if (isMentorBusyAtUtc(mentor.id, startUtcStr, endUtcStr)) {
      busyWithOtherStudentCount++;
      continue;
    }

    // Query all-time booking count to help with tie-breaking
    const allTimeRow = queryOne(
      `SELECT COUNT(*) as count FROM bookings WHERE mentor_id = ? AND status = 'CONFIRMED'`,
      [mentor.id]
    );
    const allTimeCount = allTimeRow ? allTimeRow.count : 0;

    eligibleCandidates.push({
      mentor,
      dailyCount,
      allTimeCount
    });
  }

  // If no candidates remain, diagnose the reason for a descriptive error
  if (eligibleCandidates.length === 0) {
    if (reachedDailyLimitCount > 0 && (reachedDailyLimitCount + busyWithOtherStudentCount >= candidateMentors.length)) {
      throw {
        status: 409,
        code: 'MENTOR_DAILY_LIMIT_REACHED',
        message: 'Available mentors for this subject have reached their daily limit of 2 demo classes for this date. Please select another time or date.'
      };
    }

    if (busyWithOtherStudentCount > 0 && (busyWithOtherStudentCount + outOfOperatingHoursCount >= candidateMentors.length)) {
      throw {
        status: 409,
        code: 'SLOT_UNAVAILABLE',
        message: 'This time slot is no longer available. Another student may have just booked it. Please choose another time.'
      };
    }

    throw {
      status: 409,
      code: 'NO_MENTOR_AVAILABLE',
      message: 'No mentor is available for this time. Mentors may be outside their teaching hours or fully booked. Please choose another time or date.'
    };
  }

  // 5. Assignment Strategy:
  // Group mentors by minimum daily booking count today
  const minDaily = Math.min(...eligibleCandidates.map(c => c.dailyCount));
  const leastBooked = eligibleCandidates.filter(c => c.dailyCount === minDaily);

  // Stable sort by mentor ID
  leastBooked.sort((a, b) => a.mentor.id.localeCompare(b.mentor.id));

  // Time-slot round-robin dispersion so different time slots assign different mentors
  const slotBucket = Math.floor(startUtc.toMillis() / (CLASS_DURATION_MINUTES * 60 * 1000));
  const chosenIndex = Math.abs(slotBucket) % leastBooked.length;
  const assignedMentor = leastBooked[chosenIndex].mentor;
  const bookingId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const dummyClassLink = `https://demo.example.com/class/${bookingId}`;
  const nowUtcIso = DateTime.utc().toISO();

  // 6. Insert booking atomically
  run(
    `INSERT INTO bookings (
      id, parent_name, parent_email, child_name, subject_id, subject_title,
      parent_timezone, parent_local_datetime, mentor_id, mentor_name,
      mentor_timezone, mentor_local_date, mentor_local_time,
      start_time_utc, end_time_utc, duration_minutes, dummy_class_link,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookingId,
      parentName.trim(),
      parentEmail.trim().toLowerCase(),
      childName.trim(),
      subject.id,
      subject.title,
      parentTimezone,
      parentLocalDatetimeStr,
      assignedMentor.id,
      assignedMentor.name,
      MENTOR_TIMEZONE,
      mentorLocalDate,
      mentorLocalTime,
      startUtcStr,
      endUtcStr,
      CLASS_DURATION_MINUTES,
      dummyClassLink,
      'CONFIRMED',
      nowUtcIso
    ]
  );

  // 7. Simulated email notifications
  const simulatedNotifications = {
    parent: {
      to: parentEmail.trim(),
      subject: `Trial Class Confirmed: ${subject.title} for ${childName.trim()}`,
      time: parentLocalDatetimeStr,
      classLink: dummyClassLink,
      status: 'SENT (Simulated)'
    },
    mentor: {
      to: `${assignedMentor.id}@mentors.codeyoung.internal`,
      mentorName: assignedMentor.name,
      subject: `New Trial Class Assigned: ${subject.title}`,
      time: `${mentorLocalDate} at ${mentorLocalTime} (${MENTOR_TIMEZONE})`,
      studentName: childName.trim(),
      classLink: dummyClassLink,
      status: 'SENT (Simulated)'
    }
  };

  console.log(`[Notification Engine] Simulated email dispatched to parent: ${parentEmail.trim()}`);
  console.log(`[Notification Engine] Simulated assignment dispatched to mentor: ${assignedMentor.name}`);

  return {
    success: true,
    bookingId,
    parentName: parentName.trim(),
    parentEmail: parentEmail.trim().toLowerCase(),
    childName: childName.trim(),
    subject: {
      id: subject.id,
      title: subject.title,
      duration: '30 minutes'
    },
    parentTime: {
      timezone: parentTimezone,
      formatted: parentLocalDatetimeStr,
      timeOnly: parentInstant.toFormat('h:mm a'),
      dateOnly: parentInstant.toFormat('cccc, LLLL d, yyyy')
    },
    mentorTime: {
      mentorId: assignedMentor.id,
      mentorName: assignedMentor.name,
      mentorRole: assignedMentor.role,
      timezone: MENTOR_TIMEZONE,
      localDate: mentorLocalDate,
      localTime: mentorLocalTime,
      formatted: `${mentorLocalDate} • ${mentorLocalTime} (IST)`
    },
    utcStart: startUtcStr,
    utcEnd: endUtcStr,
    durationMinutes: CLASS_DURATION_MINUTES,
    dummyClassLink,
    status: 'CONFIRMED',
    createdAt: nowUtcIso,
    simulatedNotifications
  };
}

/**
 * Retrieve booking by ID
 */
export function getBookingById(bookingId) {
  const row = queryOne(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
  if (!row) return null;
  return row;
}

/**
 * Retrieve all bookings (for Admin / Evaluator inspection)
 */
export function getAllBookings({ limit = 50, date = null } = {}) {
  let sql = `SELECT * FROM bookings`;
  const params = [];
  if (date) {
    sql += ` WHERE mentor_local_date = ?`;
    params.push(date);
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  return queryAll(sql, params);
}

/**
 * Get mentors summary with today's booking counts and availability status
 */
export function getMentorsSummary(targetDateStr = null) {
  const mentorDate = targetDateStr || DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');

  return MENTORS.map(m => {
    const todayBookingsCount = getMentorBookingsForDate(m.id, mentorDate);
    return {
      ...m,
      currentDate: mentorDate,
      bookingsToday: todayBookingsCount,
      remainingClassesToday: Math.max(0, m.maxDailyClasses - todayBookingsCount),
      isDailyLimitReached: todayBookingsCount >= m.maxDailyClasses
    };
  });
}
