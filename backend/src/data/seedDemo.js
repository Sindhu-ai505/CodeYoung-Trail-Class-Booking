import { DateTime } from 'luxon';
import { MENTORS } from './mentors.js';
import { SUBJECTS } from './subjects.js';
import { run, queryAll, queryOne } from '../db.js';
import { MENTOR_TIMEZONE } from '../services/availabilityService.js';

export function seedRealisticDemoSchedule(targetDate = null) {
  const todayIst = targetDate || DateTime.now().setZone(MENTOR_TIMEZONE).toFormat('yyyy-MM-dd');

  // Check if we already have bookings for today
  const existingToday = queryAll(
    `SELECT id FROM bookings WHERE mentor_local_date = ? AND status = 'CONFIRMED'`,
    [todayIst]
  );

  if (existingToday.length > 0) {
    return {
      message: `Database already has ${existingToday.length} bookings for ${todayIst}. No action taken.`,
      count: existingToday.length
    };
  }

  const sampleBookings = [
    // 1. Sneha Roy has 1 booking at 10:30 AM IST (Subject: AI & ML)
    {
      mentorId: 'mentor_01',
      subjectId: 'ai_ml',
      hour: 10,
      minute: 30,
      child: 'Aarav Gupta',
      parent: 'Sunita Gupta',
      parentEmail: 'sunita.gupta@example.com'
    },
    // 2. Aarav Sharma has 2 bookings today (REACHED 2-CLASS DAILY LIMIT!)
    {
      mentorId: 'mentor_02',
      subjectId: 'game_development',
      hour: 13,
      minute: 0,
      child: 'Liam Smith',
      parent: 'Robert Smith',
      parentEmail: 'robert.smith@example.co.uk'
    },
    {
      mentorId: 'mentor_02',
      subjectId: 'coding_programming',
      hour: 15,
      minute: 0,
      child: 'Sophia Taylor',
      parent: 'Emma Taylor',
      parentEmail: 'emma.taylor@example.com'
    },
    // 3. Priya Nair has 1 booking at 11:30 AM IST (Subject: Web Dev)
    {
      mentorId: 'mentor_03',
      subjectId: 'web_development',
      hour: 11,
      minute: 30,
      child: 'Noah Williams',
      parent: 'Mark Williams',
      parentEmail: 'mark.williams@example.com'
    },
    // 4. Vikram Patel has 1 booking at 10:00 AM IST (Subject: Web Dev)
    {
      mentorId: 'mentor_06',
      subjectId: 'web_development',
      hour: 10,
      minute: 0,
      child: 'Lucas Brown',
      parent: 'Sarah Brown',
      parentEmail: 'sarah.brown@example.com'
    },
    // 5. Kavya Menon has 1 booking at 11:00 AM IST (Subject: Robotics)
    {
      mentorId: 'mentor_09',
      subjectId: 'robotics',
      hour: 11,
      minute: 0,
      child: 'Diya Patel',
      parent: 'Rajesh Patel',
      parentEmail: 'rajesh.patel@example.com'
    }
  ];

  const seeded = [];

  for (const item of sampleBookings) {
    const mentor = MENTORS.find(m => m.id === item.mentorId);
    const subject = SUBJECTS.find(s => s.id === item.subjectId);
    if (!mentor || !subject) continue;

    const startIst = DateTime.fromISO(
      `${todayIst}T${String(item.hour).padStart(2, '0')}:${String(item.minute).padStart(2, '0')}:00`,
      { zone: MENTOR_TIMEZONE }
    );
    const endIst = startIst.plus({ minutes: 30 });
    const startUtc = startIst.toUTC().toISO();
    const endUtc = endIst.toUTC().toISO();
    const bookingId = `demo_${mentor.id}_${item.hour}_${Date.now().toString(36).slice(-4)}`;
    const dummyLink = `https://demo.example.com/class/${bookingId}`;

    const normEmail = item.parentEmail.trim().toLowerCase();
    let parent = queryOne(`SELECT id FROM parents WHERE email = ?`, [normEmail]);
    if (!parent) {
      const parentId = `parent_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      run(
        `INSERT INTO parents (id, name, email, created_at) VALUES (?, ?, ?, ?)`,
        [parentId, item.parent, normEmail, DateTime.utc().toISO()]
      );
      parent = { id: parentId };
    }

    run(
      `INSERT INTO bookings (
        id, parent_id, parent_name, parent_email, child_name, subject_id, subject_title,
        parent_timezone, parent_local_datetime, mentor_id, mentor_name,
        mentor_timezone, mentor_local_date, mentor_local_time,
        start_time_utc, end_time_utc, duration_minutes, dummy_class_link,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        parent.id,
        item.parent,
        normEmail,
        item.child,
        subject.id,
        subject.title,
        'America/New_York',
        startIst.setZone('America/New_York').toFormat('cccc, LLLL d, yyyy • h:mm a'),
        mentor.id,
        mentor.name,
        MENTOR_TIMEZONE,
        todayIst,
        startIst.toFormat('h:mm a'),
        startUtc,
        endUtc,
        30,
        dummyLink,
        'CONFIRMED',
        DateTime.utc().toISO()
      ]
    );

    seeded.push({
      id: bookingId,
      mentor: mentor.name,
      time: startIst.toFormat('h:mm a')
    });
  }

  // Seed a sample past completed session for Sunita Gupta (10 days ago) to demonstrate past session display
  const sunitaParent = queryOne(`SELECT id FROM parents WHERE email = ?`, ['sunita.gupta@example.com']);
  if (sunitaParent) {
    const existingPast = queryOne(`SELECT id FROM bookings WHERE parent_id = ? AND status = 'COMPLETED'`, [sunitaParent.id]);
    if (!existingPast) {
      const pastStartIst = DateTime.now().setZone(MENTOR_TIMEZONE).minus({ days: 10 }).set({ hour: 11, minute: 0, second: 0 });
      const pastEndIst = pastStartIst.plus({ minutes: 30 });
      const pastBookingId = `demo_past_sunita_${Date.now().toString(36)}`;
      run(
        `INSERT INTO bookings (
          id, parent_id, parent_name, parent_email, child_name, subject_id, subject_title,
          parent_timezone, parent_local_datetime, mentor_id, mentor_name,
          mentor_timezone, mentor_local_date, mentor_local_time,
          start_time_utc, end_time_utc, duration_minutes, dummy_class_link,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pastBookingId,
          sunitaParent.id,
          'Sunita Gupta',
          'sunita.gupta@example.com',
          'Aarav Gupta',
          'coding_programming',
          'Python & Logic Building',
          'America/New_York',
          pastStartIst.setZone('America/New_York').toFormat('cccc, LLLL d, yyyy • h:mm a'),
          'mentor_02',
          'Aarav Sharma',
          MENTOR_TIMEZONE,
          pastStartIst.toFormat('yyyy-MM-dd'),
          pastStartIst.toFormat('h:mm a'),
          pastStartIst.toUTC().toISO(),
          pastEndIst.toUTC().toISO(),
          30,
          `https://demo.example.com/class/${pastBookingId}`,
          'COMPLETED',
          pastStartIst.toUTC().toISO()
        ]
      );
    }
  }

  return {
    success: true,
    message: `Seeded ${seeded.length} realistic bookings for ${todayIst} demonstrating varying mentor availability, busy slots, and Aarav Sharma's 2-class daily limit.`,
    seeded
  };
}
