import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { DateTime } from 'luxon';
import { 
  CheckCircle2, 
  Video, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Sparkles, 
  Copy, 
  ArrowRight, 
  PlusCircle,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function Step6Confirmation({ 
  booking, 
  onNewBooking, 
  onJoinClass, 
  onGoToDashboard 
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tasteful, calm, premium short burst of confetti strictly using yellow + teal palette
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.42 },
        colors: ['#285C5E', '#FFC83D', '#173B46', '#4C7D7D', '#FFD972'],
        ticks: 140,
        gravity: 1.25,
        scalar: 0.8,
        disableForReducedMotion: true
      });
    } catch (e) {
      // ignore
    }
  }, []);

  if (!booking) return null;

  // Use the REAL booking meeting link from the backend
  const classroomLink = booking.meetingLink || booking.dummyClassLink || `/class/${booking.bookingId || booking.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(classroomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Safe formatting from existing backend normalized booking data
  const parentTz = booking.parentTime?.timezone || 'America/New_York';
  const startUtc = booking.slotStartUTC || booking.utcStart || booking.start_time_utc;
  const parentDt = startUtc ? DateTime.fromISO(startUtc, { zone: parentTz }) : null;
  const formattedDate = parentDt && parentDt.isValid 
    ? parentDt.toFormat('cccc, LLLL d, yyyy') 
    : (booking.parentTime?.formatted?.split(' at ')[0] || 'Scheduled Date');
  const formattedParentTime = parentDt && parentDt.isValid 
    ? parentDt.toFormat('h:mm a') 
    : (booking.parentTime?.formatted?.split(' at ')[1] || '4:30 PM');

  const mentorDt = startUtc ? DateTime.fromISO(startUtc, { zone: 'Asia/Kolkata' }) : null;
  const mentorTimeFormatted = mentorDt && mentorDt.isValid 
    ? mentorDt.toFormat('h:mm a') 
    : (booking.mentorTime?.localTime || '7:00 PM');

  const mentorTzDisplay = booking.mentorTime?.timezone === 'Asia/Kolkata' 
    ? 'Asia/Kolkata (IST)' 
    : (booking.mentorTime?.timezone || 'Asia/Kolkata');

  return (
    <div className="confirmation-card-animated" style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
      
      {/* Larger Success Icon with soft halo and calm stroke animation */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '4.75rem',
        height: '4.75rem',
        borderRadius: '50%',
        backgroundColor: 'var(--color-success-bg)',
        color: 'var(--color-success)',
        border: '2.5px solid #A3E5CB',
        marginBottom: '1.25rem',
        boxShadow: '0 8px 24px rgba(24, 168, 121, 0.15)'
      }} className="success-icon-glow">
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            className="animated-checkmark-circle"
            cx="32"
            cy="32"
            r="26"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            className="animated-checkmark-check"
            d="M20 33 L28 41 L44 24"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Pill Badge */}
      <div style={{ marginBottom: '0.65rem' }}>
        <span className="badge badge-teal" style={{
          padding: '0.35rem 0.95rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Sparkles size={14} color="var(--color-orange)" />
          <span>Trial Class Confirmed</span>
        </span>
      </div>

      {/* Confirmation Heading */}
      <h1 className="heading-lg" style={{ marginBottom: '0.45rem', color: 'var(--color-dark-text)' }}>
        Your trial class is confirmed!
      </h1>
      <p className="text-body" style={{ maxWidth: '520px', margin: '0 auto 2.25rem', fontSize: '0.96rem' }}>
        Your 1:1 trial session is booked. A confirmation email has been dispatched to <strong>{booking.parentEmail}</strong>.
      </p>

      {/* Main Confirmation Card */}
      <div className="card" style={{
        textAlign: 'left',
        padding: '2.25rem',
        marginBottom: '1.75rem',
        borderRadius: 'var(--radius-xl)',
        border: '1.5px solid var(--color-border)',
        boxShadow: '0 10px 30px rgba(23, 59, 70, 0.07)',
        backgroundColor: '#FFFFFF'
      }}>
        
        {/* Booking Reference Top Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Booking Reference
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.02em', marginTop: '0.1rem' }}>
              {booking.bookingId || booking.id}
            </div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem' }}>
            <ShieldCheck size={13} />
            <span>100% Free Trial</span>
          </span>
        </div>

        {/* 6 Key Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.4rem',
          marginBottom: '2rem'
        }}>
          {/* Child Name */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <User size={13} /> Child
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
              {booking.childName || booking.child_name}
            </div>
          </div>

          {/* Course */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <BookOpen size={13} /> Course
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {booking.subject?.title || booking.subjectTitle}
            </div>
          </div>

          {/* Date */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <Calendar size={13} /> Date
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {formattedDate}
            </div>
          </div>

          {/* Your Time */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <Clock size={13} /> Your Time
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
              {formattedParentTime}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', marginTop: '0.1rem' }}>
              {parentTz}
            </div>
          </div>

          {/* Mentor */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <User size={13} /> Assigned Mentor
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
              {booking.mentorTime?.mentorName || booking.mentorName}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.1rem' }}>
              {booking.mentorTime?.role || 'Dedicated Subject Mentor'}
            </div>
          </div>

          {/* Mentor's Time */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
              <Clock size={13} /> Mentor's Time
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
              {mentorTimeFormatted}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', marginTop: '0.1rem' }}>
              {mentorTzDisplay}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
              Duration
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {booking.durationMinutes || 30} minutes (1:1 Live)
            </div>
          </div>
        </div>

        {/* NOTIFICATION DELIVERY RECEIPT SECTION */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.4rem 1.6rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-bg)',
          border: '1.5px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--color-primary)' }}>
                NOTIFICATION DELIVERY
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)', marginTop: '0.15rem' }}>
                Your class link has been shared with:
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-dark-teal)' }}>
                <CheckCircle2 size={15} color="var(--color-success)" />
                <span>Parent</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-dark-teal)' }}>
                <CheckCircle2 size={15} color="var(--color-success)" />
                <span>Assigned Mentor</span>
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            {/* Parent Notification Card */}
            <div style={{
              padding: '1rem 1.2rem',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.65rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted-text)', letterSpacing: '0.04em' }}>
                    Parent Notification
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem' }}>
                    Sent
                  </span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)', wordBreak: 'break-all' }}>
                  {booking.parentEmail}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-dark-teal)', fontWeight: 600 }}>
                <Check size={14} color="var(--color-success)" strokeWidth={3} />
                <span>Class link sent</span>
              </div>
            </div>

            {/* Mentor Notification Card */}
            <div style={{
              padding: '1rem 1.2rem',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.65rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted-text)', letterSpacing: '0.04em' }}>
                    Mentor Notification
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem' }}>
                    Sent
                  </span>
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)', wordBreak: 'break-all' }}>
                  {booking.mentorEmail || booking.mentor_email || booking.notificationDelivery?.mentor?.recipient || `${(booking.mentorTime?.mentorName || booking.mentorName || 'mentor').toLowerCase().replace(/[^a-z0-9]+/g, '.')}@codeyoung.com`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', marginTop: '0.15rem' }}>
                  Mentor: {booking.mentorTime?.mentorName || booking.mentorName || 'Assigned Mentor'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-dark-teal)', fontWeight: 600 }}>
                <Check size={14} color="var(--color-success)" strokeWidth={3} />
                <span>Class link sent</span>
              </div>
            </div>
          </div>
        </div>

        {/* YOUR CLASSROOM - Dedicated Live Access Area */}
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-primary-light)',
          border: '1.5px solid rgba(40, 92, 94, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Video size={13} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
                  YOUR CLASSROOM
                </span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                  Join your live 1:1 trial session with {booking.mentorTime?.mentorName || 'your mentor'}
                </div>
              </div>
            </div>
          </div>

          {/* Link box with Copy Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            padding: '0.7rem 0.95rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            gap: '0.75rem'
          }}>
            <span style={{
              fontSize: '0.86rem',
              fontFamily: 'monospace',
              color: 'var(--color-dark-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {classroomLink}
            </span>
            <button
              onClick={copyLink}
              title="Copy classroom link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: copied ? 'var(--color-success)' : 'var(--color-primary)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: copied ? 'var(--color-success-bg)' : 'var(--color-primary-light)',
                flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Primary Action Button: Join Class */}
          <button
            onClick={() => onJoinClass && onJoinClass(booking)}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontSize: '1.02rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(255, 200, 61, 0.4)'
            }}
          >
            <Video size={18} />
            <span>Join Class</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>

      {/* Next Actions: Secondary & Optional */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        {onGoToDashboard && (
          <button
            onClick={() => onGoToDashboard(booking)}
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem', fontWeight: 600 }}
          >
            <span>Go to My Dashboard</span>
            <ArrowRight size={16} />
          </button>
        )}

        <button
          onClick={onNewBooking}
          className="btn btn-secondary"
          style={{ padding: '0.8rem 1.4rem', fontSize: '0.92rem', color: 'var(--color-muted-text)' }}
        >
          <PlusCircle size={16} />
          <span>Book Another Trial</span>
        </button>
      </div>

    </div>
  );
}
