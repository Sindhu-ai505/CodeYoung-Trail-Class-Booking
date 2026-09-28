import crypto from 'node:crypto';
import { queryOne, run } from '../db.js';
import { MENTORS } from '../data/mentors.js';
import { validateEmail, normalizeEmail, INVALID_EMAIL_CODE, INVALID_EMAIL_MESSAGE } from '../utils/validation.js';

export { validateEmail, normalizeEmail };
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

/**
 * Lookup parent account by normalized email
 */
export function findParentByEmail(email) {
  const norm = normalizeEmail(email);
  if (!norm) return null;
  return queryOne(`SELECT * FROM parents WHERE email = ?`, [norm]);
}

/**
 * Lookup parent account by ID
 */
export function getParentById(id) {
  if (!id) return null;
  return queryOne(`SELECT * FROM parents WHERE id = ?`, [id]);
}

/**
 * Lookup real mentor by ID from database (fallback to seeded MENTORS)
 */
export function getMentorByIdFromDb(id) {
  if (!id) return null;
  const row = queryOne(`SELECT * FROM mentors WHERE id = ?`, [id]);
  if (row) {
    let supportedSubjects = [];
    try {
      supportedSubjects = JSON.parse(row.supported_subjects || '[]');
    } catch {
      supportedSubjects = [];
    }
    return {
      id: row.id,
      name: row.name,
      email: row.email || `${row.id}@codeyoung.com`,
      role: row.role || 'Trial Class Mentor',
      specialization: row.specialization || 'Coding & STEM',
      timezone: row.timezone || 'Asia/Kolkata',
      workingHours: {
        start: row.working_hours_start ?? 10,
        end: row.working_hours_end ?? 20
      },
      maxDailyClasses: row.max_daily_classes ?? 2,
      supportedSubjects
    };
  }

  const staticMentor = MENTORS.find(m => m.id === id);
  if (staticMentor) {
    return {
      id: staticMentor.id,
      name: staticMentor.name,
      email: staticMentor.email || `${staticMentor.id}@codeyoung.com`,
      role: staticMentor.role || 'Trial Class Mentor',
      specialization: staticMentor.specialization || 'Coding & STEM',
      timezone: staticMentor.timezone || 'Asia/Kolkata',
      workingHours: staticMentor.workingHours || { start: 10, end: 20 },
      maxDailyClasses: staticMentor.maxDailyClasses ?? 2,
      supportedSubjects: staticMentor.supportedSubjects || []
    };
  }

  return null;
}

/**
 * Lookup mentor by login identifier (ID like mentor_01, email, or exact name)
 */
export function findMentorByIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  // 1. Try DB lookup (case-insensitive)
  const row = queryOne(
    `SELECT * FROM mentors WHERE LOWER(id) = ? OR LOWER(email) = ? OR LOWER(name) = ?`,
    [clean, clean, clean]
  );
  if (row) {
    return getMentorByIdFromDb(row.id);
  }

  // 2. Fallback to static MENTORS array
  const found = MENTORS.find(m =>
    m.id.toLowerCase() === clean ||
    (m.email && m.email.toLowerCase() === clean) ||
    m.name.toLowerCase() === clean
  );
  if (found) {
    return getMentorByIdFromDb(found.id);
  }

  return null;
}

/**
 * Create a new parent account
 */
