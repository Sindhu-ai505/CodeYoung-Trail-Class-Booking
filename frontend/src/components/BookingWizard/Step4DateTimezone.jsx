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
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  POPULAR_TIMEZONES, 
  getTimezoneLabel, 
  BOOKING_WINDOW_DAYS, 
  generateBookingDateOptions, 
  getBookingWindowBounds,
  isDateWithinBookingWindow
} from '../../utils/timezones.js';
import { api } from '../../services/api.js';
import BookingCalendar from './BookingCalendar.jsx';
import MentorConstellation from '../MentorConstellation.jsx';

export default function Step4DateTimezone({ 
  subject, 
  mentors = [],
  initialTimezone, 
  initialDate, 
  initialSlot, 
  onDateChange,
  onNext, 
  onBack 
}) {
  const [allMentors, setAllMentors] = useState(mentors);

  useEffect(() => {
    if (mentors && mentors.length > 0) {
      setAllMentors(mentors);
    } else {
      api.getMentors().then(res => {
        if (res.success && res.data) {
          setAllMentors(res.data);
        }
      }).catch(() => {});
    }
  }, [mentors]);

  const [parentTimezone, setParentTimezone] = useState(initialTimezone || 'America/New_York');
  const [selectedDate, setSelectedDate] = useState(() => {
    const tz = initialTimezone || 'America/New_York';
    if (initialDate && isDateWithinBookingWindow(initialDate, tz)) {
      return initialDate;
    }
    return DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');
  });
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot || null);
  const [subjectMentorsCapacity, setSubjectMentorsCapacity] = useState([]);
  const [allSubjectMentorsFull, setAllSubjectMentorsFull] = useState(false);
  const [noAvailabilityReason, setNoAvailabilityReason] = useState(null);
  const [noAvailabilityMessage, setNoAvailabilityMessage] = useState(null);
  const [availabilityMeta, setAvailabilityMeta] = useState(null);
  const [confirmedNoSlotsDates, setConfirmedNoSlotsDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMatchingMentor, setIsMatchingMentor] = useState(false);
  const [error, setError] = useState(null);

  // Safely resolve subject identifier and display title
  const resolvedSubjectId = subject?.id || (typeof subject === 'string' ? subject : null);
  const resolvedSubjectTitle = subject?.title || (typeof subject === 'string' ? subject : 'Trial Course');

  // Generate complete rolling booking window options (Today through next 90 days)
  const dateOptions = generateBookingDateOptions(parentTimezone);

  // Check whether the currently selected date is strictly within the allowed booking window
  const isDateValid = Boolean(selectedDate && isDateWithinBookingWindow(selectedDate, parentTimezone));

  // Load available slots from backend whenever subject, date, or parentTimezone changes
  const loadSlots = async () => {
    if (!resolvedSubjectId) {
      setError('Please select a course to check mentor availability.');
      setSlots([]);
      return;
    }

    if (!selectedDate || !isDateWithinBookingWindow(selectedDate, parentTimezone)) {
      setLoading(false);
      setSlots([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedSlot(null);

    try {
      const response = await api.getAvailability({
        subjectId: resolvedSubjectId,
        date: selectedDate,
        parentTimezone
      });

      if (response && response.success && response.data) {
        const returnedSlots = response.data.slots || [];
        setSlots(returnedSlots);
        setSubjectMentorsCapacity(response.data.subjectMentorsCapacity || []);
        setAllSubjectMentorsFull(Boolean(response.data.allSubjectMentorsFull));
        setNoAvailabilityReason(response.data.noAvailabilityReason || null);
        setNoAvailabilityMessage(response.data.noAvailabilityMessage || null);
        setAvailabilityMeta({
          dailyCapacity: response.data.dailyCapacity ?? 20,
          dateBookingsCount: response.data.dateBookingsCount ?? 0,
          capacityRemainingOnDate: response.data.capacityRemainingOnDate ?? 20,
          isToday: response.data.isToday,
          formattedDate: response.data.formattedDate,
          dateLabel: response.data.dateLabel,
          availabilityLabel: response.data.availabilityLabel
        });

        if (returnedSlots.length === 0) {
          setConfirmedNoSlotsDates(prev => ({ ...prev, [selectedDate]: true }));
        } else {
          setConfirmedNoSlotsDates(prev => {
            if (prev[selectedDate]) {
              const next = { ...prev };
              delete next[selectedDate];
              return next;
            }
            return prev;
          });
        }
      } else {
        throw new Error(response?.message || 'Unable to load availability. Please try again.');
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setError(err.message || 'Unable to load availability. Please try again.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (resolvedSubjectId && selectedDate && parentTimezone) {
      loadSlots();
    }
    return () => {
      isCancelled = true;
    };
  }, [resolvedSubjectId, selectedDate, parentTimezone]);

  const handleDateClick = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    if (onDateChange) {
      onDateChange(dateStr);
    }
  };

  const handleTimezoneChange = (newTz) => {
    setParentTimezone(newTz);
    setSelectedSlot(null);
    // If selectedDate falls outside the valid booking window in the new timezone, adjust to today in that timezone
    if (!isDateWithinBookingWindow(selectedDate, newTz)) {
      const newToday = DateTime.now().setZone(newTz).toFormat('yyyy-MM-dd');
      setSelectedDate(newToday);
      if (onDateChange) {
        onDateChange(newToday);
      }
    }
  };

  const handleSelectSlot = (slot) => {
    if (!slot) return;
    if (selectedSlot?.utcStart === slot.utcStart) return;
    setIsMatchingMentor(true);
    setSelectedSlot(null);

    // Short, professional matching state transition (400ms)
    setTimeout(() => {
      setSelectedSlot(slot);
      setIsMatchingMentor(false);
    }, 400);
  };

  const handleContinue = () => {
    if (!selectedSlot) return;
    onNext({
      parentTimezone,
      selectedDate,
      selectedSlot
    });
  };

  // Determine dynamic date-scoped availability metrics and labels
  const isDateToday = availabilityMeta !== null 
    ? availabilityMeta.isToday 
    : (selectedDate === DateTime.now().setZone(parentTimezone).toFormat('yyyy-MM-dd'));

  const formattedDateLabel = availabilityMeta?.formattedDate 
    || (selectedDate ? DateTime.fromISO(selectedDate).toFormat('MMMM d') : 'Date');

  const availabilityHeading = isDateToday ? "Today's Availability" : `${formattedDateLabel} Availability`;

  const remainingSlotsCount = availabilityMeta 
    ? availabilityMeta.capacityRemainingOnDate 
    : 20;

  const bookedSlotsCount = availabilityMeta 
    ? availabilityMeta.dateBookingsCount 
    : 0;

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
              onChange={(e) => handleTimezoneChange(e.target.value)}
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

      {/* Step 1 in UX Flow: Select a Date with Proper Month Calendar (Part 2) */}
      <BookingCalendar
        selectedDate={selectedDate}
        onSelectDate={handleDateClick}
        parentTimezone={parentTimezone}
        confirmedNoSlotsDates={confirmedNoSlotsDates}
      />

      {/* Step 2 in UX Flow: Dynamic Availability Summary Banner (Date-Specific) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--color-primary-light)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="pulsing-dot" />
          <span style={{ fontSize: '0.92rem', color: 'var(--color-dark-text)' }}>
            <strong>{availabilityHeading}:</strong>{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{remainingSlotsCount} slots remaining</strong>{' '}
            <span style={{ color: 'var(--color-muted-text)' }}>({bookedSlotsCount}/20 booked)</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="badge badge-teal" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
            20 Daily Capacity
          </span>
        </div>
      </div>

      {/* Mentor Automatic Matching & Capacity Info Banner (Section 16) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.15rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        marginBottom: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
        fontSize: '0.85rem',
        color: 'var(--color-dark-text)'
      }}>
        <Sparkles size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Your mentor will be matched automatically.</strong>{' '}
          <span style={{ color: 'var(--color-muted-text)' }}>We match you with an available mentor based on your course, schedule, timezone, and current availability.</span>
        </div>
      </div>

      {/* Step 3 in UX Flow: Slots Section */}
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

        {/* State A: Loading State */}
        {loading && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <RefreshCw size={26} className="spin" color="var(--color-primary)" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
              Checking available times…
            </h3>
            <p className="text-body" style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)' }}>
              Matching live 1:1 demo slots with mentors in India (Asia/Kolkata)...
            </p>
          </div>
        )}

        {/* State E: Invalid Date State */}
        {!loading && !isDateValid && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <AlertCircle size={34} color="var(--color-error)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
              Please select a valid booking date.
            </h3>
            <p className="text-body" style={{ fontSize: '0.88rem', color: 'var(--color-muted-text)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
              Classes can be booked between today and the next {BOOKING_WINDOW_DAYS} days in your local timezone ({getTimezoneLabel(parentTimezone)}).
            </p>
            {dateOptions[0] && (
              <button
                type="button"
                onClick={() => handleDateClick(dateOptions[0].dateStr)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
              >
                Select Today ({dateOptions[0].dayName}, {dateOptions[0].monthName} {dateOptions[0].dayNumber})
              </button>
            )}
          </div>
        )}

        {/* State D: API / Server Error State */}
        {!loading && isDateValid && error && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #FECACA',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <AlertCircle size={34} color="var(--color-error)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
              Unable to load availability. Please try again.
            </h3>
            <p className="text-body" style={{ fontSize: '0.85rem', color: 'var(--color-muted-text)', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => loadSlots()}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', gap: '0.4rem', margin: '0 auto', display: 'inline-flex', alignItems: 'center' }}
            >
              <RefreshCw size={14} />
              <span>Retry Availability</span>
            </button>
          </div>
        )}

        {/* State C: Real Backend NO MENTOR / NO SLOTS AVAILABLE State (Section 10) */}
        {!loading && isDateValid && !error && slots.length === 0 && (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <AlertCircle size={36} color={allSubjectMentorsFull ? '#D97706' : 'var(--color-primary)'} style={{ margin: '0 auto 0.85rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-dark-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              NO MENTOR AVAILABLE
            </h3>
            <p className="text-body" style={{ maxWidth: '520px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
              {allSubjectMentorsFull || noAvailabilityReason === 'MENTOR_DAILY_LIMIT_REACHED'
                ? 'All compatible mentors have reached their daily limit of 2 trial sessions for this date.'
                : 'No compatible mentor is available for the selected course, date, and time.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const nextOpt = dateOptions.find(d => d.dateStr > selectedDate) || dateOptions[1] || dateOptions[0];
                  if (nextOpt) handleDateClick(nextOpt.dateStr);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.88rem', padding: '0.65rem 1.5rem' }}
              >
                Choose Another Time
              </button>
            </div>
          </div>
        )}

        {/* State B: Slots Grid (Available) */}
        {!loading && isDateValid && !error && slots.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.85rem'
          }}>
            {slots.map((slot, index) => {
              const isSelected = selectedSlot?.utcStart === slot.utcStart;
              return (
                <div
                  key={slot.utcStart}
                  className="slot-card-enter"
                  onClick={() => handleSelectSlot(slot)}
                  style={{
                    cursor: 'pointer',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    boxShadow: isSelected ? '0 4px 12px rgba(49, 95, 97, 0.15)' : 'var(--shadow-sm)',
                    transition: 'all 0.18s ease',
                    animationDelay: `${Math.min(index * 20, 220)}ms`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                      {slot.parentLocalTime}
                    </span>
                    <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                      30 min
                    </span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--color-muted-text)', marginBottom: '0.4rem' }}>
                    Mentor's time: <strong>{slot.mentorLocalTime} (IST)</strong>
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-success)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    paddingTop: '0.35rem',
                    borderTop: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
                    <span>1:1 Live Slot Available</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* State: MATCHING YOU WITH A MENTOR (Section 8) */}
        {isMatchingMentor && (
          <div className="card slot-card-enter" style={{
            padding: '2.25rem 1.5rem',
            marginTop: '1.5rem',
            marginBottom: '1.75rem',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '2px dashed var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 16px rgba(40, 92, 94, 0.08)'
          }}>
            <RefreshCw size={26} className="spin" color="var(--color-primary)" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              MATCHING YOU WITH A MENTOR
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
              Finding an available mentor for your selected course and time…
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-muted-text)', marginTop: '0.35rem' }}>
              Evaluating curriculum compatibility, operating shifts, and 2-session daily capacity
            </div>
          </div>
        )}

        {/* Selected Slot: MENTOR MATCHED (Section 8 - Read Only) */}
        {!isMatchingMentor && selectedSlot && (
          <div className="slot-card-enter" style={{
            marginTop: '1.5rem',
            marginBottom: '1.75rem',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 6px 20px rgba(49, 95, 97, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div style={{
                  width: '3.4rem',
                  height: '3.4rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  {(selectedSlot.candidateMentor?.name || 'Mentor').split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                    <span className="badge badge-teal" style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                      <CheckCircle2 size={13} style={{ marginRight: '0.2rem' }} />
                      MENTOR MATCHED
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--color-muted-text)' }}>
                      Available for your selected time
                    </span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                    {selectedSlot.candidateMentor?.name || 'Assigned Mentor'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {selectedSlot.candidateMentor?.specialization || selectedSlot.candidateMentor?.role || resolvedSubjectTitle}
                  </div>
                </div>
              </div>

              {/* Dual Time Display (Section 8) */}
              <div className="slot-timezone-fade" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-dark-teal)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                    Your time:
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {selectedSlot.parentLocalTime}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-dark-teal)', fontWeight: 600 }}>
                    {parentTimezone}
                  </div>
                </div>
                <div style={{ color: 'var(--color-muted-text)', fontSize: '0.85rem' }}>↔</div>
                <div style={{ backgroundColor: '#F1F5F9', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-muted-text)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                    Mentor time:
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                    {selectedSlot.mentorLocalTime}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                    Asia/Kolkata
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Explain why this mentor was matched */}
            <div style={{
              backgroundColor: 'var(--color-bg)',
              padding: '0.9rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Why this mentor?
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.65rem',
                fontSize: '0.82rem',
                color: 'var(--color-dark-text)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  <span><strong>Course compatible:</strong> Qualified for {resolvedSubjectTitle}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  <span><strong>Available:</strong> Free during your selected time ({selectedSlot.mentorLocalTime} IST)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  <span><strong>Daily capacity available:</strong> {selectedSlot.candidateMentor?.dailyCount ?? 0} of 2 sessions booked on this date</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MENTOR CONSTELLATION: Data-Driven Matching System (Informational Only - Section 9) */}
        {!loading && isDateValid && (
          <MentorConstellation
            mentors={allMentors}
            subjectId={resolvedSubjectId}
            subjectTitle={resolvedSubjectTitle}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            subjectMentorsCapacity={selectedSlot?.slotMentorsCapacity || subjectMentorsCapacity}
            loading={loading || isMatchingMentor}
          />
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
