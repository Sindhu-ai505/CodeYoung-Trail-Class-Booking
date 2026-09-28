import { DateTime } from 'luxon';
import { MENTORS, getMentorById } from '../data/mentors.js';
import { SUBJECTS, getSubjectById } from '../data/subjects.js';
import { getDb, queryAll, queryOne, run } from '../db/index.js';
import { findAvailableMentor } from './mentorAssignment.js';
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
import { isDateWithinBookingWindow } from '../utils/time.js';
import { validateEmail, normalizeEmail, INVALID_EMAIL_CODE, INVALID_EMAIL_MESSAGE } from '../utils/validation.js';

/**
 * Standardizes a database booking row into a comprehensive response object.
 */
export function formatBookingRecord(b) {
  if (!b) return null;
  const startUtc = b.slot_start_utc || b.start_time_utc;
  const endUtc = b.slot_end_utc || b.end_time_utc;
  const link = b.meeting_link || b.dummy_class_link;
  const mentorTz = b.mentor_timezone || MENTOR_TIMEZONE;

  const db = getDb();
  let notificationsList = [];
  try {
    notificationsList = db.prepare(`SELECT * FROM notifications WHERE booking_id = ? ORDER BY created_at ASC`).all(b.id);
  } catch (e) {
    notificationsList = [];
  }

  let learningCheckData = null;
  try {
    const lcRow = db.prepare(`SELECT * FROM learning_checks WHERE booking_id = ?`).get(b.id);
    if (lcRow) {
      learningCheckData = {
        id: lcRow.id,
        bookingId: lcRow.booking_id,
        score: lcRow.score,
        totalQuestions: lcRow.total_questions,
        percentage: lcRow.percentage,
        feedback: lcRow.feedback,
        submittedAt: lcRow.submitted_at,
        answers: JSON.parse(lcRow.answers_json || '{}')
      };
    }
  } catch (e) {
    learningCheckData = null;
  }

  const mentorObj = MENTORS.find(m => m.id === b.mentor_id) || {};
  const mentorEmail = mentorObj.email || (b.mentor_email || `${(b.mentor_name || 'mentor').toLowerCase().replace(/[^a-z0-9]+/g, '.')}@codeyoung.com`);

  return {
    success: true,
    id: b.id,
    bookingId: b.id,
    clientRequestId: b.client_request_id || null,
    client_request_id: b.client_request_id || null,
    parentId: b.parent_id,
    parent_id: b.parent_id,
    parentName: b.parent_name,
    parent_name: b.parent_name,
    parentEmail: b.parent_email,
    parent_email: b.parent_email,
    childName: b.child_name,
    child_name: b.child_name,
    subjectId: b.subject_id,
    subject_id: b.subject_id,
    subjectTitle: b.subject_title,
    subject_title: b.subject_title,
    mentorId: b.mentor_id,
    mentor_id: b.mentor_id,
    mentorName: b.mentor_name,
    mentor_name: b.mentor_name,
    mentorEmail,
    mentor_email: mentorEmail,
    mentorRole: b.mentor_role || mentorObj.role || 'Trial Class Mentor',
    mentorSpecialization: mentorObj.specialization || '1:1 STEM Mentorship',
    mentorBio: mentorObj.experience || 'Experienced Educator in Live Mentorship',
    mentorAvatarBg: mentorObj.avatarBg || '#E6F4F1',
    mentorAvatarColor: mentorObj.avatarColor || '#315F61',
    mentorDetails: {
      id: mentorObj.id || b.mentor_id,
      name: mentorObj.name || b.mentor_name,
      role: mentorObj.role || b.mentor_role || 'Trial Class Mentor',
      specialization: mentorObj.specialization || '1:1 STEM Mentorship',
      experience: mentorObj.experience || 'Experienced Educator in Live Mentorship',
      email: mentorEmail,
      timezone: mentorTz,
      avatarBg: mentorObj.avatarBg || '#E6F4F1',
      avatarColor: mentorObj.avatarColor || '#315F61'
    },
    mentorTimezone: mentorTz,
    mentor_timezone: mentorTz,
    mentorLocalDate: b.mentor_local_date,
    mentor_local_date: b.mentor_local_date,
    mentorLocalTime: b.mentor_local_time,
    mentor_local_time: b.mentor_local_time,
    slotStartUTC: startUtc,
    slot_start_utc: startUtc,
    slotEndUTC: endUtc,
    slot_end_utc: endUtc,
    utcStart: startUtc,
    utcEnd: endUtc,
    start_time_utc: startUtc,
    end_time_utc: endUtc,
    meetingLink: link,
    meeting_link: link,
    dummyClassLink: link,
    dummy_class_link: link,
    durationMinutes: b.duration_minutes || CLASS_DURATION_MINUTES,
    duration_minutes: b.duration_minutes || CLASS_DURATION_MINUTES,
    status: b.status || 'CONFIRMED',
    createdAt: b.created_at,
    created_at: b.created_at,
    mentorTime: {
      mentorId: b.mentor_id,
      mentorName: b.mentor_name,
      role: b.mentor_role || 'Trial Class Mentor',
      timezone: mentorTz,
      localDate: b.mentor_local_date,
      localTime: b.mentor_local_time,
      formatted: `${b.mentor_local_date} • ${b.mentor_local_time} (${mentorTz === 'Asia/Kolkata' ? 'IST' : mentorTz})`
    },
    parentTime: {
      timezone: b.parent_timezone,
      formatted: b.parent_local_datetime
    },
    subject: {
      id: b.subject_id,
      title: b.subject_title || 'Trial Class',
      duration: `${b.duration_minutes || CLASS_DURATION_MINUTES} minutes`
    },
    notifications: notificationsList.map(n => ({
      id: n.id,
      recipient: n.recipient,
      type: n.type,
      subject: n.subject,
      status: n.status || 'SENT',
      createdAt: n.created_at
    })),
    notificationDelivery: {
      parent: {
        recipient: b.parent_email,
        status: 'SENT',
        statusLabel: 'Class link sent'
      },
      mentor: {
        recipient: mentorEmail,
        mentorName: b.mentor_name,
        status: 'SENT',
        statusLabel: 'Class link sent'
      }
    },
    learningCheck: learningCheckData,
    mentorDailyCapacity: {
      date: b.mentor_local_date,
      bookedCount: b.mentor_id && b.mentor_local_date ? getMentorBookingsForDate(b.mentor_id, b.mentor_local_date) : 0,
      maxDailyClasses: MAX_DAILY_CLASSES_PER_MENTOR,
      remainingCount: Math.max(0, MAX_DAILY_CLASSES_PER_MENTOR - (b.mentor_id && b.mentor_local_date ? getMentorBookingsForDate(b.mentor_id, b.mentor_local_date) : 0)),
      isLimitReached: (b.mentor_id && b.mentor_local_date ? getMentorBookingsForDate(b.mentor_id, b.mentor_local_date) : 0) >= MAX_DAILY_CLASSES_PER_MENTOR,
      label: ((b.mentor_id && b.mentor_local_date ? getMentorBookingsForDate(b.mentor_id, b.mentor_local_date) : 0) >= MAX_DAILY_CLASSES_PER_MENTOR)
        ? '2 of 2 — daily limit reached'
        : `${b.mentor_id && b.mentor_local_date ? getMentorBookingsForDate(b.mentor_id, b.mentor_local_date) : 0} of ${MAX_DAILY_CLASSES_PER_MENTOR} trial sessions scheduled ${(b.mentor_local_date === DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd')) ? 'today' : 'for this date'}`
    }
  };
}

