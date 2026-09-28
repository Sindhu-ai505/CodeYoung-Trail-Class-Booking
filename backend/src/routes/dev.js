import express from 'express';
import { DateTime } from 'luxon';
import { MENTORS } from '../data/mentors.js';
import { SUBJECTS } from '../data/subjects.js';
import { resetDb, run, queryAll, queryOne } from '../db.js';
import {
  MENTOR_TIMEZONE,
  getSystemBookingsForDate,
  isValidTimezone
} from '../services/availabilityService.js';

import { seedRealisticDemoSchedule } from '../data/seedDemo.js';

const router = express.Router();

/**
 * POST /api/dev/reset
 * Reset all bookings to start fresh
 */
router.post('/reset', (req, res) => {
  resetDb();
  res.json({
    success: true,
    message: 'All trial class bookings have been successfully reset.'
  });
});

/**
 * POST /api/dev/seed-demo-schedule
 * Seeds realistic bookings for today showing Aarav Sharma at daily limit and varying active slots
 */
router.post('/seed-demo-schedule', (req, res) => {
  const result = seedRealisticDemoSchedule();
  res.json(result);
});

/**
 * POST /api/dev/seed-mentor-limit
 * Pre-fills 2 bookings for all mentors supporting a subject on a given date (or today in IST)
 * This allows the evaluator to instantly trigger the "MENTOR_DAILY_LIMIT_REACHED" error!
 */
router.post('/seed-mentor-limit', (req, res) => {
  const { subjectId = 'ai_ml', date } = req.body;
  const targetDate = date || DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');

  // Find mentors who support this subject
  const subjectMentors = MENTORS.filter(m => m.supportedSubjects.includes(subjectId));
  const seeded = [];

  for (const mentor of subjectMentors) {
    // Check existing count
    const existing = queryAll(
      `SELECT id FROM bookings WHERE mentor_id = ? AND mentor_local_date = ? AND status = 'CONFIRMED'`,
      [mentor.id, targetDate]
    );

    const needed = Math.max(0, 2 - existing.length);
    for (let i = 0; i < needed; i++) {
      const slotHour = 10 + (existing.length + i) * 2;
      const startIst = DateTime.fromISO(`${targetDate}T${String(slotHour).padStart(2, '0')}:00:00`, { zone: MENTOR_TIMEZONE });
      const endIst = startIst.plus({ minutes: 30 });
      const startUtc = startIst.toUTC().toISO();
      const endUtc = endIst.toUTC().toISO();
      const bookingId = `seed_limit_${mentor.id}_${i}_${Date.now().toString(36)}`;

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
          `Test Parent for ${mentor.name}`,
          `test.parent.${mentor.id}@example.com`,
          `Child ${i + 1}`,
          subjectId,
          SUBJECTS.find(s => s.id === subjectId)?.title || 'Trial Class',
          MENTOR_TIMEZONE,
          `${targetDate} • ${startIst.toFormat('h:mm a')}`,
          mentor.id,
          mentor.name,
          MENTOR_TIMEZONE,
          targetDate,
          startIst.toFormat('h:mm a'),
          startUtc,
          endUtc,
          30,
          `https://demo.example.com/class/${bookingId}`,
          'CONFIRMED',
          DateTime.utc().toISO()
        ]
      );
      seeded.push({ mentorId: mentor.id, mentorName: mentor.name, date: targetDate });
    }
  }

  res.json({
    success: true,
    message: `Seeded ${seeded.length} bookings to max out all mentors for subject '${subjectId}' on ${targetDate}. New bookings for this subject will now trigger MENTOR_DAILY_LIMIT_REACHED.`,
    seeded
  });
});

/**
 * POST /api/dev/seed-capacity-limit
 * Pre-fills 20 bookings across all 10 mentors on a given date to test DAILY_CAPACITY_REACHED
 */
