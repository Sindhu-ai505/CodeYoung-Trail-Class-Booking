import express from 'express';
import { MENTORS, getMentorById } from '../data/mentors.js';
import { getMentorsSummary } from '../services/bookingService.js';

const router = express.Router();

/**
 * GET /api/mentors
 * Returns all 10 mentors with booking counts and availability for the requested date
 */
router.get('/', (req, res) => {
  const { date, timezone } = req.query;
  const mentors = getMentorsSummary(date || null, timezone || null);
  res.json({
    success: true,
    count: mentors.length,
    data: mentors
  });
});

/**
 * GET /api/mentors/:id
 */
router.get('/:id', (req, res) => {
  const mentor = getMentorById(req.params.id);
  if (!mentor) {
    return res.status(404).json({ success: false, message: 'Mentor not found' });
  }
  res.json({ success: true, data: mentor });
});

export default router;
