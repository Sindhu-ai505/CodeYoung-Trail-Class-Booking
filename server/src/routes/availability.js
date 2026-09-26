import express from 'express';
import { getAvailableSlots } from '../services/availabilityService.js';

const router = express.Router();

/**
 * GET /api/availability
 * Query params:
 * - subjectId (required)
 * - date (YYYY-MM-DD in parent timezone, required)
 * - parentTimezone (IANA timezone, required)
 */
router.get('/', (req, res) => {
  try {
    const { subjectId, date, parentTimezone } = req.query;

    if (!subjectId) {
      return res.status(400).json({ success: false, code: 'MISSING_PARAM', message: 'subjectId parameter is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, code: 'MISSING_PARAM', message: 'date parameter (YYYY-MM-DD) is required' });
    }
    if (!parentTimezone) {
      return res.status(400).json({ success: false, code: 'MISSING_PARAM', message: 'parentTimezone parameter is required' });
    }

    const availability = getAvailableSlots({
      subjectId,
      dateStr: date,
      parentTimezone
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'An error occurred while computing mentor availability'
    });
  }
});

export default router;
