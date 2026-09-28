import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Database, 
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';

export default function AdminDashboard({ onClose, onJoinClass }) {
  const [mentors, setMentors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mentorsRes, bookingsRes, statsRes] = await Promise.all([
        api.getMentors(),
        api.getAllBookings(),
        api.getDevStats()
      ]);

      if (mentorsRes.success) setMentors(mentorsRes.data || []);
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = bookings.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      b.id.toLowerCase().includes(term) ||
      b.child_name.toLowerCase().includes(term) ||
      b.parent_name.toLowerCase().includes(term) ||
      b.parent_email.toLowerCase().includes(term) ||
      b.mentor_name.toLowerCase().includes(term) ||
      b.subject_title.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(22, 61, 74, 0.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '90vh',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--color-border)'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="heading-sm" style={{ fontSize: '1.15rem' }}>
                Admin & Operations Dashboard
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-muted-text)' }}>
                Inspect real-time mentor schedules, daily 2-class limits, and persistent SQLite bookings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '0.4rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-muted-text)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div style={{ padding: '1.75rem', overflowY: 'auto' }}>
          {/* Quick Stats Banner */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', border: '1px solid #D5E5E5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  Today's Bookings (IST)
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-dark-teal)' }}>
                  {stats.todayBookingsCount} / 20
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>
                  Max 20 bookings across 10 mentors
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-soft-yellow)', border: '1px solid #FFE7A3' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8A5900', textTransform: 'uppercase' }}>
                  Total System Mentors
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8A5900' }}>
                  {stats.totalMentors} Active Mentors
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8A5900' }}>
                  Timezone: {stats.mentorTimezone}
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted-text)', textTransform: 'uppercase' }}>
                  All-Time SQLite Bookings
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-dark-text)' }}>
                  {stats.totalAllTimeBookings} Recorded
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-text)' }}>
                  Persisted in appointments.db
                </div>
              </div>
            </div>
          )}

          {/* Mentors Table */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users size={18} color="var(--color-primary)" />
              <h3 className="heading-sm" style={{ fontSize: '1.05rem' }}>
                All 10 Mentors & Today's Limits ({stats?.todayDateIst || 'IST'})
              </h3>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Mentor Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Specialization</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Timezone</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Working Hours</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>Today's Classes</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((m) => {
                    const isLimit = m.bookingsToday >= m.maxDailyClasses;
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{m.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-muted-text)' }}>{m.role}</td>
                        <td style={{ padding: '0.75rem 1rem' }}><code>{m.timezone}</code></td>
                        <td style={{ padding: '0.75rem 1rem' }}>10:00 AM – 8:00 PM</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700 }}>
                          <span style={{ color: isLimit ? 'var(--color-error)' : 'var(--color-primary)' }}>
                            {m.bookingsToday} / {m.maxDailyClasses}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {isLimit ? (
                            <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>
                              Daily Limit Reached
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bookings Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={18} color="var(--color-primary)" />
                <h3 className="heading-sm" style={{ fontSize: '1.05rem' }}>
                  Confirmed Trial Appointments ({bookings.length})
                </h3>
              </div>

              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search student, mentor, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.82rem' }}
                />
                <Search size={15} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-muted-text)', fontSize: '0.9rem' }}>
                No booking records match your search.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>ID</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Student / Parent</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Subject</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Parent Local Time</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Assigned Mentor</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Mentor IST Time</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, textAlign: 'center' }}>Dummy Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.65rem 0.85rem' }}><code>{b.id}</code></td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <div style={{ fontWeight: 700 }}>{b.child_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)' }}>{b.parent_name} ({b.parent_email})</div>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>{b.subject_title}</td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <div>{b.parent_local_datetime}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)' }}>{b.parent_timezone}</div>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {b.mentor_name}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          {b.mentor_local_date} at {b.mentor_local_time}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              onClose();
                              onJoinClass({
                                bookingId: b.id,
                                childName: b.child_name,
                                subject: { title: b.subject_title },
                                mentorTime: { mentorName: b.mentor_name },
                                parentTime: { formatted: b.parent_local_datetime }
                              });
                            }}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                            title="Open dummy live classroom"
                          >
                            <ExternalLink size={12} /> Test Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
