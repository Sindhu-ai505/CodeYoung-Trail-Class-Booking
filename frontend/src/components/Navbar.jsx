import React, { useState } from 'react';
import { Calendar, Sparkles, User, LogOut, LayoutDashboard, Menu, X, ArrowRight, Clock, Globe, GraduationCap } from 'lucide-react';

export default function Navbar({ 
  parent,
  mentor,
  userRole,
  currentView,
  onOpenLogin,
  onOpenDashboard,
  onOpenMentorDashboard,
  onOpenBooking,
  onLogout,
  onNavigateHome
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    if (currentView !== 'landing') {
      onNavigateHome();
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{
      backgroundColor: 'rgba(250, 250, 248, 0.96)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.75rem'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={onNavigateHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          title="Codeyoung Trial Booking"
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigateHome(); }}
        >
          <img 
            src="/assets/logo.png" 
            alt="CodeYoung Logo" 
            className="brand-logo-img"
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-dark-text)', letterSpacing: '-0.025em' }}>
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
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted-text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              1:1 Live Trial Booking
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
          <button
            onClick={() => handleNavClick('how-it-works')}
            style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-muted-text)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-muted-text)'}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('courses')}
            style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-muted-text)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-muted-text)'}
          >
            Courses
          </button>
          <button
            onClick={() => handleNavClick('mentors')}
            style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-muted-text)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-muted-text)'}
          >
            Our Mentors
          </button>
          <button
            onClick={() => handleNavClick('timezone-guide')}
            style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--color-muted-text)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--color-muted-text)'}
          >
            Timezone Guide
          </button>
        </nav>

        {/* Desktop Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }} className="desktop-nav">
          {userRole === 'mentor' && mentor ? (
            /* Logged In Mentor Controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={onOpenMentorDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: currentView === 'mentor-dashboard' ? 'var(--color-primary-light)' : '#FFFFFF',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-dark-text)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="View your mentor workspace"
              >
                <GraduationCap size={16} color="var(--color-primary)" />
                <span>Mentor: {mentor.name?.split(' ')[0] || 'Workspace'}</span>
              </button>

              <button
                onClick={onLogout}
                style={{
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-muted-text)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer'
                }}
                title="Sign out of mentor account"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : parent ? (
            /* Logged In Parent Controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={onOpenDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: currentView === 'dashboard' ? 'var(--color-primary-light)' : '#FFFFFF',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-dark-text)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="View your booked trial classes"
              >
                <LayoutDashboard size={16} color="var(--color-primary)" />
                <span>{parent.name?.split(' ')[0] || 'Parent'}'s Dashboard</span>
              </button>

              <button
                onClick={onOpenBooking}
                className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
              >
                <Sparkles size={15} />
                <span>Book Trial</span>
              </button>

              <button
                onClick={onLogout}
                style={{
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-muted-text)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer'
                }}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            /* Guest / Unauthenticated Controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={onOpenLogin}
                className="btn btn-secondary"
                style={{ padding: '0.62rem 1.2rem', fontSize: '0.9rem' }}
              >
                <User size={15} />
                <span>Sign In</span>
              </button>

              <button
                onClick={onOpenBooking}
                className="btn btn-primary"
                style={{ padding: '0.62rem 1.35rem', fontSize: '0.9rem' }}
              >
                <Sparkles size={16} />
                <span>Book a FREE Trial</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          style={{
            display: 'none',
            padding: '0.6rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border)',
            color: 'var(--color-dark-text)'
          }}
          className="mobile-menu-btn"
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1.5px solid var(--color-border)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => handleNavClick('how-it-works')}
              style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 600, color: 'var(--color-dark-text)', padding: '0.4rem 0' }}
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('courses')}
              style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 600, color: 'var(--color-dark-text)', padding: '0.4rem 0' }}
            >
              Courses
            </button>
            <button
              onClick={() => handleNavClick('mentors')}
              style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 600, color: 'var(--color-dark-text)', padding: '0.4rem 0' }}
            >
              Our Mentors
            </button>
            <button
              onClick={() => handleNavClick('timezone-guide')}
              style={{ textAlign: 'left', fontSize: '1rem', fontWeight: 600, color: 'var(--color-dark-text)', padding: '0.4rem 0' }}
            >
              Timezone Guide
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {userRole === 'mentor' && mentor ? (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenMentorDashboard(); }}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <GraduationCap size={16} color="var(--color-primary)" />
                  <span>Mentor: {mentor.name?.split(' ')[0] || 'Workspace'}</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  style={{ fontSize: '0.85rem', color: 'var(--color-error)', fontWeight: 600, padding: '0.4rem 0', textAlign: 'center' }}
                >
                  Sign Out
                </button>
              </>
            ) : parent ? (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenDashboard(); }}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LayoutDashboard size={16} color="var(--color-primary)" />
                  <span>{parent.name?.split(' ')[0] || 'Parent'}'s Dashboard</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenBooking(); }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={16} />
                  <span>Book Trial Class</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  style={{ fontSize: '0.85rem', color: 'var(--color-error)', fontWeight: 600, padding: '0.4rem 0', textAlign: 'center' }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenBooking(); }}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={16} />
                  <span>Book a FREE Trial</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <User size={15} />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick CSS media query helper for mobile menu button visibility */}
      <style>{`
        @media (max-width: 992px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
