import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  Share2, 
  MessageSquare, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  RefreshCw, 
  LayoutDashboard, 
  Copy, 
  Check, 
  Loader2, 
  Clock, 
  User, 
  GraduationCap, 
  Radio, 
  Maximize2,
  Minimize2,
  ScreenShare,
  ScreenShareOff,
  AlertTriangle,
  Info
} from 'lucide-react';
import { api } from '../services/api.js';
import PostClassLearningCheck from './PostClassLearningCheck.jsx';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VirtualClassModal({ 
  booking: initialBooking, 
  bookingId: propBookingId, 
  parent: propParent,
  mentor: propMentor,
  userRole: propUserRole,
  onClose, 
  onBackToDashboard 
}) {
  const resolvedBookingId = propBookingId || initialBooking?.id || initialBooking?.bookingId;

  // Booking & Auth State
  const [booking, setBooking] = useState(initialBooking || null);
  const [userRole, setUserRole] = useState(propUserRole || (propMentor ? 'mentor' : 'parent'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Classroom Flow Stages: 'waiting_room' | 'in_class' | 'learning_check' | 'class_ended'
  const [stage, setStage] = useState('waiting_room');

  // Media & Device States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [devicePermissionError, setDevicePermissionError] = useState(null);
  const [screenShareError, setScreenShareError] = useState(null);

  // Connection & Room Presence States
  const [peerPresent, setPeerPresent] = useState(false);
  const [peerName, setPeerName] = useState('');
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting' | 'waiting' | 'connected' | 'reconnecting' | 'failed' | 'disconnected'
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

  // Chat Panel States
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // UI Modals
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Refs for WebRTC & Elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const waitingVideoRef = useRef(null);
  const pcRef = useRef(null);
  const sseRef = useRef(null);
  const chatBottomRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const screenTrackRef = useRef(null);
  const originalVideoTrackRef = useRef(null);
  const isInitiatorRef = useRef(false);

  // Safe names and details
  const studentName = booking?.childName || booking?.child_name || 'Student';
  const mentorName = booking?.mentorName || booking?.mentor_name || 'Assigned Mentor';
  const subjectTitle = booking?.subjectTitle || booking?.subject_title || 'Trial Class';
  const meetingLink = booking?.meeting_link || (resolvedBookingId ? `https://demo.example.com/class/${resolvedBookingId}` : '');

  // 1. Fetch and Authorize Classroom Access
  const loadClassroom = useCallback(async () => {
    if (!resolvedBookingId) {
      setError({ type: 'not_found', message: 'Classroom not found.' });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.getClassroom(resolvedBookingId);
      if (res.success && res.data) {
        setBooking(res.data.booking);
        if (res.data.userRole) {
          setUserRole(res.data.userRole);
        }
        if (res.data.activePeers && res.data.activePeers.length > 0) {
          setPeerPresent(true);
          setPeerName(res.data.activePeers[0].name || 'Participant');
        }
        if (res.data.isClassEnded || res.data.booking?.status === 'COMPLETED') {
          setStage('class_ended');
        }
      } else {
        throw new Error('Unable to retrieve classroom.');
      }
    } catch (err) {
      console.error('[VirtualClassroom] Access validation error:', err);
      if (err.status === 404 || err.code === 'BOOKING_NOT_FOUND') {
        setError({ type: 'not_found', message: 'Classroom not found.' });
      } else if (err.status === 410 || err.code === 'CLASS_ENDED') {
        setStage('class_ended');
      } else if (err.code === 'JOIN_WINDOW_NOT_OPEN') {
        setError({
          type: 'join_window_closed',
          message: err.data?.message || 'Join Demo Class opens 5m before start'
        });
      } else if (err.status === 403 || err.code === 'FORBIDDEN') {
        setError({
          type: 'unauthorized',
          message: err.data?.message || err.message || 'You do not have permission to access this classroom session.'
        });
      } else {
        setError({
          type: 'load_failed',
          message: 'Unable to connect to the classroom server.'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedBookingId]);

  useEffect(() => {
    loadClassroom();
  }, [loadClassroom]);

  // 2. Initialize Camera & Mic Media Stream
  const initLocalMedia = useCallback(async () => {
    setDevicePermissionError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[VirtualClassroom] MediaDevices API not available in this environment');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setLocalStream(stream);

      // Attach to waiting preview video element if in waiting stage
      if (waitingVideoRef.current) {
        waitingVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('[VirtualClassroom] Camera/Mic access denied or unavailable:', err);
      let permMsg = 'Camera and microphone access denied. Please grant browser permissions to speak and be seen.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        permMsg = 'Camera or microphone permissions were denied. You can still join and listen.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        permMsg = 'No camera or microphone hardware found on your device.';
      }
      setDevicePermissionError(permMsg);
      return null;
    }
  }, []);

  useEffect(() => {
    initLocalMedia();

    return () => {
      // Clean up local stream tracks on unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element bindings when localStream changes
  useEffect(() => {
    if (localStream) {
      if (waitingVideoRef.current && stage === 'waiting_room') {
        waitingVideoRef.current.srcObject = localStream;
      }
      if (localVideoRef.current && stage === 'in_class') {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, stage]);

  // Update remote video element binding
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, stage]);

  // 3. Setup WebRTC PeerConnection & SSE Signaling
  const setupWebRTC = useCallback((streamToUse) => {
    if (typeof RTCPeerConnection === 'undefined') {
      console.warn('[WebRTC] RTCPeerConnection not supported in this environment');
      return;
    }

    // Clean up existing connection if any
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Attach local stream tracks
    if (streamToUse) {
      streamToUse.getTracks().forEach(track => {
        pc.addTrack(track, streamToUse);
      });
    }

    // Remote track listener
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setConnectionState('connected');
      }
    };

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && resolvedBookingId) {
        api.sendClassroomSignal(resolvedBookingId, {
          type: 'candidate',
          candidate: event.candidate
        }).catch(() => {});
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setConnectionState('connected');
      } else if (state === 'connecting') {
        setConnectionState('connecting');
      } else if (state === 'disconnected') {
        setConnectionState('reconnecting');
      } else if (state === 'failed') {
        setConnectionState('failed');
      } else if (state === 'closed') {
        setConnectionState('disconnected');
      }
    };

    return pc;
  }, [resolvedBookingId]);

  // Create & send WebRTC offer
  const createAndSendOffer = useCallback(async (pc) => {
    if (!pc || !resolvedBookingId) return;
    try {
      isInitiatorRef.current = true;
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      await api.sendClassroomSignal(resolvedBookingId, {
        type: 'offer',
        sdp: offer.sdp
      });
    } catch (err) {
      console.warn('[WebRTC] Error creating offer:', err);
    }
  }, [resolvedBookingId]);

  // Connect SSE Signaling Stream
  const connectSignaling = useCallback((streamToUse) => {
    if (typeof EventSource === 'undefined' || !resolvedBookingId) return;

    if (sseRef.current) {
      sseRef.current.close();
    }

    const sseUrl = `/api/classroom/${encodeURIComponent(resolvedBookingId)}/events`;
    const sse = new EventSource(sseUrl, { withCredentials: true });
    sseRef.current = sse;

    // 1. Initial room snapshot
    sse.addEventListener('init', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.activePeers && data.activePeers.length > 0) {
          setPeerPresent(true);
          setPeerName(data.activePeers[0].name || 'Participant');
          // If the other peer is already here, initiate offer
          if (pcRef.current) {
            createAndSendOffer(pcRef.current);
          }
        }
        if (data.chatMessages) {
          setChatMessages(data.chatMessages);
        }
        if (data.isClassEnded) {
          setStage('class_ended');
        }
      } catch (err) {}
    });

    // 2. Peer joined room
    sse.addEventListener('peer-joined', (e) => {
      try {
        const data = JSON.parse(e.data);
        setPeerPresent(true);
        setPeerName(data.name || 'Participant');

        // Whenever a new peer joins, establish connection with an offer
        if (pcRef.current) {
          createAndSendOffer(pcRef.current);
        }
      } catch (err) {}
    });

    // 3. Peer left room
    sse.addEventListener('peer-left', (e) => {
      try {
        const data = JSON.parse(e.data);
        setPeerPresent(false);
        setConnectionState('waiting');
      } catch (err) {}
    });

    // 4. WebRTC Signal received (offer, answer, candidate)
    sse.addEventListener('signal', async (e) => {
      try {
        const { fromRole, signal } = JSON.parse(e.data);
        const pc = pcRef.current;
        if (!pc || !signal) return;

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await api.sendClassroomSignal(resolvedBookingId, {
            type: 'answer',
            sdp: answer.sdp
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        } else if (signal.type === 'candidate') {
          if (signal.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (candErr) {}
          }
        }
      } catch (err) {
        console.warn('[WebRTC] Signaling message handle error:', err);
      }
    });

    // 5. Incoming Real-time Chat
    sse.addEventListener('chat', (e) => {
      try {
        const msg = JSON.parse(e.data);
        setChatMessages(prev => [...prev, msg]);
        if (!isChatOpen) {
          setUnreadChatCount(prev => prev + 1);
        }
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err) {}
    });

    // 6. Class ended
    sse.addEventListener('class-ended', () => {
      setStage('class_ended');
    });

    sse.onerror = () => {
      console.warn('[SSE] EventSource encountered error');
    };
  }, [resolvedBookingId, isChatOpen, createAndSendOffer]);

  // 4. Enter Live Classroom from Waiting Room
  const handleJoinLiveClass = () => {
    setStage('in_class');
    const pc = setupWebRTC(localStream);
    connectSignaling(localStream);

    // Start Session Timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setSessionDurationSeconds(sec => sec + 1);
    }, 1000);
  };

  // Cleanup on unmount or stage change
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (sseRef.current) sseRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (screenTrackRef.current) screenTrackRef.current.stop();
    };
  }, []);

  // Format Timer mm:ss
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  // Toggle Camera
  const handleToggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !camEnabled;
      });
      setCamEnabled(!camEnabled);
    }
  };

  // Toggle Screen Sharing
  const handleToggleScreenShare = async () => {
    setScreenShareError(null);

    if (isScreenSharing) {
      // Stop Screen Sharing
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);

      // Revert WebRTC sender video track back to camera
      if (pcRef.current && originalVideoTrackRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(originalVideoTrackRef.current);
        }
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setScreenShareError('Screen sharing is not supported by your browser or mobile device.');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      // Replace video track in PeerConnection
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          originalVideoTrackRef.current = videoSender.track;
          videoSender.replaceTrack(screenTrack);
        }
      }

      // Handle when user stops screen share via native browser floating banner
      screenTrack.onended = () => {
        setIsScreenSharing(false);
        screenTrackRef.current = null;
        if (pcRef.current && originalVideoTrackRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(originalVideoTrackRef.current);
          }
        }
      };
    } catch (err) {
      console.warn('[ScreenShare] Denied or error:', err);
      if (err.name !== 'NotAllowedError') {
        setScreenShareError('Unable to share screen. Please try again.');
      }
    }
  };

  // Send Text Chat Message
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !resolvedBookingId) return;

    const textToSend = chatInput.trim();
    setChatInput('');

    try {
      await api.sendClassroomChat(resolvedBookingId, textToSend);
    } catch (err) {
      console.error('[Chat] Send failed:', err);
    }
  };

  // Leave Class Flow
  const handleConfirmLeave = async () => {
    setShowLeaveConfirm(false);

    // 1. Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }

    // 2. Close WebRTC & SSE cleanly
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    // 3. Inform backend
    try {
      if (resolvedBookingId) {
        await api.leaveClassroom(resolvedBookingId);
      }
    } catch (e) {}

    // 4. If parent, transition directly to Learning Check
    if (userRole === 'parent') {
      setStage('learning_check');
    } else {
      // If mentor, return to dashboard
      handleDashboard();
    }
  };

  const handleCopyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const handleDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else if (onClose) {
      onClose();
    }
  };

  // =========================================================================
  // STATE 1: LOADING STATE
  // =========================================================================
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 35, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}>
        <div style={{
          backgroundColor: '#163D4A',
          color: '#FFFFFF',
          width: '100%',
          maxWidth: '480px',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid #2B5766',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            color: '#34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Loader2 size={32} className="spin" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFFFFF' }}>
            Preparing your classroom…
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#A0B8C0', margin: 0 }}>
            Verifying 1:1 participant authorization and configuring secure real-time WebRTC media.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: 404 NOT FOUND
  // =========================================================================
  if (error?.type === 'not_found' || (!booking && !loading && !error)) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 35, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}>
        <div style={{
          backgroundColor: '#163D4A',
          color: '#FFFFFF',
          width: '100%',
          maxWidth: '500px',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid #2B5766',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(232, 93, 93, 0.15)',
            color: '#E85D5D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <AlertCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.65rem', color: '#FFFFFF' }}>
            Classroom not found.
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#A0B8C0', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            The requested trial session could not be located. It may have expired, been cancelled, or the link may be invalid.
          </p>
          <button
            type="button"
            onClick={handleDashboard}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
          >
            <LayoutDashboard size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 3: 403 FORBIDDEN / UNAUTHORIZED ACCESS
  // =========================================================================
  if (error?.type === 'unauthorized') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 35, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}>
        <div style={{
          backgroundColor: '#163D4A',
          color: '#FFFFFF',
          width: '100%',
          maxWidth: '500px',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          border: '1px solid #2B5766',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(232, 93, 93, 0.15)',
            color: '#E85D5D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ShieldAlert size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.65rem', color: '#FFFFFF' }}>
            Unauthorized Access
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#A0B8C0', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {error.message || 'You do not have permission to access this classroom.'}
          </p>
          <button
            type="button"
            onClick={handleDashboard}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
          >
            <LayoutDashboard size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 3.5: JOIN WINDOW NOT YET OPEN (Opens 5m before start)
  // =========================================================================
  if (error?.type === 'join_window_closed') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 35, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '3.75rem',
            height: '3.75rem',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Clock size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
            Join Demo Class opens 5m before start
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            Your 1:1 live demo session is scheduled soon. The classroom will automatically open 5 minutes prior to the session start.
          </p>
          <button
            type="button"
            onClick={handleDashboard}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}
          >
            <LayoutDashboard size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 4: POST-CLASS LEARNING CHECK
  // =========================================================================
  if (stage === 'learning_check') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg)',
        zIndex: 160,
        overflowY: 'auto',
        padding: '2rem 1.25rem'
      }}>
        <PostClassLearningCheck
          bookingId={resolvedBookingId}
          booking={booking}
          onFinish={handleDashboard}
          onBackToDashboard={handleDashboard}
        />
      </div>
    );
  }

  // =========================================================================
  // STATE 5: CLASS ENDED STATE
  // =========================================================================
  if (stage === 'class_ended') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 35, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '520px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <CheckCircle2 size={32} />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
            Trial Class Ended
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-muted-text)', lineHeight: 1.5, marginBottom: '2rem' }}>
            Thank you for attending today's 1:1 demo session for <strong>{subjectTitle}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {userRole === 'parent' && (
              <button
                type="button"
                onClick={() => setStage('learning_check')}
                className="btn btn-primary"
                style={{ padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                Complete Learning Check
              </button>
            )}
            <button
              type="button"
              onClick={handleDashboard}
              className="btn btn-secondary"
              style={{ padding: '0.8rem', fontSize: '0.92rem' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PART 4: WAITING ROOM UI
  // =========================================================================
  if (stage === 'waiting_room') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0A1C23',
        color: '#FFFFFF',
        zIndex: 130,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Waiting Room Top Bar */}
        <div style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #1E3A45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0F2C36'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src="/assets/logo.png" 
              alt="CodeYoung Logo" 
              style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>1:1 Interactive Classroom Check-in</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{subjectTitle}</div>
            </div>
          </div>

          <button
            onClick={handleDashboard}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="Leave waiting room"
          >
            <X size={20} />
          </button>
        </div>

        {/* Waiting Room Body Grid */}
        <div style={{
          flex: 1,
          maxWidth: '960px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          {/* Left: Device & Camera Preview */}
          <div>
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: '#051116',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid #1E3A45',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.4)'
            }}>
              {camEnabled ? (
                <video
                  ref={waitingVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#64748B' }}>
                  <VideoOff size={44} style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.88rem' }}>Camera is Off</div>
                </div>
              )}

              {/* Status overlay badge */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                padding: '0.3rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: camEnabled ? '#10B981' : '#EF4444' }} />
                <span>Camera Preview</span>
              </div>
            </div>

            {/* Mic & Cam Quick Toggles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                id="btn-toggle-mic-waiting"
                onClick={handleToggleMic}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '25px',
                  backgroundColor: micEnabled ? '#1E3A45' : '#7F1D1D',
                  color: '#FFFFFF',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              >
                {micEnabled ? <Mic size={17} color="#34D399" /> : <MicOff size={17} color="#F87171" />}
                <span>{micEnabled ? 'Mic Active' : 'Mic Muted'}</span>
              </button>

              <button
                type="button"
                id="btn-toggle-cam-waiting"
                onClick={handleToggleCam}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '25px',
                  backgroundColor: camEnabled ? '#1E3A45' : '#7F1D1D',
                  color: '#FFFFFF',
                  border: '1px solid #334155',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              >
                {camEnabled ? <VideoIcon size={17} color="#34D399" /> : <VideoOff size={17} color="#F87171" />}
                <span>{camEnabled ? 'Camera Active' : 'Camera Off'}</span>
              </button>
            </div>

            {devicePermissionError && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: 'var(--radius-md)',
                color: '#FCA5A5',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{devicePermissionError}</span>
              </div>
            )}
          </div>

          {/* Right: Session Info & Join Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span className="badge badge-teal" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Confirmed 1:1 Demo
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0 0.5rem' }}>
                {subjectTitle}
              </h2>
              <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                Student: <strong style={{ color: '#FFFFFF' }}>{studentName}</strong>
              </div>
            </div>

            <div style={{
              backgroundColor: '#0F2C36',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #1E3A45',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <GraduationCap size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>
                  Assigned Mentor: <strong style={{ color: '#FFFFFF' }}>{mentorName}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={18} color="var(--color-primary)" />
                <span style={{ fontSize: '0.88rem', color: '#CBD5E1' }}>
                  Scheduled duration: <strong style={{ color: '#FFFFFF' }}>30 minutes</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Radio size={18} color={peerPresent ? '#34D399' : '#F59E0B'} />
                <span style={{ fontSize: '0.88rem', color: peerPresent ? '#34D399' : '#F59E0B', fontWeight: 600 }}>
                  {peerPresent ? `${mentorName} is in the room!` : 'Your mentor has not joined yet.'}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              id="btn-enter-live-classroom"
              onClick={handleJoinLiveClass}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: 800,
                boxShadow: '0 8px 20px rgba(49, 95, 97, 0.35)'
              }}
            >
              <VideoIcon size={20} />
              <span>Join Class</span>
            </button>

            <p style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', margin: 0 }}>
              Peer-to-peer real-time audio and video connection is encrypted end-to-end.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PARTS 5, 6, 7, 8: LIVE 1:1 CLASSROOM UI
  // =========================================================================
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#08171C',
      color: '#FFFFFF',
      zIndex: 130,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* TOP BAR */}
      <header style={{
        height: '62px',
        padding: '0 1.5rem',
        backgroundColor: '#0F2C36',
        borderBottom: '1px solid #1E3A45',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        {/* Brand & Course Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="/assets/logo.png" 
            alt="CodeYoung Logo" 
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ borderLeft: '1px solid #284752', paddingLeft: '0.85rem' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF' }}>
              {subjectTitle}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Mentor: <strong>{mentorName}</strong> • Student: <strong>{studentName}</strong>
            </div>
          </div>
        </div>

        {/* Center: Session Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#091B21',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          border: '1px solid #1E3A45'
        }}>
          <Clock size={15} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: '#E2E8F0' }}>
            {formatTimer(sessionDurationSeconds)}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>/ 30:00</span>
        </div>

        {/* Right: Connection Status & Chat Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            backgroundColor: connectionState === 'connected' ? '#14463A' : '#452D12',
            color: connectionState === 'connected' ? '#34D399' : '#F59E0B',
            padding: '0.25rem 0.65rem',
            borderRadius: '20px'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: connectionState === 'connected' ? '#34D399' : '#F59E0B'
            }} />
            <span>
              {connectionState === 'connected' ? 'Connected (1:1)' : 
               (peerPresent ? 'Connecting WebRTC…' : 'Waiting for mentor…')}
            </span>
          </span>

          <button
            type="button"
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setUnreadChatCount(0);
            }}
            style={{
              position: 'relative',
              backgroundColor: isChatOpen ? 'var(--color-primary)' : '#1E3A45',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
            title="Toggle Live Chat"
          >
            <MessageSquare size={16} />
            <span>Chat</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* CENTER WORKSPACE: VIDEO STAGE & INTERACTIVE CHAT */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* VIDEO DISPLAY AREA */}
        <div style={{
          flex: 1,
          backgroundColor: '#051116',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* MAIN VIDEO: Remote Stream (Mentor or Student) */}
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: isScreenSharing ? 'contain' : 'cover'
              }}
            />
          ) : (
            /* Waiting for remote peer video */
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '5.5rem',
                height: '5.5rem',
                borderRadius: '50%',
                backgroundColor: '#0F2C36',
                border: '2px solid #1E3A45',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                margin: '0 auto 1.25rem'
              }}>
                {(mentorName || 'M')[0]}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                {peerPresent ? `Connecting with ${mentorName}…` : 'Your mentor has not joined yet.'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94A3B8', maxWidth: '420px', margin: '0 auto' }}>
                {peerPresent
                  ? 'Establishing secure WebRTC peer connection…'
                  : 'Please stay on this page. Your live 1:1 session will begin as soon as the mentor enters.'}
              </p>
            </div>
          )}

          {/* Remote Peer Overlay Tag */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            backgroundColor: 'rgba(15, 44, 54, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {userRole === 'parent' ? `${mentorName} (Mentor)` : `${studentName} (Student)`}
          </div>

          {/* SECOND VIDEO: Picture-in-Picture Local Self-View */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '200px',
            aspectRatio: '16/9',
            backgroundColor: '#0F2C36',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 10
          }}>
            {camEnabled && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <VideoOff size={22} />
              </div>
            )}
            <div style={{
              position: 'absolute',
              bottom: '0.35rem',
              left: '0.35rem',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 600
            }}>
              You ({userRole === 'mentor' ? 'Mentor' : 'Parent'})
            </div>
          </div>

          {/* Screen Share Error Alert if triggered */}
          {screenShareError && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#B91C1C',
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 20
            }}>
              <AlertTriangle size={16} />
              <span>{screenShareError}</span>
              <button
                onClick={() => setScreenShareError(null)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', marginLeft: '0.5rem' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR: INTERACTIVE REAL-TIME CHAT PANEL (Part 6) */}
        {isChatOpen && (
          <aside style={{
            width: '320px',
            maxWidth: '100%',
            backgroundColor: '#0F2C36',
            borderLeft: '1px solid #1E3A45',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid #1E3A45',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#091C23'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700 }}>
                <MessageSquare size={16} color="var(--color-primary)" />
                <span>Classroom Chat</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                title="Collapse Chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem', margin: 'auto 0' }}>
                  No messages yet. Send a note to say hello!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderRole === userRole;
                  const timeFormatted = msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                      }}
                    >
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#94A3B8',
                        marginBottom: '0.2rem',
                        textAlign: isMe ? 'right' : 'left'
                      }}>
                        {msg.senderName} • {timeFormatted}
                      </div>
                      <div style={{
                        backgroundColor: isMe ? 'var(--color-primary)' : '#1E3A45',
                        color: '#FFFFFF',
                        padding: '0.55rem 0.85rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChat} style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid #1E3A45',
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: '#091C23'
            }}>
              <input
                type="text"
                id="input-classroom-chat"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  backgroundColor: '#0F2C36',
                  color: '#FFFFFF',
                  border: '1px solid #1E3A45',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                id="btn-send-classroom-chat"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0 0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Send Message"
              >
                <Send size={15} />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* BOTTOM CONTROLS BAR (Part 5) */}
      <footer style={{
        height: '72px',
        padding: '0 1.5rem',
        backgroundColor: '#0F2C36',
        borderTop: '1px solid #1E3A45',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        flexShrink: 0
      }}>
        {/* Meeting Link & Copy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#94A3B8' }}>
          <span>Class ID:</span>
          <code style={{ backgroundColor: '#091C23', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#34D399', fontSize: '0.75rem' }}>
            {resolvedBookingId}
          </code>
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              background: 'transparent',
              border: 'none',
              color: copiedLink ? '#34D399' : '#94A3B8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem'
            }}
            title="Copy classroom meeting link"
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Center Control Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Mic Button */}
          <button
            type="button"
            id="btn-control-mic"
            onClick={handleToggleMic}
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '50%',
              backgroundColor: micEnabled ? '#1E3A45' : '#7F1D1D',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
            title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
            aria-label={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micEnabled ? <Mic size={18} color="#34D399" /> : <MicOff size={18} color="#F87171" />}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            id="btn-control-cam"
            onClick={handleToggleCam}
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '50%',
              backgroundColor: camEnabled ? '#1E3A45' : '#7F1D1D',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease'
            }}
            title={camEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
            aria-label={camEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {camEnabled ? <VideoIcon size={18} color="#34D399" /> : <VideoOff size={18} color="#F87171" />}
          </button>

          {/* Native Screen Share Button (Part 7) */}
          <button
            type="button"
            id="btn-control-screen-share"
            onClick={handleToggleScreenShare}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '25px',
              backgroundColor: isScreenSharing ? '#0369A1' : '#1E3A45',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            aria-label={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <ScreenShareOff size={16} /> : <ScreenShare size={16} />}
            <span>{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
          </button>

          {/* Leave Class Button (Part 9) */}
          <button
            type="button"
            id="btn-leave-class-trigger"
            onClick={() => setShowLeaveConfirm(true)}
            style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '25px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
            title="Leave Classroom"
            aria-label="Leave Classroom"
          >
            <PhoneOff size={16} />
            <span>Leave Class</span>
          </button>
        </div>
      </footer>

      {/* CONFIRM LEAVE CLASS DIALOG (Part 9) */}
      {showLeaveConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 35, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)',
            padding: '2.25rem 2rem',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{
              width: '3.75rem',
              height: '3.75rem',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <PhoneOff size={26} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
              Leave the classroom?
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--color-muted-text)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              {userRole === 'parent'
                ? 'Leaving now will end your demo session and take you directly to your child\'s quick Learning Check.'
                : 'Are you sure you want to end this 1:1 mentorship session?'}
            </p>

            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
              <button
                type="button"
                id="btn-stay-in-class"
                onClick={() => setShowLeaveConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.8rem 1rem', fontSize: '0.92rem' }}
              >
                Stay in Class
              </button>
              <button
                type="button"
                id="btn-confirm-leave-class"
                onClick={handleConfirmLeave}
                className="btn"
                style={{
                  flex: 1,
                  padding: '0.8rem 1rem',
                  fontSize: '0.92rem',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Leave Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
