import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  ExternalLink, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  BookOpen, 
  Sparkles, 
  Video,
  Copy,
  PlusCircle
} from 'lucide-react';

export default function Step6Confirmation({ booking, onNewBooking, onJoinClass }) {
  useEffect(() => {
    // Fire subtle confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  }, []);

  if (!booking) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(booking.dummyClassLink);
    alert('Dummy live class link copied to clipboard!');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
      {/* Success Badge */}
      <div style={{
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        backgroundColor: 'var(--color-success-bg)',
        color: 'var(--color-success)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        border: '2px solid #A3E5CB'
      }}>
        <CheckCircle2 size={36} />
      </div>

      <h2 className="heading-lg" style={{ marginBottom: '0.5rem' }}>
        Your Trial Class is Confirmed!
      </h2>
      <p className="text-body" style={{ marginBottom: '2rem' }}>
        We are excited to welcome <strong>{booking.childName}</strong>. A confirmation email has been dispatched to <strong>{booking.parentEmail}</strong>.
      </p>

      {/* Main Confirmation Card */}
      <div className="card" style={{ textAlign: 'left', padding: '2rem', marginBottom: '2rem' }}>
        {/* Booking Ref Number */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 700 }}>
              Booking Reference
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {booking.bookingId}
            </div>
          </div>
          <span className="badge badge-success">Confirmed</span>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BookOpen size={13} /> Course
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {booking.subject.title}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={13} /> Mentor
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {booking.mentorTime.mentorName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} /> Your Time ({booking.parentTime.timezone})
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {booking.parentTime.formatted}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} /> Mentor Time ({booking.mentorTime.timezone})
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              {booking.mentorTime.formatted}
            </div>
          </div>
        </div>

        {/* Dummy Live Class Link Section */}
        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-primary-light)',
          border: '1.5px dashed var(--color-primary)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Video size={18} color="var(--color-primary)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-dark-teal)' }}>
              Dummy Live Classroom Link
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--color-dark-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {booking.dummyClassLink}
            </span>
            <button
              onClick={copyLink}
              title="Copy class link"
              style={{ color: 'var(--color-primary)', padding: '0.2rem' }}
            >
              <Copy size={16} />
            </button>
          </div>

          <p className="text-xs" style={{ marginTop: '0.5rem', color: 'var(--color-muted-text)' }}>
            This simulated link connects both parent and mentor to the same virtual classroom.
          </p>
        </div>

        {/* Simulated Notifications Panel */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface-hover)',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mail size={14} color="var(--color-primary)" />
            <span>Simulated Notification Log:</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', lineHeight: 1.5 }}>
            • Confirmation dispatched to parent at <code>{booking.parentEmail}</code><br />
            • Demo calendar invitation dispatched to mentor <code>{booking.mentorTime.mentorName}</code>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => onJoinClass(booking)}
          className="btn btn-primary"
          style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}
        >
          <Video size={18} />
          <span>Launch Dummy Classroom</span>
          <ExternalLink size={16} />
        </button>

        <button
          onClick={onNewBooking}
          className="btn btn-secondary"
          style={{ padding: '0.85rem 1.5rem' }}
        >
          <PlusCircle size={16} />
          <span>Book Another Session</span>
        </button>
      </div>
    </div>
  );
}
