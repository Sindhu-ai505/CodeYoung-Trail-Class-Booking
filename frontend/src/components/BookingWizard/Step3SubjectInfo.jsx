import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  Code2, 
  Globe, 
  Brain, 
  Cpu, 
  Gamepad2, 
  Binary,
  Award,
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

export default function Step3SubjectInfo({ subject, childName, onNext, onBack }) {
  if (!subject) return null;
  const Icon = ICON_MAP[subject.iconName] || Code2;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <span className="badge badge-teal" style={{ marginBottom: '0.5rem' }}>Course Overview</span>
        <h2 className="heading-md">{subject.title}</h2>
        <p className="text-body" style={{ fontSize: '0.9rem' }}>
          Here is what {childName ? childName : 'your child'} will experience during the 30-minute 1:1 demo session.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        {/* Header with Icon and Quick Stats */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.35rem' }}>
              {subject.title}
            </h3>
            <p className="text-body" style={{ fontSize: '0.9rem' }}>
              {subject.shortDesc}
            </p>
          </div>
        </div>

        {/* Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Clock size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 700 }}>
                Duration
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                30 Minutes (1:1 Live)
              </div>
            </div>
          </div>

          <div style={{
            padding: '0.85rem',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Users size={18} color="var(--color-primary)" />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', textTransform: 'uppercase', fontWeight: 700 }}>
                Suitable Level
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                {subject.suitableFor}
              </div>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.85rem' }}>
            What your child will experience:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {subject.highlights?.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <CheckCircle2 size={16} color="var(--color-success)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.88rem', color: 'var(--color-dark-text)' }}>
                  {h}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mentor Matching Preview Note (Section 3) */}
        <div style={{
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid rgba(49, 95, 97, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
          color: 'var(--color-primary)'
        }}>
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.15rem' }}>
              Your mentor will be matched automatically.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-dark-teal)', lineHeight: 1.4 }}>
              Finding the right mentor for your trial… Qualified educators specialized in <strong>{subject.title}</strong> will be matched automatically once you select your preferred date, time, and timezone.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          <span>Change Course</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.75rem' }}
        >
          <span>Continue to Choose a Time</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
