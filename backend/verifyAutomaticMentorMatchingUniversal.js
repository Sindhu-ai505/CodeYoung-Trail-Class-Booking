import http from 'http';
import assert from 'assert';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('=== VERIFYING UNIVERSAL AUTOMATIC MENTOR MATCHING (SECTIONS 1-22) ===\n');

  // Test 1: Check live backend health
  const health = await request({
    host: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET'
  });
  assert.equal(health.status, 200, 'Backend API must be live');
  console.log('✔ 1. Live Backend Health: OK');

  // Test 2: Verify all 7 required timezones return automatic mentor candidate in slots
  const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Kolkata'
  ];

  for (const tz of TIMEZONES) {
    const res = await request({
      host: 'localhost',
      port: 5000,
      path: `/api/availability?date=2026-10-05&parentTimezone=${encodeURIComponent(tz)}&subjectId=ai_ml`,
      method: 'GET'
    });
    assert.equal(res.status, 200);
    assert.ok(res.data.data.slots.length > 0, `Must return slots for ${tz}`);
    const slot = res.data.data.slots[0];
    assert.ok(slot.candidateMentor, `Slot in ${tz} must contain system candidate mentor`);
    assert.ok(slot.candidateMentor.name, `Slot in ${tz} must have candidate mentor name`);
    console.log(`✔ Timezone [${tz}]: Slot ${slot.parentLocalTime} auto-matched candidate -> ${slot.candidateMentor.name} (Mentor time: ${slot.mentorLocalTime} IST)`);
  }

  // Test 3: Create booking without ANY mentorId across different timezones
  console.log('\n--- VERIFYING LIVE BOOKING ASSIGNMENTS ACROSS MULTIPLE TIMEZONES ---');
  for (const tz of ['America/New_York', 'Europe/London', 'Asia/Kolkata']) {
    const avail = await request({
      host: 'localhost',
      port: 5000,
      path: `/api/availability?date=2026-10-08&timezone=${encodeURIComponent(tz)}&subjectId=web_development`,
      method: 'GET'
    });
    const slot = avail.data.data.slots[0];

    const bookRes = await request({
      host: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      parentName: `Parent ${tz}`,
      parentEmail: `parent.${tz.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@codeyoungtest.com`,
      childName: 'Alex',
      subjectId: 'web_development',
      parentTimezone: tz,
      utcStartIso: slot.utcStart
      // Notice: NO mentorId provided at all!
    });

    assert.equal(bookRes.status, 201, `Booking should succeed for ${tz}`);
    assert.ok(bookRes.data.data.mentorName, `Backend must assign mentor for ${tz}`);
    console.log(`✔ [${tz}] Booked at ${slot.parentLocalTime} -> Automatically assigned: ${bookRes.data.data.mentorName} (${bookRes.data.data.mentorRole})`);
  }

  // Test 4: Security test - Try sending mentorId = 'mentor_03' or 'bogus_mentor'
  console.log('\n--- VERIFYING SECURITY (CLIENT MENTOR FORGERY IS IGNORED) ---');
  const availSec = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/availability?date=2026-10-12&timezone=America%2FNew_York&subjectId=ai_ml`,
    method: 'GET'
  });
  const secSlot = availSec.data.data.slots[0];

  const secBooking = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    parentName: 'Hacker Parent',
    parentEmail: 'hacker@example.com',
    childName: 'Malicious',
    subjectId: 'ai_ml',
    parentTimezone: 'America/New_York',
    utcStartIso: secSlot.utcStart,
    mentorId: 'mentor_999_fake' // Attacker tries to inject manual mentor
  });

  assert.equal(secBooking.status, 201);
  assert.notEqual(secBooking.data.data.mentorId, 'mentor_999_fake', 'Backend must ignore injected mentorId');
  assert.ok(secBooking.data.data.mentorId.startsWith('mentor_'), 'Backend must assign real mentor');
  console.log(`✔ Security check passed: Client-injected 'mentor_999_fake' was ignored. Real mentor assigned: ${secBooking.data.data.mentorName} (${secBooking.data.data.mentorId})`);

  console.log('\n============================================================');
  console.log('ALL VERIFICATIONS PASSED: 100% AUTOMATIC MENTOR MATCHING IS ACTIVE!');
  console.log('============================================================');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
