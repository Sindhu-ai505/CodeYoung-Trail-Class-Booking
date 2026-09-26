import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { 
  Globe, 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  User, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { POPULAR_TIMEZONES, getTimezoneLabel } from '../../utils/timezones.js';
import { api } from '../../services/api.js';

export default function Step4DateTimezone({ 
  subject, 
  initialTimezone, 
  initialDate, 
  initialSlot, 
  onNext, 
  onBack 
}) {
  const [parentTimezone, setParentTimezone] = useState(initialTimezone || 'America/New_York');
  const [selectedDate, setSelectedDate] = useState(initialDate || DateTime.now().setZone(parentTimezone).toFormat('yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate next 10 selectable dates based on parent's local timezone
  const dateOptions = [];
  const baseDate = DateTime.now().setZone(parentTimezone);
  for (let i = 0; i < 10; i++) {
    const d = baseDate.plus({ days: i });
    dateOptions.push({
      dateStr: d.toFormat('yyyy-MM-dd'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toFormat('ccc'),
      dayNumber: d.toFormat('d'),
      monthName: d.toFormat('LLL')
    });
  }

  // Load available slots from backend whenever subject, date, or parentTimezone changes
  useEffect(() => {
    let isCancelled = false;
    async function loadSlots() {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const response = await api.getAvailability({
          subjectId: subject.id,
          date: selectedDate,
          parentTimezone
        });

        if (!isCancelled) {
          if (response.success && response.data) {
            setSlots(response.data.slots || []);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load slots:', err);
          setError(err.message || 'Unable to load available slots for this date.');
          setSlots([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    if (subject?.id && selectedDate && parentTimezone) {
      loadSlots();
    }

    return () => {
      isCancelled = true;
    };
  }, [subject?.id, selectedDate, parentTimezone]);

  const handleContinue = () => {
    if (!selectedSlot) return;
    onNext({
      parentTimezone,
      selectedDate,
      selectedSlot
    });
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>
          Select Date & Local Time Slot
        </h2>
        <p className="text-body" style={{ fontSize: '0.9rem' }}>
          All times are automatically converted to your personal timezone with complete Daylight Saving Time awareness.
        </p>
      </div>

      {/* Timezone Selector Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.75rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                Your Timezone
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                {getTimezoneLabel(parentTimezone)}
              </div>
            </div>
          </div>

          <div style={{ minWidth: '260px' }}>
            <select
              className="form-input"
              value={parentTimezone}
              onChange={(e) => setParentTimezone(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            >
              {POPULAR_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Carousel Buttons */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <CalendarIcon size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
            Choose Date (Your Local Calendar)
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.65rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'thin'
        }}>
          {dateOptions.map(opt => {
            const isSelected = selectedDate === opt.dateStr;
            return (
              <button
                key={opt.dateStr}
                type="button"
                onClick={() => setSelectedDate(opt.dateStr)}
                style={{
                  flex: '0 0 auto',
                  minWidth: '78px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--color-dark-text)',
                  border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  boxShadow: isSelected ? '0 4px 10px rgba(49, 95, 97, 0.2)' : 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: isSelected ? 0.9 : 0.65, textTransform: 'uppercase' }}>
                  {opt.dayName}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0' }}>
                  {opt.dayNumber}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: isSelected ? 0.9 : 0.65 }}>
                  {opt.monthName}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--color-primary)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              Available Local Time Slots
            </span>
          </div>

          <span className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
            Each slot is 30 mins • 1:1 Live
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)'
          }}>
            <RefreshCw size={24} className="spin" color="var(--color-primary)" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p className="text-sm">Finding available mentors in India (Asia/Kolkata)...</p>
          </div>
        )}

        {/* Error / Empty State */}
        {!loading && error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600 }}>We couldn't load available times.</div>
              <div style={{ fontSize: '0.85rem' }}>{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && slots.length === 0 && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)'
          }}>
            <AlertCircle size={32} color="var(--color-error)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
              No mentors available for this date
            </h3>
            <p className="text-body" style={{ maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.88rem' }}>
              All qualified mentors for <strong>{subject.title}</strong> have either reached their maximum limit of 2 demo classes for this day or are outside operational hours.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              {dateOptions[1] && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(dateOptions[1].dateStr)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  Check Tomorrow's Slots
                </button>
              )}
            </div>
          </div>
        )}

        {/* Slots Grid */}
        {!loading && slots.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.85rem'
          }}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.utcStart === slot.utcStart;
              return (
                <div
                  key={slot.utcStart}
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    cursor: 'pointer',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 4px 12px rgba(49, 95, 97, 0.15)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                      {slot.parentLocalTime}
                    </span>
                    <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                      30 min
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', marginBottom: '0.5rem' }}>
                    Mentor's time: <strong>{slot.mentorLocalTime} (IST)</strong>
                  </div>

                  {slot.candidateMentor && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.75rem',
                      color: 'var(--color-primary)',
                      paddingTop: '0.4rem',
                      borderTop: '1px solid rgba(0,0,0,0.06)'
                    }}>
                      <User size={12} />
                      <span style={{ fontWeight: 600 }}>{slot.candidateMentor.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Slot & Assigned Mentor Callout */}
        {selectedSlot && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 4px 14px rgba(49, 95, 97, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.15rem',
                flexShrink: 0
              }}>
                {selectedSlot.candidateMentor?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
                  Assigned Trial Mentor for {selectedSlot.parentLocalTime}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                  {selectedSlot.candidateMentor?.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
                  {selectedSlot.candidateMentor?.role} • Timezone: Asia/Kolkata ({selectedSlot.mentorLocalTime} IST)
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>
                ✓ Mentor Available
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', marginTop: '0.35rem' }}>
                {selectedSlot.availableMentorCount} qualified mentor{selectedSlot.availableMentorCount > 1 ? 's' : ''} on duty
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          <span>Course Details</span>
        </button>

        <button
          type="button"
          disabled={!selectedSlot}
          onClick={handleContinue}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.75rem' }}
        >
          <span>Review Booking</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
