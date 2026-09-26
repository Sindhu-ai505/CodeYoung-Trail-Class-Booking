import React from 'react';
import { Sparkles, CheckCircle2, Clock, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingHero({ onStartBooking }) {
  return (
    <section style={{
      padding: '4rem 0 3.5rem',
      backgroundColor: 'var(--color-bg)',
      borderBottom: '1px solid var(--color-border)'
    }}>
      <div className="container">
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          {/* Trust Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            border: '1px solid #D5E5E5'
          }}>
            <Sparkles size={14} />
            <span>Interactive 1:1 Live Learning • Zero Cost Trial</span>
          </div>

          {/* Main Heading */}
          <h1 className="heading-xl" style={{ marginBottom: '1.25rem' }}>
            Book a 1:1 Live Trial Class <br />
            <span style={{ color: 'var(--color-primary)' }}>for Your Child</span>
          </h1>

          {/* Subheading */}
          <p className="text-body" style={{ fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 2rem', color: 'var(--color-muted-text)' }}>
            Choose a subject your child loves, select a convenient slot in your local timezone, and meet an inspiring expert mentor for a personalized 30-minute demo.
          </p>

          {/* Value Props Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1.75rem',
            marginBottom: '2.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-dark-text)' }}>
              <Clock size={16} color="var(--color-primary)" />
              <span>30-Minute Live Demo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-dark-text)' }}>
              <Users size={16} color="var(--color-primary)" />
              <span>Dedicated 1:1 Expert Mentor</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-dark-text)' }}>
              <ShieldCheck size={16} color="var(--color-primary)" />
              <span>No Phone Number Required</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={onStartBooking}
              className="btn btn-primary"
              style={{
                fontSize: '1.05rem',
                padding: '0.85rem 2rem',
                boxShadow: '0 4px 16px rgba(49, 95, 97, 0.25)'
              }}
            >
              <span>Book Your Free Trial</span>
              <ArrowRight size={18} />
            </button>
            <a
              href="#how-it-works"
              className="btn btn-secondary"
              style={{ fontSize: '1rem', padding: '0.85rem 1.6rem' }}
            >
              How It Works
            </a>
          </div>

          {/* Reassurance note */}
          <p className="text-xs" style={{ marginTop: '1.25rem', color: 'var(--color-light-text)' }}>
            Available for children ages 6–18 • Instant confirmation with dummy virtual classroom link
          </p>
        </div>
      </div>
    </section>
  );
}
