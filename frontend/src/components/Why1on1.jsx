import React from 'react';
import { UserCheck, Sliders, Sparkles, Users } from 'lucide-react';

const BENEFITS = [
  {
    icon: UserCheck,
    title: 'Personal Attention',
    description: 'One certified mentor completely focused on one student. No crowded webinars or divided attention.'
  },
  {
    icon: Sliders,
    title: "Learn at the Learner's Pace",
    description: 'The session adapts in real time to your child’s curiosity and skill level, whether complete beginner or curious builder.'
  },
  {
    icon: Sparkles,
    title: 'Interactive Project-Based',
    description: 'Children participate actively by writing code, testing logic, and solving challenges—never passive video watching.'
  },
  {
    icon: Users,
    title: 'Meet the Mentor First',
    description: 'Parents experience teaching chemistry, communication style, and pedagogical approach before making any commitment.'
  }
];

export default function Why1on1() {
  return (
    <section id="why-1-on-1" className="section scroll-reveal" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        <div className="section-header" style={{ maxWidth: '620px', margin: '0 auto 3rem', textAlign: 'center' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.65rem' }}>
            The 1:1 Difference
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '0.85rem' }}>
            Why personalized 1:1 mentorship works best
          </h2>
          <p className="text-body" style={{ fontSize: '0.95rem' }}>
            Every child learns differently. A dedicated 1:1 trial allows the mentor to customize instruction to your child’s unique pace and interests.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.75rem'
        }}>
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 1.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                className="why-card"
              >
                <div style={{
                  width: '2.8rem',
                  height: '2.8rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-dark-text)',
                    marginBottom: '0.5rem'
                  }}>
                    {item.title}
                  </h3>
                  <p className="text-body" style={{ fontSize: '0.88rem', lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
