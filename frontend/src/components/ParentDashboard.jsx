import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Sparkles, 
  PlusCircle, 
  LogOut, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  AlertCircle, 
  RefreshCw, 
  BookOpen, 
  ArrowRight, 
  Globe, 
  Award, 
  GraduationCap, 
  ChevronRight, 
  UserCheck, 
  Check, 
  Info,
  Layers,
  FileText
} from 'lucide-react';
import { DateTime } from 'luxon';
import { api } from '../services/api.js';
import PostClassLearningCheck from './PostClassLearningCheck.jsx';

/**
 * Checks whether a booking is currently within the allowable join window
 * (Starting exactly 5 minutes prior to scheduled start up to session end)
 */
export function isJoinWindowOpen(booking) {
  if (!booking) return false;
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return false;

  const startUtc = booking.slot_start_utc || booking.start_time_utc;
  const endUtc = booking.slot_end_utc || booking.end_time_utc;
  if (!startUtc) return false;

  const now = DateTime.utc();
  const start = DateTime.fromISO(startUtc, { zone: 'utc' });
  if (!start.isValid) return false;

  const end = endUtc ? DateTime.fromISO(endUtc, { zone: 'utc' }) : start.plus({ minutes: booking.duration_minutes || 30 });

  const windowStart = start.minus({ minutes: 5 });
  const windowEnd = end;

  return now >= windowStart && now <= windowEnd;
}

