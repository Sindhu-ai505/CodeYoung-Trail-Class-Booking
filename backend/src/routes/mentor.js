import express from 'express';
import { DateTime } from 'luxon';
import { requireMentorAuth } from '../middleware/auth.js';
import { queryAll, queryOne } from '../db.js';
import { formatBookingRecord } from '../services/bookingService.js';

const router = express.Router();

/**
 * GET /api/mentor/bookings
 * Retrieves all bookings assigned to the currently authenticated mentor.
 * Enforces ownership: only returns sessions where mentor_id = req.session.mentorId.
 * NEVER accepts mentorId from browser request input.
 */
router.get('/bookings', requireMentorAuth, (req, res) => {
  try {
    const mentorId = req.session.mentorId || req.mentor.id;

    // Strict backend query: ONLY bookings assigned to this mentor
    const rows = queryAll(
      `SELECT * FROM bookings 
       WHERE mentor_id = ?
       ORDER BY start_time_utc DESC`,
      [mentorId]
    );

    const formattedRows = rows.map(r => formatBookingRecord(r));
    const nowUtc = DateTime.utc().toISO();
    const upcoming = [];
    const past = [];
    const cancelled = [];

    for (const b of formattedRows) {
      if (b.status === 'CANCELLED') {
        cancelled.push(b);
      } else if (b.end_time_utc < nowUtc || b.status === 'COMPLETED') {
        past.push(b);
      } else {
        upcoming.push(b);
      }
    }

    // Sort upcoming ascending (nearest trial class first)
    upcoming.sort((a, b) => (a.slot_start_utc || a.start_time_utc).localeCompare(b.slot_start_utc || b.start_time_utc));

    // Sort past descending (most recent past trial first)
    past.sort((a, b) => (b.slot_start_utc || b.start_time_utc).localeCompare(a.slot_start_utc || a.start_time_utc));

    // Real daily capacity calculation for this mentor on their local calendar date (IST)
    const todayIST = DateTime.now().setZone('Asia/Kolkata').toFormat('yyyy-MM-dd');
    const todayRow = queryOne(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE mentor_id = ? AND mentor_local_date = ? AND status = 'CONFIRMED'`,
      [mentorId, todayIST]
    );
    const bookedToday = todayRow ? todayRow.count : 0;
    const maxDaily = req.mentor.maxDailyClasses || 2;
    const remainingToday = Math.max(0, maxDaily - bookedToday);
    const isLimitReached = bookedToday >= maxDaily;

    const todayCapacity = {
      date: todayIST,
      bookedToday,
      maxDailyClasses: maxDaily,
      remainingClassesToday: remainingToday,
      isDailyLimitReached: isLimitReached,
      statusLabel: isLimitReached ? 'Daily capacity reached' : (remainingToday === 1 ? '1 session remaining' : 'Available')
    };

    res.json({
      success: true,
      mentor: {
        id: req.mentor.id,
        name: req.mentor.name,
        email: req.mentor.email,
        role: req.mentor.role,
        specialization: req.mentor.specialization,
        timezone: req.mentor.timezone
      },
      count: formattedRows.length,
      todayCapacity,
      data: {
        upcoming,
        past,
        cancelled,
        all: formattedRows,
        todayCapacity
      }
    });
  } catch (err) {
    console.error('Error fetching mentor bookings:', err);
    res.status(500).json({
      success: false,
      code: 'BOOKINGS_FETCH_FAILED',
      message: "We couldn't load your mentor schedule right now. Please try again."
    });
  }
});

/**
 * GET /api/mentor/bookings/:id
 * Retrieve a single booking with strict mentor ownership validation.
 * Verifies booking.mentor_id === session.mentorId; prevents cross-mentor inspection.
 */
router.get('/bookings/:id', requireMentorAuth, (req, res) => {
  try {
    const booking = queryOne(`SELECT * FROM bookings WHERE id = ?`, [req.params.id]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'BOOKING_NOT_FOUND',
        message: `Booking #${req.params.id} does not exist.`
      });
    }

    const mentorId = req.session.mentorId || req.mentor.id;

    // Strict ownership enforcement: Mentor A CANNOT view Mentor B's booking
    if (booking.mentor_id !== mentorId) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to view this booking.'
      });
    }

    res.json({
      success: true,
      data: formatBookingRecord(booking)
    });
  } catch (err) {
    console.error('Error fetching mentor booking by ID:', err);
    res.status(500).json({
      success: false,
      code: 'BOOKING_FETCH_FAILED',
      message: "We couldn't load this booking right now. Please try again."
    });
  }
});

/**
 * GET /api/mentor/me
 * Retrieve currently authenticated mentor profile
 */
router.get('/me', requireMentorAuth, (req, res) => {
  res.json({
    success: true,
    role: 'mentor',
    mentor: req.mentor
  });
});

export default router;
