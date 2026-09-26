import React, { useState } from 'react';
import { Wrench, ChevronUp, ChevronDown, RefreshCw, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { api } from '../services/api.js';

export default function DevToolbar({ stats, onRefreshNeeded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSeedDailyLimit = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await api.seedMentorLimit('ai_ml');
      setStatusMsg('Seeded 2 bookings for all AI & ML mentors! Next AI booking will trigger MENTOR_DAILY_LIMIT_REACHED.');
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      setStatusMsg('Failed to seed limit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSystemCapacity = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await api.seedCapacityLimit();
      setStatusMsg(`System filled to full 20-class capacity! Next booking will trigger DAILY_CAPACITY_REACHED.`);
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      setStatusMsg('Failed to seed capacity: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoSchedule = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await api.seedDemoSchedule();
      setStatusMsg('Loaded realistic baseline schedule! Mentors now have staggered busy hours & Aarav Sharma has reached his daily limit.');
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      setStatusMsg('Failed to load demo schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      await api.resetDevData();
      setStatusMsg('Database reset! All mentors now have 0/2 bookings.');
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      setStatusMsg('Failed to reset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside aria-label="Evaluator Controls" style={{
      position: 'fixed',
      bottom: '1.25rem',
      right: '1.25rem',
      zIndex: 90,
      maxWidth: '380px'
    }}>
      {/* Floating Toggle Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-dark-teal)',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(22, 61, 74, 0.3)',
            fontWeight: 700,
            fontSize: '0.82rem',
            border: '1.5px solid var(--color-warm-yellow)'
          }}
          title="Open Evaluator Error Simulator"
        >
          <Wrench size={16} color="var(--color-warm-yellow)" />
          <span>Evaluator Test Presets</span>
          {stats && (
            <span style={{
              backgroundColor: 'var(--color-warm-yellow)',
              color: 'var(--color-dark-text)',
              padding: '0.1rem 0.45rem',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {stats.todayBookingsCount}/20
            </span>
          )}
        </button>
      )}

      {/* Expanded Control Box */}
      {isOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-dark-teal)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
              <Wrench size={15} color="var(--color-warm-yellow)" />
              <span>Evaluator Test Lab (Development)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ color: '#FFFFFF', opacity: 0.8 }}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="text-xs" style={{ color: 'var(--color-muted-text)', margin: 0 }}>
              Instantly seed scenarios into the real SQLite database to verify error handling without manual booking:
            </p>

            {statusMsg && (
              <div style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid #CCE5E5',
                fontSize: '0.75rem',
                color: 'var(--color-dark-teal)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem'
              }}>
                <Check size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* Load Realistic Demo Schedule */}
            <button
              onClick={handleLoadDemoSchedule}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.78rem',
                padding: '0.5rem',
                justifyContent: 'flex-start',
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Load Realistic Schedule (Dynamic Mentors & Limits)</span>
            </button>

            {/* Seed 2-class mentor limit */}
            <button
              onClick={handleSeedDailyLimit}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.78rem',
                padding: '0.5rem',
                justifyContent: 'flex-start',
                borderColor: '#FFD9A0'
              }}
            >
              <AlertTriangle size={14} color="var(--color-warning)" />
              <span>Fill Daily Limit (2/2) for AI & ML Mentors</span>
            </button>

            {/* Seed 20-capacity limit */}
            <button
              onClick={handleSeedSystemCapacity}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.78rem',
                padding: '0.5rem',
                justifyContent: 'flex-start',
                borderColor: '#F5C6C6'
              }}
            >
              <ShieldAlert size={14} color="var(--color-error)" />
              <span>Fill All 10 Mentors to Max (20/20 Classes)</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.78rem',
                padding: '0.5rem',
                justifyContent: 'flex-start'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Reset All Bookings to Clean State (0/20)</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
