import { test, describe, beforeAll as before, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, queryOne, queryAll, run } from '../src/db.js';
import {
  authenticateParent,
  findParentByEmail,
  createParent,
  createSession,
  validateSession,
  destroySession,
  normalizeEmail
} from '../src/services/authService.js';
import { createBooking, getBookingById } from '../src/services/bookingService.js';
import { MENTOR_TIMEZONE } from '../src/services/availabilityService.js';
import { createApp } from '../src/app.js';

function getValidFutureSlotUtc(daysAhead = 3, hourIst = 11) {
  return DateTime.now()
    .setZone(MENTOR_TIMEZONE)
    .plus({ days: daysAhead })
    .set({ hour: hourIst, minute: 0, second: 0, millisecond: 0 })
    .toUTC()
    .toISO();
}

describe('Parent Account Persistence & Returning-User Authentication Tests', () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    await initDb(':memory:');
    app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    resetDb();
  });

  test('TEST 1: New Parent Registration & Booking Association', async () => {
    // 1. New parent enters name and email
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: 'priya@example.com'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.isNew, true, 'Should be flagged as a new parent');
    assert.equal(data.parent.name, 'Priya Sharma');
    assert.equal(data.parent.email, 'priya@example.com');
    assert.ok(data.parent.id.startsWith('parent_'));
    assert.ok(data.token, 'Should return active session token');

    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader && cookieHeader.includes('codeyoung_session='), 'Should issue HTTP-only session cookie');

    // 2. Book a trial class under this authenticated parent session
    const slotUtc = getValidFutureSlotUtc(2, 11);
    const bookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.token}`
      },
      body: JSON.stringify({
        childName: 'Aarav',
        subjectId: 'ai_ml',
        parentTimezone: 'America/New_York',
        utcStartIso: slotUtc
      })
    });

    const bookData = await bookRes.json();
    assert.equal(bookRes.status, 201);
    assert.equal(bookData.success, true);
    assert.equal(bookData.data.parentId, data.parent.id, 'Booking must be linked to parent_id');
    assert.equal(bookData.data.parentEmail, 'priya@example.com');

    // Verify in database
    const dbBooking = queryOne(`SELECT * FROM bookings WHERE id = ?`, [bookData.data.bookingId]);
    assert.ok(dbBooking);
    assert.equal(dbBooking.parent_id, data.parent.id, 'parent_id column in database must match parent');
  });

  test('TEST 2: Returning Parent Recognition & Direct Dashboard Retrieval', async () => {
    // 1. Seed existing parent and booking
    const parent = createParent({ name: 'Priya', email: 'priya@example.com' });
    const slotUtc = getValidFutureSlotUtc(3, 11);
    const booking = await createBooking({
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email,
      childName: 'Aarav',
      subjectId: 'ai_ml',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc
    });

    // 2. Parent logs in again later using SAME email
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya@example.com'
      })
    });

    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginData.success, true);
    assert.equal(loginData.isNew, false, 'Must recognize as an EXISTING parent, not new');
    assert.equal(loginData.parent.id, parent.id);

    // 3. Retrieve returning parent dashboard sessions
    const myBookingsRes = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const myBookings = await myBookingsRes.json();
    assert.equal(myBookings.success, true);
    assert.equal(myBookings.data.upcoming.length, 1, 'Existing booking must be immediately visible');
    assert.equal(myBookings.data.upcoming[0].id, booking.bookingId);
    assert.equal(myBookings.data.upcoming[0].subject_id, 'ai_ml');
  });

  test('TEST 3: Session Persistence Across Refresh (/api/auth/me)', async () => {
    const parent = createParent({ name: 'Carlos Gomez', email: 'carlos@example.com' });
    const session = createSession(parent.id);

    // Simulated F5 browser refresh: verifies active session
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Cookie': `codeyoung_session=${session.token}`
      }
    });

    const meData = await meRes.json();
    assert.equal(meRes.status, 200);
    assert.equal(meData.success, true);
    assert.equal(meData.parent.id, parent.id);
    assert.equal(meData.parent.email, 'carlos@example.com');
  });

  test('TEST 4: Logout Invalidates Session', async () => {
    const parent = createParent({ name: 'Elena Rostova', email: 'elena@example.com' });
    const session = createSession(parent.id);

    // Logout call
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });

    assert.equal(logoutRes.status, 200);

    // Token must no longer validate
    const checkAuth = validateSession(session.token);
    assert.equal(checkAuth, null, 'Session must be invalidated from database');

    // Accessing protected /api/auth/me with destroyed session must fail
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    });
    assert.equal(meRes.status, 401);
  });

  test('TEST 5: Login Again After Logout Restores Access to Existing Booking', async () => {
    const parent = createParent({ name: 'Priya', email: 'priya@example.com' });
    const slotUtc = getValidFutureSlotUtc(4, 12);
    await createBooking({
      parentId: parent.id,
      parentName: parent.name,
      parentEmail: parent.email,
      childName: 'Aarav',
      subjectId: 'game_development',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc
    });

    // 1. Initial session logged out
    const session1 = createSession(parent.id);
    destroySession(session1.token);

    // 2. Login again using same email
    const reLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@example.com' })
    });
    const reLoginData = await reLogin.json();
    assert.equal(reLoginData.isNew, false);

    // 3. Existing booking still intact
    const bookingsRes = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Authorization': `Bearer ${reLoginData.token}` }
    });
    const bookingsData = await bookingsRes.json();
    assert.equal(bookingsData.data.upcoming.length, 1);
    assert.equal(bookingsData.data.upcoming[0].subject_id, 'game_development');
  });

  test('TEST 6: Book Another Trial Under Same Parent Account', async () => {
    const parent = createParent({ name: 'Mark Davis', email: 'mark.davis@example.com' });
    const session = createSession(parent.id);

    // Booking 1: AI & ML
    const slot1 = getValidFutureSlotUtc(2, 11);
    const b1Res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({
        childName: 'Leo',
        subjectId: 'ai_ml',
        parentTimezone: 'Europe/London',
        utcStartIso: slot1
      })
    });
    assert.equal(b1Res.status, 201);

    // Booking 2: Robotics (Secondary trial booked from dashboard)
    const slot2 = getValidFutureSlotUtc(5, 14);
    const b2Res = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({
        childName: 'Maya',
        subjectId: 'robotics',
        parentTimezone: 'Europe/London',
        utcStartIso: slot2
      })
    });
    assert.equal(b2Res.status, 201);

    // Fetch parent dashboard bookings
    const allRes = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Authorization': `Bearer ${session.token}` }
    });
    const allData = await allRes.json();
    assert.equal(allData.data.upcoming.length, 2, 'Dashboard must reflect both confirmed trials');
  });

  test('TEST 7: Existing User With No Upcoming Class (Completed Past Session)', async () => {
    const parent = createParent({ name: 'Sunita Gupta', email: 'sunita.gupta@example.com' });
    const session = createSession(parent.id);

    // Insert a past session
    const pastStartUtc = DateTime.utc().minus({ days: 10 }).toISO();
    const pastEndUtc = DateTime.utc().minus({ days: 10 }).plus({ minutes: 30 }).toISO();
    run(
      `INSERT INTO bookings (
        id, parent_id, parent_name, parent_email, child_name, subject_id, subject_title,
        parent_timezone, parent_local_datetime, mentor_id, mentor_name,
        mentor_timezone, mentor_local_date, mentor_local_time,
        start_time_utc, end_time_utc, duration_minutes, dummy_class_link,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'bk_past_1',
        parent.id,
        'Sunita Gupta',
        'sunita.gupta@example.com',
        'Aarav',
        'coding_programming',
        'Coding & Logic',
        'America/New_York',
        'Past Date',
        'mentor_01',
        'Sneha Roy',
        'Asia/Kolkata',
        '2026-09-10',
        '10:00 AM',
        pastStartUtc,
        pastEndUtc,
        30,
        'https://demo.example.com/class/bk_past_1',
        'COMPLETED',
        pastStartUtc
      ]
    );

    const bookingsRes = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Authorization': `Bearer ${session.token}` }
    });
    const bookingsData = await bookingsRes.json();
    assert.equal(bookingsRes.status, 200);
    assert.equal(bookingsData.data.upcoming.length, 0, 'Should have 0 upcoming trial classes');
    assert.equal(bookingsData.data.past.length, 1, 'Should have 1 past trial class');
    assert.equal(bookingsData.data.past[0].status, 'COMPLETED');
  });

  test('TEST 8: Email Normalization and Validation', async () => {
    // Uppercase email with extra spaces
    const res1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya',
        email: '  PRIYA@EXAMPLE.COM  '
      })
    });
    const data1 = await res1.json();
    assert.equal(data1.success, true);
    assert.equal(data1.parent.email, 'priya@example.com', 'Must normalize email to lowercase without spaces');

    // Second call with standard lowercase should match the exact same parent account
    const res2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'priya@example.com'
      })
    });
    const data2 = await res2.json();
    assert.equal(data2.isNew, false, 'Must recognize as same existing parent');
    assert.equal(data2.parent.id, data1.parent.id);

    // Invalid email rejection
    const resInvalid = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email'
      })
    });
    assert.equal(resInvalid.status, 400);
    const errData = await resInvalid.json();
    assert.equal(errData.code, 'INVALID_EMAIL');
  });

  test('TEST 9: Unauthorized Booking Access Prevention (Ownership Enforcement)', async () => {
    // Parent A
    const parentA = createParent({ name: 'Parent A', email: 'parentA@example.com' });
    const sessionA = createSession(parentA.id);

    // Parent B
    const parentB = createParent({ name: 'Parent B', email: 'parentB@example.com' });
    const sessionB = createSession(parentB.id);

    // Create booking for Parent B
    const slotUtc = getValidFutureSlotUtc(2, 11);
    const bookingB = await createBooking({
      parentId: parentB.id,
      parentName: parentB.name,
      parentEmail: parentB.email,
      childName: 'Child B',
      subjectId: 'web_development',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc
    });

    // Parent A attempts to access Parent B's booking
    const unauthorizedRes = await fetch(`${baseUrl}/api/parent/bookings/${bookingB.bookingId}`, {
      headers: {
        'Authorization': `Bearer ${sessionA.token}`
      }
    });

    assert.equal(unauthorizedRes.status, 403, 'Must reject access with 403 Forbidden');
    const errData = await unauthorizedRes.json();
    assert.equal(errData.code, 'FORBIDDEN');
    assert.equal(errData.data, undefined, 'No booking data must be returned to unauthorized parent');

    // Parent B accesses their own booking
    const authorizedRes = await fetch(`${baseUrl}/api/parent/bookings/${bookingB.bookingId}`, {
      headers: {
        'Authorization': `Bearer ${sessionB.token}`
      }
    });
    assert.equal(authorizedRes.status, 200);
    const successData = await authorizedRes.json();
    assert.equal(successData.data.id, bookingB.bookingId);
  });
});
