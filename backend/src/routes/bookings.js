import express from 'express';
import { DateTime } from 'luxon';
import {
  createBooking,
  getBookingById,
  getAllBookings,
  formatBookingRecord
} from '../services/bookingService.js';
import { optionalAuth } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { getQuestionsForSubject } from '../data/learningCheckQuestions.js';
import { validateEmail, INVALID_EMAIL_CODE, INVALID_EMAIL_MESSAGE } from '../utils/validation.js';

const router = express.Router();

/**
 * POST /api/bookings
 * Create new trial class booking with idempotency key protection and atomic execution
 */
router.post('/', optionalAuth, async (req, res) => {
  const db = getDb();
  const clientRequestId = req.body.clientRequestId
    || req.body.client_request_id
    || req.headers['x-client-request-id']
    || null;

  // 1. Idempotency Pre-Check:
  // Before running the availability check, look up whether a booking with that client_request_id already exists.
  // If yes, return that existing booking's data with 200 OK (idempotent replay)
  if (clientRequestId) {
    try {
      const existing = db.prepare(`SELECT * FROM bookings WHERE client_request_id = ?`).get(clientRequestId);
      if (existing) {
        return res.status(200).json({
          success: true,
          data: formatBookingRecord(existing),
          idempotentReplay: true
        });
      }
    } catch (lookupErr) {
      console.warn('[Bookings Route] Error during idempotency pre-lookup:', lookupErr.message);
    }
  }

  try {
    const {
      parentName,
      parentEmail,
      childName,
      subjectId,
      parentTimezone,
      utcStartIso,
      slotStartUTC,
      slotEndUTC
    } = req.body;

    const resolvedParentId = req.parent ? req.parent.id : (req.body.parentId || null);
    const resolvedParentName = req.parent ? req.parent.name : parentName;
    const resolvedParentEmail = req.parent ? req.parent.email : parentEmail;

    if (!resolvedParentEmail || !validateEmail(resolvedParentEmail)) {
      return res.status(400).json({
        success: false,
        code: INVALID_EMAIL_CODE,
        message: INVALID_EMAIL_MESSAGE
      });
    }

    const result = await createBooking({
      clientRequestId,
      parentId: resolvedParentId,
      parentName: resolvedParentName,
      parentEmail: resolvedParentEmail,
      childName,
      subjectId,
      parentTimezone,
      utcStartIso: slotStartUTC || utcStartIso,
      slotEndUTC
    });

    const isReplay = result.isReplay === true;
    const statusCode = isReplay ? 200 : 201;

    res.status(statusCode).json({
      success: true,
      data: result.data || result,
      ...(isReplay ? { idempotentReplay: true } : {})
    });
  } catch (err) {
    // If unique constraint violation happened due to a concurrent race condition,
    // catch the SQLite constraint error and return the existing booking with 200 OK rather than 500
    if (clientRequestId && (
      err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      err.code === 'SQLITE_CONSTRAINT' ||
      (err.message && err.message.includes('client_request_id'))
    )) {
      try {
        const existing = db.prepare(`SELECT * FROM bookings WHERE client_request_id = ?`).get(clientRequestId);
        if (existing) {
          return res.status(200).json({
            success: true,
            data: formatBookingRecord(existing),
            idempotentReplay: true
          });
        }
      } catch (raceErr) {
        // Fall through to error handler
      }
    }

    const status = err.status || 500;
    let code = err.code || 'BOOKING_FAILED';
    if (status === 409) {
      code = 'NO_MENTORS_AVAILABLE';
    }
    res.status(status).json({
      success: false,
      code,
      message: err.message || 'Unable to confirm trial class booking at this time'
    });
  }
});

/**
 * GET /api/bookings/:id
 * Retrieve specific booking
 */
router.get('/:id', optionalAuth, (req, res) => {
  const booking = getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      code: 'BOOKING_NOT_FOUND',
      message: `Booking #${req.params.id} does not exist.`
    });
  }

  // Enforce parent ownership if user is authenticated as parent
  if (req.userRole === 'parent' && req.parent) {
    const isOwner = (booking.parent_id && booking.parent_id === req.parent.id) ||
                    (booking.parentId && booking.parentId === req.parent.id) ||
                    (booking.parent_email && booking.parent_email.toLowerCase() === req.parent.email.toLowerCase()) ||
                    (booking.parentEmail && booking.parentEmail.toLowerCase() === req.parent.email.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this booking.'
      });
    }
  }

  // Enforce mentor ownership if user is authenticated as mentor
  if (req.userRole === 'mentor' && req.mentor) {
    const isOwner = (booking.mentor_id && booking.mentor_id === req.mentor.id) ||
                    (booking.mentorId && booking.mentorId === req.mentor.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this booking.'
      });
    }
  }

  res.json({
    success: true,
    data: booking
  });
});

/**
 * GET /api/bookings
 * Retrieve all bookings (for Admin / Evaluator inspection)
 */
router.get('/', (req, res) => {
  const { limit, date } = req.query;
  const bookings = getAllBookings({
    limit: limit ? parseInt(limit, 10) : 50,
    date: date || null
  });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

/**
 * POST /api/bookings/:id/complete
 * Mark booking trial class as completed (e.g. when student leaves the classroom)
 */
router.post('/:id/complete', optionalAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' });
  }

  // Ownership verification if authenticated
  if (req.userRole === 'parent' && req.parent) {
    const isOwner = (booking.parent_id && booking.parent_id === req.parent.id) ||
                    (booking.parent_email && booking.parent_email.toLowerCase() === req.parent.email.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied.' });
    }
  } else if (req.userRole === 'mentor' && req.mentor) {
    if (booking.mentor_id !== req.mentor.id) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied.' });
    }
  }

  db.prepare(`UPDATE bookings SET status = 'COMPLETED' WHERE id = ?`).run(booking.id);
  const updated = formatBookingRecord(db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(booking.id));

  res.json({
    success: true,
    status: 'COMPLETED',
    data: updated
  });
});

