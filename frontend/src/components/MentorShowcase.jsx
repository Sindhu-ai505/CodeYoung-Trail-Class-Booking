import React, { useState } from 'react';
import { Globe, Clock, CheckCircle2, AlertCircle, Shield, Award, Sparkles, LayoutGrid } from 'lucide-react';
import MentorConstellation from './MentorConstellation.jsx';

export default function MentorShowcase({ mentors = [], subjects = [] }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'constellation'

  // Filter mentors based on supported subjects
  const filteredMentors = selectedFilter === 'ALL'
    ? mentors
    : mentors.filter(m => m.supportedSubjects?.includes(selectedFilter));

  const getSubjectTitle = (subId) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.title : subId;
  };

  const formatHours = (hours) => {
    if (!hours) return '10:00 AM - 7:00 PM IST';
    const startStr = hours.start < 12 ? `${hours.start}:00 AM` : `${hours.start === 12 ? 12 : hours.start - 12}:00 PM`;
    const endStr = hours.end < 12 ? `${hours.end}:00 AM` : `${hours.end === 12 ? 12 : hours.end - 12}:00 PM`;
    return `${startStr} – ${endStr} IST`;
  };

  const activeSubjectObj = subjects.find(s => s.id === selectedFilter);

  return (
    <section id="mentors" className="scroll-reveal" style={{ padding: '4rem 0 3.5rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.85rem' }}>
            Faculty & Mentors
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '0.85rem' }}>
            Meet Our 10 Mentors
          </h2>
          <p className="text-body">
            Based in India (Asia/Kolkata), our mentors are specialized educators who conduct a maximum of 2 personalized trial sessions per day to maintain world-class teaching attention.
          </p>

          {/* View Mode Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            padding: '0.3rem',
            borderRadius: 'var(--radius-full)',
            marginTop: '1.25rem',
            border: '1px solid var(--color-border)'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-muted-text)',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <LayoutGrid size={15} />
              <span>Mentor Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('constellation')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'constellation' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'constellation' ? 'var(--color-primary)' : 'var(--color-muted-text)',
                boxShadow: viewMode === 'constellation' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={15} color="var(--color-warm-yellow)" />
              <span>Mentor Constellation</span>
            </button>
          </div>
        </div>

        {/* Working Subject Filter Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          justifyContent: 'center',
          marginBottom: '2.5rem'
        }}>
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`btn ${selectedFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}
          >
            All Tracks ({mentors.length})
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedFilter(s.id)}
              className={`btn ${selectedFilter === s.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* View 1: Mentor Constellation */}
        {viewMode === 'constellation' && (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <MentorConstellation
              mentors={mentors}
              subjectId={selectedFilter === 'ALL' ? (subjects[0]?.id || 'coding_programming') : selectedFilter}
              subjectTitle={selectedFilter === 'ALL' ? '1:1 Live Trial' : (activeSubjectObj?.title || 'Selected Track')}
              loading={false}
            />
          </div>
        )}

        {/* View 2: 10 Mentors Grid */}
        {viewMode === 'grid' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.6rem'
          }}>
          {filteredMentors.map((m) => {
            const isFull = m.isDailyLimitReached || (m.bookingsToday >= (m.maxDailyClasses || 2));
            const initials = m.name?.split(' ').map(n => n[0]).join('') || 'M';

            return (
              <div
                key={m.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div>
                  {/* Top Avatar + Availability Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <div style={{
                      width: '3.2rem',
                      height: '3.2rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: m.avatarBg || '#EBF4F4',
                      color: m.avatarColor || 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      boxShadow: '0 2px 8px rgba(22, 61, 74, 0.08)'
                    }}>
                      {initials}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {isFull ? (
                        <span className="badge badge-error" style={{ fontSize: '0.72rem' }}>
                          <AlertCircle size={12} /> Limit Reached
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          <CheckCircle2 size={12} /> Available Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name & Specialization */}
                  <h3 className="heading-sm" style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                    {m.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                    {m.role || m.specialization}
                  </p>
                  <p className="text-sm" style={{ fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.1rem', minHeight: '38px' }}>
                    {m.experience}
                  </p>
                </div>

                {/* Footer details: Timezone, Hours, Subject badges */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.9rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
                    <Globe size={13} color="var(--color-primary)" />
                    <span>Timezone: <strong>India ({m.timezone || 'Asia/Kolkata'})</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginBottom: '0.75rem' }}>
                    <Clock size={13} />
                    <span>Hours: {formatHours(m.workingHours)}</span>
                  </div>

                  {/* Supported Subject Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {m.supportedSubjects?.map(subId => (
                      <span
                        key={subId}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: 'var(--color-surface-hover)',
                          borderRadius: '4px',
                          color: 'var(--color-dark-text)',
                          fontWeight: 600,
                          border: '1px solid #ECECEC'
                        }}
                      >
                        {getSubjectTitle(subId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

      </div>
    </section>
  );
}
