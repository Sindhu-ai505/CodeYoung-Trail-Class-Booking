import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import LandingHero from './components/LandingHero.jsx';
import TrustStrip from './components/TrustStrip.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import CourseShowcase from './components/CourseShowcase.jsx';
import MentorShowcase from './components/MentorShowcase.jsx';
import TimezoneGuide from './components/TimezoneGuide.jsx';
import Why1on1 from './components/Why1on1.jsx';
import FaqSection from './components/FaqSection.jsx';
import BookingWizard from './components/BookingWizard/BookingWizard.jsx';
import ParentDashboard from './components/ParentDashboard.jsx';
import MentorDashboard from './components/MentorDashboard.jsx';
import AuthModal from './components/AuthModal.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import DevToolbar from './components/DevToolbar.jsx';
import VirtualClassModal from './components/VirtualClassModal.jsx';
import ClassroomErrorBoundary from './components/ClassroomErrorBoundary.jsx';
import { api } from './services/api.js';

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [devStats, setDevStats] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeVirtualClass, setActiveVirtualClass] = useState(null);
  const [activeClassroomId, setActiveClassroomId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.pathname.match(/^\/(?:class|classroom)\/([^\/?#]+)/);
    return match ? match[1] : null;
  });
  const [isDevMode, setIsDevMode] = useState(false);

  // Authentication & View State (Role-Aware)
  const [userRole, setUserRole] = useState(null); // 'parent' | 'mentor' | null
  const [parent, setParent] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState('parent');
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'dashboard' | 'mentor-dashboard' | 'booking'
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Load catalog and check active authenticated session
  useEffect(() => {
    // Dev params check
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true' || params.get('test') === 'true') {
      setIsDevMode(true);
    }
    if (params.get('admin') === 'true') {
      setIsAdminOpen(true);
    }

    // Ctrl+Shift+D dev toggle
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsDevMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Initial data load & session recovery
    const initialize = async () => {
      try {
        const [subjRes, mentorsRes, statsRes] = await Promise.all([
          api.getSubjects().catch(() => ({ success: false, data: [] })),
          api.getMentors().catch(() => ({ success: false, data: [] })),
          api.getDevStats().catch(() => ({ success: false, data: null }))
        ]);

        if (subjRes.success) setSubjects(subjRes.data || []);
        if (mentorsRes.success) setMentors(mentorsRes.data || []);
        if (statsRes.success) setDevStats(statsRes.data || null);

        // Check existing authenticated session via HTTP-only cookie
        try {
          const authRes = await api.getCurrentSession();
          const path = window.location.pathname;
          const classMatch = path.match(/^\/(?:class|classroom)\/([^\/?#]+)/);
          if (classMatch) {
            setActiveClassroomId(classMatch[1]);
          }

          if (authRes.success) {
            if (authRes.role === 'mentor' && authRes.mentor) {
              // Authenticated Mentor session
              setUserRole('mentor');
              setMentor(authRes.mentor);
              setParent(null);
              setCurrentView('mentor-dashboard');
              setIsBookingOpen(false);
              if (!classMatch && path !== '/mentor-dashboard') {
                window.history.replaceState({ view: 'mentor-dashboard' }, '', '/mentor-dashboard');
              }
            } else if (authRes.role === 'parent' && authRes.parent) {
              // Authenticated Parent session
              setUserRole('parent');
              setParent(authRes.parent);
              setMentor(null);
              if (path === '/book') {
                setCurrentView('booking');
                setIsBookingOpen(true);
              } else {
                setCurrentView('dashboard');
                setIsBookingOpen(false);
                if (!classMatch && path !== '/dashboard') {
                  window.history.replaceState({ view: 'dashboard' }, '', '/dashboard');
                }
              }
            }
          } else {
            // Unauthenticated user
            setUserRole(null);
            setParent(null);
            setMentor(null);
            if (path === '/dashboard' || path === '/mentor-dashboard') {
              setAuthModalInitialRole(path === '/mentor-dashboard' ? 'mentor' : 'parent');
              setIsAuthModalOpen(true);
              window.history.replaceState({}, '', '/login');
            } else if (path === '/login') {
              setIsAuthModalOpen(true);
            }
          }
        } catch (authErr) {
          const path = window.location.pathname;
          const classMatch = path.match(/^\/(?:class|classroom)\/([^\/?#]+)/);
          if (classMatch) {
            setActiveClassroomId(classMatch[1]);
          } else if (path === '/dashboard' || path === '/mentor-dashboard') {
            setAuthModalInitialRole(path === '/mentor-dashboard' ? 'mentor' : 'parent');
            setIsAuthModalOpen(true);
            window.history.replaceState({}, '', '/login');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setSessionChecking(false);
      }
    };

    initialize();

    // Listen for browser back / forward navigation
    const handlePopState = () => {
      const path = window.location.pathname;
      const classMatch = path.match(/^\/(?:class|classroom)\/([^\/?#]+)/);
      if (classMatch) {
        setActiveClassroomId(classMatch[1]);
        return;
      }
      setActiveClassroomId(null);
      setActiveVirtualClass(null);

      if (path === '/mentor-dashboard') {
        setCurrentView('mentor-dashboard');
        setIsBookingOpen(false);
      } else if (path === '/dashboard') {
        setCurrentView('dashboard');
        setIsBookingOpen(false);
      } else if (path === '/book') {
        setCurrentView('booking');
        setIsBookingOpen(true);
      } else if (path === '/login') {
        setIsAuthModalOpen(true);
      } else {
        setCurrentView('landing');
        setIsBookingOpen(false);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Purposeful, subtle scroll-reveal observer for landing page major sections
  useEffect(() => {
    if (currentView !== 'landing' || isBookingOpen) return;

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        el.classList.add('reveal-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [currentView, isBookingOpen]);

  // When user clicks "Book Free Trial" or selects a course
  const handleStartBookingFlow = (subjectId = null) => {
    setSelectedSubjectId(subjectId);
    if (!parent) {
      setAuthModalInitialRole('parent');
      setIsAuthModalOpen(true);
    } else {
      setCurrentView('booking');
      setIsBookingOpen(true);
      if (window.location.pathname !== '/book') {
        window.history.pushState({ view: 'booking' }, '', '/book');
      }
      setTimeout(() => {
        const wizardEl = document.getElementById('booking-wizard-container');
        if (wizardEl) wizardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // When user submits AuthModal (Parent or Mentor)
  const handleAuthSuccess = ({ role, parent: authedParent, mentor: authedMentor, isNew }) => {
    setIsAuthModalOpen(false);

    if (role === 'mentor' && authedMentor) {
      // Mentor flow -> Mentor Dashboard
      setUserRole('mentor');
      setMentor(authedMentor);
      setParent(null);
      setCurrentView('mentor-dashboard');
      setIsBookingOpen(false);
      if (window.location.pathname !== '/mentor-dashboard') {
        window.history.pushState({ view: 'mentor-dashboard' }, '', '/mentor-dashboard');
      }
      return;
    }

    // Parent flow
    setUserRole('parent');
    setParent(authedParent);
    setMentor(null);

    if (isNew) {
      setCurrentView('booking');
      setIsBookingOpen(true);
      if (window.location.pathname !== '/book') {
        window.history.pushState({ view: 'booking' }, '', '/book');
      }
      setTimeout(() => {
        const wizardEl = document.getElementById('booking-wizard-container');
        if (wizardEl) wizardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      setCurrentView('dashboard');
      setIsBookingOpen(false);
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
      }
    }
  };

  // When user clicks "Logout"
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUserRole(null);
      setParent(null);
      setMentor(null);
      setCurrentView('landing');
      setIsBookingOpen(false);
      if (window.location.pathname !== '/') {
        window.history.pushState({ view: 'landing' }, '', '/');
      }
    }
  };

  // When parent clicks "Book Another Trial" from dashboard
  const handleBookAnotherTrial = () => {
    setSelectedSubjectId(null);
    setCurrentView('booking');
    setIsBookingOpen(true);
    if (window.location.pathname !== '/book') {
      window.history.pushState({ view: 'booking' }, '', '/book');
    }
    setTimeout(() => {
      const wizardEl = document.getElementById('booking-wizard-container');
      if (wizardEl) wizardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // When a booking has been confirmed
  const handleBookingConfirmed = (booking) => {
    setCurrentView('dashboard');
    setIsBookingOpen(false);
    if (window.location.pathname !== '/dashboard') {
      window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
    }
  };

  const handleNavigateHome = () => {
    setCurrentView('landing');
    setIsBookingOpen(false);
    if (window.location.pathname !== '/') {
      window.history.pushState({ view: 'landing' }, '', '/');
    }
  };

  const handleRefreshStats = async () => {
    try {
      const [statsRes, mentorsRes] = await Promise.all([
        api.getDevStats(),
        api.getMentors()
      ]);
      if (statsRes.success) setDevStats(statsRes.data);
      if (mentorsRes.success) setMentors(mentorsRes.data);
    } catch (err) {
      // ignore
    }
  };

  const handleDateChange = async (dateStr, tz) => {
    try {
      const statsRes = await api.getDevStats({ date: dateStr, timezone: tz });
      if (statsRes.success && statsRes.data) {
        setDevStats(statsRes.data);
      }
    } catch (err) {
      // ignore
    }
  };

  // When a user clicks "Join Class" (Parent, Mentor, Confirmation, or Admin)
  const handleJoinClass = (booking) => {
    if (!booking) return;
    const bId = booking.id || booking.bookingId;
    setActiveVirtualClass(booking);
    setActiveClassroomId(bId);
    if (bId && !window.location.pathname.startsWith('/class/') && !window.location.pathname.startsWith('/classroom/')) {
      window.history.pushState({ view: 'classroom', bookingId: bId }, '', `/class/${bId}`);
    }
  };

  // When a user leaves or closes the Virtual Classroom
  const handleCloseClassroom = () => {
    setActiveVirtualClass(null);
    setActiveClassroomId(null);
    setIsBookingOpen(false);

    if (userRole === 'mentor') {
      setCurrentView('mentor-dashboard');
      if (window.location.pathname !== '/mentor-dashboard') {
        window.history.pushState({ view: 'mentor-dashboard' }, '', '/mentor-dashboard');
      }
    } else if (userRole === 'parent' || parent) {
      setCurrentView('dashboard');
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
      }
    } else {
      setCurrentView('landing');
      if (window.location.pathname !== '/') {
        window.history.pushState({ view: 'landing' }, '', '/');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        parent={parent}
        mentor={mentor}
        userRole={userRole}
        currentView={currentView}
        onOpenLogin={() => {
          setAuthModalInitialRole('parent');
          setIsAuthModalOpen(true);
        }}
        onOpenDashboard={() => {
          setCurrentView('dashboard');
          setIsBookingOpen(false);
          if (window.location.pathname !== '/dashboard') {
            window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
          }
        }}
        onOpenMentorDashboard={() => {
          setCurrentView('mentor-dashboard');
          setIsBookingOpen(false);
          if (window.location.pathname !== '/mentor-dashboard') {
            window.history.pushState({ view: 'mentor-dashboard' }, '', '/mentor-dashboard');
          }
        }}
        onOpenBooking={() => handleStartBookingFlow(null)}
        onLogout={handleLogout}
        onNavigateHome={handleNavigateHome}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* VIEW 1: MENTOR DASHBOARD */}
        {currentView === 'mentor-dashboard' && userRole === 'mentor' && mentor && (
          <MentorDashboard
            mentor={mentor}
            onLogout={handleLogout}
            onJoinClass={handleJoinClass}
          />
        )}

        {/* VIEW 2: PARENT DASHBOARD */}
        {currentView === 'dashboard' && userRole === 'parent' && parent && (
          <ParentDashboard
            parent={parent}
            onLogout={handleLogout}
            onBookAnotherTrial={handleBookAnotherTrial}
            onJoinClass={handleJoinClass}
          />
        )}

        {/* VIEW 3: BOOKING WIZARD (Accessible by parents/guests; mentor is excluded) */}
        {(currentView === 'booking' || isBookingOpen) && userRole !== 'mentor' && (
          <BookingWizard
            subjects={subjects}
            mentors={mentors}
            initialSubjectId={selectedSubjectId}
            parent={parent}
            onClose={() => {
              setIsBookingOpen(false);
              setCurrentView(parent ? 'dashboard' : 'landing');
              if (window.location.pathname !== (parent ? '/dashboard' : '/')) {
                window.history.pushState({}, '', parent ? '/dashboard' : '/');
              }
            }}
            onJoinClass={handleJoinClass}
            onGoToDashboard={handleBookingConfirmed}
            onBookingCreated={handleRefreshStats}
            onDateChange={handleDateChange}
          />
        )}

        {/* VIEW 4: LANDING PAGE */}
        {currentView === 'landing' && !isBookingOpen && (
          <>
            {/* Logged in notification banner for Mentor */}
            {userRole === 'mentor' && mentor && (
              <div style={{
                backgroundColor: 'var(--color-primary-light)',
                borderBottom: '1px solid #D5E5E5',
                padding: '0.65rem 0',
                fontSize: '0.85rem',
                textAlign: 'center',
                color: 'var(--color-dark-teal)'
              }}>
                <span>Signed in as Mentor <strong>{mentor.name}</strong> ({mentor.email}). </span>
                <button
                  onClick={() => {
                    setCurrentView('mentor-dashboard');
                    window.history.pushState({ view: 'mentor-dashboard' }, '', '/mentor-dashboard');
                  }}
                  style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'underline', marginLeft: '0.35rem', cursor: 'pointer' }}
                >
                  Return to Mentor Workspace &rarr;
                </button>
              </div>
            )}

            {/* Logged in notification banner for Parent */}
            {userRole === 'parent' && parent && (
              <div style={{
                backgroundColor: 'var(--color-primary-light)',
                borderBottom: '1px solid #D5E5E5',
                padding: '0.65rem 0',
                fontSize: '0.85rem',
                textAlign: 'center',
                color: 'var(--color-dark-teal)'
              }}>
                <span>Signed in as <strong>{parent.name}</strong> ({parent.email}). </span>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    window.history.pushState({ view: 'dashboard' }, '', '/dashboard');
                  }}
                  style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'underline', marginLeft: '0.35rem', cursor: 'pointer' }}
                >
                  Return to Your Dashboard &rarr;
                </button>
              </div>
            )}

            <LandingHero subjects={subjects} onStartBooking={(subId) => handleStartBookingFlow(subId)} />
            <Why1on1 />
            <HowItWorks />
            <CourseShowcase
              subjects={subjects}
              mentors={mentors}
              onSelectCourse={(subId) => handleStartBookingFlow(subId)}
            />
            <MentorShowcase
              mentors={mentors}
              subjects={subjects}
            />
            <TimezoneGuide />
            <TrustStrip devStats={devStats} />
            <FaqSection onStartBooking={(subId) => handleStartBookingFlow(subId)} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Role-Aware Welcome & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialRole={authModalInitialRole}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Admin / Evaluator Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            handleRefreshStats();
          }}
          onJoinClass={handleJoinClass}
        />
      )}

      {/* Virtual Classroom Modal (Accessed by both Parent and Mentor) */}
      {(activeVirtualClass || activeClassroomId) && (
        <ClassroomErrorBoundary
          onReset={() => {
            setActiveVirtualClass(null);
          }}
          onBackToDashboard={handleCloseClassroom}
        >
          <VirtualClassModal
            booking={activeVirtualClass}
            bookingId={activeClassroomId || activeVirtualClass?.id || activeVirtualClass?.bookingId}
            parent={parent}
            mentor={mentor}
            userRole={userRole}
            onClose={handleCloseClassroom}
            onBackToDashboard={handleCloseClassroom}
          />
        </ClassroomErrorBoundary>
      )}

      {/* Development & Evaluator Controls */}
      {isDevMode && (
        <DevToolbar
          stats={devStats}
          onRefreshNeeded={handleRefreshStats}
        />
      )}
    </div>
  );
}
