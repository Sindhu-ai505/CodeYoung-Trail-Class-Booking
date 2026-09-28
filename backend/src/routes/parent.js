import express from 'express';
import { DateTime } from 'luxon';
import { requireParentAuth } from '../middleware/auth.js';
import { queryAll, queryOne } from '../db.js';
import { formatBookingRecord } from '../services/bookingService.js';

const router = express.Router();

/**
 * GET /api/parent/bookings
 * Retrieves all bookings belonging to the currently authenticated parent
 * Enforces ownership: only returns sessions for req.parent.id / req.parent.email
 */
router.get('/bookings', requireParentAuth, (req, res) => {
  try {
    const parentId = req.parent.id;
    const parentEmail = req.parent.email;

    const rows = queryAll(
      `SELECT * FROM bookings 
       WHERE parent_id = ? OR (parent_id IS NULL AND parent_email = ?)
       ORDER BY start_time_utc DESC`,
      [parentId, parentEmail]
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

    res.json({
      success: true,
      count: rows.length,
      data: {
        upcoming,
        past,
        cancelled,
        all: rows
      }
    });
  } catch (err) {
    console.error('Error fetching parent bookings:', err);
    res.status(500).json({
      success: false,
      code: 'BOOKINGS_FETCH_FAILED',
      message: "We couldn't load your sessions right now. Please try again."
    });
  }
});

/**
 * GET /api/parent/bookings/:id
 * Retrieve a single booking with strict ownership validation
 */
router.get('/bookings/:id', requireParentAuth, (req, res) => {
  try {
    const booking = queryOne(`SELECT * FROM bookings WHERE id = ?`, [req.params.id]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'BOOKING_NOT_FOUND',
        message: `Booking #${req.params.id} does not exist.`
      });
    }

    // Enforce strict ownership: Parent A must NOT be able to access Parent B's booking
    const isOwner = (booking.parent_id && booking.parent_id === req.parent.id) ||
                    (booking.parent_email && booking.parent_email.toLowerCase() === req.parent.email.toLowerCase());

    if (!isOwner) {
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
    console.error('Error fetching booking by ID:', err);
    res.status(500).json({
      success: false,
      code: 'BOOKING_FETCH_FAILED',
      message: "We couldn't load this session right now. Please try again."
    });
  }
});

export default router;