/**
 * Creates a trial class booking with atomic availability check and idempotency protection.
 */
export async function createBooking({
  clientRequestId,
  parentId,
  parentName,
  parentEmail,
  childName,
  subjectId,
  parentTimezone,
  utcStartIso,
  slotEndUTC,
  skipWindowCheck = false
}, options = {}) {
  const shouldSkipWindowCheck = Boolean(skipWindowCheck || options?.skipWindowCheck);
  const db = getDb();

  // 1. Idempotency pre-check
  if (clientRequestId) {
    const existing = db.prepare(`SELECT * FROM bookings WHERE client_request_id = ?`).get(clientRequestId);
    if (existing) {
      return {
        isReplay: true,
        ...formatBookingRecord(existing),
        data: formatBookingRecord(existing)
      };
    }
  }

  // 2. Input validations with sensible defaults
  const effectiveParentName = (parentName || 'Parent').trim();
  const effectiveEmail = (parentEmail || '').trim().toLowerCase();
  const effectiveChildName = (childName || 'Student').trim();
  const subject = (subjectId && getSubjectById(subjectId)) || { id: subjectId || 'trial_class', title: 'Coding & STEM Trial' };
  const effectiveSubjectId = subject.id;
  const effectiveTimezone = parentTimezone || 'America/New_York';

  if (!effectiveEmail || !validateEmail(effectiveEmail)) {
    throw { status: 400, code: INVALID_EMAIL_CODE, message: INVALID_EMAIL_MESSAGE };
  }
  if (!effectiveParentName) {
    throw { status: 400, code: 'INVALID_REQUEST', message: 'Parent name is required.' };
  }
  if (!effectiveChildName) {
    throw { status: 400, code: 'INVALID_REQUEST', message: "Child's name is required." };
  }
  if (!isValidTimezone(effectiveTimezone)) {
    throw { status: 400, code: 'INVALID_TIMEZONE', message: `Invalid parent timezone: '${effectiveTimezone}'.` };
  }

  const startUtc = DateTime.fromISO(utcStartIso, { zone: 'utc' });
  if (!startUtc.isValid) {
    throw { status: 400, code: 'INVALID_DATETIME', message: `Invalid UTC start time: '${utcStartIso}'.` };
  }

  const endUtc = slotEndUTC
    ? DateTime.fromISO(slotEndUTC, { zone: 'utc' })
    : startUtc.plus({ minutes: CLASS_DURATION_MINUTES });

  const startUtcStr = startUtc.toISO();
  const endUtcStr = endUtc.toISO();

  // Convert to mentor timezone (Asia/Kolkata)
  const mentorInstant = startUtc.setZone(MENTOR_TIMEZONE);
  const mentorLocalDate = mentorInstant.toFormat('yyyy-MM-dd');
  const mentorLocalTime = mentorInstant.toFormat('h:mm a');

  // Convert to parent timezone
  const parentInstant = startUtc.setZone(effectiveTimezone);
  const parentLocalDatetimeStr = parentInstant.toFormat('cccc, LLLL d, yyyy • h:mm a');

  // Validate that the booking date is strictly within the allowable 14-day booking window
  if (!shouldSkipWindowCheck) {
    const windowCheck = isDateWithinBookingWindow(parentInstant, effectiveTimezone);
    if (!windowCheck.valid) {
      throw {
        status: 400,
        code: windowCheck.error,
        message: windowCheck.message
      };
    }
  }

  // 3. Atomic Availability Check & Insert Transaction
  const executeBookingAtomic = db.transaction(() => {
    // Re-check clientRequestId inside the transaction (protects against concurrent requests)
    if (clientRequestId) {
      const existingInTx = db.prepare(`SELECT * FROM bookings WHERE client_request_id = ?`).get(clientRequestId);
      if (existingInTx) {
        return {
          isReplay: true,
          booking: existingInTx
        };
      }
    }

    // Check system-wide capacity (max 20 bookings across all mentors on this date)
    const systemBookings = getSystemBookingsForDate(mentorLocalDate);
    if (systemBookings >= TOTAL_SYSTEM_DAILY_CAPACITY) {
      const capErr = new Error('All trial class slots across all mentors have reached maximum capacity (20 classes) for this day.');
      capErr.status = 409;
      capErr.code = 'DAILY_CAPACITY_REACHED';
      throw capErr;
    }

    // Atomically find available mentor
    const subjectFilter = (subjectId && getSubjectById(subjectId)) ? subjectId : null;
    const assignedMentor = findAvailableMentor(startUtcStr, endUtcStr, {
      db,
      subjectId: subjectFilter
    });

    if (!assignedMentor) {
      const candidateMentors = subjectFilter
        ? MENTORS.filter(m => m.supportedSubjects.includes(subjectFilter))
        : MENTORS;
      let reachedDailyLimitCount = 0;
      let busyCount = 0;
      let outOfHoursCount = 0;
      const mentorHour = mentorInstant.hour + mentorInstant.minute / 60;

      for (const m of candidateMentors) {
        if (mentorHour < m.workingHours.start || mentorHour + (CLASS_DURATION_MINUTES / 60) > m.workingHours.end) {
          outOfHoursCount++;
        } else if (getMentorBookingsForDate(m.id, mentorLocalDate) >= m.maxDailyClasses) {
          reachedDailyLimitCount++;
        } else if (isMentorBusyAtUtc(m.id, startUtcStr, endUtcStr)) {
          busyCount++;
        }
      }

      let code = 'NO_MENTORS_AVAILABLE';
      let message = 'No mentors are available for this slot.';

      if (reachedDailyLimitCount > 0 && (reachedDailyLimitCount + busyCount >= candidateMentors.length)) {
        code = 'MENTOR_DAILY_LIMIT_REACHED';
        message = 'Available mentors for this subject have reached their daily limit of 2 demo classes for this date. Please select another time or date.';
      } else if (busyCount > 0) {
        code = 'SLOT_UNAVAILABLE';
        message = 'This time slot is no longer available. Another student may have just booked it. Please choose another time.';
      } else if (outOfHoursCount >= candidateMentors.length || candidateMentors.length === 0) {
        code = 'NO_MENTOR_AVAILABLE';
        message = 'No mentor is available for this time. Mentors may be outside their teaching hours or fully booked.';
      }

      const err = new Error(message);
      err.status = 409;
      err.code = code;
      throw err;
    }

    const bookingId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const meetingLink = `https://demo.example.com/class/${bookingId}`;
    const nowUtcIso = DateTime.utc().toISO();

    // Resolve or create parent record
    let resolvedParentId = parentId;
    if (!resolvedParentId) {
      const existingParent = db.prepare(`SELECT id FROM parents WHERE email = ?`).get(effectiveEmail);
      if (existingParent) {
        resolvedParentId = existingParent.id;
      } else {
        resolvedParentId = `parent_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO parents (id, name, email, created_at) VALUES (?, ?, ?, ?)
        `).run(resolvedParentId, effectiveParentName, effectiveEmail, nowUtcIso);
      }
    }

    // Insert booking into bookings table
    db.prepare(`
      INSERT INTO bookings (
        id, client_request_id, parent_id, parent_name, parent_email, child_name,
        subject_id, subject_title, parent_timezone, parent_local_datetime,
        mentor_id, mentor_name, mentor_timezone, mentor_local_date, mentor_local_time,
        slot_start_utc, slot_end_utc, start_time_utc, end_time_utc,
        meeting_link, dummy_class_link, duration_minutes, status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `).run(
      bookingId,
      clientRequestId || null,
      resolvedParentId,
      effectiveParentName,
      effectiveEmail,
      effectiveChildName,
      subject.id,
      subject.title,
      effectiveTimezone,
      parentLocalDatetimeStr,
      assignedMentor.id,
      assignedMentor.name,
      assignedMentor.timezone || MENTOR_TIMEZONE,
      mentorLocalDate,
      mentorLocalTime,
      startUtcStr,
      endUtcStr,
      startUtcStr,
      endUtcStr,
      meetingLink,
      meetingLink,
      CLASS_DURATION_MINUTES,
      'CONFIRMED',
      nowUtcIso
    );

    // Insert notification records for BOTH Parent and Assigned Mentor
    try {
      const mentorEmail = assignedMentor.email || 
        MENTORS.find(m => m.id === assignedMentor.id)?.email || 
        `${assignedMentor.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@codeyoung.com`;

      const parentTzDisplay = effectiveTimezone;
      const mentorTzDisplay = assignedMentor.timezone || MENTOR_TIMEZONE;
      const parentDateFormatted = parentInstant.toFormat('cccc, LLLL d, yyyy');
      const parentTimeFormatted = parentInstant.toFormat('h:mm a');

      const parentEmailBody = `Hello,

Your trial class for ${subject.title} is confirmed.

Student: ${effectiveChildName}
Course: ${subject.title}
Date: ${parentDateFormatted}
Parent time: ${parentTimeFormatted} — ${parentTzDisplay}
Mentor time: ${mentorLocalTime} — ${mentorTzDisplay}
Mentor: ${assignedMentor.name}
Duration: 30 minutes

Join your live class:
${meetingLink}`;

      const mentorEmailBody = `Hello ${assignedMentor.name},

You have been assigned a new 1:1 trial class for ${subject.title}.

Student: ${effectiveChildName}
Course: ${subject.title}
Date: ${parentDateFormatted}
Parent time: ${parentTimeFormatted} — ${parentTzDisplay}
Mentor time: ${mentorLocalTime} — ${mentorTzDisplay}
Duration: 30 minutes

Join your live class:
${meetingLink}`;

      // 1. Parent notification
      db.prepare(`
        INSERT INTO notifications (id, booking_id, recipient, type, subject, body, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `notif_p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        bookingId,
        effectiveEmail,
        'EMAIL',
        `Your Trial Class is Confirmed: ${subject.title}`,
        parentEmailBody,
        'SENT',
        nowUtcIso
      );

      // 2. Mentor notification (SAME meeting link!)
      db.prepare(`
        INSERT INTO notifications (id, booking_id, recipient, type, subject, body, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `notif_m_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        bookingId,
        mentorEmail,
        'EMAIL',
        `New Trial Class Assigned: ${subject.title}`,
        mentorEmailBody,
        'SENT',
        nowUtcIso
      );
    } catch (notifErr) {
      console.warn('[Notification Delivery Warning]:', notifErr.message);
    }

    const insertedRow = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(bookingId);
    return {
      isReplay: false,
      booking: insertedRow,
      assignedMentor
    };
  });

  const txResult = executeBookingAtomic();

  const formatted = formatBookingRecord(txResult.booking);
  if (txResult.isReplay) {
    return {
      isReplay: true,
      ...formatted,
      data: formatted
    };
  }

  return {
    isReplay: false,
    ...formatted,
    data: formatted
  };
}

