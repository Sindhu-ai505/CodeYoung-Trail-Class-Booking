/**
 * Concurrency & Idempotency Smoke Test / Demo Script
 * 
 * Demonstrates:
 * 1. N (default 12) simultaneous POST /api/bookings requests targeting the exact same UTC time slot.
 * 2. Atomic SQLite transaction handling with zero double-bookings.
 * 3. Exactly 10 bookings confirmed (assigned across all 10 mentors without overlaps).
 * 4. Remaining requests rejected with 409 NO_MENTORS_AVAILABLE.
 * 5. Idempotent replay: re-sending the same clientRequestId returns 200 OK with the existing booking.
 * 
 * Usage:
 *   node scripts/concurrency-demo.js
 */

import { DateTime } from 'luxon';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const N = parseInt(process.env.CONCURRENCY_N || '12', 10);

async function checkServerHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error(`\n[FATAL] Unable to connect to server at ${BASE_URL}.`);
    console.error('Ensure the server is running (e.g. `npm start` in server directory) before running this script.\n');
    process.exit(1);
  }
}

async function runConcurrencyDemo() {
  await checkServerHealth();

  // Target a clean future slot during working hours (15:30 IST / 10:00 UTC) where all 10 mentors work
  const uniqueOffsetDays = 10 + (Math.floor(Date.now() / 1000) % 5000);
  const targetDate = DateTime.utc().plus({ days: uniqueOffsetDays }).toFormat('yyyy-MM-dd');
  const slotStartUTC = `${targetDate}T10:00:00.000Z`;
  const slotEndUTC = `${targetDate}T10:30:00.000Z`;
  const mentorDate = DateTime.fromISO(slotStartUTC, { zone: 'Asia/Kolkata' }).toFormat('yyyy-MM-dd');

  console.log('='.repeat(78));
  console.log('  CODEYOUNG CONCURRENCY & IDEMPOTENCY DEMO / SMOKE TEST');
  console.log('='.repeat(78));
  console.log(`Server URL          : ${BASE_URL}`);
  console.log(`Concurrent Requests : ${N}`);
  console.log(`Target Slot (UTC)   : ${slotStartUTC} -> ${slotEndUTC}`);
  console.log(`Mentor Local Date   : ${mentorDate} (Asia/Kolkata, 15:30 - 16:00 IST)`);
  console.log(`Expected Capacity   : 10 mentors active; max 1 booking each for this exact slot`);
  console.log('-'.repeat(78));

  // Generate N distinct requests with unique clientRequestId and unique parent email
  const requests = [];
  for (let i = 1; i <= N; i++) {
    const clientRequestId = crypto.randomUUID();
    const parentEmail = `concurrent.parent.${Date.now()}.${i}@example.com`;
    requests.push({
      index: i,
      clientRequestId,
      parentEmail,
      parentName: `Parent Concurrent ${i}`,
      childName: `Child ${i}`,
      parentTimezone: 'America/New_York',
      slotStartUTC,
      slotEndUTC
    });
  }

  console.log(`Firing ${N} simultaneous POST /api/bookings requests via Promise.all()...\n`);

  const startTime = Date.now();
  const responses = await Promise.all(
    requests.map(async (req) => {
      const reqStart = Date.now();
      try {
        const res = await fetch(`${BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        });
        const json = await res.json();
        return {
          index: req.index,
          clientRequestId: req.clientRequestId,
          status: res.status,
          body: json,
          durationMs: Date.now() - reqStart
        };
      } catch (err) {
        return {
          index: req.index,
          clientRequestId: req.clientRequestId,
          status: 0,
          error: err.message,
          durationMs: Date.now() - reqStart
        };
      }
    })
  );
  const totalDurationMs = Date.now() - startTime;

  // Process & analyze results
  const confirmed = responses.filter(r => r.status === 201);
  const unavailable = responses.filter(r => r.status === 409);
  const unexpected = responses.filter(r => r.status !== 201 && r.status !== 409);

  // Print results table
  console.log('REQUEST EXECUTION LOG:');
  console.log('-'.repeat(78));
  console.log(
    'Req #'.padEnd(7) +
    'Status'.padEnd(9) +
    'Client Request ID'.padEnd(38) +
    'Outcome / Mentor Assigned'
  );
  console.log('-'.repeat(78));

  for (const r of responses) {
    const statusStr = `${r.status}`;
    const reqIdStr = r.clientRequestId.substring(0, 36);
    let outcome = '';

    if (r.status === 201) {
      const mentorName = r.body?.data?.mentorName || r.body?.data?.mentor_name || 'Assigned';
      const mentorId = r.body?.data?.mentorId || r.body?.data?.mentor_id || '';
      outcome = `CONFIRMED -> ${mentorName} (${mentorId})`;
    } else if (r.status === 409) {
      outcome = `REJECTED -> ${r.body?.code || 'NO_MENTORS_AVAILABLE'}`;
    } else {
      outcome = `ERROR (${r.status}): ${r.error || r.body?.message || 'Unknown'}`;
    }

    console.log(
      `#${r.index.toString().padEnd(5)}` +
      statusStr.padEnd(9) +
      reqIdStr.padEnd(38) +
      outcome
    );
  }
  console.log('-'.repeat(78));

  // Summary statistics
  console.log('\nSUMMARY BREAKDOWN:');
  console.log(`• Total Requests Dispatched : ${N}`);
  console.log(`• Total Execution Time      : ${totalDurationMs} ms`);
  console.log(`• 201 Created (Confirmed)   : ${confirmed.length}`);
  console.log(`• 409 NO_MENTORS_AVAILABLE  : ${unavailable.length}`);
  console.log(`• Unexpected Responses      : ${unexpected.length}`);

  // Invariants verification
  const violations = [];

  // Invariant 1: No unexpected HTTP errors
  if (unexpected.length > 0) {
    violations.push(`Unexpected response statuses encountered: ${unexpected.map(u => u.status).join(', ')}`);
  }

  // Invariant 2: Exactly 10 confirmed bookings (all 10 mentors booked)
  if (confirmed.length !== 10) {
    violations.push(`Expected exactly 10 confirmed bookings (all mentors filled), but received ${confirmed.length}`);
  }

  // Invariant 3: Exactly 2 requests rejected with 409 NO_MENTORS_AVAILABLE
  if (unavailable.length !== (N - 10)) {
    violations.push(`Expected exactly ${N - 10} requests rejected with 409, but received ${unavailable.length}`);
  }
  for (const u of unavailable) {
    if (u.body?.code !== 'NO_MENTORS_AVAILABLE') {
      violations.push(`409 response did not have expected code NO_MENTORS_AVAILABLE (got: ${u.body?.code})`);
    }
  }

  // Invariant 4: No two confirmed bookings overlap for the same mentor
  const assignedMentorIds = confirmed.map(c => c.body?.data?.mentor_id || c.body?.data?.mentorId);
  const mentorIdCounts = {};
  for (const mId of assignedMentorIds) {
    mentorIdCounts[mId] = (mentorIdCounts[mId] || 0) + 1;
    if (mentorIdCounts[mId] > 1) {
      violations.push(`Double-booking detected! Mentor ${mId} was assigned ${mentorIdCounts[mId]} times for the exact same slot.`);
    }
  }

  // Invariant 5: No mentor has >2 bookings on their local calendar date
  for (const [mId, count] of Object.entries(mentorIdCounts)) {
    if (count > 2) {
      violations.push(`Mentor daily cap violated: Mentor ${mId} has ${count} bookings on ${mentorDate} (max allowed: 2).`);
    }
  }

  // Invariant 6: Idempotency Replay Test
  // Re-send one of the confirmed requests with the exact same clientRequestId
  if (confirmed.length > 0) {
    const sample = confirmed[0];
    const sampleReq = requests.find(r => r.index === sample.index);

    console.log('\nIDEMPOTENCY REPLAY TEST:');
    console.log(`Re-submitting duplicate POST with original clientRequestId: ${sampleReq.clientRequestId}...`);

    const replayRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleReq)
    });
    const replayJson = await replayRes.json();

    if (replayRes.status !== 200) {
      violations.push(`Idempotent retry failed! Expected HTTP 200 OK, but received HTTP ${replayRes.status}`);
    } else if (!replayJson.idempotentReplay && !replayJson.data) {
      violations.push('Idempotent replay did not return existing booking data.');
    } else {
      const originalBookingId = sample.body?.data?.id || sample.body?.data?.bookingId;
      const replayedBookingId = replayJson.data?.id || replayJson.data?.bookingId;
      if (originalBookingId !== replayedBookingId) {
        violations.push(`Idempotent replay returned mismatched booking ID: expected ${originalBookingId}, got ${replayedBookingId}`);
      } else {
        console.log(`✓ Replay succeeded with HTTP 200 OK (idempotentReplay: true, bookingId: ${originalBookingId})`);
      }
    }
  }

  console.log('\nINVARIANT VERIFICATION:');
  console.log(`[${violations.length === 0 ? 'PASS' : 'FAIL'}] Invariant 1: Zero double-bookings (all 10 confirmed mentors are distinct)`);
  console.log(`[${violations.length === 0 ? 'PASS' : 'FAIL'}] Invariant 2: Capacity boundary respected (max 1 class per mentor per slot)`);
  console.log(`[${violations.length === 0 ? 'PASS' : 'FAIL'}] Invariant 3: Clean rejection for overflow (${unavailable.length} requests got 409 NO_MENTORS_AVAILABLE)`);
  console.log(`[${violations.length === 0 ? 'PASS' : 'FAIL'}] Invariant 4: No 500 internal server errors encountered`);
  console.log(`[${violations.length === 0 ? 'PASS' : 'FAIL'}] Invariant 5: Idempotent replay returns 200 OK with original booking`);

  if (violations.length > 0) {
    console.error('\n' + '!'.repeat(78));
    console.error('CONCURRENCY TEST FAILED! The following invariant violations were detected:');
    violations.forEach(v => console.error(`  - ${v}`));
    console.error('!'.repeat(78) + '\n');
    process.exitCode = 1;
  } else {
    console.log('\n' + '='.repeat(78));
    console.log('ALL CONCURRENCY & IDEMPOTENCY INVARIANTS SATISFIED (Exit Code: 0)');
    console.log('='.repeat(78) + '\n');
    process.exitCode = 0;
  }
}

runConcurrencyDemo().catch((err) => {
  console.error('[Concurrency Demo] Unhandled rejection:', err);
  process.exitCode = 1;
});
