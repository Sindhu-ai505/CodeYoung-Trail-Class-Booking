import React from 'react';
import { BookOpen, CalendarClock, Video } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: BookOpen,
      title: 'Choose a Course',
      desc: 'Select from 6 specialized learning tracks based on your child’s passion, from Game Design to AI and Robotics.'
    },
    {
      num: '02',
      icon: CalendarClock,
      title: 'Pick a Local Time',
      desc: 'View available slots calculated in your personal timezone with automatic Daylight Saving Time conversion.'
    },
    {
      num: '03',
      icon: Video,
      title: 'Meet Your Mentor',
      desc: 'Our engine pairs you with a qualified mentor under daily limit caps and provides your private 1:1 class link.'
    }
  ];

  return (
    <section id="how-it-works" style={{ padding: '4.5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.75rem' }}>Simple 3-Step Process</span>
          <h2 className="heading-lg" style={{ marginBottom: '0.75rem' }}>How Trial Booking Works</h2>
          <p className="text-body">
            We’ve eliminated long forms, phone spam, and time confusion so your child can get started in seconds.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} style={{
                position: 'relative',
                padding: '2rem',
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={22} />
                  </div>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D9DFE0' }}>
                    {step.num}
                  </span>
                </div>

                <h3 className="heading-sm" style={{ fontSize: '1.15rem' }}>
                  {step.title}
                </h3>
                <p className="text-body" style={{ fontSize: '0.9rem' }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
