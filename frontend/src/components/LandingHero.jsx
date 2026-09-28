import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Users, 
  ShieldCheck, 
  Code2, 
  Globe, 
  Brain, 
  Cpu, 
  Gamepad2, 
  Binary,
  Compass,
  Award,
  ChevronRight
} from 'lucide-react';

const ICON_MAP = {
  Code2,
  Globe,
  Brain,
  Cpu,
  Gamepad2,
  Binary
};

// Course layout metadata matching the reference visual composition exactly:
// 6 authentic Codeyoung courses mapped to their respective orbital quadrant
const ORBIT_TAXONOMY_MAP = [
  {
    id: 'coding_programming',
    defaultTitle: 'Coding & Programming',
    displayName: 'Coding',
    icon: Code2,
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    posClass: 'orbit-pos-top'
  },
  {
    id: 'algorithms_math',
    defaultTitle: 'Algorithms & Math Thinking',
    displayName: 'Algorithms & Math',
    icon: Binary,
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    posClass: 'orbit-pos-upper-left'
  },
  {
    id: 'game_development',
    defaultTitle: 'Game Development',
    displayName: 'Game Dev',
    icon: Gamepad2,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#EDE9FE',
    posClass: 'orbit-pos-upper-right'
  },
  {
    id: 'web_development',
    defaultTitle: 'Web Development',
    displayName: 'Web Dev',
    icon: Globe,
    color: '#0D9488',
    bgColor: '#F0FDFA',
    borderColor: '#CCFBF1',
    posClass: 'orbit-pos-lower-left'
  },
  {
    id: 'ai_ml',
    defaultTitle: 'AI & Machine Learning',
    displayName: 'AI & ML',
    icon: Brain,
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#D1FAE5',
    posClass: 'orbit-pos-lower-right'
  },
  {
    id: 'robotics',
    defaultTitle: 'Robotics & Hardware Logic',
    displayName: 'Robotics',
    icon: Cpu,
    color: '#E11D48',
    bgColor: '#FFF1F2',
    borderColor: '#FFE4E6',
    posClass: 'orbit-pos-bottom'
  }
];

