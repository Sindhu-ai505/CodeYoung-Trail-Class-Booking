import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { Globe, Clock, ArrowRight, Sun, Snowflake, CheckCircle2, ShieldAlert, Sparkles, Compass } from 'lucide-react';

const DEMO_CITIES = [
  { id: 'nyc', name: 'New York (US Eastern)', zone: 'America/New_York' },
  { id: 'lon', name: 'London (UK / GMT & BST)', zone: 'Europe/London' },
  { id: 'lax', name: 'Los Angeles (US Pacific)', zone: 'America/Los_Angeles' },
  { id: 'chi', name: 'Chicago (US Central)', zone: 'America/Chicago' }
];

export default function TimezoneGuide() {
  const [season, setSeason] = useState('winter'); // 'winter' | 'summer'
  const [selectedCityId, setSelectedCityId] = useState('nyc');

  const selectedCity = DEMO_CITIES.find(c => c.id === selectedCityId) || DEMO_CITIES[0];

  // Dynamically calculate times using Luxon and real IANA timezone database
  // Winter date: January 15 (Standard Time)
  // Summer date: July 15 (Daylight Saving Time)
  const baseMonth = season === 'winter' ? 1 : 7;
  const parentDt = DateTime.fromObject(
    { year: 2026, month: baseMonth, day: 15, hour: 10, minute: 0 },
    { zone: selectedCity.zone }
  );

  const mentorDt = parentDt.setZone('Asia/Kolkata');

  // Offset difference in hours
  const diffHours = (mentorDt.offset - parentDt.offset) / 60;
  const diffFormatted = diffHours % 1 === 0 ? `${diffHours} hrs` : `${Math.floor(diffHours)} hrs 30 mins`;

  return (
    <section id="timezone-guide" className="tz-section scroll-reveal">
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header" style={{ maxWidth: '720px', margin: '0 auto 2.25rem', textAlign: 'center' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.45rem' }}>
            Timezone & DST Architecture
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '0.65rem' }}>
            Zero Scheduling Confusion Across Continents
          </h2>
          <p className="text-body">
            Mentors are in India, while parents are across the US, UK, and worldwide. Our system handles timezone mathematics and Daylight Saving Time automatically so your class happens right on time.
          </p>
        </div>

        {/* 3 Core Concepts Grid */}
        <div className="tz-three-col">
          <div className="tz-concept-card">
            <div style={{
              width: '2.8rem',
              height: '2.8rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={22} />
            </div>
            <h3 className="heading-sm" style={{ fontSize: '1.15rem' }}>
              1. You Select Local Time
            </h3>
            <p className="text-body" style={{ fontSize: '0.9rem' }}>
              View and book available slots purely in your home timezone (e.g. 10:00 AM New York or 4:00 PM London). No manual offset math needed.
            </p>
          </div>

          <div className="tz-concept-card">
            <div style={{
              width: '2.8rem',
              height: '2.8rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe size={22} />
            </div>
            <h3 className="heading-sm" style={{ fontSize: '1.15rem' }}>
              2. System Converts to UTC
            </h3>
            <p className="text-body" style={{ fontSize: '0.9rem' }}>
              Every slot is immediately anchored in universal coordinated time (UTC), avoiding ambiguous local hour representations.
            </p>
          </div>

          <div className="tz-concept-card">
            <div style={{
              width: '2.8rem',
              height: '2.8rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <h3 className="heading-sm" style={{ fontSize: '1.15rem' }}>
              3. Dual Timezone Clarity
            </h3>
            <p className="text-body" style={{ fontSize: '0.9rem' }}>
              Both parent local time and mentor local time (Asia/Kolkata, IST) are clearly displayed side-by-side on your summary and dashboard.
            </p>
          </div>
        </div>

        {/* Highlighted DST Explanation Box */}
        <div className="dst-highlight-box">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-warm-yellow)',
              color: '#1A3438',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sun size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="heading-sm" style={{ fontSize: '1.25rem', marginBottom: '0.35rem', color: '#163D4A' }}>
                How Daylight Saving Time (DST) is Managed
              </h3>
              <p className="text-body" style={{ color: '#4B626C', fontSize: '0.94rem' }}>
                Why your appointment date matters when booking across international borders.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(22, 61, 74, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--color-dark-text)', lineHeight: 1.5 }}>
                <strong>No DST in India:</strong> Mentors operate on India Standard Time (IST, UTC+05:30) all year round with zero seasonal shifts.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--color-dark-text)', lineHeight: 1.5 }}>
                <strong>US / UK Clocks Shift:</strong> Eastern Time moves from UTC-5 (EST) in winter to UTC-4 (EDT) in summer.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--color-dark-text)', lineHeight: 1.5 }}>
                <strong>Date-Based IANA Calculations:</strong> Our engine converts times based on the actual appointment date using official IANA rules—never static hardcoded offsets.
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Timezone Example Card */}
        <div className="tz-live-demo-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginBottom: '1.75rem'
          }}>
            <div>
              <span className="badge badge-teal" style={{ marginBottom: '0.35rem' }}>
                Live Calculator
              </span>
              <h3 className="heading-sm" style={{ fontSize: '1.2rem' }}>
                Compare Winter vs. Summer (DST) Schedules
              </h3>
            </div>

            {/* Controls: Season Toggle & City Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* City selector */}
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-dark-text)'
                }}
              >
                {DEMO_CITIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Winter vs Summer Toggle */}
              <div style={{
                display: 'flex',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '3px',
                border: '1px solid var(--color-border)'
              }}>
                <button
                  onClick={() => setSeason('winter')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: season === 'winter' ? '#FFFFFF' : 'transparent',
                    boxShadow: season === 'winter' ? 'var(--shadow-sm)' : 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: season === 'winter' ? 'var(--color-primary)' : 'var(--color-muted-text)'
                  }}
                >
                  <Snowflake size={14} />
                  <span>Winter (Standard)</span>
                </button>

                <button
                  onClick={() => setSeason('summer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: season === 'summer' ? '#FFFFFF' : 'transparent',
                    boxShadow: season === 'summer' ? 'var(--shadow-sm)' : 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: season === 'summer' ? 'var(--color-orange)' : 'var(--color-muted-text)'
                  }}
                >
                  <Sun size={14} />
                  <span>Summer (DST)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dual Box Comparison Display */}
          <div className="tz-comparison-dual">
            {/* Parent Box */}
            <div className="tz-box">
              <span className="text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--color-primary)' }}>
                Parent's Local View
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                {parentDt.toFormat('hh:mm a')}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
                {selectedCity.name.split(' (')[0]} ({parentDt.offsetNameShort}, UTC{parentDt.toFormat('ZZ')})
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-light-text)', marginTop: '0.25rem' }}>
                Simulated Date: {parentDt.toFormat('MMMM dd, yyyy')}
              </div>
            </div>

            {/* Center Arrow / Delta Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(49, 95, 97, 0.15)'
              }}>
                +{diffFormatted} difference
              </div>
              <ArrowRight size={20} color="var(--color-muted-text)" />
            </div>

            {/* Mentor Box */}
            <div className="tz-box" style={{ borderLeft: '3px solid var(--color-primary)' }}>
              <span className="text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--color-primary)' }}>
                Mentor's Local View (India)
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                {mentorDt.toFormat('hh:mm a')}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
                India Standard Time (IST, UTC+05:30)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-light-text)', marginTop: '0.25rem' }}>
                Simulated Date: {mentorDt.toFormat('MMMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
            Notice: When {selectedCity.name.split(' (')[0]} enters Daylight Saving Time, the difference changes by 1 hour automatically without manual recalculation.
          </div>
        </div>

      </div>
    </section>
  );
}
