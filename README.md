# Codeyoung Trial-Class Appointment Booking System

A production-grade, full-stack ed-tech web application for booking 1:1 live trial classes. Built with React (Vite) and Node.js (Express) with an atomic SQLite database engine (`better-sqlite3`), IANA-compliant Daylight Saving Time (DST) timezone handling, deterministic load-balanced mentor assignment, client-request idempotency keys, parent account persistence, and automated Vitest testing.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Installation](#6-installation)
7. [Environment Setup](#7-environment-setup)
8. [How to Run Frontend](#8-how-to-run-frontend)
9. [How to Run Backend](#9-how-to-run-backend)
10. [Database Setup & Schema](#10-database-setup--schema)
11. [Seeded Dataset](#11-seeded-dataset)
12. [Mentor Assignment Logic](#12-mentor-assignment-logic)
13. [Timezone & DST Handling](#13-timezone--dst-handling)
14. [Idempotency Key Architecture](#14-idempotency-key-architecture)
15. [Parent Account Persistence & Returning-User Auth](#15-parent-account-persistence--returning-user-auth)
16. [Concurrency Smoke Test & Demonstration](#16-concurrency-smoke-test--demonstration)
17. [Automated Vitest Test Suite](#17-automated-vitest-test-suite)
18. [Daily Mentor & System Limits](#18-daily-mentor--system-limits)
19. [Error Handling & User States](#19-error-handling--user-states)
20. [API Documentation](#20-api-documentation)
21. [Design Decisions](#21-design-decisions)
22. [How to Push to GitHub & Deploy](#22-how-to-push-to-github--deploy)

---

## 1. Project Overview
Inspired by Codeyoung's trial booking experience, this application allows parents worldwide to book a free 30-minute 1:1 trial class for their child in coding, robotics, AI, game design, web development, or math logic.

Parents choose their preferred course and view slots converted automatically into their local time. When confirmed, the backend evaluates mentor qualifications, operating hours (10:00 AM – 8:00 PM IST), and daily class limits (max 2 classes per mentor per day in IST) to assign the optimal mentor and generate a virtual classroom link.

Returning parents are automatically recognized via persistent session cookies and landed directly on their **Parent Dashboard** to inspect upcoming appointments and launch virtual classes.

---

## 2. Key Features
- **Modern Ed-Tech Frontend Redesign**:
  - **Asymmetric Hero with 6-Course Orbit**: Left value proposition (confident heading, eyebrow badge, CTAs, 4 trust indicators) + Right central "1:1 Live Mentorship" hub with orbital cards for all 6 authentic courses, automatically adapting to a stacked/grid layout on tablets/mobile without overlapping.
  - **Real System Facts & Dynamic Availability Strip**: Displays 10 Active Mentors, 20 Daily System Capacity, 2 Max Classes/Mentor/Day, 30 min Trial, and real dynamic database availability (`X slots remaining today`).
  - **4-Step How It Works**: Numbered steps (01 to 04) truthfully explaining mentor matching, daily limits, and dual-timezone clarity.
  - **6-Course Curriculum Showcase**: Features the 6 authentic courses with suitability badges, mentor counters, and direct booking trigger buttons.
  - **10-Mentor Faculty Roster**: Working category filter tabs, avatar initials, availability badges, IST working hours, and capacity policy tags.
  - **Dedicated Timezone & DST Guide**: 3-step conversion architecture, highlighted Daylight Saving Time explainer, and live interactive Luxon-powered schedule comparison (Winter vs Summer DST).
  - **Persistent "YOUR TRIAL" Summary Sidebar**: Split layout in the booking wizard keeping course track, local schedule, assigned mentor, India time, and $0 trial status visible throughout the booking flow.
- **Progressive 6-Step Booking Wizard**:
  - **Step 1**: Parent details (Parent Name, Parent Email, Child Name). *Strictly no phone numbers or credit cards collected.*
  - **Step 2**: Explicit Course Selection from 6 tracks matched to mentor expertise.
  - **Step 3**: Course Information & Takeaways (Duration: 30 minutes, age level, 3 key experiences).
  - **Step 4**: Date & Timezone Selection with auto-converted local slot grid.
  - **Step 5**: Booking Review with atomic conflict verification and persistent `clientRequestId`.
  - **Step 6**: Instant Confirmation with booking reference, dummy class link, and simulated notification dispatch logs.
- **Parent Account Persistence & Dashboard**:
  - Returning parents land directly on their personalized dashboard with upcoming trial classes.
  - View class link, mentor details, and student information.
  - Ability to book another trial without re-entering account information.
- **Client-Request Idempotency Key**:
  - UUID generated once upon reaching the confirm step and retained across retries/re-renders.
  - Pre-check lookup returns existing booking with `200 OK` (idempotent replay).
  - Atomic transaction handling with race-condition catching (`SQLITE_CONSTRAINT_UNIQUE`).
- **10 Seeded Mentors**: All based in `Asia/Kolkata` with realistic specializations, bios, and active schedule status.
- **Daily Capacity Rules**:
  - Max 2 classes per mentor per local calendar day (`Asia/Kolkata`).
  - Total system capacity of 20 bookings per day (10 mentors × 2 classes).
- **Concurrency Protection**:
  - Zero double-bookings under high concurrent load via atomic SQLite transactions.
  - Verified with standalone smoke test script (`backend/scripts/concurrency-demo.js`).
- **Automated Vitest Test Suite**: 22 tests across 3 suites covering mentor assignment, DST spring-forward/fall-back, capacity caps, cross-date boundary calculation, session auth, and idempotency.

---

## 3. Tech Stack
- **Frontend**:
  - React 18 with Vite
  - Lucide React (coherent icon system, no emojis in UI)
  - Luxon & native Intl for timezone manipulation
  - Canvas Confetti for booking celebration
  - Pure Vanilla CSS design system with CSS custom properties
- **Backend**:
  - Node.js (v20+ / v24) with Express.js
  - SQLite database engine (`better-sqlite3`) with WAL journal mode and immediate transactions
  - Luxon for IANA timezone conversions and DST math
  - CORS, Dotenv, Cookie-based session management
- **Testing**:
  - Vitest test runner (`vitest run`) with isolated in-memory SQLite databases per test

---

## 4. Architecture

```
[Parent Browser] ────────── (Vite Dev Server: Port 5173 / Production Bundle)
        │
        │ HTTP / JSON (API: /api/*) + HttpOnly Session Cookies
        ▼
[Express Server] ────────── (Port 5000)
   ├── Routing Layer
   │     ├── /api/auth       (Login, Session Recovery, Logout)
   │     ├── /api/parent     (Authenticated Parent Bookings & Dashboard)
   │     ├── /api/subjects   (Subject Catalog)
   │     ├── /api/mentors    (Mentor Roster & Working Hours)
   │     ├── /api/availability (DST-aware Local Slot Generator)
   │     ├── /api/bookings   (Atomic Idempotent Booking Creation)
   │     └── /api/dev        (Evaluator Test Lab & Reset)
   ├── Services Layer
   │     ├── mentorAssignment.js (Atomic mentor filtering, working hours, capacity, non-overlap)
   │     ├── bookingService.js   (Atomic db.transaction() & idempotency)
   │     ├── availabilityService.js (Timezone slot matrix)
   │     └── authService.js      (Cryptographic session tokens)
   └── Storage Layer
         └── SQLite Database (better-sqlite3 WAL Mode, appointments.db)
```

---

## 5. Folder Structure
```
CodeYoung-/
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── LandingHero.jsx
│       │   ├── TrustStrip.jsx
│       │   ├── Why1on1.jsx
│       │   ├── HowItWorks.jsx
│       │   ├── CourseShowcase.jsx
│       │   ├── MentorShowcase.jsx
│       │   ├── TimezoneGuide.jsx
│       │   ├── FaqSection.jsx
│       │   ├── Footer.jsx
│       │   ├── ParentDashboard.jsx
│       │   ├── AuthModal.jsx
│       │   ├── VirtualClassModal.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── DevToolbar.jsx
│       │   └── BookingWizard/
│       │       ├── BookingWizard.jsx
│       │       ├── Step1ParentDetails.jsx
│       │       ├── Step2SubjectSelect.jsx
│       │       ├── Step3CourseInfo.jsx
│       │       ├── Step4DateTimezone.jsx
│       │       ├── Step5ReviewBooking.jsx
│       │       └── Step6Confirmation.jsx
│       └── services/
│           └── api.js
├── backend/
│   ├── package.json
│   ├── scripts/
│   │   └── concurrency-demo.js
│   ├── tests/
│   │   ├── timezone-dst.test.js
│   │   ├── booking.test.js
│   │   └── authAndPersistence.test.js
│   └── src/
│       ├── index.js
│       ├── app.js
│       ├── db/
│       │   ├── index.js
│       │   └── seed.js
│       ├── utils/
│       │   └── time.js
│       ├── services/
│       │   ├── mentorAssignment.js
│       │   ├── bookingService.js
│       │   ├── availabilityService.js
│       │   └── authService.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── parent.js
│       │   ├── bookings.js
│       │   ├── availability.js
│       │   ├── mentors.js
│       │   ├── subjects.js
│       │   └── dev.js
│       └── data/
│           ├── mentors.js
│           └── subjects.js
└── README.md
```

---

## 6. Installation

Clone the repository and install dependencies:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/codeyoung-trial-booking.git
cd codeyoung-trial-booking

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 7. Environment Setup
The backend defaults to port `5000` and creates `backend/data/appointments.db` automatically. Optionally, create `backend/.env`:

```env
PORT=5000
DB_PATH=./data/appointments.db
```

---

## 8. How to Run Frontend
From the `frontend` directory:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` (or port displayed by Vite).

---

## 9. How to Run Backend
From the `backend` directory:
```bash
cd backend
npm start
```
The API starts at `http://localhost:5000`.

### Running Both Concurrently
From the project root:
```bash
npm run dev
```

---

## 10. Database Setup & Schema
SQLite is powered by `better-sqlite3` with WAL mode enabled. Tables and indices are initialized and migrated automatically:

```sql
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  mentor_id TEXT,
  role TEXT NOT NULL DEFAULT 'parent',  -- 'parent' | 'mentor'
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_parent ON sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON sessions(mentor_id);

CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  specialization TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  working_hours_start INTEGER NOT NULL DEFAULT 10,
  working_hours_end INTEGER NOT NULL DEFAULT 20,
  max_daily_classes INTEGER NOT NULL DEFAULT 2,
  supported_subjects TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  client_request_id TEXT UNIQUE,        -- Idempotency key
  parent_id TEXT,
  parent_name TEXT,
  parent_email TEXT,
  child_name TEXT,
  subject_id TEXT,
  subject_title TEXT,
  parent_timezone TEXT,
  parent_local_datetime TEXT,
  mentor_id TEXT NOT NULL,
  mentor_name TEXT,
  mentor_timezone TEXT DEFAULT 'Asia/Kolkata',
  mentor_local_date TEXT NOT NULL,      -- 'YYYY-MM-DD' in Asia/Kolkata
  mentor_local_time TEXT,               -- 'h:mm a' in Asia/Kolkata
  slot_start_utc TEXT,                  -- ISO 8601 UTC instant
  slot_end_utc TEXT,                    -- ISO 8601 UTC instant
  start_time_utc TEXT,
  end_time_utc TEXT,
  meeting_link TEXT,
  dummy_class_link TEXT,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_client_req_id ON bookings(client_request_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor_day ON bookings(mentor_id, mentor_local_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_range ON bookings(mentor_id, slot_start_utc, slot_end_utc, status);
CREATE INDEX IF NOT EXISTS idx_bookings_parent_id ON bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parent_email ON bookings(parent_email);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  recipient TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'SENT',
  created_at TEXT NOT NULL
);
```

---

## 11. Seeded Dataset

### 10 Mentors (`Asia/Kolkata`, Staggered Shifts)
1. **Sneha Roy** (`mentor_01`): AI & Machine Learning Specialist (AI & ML, Coding) • 10:00 AM – 4:00 PM IST
2. **Aarav Sharma** (`mentor_02`): Python & Game Development Coach (Coding, Game Dev) • 1:00 PM – 8:00 PM IST
3. **Priya Nair** (`mentor_03`): Senior Web Development & UI Coach (Web Dev, Coding) • 11:00 AM – 6:00 PM IST
4. **Rohan Kulkarni** (`mentor_04`): Robotics & Hardware Logic Specialist (Robotics, Algorithms) • 10:00 AM – 4:00 PM IST
5. **Ananya Iyer** (`mentor_05`): Game Design & Scratch Specialist (Game Dev, Coding) • 2:00 PM – 8:00 PM IST
6. **Vikram Patel** (`mentor_06`): Interactive Web & Mobile App Mentor (Web Dev, Game Dev) • 10:00 AM – 5:00 PM IST
7. **Meera Krishnan** (`mentor_07`): Algorithms & Olympiad Math Coach (Algorithms, Coding) • 12:00 PM – 7:00 PM IST
8. **Aditya Verma** (`mentor_08`): Python & Data Science Instructor (AI & ML, Algorithms) • 1:00 PM – 8:00 PM IST
9. **Kavya Menon** (`mentor_09`): Creative Coding & Robotics Educator (Coding, Robotics) • 10:00 AM – 4:00 PM IST
10. **Arjun Rao** (`mentor_10`): Senior Full-Stack & Algorithm Architect (Coding, Web Dev, Algorithms) • 3:00 PM – 8:00 PM IST

### 6 Learning Tracks
- `coding_programming`: Coding & Programming
- `web_development`: Web Development
- `ai_ml`: AI & Machine Learning
- `robotics`: Robotics & Hardware Logic
- `game_development`: Game Development
- `algorithms_math`: Algorithms & Math Thinking

---

## 12. Mentor Assignment Logic
Implemented in [`backend/src/services/mentorAssignment.js`](file:///c:/Users/Sindhu%20S%20Hegde/Desktop/project/CodeYoung-/backend/src/services/mentorAssignment.js):
1. **Operating Hours**: Converts requested UTC slot to `Asia/Kolkata`. Mentors must be on-duty during the entire 30-minute interval.
2. **Daily Capacity Limit**: Mentors with `>= 2` confirmed bookings on `mentor_local_date` (`Asia/Kolkata`) are excluded.
3. **Schedule Overlap Check**: Mentors with an existing booking overlapping `[slotStartUTC, slotEndUTC]` are excluded:
   ```sql
   (slot_start_utc < slotEndUTC AND slot_end_utc > slotStartUTC)
   ```
4. **Subject Matching**: Optional subject qualification check against supported subjects.
5. **Least-Booked Selection**:
   - Eligible mentors are prioritized by **fewest bookings today on that local date** (balanced dispersion).
   - Stable deterministic tie-breaker by mentor ID and round-robin time-bucket rotation.
6. **Clean Exhaustion**: If no mentor is available, returns `null` cleanly (does not throw).

---

## 13. Timezone & DST Handling
- All internal booking instants are normalized and stored as **ISO 8601 UTC strings** (`slot_start_utc`, `slot_end_utc`).
- Utilizes **Luxon** with the standard IANA timezone database. Static offsets (e.g. `-10.5 hours`) are strictly avoided.
- **US Spring-Forward (23-hour day)**: Nonexistent local gap times (e.g. 2:30 AM in America/New_York) are detected and sanely normalized to valid UTC instants without generating corrupted timestamps.
- **US Fall-Back (25-hour day)**: Ambiguous repeated local times (e.g. 1:30 AM occurring twice) resolve deterministically to a single consistent UTC instant, preventing double-counting against mentor quotas.
- **Mentor-Local-Date Boundary**: Evaluates capacity strictly on the **mentor's local date (`Asia/Kolkata`)**. For example, a slot at 10:30 PM EDT on Oct 15 in New York corresponds to 8:00 AM IST on Oct 16 in India; the daily limit is evaluated against Oct 16.

---

## 14. Idempotency Key Architecture
- **Frontend Generation**: In `Step5ReviewBooking.jsx`, a UUID is generated once via `useState(() => crypto.randomUUID())` when reaching the confirmation step. It is never regenerated across component re-renders or submit button retries.
- **Idempotency Pre-Check**: Before running availability verification, `POST /api/bookings` checks whether `client_request_id` already exists in the database. If found, it immediately returns the existing booking record with **HTTP 200 OK** (`idempotentReplay: true`).
- **Atomic Transaction**: The availability check and insertion logic are wrapped in an atomic `better-sqlite3` `db.transaction()`.
- **Race Condition Safety**: If two concurrent requests with the same `clientRequestId` bypass the pre-check simultaneously, SQLite's unique constraint triggers. The handler catches `SQLITE_CONSTRAINT_UNIQUE`, queries the record that just committed, and returns `200 OK` rather than a 500 error.

---

## 15. Parent Account Persistence & Returning-User Auth
- **Account Persistence**: When a parent books a trial class, a record is created in the `parents` table.
- **Session Authentication**: Cryptographic session tokens (32-byte hex) are stored in the `sessions` table and issued via secure, HTTP-only cookies (`codeyoung_session`).
- **Automatic Recognition**: When a parent refreshes the page or visits `/`, the application checks `/api/auth/me`. If authenticated, they land directly on `/dashboard` and see their upcoming trial class, mentor details, and meeting link.
- **Multi-Booking Flow**: From their dashboard, parents can click **"Book Another Class"** to schedule an additional subject without re-entering their profile information.

---

## 16. Concurrency Smoke Test & Demonstration
The codebase includes a standalone concurrency validation script in [`backend/scripts/concurrency-demo.js`](file:///c:/Users/Sindhu%20S%20Hegde/Desktop/project/CodeYoung-/backend/scripts/concurrency-demo.js).

### How to Run:
Ensure the server is running on port 5000, then execute:
```bash
cd backend
node scripts/concurrency-demo.js
```

### Verified Terminal Output:
```
==============================================================================
  CODEYOUNG CONCURRENCY & IDEMPOTENCY DEMO / SMOKE TEST
==============================================================================
Server URL          : http://localhost:5000
Concurrent Requests : 12
Target Slot (UTC)   : 2027-06-28T10:00:00.000Z -> 2027-06-28T10:30:00.000Z
Mentor Local Date   : 2027-06-28 (Asia/Kolkata, 15:30 - 16:00 IST)
Expected Capacity   : 10 mentors active; max 1 booking each for this exact slot
------------------------------------------------------------------------------
Firing 12 simultaneous POST /api/bookings requests via Promise.all()...

REQUEST EXECUTION LOG:
------------------------------------------------------------------------------
Req #  Status   Client Request ID                     Outcome / Mentor Assigned
------------------------------------------------------------------------------
#1    201      41ccd3be-c666-4e58-b6a0-a4667232028f  CONFIRMED -> Meera Krishnan (mentor_07)
#2    201      383130c8-4373-4ea9-aa72-0359798e1344  CONFIRMED -> Priya Nair (mentor_03)
#3    201      9ef06e57-5eed-426f-a893-1e5b1e14e0d7  CONFIRMED -> Vikram Patel (mentor_06)
#4    201      ab49f9ab-5bcc-4b96-89a6-87d5a699bb3d  CONFIRMED -> Rohan Kulkarni (mentor_04)
#5    201      df59e577-2790-4067-9107-598354631c6e  CONFIRMED -> Ananya Iyer (mentor_05)
#6    201      168438e6-a9ae-4eaa-965c-4e88d0106245  CONFIRMED -> Aarav Sharma (mentor_02)
#7    201      9908f13a-8a1f-450a-a04f-57ea5ce43422  CONFIRMED -> Sneha Roy (mentor_01)
#8    201      e1dad15f-62b8-4c65-bd6b-13f7ae8d15d1  CONFIRMED -> Arjun Rao (mentor_10)
#9    201      dfef3f16-63eb-45a1-a9c7-23d7c7c48f30  CONFIRMED -> Aditya Verma (mentor_08)
#10   201      d3026352-a41f-46c2-af04-3476cf183f4f  CONFIRMED -> Kavya Menon (mentor_09)
#11   409      3e2953d6-b706-42b8-88c9-d11fbda6cbae  REJECTED -> NO_MENTORS_AVAILABLE
#12   409      3f041508-4c19-4535-89b1-cf09fa207556  REJECTED -> NO_MENTORS_AVAILABLE
------------------------------------------------------------------------------

SUMMARY BREAKDOWN:
• Total Requests Dispatched : 12
• Total Execution Time      : 86 ms
• 201 Created (Confirmed)   : 10
• 409 NO_MENTORS_AVAILABLE  : 2
• Unexpected Responses      : 0

IDEMPOTENCY REPLAY TEST:
Re-submitting duplicate POST with original clientRequestId: 41ccd3be-c666-4e58-b6a0-a4667232028f...
✓ Replay succeeded with HTTP 200 OK (idempotentReplay: true, bookingId: bk_muiruz0p_trmw)

INVARIANT VERIFICATION:
[PASS] Invariant 1: Zero double-bookings (all 10 confirmed mentors are distinct)
[PASS] Invariant 2: Capacity boundary respected (max 1 class per mentor per slot)
[PASS] Invariant 3: Clean rejection for overflow (2 requests got 409 NO_MENTORS_AVAILABLE)
[PASS] Invariant 4: No 500 internal server errors encountered
[PASS] Invariant 5: Idempotent replay returns 200 OK with original booking

==============================================================================
ALL CONCURRENCY & IDEMPOTENCY INVARIANTS SATISFIED (Exit Code: 0)
==============================================================================
```

---

## 17. Automated Vitest Test Suite
The testing pipeline is powered by **Vitest** with isolated in-memory SQLite instances per test (`createIsolatedDb()`).

### How to Run:
```bash
cd backend
npm test
```

### Verified Test Suite Output:
```
> codeyoung-backend@1.0.0 test
> vitest run

 RUN  v5.0.2 C:/Users/Sindhu S Hegde/Desktop/project/CodeYoung-/backend

 ✓ tests/timezone-dst.test.js (6 tests) 126ms
   ✓ 1. US spring-forward: nonexistent local time normalizes sanely via Luxon without wrong UTC instant
   ✓ 2. US fall-back: ambiguous repeated hour resolves consistently and prevents double counting
   ✓ 3. Mentor capacity cap: 2 bookings succeed; 3rd on same local date excludes mentor and assigns another
   ✓ 4. Mentor-local-date boundary: daily cap is calculated against MENTOR local date, not parent or UTC
   ✓ 5. Overlap prevention: cannot assign overlapping 10:30-11:30, but CAN assign adjacent 11:00-12:00
   ✓ 6. No-mentor-available: returns null cleanly (not throw) when all mentors are exhausted
 ✓ tests/booking.test.js (7 tests) 154ms
   ✓ 1. Subject Compatibility: assigns mentor qualified for the subject
   ✓ 2. Timezone & Cross-Date Conversion: accurately evaluates mentor local calendar date
   ✓ 3. Mentor Assignment Strategy: assigns least booked mentor
   ✓ 4. Mentor Daily Limit: maximum 2 demo classes per mentor per day enforced
   ✓ 5. Duplicate / Overlapping Booking Protection: rejects conflicting slot
   ✓ 6. No Phone Number Required: booking succeeds with only parent name, email and child name
   ✓ 7. Daylight Saving Time (DST) Handling: handles offsets across time boundaries dynamically
 ✓ tests/authAndPersistence.test.js (9 tests) 346ms
   ✓ TEST 1: New Parent Registration & Booking Association
   ✓ TEST 2: Returning Parent Recognition & Direct Dashboard Retrieval
   ✓ TEST 3: Session Persistence Across Refresh (/api/auth/me)
   ✓ TEST 4: Logout Invalidates Session
   ✓ TEST 5: Login Again After Logout Restores Access to Existing Booking
   ✓ TEST 6: Book Another Trial Under Same Parent Account
   ✓ TEST 7: Existing User With No Upcoming Class (Completed Past Session)
   ✓ TEST 8: Email Normalization and Validation
   ✓ TEST 9: Unauthorized Booking Access Prevention (Ownership Enforcement)
 ✓ tests/mentorAuthAndDashboard.test.js (11 tests) 463ms
   ✓ 1. Parent login creates role = "parent" with parentId
   ✓ 2. Mentor login creates role = "mentor" with mentorId
   ✓ 3. Refresh preserves the correct role/session (/api/auth/me)
   ✓ 4. Mentor can access only their own assigned bookings via GET /api/mentor/bookings
   ✓ 5. Backend derives mentor identity from session; ignores mentorId in query or body
   ✓ 6. Mentor cannot access another mentor’s individual booking via GET /api/mentor/bookings/:id
   ✓ 7. Parent cannot access mentor endpoints (403 Forbidden)
   ✓ 8. Mentor cannot access parent-only endpoints (403 Forbidden)
   ✓ 9. Parent and assigned mentor receive/access the exact same meeting_link
   ✓ 10. Logout invalidates session for both roles
   ✓ 11. Unauthenticated requests to protected endpoints return 401 Unauthorized

 Test Files  4 passed (4)
      Tests  33 passed (33)
   Duration  1.24s (tests 42%, transform 29%, import 27%, worker 1%)
```

---

## 18. Daily Mentor & System Limits
- **Mentor Daily Limit**: Exactly 2 trial classes per mentor per local calendar day (`Asia/Kolkata`).
- **Calendar Day Evaluation**: Evaluated strictly on the **mentor's local date (`Asia/Kolkata`)**.
- **System Capacity**: 10 mentors × 2 classes = **20 classes maximum per calendar day**.

---

## 19. Error Handling & User States
- `NO_MENTORS_AVAILABLE`: Displayed when all mentors are booked or outside operating hours (HTTP 409).
- `MENTOR_DAILY_LIMIT_REACHED`: Mentors qualified for the subject have conducted 2 classes today.
- `SLOT_UNAVAILABLE`: Time slot was booked by another concurrent request.
- `DAILY_CAPACITY_REACHED`: System cap of 20 classes reached for that date.
- `INVALID_REQUEST`: Missing required details or invalid email format.

---

## 20. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Role-aware login: handles Parent (`email`, `name`) or Mentor (`role: 'mentor'`, `identifier`) |
| `GET` | `/api/auth/me` | Validates active session token and returns Parent or Mentor profile |
| `POST` | `/api/auth/logout` | Terminates active session and invalidates cookie |
| `GET` | `/api/parent/bookings` | Returns all bookings owned by authenticated parent (`requireParentAuth`) |
| `GET` | `/api/parent/bookings/:id` | Returns specific booking with strict parent ownership enforcement |
| `GET` | `/api/mentor/bookings` | Returns all bookings assigned to authenticated mentor (`requireMentorAuth`) |
| `GET` | `/api/mentor/bookings/:id` | Returns specific booking with strict mentor ownership enforcement |
| `GET` | `/api/mentor/me` | Returns authenticated mentor profile |
| `GET` | `/api/subjects` | Returns all 6 subjects enriched with mentor counts |
| `GET` | `/api/mentors` | Returns all 10 mentors with today's booking counts |
| `GET` | `/api/availability` | Query params: `subjectId`, `date`, `parentTimezone`. Returns local slots |
| `POST` | `/api/bookings` | Creates a booking. Body includes `clientRequestId` for idempotency |
| `GET` | `/api/bookings/:id` | Retrieves a booking record by ID |
| `GET` | `/api/bookings` | Returns all bookings (Admin/Evaluator) |
| `POST` | `/api/dev/reset` | Resets all bookings to 0 |
| `POST` | `/api/dev/seed-mentor-limit` | Seeds 2 bookings for all mentors of a subject |
| `POST` | `/api/dev/seed-capacity-limit`| Seeds 20 bookings across all mentors |
| `GET` | `/api/dev/stats` | Returns real-time system booking stats |

---

## 21. Design Decisions
1. **Light-Mode First & Restrained Aesthetics**: Employs an ed-tech palette with high readability (`#315F61` Teal, `#244E50` Dark Teal, `#FFC83D` Warm Yellow, `#FAFAF8` Warm Background, `#163D4A` Dark Text). Uses generous whitespace, clean card borders, and zero UI emojis (strictly Lucide React icons).
2. **Authentic Data & No Fake Marketing**: Single source of truth for the 6 courses and 10 mentors. All displayed counters (20 daily capacity, 2 classes/mentor, active availability) are either core assignment rules or dynamically calculated from the SQLite database.
3. **Orbital Course Visualization with Mobile Graceful Degradation**: On desktop, the 6 authentic courses orbit around a central "1:1 Live Mentorship" hub with dashed concentric rings. On tablets and mobile (`< 992px`), the orbit automatically transforms into a clean 2-column or 1-column grid to ensure zero clipping, no horizontal overflow, and perfect readability.
4. **Transparent International Timezone Architecture**: Dedicated Timezone Guide visualizes UTC conversion and DST time shifts using real IANA timezone calculations via Luxon.
5. **Persistent Booking Context**: The booking wizard provides a persistent "YOUR TRIAL" summary card so parents always see their chosen course, local time, mentor name, and mentor India time without losing context.
6. **Zero Phone Number Policy**: Strictly complies with student privacy best practices by never asking for a parent's phone number or credit card.
7. **Atomic WAL SQLite (`better-sqlite3`)**: Provides full immediate transaction isolation, preventing race conditions and phantom reads under concurrent traffic.
8. **Deterministic Load Balancing**: Balances class assignments across available teachers rather than overloading a single mentor.
9. **Interactive Classroom Simulation**: Clicking a meeting link launches an interactive virtual classroom demo with webcam tiles, mic/camera controls, and code editor.
10. **Hidden Developer Controls**: Dev controls (`DevToolbar`) are hidden by default from normal parent users and accessed via `?dev=true` or `Ctrl+Shift+D`.

---

## 22. How to Push to GitHub & Deploy

### Step A: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g. `codeyoung-trial-booking`).
2. Run in terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/codeyoung-trial-booking.git
git branch -M main
git push -u origin main
```

### Step B: Deploy Live (Recommended: Render)
1. Go to [Render.com](https://render.com) and create a **Web Service** from your GitHub repo.
2. Settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
3. Live URL will be active in ~2 minutes (e.g. `https://codeyoung-trial-booking.onrender.com`).
