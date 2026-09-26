import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenBooking, onOpenAdmin, onOpenDevLab, devStats }) {
  return (
    <header style={{
      backgroundColor: 'rgba(250, 250, 248, 0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.5rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(49, 95, 97, 0.3)'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-dark-text)', letterSpacing: '-0.02em' }}>
                Codeyoung
              </span>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-orange)',
                display: 'inline-block'
              }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-muted-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trial Booking
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
          <a href="#how-it-works" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
            How It Works
          </a>
          <a href="#courses" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
            Courses
          </a>
          <a href="#mentors" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
            Our Mentors
          </a>
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onOpenBooking}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.4rem' }}
          >
            <Sparkles size={16} />
            <span>Book Free Trial</span>
          </button>
        </div>
      </div>
    </header>
  );
}
