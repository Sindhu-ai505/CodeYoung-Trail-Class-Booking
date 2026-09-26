# Codeyoung Trial-Class Appointment Booking System

A production-grade, full-stack ed-tech web application for booking 1:1 live trial classes. Built with React (Vite) and Node.js (Express) with an SQLite transactional database, IANA-compliant Daylight Saving Time (DST) timezone engine, and deterministic load-balanced mentor assignment.

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
13. [Timezone Handling](#13-timezone-handling)
14. [Daylight Saving Time (DST) Handling](#14-daylight-saving-time-dst-handling)
15. [Daily Mentor & System Limits](#15-daily-mentor--system-limits)
16. [Error Handling & User States](#16-error-handling--user-states)
17. [How to Test Unavailable Mentor Scenario](#17-how-to-test-unavailable-mentor-scenario)
18. [How to Test the 2-Class Daily Limit](#18-how-to-test-the-2-class-daily-limit)
19. [API Documentation](#19-api-documentation)
20. [Design Decisions](#20-design-decisions)
21. [Known Limitations](#21-known-limitations)

---

## 1. Project Overview
Inspired by Codeyoung's trial booking experience, this application allows parents worldwide to book a free 30-minute 1:1 trial class for their child in coding, robotics, AI, game design, web development, or math logic.

Parents choose their preferred course and view slots converted automatically into their local time. When confirmed, the backend evaluates mentor qualifications, operating hours (10:00 AM – 8:00 PM IST), and daily class limits (max 2 classes per mentor per day in IST) to assign the optimal mentor and generate a dummy virtual classroom link.

---

## 2. Key Features
- **Progressive 6-Step Booking Wizard**:
  - **Step 1**: Parent details (Parent Name, Parent Email, Child Name). *Strictly no phone numbers or credit cards collected.*
  - **Step 2**: Explicit Course Selection from 6 tracks matched to mentor expertise.
  - **Step 3**: Course Information & Takeaways (Duration: 30 minutes, age level, 3 key experiences).
  - **Step 4**: Date & Timezone Selection with auto-converted local slot grid.
  - **Step 5**: Booking Review with atomic conflict verification.
  - **Step 6**: Instant Confirmation with booking reference, dummy class link, and simulated notification dispatch logs.
- **Calm, Light-Mode First Ed-Tech Aesthetic**: Curated color palette (`#315F61` Teal, `#244E50` Dark Teal, `#FAFAF8` Background, `#FFC83D` Warm Yellow) with deliberate whitespace and no clutter.
- **10 Seeded Mentors**: All based in `Asia/Kolkata` with realistic specializations, bios, and active schedule status.
- **Daily Capacity Rules**:
  - Max 2 classes per mentor per local calendar day (`Asia/Kolkata`).
  - Total system capacity of 20 bookings per day (10 mentors × 2 classes).
- **Evaluator Test Lab**: Built-in 1-click test triggers to immediately reproduce error states without tedious manual setup.
- **Virtual Classroom Demo**: Interactive mock classroom simulation launched directly from dummy links.
- **Automated Backend Test Suite**: 7 comprehensive tests covering mentor assignment, timezone roll-over, daily limits, race conditions, and DST.

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
  - SQLite database using `sql.js` (WebAssembly-compiled SQLite) for cross-platform zero-native-dependency reliability
  - Luxon for IANA timezone conversions and DST math
  - CORS, Dotenv
- **Testing**:
  - Node.js built-in test runner (`node:test`, `node:assert/strict`)

---

## 4. Architecture

```
[Parent Browser] ────────── (Vite Dev Server: Port 5173/5174)
        │
        │ HTTP / JSON (API Proxy: /api/*)
        ▼
[Express Server] ────────── (Port 5000)
   ├── Routing Layer (/api/subjects, /api/mentors, /api/availability, /api/bookings, /api/dev)
   ├── Services Layer
   │     ├── AvailabilityService (Luxon DST-aware slot generator)
   │     └── BookingService (Atomic assignment, load balancing, limits)
   └── Storage Layer
         └── SQLite Database (appointments.db via sql.js Wasm)
```

---

## 5. Folder Structure
```
CodeYoung-/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── services/
│       │   └── api.js
│       ├── utils/
│       │   └── timezones.js
│       └── components/
│           ├── Navbar.jsx
│           ├── Footer.jsx
│           ├── LandingHero.jsx
│           ├── HowItWorks.jsx
│           ├── CourseShowcase.jsx
│           ├── MentorShowcase.jsx
│           ├── AdminDashboard.jsx
│           ├── DevToolbar.jsx
│           ├── VirtualClassModal.jsx
│           └── BookingWizard/
│               ├── BookingWizard.jsx
│               ├── Step1ParentDetails.jsx
│               ├── Step2SubjectSelect.jsx
│               ├── Step3SubjectInfo.jsx
│               ├── Step4DateTimezone.jsx
│               ├── Step5ReviewBooking.jsx
│               └── Step6Confirmation.jsx
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── data/
│   │   │   ├── mentors.js
│   │   │   └── subjects.js
│   │   ├── services/
│   │   │   ├── availabilityService.js
│   │   │   └── bookingService.js
│   │   └── routes/
│   │       ├── subjects.js
│   │       ├── mentors.js
│   │       ├── availability.js
│   │       ├── bookings.js
│   │       └── dev.js
│   └── tests/
│       └── booking.test.js
├── package.json (root scripts)
├── README.md
├── TRANSCRIPT.md
└── .gitignore
```

---

## 6. Installation
Clone the repository and install all dependencies:

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
cd server
npm install

# 3. Install frontend dependencies
cd ../client
npm install
cd ..
```

---

## 7. Environment Setup
The backend defaults to port `5000` and creates `server/data/appointments.db` automatically. If desired, you can create a `server/.env` file:

```env
PORT=5000
DB_PATH=./data/appointments.db
```

---

## 8. How to Run Frontend
From the `client` directory:
```bash
cd client
npm run dev
```
Open `http://localhost:5173` (or the port Vite outputs in your terminal).

---

## 9. How to Run Backend
From the `server` directory:
```bash
cd server
npm start
```
The API starts at `http://localhost:5000`.

### Running Both Frontend & Backend Concurrently
From the project root:
```bash
npm run dev
```

---

## 10. Database Setup & Schema
SQLite is used with WebAssembly bindings (`sql.js`). The table and indices are initialized automatically upon server launch.

```sql
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  child_name TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subject_title TEXT NOT NULL,
  parent_timezone TEXT NOT NULL,
  parent_local_datetime TEXT NOT NULL,
  mentor_id TEXT NOT NULL,
  mentor_name TEXT NOT NULL,
  mentor_timezone TEXT NOT NULL,
  mentor_local_date TEXT NOT NULL,      -- 'YYYY-MM-DD' in Asia/Kolkata
  mentor_local_time TEXT NOT NULL,      -- 'h:mm a' in Asia/Kolkata
  start_time_utc TEXT NOT NULL,         -- ISO 8601 UTC instant
  end_time_utc TEXT NOT NULL,           -- ISO 8601 UTC instant
  duration_minutes INTEGER DEFAULT 30,
  dummy_class_link TEXT NOT NULL,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_day ON bookings(mentor_id, mentor_local_date, status);
CREATE INDEX IF NOT EXISTS idx_mentor_time_range ON bookings(mentor_id, start_time_utc, end_time_utc, status);
CREATE INDEX IF NOT EXISTS idx_day_capacity ON bookings(mentor_local_date, status);
```

---

## 11. Seeded Dataset

### 10 Mentors (`Asia/Kolkata`, Working Hours: 10:00 to 20:00 IST)
1. **Priya Sharma** (`mentor_01`): Lead Python & Scratch Mentor (Coding & Programming, Algorithms & Math)
2. **Rohan Mehta** (`mentor_02`): Senior Full-Stack Web Coach (Web Development, Coding & Programming)
3. **Ananya Iyer** (`mentor_03`): AI & Data Science Instructor (AI & Machine Learning, Coding & Programming)
4. **Vikram Patel** (`mentor_04`): Robotics & Embedded Systems Specialist (Robotics & IoT, Algorithms & Math)
5. **Sneha Roy** (`mentor_05`): Creative Game Designer & Logic Coach (Game Development, Coding & Programming)
6. **Aditya Verma** (`mentor_06`): Interactive UI & Game Developer (Web Development, Game Development)
7. **Pooja Nair** (`mentor_07`): Computational Math & AI Mentor (AI & Machine Learning, Algorithms & Math)
8. **Rahul Deshmukh** (`mentor_08`): Hardware Logic & Robotics Educator (Robotics & IoT, Coding & Programming)
9. **Tanvi Joshi** (`mentor_09`): Frontend & 2D Game Architect (Game Development, Web Development)
10. **Karthik Sundaram** (`mentor_10`): Senior Algorithm & AI Coach (Coding & Programming, AI & Machine Learning)

### 6 Learning Tracks
- `coding_programming`: Coding & Programming
- `web_development`: Web Development
- `ai_ml`: AI & Machine Learning
- `robotics`: Robotics & Hardware Logic
- `game_development`: Game Development
- `algorithms_math`: Algorithms & Math Thinking

---

## 12. Mentor Assignment Logic
When a parent selects a time slot and confirms a booking, the backend performs the following deterministic algorithm:
1. **Subject Filtering**: Mentors who support `subjectId` are selected.
2. **Operating Hours**: The requested instant is mapped to `Asia/Kolkata`. The slot must fall entirely within the mentor's hours (10:00 AM – 8:00 PM IST).
3. **Daily Limit Filter**: Mentors with `>= 2` confirmed bookings on `mentor_local_date` (`Asia/Kolkata`) are excluded.
4. **Schedule Overlap Check**: Mentors with an existing overlapping session at `[startUtc, endUtc]` are excluded.
5. **Least-Booked Selection**:
   - Eligible mentors are sorted primarily by **fewest bookings on that date** (balancing the daily workload).
   - Tied mentors are sorted by **lowest all-time booking count**.
   - Final tiebreaker is deterministic mentor ID.
6. **Atomic Reservation**: The booking is inserted into SQLite inside an atomic verification block to prevent race conditions.

---

## 13. Timezone Handling
- All internal booking instants are normalized and stored as **ISO 8601 UTC strings** (`start_time_utc`, `end_time_utc`).
- When querying slots or rendering the UI, instants are converted using IANA identifiers (e.g. `America/New_York`, `Europe/London`, `Asia/Kolkata`).
- The parent always sees their **local time** with their timezone clearly designated.
- The UI displays both **Parent Local Time** and **Mentor Time in India (IST)** side-by-side during review and confirmation.

---

## 14. Daylight Saving Time (DST) Handling
Timezones are never calculated using static offsets (such as `-10.5 hours`). The application utilizes **Luxon** with the standard IANA timezone database.

For example, for `America/New_York`:
- During Summer (EDT): Offset is `-240 minutes` (UTC-4).
- During Winter (EST): Offset is `-300 minutes` (UTC-5).

Because slots are generated from IANA timezone definitions, the 1-hour DST transition is calculated dynamically for any past or future date without code modifications.

---

## 15. Daily Mentor & System Limits
- **Mentor Daily Limit**: Exactly 2 trial classes per mentor per day.
- **Calendar Day Evaluation**: Evaluated strictly on the **mentor's local date (`Asia/Kolkata`)**. If a parent in New York books at 10:30 PM EDT on Oct 15, that instant is 8:00 AM IST on Oct 16. The booking counts toward the mentor's Oct 16 quota, not Oct 15!
- **System Capacity**: 10 mentors × 2 classes = **20 classes maximum per calendar day**.

---

## 16. Error Handling & User States
The application provides distinct, user-friendly states with clear recovery actions:
- `NO_MENTOR_AVAILABLE`: Displayed when no mentor teaches the subject or is on duty during the selected hours.
- `MENTOR_DAILY_LIMIT_REACHED`: Displayed when all mentors qualified for the subject have conducted 2 classes on that date.
- `SLOT_UNAVAILABLE`: Displayed when another student books the slot prior to final confirmation (race condition).
- `DAILY_CAPACITY_REACHED`: Displayed when all 20 system slots for that date are booked.
- `INVALID_REQUEST`: Displayed for missing parent details or invalid email format.
- `NETWORK_ERROR`: Clean message when API is unreachable.

---

## 17. How to Test Unavailable Mentor Scenario
1. In the booking flow, select a slot that converts to outside 10:00 AM – 8:00 PM IST (e.g., late night in India).
2. The UI will indicate that mentors are outside operating hours.
3. Alternatively, click **"Evaluator Lab"** in the top navbar or bottom toolbar and click **"Fill Daily Limit (2/2) for AI & ML Mentors"**.
4. Attempt to book an **AI & Machine Learning** slot for today.
5. The backend immediately returns the professional `MENTOR_DAILY_LIMIT_REACHED` error state with the option to choose another time or date.

---

## 18. How to Test the 2-Class Daily Limit
### Automated:
Run the test suite:
```bash
cd server
npm test
```
Test 4 verifies that after booking 4 classes across the 2 robotics mentors on `2026-10-22`, a 5th booking triggers `MENTOR_DAILY_LIMIT_REACHED`.

### Manual in UI:
1. Open the **"Evaluator Lab"** toolbar (bottom right) or click **"Admin & Database"** in the navbar.
2. Click **"Fill Daily Limit (2/2) for AI & ML Mentors"**.
3. Go to the booking flow and select **"AI & Machine Learning"**.
4. Notice that slots for today show daily limit reached, and submitting returns the `MENTOR_DAILY_LIMIT_REACHED` alert.
5. Click **"Reset All Bookings"** in the Evaluator Lab to return to a clean state.

---

## 19. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/subjects` | Returns all 6 subjects enriched with mentor counts |
| `GET` | `/api/mentors` | Returns all 10 mentors with today's booking counts (x/2) |
| `GET` | `/api/availability` | Query params: `subjectId`, `date`, `parentTimezone`. Returns available slots in parent time |
| `POST` | `/api/bookings` | Creates a booking. Body: `{ parentName, parentEmail, childName, subjectId, parentTimezone, utcStartIso }` |
| `GET` | `/api/bookings/:id` | Retrieves a booking record by ID |
| `GET` | `/api/bookings` | Returns all bookings (Admin/Evaluator) |
| `POST` | `/api/dev/reset` | Resets all bookings to 0 |
| `POST` | `/api/dev/seed-mentor-limit` | Seeds 2 bookings for all mentors of a subject |
| `POST` | `/api/dev/seed-capacity-limit`| Seeds 20 bookings across all mentors |
| `GET` | `/api/dev/stats` | Returns real-time system booking stats |

---

## 20. Design Decisions
1. **Light-Mode First**: Employs an ed-tech palette with high readability (`#315F61` Teal, `#244E50` Dark Teal, `#FAFAF8` Warm Background, `#163D4A` Dark Text).
2. **Zero Phone Number Policy**: Complies strictly with student privacy best practices by never asking for a parent's phone number or credit card.
3. **Pure Wasm SQLite (`sql.js`)**: Eliminates native C++ compilation issues on Windows / macOS / Linux while providing full ACID persistence and index lookups.
4. **Least-Booked Mentor Load Balancing**: Ensures even distribution of classes across teachers rather than overworking individual mentors.
5. **Interactive Classroom Simulation**: Clicking the dummy live class link opens a full mock classroom with video tiles, mic/camera controls, and code editor.

---

## 21. Known Limitations
- Real-time video in the dummy classroom is simulated (WebRTC is not integrated).
- Email notifications are simulated in the console logs and displayed on the confirmation receipt rather than sent via an external SMTP service (e.g. SendGrid).
- Mentor operating hours are configured as 10:00 AM – 8:00 PM IST across all 10 mentors.
