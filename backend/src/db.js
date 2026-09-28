import {
  initDb as baseInitDb,
  getDb,
  initSchema,
  createIsolatedDb,
  queryAll,
  queryOne,
  run,
  transaction,
  persistToDisk,
  resetDb
} from './db/index.js';
import { seedMentors } from './db/seed.js';

export async function initDb(dbPath = null) {
  const db = baseInitDb(dbPath);
  // Ensure mentors are seeded into database
  try {
    seedMentors(db);
  } catch (err) {
    console.warn('[DB] Notice while auto-seeding mentors:', err.message);
  }
  return db;
}

export {
  getDb,
  initSchema,
  createIsolatedDb,
  queryAll,
  queryOne,
  run,
  transaction,
  persistToDisk,
  resetDb
};

export default getDb;
