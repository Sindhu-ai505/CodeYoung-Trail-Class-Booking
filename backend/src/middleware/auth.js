import { validateSession } from '../services/authService.js';

export const SESSION_COOKIE_NAME = 'codeyoung_session';

/**
 * Robust zero-dependency cookie parser
 */
export function parseCookies(req) {
  const cookieHeader = req.headers?.cookie;
  const cookies = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

/**
 * Set HTTP-only secure session cookie
 */
export function setSessionCookie(res, token, expiresAt) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAgeSeconds = 30 * 24 * 60 * 60; // 30 days
  const expiresDate = expiresAt ? new Date(expiresAt).toUTCString() : new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  
  // Set-Cookie header with HttpOnly and SameSite=Lax
  const cookieStr = `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Expires=${expiresDate}${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieStr);
}

/**
 * Clear session cookie on logout
 */
export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStr = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieStr);
}

/**
 * Extract token from cookie or Authorization header
 */
export function extractSessionToken(req) {
  const cookies = parseCookies(req);
  if (cookies[SESSION_COOKIE_NAME]) {
    return cookies[SESSION_COOKIE_NAME];
  }

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  if (req.query?.token) {
    return req.query.token;
  }

  return null;
}

/**
 * Middleware: Requires any authenticated session (parent or mentor)
 */
export function requireAuth(req, res, next) {
  const token = extractSessionToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to access your dashboard.'
    });
  }

  const authData = validateSession(token);
  if (!authData) {
    clearSessionCookie(res);
    return res.status(401).json({
      success: false,
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please sign in again.'
    });
  }

  req.session = authData.session;
  req.sessionToken = token;
  req.user = authData.user;
  req.userRole = authData.role;

  if (authData.role === 'mentor') {
    req.mentor = authData.mentor;
  } else {
    req.parent = authData.parent;
  }

  next();
}

/**
 * Middleware: Requires parent authentication specifically
 * Returns 401 if unauthenticated, 403 Forbidden if authenticated as mentor
 */
export function requireParentAuth(req, res, next) {
  const token = extractSessionToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in to access your parent dashboard.'
    });
  }

  const authData = validateSession(token);
  if (!authData) {
    clearSessionCookie(res);
    return res.status(401).json({
      success: false,
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please sign in again.'
    });
  }

  if (authData.role !== 'parent' || !authData.parent) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied. This endpoint is restricted to parent accounts.'
    });
  }

  req.session = authData.session;
  req.sessionToken = token;
  req.user = authData.user;
  req.userRole = 'parent';
  req.parent = authData.parent;

  next();
}

/**
 * Middleware: Requires mentor authentication specifically
 * Returns 401 if unauthenticated, 403 Forbidden if authenticated as parent
 */
export function requireMentorAuth(req, res, next) {
  const token = extractSessionToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Mentor authentication required. Please sign in to access your mentor workspace.'
    });
  }

  const authData = validateSession(token);
  if (!authData) {
    clearSessionCookie(res);
    return res.status(401).json({
      success: false,
      code: 'SESSION_EXPIRED',
      message: 'Your mentor session has expired. Please sign in again.'
    });
  }

  if (authData.role !== 'mentor' || !authData.mentor) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Access denied. This endpoint is restricted to mentor accounts.'
    });
  }

  req.session = authData.session;
  req.sessionToken = token;
  req.user = authData.user;
  req.userRole = 'mentor';
  req.mentor = authData.mentor;

  next();
}

/**
 * Middleware: Optional authentication (attaches user if session exists)
 */
export function optionalAuth(req, res, next) {
  const token = extractSessionToken(req);
  if (token) {
    const authData = validateSession(token);
    if (authData) {
      req.session = authData.session;
      req.sessionToken = token;
      req.user = authData.user;
      req.userRole = authData.role;
      if (authData.role === 'mentor') {
        req.mentor = authData.mentor;
      } else {
        req.parent = authData.parent;
      }
    }
  }
  next();
}
