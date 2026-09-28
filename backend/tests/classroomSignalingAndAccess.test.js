import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { initDb, resetDb, queryOne, getDb } from '../src/db/index.js';
import { seedMentors } from '../src/db/seed.js';
import { DateTime } from 'luxon';

describe('Real-Time Interactive Classroom & Access Control', () => {
  let app;
  let server;
  let baseUrl;

  beforeAll(async () => {
    initDb();
    seedMentors();
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

  const setupBooking = async ({ inWindow = false } = {}) => {
    // 1. Register/login Parent 1
    const p1Res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sara.parent@example.com', name: 'Sara Parent' })
    });
    const p1Cookie = p1Res.headers.get('set-cookie');

    // 2. Book a trial session (future slot in 2 days)
    const futureUtc = DateTime.utc().plus({ days: 2 }).set({ hour: 11, minute: 0, second: 0, millisecond: 0 }).toISO();
    const bookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': p1Cookie
      },
      body: JSON.stringify({
        childName: 'Leo',
        parentName: 'Sara Parent',
        parentEmail: 'sara.parent@example.com',
        subjectId: 'ai_ml',
        parentTimezone: 'America/New_York',
        slotStartUTC: futureUtc
      })
    });

    expect(bookRes.status).toBe(201);
    const bookJson = await bookRes.json();
    const booking = bookJson.data;
    const bookingId = booking.id;
    const assignedMentorId = booking.mentorId || booking.mentor_id;

    if (inWindow) {
      // Set start time to 2 minutes from now (within the 5-minute join window)
      const nowUtc = DateTime.utc();
      const openStart = nowUtc.plus({ minutes: 2 }).toISO();
      const openEnd = nowUtc.plus({ minutes: 32 }).toISO();
      const db = getDb();
      db.prepare(`UPDATE bookings SET slot_start_utc = ?, start_time_utc = ?, slot_end_utc = ?, end_time_utc = ? WHERE id = ?`)
        .run(openStart, openStart, openEnd, openEnd, bookingId);
    }

    // 3. Register/login Parent 2 (Attacker / Different parent)
    const p2Res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker.parent@example.com', name: 'Attacker Parent' })
    });
    const p2Cookie = p2Res.headers.get('set-cookie');

    // 4. Login Assigned Mentor
    const mentorRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: assignedMentorId })
    });
    const mentorCookie = mentorRes.headers.get('set-cookie');

    // 5. Login Unassigned Mentor (Different mentor)
    const otherMentorId = assignedMentorId === 'mentor_01' ? 'mentor_02' : 'mentor_01';
    const otherMentorRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'mentor', identifier: otherMentorId })
    });
    const otherMentorCookie = otherMentorRes.headers.get('set-cookie');

    return {
      bookingId,
      booking,
      p1Cookie,
      p2Cookie,
      mentorCookie,
      otherMentorCookie,
      assignedMentorId
    };
  };

  it('Strict Access Control: Rejects unauthenticated requests with 401', async () => {
    const { bookingId } = await setupBooking({ inWindow: true });

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('Strict Access Control: Rejects Parent B from accessing Parent A classroom (403 Forbidden)', async () => {
    const { bookingId, p2Cookie } = await setupBooking({ inWindow: true });

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`, {
      headers: { 'Cookie': p2Cookie }
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('FORBIDDEN');
  });

  it('Strict Access Control: Rejects an unassigned mentor from accessing the classroom (403 Forbidden)', async () => {
    const { bookingId, otherMentorCookie } = await setupBooking({ inWindow: true });

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`, {
      headers: { 'Cookie': otherMentorCookie }
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('FORBIDDEN');
  });

  it('Backend Enforces 5-minute rule: Rejects entrance when booking is > 5 minutes before scheduled start with 403 JOIN_WINDOW_NOT_OPEN', async () => {
    const { bookingId, p1Cookie } = await setupBooking({ inWindow: false });

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`, {
      headers: { 'Cookie': p1Cookie }
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('JOIN_WINDOW_NOT_OPEN');
    expect(data.message).toBe('Join Demo Class opens 5m before start');
  });

  it('Authorizes legitimate owner (Parent 1) to enter classroom when within 5-minute window', async () => {
    const { bookingId, p1Cookie } = await setupBooking({ inWindow: true });

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`, {
      headers: { 'Cookie': p1Cookie }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.booking.id).toBe(bookingId);
    expect(data.data.userRole).toBe('parent');
  });

  it('Authorizes legitimate assigned mentor to enter classroom when within 5-minute window', async () => {
    const { bookingId, mentorCookie } = await setupBooking({ inWindow: true });

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`, {
      headers: { 'Cookie': mentorCookie }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.booking.id).toBe(bookingId);
    expect(data.data.userRole).toBe('mentor');
  });

  it('Supports WebRTC signaling relay, chat broadcast, and leave flow within window', async () => {
    const { bookingId, p1Cookie, mentorCookie } = await setupBooking({ inWindow: true });

    // Send WebRTC offer signal from parent
    const sigRes = await fetch(`${baseUrl}/api/classroom/${bookingId}/signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': p1Cookie
      },
      body: JSON.stringify({
        signal: { type: 'offer', sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...' }
      })
    });

    expect(sigRes.status).toBe(200);
    const sigData = await sigRes.json();
    expect(sigData.success).toBe(true);

    // Send chat message from mentor
    const chatRes = await fetch(`${baseUrl}/api/classroom/${bookingId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': mentorCookie
      },
      body: JSON.stringify({ text: 'Welcome to your 1:1 demo class!' })
    });

    expect(chatRes.status).toBe(200);
    const chatData = await chatRes.json();
    expect(chatData.success).toBe(true);
    expect(chatData.data.text).toBe('Welcome to your 1:1 demo class!');
    expect(chatData.data.senderRole).toBe('mentor');
    expect(chatData.data.timestamp).toBeDefined();

    // Leave classroom and transition
    const leaveRes = await fetch(`${baseUrl}/api/classroom/${bookingId}/leave`, {
      method: 'POST',
      headers: { 'Cookie': p1Cookie }
    });

    expect(leaveRes.status).toBe(200);
    const leaveData = await leaveRes.json();
    expect(leaveData.success).toBe(true);

    // Booking status should be updated to COMPLETED
    const db = getDb();
    const bCheck = db.prepare('SELECT status FROM bookings WHERE id = ?').get(bookingId);
    expect(bCheck.status).toBe('COMPLETED');
  });

  it('Backend Enforces class-ended rule: Rejects entrance when booking has already ended with 410 CLASS_ENDED', async () => {
    const { bookingId, p1Cookie } = await setupBooking({ inWindow: true });
    const pastStart = DateTime.utc().minus({ hours: 2 }).toISO();
    const pastEnd = DateTime.utc().minus({ hours: 1 }).toISO();
    const db = getDb();
    db.prepare(`UPDATE bookings SET slot_start_utc = ?, start_time_utc = ?, slot_end_utc = ?, end_time_utc = ? WHERE id = ?`)
      .run(pastStart, pastStart, pastEnd, pastEnd, bookingId);

    const res = await fetch(`${baseUrl}/api/classroom/${bookingId}`, {
      headers: { 'Cookie': p1Cookie }
    });

    expect(res.status).toBe(410);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('CLASS_ENDED');
  });

  it('Parent Dashboard returns enriched mentor details', async () => {
    const { p1Cookie } = await setupBooking({ inWindow: false });

    const res = await fetch(`${baseUrl}/api/parent/bookings`, {
      headers: { 'Cookie': p1Cookie }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.upcoming.length).toBeGreaterThan(0);
    const session = body.data.upcoming[0];
    expect(session.mentorSpecialization).toBeDefined();
    expect(session.mentorBio).toBeDefined();
    expect(session.mentorAvatarBg).toBeDefined();
    expect(session.mentorAvatarColor).toBeDefined();
    expect(session.mentorDetails).toBeDefined();
    expect(session.mentorDetails.name).toBe(session.mentor_name);
  });
});
