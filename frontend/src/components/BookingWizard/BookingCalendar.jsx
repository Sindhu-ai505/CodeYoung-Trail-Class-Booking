import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { 
  BOOKING_WINDOW_DAYS,
  isDateWithinBookingWindow,
  canNavigatePrevMonth,
  canNavigateNextMonth,
  getMonthCalendarGrid
} from '../../utils/timezones.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BookingCalendar({
  selectedDate,
  onSelectDate,
  parentTimezone = 'America/New_York',
  confirmedNoSlotsDates = {}
}) {
  // Current month being viewed in the calendar
  const [viewMonth, setViewMonth] = useState(() => {
    const tz = parentTimezone || 'America/New_York';
    if (selectedDate && isDateWithinBookingWindow(selectedDate, tz)) {
      return DateTime.fromISO(selectedDate, { zone: tz }).startOf('month');
    }
    return DateTime.now().setZone(tz).startOf('month');
  });

  // When parentTimezone or selectedDate changes, keep viewMonth in sync if selectedDate is in another month
  useEffect(() => {
    if (selectedDate) {
      const dt = DateTime.fromISO(selectedDate, { zone: parentTimezone });
      if (dt.isValid && (dt.month !== viewMonth.month || dt.year !== viewMonth.year)) {
        setViewMonth(dt.startOf('month'));
      }
    }
  }, [selectedDate, parentTimezone]);

  const canPrev = canNavigatePrevMonth(viewMonth, parentTimezone);
  const canNext = canNavigateNextMonth(viewMonth, parentTimezone);

  const handlePrevMonth = () => {
    if (canPrev) {
      setViewMonth(prev => prev.minus({ months: 1 }));
    }
  };

  const handleNextMonth = () => {
    if (canNext) {
      setViewMonth(prev => prev.plus({ months: 1 }));
    }
  };

  const handleJumpToToday = () => {
    const today = DateTime.now().setZone(parentTimezone);
    setViewMonth(today.startOf('month'));
    onSelectDate(today.toFormat('yyyy-MM-dd'));
  };

  const monthGrid = getMonthCalendarGrid(viewMonth, parentTimezone);
  const todayStr = monthGrid.todayStr;
  const isViewingCurrentMonth = (viewMonth.month === DateTime.now().setZone(parentTimezone).month &&
                                 viewMonth.year === DateTime.now().setZone(parentTimezone).year);

  // Quick 3-day shortcut options (Today, Tomorrow, Day 2)
  const todayDt = DateTime.now().setZone(parentTimezone);
  const quickPills = [
    { label: 'Today', dateStr: todayDt.toFormat('yyyy-MM-dd') },
    { label: 'Tomorrow', dateStr: todayDt.plus({ days: 1 }).toFormat('yyyy-MM-dd') },
    { label: todayDt.plus({ days: 2 }).toFormat('ccc, LLL d'), dateStr: todayDt.plus({ days: 2 }).toFormat('yyyy-MM-dd') },
    { label: todayDt.plus({ days: 3 }).toFormat('ccc, LLL d'), dateStr: todayDt.plus({ days: 3 }).toFormat('yyyy-MM-dd') }
  ];

  return (
    <div className="booking-calendar-card" style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
      padding: '1.25rem',
      marginBottom: '1.75rem',
      maxWidth: '560px',
      margin: '0 auto 1.75rem'
    }}>
      {/* Calendar Header with Month Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={18} color="var(--color-primary)" />
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--color-dark-text)',
            margin: 0
          }}>
            {monthGrid.monthYearLabel}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="btn btn-secondary"
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.55rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)'
              }}
              title="Jump back to current month"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={!canPrev}
            aria-label="Previous month"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: canPrev ? '#FFFFFF' : '#F8FAFC',
              color: canPrev ? 'var(--color-dark-text)' : '#CBD5E1',
              cursor: canPrev ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={!canNext}
            aria-label="Next month"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: canNext ? '#FFFFFF' : '#F8FAFC',
              color: canNext ? 'var(--color-dark-text)' : '#CBD5E1',
              cursor: canNext ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Quick Access Day Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '0.9rem',
        overflowX: 'auto',
        paddingBottom: '0.2rem'
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase', marginRight: '0.2rem' }}>
          Quick Pick:
        </span>
        {quickPills.map(pill => {
          const isPillSelected = selectedDate === pill.dateStr;
          return (
            <button
              key={pill.dateStr}
              type="button"
              onClick={() => onSelectDate(pill.dateStr)}
              style={{
                fontSize: '0.74rem',
                fontWeight: isPillSelected ? 800 : 600,
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                border: isPillSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: isPillSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                color: isPillSelected ? 'var(--color-primary)' : 'var(--color-dark-text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Weekday Header Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.25rem',
        marginBottom: '0.4rem',
        textAlign: 'center'
      }}>
        {WEEKDAYS.map(day => (
          <div
            key={day}
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--color-muted-text)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.35rem 0'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Month Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.35rem'
      }}>
        {monthGrid.days.map(dayItem => {
          const isSelected = selectedDate === dayItem.dateStr;
          const isToday = dayItem.isToday;
          const isDisabled = dayItem.isDisabled;
          const isCurrentMonth = dayItem.isCurrentMonth;
          const hasNoSlots = Boolean(confirmedNoSlotsDates[dayItem.dateStr]);

          if (!isCurrentMonth) {
            return (
              <div
                key={dayItem.key}
                style={{
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E2E8F0',
                  fontSize: '0.85rem',
                  userSelect: 'none'
                }}
              >
                {dayItem.dayNumber}
              </div>
            );
          }

          let bgColor = 'transparent';
          let textColor = 'var(--color-dark-text)';
          let border = '1px solid transparent';
          let boxShadow = 'none';
          let cursor = 'pointer';

          if (isDisabled) {
            textColor = '#CBD5E1';
            cursor = 'not-allowed';
          } else if (isSelected) {
            bgColor = 'var(--color-primary)';
            textColor = '#FFFFFF';
            border = '1px solid var(--color-primary)';
            boxShadow = '0 3px 10px rgba(49, 95, 97, 0.25)';
          } else if (isToday) {
            bgColor = 'var(--color-primary-light)';
            textColor = 'var(--color-primary)';
            border = '1.5px solid var(--color-primary)';
          } else if (hasNoSlots) {
            textColor = '#94A3B8';
            bgColor = '#F8FAFC';
          }

          return (
            <button
              key={dayItem.key}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  onSelectDate(dayItem.dateStr);
                }
              }}
              title={
                isDisabled
                  ? (dayItem.isPast ? 'Past date' : `Outside ${BOOKING_WINDOW_DAYS}-day booking window`)
                  : (hasNoSlots ? 'No slots confirmed on date' : (isToday ? 'Today (Available)' : dayItem.fullDateLabel))
              }
              aria-label={dayItem.fullDateLabel}
              aria-pressed={isSelected}
              style={{
                position: 'relative',
                height: '42px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                backgroundColor: bgColor,
                color: textColor,
                border,
                boxShadow,
                cursor,
                fontWeight: isSelected || isToday ? 800 : 500,
                fontSize: '0.92rem',
                transition: 'all 0.15s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.backgroundColor = isToday ? 'var(--color-primary-light)' : '#F1F5F9';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.backgroundColor = isToday ? 'var(--color-primary-light)' : 'transparent';
                  e.currentTarget.style.borderColor = isToday ? 'var(--color-primary)' : 'transparent';
                }
              }}
            >
              <span>{dayItem.dayNumber}</span>
              {isToday && !isSelected && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '3px',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar State Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--color-border)',
        fontSize: '0.72rem',
        color: 'var(--color-muted-text)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: 'var(--color-primary)'
          }} />
          <span>Selected</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: 'var(--color-primary-light)',
            border: '1px solid var(--color-primary)'
          }} />
          <span>Today</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border)'
          }} />
          <span>Available</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '3px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            opacity: 0.5
          }} />
          <span>Outside {BOOKING_WINDOW_DAYS}-day window</span>
        </div>
      </div>
    </div>
  );
}
