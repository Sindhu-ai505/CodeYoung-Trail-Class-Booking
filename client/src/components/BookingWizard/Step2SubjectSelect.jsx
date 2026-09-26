import React, { useState } from 'react';
import { 
  Code2, 
  Globe, 
  Brain, 
  Cpu, 
  Gamepad2, 
  Binary, 
  ArrowRight, 
  ArrowLeft,
  Check
} from 'lucide-react';

const ICON_MAP = {
  Code2,
  Globe,
  Brain,
  Cpu,
  Gamepad2,
  Binary
};

export default function Step2SubjectSelect({ subjects, selectedSubjectId, onNext, onBack, childName }) {
  const [selected, setSelected] = useState(selectedSubjectId || (subjects.length > 0 ? subjects[0].id : ''));
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selected) {
      setError('Please select a course for your child to try.');
      return;
    }
    const subjectObj = subjects.find(s => s.id === selected);
    onNext(subjectObj);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>
          What would {childName ? childName : 'your child'} like to explore?
        </h2>
        <p className="text-body" style={{ fontSize: '0.9rem' }}>
          Choose an explicit trial course. Mentors are matched specifically to your choice.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Grid of subjects */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {subjects.map((sub) => {
          const isSelected = selected === sub.id;
          const Icon = ICON_MAP[sub.iconName] || Code2;
          return (
            <div
              key={sub.id}
              onClick={() => {
                setSelected(sub.id);
                setError('');
              }}
              style={{
                cursor: 'pointer',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                boxShadow: isSelected ? '0 4px 14px rgba(49, 95, 97, 0.15)' : 'var(--shadow-card)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '0.85rem',
                  right: '0.85rem',
                  width: '1.4rem',
                  height: '1.4rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              <div>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? '#FFFFFF' : 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Icon size={20} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                    {sub.title}
                  </h3>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--color-muted-text)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {sub.shortDesc}
                </p>
              </div>

              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: isSelected ? 'var(--color-primary)' : 'var(--color-muted-text)',
                paddingTop: '0.5rem',
                borderTop: '1px solid rgba(0,0,0,0.06)'
              }}>
                {sub.suitableFor}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.75rem' }}
        >
          <span>Course Overview</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
