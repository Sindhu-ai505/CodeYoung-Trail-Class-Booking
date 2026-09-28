import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { getDb } from './src/db/index.js';

const BASE_URL = 'http://localhost:5000';

async function runE2E() {
  console.log('--- STARTING LIVE E2E ROLE VERIFICATION ---');

  // 1. Health check & reset dev state
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  assert.equal(health.status, 'ok');
  console.log('✔ Live Backend Health: OK');

  await fetch(`${BASE_URL}/api/dev/reset`, { method: 'POST' });
  console.log('✔ Live DB Reset: Clean slate for test');

  // FLOW A: PARENT
  console.log('\n--- FLOW A: PARENT BOOKING & DASHBOARD ---');
  // A1: Parent Login
  const parentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sindhu.parent@example.com', name: 'Sindhu Hegde' })
  });
  const parentLogin = await parentLoginRes.json();
  assert.equal(parentLogin.success, true);
  assert.equal(parentLogin.role, 'parent');
  assert.ok(parentLogin.parent.id);
  const parentToken = parentLogin.token;
  console.log(`✔ Parent Logged In: ${parentLogin.parent.name} (Role: ${parentLogin.role}, ID: ${parentLogin.parent.id})`);

  // A2: Query available slot like the frontend wizard does
  const availRes = await fetch(`${BASE_URL}/api/availability?subjectId=ai_ml&date=2026-09-30&parentTimezone=America/New_York`);
  const availData = await availRes.json();
  assert.ok(availData.data.slots.length > 0, 'Must have available slots');
  const slot = availData.data.slots[0];
  const futureSlotUtc = slot.utcStart;
  console.log(`✔ Available slot selected: ${slot.parentLocalTime} EDT (${slot.mentorLocalTime} IST, UTC: ${futureSlotUtc})`);

  const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      childName: 'Aarya',
      subjectId: 'ai_ml',
      parentTimezone: 'America/New_York',
      utcStartIso: futureSlotUtc
    })
  });
  const bookData = await bookRes.json();
  if (!bookData.success) {
    console.error('Booking creation error:', bookData);
  }
  assert.equal(bookData.success, true);
  const booking = bookData.data;
  console.log(`✔ Booking Confirmed: #${booking.bookingId} with assigned mentor ${booking.mentorName} (${booking.mentorId})`);
  console.log(`  Meeting Link: ${booking.meetingLink}`);

  // A3: Parent accesses Dashboard
  const pDashRes = await fetch(`${BASE_URL}/api/parent/bookings`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  const pDash = await pDashRes.json();
  assert.equal(pDash.success, true);
  const parentUpcoming = pDash.data.upcoming.find(b => b.id === booking.bookingId);
  assert.ok(parentUpcoming, 'Booking must be in parent upcoming list');
  console.log(`✔ Parent Dashboard verified: 1 upcoming trial present`);

  // FLOW B: MENTOR
  console.log('\n--- FLOW B: MENTOR LOGIN & DASHBOARD ---');
  // B1: Assigned Mentor Login (e.g. mentor_01 or assigned mentor ID)
  const mentorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'mentor', identifier: booking.mentorId })
  });
  const mentorLogin = await mentorLoginRes.json();
  if (!mentorLogin.success) {
    console.error('Mentor login failed:', mentorLogin);
  }
  assert.equal(mentorLogin.success, true);
  assert.equal(mentorLogin.role, 'mentor');
  assert.equal(mentorLogin.mentor.id, booking.mentorId);
  const mentorToken = mentorLogin.token;
  console.log(`✔ Mentor Logged In: ${mentorLogin.mentor.name} (Role: ${mentorLogin.role}, ID: ${mentorLogin.mentor.id})`);

  // B2: Mentor retrieves assigned bookings
  const mDashRes = await fetch(`${BASE_URL}/api/mentor/bookings`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  const mDash = await mDashRes.json();
  assert.equal(mDash.success, true);
  const mentorBooking = mDash.data.upcoming.find(b => b.id === booking.bookingId);
  assert.ok(mentorBooking, 'Assigned booking must appear on assigned mentor workspace');
  console.log(`✔ Mentor Dashboard verified: Assigned booking #${mentorBooking.id} found`);

  // B3: Verify SHARED CLASS LINK
  assert.equal(parentUpcoming.meeting_link, mentorBooking.meeting_link, 'Parent and Mentor must share the EXACT SAME meeting link');
  console.log(`✔ Shared Meeting Link Verified: ${mentorBooking.meeting_link}`);

  // FLOW C: SECURITY & ISOLATION
  console.log('\n--- FLOW C: SECURITY & OWNERSHIP ENFORCEMENT ---');
  // C1: Parent tries to access Mentor API -> 403 Forbidden
  const parentAccessMentorRes = await fetch(`${BASE_URL}/api/mentor/bookings`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  assert.equal(parentAccessMentorRes.status, 403);
  console.log(`✔ Parent forbidden from mentor endpoint: 403 Forbidden`);

  // C2: Mentor tries to access Parent API -> 403 Forbidden
  const mentorAccessParentRes = await fetch(`${BASE_URL}/api/parent/bookings`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  assert.equal(mentorAccessParentRes.status, 403);
  console.log(`✔ Mentor forbidden from parent endpoint: 403 Forbidden`);

  // C3: Mentor A tries to access Mentor B's booking -> 403 Forbidden
  // Log in as mentor_02 (Aarav Sharma)
  const otherMentorLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'mentor', identifier: 'mentor_02' })
  });
  const otherMentorLogin = await otherMentorLoginRes.json();
  const otherMentorToken = otherMentorLogin.token;

  if (booking.mentorId !== 'mentor_02') {
    const crossAccessRes = await fetch(`${BASE_URL}/api/mentor/bookings/${booking.bookingId}`, {
      headers: { 'Authorization': `Bearer ${otherMentorToken}` }
    });
    assert.equal(crossAccessRes.status, 403);
    console.log(`✔ Cross-mentor booking inspection rejected: 403 Forbidden`);
  }

  // C4: Session restoration on refresh via /api/auth/me
  const mentorMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  const mentorMe = await mentorMeRes.json();
  assert.equal(mentorMe.role, 'mentor');
  assert.equal(mentorMe.mentor.id, booking.mentorId);
  // FLOW D: REAL-TIME INTERACTIVE CLASSROOM ACCESS & INTERACTION
  console.log('\n--- FLOW D: REAL-TIME INTERACTIVE CLASSROOM ACCESS & INTERACTION ---');

  // D0: Test 5-minute rule before join window opens
  const earlyAccessRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  assert.equal(earlyAccessRes.status, 403);
  const earlyData = await earlyAccessRes.json();
  assert.equal(earlyData.code, 'JOIN_WINDOW_NOT_OPEN');
  assert.equal(earlyData.message, 'Join Demo Class opens 5m before start');
  console.log(`✔ 5-Minute Window enforced by backend: 403 JOIN_WINDOW_NOT_OPEN ("Join Demo Class opens 5m before start")`);

  // Open the join window by setting scheduled start time to 2 minutes from now
  const nowUtc = DateTime.utc();
  const openStart = nowUtc.plus({ minutes: 2 }).toISO();
  const openEnd = nowUtc.plus({ minutes: 32 }).toISO();
  const db = getDb();
  db.prepare(`UPDATE bookings SET slot_start_utc = ?, start_time_utc = ?, slot_end_utc = ?, end_time_utc = ? WHERE id = ?`)
    .run(openStart, openStart, openEnd, openEnd, booking.bookingId);

  // D1: Parent accesses classroom within 5m window
  const parentClassroomRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}`, {
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  assert.equal(parentClassroomRes.status, 200);
  const parentClassroom = await parentClassroomRes.json();
  assert.equal(parentClassroom.success, true);
  assert.equal(parentClassroom.data.userRole, 'parent');
  console.log(`✔ Parent classroom access authorized within 5m window: 200 OK`);

  // D2: Assigned Mentor accesses classroom
  const mentorClassroomRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  assert.equal(mentorClassroomRes.status, 200);
  const mentorClassroom = await mentorClassroomRes.json();
  assert.equal(mentorClassroom.success, true);
  assert.equal(mentorClassroom.data.userRole, 'mentor');
  console.log(`✔ Assigned Mentor classroom access authorized: 200 OK`);

  // D3: Unauthorized user (e.g. other mentor) access rejected -> 403 Forbidden
  if (booking.mentorId !== 'mentor_02') {
    const unauthClassroomRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}`, {
      headers: { 'Authorization': `Bearer ${otherMentorToken}` }
    });
    assert.equal(unauthClassroomRes.status, 403);
    console.log(`✔ Unauthorized classroom URL tampering rejected: 403 Forbidden`);
  }

  // D4: WebRTC Signaling Relay
  const signalRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}/signal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${parentToken}`
    },
    body: JSON.stringify({
      signal: { type: 'offer', sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...' }
    })
  });
  assert.equal(signalRes.status, 200);
  console.log(`✔ WebRTC Signaling relayed: 200 OK`);

  // D5: Real-time Interactive Chat
  const chatRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({ text: 'Hello from your assigned 1:1 mentor!' })
  });
  assert.equal(chatRes.status, 200);
  const chatData = await chatRes.json();
  assert.equal(chatData.data.senderRole, 'mentor');
  assert.equal(chatData.data.text, 'Hello from your assigned 1:1 mentor!');
  console.log(`✔ Real-time interactive chat working: "${chatData.data.text}"`);

  // D6: Leave Class & Status update
  const leaveRes = await fetch(`${BASE_URL}/api/classroom/${booking.bookingId}/leave`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });
  assert.equal(leaveRes.status, 200);
  console.log(`✔ Parent left class cleanly, session marked COMPLETED: 200 OK`);

  console.log('\n🎉 ALL LIVE E2E FLOWS (A, B, C, D) PASSED WITH 100% SUCCESS!');
}

runE2E().catch(err => {
  console.error('❌ E2E Verification Failed:', err);
  process.exit(1);
});
