import { test, describe, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, queryOne, queryAll } from '../src/db.js';
import { seedMentors } from '../src/db/seed.js';
import { createParent, createSession } from '../src/services/authService.js';
import { createBooking } from '../src/services/bookingService.js';
import { MENTOR_TIMEZONE } from '../src/services/availabilityService.js';
import { createApp } from '../src/app.js';

function getValidFutureSlotUtc(daysAhead = 2, hourIst = 11) {
  return DateTime.now()
    .setZone(MENTOR_TIMEZONE)
    .plus({ days: daysAhead })
    .set({ hour: hourIst, minute: 0, second: 0, millisecond: 0 })
    .toUTC()
    .toISO();
}

describe('Role-Aware Authentication, Mentor Dashboard & Ownership Enforcement Tests', () => {
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

  beforeEach(() => {
    resetDb();
    seedMentors();
  });

  test('1. Parent login creates role = "parent" with parentId', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'parent.test@example.com',
        name: 'Sarah Connor'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.role, 'parent', 'Session role must be "parent"');
    assert.ok(data.parent?.id, 'Session must return parent with parentId');
    assert.ok(data.parent.id.startsWith('parent_'));
    assert.ok(data.token, 'Must return session token');

    // Verify session stored in database
    const dbSession = queryOne(`SELECT * FROM sessions WHERE token = ?`, [data.token]);
    assert.ok(dbSession);
    assert.equal(dbSession.role, 'parent');
    assert.equal(dbSession.parent_id, data.parent.id);
    assert.equal(dbSession.mentor_id, null);
  });

  test('2. Mentor login creates role = "mentor" with mentorId', async () => {
    // A. Login using mentor ID (e.g. mentor_01)
    const resId = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'mentor',
        identifier: 'mentor_01'
      })
    });

    const dataId = await resId.json();
    assert.equal(resId.status, 200);
    assert.equal(dataId.success, true);
    assert.equal(dataId.role, 'mentor', 'Session role must be "mentor"');
    assert.equal(dataId.mentor?.id, 'mentor_01', 'Must resolve to real seeded mentor_01');
    assert.equal(dataId.mentor?.name, 'Sneha Roy');
    assert.ok(dataId.token, 'Must return session token');

    // Verify session in database
    const dbSession = queryOne(`SELECT * FROM sessions WHERE token = ?`, [dataId.token]);
    assert.ok(dbSession);
    assert.equal(dbSession.role, 'mentor');
    assert.equal(dbSession.mentor_id, 'mentor_01');
    assert.equal(dbSession.parent_id, null);

    // B. Login using mentor email (e.g. sneha.roy@codeyoung.com)
    const resEmail = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'mentor',
        identifier: 'sneha.roy@codeyoung.com'
      })
    });

    const dataEmail = await resEmail.json();
    assert.equal(resEmail.status, 200);
    assert.equal(dataEmail.success, true);
    assert.equal(dataEmail.role, 'mentor');
    assert.equal(dataEmail.mentor?.id, 'mentor_01');
  });

  test('3. Refresh preserves the correct role/session (/api/auth/me)', async () => {
    // 1. Mentor refresh
    const mentorLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: 'mentor_02' })
    });
    const mentorLoginData = await mentorLoginRes.json();

    const mentorMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${mentorLoginData.token}` }
    });
    const mentorMe = await mentorMeRes.json();
    assert.equal(mentorMeRes.status, 200);
    assert.equal(mentorMe.role, 'mentor');
    assert.equal(mentorMe.mentor?.id, 'mentor_02');
    assert.equal(mentorMe.mentor?.name, 'Aarav Sharma');

    // 2. Parent refresh
    const parentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com', name: 'John Doe' })
    });
    const parentLoginData = await parentLoginRes.json();

    const parentMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${parentLoginData.token}` }
    });
    const parentMe = await parentMeRes.json();
    assert.equal(parentMeRes.status, 200);
    assert.equal(parentMe.role, 'parent');
    assert.equal(parentMe.parent?.email, 'john@example.com');
  });

  test('4. Mentor can access only their own assigned bookings via GET /api/mentor/bookings', async () => {
    // Seed 1 booking assigned to mentor_01
    const slotUtc1 = getValidFutureSlotUtc(2, 11);
    const booking1 = await createBooking({
      parentName: 'Parent One',
      parentEmail: 'p1@example.com',
      childName: 'Alice',
      subjectId: 'ai_ml', // Sneha Roy (mentor_01) teaches ai_ml morning
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc1
    });

    // Seed 1 booking assigned to mentor_02 (teach coding_programming evening)
    const slotUtc2 = getValidFutureSlotUtc(2, 14);
    const booking2 = await createBooking({
      parentName: 'Parent Two',
      parentEmail: 'p2@example.com',
      childName: 'Bob',
      subjectId: 'game_development', // Aarav Sharma (mentor_02) teaches game_development
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc2
    });

    const m1Id = booking1.mentorId;
    const m2Id = booking2.mentorId;
    assert.notEqual(m1Id, m2Id, 'The two bookings must have different mentors');

    // Authenticate as Mentor 1
    const m1LoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: m1Id })
    });
    const m1Login = await m1LoginRes.json();

    // Fetch Mentor 1 bookings
    const m1BookingsRes = await fetch(`${baseUrl}/api/mentor/bookings`, {
      headers: { 'Authorization': `Bearer ${m1Login.token}` }
    });
    const m1Bookings = await m1BookingsRes.json();

    assert.equal(m1BookingsRes.status, 200);
    assert.equal(m1Bookings.success, true);
    assert.equal(m1Bookings.count, 1, 'Mentor 1 should only see 1 booking');
    assert.equal(m1Bookings.data.upcoming[0].id, booking1.bookingId);
    assert.equal(m1Bookings.data.upcoming[0].child_name, 'Alice');

    // Verify today's trial capacity operational indicator is exposed
    assert.ok(m1Bookings.todayCapacity, 'todayCapacity must be present in response');
    assert.equal(m1Bookings.todayCapacity.maxDailyClasses, 2);
    assert.ok('bookedToday' in m1Bookings.todayCapacity);
    assert.ok('remainingClassesToday' in m1Bookings.todayCapacity);
    assert.ok('isDailyLimitReached' in m1Bookings.todayCapacity);

    // Verify Mentor 2's booking is NOT present
    const hasM2Booking = m1Bookings.data.all.some(b => b.id === booking2.bookingId);
    assert.equal(hasM2Booking, false, "Mentor 1 must NOT see Mentor 2's booking");
  });

  test('5. Backend derives mentor identity from session; ignores mentorId in query or body', async () => {
    const slotUtc = getValidFutureSlotUtc(2, 11);
    const booking = await createBooking({
      parentName: 'Parent One',
      parentEmail: 'p1@example.com',
      childName: 'Alice',
      subjectId: 'ai_ml',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc
    });

    // Login as mentor_01
    const m1LoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: booking.mentorId })
    });
    const m1Login = await m1LoginRes.json();

    // Malicious request: client attempts to query mentor_02's bookings by passing ?mentorId=mentor_02
    const tamperRes = await fetch(`${baseUrl}/api/mentor/bookings?mentorId=mentor_02`, {
      headers: {
        'Authorization': `Bearer ${m1Login.token}`,
        'x-mentor-id': 'mentor_02'
      }
    });
    const tamperData = await tamperRes.json();

    assert.equal(tamperRes.status, 200);
    assert.equal(tamperData.mentor.id, booking.mentorId, 'Identity must remain derived from session token');
    assert.equal(tamperData.count, 1);
    assert.equal(tamperData.data.upcoming[0].id, booking.bookingId);
  });

  test('6. Mentor cannot access another mentor’s individual booking via GET /api/mentor/bookings/:id', async () => {
    // Seed booking 1 for mentor_01
    const slotUtc1 = getValidFutureSlotUtc(2, 11);
    const booking1 = await createBooking({
      parentName: 'Parent One',
      parentEmail: 'p1@example.com',
      childName: 'Alice',
      subjectId: 'ai_ml',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc1
    });

    // Seed booking 2 for mentor_02
    const slotUtc2 = getValidFutureSlotUtc(2, 15);
    const booking2 = await createBooking({
      parentName: 'Parent Two',
      parentEmail: 'p2@example.com',
      childName: 'Bob',
      subjectId: 'game_development',
      parentTimezone: 'America/New_York',
      utcStartIso: slotUtc2
    });

    // Login as Mentor 1
    const m1LoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: booking1.mentorId })
    });
    const m1Login = await m1LoginRes.json();

    // 1. Mentor 1 accessing own booking -> 200 OK
    const ownRes = await fetch(`${baseUrl}/api/mentor/bookings/${booking1.bookingId}`, {
      headers: { 'Authorization': `Bearer ${m1Login.token}` }
    });
    assert.equal(ownRes.status, 200);
    const ownData = await ownRes.json();
    assert.equal(ownData.data.id, booking1.bookingId);

    // 2. Mentor 1 tampering URL to access Mentor 2's booking -> 403 Forbidden
    const crossRes = await fetch(`${baseUrl}/api/mentor/bookings/${booking2.bookingId}`, {
      headers: { 'Authorization': `Bearer ${m1Login.token}` }
    });
    assert.equal(crossRes.status, 403, 'Must return 403 Forbidden for cross-mentor booking inspection');
    const crossData = await crossRes.json();
    assert.equal(crossData.code, 'FORBIDDEN');
  });

  test('7. Parent cannot access mentor endpoints (403 Forbidden)', async () => {
    const parentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'parent.test@example.com', name: 'Parent User' })
    });
    const parentLogin = await parentLoginRes.json();

    // Try to access GET /api/mentor/bookings as parent
    const res = await fetch(`${baseUrl}/api/mentor/bookings`, {
      headers: { 'Authorization': `Bearer ${parentLogin.token}` }
    });
    assert.equal(res.status, 403, 'Parent must receive 403 Forbidden on mentor endpoints');
    const data = await res.json();
    assert.equal(data.code, 'FORBIDDEN');
  });

  test('8. Mentor cannot access parent-only endpoints (403 Forbidden)', async () => {
    const mentorLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: 'mentor_01' })
    });
    const mentorLogin = await mentorLoginRes.json();

    // Try to access GET /api/parent/bookings as mentor
    const res = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Authorization': `Bearer ${mentorLogin.token}` }
    });
    assert.equal(res.status, 403, 'Mentor must receive 403 Forbidden on parent endpoints');
    const data = await res.json();
    assert.equal(data.code, 'FORBIDDEN');
  });

  test('9. Parent and assigned mentor receive/access the exact same meeting_link', async () => {
    // 1. Parent registers & books trial
    const parentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sara@example.com', name: 'Sara Khan' })
    });
    const parentLogin = await parentLoginRes.json();

    const slotUtc = getValidFutureSlotUtc(3, 11);
    const bookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${parentLogin.token}`
      },
      body: JSON.stringify({
        childName: 'Zayn',
        subjectId: 'ai_ml',
        parentTimezone: 'America/New_York',
        utcStartIso: slotUtc
      })
    });
    const bookData = await bookRes.json();
    assert.equal(bookRes.status, 201);
    const assignedMentorId = bookData.data.mentorId;
    const bookingId = bookData.data.bookingId;

    // 2. Parent checks their dashboard
    const parentDashRes = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Authorization': `Bearer ${parentLogin.token}` }
    });
    const parentDash = await parentDashRes.json();
    const parentBooking = parentDash.data.upcoming[0];
    const parentClassLink = parentBooking.meeting_link || parentBooking.dummy_class_link;
    assert.ok(parentClassLink, 'Parent must receive classroom link');

    // 3. Assigned mentor logs in
    const mentorLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: assignedMentorId })
    });
    const mentorLogin = await mentorLoginRes.json();

    // 4. Assigned mentor checks their workspace
    const mentorDashRes = await fetch(`${baseUrl}/api/mentor/bookings`, {
      headers: { 'Authorization': `Bearer ${mentorLogin.token}` }
    });
    const mentorDash = await mentorDashRes.json();
    const mentorBooking = mentorDash.data.upcoming.find(b => b.id === bookingId);
    assert.ok(mentorBooking, 'Assigned mentor must see this booking in their dashboard');

    const mentorClassLink = mentorBooking.meeting_link || mentorBooking.dummy_class_link;

    // 5. Verification: Both links must be EXACTLY IDENTICAL
    assert.equal(parentClassLink, mentorClassLink, 'Parent and Mentor must receive the EXACT same meeting_link');
    assert.ok(mentorClassLink.includes(`/class/${bookingId}`));
  });

  test('10. Logout invalidates session for both roles', async () => {
    // Mentor logout
    const mLogin = await (await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: 'mentor_03' })
    })).json();

    const mLogoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${mLogin.token}` }
    });
    assert.equal(mLogoutRes.status, 200);

    const mCheckRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${mLogin.token}` }
    });
    assert.equal(mCheckRes.status, 401, 'Invalidated session must return 401');

    // Parent logout
    const pLogin = await (await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'logout.test@example.com', name: 'Logout User' })
    })).json();

    const pLogoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${pLogin.token}` }
    });
    assert.equal(pLogoutRes.status, 200);

    const pCheckRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${pLogin.token}` }
    });
    assert.equal(pCheckRes.status, 401, 'Invalidated parent session must return 401');
  });

  test('11. Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
    const resMentor = await fetch(`${baseUrl}/api/mentor/bookings`);
    assert.equal(resMentor.status, 401);

    const resParent = await fetch(`${baseUrl}/api/parent/bookings`);
    assert.equal(resParent.status, 401);
  });
});