export default function ParentDashboard({ 
  parent, 
  onLogout, 
  onBookAnotherTrial, 
  onJoinClass 
}) {
  const [sessionsData, setSessionsData] = useState({ upcoming: [], past: [], cancelled: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedDetailsBooking, setSelectedDetailsBooking] = useState(null);
  const [, setTick] = useState(0);

  // Periodic 5s interval to automatically unlock the join button when clock reaches 5m before start
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getParentBookings();
      if (res.success && res.data) {
        setSessionsData(res.data);
      } else {
        throw new Error("Unable to retrieve your trial classes.");
      }
    } catch (err) {
      console.error('Error fetching parent sessions:', err);
      setErrorMessage("We couldn't load your sessions right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [parent?.id]);

  const handleCopyLink = (link, bookingId) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(bookingId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatSessionDate = (utcIso, parentTz) => {
    try {
      const dt = DateTime.fromISO(utcIso, { zone: parentTz || 'UTC' });
      return dt.toFormat('cccc, LLLL d, yyyy');
    } catch {
      return 'Scheduled Date';
    }
  };

  const formatSessionTime = (utcIso, timezone) => {
    try {
      const dt = DateTime.fromISO(utcIso, { zone: timezone || 'UTC' });
      return dt.toFormat('h:mm a');
    } catch {
      return '';
    }
  };

  const scrollToLearningProgress = () => {
    const el = document.getElementById('learning-progress-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const { upcoming, past, all } = sessionsData;
  const primaryUpcoming = upcoming.length > 0 ? upcoming[0] : null;

  // Extract real mentor information from the booking record
  const mentorDetails = primaryUpcoming?.mentorDetails || {};
  const mentorName = primaryUpcoming?.mentor_name || mentorDetails.name || 'Assigned Mentor';
  const mentorSpecialization = primaryUpcoming?.mentorSpecialization || mentorDetails.specialization || 'STEM & Coding Educator';
  const mentorBio = primaryUpcoming?.mentorBio || mentorDetails.experience || 'Experienced Educator in Live 1:1 Mentorship';
  const mentorAvatarBg = primaryUpcoming?.mentorAvatarBg || mentorDetails.avatarBg || '#E6F4F1';
  const mentorAvatarColor = primaryUpcoming?.mentorAvatarColor || mentorDetails.avatarColor || '#315F61';
  const mentorInitials = mentorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'M';

  // Check join window for primary session
  const primaryCanJoin = primaryUpcoming ? isJoinWindowOpen(primaryUpcoming) : false;

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 4.5rem)', padding: '2.5rem 0 4.5rem' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Top Header / Greeting Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.75rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img 
              src="/assets/logo.png" 
              alt="CodeYoung Logo" 
              style={{
                height: '54px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                <Sparkles size={14} />
                <span>Parent Portal</span>
              </div>
              <h1 className="heading-lg" style={{ color: 'var(--color-dark-text)', fontSize: '1.65rem' }}>
                Welcome back, {parent?.name || 'Parent'}
              </h1>
              <p className="text-body" style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)', margin: 0 }}>
                Student account: <strong>{parent?.email}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={onBookAnotherTrial}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            >
              <PlusCircle size={16} />
              <span>Book Another Trial</span>
            </button>

            <button
              onClick={onLogout}
              className="btn btn-secondary"
              style={{
                padding: '0.65rem 1rem',
                fontSize: '0.88rem',
                color: 'var(--color-muted-text)',
                borderColor: 'var(--color-border)'
              }}
              title="Sign out of your parent account"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* SECTION 5: COMPACT QUICK ACTIONS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
          marginBottom: '2rem'
        }}>
          <button
            type="button"
            onClick={onBookAnotherTrial}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PlusCircle size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>Book Another Trial</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>Schedule new 1:1 subject</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-muted-text)" />
          </button>

          <button
            type="button"
            onClick={scrollToLearningProgress}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Award size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>View Learning Progress</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>Scores & completed reports</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-muted-text)" />
          </button>

          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#F3E8FF',
                color: '#7E22CE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>Account / Profile</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>Parent info & timezone</div>
              </div>
            </div>
            <ChevronRight size={16} color="var(--color-muted-text)" />
          </button>
        </div>

        {/* SECTION 6: LOADING STATE */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <RefreshCw size={28} className="spin" color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.25rem' }}>
              Loading your dashboard…
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)' }}>
              Verifying upcoming trial classes and mentor schedules
            </p>
          </div>
        )}

        {/* SECTION 6: API ERROR STATE */}
        {!loading && errorMessage && (
          <div className="alert alert-error" style={{
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>{errorMessage}</span>
            </div>
            <button
              onClick={fetchBookings}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* MAIN DASHBOARD CONTENT */}
        {!loading && !errorMessage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

            {/* SECTION 1: WELCOME / NEXT SESSION CARD */}
            {primaryUpcoming ? (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 className="heading-md" style={{ color: 'var(--color-dark-text)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="var(--color-primary)" />
                    <span>Your Next 1:1 Trial Class</span>
                  </h2>
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={13} />
                    <span>Status: {primaryUpcoming.status || 'CONFIRMED'}</span>
                  </span>
                </div>

                <div className="card" style={{
                  padding: '2.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle top accent bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'var(--color-primary)'
                  }} />

                  {/* Header Row: Subject, Student & Booking ID */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '1.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <BookOpen size={26} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Course Name
                        </span>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-dark-text)', letterSpacing: '-0.01em', margin: '0.15rem 0' }}>
                          {primaryUpcoming.subject_title || primaryUpcoming.subjectTitle}
                        </h3>
                        <span style={{ fontSize: '0.86rem', color: 'var(--color-muted-text)' }}>
                          Student: <strong>{primaryUpcoming.child_name || primaryUpcoming.childName}</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Booking ID
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                        {primaryUpcoming.id}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.2rem' }}>
                        ● Status: {primaryUpcoming.status || 'Confirmed'}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid: Booking Date, Mentor Name, Duration */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.75rem'
                  }}>
                    {/* Booking Date & Duration */}
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <Calendar size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Booking Date
                        </span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.2rem' }}>
                        {formatSessionDate(primaryUpcoming.start_time_utc || primaryUpcoming.slot_start_utc, primaryUpcoming.parent_timezone)}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-text)' }}>
                        Session Duration: <strong>{primaryUpcoming.duration_minutes || 30} minutes</strong>
                      </span>
                    </div>

                    {/* Assigned Mentor Name (strictly automatic, no reselection) */}
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <UserCheck size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Assigned Mentor
                        </span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.2rem' }}>
                        {mentorName}
                      </div>
                      <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                        Auto-assigned certified coach
                      </span>
                    </div>
                  </div>

                  {/* Dual Local Date & Time */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    border: '1px solid #D5E5E5',
                    marginBottom: '2rem'
                  }}>
                    {/* Parent Local Date/Time */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <Clock size={15} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-dark-teal)', textTransform: 'uppercase' }}>
                          Parent Local Time
                        </span>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                        {formatSessionTime(primaryUpcoming.start_time_utc || primaryUpcoming.slot_start_utc, primaryUpcoming.parent_timezone)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {primaryUpcoming.parent_timezone}
                      </div>
                    </div>

                    {/* Mentor Local Date/Time */}
                    <div style={{ borderLeft: '1px dashed #BFD7D7', paddingLeft: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <Globe size={15} color="var(--color-muted-text)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Mentor Local Time
                        </span>
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-muted-text)' }}>
                        {primaryUpcoming.mentor_local_time || formatSessionTime(primaryUpcoming.start_time_utc || primaryUpcoming.slot_start_utc, primaryUpcoming.mentor_timezone || 'Asia/Kolkata')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>
                        {primaryUpcoming.mentor_timezone || 'Asia/Kolkata'} (IST)
                      </div>
                    </div>
                  </div>

                  {/* Action Bar: Primary CTA "Join Demo Class" & Copy Link */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '0.5rem'
                  }}>
                    {/* Copy classroom meeting link */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--color-surface-hover)',
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                        maxWidth: '360px',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-dark-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {primaryUpcoming.meeting_link || primaryUpcoming.dummy_class_link || `https://demo.example.com/class/${primaryUpcoming.id}`}
                        </span>
                        <button
                          onClick={() => handleCopyLink(primaryUpcoming.meeting_link || primaryUpcoming.dummy_class_link, primaryUpcoming.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            color: copiedId === primaryUpcoming.id ? 'var(--color-success)' : 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          title="Copy classroom link"
                        >
                          {copiedId === primaryUpcoming.id ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Primary CTA: "Join Demo Class" — Only shown when within join window */}
                    {primaryCanJoin ? (
                      <button
                        id="btn-join-demo-class-primary"
                        onClick={() => onJoinClass(primaryUpcoming)}
                        className="btn btn-primary"
                        style={{
                          padding: '0.85rem 2rem',
                          fontSize: '1.02rem',
                          fontWeight: 800,
                          boxShadow: '0 4px 14px rgba(49, 95, 97, 0.28)'
                        }}
                      >
                        <Video size={18} />
                        <span>Join Demo Class</span>
                        <ExternalLink size={16} />
                      </button>
                    ) : (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#F3F4F6',
                        color: '#6B7280',
                        padding: '0.7rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid #E5E7EB'
                      }}>
                        <Clock size={16} />
                        <span>Join Demo Class opens 5m before start</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              /* SECTION 6: EMPTY UPCOMING TRIAL STATE */
              <div className="card" style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Calendar size={24} />
                </div>
                <h3 className="heading-md" style={{ marginBottom: '0.5rem', color: 'var(--color-dark-text)' }}>
                  No upcoming trial class scheduled
                </h3>
                <p className="text-body" style={{ maxWidth: '480px', margin: '0 auto 1.75rem', fontSize: '0.92rem', color: 'var(--color-muted-text)' }}>
                  Give your child a personalized 1:1 live demo class in Coding, AI, Game Development, or Robotics. An expert mentor will be automatically assigned.
                </p>
                <button
                  onClick={onBookAnotherTrial}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
                >
                  <PlusCircle size={18} />
                  <span>Book a Free Trial Class</span>
                </button>
              </div>
            )}

            {/* SECTION 2: ASSIGNED MENTOR CARD (Shown when upcoming trial exists) */}
            {primaryUpcoming && (
              <section>
                <h2 className="heading-md" style={{ color: 'var(--color-dark-text)', fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={18} color="var(--color-primary)" />
                  <span>Assigned Mentor Details</span>
                </h2>

                <div className="card" style={{
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Mentor Avatar */}
                    <div style={{
                      width: '4.25rem',
                      height: '4.25rem',
                      borderRadius: '50%',
                      backgroundColor: mentorAvatarBg,
                      color: mentorAvatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      border: '2px solid rgba(0,0,0,0.06)'
                    }}>
                      {mentorInitials}
                    </div>

                    {/* Mentor Name & Specialization */}
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dark-text)', margin: 0 }}>
                          {mentorName}
                        </h3>
                        <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>
                          {mentorSpecialization}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-muted-text)', marginTop: '0.35rem', lineHeight: 1.5, marginBottom: 0 }}>
                        {mentorBio}
                      </p>
                    </div>
                  </div>

                  {/* Session Schedule Breakdown for Assigned Mentor */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Scheduled Date
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)', marginTop: '0.2rem' }}>
                        {formatSessionDate(primaryUpcoming.start_time_utc || primaryUpcoming.slot_start_utc, primaryUpcoming.parent_timezone)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Your Local Time
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                        {formatSessionTime(primaryUpcoming.start_time_utc || primaryUpcoming.slot_start_utc, primaryUpcoming.parent_timezone)} ({primaryUpcoming.parent_timezone})
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                        Mentor Local Time
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-muted-text)', marginTop: '0.2rem' }}>
                        {primaryUpcoming.mentor_local_time || formatSessionTime(primaryUpcoming.start_time_utc || primaryUpcoming.slot_start_utc, primaryUpcoming.mentor_timezone || 'Asia/Kolkata')} ({primaryUpcoming.mentor_timezone || 'Asia/Kolkata'})
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: MY TRIALS (Upcoming & Past Bookings) */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className="heading-md" style={{ color: 'var(--color-dark-text)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} color="var(--color-primary)" />
                  <span>My Trials</span>
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)' }}>
                  Total sessions: <strong>{upcoming.length + past.length}</strong>
                </span>
              </div>

              {upcoming.length === 0 && past.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
                  <p style={{ color: 'var(--color-muted-text)', margin: 0, fontSize: '0.92rem' }}>
                    No bookings found. Click "Book Another Trial" to schedule your first demo class.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* List all bookings (upcoming first, then past) */}
                  {[...upcoming, ...past].map((item) => {
                    const isCompleted = item.status === 'COMPLETED' || (item.end_time_utc && item.end_time_utc < DateTime.utc().toISO());
                    const canJoinItem = isJoinWindowOpen(item);

                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          padding: '1.25rem 1.5rem',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        <div style={{ flex: '1 1 280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                              {item.subject_title || item.subjectTitle}
                            </span>
                            <span
                              className={`badge ${isCompleted ? 'badge-neutral' : 'badge-success'}`}
                              style={{
                                fontSize: '0.7rem',
                                backgroundColor: isCompleted ? '#F1F5F9' : '#DEF7EC',
                                color: isCompleted ? '#475569' : '#03543F'
                              }}
                            >
                              {isCompleted ? 'Completed' : 'Upcoming'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)', marginTop: '0.25rem' }}>
                            Student: <strong>{item.child_name || item.childName}</strong> • Mentor: <strong>{item.mentor_name || item.mentorName}</strong>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                            {formatSessionDate(item.start_time_utc || item.slot_start_utc, item.parent_timezone)} at {formatSessionTime(item.start_time_utc || item.slot_start_utc, item.parent_timezone)} ({item.parent_timezone})
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {!isCompleted && canJoinItem && (
                            <button
                              onClick={() => onJoinClass(item)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                            >
                              <Video size={14} />
                              <span>Join Class</span>
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => setSelectedDetailsBooking(item)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                            >
                              <FileText size={14} />
                              <span>View Details</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION 4: LEARNING PROGRESS (Completed Sessions) */}
            <section id="learning-progress-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className="heading-md" style={{ color: 'var(--color-dark-text)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={18} color="var(--color-primary)" />
                  <span>Learning Progress & Assessment Reports</span>
                </h2>
                {past.length > 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)' }}>
                    Completed sessions: <strong>{past.length}</strong>
                  </span>
                )}
              </div>

              {past.length === 0 ? (
                /* SECTION 6: NO COMPLETED TRIAL STATE */
                <div className="card" style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <Award size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
                    No completed sessions yet
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-muted-text)', maxWidth: '440px', margin: '0 auto' }}>
                    Once your child attends their demo class and completes their 3-question learning check, their verified score, mentor feedback, and performance report will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {past.map((item) => {
                    const lc = item.learningCheck;
                    return (
                      <div
                        key={item.id}
                        className="card"
                        style={{
                          padding: '1.25rem 1.5rem',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ flex: '1 1 280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                              {item.subject_title || item.subjectTitle}
                            </span>
                            {lc ? (
                              <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                                Learning Check: {lc.score} / {lc.totalQuestions} ({lc.percentage}%)
                              </span>
                            ) : (
                              /* SECTION 6: LEARNING CHECK NOT YET COMPLETED STATE */
                              <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 700 }}>
                                Learning Check Pending
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)', marginTop: '0.25rem' }}>
                            Student: <strong>{item.child_name || item.childName}</strong> • Mentor: <strong>{item.mentor_name || item.mentorName}</strong>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-text)', marginTop: '0.15rem' }}>
                            Completed on: {formatSessionDate(item.start_time_utc || item.slot_start_utc, item.parent_timezone)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {lc ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReviewBooking(item)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                            >
                              <span>View Result</span>
                              <ArrowRight size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedReviewBooking(item)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', color: 'var(--color-primary)' }}
                            >
                              <span>Take Learning Check</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        )}

      </div>

      {/* Profile & Account Details Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 35, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '460px',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-dark-text)', margin: 0 }}>
                Parent Account Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-muted-text)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Parent Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)', marginTop: '0.15rem' }}>{parent?.name || 'Parent'}</div>
              </div>

              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Registered Email</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)', marginTop: '0.15rem' }}>{parent?.email}</div>
              </div>

              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Account Role</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.15rem' }}>Verified Parent</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Completed Session View Details Modal */}
      {selectedDetailsBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 35, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Booking Details</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dark-text)', margin: '0.15rem 0' }}>
                  {selectedDetailsBooking.subject_title || selectedDetailsBooking.subjectTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailsBooking(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-muted-text)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Student</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedDetailsBooking.child_name || selectedDetailsBooking.childName}</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Mentor</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedDetailsBooking.mentor_name || selectedDetailsBooking.mentorName}</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatSessionDate(selectedDetailsBooking.start_time_utc || selectedDetailsBooking.slot_start_utc, selectedDetailsBooking.parent_timezone)}</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-success)' }}>Completed</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {selectedDetailsBooking.learningCheck && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReviewBooking(selectedDetailsBooking);
                    setSelectedDetailsBooking(null);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem' }}
                >
                  View Learning Result
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDetailsBooking(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Review Modal */}
      {selectedReviewBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 35, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 120,
          overflowY: 'auto',
          padding: '2rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '720px' }}>
            <PostClassLearningCheck
              bookingId={selectedReviewBooking.id}
              booking={selectedReviewBooking}
              onFinish={() => {
                setSelectedReviewBooking(null);
                fetchBookings();
              }}
              onBackToDashboard={() => {
                setSelectedReviewBooking(null);
                fetchBookings();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
