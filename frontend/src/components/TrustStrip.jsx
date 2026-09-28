import React, { useState, useEffect } from 'react';

export default function TrustStrip({ devStats, selectedDate, parentTimezone }) {
  const [counts, setCounts] = useState(() => {
    // If reduced motion is requested, immediately start with final numbers
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return { mentors: 10, capacity: 20, maxSessions: 2, duration: 30 };
    }
    return { mentors: 0, capacity: 0, maxSessions: 0, duration: 0 };
  });

  // One-time count-up animation on initial page load (Requirement 6)
  useEffect(() => {
    const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReduced) return;

    let startTime = null;
    const duration = 650; // smooth ~650ms total run time
    let animationFrameId;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setCounts({
        mentors: Math.round(ease * 10),
        capacity: Math.round(ease * 20),
        maxSessions: Math.round(ease * 2),
        duration: Math.round(ease * 30)
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []); // Run once on initial page load

  const remainingSlots = devStats
    ? (devStats.capacityRemainingOnDate ?? devStats.capacityRemainingToday)
    : 20;
  const bookedCount = devStats
    ? (devStats.dateBookingsCount ?? devStats.todayBookingsCount)
    : 0;

  let datePrefix = "Today's";
  if (devStats?.isToday) {
    datePrefix = "Today's";
  } else if (devStats?.formattedDate) {
    datePrefix = `${devStats.formattedDate}`;
  }

  return (
    <div className="trust-strip scroll-reveal">
      <div className="container">
        <div className="trust-strip-inner">
          
          <div className="trust-stat-item trust-stat-enter" style={{ animationDelay: '50ms' }}>
            <div className="trust-stat-val">{counts.mentors}</div>
            <div className="trust-stat-label">Active Mentors</div>
          </div>

          <div className="trust-stat-item trust-stat-enter" style={{ animationDelay: '100ms' }}>
            <div className="trust-stat-val">{counts.capacity}</div>
            <div className="trust-stat-label">Daily Capacity</div>
          </div>

          <div className="trust-stat-item trust-stat-enter" style={{ animationDelay: '150ms' }}>
            <div className="trust-stat-val">{counts.maxSessions}</div>
            <div className="trust-stat-label">Max Trial Sessions / Mentor / Day</div>
          </div>

          <div className="trust-stat-item trust-stat-enter" style={{ animationDelay: '200ms' }}>
            <div className="trust-stat-val">{counts.duration} min</div>
            <div className="trust-stat-label">Trial Session</div>
          </div>

          {/* Real Database Dynamic Availability Badge (Date-Scoped, strictly real backend values) */}
          <div className="trust-stat-item trust-stat-availability trust-stat-enter" style={{ animationDelay: '250ms' }}>
            <div className="trust-live-pill">
              <span className="pulsing-dot" />
              <span className="trust-live-text">
                {datePrefix} Availability: <strong>{remainingSlots} slots remaining</strong> ({bookedCount}/20 booked)
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
