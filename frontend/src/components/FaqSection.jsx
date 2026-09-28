import React, { useState } from 'react';
import { ChevronDown, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Is the 30-minute trial class really 100% free?',
    a: 'Yes, absolutely. The trial class is completely free of charge. No credit card or payment information is ever collected or required.'
  },
  {
    q: 'What hardware and software are required for the session?',
    a: 'All you need is a computer or laptop with a working webcam, microphone, and modern web browser (Google Chrome, Safari, or Edge) with a stable internet connection.'
  },
  {
    q: 'How does mentor assignment work?',
    a: 'When you select your course and local time slot, our scheduling algorithm automatically matches your student with an expert educator in India specialized in that exact subject, within mentor operating hours (10:00 AM – 8:00 PM IST).'
  },
  {
    q: 'What if we need to change or reschedule our class?',
    a: 'You can easily log back into your Parent Dashboard anytime using your registered email to view your booked trial details or schedule a replacement session.'
  }
];

export default function FaqSection({ onStartBooking }) {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="section scroll-reveal" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header" style={{ maxWidth: '620px', margin: '0 auto 2.25rem', textAlign: 'center' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.45rem' }}>
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '0.65rem' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-body" style={{ fontSize: '0.95rem' }}>
            Everything parents need to know about our 1:1 trial class experience and scheduling process.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div style={{ maxWidth: '720px', margin: '0 auto 2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${isOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isOpen ? '0 4px 14px rgba(40, 92, 94, 0.08)' : 'var(--shadow-sm)'
                }}
              >
                <button
                  onClick={() => toggle(idx)}
                  style={{
                    width: '100%',
                    padding: '1.2rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: isOpen ? 'var(--color-primary)' : 'var(--color-dark-text)'
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                      color: isOpen ? 'var(--color-primary)' : 'var(--color-muted-text)'
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    color: 'var(--color-muted-text)',
                    borderTop: '1px solid var(--color-surface-hover)'
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final Warm CTA Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.75rem 2rem',
          textAlign: 'center',
          maxWidth: '820px',
          margin: '0 auto',
          boxShadow: '0 8px 30px rgba(23, 59, 70, 0.06)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--color-soft-yellow)',
            color: 'var(--color-dark-teal)',
            padding: '0.4rem 0.95rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} color="var(--color-orange)" />
            <span>Start Today • Zero Cost Trial</span>
          </div>

          <h2 className="heading-lg" style={{ marginBottom: '0.75rem' }}>
            Ready to ignite your child's coding potential?
          </h2>

          <p className="text-body" style={{ maxWidth: '540px', margin: '0 auto 1.75rem', fontSize: '1rem' }}>
            Book a 30-minute 1:1 live session with an experienced mentor at a convenient time in your local timezone.
          </p>

          <button
            onClick={() => onStartBooking(null)}
            className="btn btn-primary"
            style={{
              fontSize: '1.05rem',
              padding: '0.85rem 2.25rem'
            }}
          >
            <span>Book a FREE Trial</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </section>
  );
}