export default function LandingHero({ subjects = [], onStartBooking }) {
  // Synchronize dynamically with backend subjects taxonomy as single source of truth
  const coursesToRender = ORBIT_TAXONOMY_MAP.map(item => {
    const backendMatch = subjects.find(s => s.id === item.id);
    const ResolvedIcon = backendMatch?.iconName && ICON_MAP[backendMatch.iconName]
      ? ICON_MAP[backendMatch.iconName]
      : item.icon;

    return {
      ...item,
      fullTitle: backendMatch ? backendMatch.title : item.defaultTitle,
      icon: ResolvedIcon
    };
  });

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          
          {/* LEFT COLUMN: HERO VALUE PROPOSITION */}
          <div className="hero-content">
            {/* Small Eyebrow Badge */}
            <div className="badge badge-teal">
              <Sparkles size={14} color="var(--color-primary)" />
              <span>Interactive 1:1 Live Mentorship • Zero Cost Trial</span>
            </div>

            {/* Confident, Elegant Headline */}
            <h1 className="heading-xl hero-headline">
              Book a 1:1 trial with the right mentor, <br />
              <span style={{ color: 'var(--color-primary)' }}>at a time that works for you.</span>
            </h1>

            {/* Short Supporting Description */}
            <p className="hero-desc">
              Personalized 30-minute trial classes guided by expert mentors in India. 
              Enjoy effortless scheduling with intelligent timezone conversion and automatic 
              Daylight Saving Time (DST) matching.
            </p>

            {/* Call To Action Buttons */}
            <div className="hero-cta-group">
              <button
                onClick={() => onStartBooking(null)}
                className="btn btn-primary"
                style={{
                  fontSize: '1.05rem',
                  padding: '0.85rem 2rem',
                  boxShadow: '0 4px 18px rgba(49, 95, 97, 0.28)'
                }}
              >
                <span>Book a FREE Trial</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="#courses"
                className="btn btn-secondary"
                style={{ fontSize: '1rem', padding: '0.85rem 1.6rem' }}
              >
                <span>Explore Courses</span>
              </a>
            </div>

            {/* Small Trust & Value Indicators */}
            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <ShieldCheck size={16} color="var(--color-primary)" />
                <span>100% Free Trial</span>
              </div>
              <div className="hero-trust-item">
                <Clock size={16} color="var(--color-primary)" />
                <span>30-Min Live Demo</span>
              </div>
              <div className="hero-trust-item">
                <Users size={16} color="var(--color-primary)" />
                <span>India-Based Mentors</span>
              </div>
              <div className="hero-trust-item">
                <Compass size={16} color="var(--color-primary)" />
                <span>Local Timezone Matching</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ORBITAL LEARNING COMPOSITION (REFERENCE MATCH) */}
          <div className="hero-visual">
            
            {/* Desktop Orbital Composition */}
            <div className="hero-orbit-stage">
              {/* 3 Subtle Concentric Orbit Rings */}
              <div className="orbit-ring-1" />
              <div className="orbit-ring-2" />
              <div className="orbit-ring-3" />

              {/* Subtle animated inward connector rays */}
              <svg className="orbit-connectors-svg" viewBox="0 0 500 500" aria-hidden="true">
                <line x1="250" y1="36" x2="250" y2="162" className="orbit-connector-line" />
                <line x1="82" y1="126" x2="185" y2="205" className="orbit-connector-line" />
                <line x1="418" y1="126" x2="315" y2="205" className="orbit-connector-line" />
                <line x1="82" y1="374" x2="185" y2="295" className="orbit-connector-line" />
                <line x1="418" y1="374" x2="315" y2="295" className="orbit-connector-line" />
                <line x1="250" y1="464" x2="250" y2="338" className="orbit-connector-line" />
              </svg>

              {/* Central Mentorship Disc (Compact Circular Anchor with Gentle Breathing) */}
              <div className="orbit-center-disc">
                <div className="orbit-center-badge">
                  <Award size={20} strokeWidth={2.4} />
                </div>
                <div className="orbit-center-title">
                  1:1 Live<br />Mentorship
                </div>
                <div className="orbit-center-tag">
                  CERTIFIED EDUCATORS
                </div>
              </div>

              {/* 6 Real Course Cards (Floating Pills Arranged Around Orbit) */}
              {coursesToRender.map((course) => {
                const Icon = course.icon;
                return (
                  <div
                    key={course.id}
                    className={`orbit-pill-card ${course.posClass}`}
                    onClick={() => onStartBooking(course.id)}
                    title={`Book a free trial in ${course.fullTitle}`}
                    role="button"
                    tabIndex={0}
                    style={{ borderColor: course.borderColor }}
                    onKeyDown={(e) => { if (e.key === 'Enter') onStartBooking(course.id); }}
                  >
                    <div 
                      className="orbit-pill-icon" 
                      style={{ backgroundColor: course.bgColor, color: course.color }}
                    >
                      <Icon size={16} strokeWidth={2.4} />
                    </div>
                    <span className="orbit-pill-label" style={{ color: course.color }}>
                      {course.displayName}
                    </span>
                    <ChevronRight size={13} className="orbit-pill-arrow" />
                  </div>
                );
              })}
            </div>

            {/* Mobile / Tablet Friendly Adaptive Layout (< 992px) */}
            <div className="orbit-mobile-grid">
              {/* Mobile Central Anchor */}
              <div className="orbit-center-disc" style={{ position: 'static', transform: 'none', margin: '0 auto', boxShadow: 'var(--shadow-md)' }}>
                <div className="orbit-center-badge">
                  <Award size={20} strokeWidth={2.4} />
                </div>
                <div className="orbit-center-title">1:1 Live<br />Mentorship</div>
                <div className="orbit-center-tag">CERTIFIED EDUCATORS</div>
              </div>

              {/* Mobile Courses Grid */}
              <div className="orbit-mobile-cards">
                {coursesToRender.map((course) => {
                  const Icon = course.icon;
                  return (
                    <div
                      key={course.id}
                      onClick={() => onStartBooking(course.id)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: `1.5px solid ${course.borderColor}`,
                        borderRadius: 'var(--radius-full)',
                        padding: '0.65rem 1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{
                        width: '2.1rem',
                        height: '2.1rem',
                        borderRadius: '50%',
                        backgroundColor: course.bgColor,
                        color: course.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={16} strokeWidth={2.4} />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: course.color }}>
                        {course.fullTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