/**
 * Retrieve booking by ID
 */
export function getBookingById(bookingId) {
  const row = queryOne(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
  if (!row) return null;
  return formatBookingRecord(row);
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

  const rows = queryAll(sql, params);
  return rows.map(formatBookingRecord);
}

/**
 * Get mentors summary with booking counts and availability status for a specific date
 */
export function getMentorsSummary(targetDateStr = null, timezone = null) {
  let mentorDate;
  if (targetDateStr) {
    if (timezone && isValidTimezone(timezone)) {
      const pDay = DateTime.fromISO(targetDateStr, { zone: timezone });
      mentorDate = pDay.isValid
        ? pDay.set({ hour: 9, minute: 0 }).setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd')
        : targetDateStr;
    } else {
      mentorDate = targetDateStr;
    }
  } else {
    mentorDate = DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');
  }

  const todayIst = DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');
  const isToday = (mentorDate === todayIst);

  return MENTORS.map(m => {
    const bookingsCount = getMentorBookingsForDate(m.id, mentorDate);
    return {
      ...m,
      currentDate: mentorDate,
      isToday,
      dailyCount: bookingsCount,
      bookingsToday: bookingsCount,
      bookingsForDate: bookingsCount,
      remainingClassesToday: Math.max(0, m.maxDailyClasses - bookingsCount),
      remainingClassesForDate: Math.max(0, m.maxDailyClasses - bookingsCount),
      isDailyLimitReached: bookingsCount >= m.maxDailyClasses
    };
  });
}
