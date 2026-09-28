import React, { useMemo } from 'react';
import { 
  Sparkles, 
  Award
} from 'lucide-react';

export default function MentorConstellation({
  mentors = [],
  subjectId,
  subjectTitle = 'Trial Course',
  selectedDate,
  selectedSlot,
  subjectMentorsCapacity = [],
  loading = false
}) {
  // Matched mentor from the backend availability calculation
  const matchedMentor = selectedSlot?.candidateMentor;

  // Build real data-driven status map for each of the 10 mentors
  const mentorNodes = useMemo(() => {
    const total = mentors.length || 10;
    
    return mentors.map((m, index) => {
      // Calculate elliptical orbit coordinates around center (50%, 50%)
      const angle = (index * (2 * Math.PI / total)) - (Math.PI / 2);
      // X radius = 41%, Y radius = 35%
      const xPercent = 50 + (41 * Math.cos(angle));
      const yPercent = 50 + (35 * Math.sin(angle));

      // 1. Check Course Compatibility
      const isCourseCompatible = subjectId ? m.supportedSubjects?.includes(subjectId) : true;

      // 2. Check Capacity & Availability from Real Backend Data
      const capacityRecord = subjectMentorsCapacity.find(c => c.id === m.id) 
        || (selectedSlot?.slotMentorsCapacity?.find(c => c.id === m.id));

      const isDailyLimitReached = Boolean(
        capacityRecord?.isDailyLimitReached || 
        (capacityRecord?.dailyCount ?? m.bookingsToday ?? 0) >= (m.maxDailyClasses || 2)
      );

      const isBusy = Boolean(capacityRecord?.isBusy);
      const isOutsideHours = Boolean(capacityRecord?.isOutsideHours);
      const isMatched = Boolean(matchedMentor && matchedMentor.id === m.id);

      // Determine precise state as defined by Section 9
      let state = 'AVAILABLE';
      let stateLabel = 'AVAILABLE';
      let stateClass = 'node-status-available';

      if (!isCourseCompatible) {
        state = 'DIFFERENT_SPECIALTY';
        stateLabel = 'DIFFERENT SPECIALTY';
        stateClass = 'node-status-incompatible';
      } else if (isDailyLimitReached) {
        state = 'DAILY_LIMIT_REACHED';
        stateLabel = 'DAILY LIMIT REACHED';
        stateClass = 'node-status-limit';
      } else if (isOutsideHours) {
        state = 'OUTSIDE_WORKING_HOURS';
        stateLabel = 'OUTSIDE WORKING HOURS';
        stateClass = 'node-status-offhours';
      } else if (isBusy) {
        state = 'BUSY';
        stateLabel = 'BUSY';
        stateClass = 'node-status-busy';
      } else if (isMatched) {
        state = 'MATCHED';
        stateLabel = 'MATCHED';
        stateClass = 'node-status-selected';
      }

      const initials = m.name?.split(' ').map(n => n[0]).join('') || 'M';

      return {
        ...m,
        index,
        xPercent,
        yPercent,
        state,
        stateLabel,
        stateClass,
        isMatched,
        isCourseCompatible,
        dailyCount: capacityRecord?.dailyCount ?? m.bookingsToday ?? 0,
        initials
      };
    });
  }, [mentors, subjectId, subjectMentorsCapacity, selectedSlot, matchedMentor]);

  // Find the matched node for drawing the SVG connection beam
  const matchedNode = mentorNodes.find(n => n.isMatched);

  // Dynamic statistics per Section 9
  const totalChecked = mentorNodes.length || 10;
  const compatibleCount = mentorNodes.filter(n => n.isCourseCompatible).length;
  const availableCount = mentorNodes.filter(n => n.isCourseCompatible && (n.state === 'AVAILABLE' || n.state === 'MATCHED')).length;
  const matchedCount = matchedNode ? 1 : 0;

  return (
    <div className="constellation-stage" style={{ marginBottom: '2rem' }}>
      {/* Constellation Header & Real Live Stats (Section 9) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
            Mentor Constellation • System-Managed Matching
          </span>
        </div>

        {/* Section 9 Stats: 10 mentors checked • 3 compatible • 2 currently available • 1 matched */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <span style={{ color: 'var(--color-muted-text)' }}>{totalChecked} mentors checked</span>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <span style={{ color: 'var(--color-primary)' }}>{compatibleCount} compatible</span>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <span style={{ color: 'var(--color-success)' }}>{availableCount} currently available</span>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <span style={{
            color: matchedCount ? 'var(--color-primary)' : 'var(--color-muted-text)',
            backgroundColor: matchedCount ? 'var(--color-primary-light)' : 'transparent',
            padding: matchedCount ? '0.15rem 0.5rem' : '0',
            borderRadius: 'var(--radius-sm)'
          }}>
            {matchedCount} matched
          </span>
        </div>
      </div>

      {/* Orbit Visualization Stage */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '360px',
        backgroundColor: '#FAFCFC',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #E6EFEF',
        overflow: 'hidden'
      }}>
        {/* Subtle Background Elliptical Orbit Rings */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '82%',
          height: '70%',
          borderRadius: '50%',
          border: '1px dashed rgba(40, 92, 94, 0.15)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '50%',
          height: '42%',
          borderRadius: '50%',
          border: '1px solid rgba(40, 92, 94, 0.08)',
          pointerEvents: 'none'
        }} />

        {/* SVG Animated Beams */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Subtle connection lines from center to all available mentors */}
          {mentorNodes.map(node => {
            if (node.state === 'AVAILABLE' || node.state === 'MATCHED') {
              return (
                <line
                  key={`ray-${node.id}`}
                  x1="50%"
                  y1="50%"
                  x2={`${node.xPercent}%`}
                  y2={`${node.yPercent}%`}
                  stroke="rgba(40, 92, 94, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            }
            return null;
          })}

          {/* Connection Beam to Matched Mentor */}
          {matchedNode && (
            <line
              x1="50%"
              y1="50%"
              x2={`${matchedNode.xPercent}%`}
              y2={`${matchedNode.yPercent}%`}
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              className="constellation-beam-draw"
            />
          )}
        </svg>

        {/* Central Hub / Session Anchor */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 12,
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div className="constellation-pulse-center" style={{
            width: '4.25rem',
            height: '4.25rem',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 8px 24px rgba(40, 92, 94, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.4rem'
          }}>
            <Award size={20} color="var(--color-primary)" strokeWidth={2.4} />
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-dark-text)', marginTop: '0.15rem' }}>
              1:1 LIVE
            </span>
          </div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--color-dark-text)',
            whiteSpace: 'nowrap'
          }}>
            {loading ? 'Evaluating Mentors…' : selectedSlot ? selectedSlot.parentLocalTime : subjectTitle}
          </div>
        </div>

        {/* 10 Surrounding Mentor Nodes (Purely Informational - Zero Selection Action) */}
        {mentorNodes.map((node) => {
          const isSelected = node.isMatched;

          return (
            <div
              key={node.id}
              className={`constellation-node ${node.stateClass}`}
              style={{
                top: `${node.yPercent}%`,
                left: `${node.xPercent}%`,
                cursor: 'default',
                pointerEvents: 'none'
              }}
              title={`${node.name} — ${node.stateLabel} (${node.dailyCount}/2 booked on date)`}
            >
              <div 
                className="constellation-node-avatar"
                style={{
                  backgroundColor: isSelected 
                    ? 'var(--color-primary)' 
                    : (node.avatarBg || '#FFFFFF'),
                  color: isSelected 
                    ? '#FFFFFF' 
                    : (node.avatarColor || 'var(--color-primary)')
                }}
              >
                {node.initials}
              </div>

              {/* Compact Name & Status Badge */}
              <div style={{
                marginTop: '0.3rem',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}>
                <div style={{
                  fontSize: '0.74rem',
                  fontWeight: isSelected ? 800 : 700,
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-dark-text)',
                  textShadow: '0 1px 3px rgba(255,255,255,0.9)'
                }}>
                  {node.name.split(' ')[0]}
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: isSelected 
                    ? 'var(--color-primary)' 
                    : (node.state === 'AVAILABLE' ? 'var(--color-success)' : 'var(--color-muted-text)'),
                  letterSpacing: '0.02em'
                }}>
                  {node.stateLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Constellation Legend (Section 9 - Informational) */}
      <div style={{
        marginTop: '0.85rem',
        padding: '0.65rem 1rem',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        flexWrap: 'wrap',
        fontSize: '0.72rem',
        fontWeight: 700
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }} />
          <span style={{ color: 'var(--color-dark-text)' }}>AVAILABLE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
          <span style={{ color: 'var(--color-dark-text)' }}>BUSY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
          <span style={{ color: 'var(--color-dark-text)' }}>DAILY LIMIT REACHED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
          <span style={{ color: 'var(--color-dark-text)' }}>OUTSIDE WORKING HOURS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />
          <span style={{ color: 'var(--color-dark-text)' }}>DIFFERENT SPECIALTY</span>
        </div>
      </div>
    </div>
  );
}