/**
 * GET /api/bookings/:id/learning-check
 * Retrieves course-specific learning check questions or previous result
 */
router.get('/:id/learning-check', optionalAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' });
  }

  // Ownership verification
  if (req.userRole === 'parent' && req.parent) {
    const isOwner = (booking.parent_id && booking.parent_id === req.parent.id) ||
                    (booking.parent_email && booking.parent_email.toLowerCase() === req.parent.email.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied.' });
    }
  } else if (req.userRole === 'mentor' && req.mentor) {
    if (booking.mentor_id !== req.mentor.id) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied.' });
    }
  }

  // Check if already completed
  const existingCheck = db.prepare(`SELECT * FROM learning_checks WHERE booking_id = ?`).get(booking.id);
  const bank = getQuestionsForSubject(booking.subject_id || booking.subject_title);

  if (existingCheck) {
    const answers = JSON.parse(existingCheck.answers_json || '{}');
    const review = bank.questions.map(q => {
      const selected = answers[q.id];
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        selectedAnswer: selected !== undefined ? selected : null,
        correctAnswer: q.correctAnswer,
        isCorrect: selected === q.correctAnswer,
        explanation: q.explanation
      };
    });

    return res.json({
      success: true,
      completed: true,
      data: {
        id: existingCheck.id,
        bookingId: existingCheck.booking_id,
        studentName: existingCheck.student_name,
        courseTitle: existingCheck.course_title,
        mentorId: existingCheck.mentor_id,
        score: existingCheck.score,
        totalQuestions: existingCheck.total_questions,
        percentage: existingCheck.percentage,
        feedback: existingCheck.feedback,
        submittedAt: existingCheck.submitted_at,
        review
      }
    });
  }

  // Not yet completed: send questions without correct answers to prevent leakage
  res.json({
    success: true,
    completed: false,
    data: {
      bookingId: booking.id,
      courseId: bank.courseId,
      courseTitle: bank.courseTitle,
      studentName: booking.child_name || 'Student',
      mentorName: booking.mentor_name || 'Mentor',
      totalQuestions: bank.questions.length,
      questions: bank.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    }
  });
});

/**
 * POST /api/bookings/:id/learning-check
 * Submit student responses for post-class learning check
 */
router.post('/:id/learning-check', optionalAuth, (req, res) => {
  const db = getDb();
  const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' });
  }

  // Ownership verification
  if (req.userRole === 'parent' && req.parent) {
    const isOwner = (booking.parent_id && booking.parent_id === req.parent.id) ||
                    (booking.parent_email && booking.parent_email.toLowerCase() === req.parent.email.toLowerCase());
    if (!isOwner) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied.' });
    }
  } else if (req.userRole === 'mentor' && req.mentor) {
    if (booking.mentor_id !== req.mentor.id) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Access denied.' });
    }
  }

  const answers = req.body.answers || {};
  const bank = getQuestionsForSubject(booking.subject_id || booking.subject_title);

  let score = 0;
  const totalQuestions = bank.questions.length;
  const review = [];

  for (const q of bank.questions) {
    const selected = answers[q.id];
    const isCorrect = selected === q.correctAnswer;
    if (isCorrect) score++;

    review.push({
      id: q.id,
      question: q.question,
      options: q.options,
      selectedAnswer: selected !== undefined ? selected : null,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation
    });
  }

  const percentage = Math.round((score / totalQuestions) * 100);

  let feedback = 'Great start! You understood the core ideas covered in today\'s trial.';
  if (percentage < 60) {
    feedback = 'Nice work trying today\'s check. There are a couple of concepts worth revisiting.';
  } else if (percentage < 80) {
    feedback = 'Good effort! You grasped several key ideas from the class.';
  }

  const checkId = `lc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = DateTime.utc().toISO();

  db.prepare(`
    INSERT INTO learning_checks (
      id, booking_id, parent_id, student_name, course_id, course_title, mentor_id,
      score, total_questions, percentage, answers_json, feedback, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(booking_id) DO UPDATE SET
      score = excluded.score,
      total_questions = excluded.total_questions,
      percentage = excluded.percentage,
      answers_json = excluded.answers_json,
      feedback = excluded.feedback,
      submitted_at = excluded.submitted_at
  `).run(
    checkId,
    booking.id,
    booking.parent_id,
    booking.child_name || 'Student',
    bank.courseId,
    bank.courseTitle,
    booking.mentor_id,
    score,
    totalQuestions,
    percentage,
    JSON.stringify(answers),
    feedback,
    nowIso
  );

  // Mark booking completed in the database
  db.prepare(`UPDATE bookings SET status = 'COMPLETED' WHERE id = ?`).run(booking.id);

  res.json({
    success: true,
    data: {
      id: checkId,
      bookingId: booking.id,
      studentName: booking.child_name,
      courseTitle: bank.courseTitle,
      mentorName: booking.mentor_name,
      score,
      totalQuestions,
      percentage,
      feedback,
      submittedAt: nowIso,
      review
    }
  });
});

export default router;
