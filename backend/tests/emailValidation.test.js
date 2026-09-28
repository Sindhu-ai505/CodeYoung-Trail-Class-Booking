import { test, describe, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { initDb, resetDb, queryOne } from '../src/db.js';
import { createApp } from '../src/app.js';
import { validateEmail, normalizeEmail, INVALID_EMAIL_CODE, INVALID_EMAIL_MESSAGE } from '../src/utils/validation.js';
import { MENTOR_TIMEZONE } from '../src/services/availabilityService.js';

describe('Part 1: Email Validation & Normalization Suite', () => {
  let app;
  let server;
  let baseUrl;

  beforeAll(async () => {
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

  const VALID_EMAILS = [
    'parent@gmail.com',
    'firstname.lastname@gmail.com',
    'parent.name@gmail.com',
    'user123@example.co.uk',
    'firstname.lastname@codeyoung.com',
    'user@example.co',
    'user@outlook.com',
    'user@yahoo.com',
    'user@hotmail.com',
    'user@company.in',
    'user@company.co.in',
    'user@example.org',
    'user@example.net'
  ];

  const INVALID_EMAILS = [
    'fheifj@.co',
    'abc@',
    '@gmail.com',
    'abc@.com',
    'abc@com',
    'abc gmail@gmail.com',
    'abc..def@gmail.com',
    '.abc@gmail.com',
    'abc.@gmail.com',
    'abc@gmail',
    'abc@-gmail.com',
    'abc@gmail-.com',
    'abc@gmail..com',
    'abc@@gmail.com'
  ];

  test('TEST 1: Shared validateEmail accepts all structurally valid emails across diverse TLDs and providers', () => {
    for (const email of VALID_EMAILS) {
      const isValid = validateEmail(email);
      assert.equal(isValid, true, `Expected valid email '${email}' to be accepted.`);
    }
  });

  test('TEST 2: Shared validateEmail rejects all structurally malformed emails', () => {
    for (const email of INVALID_EMAILS) {
      const isValid = validateEmail(email);
      assert.equal(isValid, false, `Expected invalid email '${email}' to be rejected.`);
    }
  });

  test('TEST 3: normalizeEmail preserves case-insensitivity and trims whitespace', () => {
    assert.equal(normalizeEmail('  Parent@Gmail.com  '), 'parent@gmail.com');
    assert.equal(normalizeEmail('USER@EXAMPLE.CO.UK'), 'user@example.co.uk');
    assert.equal(normalizeEmail(''), '');
    assert.equal(normalizeEmail(null), '');
  });

  test('TEST 4: POST /api/auth/login rejects malformed emails with 400 INVALID_EMAIL and creates no parent', async () => {
    for (const invalidEmail of ['fheifj@.co', 'abc@.com', 'abc@-gmail.com', 'abc@@gmail.com']) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'parent',
          name: 'Test Parent',
          email: invalidEmail
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, INVALID_EMAIL_CODE);
      assert.equal(data.message, INVALID_EMAIL_MESSAGE);

      // Verify no record was created in parents table
      const created = queryOne(`SELECT * FROM parents WHERE email = ?`, [invalidEmail.toLowerCase()]);
      assert.equal(created, null);
    }
  });

  test('TEST 5: POST /api/auth/login accepts valid non-Gmail emails from Outlook, Yahoo, and regional domains', async () => {
    const testCases = [
      { email: 'student@outlook.com', name: 'Alice Outlook' },
      { email: 'parent@yahoo.com', name: 'Bob Yahoo' },
      { email: 'user@company.in', name: 'Dev Company' },
      { email: 'learner@example.co.uk', name: 'Charlie UK' }
    ];

    for (const tc of testCases) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'parent',
          name: tc.name,
          email: tc.email
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.role, 'parent');
      assert.equal(data.parent.email, tc.email.toLowerCase());
      assert.equal(data.parent.name, tc.name);
    }
  });

  test('TEST 6: POST /api/bookings rejects malformed parent emails with 400 INVALID_EMAIL and creates no booking', async () => {
    const validFutureSlotUtc = DateTime.now()
      .setZone(MENTOR_TIMEZONE)
      .plus({ days: 2 })
      .set({ hour: 11, minute: 0, second: 0, millisecond: 0 })
      .toUTC()
      .toISO();

    for (const invalidEmail of ['fheifj@.co', 'abc..def@gmail.com', 'abc@com']) {
      const res = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: 'Test Parent',
          parentEmail: invalidEmail,
          childName: 'Aarav',
          subjectId: 'coding_programming',
          parentTimezone: 'America/New_York',
          utcStartIso: validFutureSlotUtc
        })
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.success, false);
      assert.equal(data.code, INVALID_EMAIL_CODE);
      assert.equal(data.message, INVALID_EMAIL_MESSAGE);

      // Verify no booking was written to the database
      const booking = queryOne(`SELECT * FROM bookings WHERE parent_email = ?`, [invalidEmail]);
      assert.equal(booking, null);
    }
  });
});
