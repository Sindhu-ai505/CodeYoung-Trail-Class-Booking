import express from 'express';
import { queryOne, getDb } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { formatBookingRecord } from '../services/bookingService.js';
import { DateTime } from 'luxon';

const router = express.Router();

/**
 * In-memory room manager for active 1:1 real-time classrooms.
 * Tracks active SSE connections, peer signaling, and real-time chat.
 */
class ClassroomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(bookingId) {
    if (!this.rooms.has(bookingId)) {
      this.rooms.set(bookingId, {
        bookingId,
        participants: new Map(), // role ('parent' | 'mentor') -> { id, name, role, res, pingInterval }
        chatMessages: [],
        isClassEnded: false,
        startedAt: new Date().toISOString()
      });
    }
    return this.rooms.get(bookingId);
  }

  getRoom(bookingId) {
    return this.rooms.get(bookingId);
  }

  addParticipant(bookingId, role, user, res) {
    const room = this.getOrCreateRoom(bookingId);
    
    // Clean up any stale participant for this role
    const existing = room.participants.get(role);
    if (existing && existing.pingInterval) {
      clearInterval(existing.pingInterval);
    }

    // Ping interval to keep SSE connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (err) {
        clearInterval(pingInterval);
      }
    }, 20000);

    const participant = {
      id: user.id,
      name: user.name || (role === 'mentor' ? 'Assigned Mentor' : 'Parent'),
      role,
      res,
      pingInterval,
      joinedAt: new Date().toISOString()
    };

    room.participants.set(role, participant);

    // Send initial room snapshot to this participant
    const activePeers = [];
    room.participants.forEach((p, r) => {
      if (r !== role) {
        activePeers.push({ role: p.role, name: p.name });
      }
    });

    this.sendEventTo(res, 'init', {
      role,
      activePeers,
      chatMessages: room.chatMessages,
      isClassEnded: room.isClassEnded
    });

    // Notify the other peer that this user has joined
    this.broadcastToOthers(bookingId, role, 'peer-joined', {
      role,
      name: participant.name
    });

    return participant;
  }

  removeParticipant(bookingId, role) {
    const room = this.rooms.get(bookingId);
    if (!room) return;

    const participant = room.participants.get(role);
    if (participant) {
      if (participant.pingInterval) {
        clearInterval(participant.pingInterval);
      }
      room.participants.delete(role);

      // Notify the other peer
      this.broadcastToOthers(bookingId, role, 'peer-left', {
        role,
        name: participant.name
      });
    }

    if (room.participants.size === 0) {
      // Room is empty; can be retained briefly or cleaned up if ended
      if (room.isClassEnded) {
        this.rooms.delete(bookingId);
      }
    }
  }

  sendSignal(bookingId, fromRole, signal) {
    const room = this.rooms.get(bookingId);
    if (!room) return false;

    // In a 1:1 classroom, the recipient is the opposite role
    const targetRole = fromRole === 'parent' ? 'mentor' : 'parent';
    const target = room.participants.get(targetRole);

    if (target && target.res) {
      this.sendEventTo(target.res, 'signal', {
        fromRole,
        signal
      });
      return true;
    }
    return false;
  }

  broadcastChat(bookingId, fromRole, senderName, text) {
    const room = this.getOrCreateRoom(bookingId);
    const msg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderRole: fromRole,
      senderName,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    room.chatMessages.push(msg);
    // Keep max 100 messages in memory
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }

    // Broadcast to all participants in this room
    room.participants.forEach((p) => {
      this.sendEventTo(p.res, 'chat', msg);
    });

    return msg;
  }

  endClass(bookingId, initiatedByRole) {
    const room = this.rooms.get(bookingId);
    if (room) {
      room.isClassEnded = true;
      room.participants.forEach((p) => {
        this.sendEventTo(p.res, 'class-ended', {
          initiatedBy: initiatedByRole,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  sendEventTo(res, eventName, data) {
    try {
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.warn('[Classroom SSE Write Error]:', err.message);
    }
  }

  broadcastToOthers(bookingId, senderRole, eventName, data) {
    const room = this.rooms.get(bookingId);
    if (!room) return;

    room.participants.forEach((p, role) => {
      if (role !== senderRole) {
        this.sendEventTo(p.res, eventName, data);
      }
    });
  }

  getActivePeers(bookingId) {
    const room = this.rooms.get(bookingId);
    if (!room) return [];
    const peers = [];
    room.participants.forEach((p) => {
      peers.push({ role: p.role, name: p.name });
    });
    return peers;
  }
}

const classroomManager = new ClassroomManager();

/**
 * Access Control Helper: Validates user identity and booking ownership
 */
function validateClassroomAccess(req, bookingId) {
  const db = getDb();
  const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(bookingId);

  if (!booking) {
    return {
      status: 404,
      error: { success: false, code: 'BOOKING_NOT_FOUND', message: 'Classroom not found.' }
    };
  }

  const userRole = req.userRole;
  if (userRole === 'parent') {
    const isOwner = (booking.parent_id && booking.parent_id === req.parent?.id) ||
                    (booking.parent_email && req.parent?.email && booking.parent_email.toLowerCase() === req.parent.email.toLowerCase());
    if (!isOwner) {
      return {
        status: 403,
        error: { success: false, code: 'FORBIDDEN', message: 'Access denied. You do not own this booking.' }
      };
    }
  } else if (userRole === 'mentor') {
    const isAssigned = (booking.mentor_id && booking.mentor_id === req.mentor?.id);
    if (!isAssigned) {
      return {
        status: 403,
        error: { success: false, code: 'FORBIDDEN', message: 'Access denied. You are not the assigned mentor for this booking.' }
      };
    }
  } else {
    return {
      status: 403,
      error: { success: false, code: 'FORBIDDEN', message: 'Access denied. Invalid user role for classroom.' }
    };
  }

  // 1. If class is already completed or cancelled, disallow joining
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    return {
      status: 410,
      error: { success: false, code: 'CLASS_ENDED', message: 'This trial class has already ended.' }
    };
  }

  // 2. Enforce 5-minute join window and session duration on backend
  const startUtc = booking.slot_start_utc || booking.start_time_utc;
  const endUtc = booking.slot_end_utc || booking.end_time_utc;
  if (startUtc) {
    const now = DateTime.utc();
    const start = DateTime.fromISO(startUtc, { zone: 'utc' });
    const end = endUtc ? DateTime.fromISO(endUtc, { zone: 'utc' }) : start.plus({ minutes: booking.duration_minutes || 30 });

    if (start.isValid) {
      const windowStart = start.minus({ minutes: 5 });

      if (now < windowStart) {
        return {
          status: 403,
          error: {
            success: false,
            code: 'JOIN_WINDOW_NOT_OPEN',
            message: 'Join Demo Class opens 5m before start'
          }
        };
      }

      if (now > end) {
        return {
          status: 410,
          error: {
            success: false,
            code: 'CLASS_ENDED',
            message: 'This trial class has already ended.'
          }
        };
      }
    }
  }

  return { booking };
}

/**
 * GET /api/classroom/:bookingId
 * Validate access and retrieve room status and booking details
 */
router.get('/:bookingId', requireAuth, (req, res) => {
  const { bookingId } = req.params;
  const authCheck = validateClassroomAccess(req, bookingId);
  if (authCheck.error) {
    return res.status(authCheck.status).json(authCheck.error);
  }

  const room = classroomManager.getRoom(bookingId);
  const activePeers = classroomManager.getActivePeers(bookingId);

  res.json({
    success: true,
    data: {
      booking: formatBookingRecord(authCheck.booking),
      userRole: req.userRole,
      activePeers,
      isClassEnded: room ? room.isClassEnded : authCheck.booking.status === 'COMPLETED'
    }
  });
});

/**
 * GET /api/classroom/:bookingId/events
 * Real-time SSE stream for WebRTC signaling, presence, and chat
 */
router.get('/:bookingId/events', requireAuth, (req, res) => {
  const { bookingId } = req.params;
  const authCheck = validateClassroomAccess(req, bookingId);
  if (authCheck.error) {
    return res.status(authCheck.status).json(authCheck.error);
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();

  const user = req.userRole === 'mentor' ? req.mentor : req.parent;
  classroomManager.addParticipant(bookingId, req.userRole, user, res);

  req.on('close', () => {
    classroomManager.removeParticipant(bookingId, req.userRole);
  });
});

/**
 * POST /api/classroom/:bookingId/signal
 * Relays WebRTC SDP offers, answers, and ICE candidates between peers
 */
router.post('/:bookingId/signal', requireAuth, (req, res) => {
  const { bookingId } = req.params;
  const authCheck = validateClassroomAccess(req, bookingId);
  if (authCheck.error) {
    return res.status(authCheck.status).json(authCheck.error);
  }

  const { signal } = req.body;
  if (!signal) {
    return res.status(400).json({ success: false, code: 'INVALID_SIGNAL', message: 'WebRTC signal data is required.' });
  }

  const relayed = classroomManager.sendSignal(bookingId, req.userRole, signal);

  res.json({
    success: true,
    relayed
  });
});

/**
 * POST /api/classroom/:bookingId/chat
 * Send real-time interactive text chat message
 */
router.post('/:bookingId/chat', requireAuth, (req, res) => {
  const { bookingId } = req.params;
  const authCheck = validateClassroomAccess(req, bookingId);
  if (authCheck.error) {
    return res.status(authCheck.status).json(authCheck.error);
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, code: 'EMPTY_MESSAGE', message: 'Message text cannot be empty.' });
  }

  const user = req.userRole === 'mentor' ? req.mentor : req.parent;
  const message = classroomManager.broadcastChat(
    bookingId,
    req.userRole,
    user.name || (req.userRole === 'mentor' ? 'Mentor' : 'Parent'),
    text
  );

  res.json({
    success: true,
    data: message
  });
});

/**
 * POST /api/classroom/:bookingId/leave
 * Participant gracefully leaves the classroom session
 */
router.post('/:bookingId/leave', requireAuth, (req, res) => {
  const { bookingId } = req.params;
  const authCheck = validateClassroomAccess(req, bookingId);
  if (authCheck.error) {
    return res.status(authCheck.status).json(authCheck.error);
  }

  classroomManager.removeParticipant(bookingId, req.userRole);

  // If this session is completed, update booking status
  const db = getDb();
  db.prepare(`UPDATE bookings SET status = 'COMPLETED' WHERE id = ?`).run(bookingId);

  classroomManager.endClass(bookingId, req.userRole);

  res.json({
    success: true,
    message: 'Left classroom cleanly.'
  });
});

export default router;
