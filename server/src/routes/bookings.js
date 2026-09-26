import express from 'express';
import {
  createBooking,
  getBookingById,
  getAllBookings
} from '../services/bookingService.js';

const router = express.Router();

/**
 * POST /api/bookings
 * Create new trial class booking
 */
router.post('/', async (req, res) => {
  try {
    const {
      parentName,
      parentEmail,
      childName,
      subjectId,
      parentTimezone,
      utcStartIso
    } = req.body;

    const booking = await createBooking({
      parentName,
      parentEmail,
      childName,
      subjectId,
      parentTimezone,
      utcStartIso
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      code: err.code || 'BOOKING_FAILED',
      message: err.message || 'Unable to confirm trial class booking at this time'
    });
  }
});

/**
 * GET /api/bookings/:id
 * Retrieve specific booking
 */
router.get('/:id', (req, res) => {
  const booking = getBookingById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      code: 'BOOKING_NOT_FOUND',
      message: `Booking #${req.params.id} does not exist.`
    });
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

export default router;