router.post('/seed-capacity-limit', (req, res) => {
  const { date } = req.body;
  const targetDate = date || DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');
  const seeded = [];

  for (const mentor of MENTORS) {
    const existing = queryAll(
      `SELECT id FROM bookings WHERE mentor_id = ? AND mentor_local_date = ? AND status = 'CONFIRMED'`,
      [mentor.id, targetDate]
    );

    const needed = Math.max(0, 2 - existing.length);
    for (let i = 0; i < needed; i++) {
      const slotHour = 11 + (existing.length + i) * 3;
      const startIst = DateTime.fromISO(`${targetDate}T${String(slotHour).padStart(2, '0')}:00:00`, { zone: MENTOR_TIMEZONE });
      const endIst = startIst.plus({ minutes: 30 });
      const bookingId = `seed_cap_${mentor.id}_${i}_${Date.now().toString(36)}`;

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
          `Capacity Test Parent`,
          `capacity.test@example.com`,
          `Capacity Child`,
          mentor.supportedSubjects[0],
          'Capacity Test',
          MENTOR_TIMEZONE,
          `${targetDate} • ${startIst.toFormat('h:mm a')}`,
          mentor.id,
          mentor.name,
          MENTOR_TIMEZONE,
          targetDate,
          startIst.toFormat('h:mm a'),
          startIst.toUTC().toISO(),
          endIst.toUTC().toISO(),
          30,
          `https://demo.example.com/class/${bookingId}`,
          'CONFIRMED',
          DateTime.utc().toISO()
        ]
      );
      seeded.push(mentor.id);
    }
  }

  const total = getSystemBookingsForDate(targetDate);

  res.json({
    success: true,
    message: `Seeded system to full daily capacity (20 trial classes) for date ${targetDate}. Total system bookings on that date: ${total}/20.`,
    totalBookings: total
  });
});

/**
 * GET /api/dev/stats
 * Evaluator diagnostic stats - supports date-scoped query: ?date=YYYY-MM-DD&timezone=IANA
 */
router.get('/stats', (req, res) => {
  const { date, timezone } = req.query;
  const parentTz = (timezone && isValidTimezone(timezone)) ? timezone : 'America/New_York';
  const todayParentStr = DateTime.now().setZone(parentTz).toFormat('yyyy-MM-dd');
  const targetDateStr = date || todayParentStr;

  const parentDay = DateTime.fromISO(targetDateStr, { zone: parentTz });
  const targetMentorDate = parentDay.isValid
    ? parentDay.set({ hour: 9, minute: 0 }).setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd')
    : targetDateStr;

  const todayIst = DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');
  const dateBookingsCount = getSystemBookingsForDate(targetMentorDate);
  const todayBookingsCount = getSystemBookingsForDate(todayIst);
  const totalAllTimeRow = queryOne(`SELECT COUNT(*) as count FROM bookings WHERE status = 'CONFIRMED'`);

  const isToday = (targetDateStr === todayParentStr);
  const formattedDate = parentDay.isValid ? parentDay.toFormat('LLLL d') : targetDateStr;
  const capacityRemainingOnDate = Math.max(0, 20 - dateBookingsCount);

  res.json({
    success: true,
    data: {
      selectedDate: targetDateStr,
      targetMentorDate,
      isToday,
      formattedDate,
      dateBookingsCount,
      dailyCapacity: 20,
      capacityRemainingOnDate,
      availabilityLabel: isToday
        ? `Today's Availability: ${capacityRemainingOnDate} slots remaining (${dateBookingsCount}/20 booked)`
        : `${formattedDate} Availability: ${capacityRemainingOnDate} slots remaining (${dateBookingsCount}/20 booked)`,
      todayDateIst: todayIst,
      todayBookingsCount,
      capacityRemainingToday: Math.max(0, 20 - todayBookingsCount),
      totalAllTimeBookings: totalAllTimeRow ? totalAllTimeRow.count : 0,
      totalMentors: MENTORS.length,
      mentorTimezone: MENTOR_TIMEZONE
    }
  });
});

export default router;
