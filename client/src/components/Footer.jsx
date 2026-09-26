import React from 'react';
import { Calendar, ShieldCheck, Globe, Clock, Heart } from 'lucide-react';

export default function Footer({ onOpenAdmin }) {
  return (
    <footer style={{
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--color-border)',
      padding: '3.5rem 0 2rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={16} />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                Codeyoung
              </span>
            </div>
            <p className="text-body" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              1:1 personalized live trial classes in Coding, AI, Robotics, and Web Development taught by expert mentors based in India.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>
              <ShieldCheck size={14} color="var(--color-primary)" />
              <span>Full-Stack Trial Class Evaluation System</span>
            </div>
          </div>

          {/* Operational & Timezone Policy */}
          <div>
            <h4 className="heading-sm" style={{ fontSize: '0.95rem', marginBottom: '0.85rem' }}>
              Operational Architecture
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={13} color="var(--color-primary)" />
                <span>Mentor Hours: 10:00 AM – 8:00 PM IST</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={13} color="var(--color-primary)" />
                <span>Mentor Timezone: Asia/Kolkata</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={13} color="var(--color-primary)" />
                <span>Capacity Rule: Max 2 classes / mentor / day</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={13} color="var(--color-primary)" />
                <span>System Cap: 20 trial classes total / day</span>
              </li>
            </ul>
          </div>

          {/* Why Codeyoung */}
          <div>
            <h4 className="heading-sm" style={{ fontSize: '0.95rem', marginBottom: '0.85rem' }}>
              Why Codeyoung
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--color-muted-text)' }}>
              <li>• Personalized 1:1 live instruction</li>
              <li>• Interactive hands-on project creation</li>
              <li>• Comprehensive student skill assessment</li>
              <li>• Seamless international timezone scheduling</li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--color-light-text)'
        }}>
          <div>
            © {new Date().getFullYear()} Codeyoung. All rights reserved.
          </div>
          <div>
            1:1 Live Trial Class Appointment Booking
          </div>
        </div>
      </div>
    </footer>
  );
}
