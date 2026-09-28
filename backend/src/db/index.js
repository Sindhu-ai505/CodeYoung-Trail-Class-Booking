import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MENTORS } from '../data/mentors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let defaultDb = null;
let currentDbPath = null;

/**
 * Initializes and returns a better-sqlite3 database instance with the required schema.
 * @param {string|null} dbPath - File path or ':memory:'
 * @returns {Database.Database}
 */
export function initDb(dbPath = null) {
  if (defaultDb && !dbPath) {
    return defaultDb;
  }

  currentDbPath = dbPath || process.env.DB_PATH || path.join(__dirname, '../../data/appointments.db');

  if (currentDbPath !== ':memory:') {
    const dir = path.dirname(currentDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(currentDbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  if (!dbPath || dbPath === currentDbPath) {
    defaultDb = db;
  }

  return db;
}

/**
 * Creates schema and indexes in the provided database instance.
 * @param {Database.Database} db
 */
export function initSchema(db) {
  db.exec(`
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
      role TEXT NOT NULL DEFAULT 'parent',
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_parent ON sessions(parent_id);

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      client_request_id TEXT UNIQUE,
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
      mentor_local_date TEXT NOT NULL,
      mentor_local_time TEXT,
      slot_start_utc TEXT,
      slot_end_utc TEXT,
      start_time_utc TEXT,
      end_time_utc TEXT,
      meeting_link TEXT,
      dummy_class_link TEXT,
      duration_minutes INTEGER DEFAULT 30,
      status TEXT DEFAULT 'CONFIRMED',
      created_at TEXT NOT NULL
    );

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
    CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications(booking_id);

    CREATE TABLE IF NOT EXISTS learning_checks (
      id TEXT PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL,
      parent_id TEXT,
      student_name TEXT NOT NULL,
      course_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      mentor_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      answers_json TEXT,
      feedback TEXT,
      submitted_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_learning_checks_booking ON learning_checks(booking_id);
    CREATE INDEX IF NOT EXISTS idx_learning_checks_parent ON learning_checks(parent_id);
    CREATE INDEX IF NOT EXISTS idx_learning_checks_mentor ON learning_checks(mentor_id);
  `);

  // Safe runtime migration check for existing databases
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS learning_checks (
        id TEXT PRIMARY KEY,
        booking_id TEXT UNIQUE NOT NULL,
        parent_id TEXT,
        student_name TEXT NOT NULL,
        course_id TEXT NOT NULL,
        course_title TEXT NOT NULL,
        mentor_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        percentage INTEGER NOT NULL,
        answers_json TEXT,
        feedback TEXT,
        submitted_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_learning_checks_booking ON learning_checks(booking_id);
      CREATE INDEX IF NOT EXISTS idx_learning_checks_parent ON learning_checks(parent_id);
      CREATE INDEX IF NOT EXISTS idx_learning_checks_mentor ON learning_checks(mentor_id);
    `);
    // 1. Bookings migrations
    const bookingCols = db.prepare(`PRAGMA table_info(bookings)`).all().map(c => c.name);

    if (!bookingCols.includes('client_request_id')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN client_request_id TEXT;`);
    }
    if (!bookingCols.includes('slot_start_utc')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN slot_start_utc TEXT;`);
      db.exec(`UPDATE bookings SET slot_start_utc = start_time_utc WHERE slot_start_utc IS NULL;`);
    }
    if (!bookingCols.includes('slot_end_utc')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN slot_end_utc TEXT;`);
      db.exec(`UPDATE bookings SET slot_end_utc = end_time_utc WHERE slot_end_utc IS NULL;`);
    }
    if (!bookingCols.includes('meeting_link')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN meeting_link TEXT;`);
      db.exec(`UPDATE bookings SET meeting_link = dummy_class_link WHERE meeting_link IS NULL;`);
    }
    if (!bookingCols.includes('start_time_utc')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN start_time_utc TEXT;`);
      db.exec(`UPDATE bookings SET start_time_utc = slot_start_utc WHERE start_time_utc IS NULL;`);
    }
    if (!bookingCols.includes('end_time_utc')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN end_time_utc TEXT;`);
      db.exec(`UPDATE bookings SET end_time_utc = slot_end_utc WHERE end_time_utc IS NULL;`);
    }
    if (!bookingCols.includes('dummy_class_link')) {
      db.exec(`ALTER TABLE bookings ADD COLUMN dummy_class_link TEXT;`);
      db.exec(`UPDATE bookings SET dummy_class_link = meeting_link WHERE dummy_class_link IS NULL;`);
    }

    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_client_req_id ON bookings(client_request_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_mentor_day ON bookings(mentor_id, mentor_local_date, status);
      CREATE INDEX IF NOT EXISTS idx_bookings_slot_range ON bookings(mentor_id, slot_start_utc, slot_end_utc, status);
    `);

    // 2. Mentors migrations
    const mentorCols = db.prepare(`PRAGMA table_info(mentors)`).all().map(c => c.name);
    if (!mentorCols.includes('email')) {
      db.exec(`ALTER TABLE mentors ADD COLUMN email TEXT;`);
    }

    // 3. Sessions migrations
    const sessionCols = db.prepare(`PRAGMA table_info(sessions)`).all();
    const sessionColNames = sessionCols.map(c => c.name);

    if (!sessionColNames.includes('role')) {
      db.exec(`ALTER TABLE sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'parent';`);
    }
    if (!sessionColNames.includes('mentor_id')) {
      db.exec(`ALTER TABLE sessions ADD COLUMN mentor_id TEXT;`);
    }

    // Check if legacy sessions table had parent_id defined as NOT NULL
    const parentIdCol = sessionCols.find(c => c.name === 'parent_id');
    if (parentIdCol && parentIdCol.notnull === 1) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions_migrated (
          id TEXT PRIMARY KEY,
          parent_id TEXT,
          mentor_id TEXT,
          role TEXT NOT NULL DEFAULT 'parent',
          token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        INSERT OR IGNORE INTO sessions_migrated (id, parent_id, mentor_id, role, token, expires_at, created_at)
        SELECT id, parent_id, mentor_id, role, token, expires_at, created_at FROM sessions;
        DROP TABLE sessions;
        ALTER TABLE sessions_migrated RENAME TO sessions;
      `);
    }

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_parent ON sessions(parent_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON sessions(mentor_id);
    `);
  } catch (migErr) {
    console.warn('[DB Migration Warning]:', migErr.message);
  }
}

