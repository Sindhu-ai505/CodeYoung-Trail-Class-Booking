import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqlInstance = null;
let db = null;
let currentDbPath = null;

export async function initDb(dbPath = null) {
  if (db && !dbPath) {
    return db;
  }

  if (!sqlInstance) {
    sqlInstance = await initSqlJs();
  }

  currentDbPath = dbPath || process.env.DB_PATH || path.join(__dirname, '../data/appointments.db');

  if (currentDbPath !== ':memory:') {
    const dir = path.dirname(currentDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(currentDbPath)) {
      const fileBuffer = fs.readFileSync(currentDbPath);
      db = new sqlInstance.Database(fileBuffer);
    } else {
      db = new sqlInstance.Database();
    }
  } else {
    db = new sqlInstance.Database();
  }

  // Schema creation
  db.run(`
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
      mentor_local_date TEXT NOT NULL,
      mentor_local_time TEXT NOT NULL,
      start_time_utc TEXT NOT NULL,
      end_time_utc TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      dummy_class_link TEXT NOT NULL,
      status TEXT DEFAULT 'CONFIRMED',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mentor_day ON bookings(mentor_id, mentor_local_date, status);
    CREATE INDEX IF NOT EXISTS idx_mentor_time_range ON bookings(mentor_id, start_time_utc, end_time_utc, status);
    CREATE INDEX IF NOT EXISTS idx_day_capacity ON bookings(mentor_local_date, status);
  `);

  persistToDisk();
  return db;
}

export function persistToDisk() {
  if (!db || currentDbPath === ':memory:') return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(currentDbPath, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

export function queryAll(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  const stmt = db.prepare(sql);
  if (params && params.length) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  db.run(sql, params);
  persistToDisk();
}

export function resetDb() {
  if (!db) return;
  db.run(`DELETE FROM bookings`);
  persistToDisk();
}
