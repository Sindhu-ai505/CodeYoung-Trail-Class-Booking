import { test, describe, beforeAll, afterAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, getDb } from '../src/db/index.js';
import { seedMentors } from '../src/db/seed.js';
import { createApp } from '../src/app.js';

describe('Trial Class Notifications & Learning Check', () => {
  let app;
  let server;
  let baseUrl;

  beforeAll(async () => {
    const db = await initDb(':memory:');
    seedMentors(db);
    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(r => server.close(r));
    }
  });

  beforeEach(() => {
    resetDb();
    seedMentors();
  });

  const getValidUtcTomorrow = () => {
    return DateTime.now()
      .setZone('Asia/Kolkata')
      .plus({ days: 1 })
      .set({ hour: 11, minute: 0, second: 0, millisecond: 0 })
      .toUTC()
      .toISO();
  };

  test('delivers matching class link notifications to both parent and assigned mentor', async () => {
    const utcStart = getValidUtcTomorrow();

    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Sarah Jenkins',
        parentEmail: 'sarah.jenkins@example.com',
        childName: 'Leo',
        subjectId: 'ai_ml',
        parentTimezone: 'America/New_York',
        utcStartIso: utcStart
      })
    });

    const json = await res.json();
    assert.equal(res.status, 201);
    assert.equal(json.success, true);

    const booking = json.data;
    assert.match(booking.meetingLink, /^https:\/\/demo\.example\.com\/class\/bk_/);
    assert.ok(booking.mentorEmail);
    assert.match(booking.mentorEmail, /@codeyoung\.com$/);

    // Verify notificationDelivery receipt on booking record
    assert.ok(booking.notificationDelivery);
    assert.equal(booking.notificationDelivery.parent.recipient, 'sarah.jenkins@example.com');
    assert.equal(booking.notificationDelivery.parent.status, 'SENT');
    assert.equal(booking.notificationDelivery.mentor.recipient, booking.mentorEmail);
    assert.equal(booking.notificationDelivery.mentor.status, 'SENT');

    // Verify notifications table in DB
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM notifications WHERE booking_id = ? ORDER BY recipient ASC`).all(booking.id);
    assert.equal(rows.length, 2);

    const parentNotif = rows.find(r => r.recipient === 'sarah.jenkins@example.com');
    const mentorNotif = rows.find(r => r.recipient === booking.mentorEmail);

    assert.ok(parentNotif);
    assert.ok(mentorNotif);

    // Check notification bodies contain required information
    assert.ok(parentNotif.body.includes('Leo'));
    assert.ok(parentNotif.body.includes('AI & Machine Learning'));
    assert.ok(parentNotif.body.includes(booking.meetingLink));
    assert.ok(parentNotif.body.includes('30 minutes'));
    assert.ok(parentNotif.body.includes(booking.mentorName));

    assert.ok(mentorNotif.body.includes('Leo'));
    assert.ok(mentorNotif.body.includes('AI & Machine Learning'));
    assert.ok(mentorNotif.body.includes(booking.meetingLink));
    assert.ok(mentorNotif.body.includes('30 minutes'));

    // Both must share the EXACT SAME meeting link
    assert.ok(parentNotif.body.includes(booking.meetingLink));
    assert.ok(mentorNotif.body.includes(booking.meetingLink));
  });

  test('serves course-specific learning check questions without exposing answer keys', async () => {
    const utcStart = getValidUtcTomorrow();

    // 1. Create Web Development booking
    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'David Miller',
        parentEmail: 'david.miller@example.com',
        childName: 'Emma',
        subjectId: 'web_development',
        parentTimezone: 'America/New_York',
        utcStartIso: utcStart
      })
    });

    const json = await res.json();
    assert.equal(res.status, 201);
    const booking = json.data;

    // 2. Fetch learning check questions
    const checkRes = await fetch(`${baseUrl}/api/bookings/${booking.id}/learning-check`);
    const checkJson = await checkRes.json();

    assert.equal(checkRes.status, 200);
    assert.equal(checkJson.success, true);
    assert.equal(checkJson.completed, false);
    assert.equal(checkJson.data.courseTitle, 'Web Development');
    assert.equal(checkJson.data.studentName, 'Emma');
    assert.equal(checkJson.data.questions.length, 5);

    // Verify questions are web dev specific and do not leak correctAnswer index
    const firstQ = checkJson.data.questions[0];
    assert.ok(firstQ.question.includes('HTML'));
    assert.equal(firstQ.options.length, 4);
    assert.equal(firstQ.correctAnswer, undefined);
    assert.equal(firstQ.explanation, undefined);
  });

  test('grades submitted answers, calculates score, and persists result against the booking', async () => {
    const utcStart = getValidUtcTomorrow();

    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Ravi Patel',
        parentEmail: 'ravi.patel@example.com',
        childName: 'Aryan',
        subjectId: 'coding_programming',
        parentTimezone: 'America/New_York',
        utcStartIso: utcStart
      })
    });

    const json = await res.json();
    const booking = json.data;

    // Submit answers: 4 correct (0, 0, 0, 0), 1 incorrect (1)
    const submitRes = await fetch(`${baseUrl}/api/bookings/${booking.id}/learning-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: {
          cp_q1: 0, // correct
          cp_q2: 0, // correct
          cp_q3: 0, // correct
          cp_q4: 0, // correct
          cp_q5: 1  // incorrect (correct is 0)
        }
      })
    });

    const submitJson = await submitRes.json();
    assert.equal(submitRes.status, 200);
    assert.equal(submitJson.success, true);

    const result = submitJson.data;
    assert.equal(result.score, 4);
    assert.equal(result.totalQuestions, 5);
    assert.equal(result.percentage, 80);
    assert.ok(result.feedback.includes('Great start'));
    assert.equal(result.review.length, 5);
    assert.equal(result.review[0].isCorrect, true);
    assert.equal(result.review[4].isCorrect, false);
    assert.equal(result.review[4].correctAnswer, 0);

    // Verify DB persistence
    const db = getDb();
    const lcRow = db.prepare(`SELECT * FROM learning_checks WHERE booking_id = ?`).get(booking.id);
    assert.ok(lcRow);
    assert.equal(lcRow.score, 4);
    assert.equal(lcRow.course_id, 'coding_programming');

    // Verify booking status was updated to COMPLETED
    const bRow = db.prepare(`SELECT status FROM bookings WHERE id = ?`).get(booking.id);
    assert.equal(bRow.status, 'COMPLETED');

    // Verify subsequent GET returns completed: true with the review
    const subsequentGet = await fetch(`${baseUrl}/api/bookings/${booking.id}/learning-check`);
    const subJson = await subsequentGet.json();

    assert.equal(subsequentGet.status, 200);
    assert.equal(subJson.completed, true);
    assert.equal(subJson.data.score, 4);
    assert.equal(subJson.data.review.length, 5);
  });

  test('marks a session as completed via POST /api/bookings/:id/complete', async () => {
    const utcStart = getValidUtcTomorrow();

    const res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Tara Vance',
        parentEmail: 'tara.vance@example.com',
        childName: 'Noah',
        subjectId: 'robotics',
        parentTimezone: 'America/New_York',
        utcStartIso: utcStart
      })
    });

    const json = await res.json();
    const booking = json.data;

    const compRes = await fetch(`${baseUrl}/api/bookings/${booking.id}/complete`, {
      method: 'POST'
    });
    const compJson = await compRes.json();

    assert.equal(compRes.status, 200);
    assert.equal(compJson.success, true);
    assert.equal(compJson.status, 'COMPLETED');

    const db = getDb();
    const bRow = db.prepare(`SELECT status FROM bookings WHERE id = ?`).get(booking.id);
    assert.equal(bRow.status, 'COMPLETED');
  });
});
