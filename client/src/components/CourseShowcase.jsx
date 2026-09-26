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
  Sparkles
} from 'lucide-react';

const ICON_MAP = {
  Code2,
  Globe,
  Brain,
  Cpu,
  Gamepad2,
  Binary
};

export default function CourseShowcase({ subjects, onSelectCourse }) {
  return (
    <section id="courses" style={{ padding: '4.5rem 0', backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
          <span className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>Curriculum Tracks</span>
          <h2 className="heading-lg" style={{ marginBottom: '0.75rem' }}>Explore Trial Courses</h2>
          <p className="text-body">
            Every course features a live 1:1 session tailored to your child's age and experience level.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {subjects.map((subject) => {
            const Icon = ICON_MAP[subject.iconName] || Code2;
            return (
              <div 
                key={subject.id} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
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
                      <Icon size={22} />
                    </div>
                    <span className="badge badge-teal">
                      {subject.badge || 'Trial Ready'}
                    </span>
                  </div>

                  <h3 className="heading-sm" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {subject.title}
                  </h3>
                  
                  <p className="text-body" style={{ fontSize: '0.88rem', marginBottom: '1rem', minHeight: '42px' }}>
                    {subject.shortDesc}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem'
                  }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-dark-text)' }}>
                      {subject.suitableFor}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> {subject.duration} • 1:1 Live Trial
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectCourse(subject.id)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    fontWeight: 600,
                    fontSize: '0.88rem'
                  }}
                >
                  <span>Select Course</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
