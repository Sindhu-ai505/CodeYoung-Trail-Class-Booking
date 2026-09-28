import { MENTORS } from '../data/mentors.js';
import { getDb, initDb } from './index.js';

/**
 * Seeds 10 mentors, all in Asia/Kolkata timezone, into the mentors table.
 * @param {import('better-sqlite3').Database} [targetDb]
 */
export function seedMentors(targetDb = null) {
  const db = targetDb || getDb();

  const insertStmt = db.prepare(`
    INSERT INTO mentors (
      id, name, email, role, specialization, timezone,
      working_hours_start, working_hours_end, max_daily_classes, supported_subjects
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      role = excluded.role,
      specialization = excluded.specialization,
      timezone = excluded.timezone,
      working_hours_start = excluded.working_hours_start,
      working_hours_end = excluded.working_hours_end,
      max_daily_classes = excluded.max_daily_classes,
      supported_subjects = excluded.supported_subjects
  `);

  const seedTx = db.transaction(() => {
    for (const mentor of MENTORS) {
      insertStmt.run(
        mentor.id,
        mentor.name,
        mentor.email || `${mentor.id}@codeyoung.com`,
        mentor.role || 'Trial Class Mentor',
        mentor.specialization || 'Coding & STEM',
        mentor.timezone || 'Asia/Kolkata',
        mentor.workingHours?.start ?? 10,
        mentor.workingHours?.end ?? 20,
        mentor.maxDailyClasses ?? 2,
        JSON.stringify(mentor.supportedSubjects || [])
      );
    }
  });

  seedTx();
  return MENTORS.length;
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  console.log('[Seed] Seeding 10 mentors into SQLite database...');
  initDb();
  const count = seedMentors();
  console.log(`[Seed] Successfully seeded ${count} mentors (all Asia/Kolkata timezone).`);
}

export default seedMentors;
