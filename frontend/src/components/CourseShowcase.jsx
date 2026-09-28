import React from 'react';
import { 
  Code2, 
  Globe, 
  Brain, 
  Cpu, 
  Gamepad2, 
  Binary, 
  Clock, 
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';

const ICON_MAP = {
  Code2,
  Globe,
  Brain,
  Cpu,
  Gamepad2,
  Binary
};

export default function CourseShowcase({ subjects, mentors = [], onSelectCourse }) {
  const getMentorCountForSubject = (subjectId) => {
    if (!mentors || mentors.length === 0) return null;
    const count = mentors.filter(m => m.supportedSubjects?.includes(subjectId)).length;
    return count;
  };

  return (
    <section id="courses" className="scroll-reveal" style={{ padding: '5rem 0', backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        
        {/* Section Heading */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
          <span className="badge badge-orange" style={{ marginBottom: '0.85rem' }}>
            Supported Curricula
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '0.85rem' }}>
            Explore our courses
          </h2>
          <p className="text-body">
            Every track features a personalized 30-minute 1:1 live demo led by an experienced mentor, customized to your child’s age and skill level.
          </p>
        </div>

        {/* 6 Courses Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.75rem'
        }}>
          {subjects.map((subject) => {
            const Icon = ICON_MAP[subject.iconName] || Code2;
            const mentorCount = getMentorCountForSubject(subject.id);

            return (
              <div 
                key={subject.id} 
                className="card course-showcase-card"
                onClick={() => onSelectCourse(subject.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.85rem',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  {/* Top Icon & Badge Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div 
                      className="course-showcase-icon"
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-light)',
                        color: subject.color || 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(22, 61, 74, 0.06)'
                      }}
                    >
                      <Icon size={24} strokeWidth={2.2} />
                    </div>

                    <span className="badge badge-teal">
                      {subject.badge || 'Trial Ready'}
                    </span>
                  </div>

                  {/* Course Title & Description */}
                  <h3 className="heading-sm" style={{ fontSize: '1.25rem', marginBottom: '0.65rem' }}>
                    {subject.title}
                  </h3>
                  
                  <p className="text-body" style={{ fontSize: '0.92rem', marginBottom: '1.25rem', minHeight: '44px' }}>
                    {subject.shortDesc}
                  </p>

                  {/* Age & Duration Specs */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1.5rem'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                      {subject.suitableFor}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} /> {subject.duration} • 1:1 Live
                      </span>
                      {mentorCount !== null && mentorCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                          <Users size={13} /> {mentorCount} Mentors
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Selection CTA */}
                <button
                  onClick={() => onSelectCourse(subject.id)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    padding: '0.75rem 1.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = 'var(--color-dark-text)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  <span>Book Trial for This Course</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
