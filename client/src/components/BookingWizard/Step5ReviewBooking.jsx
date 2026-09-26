import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Globe, 
  User, 
  Mail, 
  BookOpen, 
  AlertCircle, 
  ArrowLeft, 
  Check, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api.js';

export default function Step5ReviewBooking({
  formData,
  onBookingSuccess,
  onBack,
  onModifySlot
}) {
  const {
    parentName,
    parentEmail,
    childName,
    subject,
    parentTimezone,
    selectedSlot
  } = formData;

  const [submitting, setSubmitting] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Formatted date string in parent timezone
  const parentDt = DateTime.fromISO(selectedSlot.utcStart, { zone: parentTimezone });
  const formattedParentDate = parentDt.toFormat('cccc, LLLL d, yyyy');

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorState(null);

    try {
      const response = await api.createBooking({
        parentName,
        parentEmail,
        childName,
        subjectId: subject.id,
        parentTimezone,
        utcStartIso: selectedSlot.utcStart
      });

      if (response.success && response.data) {
        onBookingSuccess(response.data);
      } else {
        throw new Error('Booking could not be finalized.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorState({
        code: err.code || 'BOOKING_ERROR',
        message: err.message || 'We could not confirm your booking. Please try another time.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span className="badge badge-teal" style={{ marginBottom: '0.5rem' }}>Final Review</span>
        <h2 className="heading-md">Review Trial Class Details</h2>
        <p className="text-body" style={{ fontSize: '0.9rem' }}>
          Please verify your session information before confirming your free 1:1 trial appointment.
        </p>
      </div>

      {/* Error state display if final availability check fails */}
      {errorState && (
        <div className="alert alert-error" style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
            <AlertCircle size={18} />
            <span>
              {errorState.code === 'MENTOR_DAILY_LIMIT_REACHED' && 'Mentors Reached Daily Limit'}
              {errorState.code === 'SLOT_UNAVAILABLE' && 'Time Slot No Longer Available'}
              {errorState.code === 'NO_MENTOR_AVAILABLE' && 'No Mentor Available'}
              {errorState.code === 'DAILY_CAPACITY_REACHED' && 'Daily System Capacity Full'}
              {!['MENTOR_DAILY_LIMIT_REACHED', 'SLOT_UNAVAILABLE', 'NO_MENTOR_AVAILABLE', 'DAILY_CAPACITY_REACHED'].includes(errorState.code) && 'Booking Error'}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            {errorState.message}
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onModifySlot}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', backgroundColor: '#FFFFFF', borderColor: '#F5C6C6' }}
            >
              Choose Another Slot or Date
            </button>
          </div>
        </div>
      )}

      {/* Summary Review Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        {/* Child and Course banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                Trial Course
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                {subject.title}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
              Student
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {childName}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Date & Local Time */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Calendar size={18} color="var(--color-primary)" style={{ marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>Date</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                {formattedParentDate}
              </div>
            </div>
          </div>

          {/* Time & Timezone */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <Clock size={18} color="var(--color-primary)" style={{ marginTop: '0.15rem' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>Your Local Time</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                {selectedSlot.parentLocalTime}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>
                Timezone: {parentTimezone}
              </div>
            </div>
          </div>

          {/* Assigned Mentor & Mentor's local time */}
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-hover)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                  Assigned Mentor:
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {selectedSlot.candidateMentor?.name || 'Dedicated Subject Mentor'}
                </span>
              </div>
              <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>1:1 Live</span>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', paddingLeft: '1.5rem' }}>
              Mentor's Local Time: <strong>{selectedSlot.mentorLocalDate} at {selectedSlot.mentorLocalTime} (IST)</strong>
            </div>
          </div>

          {/* Duration & Parent details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>Parent Contact</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                {parentName} ({parentEmail})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>Session Duration</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                30 Minutes (Free Demo)
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-success-bg)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--color-success)'
        }}>
          <ShieldCheck size={16} />
          <span>No credit card needed • Simulated email confirmation dispatched upon booking</span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          <span>Modify Time</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="btn btn-primary"
          style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
        >
          {submitting ? (
            <>
              <RefreshCw size={18} className="spin" />
              <span>Verifying & Confirming...</span>
            </>
          ) : (
            <>
              <Check size={18} />
              <span>Confirm Trial Class</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
