import express from 'express';
import { SUBJECTS } from '../data/subjects.js';
import { MENTORS } from '../data/mentors.js';

const router = express.Router();

/**
 * GET /api/subjects
 * Returns all subjects enriched with mentor count and mentor names
 */
router.get('/', (req, res) => {
  const enriched = SUBJECTS.map(subject => {
    const qualifiedMentors = MENTORS.filter(m => m.supportedSubjects.includes(subject.id));
    return {
      ...subject,
      qualifiedMentorCount: qualifiedMentors.length,
      mentors: qualifiedMentors.map(m => ({ id: m.id, name: m.name, role: m.role }))
    };
  });

  res.json({
    success: true,
    data: enriched
  });
});

export default router;
