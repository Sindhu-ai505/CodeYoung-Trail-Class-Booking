import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Sparkles, 
  LogOut, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  AlertCircle, 
  RefreshCw,
  BookOpen,
  ArrowRight,
  Globe,
  Bell,
  GraduationCap,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { DateTime } from 'luxon';
import { api } from '../services/api.js';

export default function MentorDashboard({ 
  mentor, 
  onLogout, 
  onJoinClass 
}) {
  const [sessionsData, setSessionsData] = useState({ upcoming: [], past: [], cancelled: [], all: [] });
  const [todayCapacity, setTodayCapacity] = useState({
    date: '',
    bookedToday: 0,
    maxDailyClasses: 2,
    remainingClassesToday: 2,
    isDailyLimitReached: false,
    statusLabel: 'Available'
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getMentorBookings();
      if (res.success && res.data) {
        setSessionsData(res.data);
        if (res.todayCapacity || res.data.todayCapacity) {
          setTodayCapacity(res.todayCapacity || res.data.todayCapacity);
        }
      } else {
        throw new Error("Unable to retrieve assigned trial classes.");
      }
    } catch (err) {
      console.error('Error fetching mentor bookings:', err);
      setErrorMessage("We couldn't load your mentor schedule right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [mentor?.id]);

  const handleCopyLink = (link, bookingId) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(bookingId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatSessionDate = (utcIso, mentorTz) => {
    try {
      const dt = DateTime.fromISO(utcIso, { zone: mentorTz || 'Asia/Kolkata' });
      return dt.toFormat('cccc, LLLL d, yyyy');
    } catch {
      return 'Scheduled Date';
    }
  };

  const formatSessionTime = (utcIso, timezone) => {
    try {
      const dt = DateTime.fromISO(utcIso, { zone: timezone || 'Asia/Kolkata' });
      return dt.toFormat('h:mm a');
    } catch {
      return '';
    }
  };

  const { upcoming, past, all } = sessionsData;
  const primaryUpcoming = upcoming.length > 0 ? upcoming[0] : null;
  const secondaryUpcoming = upcoming.length > 1 ? upcoming.slice(1) : [];

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: 'calc(100vh - 4.5rem)', padding: '2.5rem 0 4rem' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        
        {/* Mentor Workspace Top Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img 
              src="/assets/logo.png" 
              alt="CodeYoung Logo" 
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                <GraduationCap size={15} />
                <span>Mentor Workspace</span>
              </div>
              <h1 className="heading-lg" style={{ color: 'var(--color-dark-text)' }}>
                Welcome, {mentor?.name || 'Mentor'}
              </h1>
              <p className="text-body" style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)' }}>
                <span>{mentor?.specialization || 'STEM Coach'}</span>
                <span style={{ margin: '0 0.5rem' }}>•</span>
                <span>{mentor?.email}</span>
                <span style={{ margin: '0 0.5rem' }}>•</span>
                <span>IST (Asia/Kolkata)</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchBookings}
              className="btn btn-secondary"
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Refresh assigned bookings"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onLogout}
              className="btn btn-secondary"
              style={{
                padding: '0.6rem 1rem',
                fontSize: '0.86rem',
                color: 'var(--color-muted-text)',
                borderColor: 'var(--color-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Sign out of your mentor account"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
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
              Loading your mentor schedule...
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)' }}>
              Retrieving assigned trial classes
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMessage && (
          <div className="alert alert-error" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>{errorMessage}</div>
            <button onClick={fetchBookings} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              Try Again
            </button>
          </div>
        )}

        {/* Content Area */}
        {!loading && !errorMessage && (
          <div>
            {/* TODAY'S TRIAL CAPACITY - Operational Indicator (Section 6) */}
            <div style={{
              marginBottom: '2rem',
              padding: '1.35rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#FFFFFF',
              border: todayCapacity.isDailyLimitReached ? '1px solid #FCD34D' : '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: todayCapacity.isDailyLimitReached ? '#FEF3C7' : 'var(--color-primary-light)',
                  color: todayCapacity.isDailyLimitReached ? '#B45309' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Clock size={24} />
                </div>

                <div>
                  <div style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-muted-text)',
                    marginBottom: '0.2rem'
                  }}>
                    Today's Trial Capacity
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                      {todayCapacity.bookedToday} / {todayCapacity.maxDailyClasses}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
                      sessions booked
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', marginTop: '0.15rem' }}>
                    Maximum 2 trial classes per mentor per day (IST) • Date: <strong>{todayCapacity.date || 'Today'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: todayCapacity.isDailyLimitReached ? '#FEF3C7' : 'var(--color-primary-light)',
                  color: todayCapacity.isDailyLimitReached ? '#92400E' : 'var(--color-primary)',
                  border: todayCapacity.isDailyLimitReached ? '1px solid #FCD34D' : '1px solid transparent'
                }}>
                  {todayCapacity.isDailyLimitReached
                    ? 'Daily capacity reached'
                    : todayCapacity.bookedToday === 1
                    ? '1 session remaining'
                    : 'Available • 2 sessions remaining'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>
                  {todayCapacity.isDailyLimitReached
                    ? 'Cannot accept further demo bookings today'
                    : 'Open for 1:1 demo class scheduling'}
                </span>
              </div>
            </div>

            {/* REAL MENTOR NOTIFICATION AREA / CARD (Section 6) */}
            {primaryUpcoming && (
              <div style={{
                marginBottom: '2rem',
                padding: '1.1rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FFFFFF',
                border: '1px solid #C8E3E3',
                borderLeft: '5px solid var(--color-primary)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-primary)' }}>
                        New Trial Class Notification
                      </span>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
                        Assigned to you
                      </span>
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                      <span>Student: {primaryUpcoming.child_name || primaryUpcoming.childName}</span>
                      <span style={{ margin: '0 0.5rem', color: 'var(--color-muted-text)' }}>•</span>
                      <span>Course: {primaryUpcoming.subject_title || primaryUpcoming.subjectTitle}</span>
                      <span style={{ margin: '0 0.5rem', color: 'var(--color-muted-text)' }}>•</span>
                      <span style={{ color: 'var(--color-primary)' }}>
                        {primaryUpcoming.mentor_local_time || primaryUpcoming.mentorLocalTime || formatSessionTime(primaryUpcoming.start_time_utc, 'Asia/Kolkata')} IST
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onJoinClass(primaryUpcoming)}
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                >
                  <Video size={15} />
                  <span>Join Class</span>
                </button>
              </div>
            )}

            {/* UPCOMING TRIAL SECTION (Section 5) */}
            {primaryUpcoming ? (
              <section style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 className="heading-md" style={{ color: 'var(--color-dark-text)' }}>
                      Upcoming Trial Session
                    </h2>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      1:1 Live
                    </span>
                  </div>

                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={13} />
                    <span>Confirmed</span>
                  </span>
                </div>

                {/* Primary Upcoming Hero Card */}
                <div className="card" style={{
                  padding: '2.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Accent bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: 'var(--color-primary)'
                  }} />

                  {/* Header: Course Title & Student Details */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '3.25rem',
                        height: '3.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Course Curriculum
                        </span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-dark-text)', letterSpacing: '-0.01em' }}>
                          {primaryUpcoming.subject_title || primaryUpcoming.subjectTitle}
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)' }}>
                          Student: <strong style={{ color: 'var(--color-dark-text)' }}>{primaryUpcoming.child_name || primaryUpcoming.childName}</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        Booking Reference
                      </span>
                      <span style={{ fontSize: '0.92rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                        #{primaryUpcoming.id || primaryUpcoming.bookingId}
                      </span>
                    </div>
                  </div>

                  {/* Class Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    {/* Student & Parent Info */}
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <User size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Student & Parent Contact
                        </span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.2rem' }}>
                        {primaryUpcoming.child_name || primaryUpcoming.childName}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
                        Parent: <strong>{primaryUpcoming.parent_name || primaryUpcoming.parentName || 'Parent'}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted-text)' }}>
                        Email: {primaryUpcoming.parent_email || primaryUpcoming.parentEmail}
                      </div>
                    </div>

                    {/* Date & Duration */}
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Calendar size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Scheduled Date
                        </span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.2rem' }}>
                        {formatSessionDate(primaryUpcoming.start_time_utc, 'Asia/Kolkata')}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
                        Duration: <strong>{primaryUpcoming.duration_minutes || 30} minutes</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dual Timezone Breakdown (Preserves IANA identifiers for DST compliance) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    border: '1px solid #D5E5E5',
                    marginBottom: '1.75rem'
                  }}>
                    {/* Mentor Local Time (Asia/Kolkata) */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <Clock size={15} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-dark-teal)', textTransform: 'uppercase' }}>
                          Your Local Time (Mentor)
                        </span>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                        {primaryUpcoming.mentor_local_time || primaryUpcoming.mentorLocalTime || formatSessionTime(primaryUpcoming.start_time_utc, 'Asia/Kolkata')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {primaryUpcoming.mentor_timezone || 'Asia/Kolkata'} (IST)
                      </div>
                    </div>

                    {/* Parent Local Time */}
                    <div style={{ borderLeft: '1px dashed #BFD7D7', paddingLeft: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <Globe size={15} color="var(--color-muted-text)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                          Parent's Local Time
                        </span>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-muted-text)' }}>
                        {formatSessionTime(primaryUpcoming.start_time_utc, primaryUpcoming.parent_timezone)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>
                        {primaryUpcoming.parent_timezone || 'Parent Timezone'}
                      </div>
                    </div>
                  </div>

                  {/* Classroom Link & Primary Join CTA */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--color-surface-hover)',
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        width: '100%',
                        maxWidth: '380px',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-dark-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {primaryUpcoming.meeting_link || primaryUpcoming.dummy_class_link}
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
                            cursor: 'pointer'
                          }}
                          title="Copy meeting link"
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

                    {/* Primary CTA: "Join Class" (opens exact same meeting link) */}
                    <button
                      onClick={() => onJoinClass(primaryUpcoming)}
                      className="btn btn-primary"
                      style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}
                    >
                      <Video size={18} />
                      <span>Join Class</span>
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              /* No Upcoming Trials State */
              <div style={{
                textAlign: 'center',
                padding: '3.5rem 2rem',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-surface-hover)',
                  color: 'var(--color-muted-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <Calendar size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
                  No Upcoming Trial Classes Assigned
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-text)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                  When parents book a 1:1 demo class matching your courses ({mentor?.specialization || 'STEM'}) and schedule, it will automatically appear here.
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700
                }}>
                  <Clock size={14} />
                  <span>Teaching Window: 10:00 AM – 8:00 PM IST • Max 2 classes/day</span>
                </div>
              </div>
            )}

            {/* Additional Assigned Upcoming Trials */}
            {secondaryUpcoming.length > 0 && (
              <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-muted-text)', marginBottom: '1rem' }}>
                  Additional Upcoming Classes ({secondaryUpcoming.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {secondaryUpcoming.map((item) => (
                    <div
                      key={item.id}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                            {item.subject_title || item.subjectTitle}
                          </h4>
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
                            Student: <strong>{item.child_name || item.childName}</strong> • {formatSessionDate(item.start_time_utc, 'Asia/Kolkata')} • {item.mentor_local_time || item.mentorLocalTime || formatSessionTime(item.start_time_utc, 'Asia/Kolkata')} IST
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          onClick={() => handleCopyLink(item.meeting_link || item.dummy_class_link, item.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                        >
                          <Copy size={13} />
                          <span>{copiedId === item.id ? 'Copied' : 'Link'}</span>
                        </button>

                        <button
                          onClick={() => onJoinClass(item)}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Video size={14} />
                          <span>Join</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Completed / History Section */}
            {past.length > 0 && (
              <section style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-muted-text)', marginBottom: '1rem' }}>
                  Past Classes History ({past.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {past.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        opacity: 0.85
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                            {item.subject_title || item.subjectTitle}
                          </span>
                          <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#475569', fontSize: '0.7rem' }}>
                            Trial completed
                          </span>
                          {item.learningCheck && (
                            <span className="badge badge-teal" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                              Learning check: {item.learningCheck.score} / {item.learningCheck.totalQuestions}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', marginTop: '0.2rem' }}>
                          Student: {item.child_name || item.childName} • {formatSessionDate(item.start_time_utc, 'Asia/Kolkata')} • #{item.id}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
