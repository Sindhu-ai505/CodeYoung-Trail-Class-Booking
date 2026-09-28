import React from 'react';
import { Calendar, UserCheck, CheckCircle2, Video } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: Calendar,
      title: 'Choose a Convenient Time',
      desc: 'Pick your preferred date and time in your local timezone. Our engine automatically calculates available slots without confusion.'
    },
    {
      num: '02',
      icon: UserCheck,
      title: 'We Match You with a Mentor',
      desc: 'The system pairs your child with a qualified mentor based on subject expertise, working hours, and our strict 2-class daily capacity limit.'
    },
    {
      num: '03',
      icon: CheckCircle2,
      title: 'Confirm Your Trial Class',
      desc: 'Review your complete booking summary with dual timezone visibility (both your local time and your mentor’s India time).'
    },
    {
      num: '04',
      icon: Video,
      title: 'Join Your Live Class',
      desc: 'Receive instant confirmation and your private 1:1 virtual classroom link. Launch directly from your parent dashboard when class begins.'
    }
  ];

  return (
    <section id="how-it-works" className="scroll-reveal" style={{ padding: '5rem 0', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.85rem' }}>
            Seamless 4-Step Process
          </span>
          <h2 className="heading-lg" style={{ marginBottom: '0.85rem' }}>
            How Trial Booking Works
          </h2>
          <p className="text-body">
            From local timezone selection to automated mentor matching, every step is designed to give you complete transparency and a hassle-free start.
          </p>
        </div>

        {/* 4-Step Grid */}
        <div className="how-it-works-grid">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="how-step-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="how-step-icon-wrap">
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <span className="how-step-num">
                    {step.num}
                  </span>
                </div>

                <div>
                  <h3 className="heading-sm" style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                    {step.title}
                  </h3>
                  <p className="text-body" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
