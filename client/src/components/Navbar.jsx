import React from 'react';
import { Calendar, ShieldCheck, Wrench, Sparkles } from 'lucide-react';

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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }} className="desktop-nav">
          <a href="#how-it-works" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
            How It Works
          </a>
          <a href="#courses" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
            Courses
          </a>
          <a href="#mentors" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-muted-text)' }}>
            Our 10 Mentors
          </a>
          <button
            onClick={onOpenAdmin}
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-dark-teal)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)'
            }}
            title="View mentor schedules and live booking database"
          >
            <ShieldCheck size={16} />
            Admin & Database
          </button>
        </nav>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onOpenDevLab}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderColor: 'var(--color-warm-yellow)',
              backgroundColor: 'var(--color-soft-yellow)'
            }}
            title="Evaluator test presets for daily limit and error simulation"
          >
            <Wrench size={15} color="#B5580C" />
            <span style={{ fontWeight: 700, color: '#8C6200' }}>Evaluator Lab</span>
            {devStats && (
              <span style={{
                backgroundColor: '#FFFFFF',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-dark-text)'
              }}>
                {devStats.todayBookingsCount}/20
              </span>
            )}
          </button>

          <button
            onClick={onOpenBooking}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <Sparkles size={16} />
            <span>Book Free Trial</span>
          </button>
        </div>
      </div>
    </header>
  );
}