export function createParent({ name, email }) {
  const normEmail = normalizeEmail(email);
  if (!normEmail || !validateEmail(normEmail)) {
    throw {
      status: 400,
      code: INVALID_EMAIL_CODE,
      message: INVALID_EMAIL_MESSAGE
    };
  }

  const cleanName = (name || '').trim();
  if (!cleanName) {
    throw {
      status: 400,
      code: 'INVALID_NAME',
      message: 'Parent full name is required.'
    };
  }

  const existing = findParentByEmail(normEmail);
  if (existing) {
    return existing;
  }

  const id = `parent_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const nowIso = new Date().toISOString();

  run(
    `INSERT INTO parents (id, name, email, created_at) VALUES (?, ?, ?, ?)`,
    [id, cleanName, normEmail, nowIso]
  );

  return {
    id,
    name: cleanName,
    email: normEmail,
    created_at: nowIso
  };
}

/**
 * Create a cryptographically secure session for an authenticated parent or mentor.
 * Supports createSession(parentId, durationDays) or createSession({ role, parentId, mentorId, durationDays })
 */
export function createSession(arg1, durationDays = 30) {
  let role = 'parent';
  let parentId = null;
  let mentorId = null;
  let duration = durationDays;

  if (typeof arg1 === 'object' && arg1 !== null) {
    role = arg1.role || 'parent';
    parentId = arg1.parentId || null;
    mentorId = arg1.mentorId || null;
    if (arg1.durationDays) duration = arg1.durationDays;
  } else if (typeof arg1 === 'string') {
    parentId = arg1;
    role = 'parent';
  }

  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = `sess_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  run(
    `INSERT INTO sessions (id, role, parent_id, mentor_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, role, parentId, mentorId, token, expiresAt, createdAt]
  );

  return {
    sessionId,
    token,
    role,
    userId: role === 'mentor' ? mentorId : parentId,
    parentId,
    mentorId,
    expiresAt
  };
}

/**
 * Validate an active session token and return role, user profile, and session record
 */
export function validateSession(token) {
  if (!token || typeof token !== 'string') return null;

  const sessionRow = queryOne(`SELECT * FROM sessions WHERE token = ?`, [token.trim()]);
  if (!sessionRow) return null;

  // Check expiration
  if (new Date(sessionRow.expires_at) < new Date()) {
    run(`DELETE FROM sessions WHERE id = ?`, [sessionRow.id]);
    return null;
  }

  const role = sessionRow.role || 'parent';
  const session = {
    id: sessionRow.id,
    role,
    userId: role === 'mentor' ? sessionRow.mentor_id : sessionRow.parent_id,
    parentId: sessionRow.parent_id || null,
    mentorId: sessionRow.mentor_id || null,
    token: sessionRow.token,
    expiresAt: sessionRow.expires_at,
    createdAt: sessionRow.created_at
  };

  if (role === 'mentor') {
    const mentor = getMentorByIdFromDb(sessionRow.mentor_id);
    if (!mentor) return null;
    return {
      session,
      role: 'mentor',
      user: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        role: 'mentor',
        specialization: mentor.specialization,
        timezone: mentor.timezone
      },
      mentor
    };
  }

  // Role: parent
  const parent = getParentById(sessionRow.parent_id);
  if (!parent) return null;

  return {
    session,
    role: 'parent',
    user: {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      role: 'parent'
    },
    parent
  };
}

/**
 * Invalidate a session (logout)
 */
export function destroySession(token) {
  if (!token || typeof token !== 'string') return;
  run(`DELETE FROM sessions WHERE token = ?`, [token.trim()]);
}

/**
 * Authenticate or register parent by email
 */
export function authenticateParent({ email, name }) {
  const normEmail = normalizeEmail(email);
  if (!normEmail || !validateEmail(normEmail)) {
    throw {
      status: 400,
      code: INVALID_EMAIL_CODE,
      message: INVALID_EMAIL_MESSAGE
    };
  }

  const existingParent = findParentByEmail(normEmail);

  if (existingParent) {
    if (name && typeof name === 'string' && name.trim() && existingParent.name !== name.trim()) {
      run(`UPDATE parents SET name = ? WHERE id = ?`, [name.trim(), existingParent.id]);
      existingParent.name = name.trim();
    }

    const session = createSession({ role: 'parent', parentId: existingParent.id });
    return {
      role: 'parent',
      isNew: false,
      parent: {
        id: existingParent.id,
        name: existingParent.name,
        email: existingParent.email,
        createdAt: existingParent.created_at
      },
      session
    };
  }

  // New parent requires a name
  const cleanName = (name || '').trim();
  if (!cleanName) {
    throw {
      status: 400,
      code: 'NAME_REQUIRED',
      message: 'Please enter your name to create your parent account.'
    };
  }

  const newParent = createParent({ name: cleanName, email: normEmail });
  const session = createSession({ role: 'parent', parentId: newParent.id });

  return {
    role: 'parent',
    isNew: true,
    parent: {
      id: newParent.id,
      name: newParent.name,
      email: newParent.email,
      createdAt: newParent.created_at
    },
    session
  };
}

/**
 * Authenticate real mentor by login identifier (mentor_01, email, etc.)
 */
export function authenticateMentor(identifier) {
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    throw {
      status: 400,
      code: 'IDENTIFIER_REQUIRED',
      message: 'Please enter your mentor ID or Codeyoung email.'
    };
  }

  const clean = identifier.trim();
  const mentor = findMentorByIdentifier(clean);

  if (!mentor) {
    throw {
      status: 401,
      code: 'MENTOR_NOT_FOUND',
      message: 'Mentor account not found. Check your mentor ID or Codeyoung email and try again.'
    };
  }

  const session = createSession({ role: 'mentor', mentorId: mentor.id });

  return {
    role: 'mentor',
    mentor: {
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      role: mentor.role || 'Trial Class Mentor',
      specialization: mentor.specialization,
      timezone: mentor.timezone
    },
    session
  };
}
