import React, { useState } from 'react';
import { Globe, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MentorShowcase({ mentors, subjects }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Filter mentors based on supported subjects
  const filteredMentors = selectedFilter === 'ALL'
    ? mentors
    : mentors.filter(m => m.supportedSubjects.includes(selectedFilter));

  const getSubjectTitle = (subId) => {
    const s = subjects.find(sub => sub.id === subId);
    return s ? s.title : subId;
  };

  return (
    <section id="mentors" style={{ padding: '4.5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.75rem' }}>Certified Educators</span>
          <h2 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Meet Our 10 Trial Mentors</h2>
          <p className="text-body">
            Based in India (Asia/Kolkata), our mentors are senior software coaches who conduct a maximum of 2 personalized trial classes per day to guarantee peak quality.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          marginBottom: '2.5rem'
        }}>
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`btn ${selectedFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
          >
            All Mentors ({mentors.length})
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedFilter(s.id)}
              className={`btn ${selectedFilter === s.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Mentors Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredMentors.map((m) => {
            const isFull = m.isDailyLimitReached || m.bookingsToday >= m.maxDailyClasses;
            return (
              <div
                key={m.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.4rem'
                }}
              >
                <div>
                  {/* Avatar Initials + Availability Dot */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: m.avatarBg || '#EBF4F4',
                      color: m.avatarColor || 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem'
                    }}>
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {isFull ? (
                        <span className="badge badge-error" style={{ fontSize: '0.72rem' }}>
                          <AlertCircle size={12} /> Daily Limit (2/2)
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          <CheckCircle2 size={12} /> Available Today
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="heading-sm" style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    {m.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                    {m.role}
                  </p>
                  <p className="text-sm" style={{ fontSize: '0.78rem', marginBottom: '1rem' }}>
                    {m.experience}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--color-muted-text)', marginBottom: '0.5rem' }}>
                    <Globe size={13} />
                    <span>Timezone: <strong>{m.timezone}</strong></span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {m.supportedSubjects.map(subId => (
                      <span
                        key={subId}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.45rem',
                          backgroundColor: 'var(--color-surface-hover)',
                          borderRadius: '4px',
                          color: 'var(--color-dark-text)',
                          fontWeight: 500
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
      </div>
    </section>
  );
}