/**
 * Returns active database instance or initializes default one.
 * @returns {Database.Database}
 */
export function getDb() {
  if (!defaultDb) {
    return initDb();
  }
  return defaultDb;
}

/**
 * Creates an isolated in-memory database instance with mentors seeded (ideal for isolated unit tests).
 * @returns {Database.Database}
 */
export function createIsolatedDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  initSchema(db);

  const insert = db.prepare(`
    INSERT INTO mentors (
      id, name, email, role, specialization, timezone,
      working_hours_start, working_hours_end, max_daily_classes, supported_subjects
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of MENTORS) {
    insert.run(
      m.id,
      m.name,
      m.email || `${m.id}@codeyoung.com`,
      m.role || 'Trial Class Mentor',
      m.specialization || 'Coding & STEM',
      m.timezone || 'Asia/Kolkata',
      m.workingHours?.start ?? 10,
      m.workingHours?.end ?? 20,
      m.maxDailyClasses ?? 2,
      JSON.stringify(m.supportedSubjects || [])
    );
  }
  return db;
}

/**
 * Query helper returning all rows.
 */
export function queryAll(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).all(...(Array.isArray(params) ? params : [params]));
}

/**
 * Query helper returning single row or null.
 */
export function queryOne(sql, params = []) {
  const db = getDb();
  const row = db.prepare(sql).get(...(Array.isArray(params) ? params : [params]));
  return row || null;
}

/**
 * Run helper executing INSERT, UPDATE, or DELETE.
 */
export function run(sql, params = []) {
  const db = getDb();
  return db.prepare(sql).run(...(Array.isArray(params) ? params : [params]));
}

/**
 * Execute within a transaction.
 */
export function transaction(fn) {
  const db = getDb();
  return db.transaction(fn);
}

/**
 * Compatibility helper. WAL mode automatically persists to disk.
 */
export function persistToDisk() {
  // No-op for better-sqlite3 WAL mode
}

/**
 * Resets dev / test database tables.
 */
export function resetDb() {
  const db = getDb();
  db.exec(`
    DELETE FROM sessions;
    DELETE FROM learning_checks;
    DELETE FROM notifications;
    DELETE FROM bookings;
    DELETE FROM parents;
  `);
}

export default getDb;
