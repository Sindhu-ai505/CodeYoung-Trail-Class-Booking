import express from 'express';
import {
  authenticateParent,
  authenticateMentor,
  destroySession,
  normalizeEmail
} from '../services/authService.js';
import {
  validateEmail,
  INVALID_EMAIL_CODE,
  INVALID_EMAIL_MESSAGE
} from '../utils/validation.js';
import {
  requireAuth,
  optionalAuth,
  setSessionCookie,
  clearSessionCookie,
  extractSessionToken
} from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Role-aware authentication: handles Parent (email + name) or Mentor (identifier / email)
 */
router.post('/login', async (req, res) => {
  try {
    const { role = 'parent', email, name, identifier } = req.body;

    // 1. Mentor Login Flow
    if (role === 'mentor' || (!email && identifier)) {
      const mentorIdentifier = identifier || email;
      if (!mentorIdentifier || typeof mentorIdentifier !== 'string' || !mentorIdentifier.trim()) {
        return res.status(400).json({
          success: false,
          code: 'IDENTIFIER_REQUIRED',
          message: 'Please enter your mentor ID or Codeyoung email.'
        });
      }

      const authResult = authenticateMentor(mentorIdentifier.trim());

      // Set HTTP-only secure cookie for persistent session
      setSessionCookie(res, authResult.session.token, authResult.session.expiresAt);

      return res.json({
        success: true,
        role: 'mentor',
        mentor: authResult.mentor,
        user: {
          id: authResult.mentor.id,
          name: authResult.mentor.name,
          email: authResult.mentor.email,
          role: 'mentor'
        },
        token: authResult.session.token
      });
    }

    // 2. Parent Login Flow (Default)
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_REQUIRED',
        message: 'Please enter your email address to continue.'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        code: INVALID_EMAIL_CODE,
        message: INVALID_EMAIL_MESSAGE
      });
    }

    const authResult = authenticateParent({ email, name });

    // Set HTTP-only secure cookie for persistent session
    setSessionCookie(res, authResult.session.token, authResult.session.expiresAt);

    return res.json({
      success: true,
      role: 'parent',
      isNew: authResult.isNew,
      parent: authResult.parent,
      user: {
        id: authResult.parent.id,
        name: authResult.parent.name,
        email: authResult.parent.email,
        role: 'parent'
      },
      token: authResult.session.token
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      code: err.code || 'AUTH_FAILED',
      message: err.message || 'We could not complete your sign-in. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Validate current session and retrieve authenticated profile (Parent or Mentor)
 */
router.get('/me', requireAuth, (req, res) => {
  const role = req.session.role || 'parent';

  if (role === 'mentor' && req.mentor) {
    return res.json({
      success: true,
      role: 'mentor',
      mentor: req.mentor,
      user: {
        id: req.mentor.id,
        name: req.mentor.name,
        email: req.mentor.email,
        role: 'mentor'
      }
    });
  }

  // Parent profile
  res.json({
    success: true,
    role: 'parent',
    parent: {
      id: req.parent.id,
      name: req.parent.name,
      email: req.parent.email,
      createdAt: req.parent.created_at
    },
    user: {
      id: req.parent.id,
      name: req.parent.name,
      email: req.parent.email,
      role: 'parent'
    }
  });
});

/**
 * POST /api/auth/logout
 * Invalidate session and clear HTTP-only cookie
 */
router.post('/logout', optionalAuth, (req, res) => {
  const token = req.sessionToken || extractSessionToken(req);
  if (token) {
    destroySession(token);
  }
  clearSessionCookie(res);

  res.json({
    success: true,
    message: 'Signed out successfully.'
  });
});

export default router;
