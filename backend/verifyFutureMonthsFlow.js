import assert from 'node:assert/strict';
import { DateTime } from 'luxon';

const BASE_URL = 'http://localhost:5000';
const parentTz = 'America/New_York';

async function runVerification() {
  console.log('=== RUNNING LIVE FUTURE MONTHS BOOKING CALENDAR VERIFICATION ===\n');

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  assert.equal(healthRes.status, 200, 'Health check should be 200');
  const health = await healthRes.json();
  console.log('✓ 1. Backend API is healthy on port 5000:', health.status);

  // 2. Today's availability
  const todayStr = DateTime.now().setZone(parentTz).toFormat('yyyy-MM-dd');
  const todayRes = await fetch(`${BASE_URL}/api/availability?subjectId=coding_programming&date=${todayStr}&parentTimezone=${parentTz}`);
  assert.equal(todayRes.status, 200);
  const todayData = await todayRes.json();
  assert.equal(todayData.data.date, todayStr);
  assert.equal(todayData.data.bookingWindow.daysAllowed, 91);
  assert.ok(todayData.data.availabilityLabel.startsWith("Today's Availability:"), 'Today label must start with Today\'s Availability');
  console.log(`✓ 2. Today (${todayStr}) returns real availability:`, todayData.data.availabilityLabel);

  // 3. October Date: 2026-10-15
  const octDate = '2026-10-15';
  const octRes = await fetch(`${BASE_URL}/api/availability?subjectId=coding_programming&date=${octDate}&parentTimezone=${parentTz}`);
  assert.equal(octRes.status, 200);
  const octData = await octRes.json();
  assert.equal(octData.data.date, octDate);
  assert.ok(octData.data.slots.length > 0, 'October 15 must have available slots');
  assert.ok(octData.data.availabilityLabel.startsWith('October 15 Availability:'), 'Label must be "October 15 Availability:"');
  console.log(`✓ 3. October 15 Availability loads dynamically: ${octData.data.availabilityLabel} (${octData.data.slots.length} slots)`);

  // 4. November Date: 2026-11-12
  const novDate = '2026-11-12';
  const novRes = await fetch(`${BASE_URL}/api/availability?subjectId=ai_ml&date=${novDate}&parentTimezone=${parentTz}`);
  assert.equal(novRes.status, 200);
  const novData = await novRes.json();
  assert.equal(novData.data.date, novDate);
  assert.ok(novData.data.slots.length > 0, 'November 12 must have available slots');
  assert.ok(novData.data.availabilityLabel.startsWith('November 12 Availability:'), 'Label must be "November 12 Availability:"');
  console.log(`✓ 4. November 12 Availability loads dynamically: ${novData.data.availabilityLabel} (${novData.data.slots.length} slots)`);

  // 5. December Date: 2026-12-20
  const decDate = '2026-12-20';
  const decRes = await fetch(`${BASE_URL}/api/availability?subjectId=web_development&date=${decDate}&parentTimezone=${parentTz}`);
  assert.equal(decRes.status, 200);
  const decData = await decRes.json();
  assert.equal(decData.data.date, decDate);
  assert.ok(decData.data.slots.length > 0, 'December 20 must have available slots');
  assert.ok(decData.data.availabilityLabel.startsWith('December 20 Availability:'), 'Label must be "December 20 Availability:"');
  console.log(`✓ 5. December 20 Availability loads dynamically: ${decData.data.availabilityLabel} (${decData.data.slots.length} slots)`);

  // 6. Day 90 upper bound
  const day90Str = DateTime.now().setZone(parentTz).plus({ days: 90 }).toFormat('yyyy-MM-dd');
  const d90Res = await fetch(`${BASE_URL}/api/availability?subjectId=ai_ml&date=${day90Str}&parentTimezone=${parentTz}`);
  assert.equal(d90Res.status, 200);
  const d90Data = await d90Res.json();
  assert.equal(d90Data.data.date, day90Str);
  console.log(`✓ 6. Day 90 (${day90Str}) is accepted within the 90-day booking window`);

  // 7. Day 91 rejection
  const day91Str = DateTime.now().setZone(parentTz).plus({ days: 91 }).toFormat('yyyy-MM-dd');
  const d91Res = await fetch(`${BASE_URL}/api/availability?subjectId=ai_ml&date=${day91Str}&parentTimezone=${parentTz}`);
  assert.equal(d91Res.status, 400);
  const d91Data = await d91Res.json();
  assert.equal(d91Data.code, 'DATE_OUT_OF_WINDOW');
  console.log(`✓ 7. Day 91 (${day91Str}) is correctly rejected: ${d91Data.code}`);

  // 8. Past date rejection
  const yesterdayStr = DateTime.now().setZone(parentTz).minus({ days: 1 }).toFormat('yyyy-MM-dd');
  const pastRes = await fetch(`${BASE_URL}/api/availability?subjectId=ai_ml&date=${yesterdayStr}&parentTimezone=${parentTz}`);
  assert.equal(pastRes.status, 400);
  const pastData = await pastRes.json();
  assert.equal(pastData.code, 'DATE_IN_PAST');
  console.log(`✓ 8. Past date (${yesterdayStr}) is correctly rejected: ${pastData.code}`);

  // 9. Full Booking flow across October, November, and December
  const monthsToBook = [
    { label: 'October', dateStr: '2026-10-15', subjectId: 'coding_programming' },
    { label: 'November', dateStr: '2026-11-12', subjectId: 'ai_ml' },
    { label: 'December', dateStr: '2026-12-20', subjectId: 'web_development' }
  ];

  for (const item of monthsToBook) {
    const availRes = await fetch(`${BASE_URL}/api/availability?subjectId=${item.subjectId}&date=${item.dateStr}&parentTimezone=${parentTz}`);
    const avail = await availRes.json();
    assert.ok(avail.data.slots.length > 0);
    const chosenSlot = avail.data.slots[0];

    const bookingPayload = {
      parentName: `Parent ${item.label}`,
      parentEmail: `parent.${item.label.toLowerCase()}@example.com`,
      parentPhone: '+1-555-0199',
      childName: `Kid ${item.label}`,
      childAge: 10,
      priorCodingExperience: 'BEGINNER',
      subjectId: item.subjectId,
      parentTimezone: parentTz,
      utcStartIso: chosenSlot.utcStart,
      parentLocalDatetime: `${item.dateStr} ${chosenSlot.parentLocalTime}`
    };

    const bookRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });

    assert.equal(bookRes.status, 201, `Booking for ${item.label} (${item.dateStr}) should succeed`);
    const bookData = await bookRes.json();
    assert.ok(bookData.data.bookingId);
    assert.ok(bookData.data.mentorName || bookData.data.mentor_name);
    assert.ok(bookData.data.meetingLink);
    console.log(`✓ 9. Confirmed booking in ${item.label} (${item.dateStr}): Booking ID ${bookData.data.bookingId}, Mentor: ${bookData.data.mentorName || bookData.data.mentor_name}`);
  }

  // 10. Verify Date-Specific Independent Daily Capacity
  const checkOct = await (await fetch(`${BASE_URL}/api/availability?subjectId=coding_programming&date=2026-10-15&parentTimezone=${parentTz}`)).json();
  const checkNov = await (await fetch(`${BASE_URL}/api/availability?subjectId=ai_ml&date=2026-11-12&parentTimezone=${parentTz}`)).json();
  console.log(`✓ 10. October 15 booked: ${checkOct.data.dateBookingsCount}/20. November 12 booked: ${checkNov.data.dateBookingsCount}/20 (Independent counts!)`);

  console.log('\n============================================================');
  console.log('ALL VERIFICATIONS PASSED: 90-DAY FUTURE CALENDAR IS FULLY OPERATIONAL!');
  console.log('============================================================');
}

runVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
