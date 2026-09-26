import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import LandingHero from './components/LandingHero.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import CourseShowcase from './components/CourseShowcase.jsx';
import MentorShowcase from './components/MentorShowcase.jsx';
import BookingWizard from './components/BookingWizard/BookingWizard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import DevToolbar from './components/DevToolbar.jsx';
import VirtualClassModal from './components/VirtualClassModal.jsx';
import { api } from './services/api.js';

export default function App() {
  const [subjects, setSubjects] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [devStats, setDevStats] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeVirtualClass, setActiveVirtualClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Only activate Dev / Evaluator controls if explicitly requested via ?dev=true or ?test=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true' || params.get('test') === 'true') {
      setIsDevMode(true);
    }
    if (params.get('admin') === 'true') {
      setIsAdminOpen(true);
    }

    // Optional developer shortcut: Ctrl+Shift+D toggles dev controls
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsDevMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadInitialData = async () => {
    try {
      const [subjRes, mentorsRes, statsRes] = await Promise.all([
        api.getSubjects(),
        api.getMentors(),
        api.getDevStats().catch(() => ({ data: null }))
      ]);

      if (subjRes.success) setSubjects(subjRes.data || []);
      if (mentorsRes.success) setMentors(mentorsRes.data || []);
      if (statsRes.success) setDevStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleStartBooking = (subjectId = null) => {
    setSelectedSubjectId(subjectId);
    setIsBookingOpen(true);
    setTimeout(() => {
      const wizardEl = document.getElementById('booking-wizard-container');
      if (wizardEl) {
        wizardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <Navbar
        onOpenBooking={() => handleStartBooking(null)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenDevLab={() => setIsAdminOpen(true)}
        devStats={devStats}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <LandingHero onStartBooking={() => handleStartBooking(null)} />

        {/* Dynamic Booking Wizard (renders when user initiates booking) */}
        {isBookingOpen && (
          <BookingWizard
            subjects={subjects}
            initialSubjectId={selectedSubjectId}
            onClose={() => setIsBookingOpen(false)}
            onJoinClass={(booking) => setActiveVirtualClass(booking)}
          />
        )}

        {/* How It Works Section */}
        <HowItWorks />

        {/* Course Showcase */}
        <CourseShowcase
          subjects={subjects}
          onSelectCourse={(subId) => handleStartBooking(subId)}
        />

        {/* Mentors Showcase */}
        <MentorShowcase
          mentors={mentors}
          subjects={subjects}
        />
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Admin Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            handleRefreshStats();
          }}
          onJoinClass={(booking) => setActiveVirtualClass(booking)}
        />
      )}

      {/* Virtual Classroom Mock Modal */}
      {activeVirtualClass && (
        <VirtualClassModal
          booking={activeVirtualClass}
          onClose={() => setActiveVirtualClass(null)}
        />
      )}

      {/* Development & Evaluator Controls (Hidden from production parent UI, accessible via ?dev=true or Ctrl+Shift+D) */}
      {isDevMode && (
        <DevToolbar
          stats={devStats}
          onRefreshNeeded={handleRefreshStats}
        />
      )}
    </div>
  );
}
