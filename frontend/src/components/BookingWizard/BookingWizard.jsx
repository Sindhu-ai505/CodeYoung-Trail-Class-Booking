import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Check, X, Clock, User, ShieldCheck } from 'lucide-react';
import Step1ParentDetails from './Step1ParentDetails.jsx';
import Step2SubjectSelect from './Step2SubjectSelect.jsx';
import Step3SubjectInfo from './Step3SubjectInfo.jsx';
import Step4DateTimezone from './Step4DateTimezone.jsx';
import Step5ReviewBooking from './Step5ReviewBooking.jsx';
import Step6Confirmation from './Step6Confirmation.jsx';
import BookingErrorBoundary from './BookingErrorBoundary.jsx';
import { getDefaultTimezone, getTimezoneLabel } from '../../utils/timezones.js';

const STEPS = [
  { id: 1, label: 'Parent Details' },
  { id: 2, label: 'Choose Track' },
  { id: 3, label: 'Overview' },
  { id: 4, label: 'Date & Time' },
  { id: 5, label: 'Review' },
  { id: 6, label: 'Confirmed' }
];

export default function BookingWizard({ 
  subjects, 
  mentors = [],
  initialSubjectId, 
  parent,
  onClose, 
  onJoinClass,
  onGoToDashboard,
  onBookingCreated,
  onDateChange
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    parentName: parent?.name || '',
    parentEmail: parent?.email || '',
    childName: '',
    subject: initialSubjectId ? subjects.find(s => s.id === initialSubjectId) || null : null,
    parentTimezone: getDefaultTimezone(),
    selectedDate: null,
    selectedSlot: null
  });

  // Synchronize subject when subjects load or initialSubjectId changes
  useEffect(() => {
    if ((!formData.subject || formData.subject.id !== initialSubjectId) && initialSubjectId && subjects && subjects.length > 0) {
      const found = subjects.find(s => s.id === initialSubjectId);
      if (found) {
        setFormData(prev => ({ ...prev, subject: found }));
      }
    }
  }, [initialSubjectId, subjects]);

  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
    const wizardEl = document.getElementById('booking-wizard-container');
    if (wizardEl) {
      wizardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStep1Next = (parentData) => {
    setFormData(prev => ({ ...prev, ...parentData }));
    // If subject was already pre-selected from landing page, go directly to Step 3 Overview or Step 2
    if (formData.subject) {
      goToStep(3);
    } else {
      goToStep(2);
    }
  };

  const handleStep2Next = (selectedSubject) => {
    setFormData(prev => ({ ...prev, subject: selectedSubject }));
    goToStep(3);
  };

  const handleStep3Next = () => {
    goToStep(4);
  };

  const handleStep4Next = ({ parentTimezone, selectedDate, selectedSlot }) => {
    setFormData(prev => ({ ...prev, parentTimezone, selectedDate, selectedSlot }));
    goToStep(5);
  };

  const handleBookingSuccess = (bookingRecord) => {
    setConfirmedBooking(bookingRecord);
    if (onBookingCreated) {
      onBookingCreated(bookingRecord);
    }
    goToStep(6);
  };

  const handleReset = () => {
    setConfirmedBooking(null);
    setFormData({
      parentName: '',
      parentEmail: '',
      childName: '',
      subject: null,
      parentTimezone: getDefaultTimezone(),
      selectedDate: null,
      selectedSlot: null
    });
    goToStep(1);
  };

  const showSidebar = currentStep >= 2 && currentStep <= 5;

  return (
    <div id="booking-wizard-container" style={{
      backgroundColor: 'var(--color-bg)',
      padding: '3rem 0 4.5rem',
      borderBottom: '1px solid var(--color-border)',
      position: 'relative'
    }}>
      <div className="container">
        {/* Top Header & Close button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div>
            <span className="badge badge-teal" style={{ marginBottom: '0.35rem' }}>
              Step {currentStep} of 6
            </span>
            <h2 className="heading-md" style={{ color: 'var(--color-dark-text)' }}>
              1:1 Live Trial Class Booking
            </h2>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted-text)'
              }}
              title="Close Booking Flow"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '2.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  opacity: isCurrent || isCompleted ? 1 : 0.45,
                  flex: '1 1 auto',
                  minWidth: '100px'
                }}
              >
                <div style={{
                  width: '1.85rem',
                  height: '1.85rem',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'var(--color-border)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {isCompleted ? <Check size={12} strokeWidth={3} /> : s.id}
                </div>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--color-dark-text)' : 'var(--color-muted-text)',
                  whiteSpace: 'nowrap'
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Main Content Grid (Split with Persistent Summary when on steps 2-5) */}
        <div className={showSidebar ? 'booking-split-container' : ''}>
          
          {/* Active Step Form */}
          <div className="booking-main-step">
            <BookingErrorBoundary onReset={() => goToStep(currentStep)}>
              {currentStep === 1 && (
                <Step1ParentDetails
                  initialData={formData}
                  parent={parent}
                  onNext={handleStep1Next}
                />
              )}

              {currentStep === 2 && (
                <Step2SubjectSelect
                  subjects={subjects}
                  selectedSubjectId={formData.subject?.id}
                  childName={formData.childName}
                  onNext={handleStep2Next}
                  onBack={() => goToStep(1)}
                />
              )}

              {currentStep === 3 && (
                <Step3SubjectInfo
                  subject={formData.subject}
                  childName={formData.childName}
                  onNext={handleStep3Next}
                  onBack={() => goToStep(2)}
                />
              )}

              {currentStep === 4 && (
                <Step4DateTimezone
                  subject={formData.subject || (initialSubjectId ? subjects.find(s => s.id === initialSubjectId) : null) || (subjects && subjects.length > 0 ? subjects[0] : null)}
                  mentors={mentors}
                  initialTimezone={formData.parentTimezone}
                  initialDate={formData.selectedDate}
                  initialSlot={formData.selectedSlot}
                  onDateChange={(dateStr) => {
                    setFormData(prev => ({ ...prev, selectedDate: dateStr }));
                    if (onDateChange) {
                      onDateChange(dateStr, formData.parentTimezone);
                    }
                  }}
                  onNext={handleStep4Next}
                  onBack={() => goToStep(3)}
                />
              )}

              {currentStep === 5 && (
                <Step5ReviewBooking
                  formData={formData}
                  onBookingSuccess={handleBookingSuccess}
                  onBack={() => goToStep(4)}
                  onModifySlot={() => goToStep(4)}
                />
              )}

              {currentStep === 6 && (
                <Step6Confirmation
                  booking={confirmedBooking}
                  onNewBooking={handleReset}
                  onJoinClass={onJoinClass}
                  onGoToDashboard={onGoToDashboard}
                />
              )}
            </BookingErrorBoundary>
          </div>

          {/* Persistent "YOUR TRIAL" Summary Card */}
          {showSidebar && (
            <aside className="booking-summary-sidebar">
              <div className="booking-summary-sticky">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <span className="badge badge-teal" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                    YOUR TRIAL
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>
                    100% FREE
                  </span>
                </div>

                {/* Course Track */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                    Selected Course
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-dark-text)', marginTop: '0.15rem' }}>
                    {formData.subject ? formData.subject.title : 'Course Selection'}
                  </div>
                </div>

                {/* Local Schedule in Parent Timezone */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                    Session Time
                  </div>
                  {formData.selectedSlot ? (
                    <div style={{ marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                        {DateTime.fromISO(formData.selectedSlot.utcStart, { zone: formData.parentTimezone }).toFormat('LLL dd, yyyy')}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formData.selectedSlot.parentLocalTime}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-text)' }}>
                        {getTimezoneLabel(formData.parentTimezone)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-light-text)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      {formData.selectedDate ? `Date: ${formData.selectedDate} (Select slot)` : 'Choose date & time in Step 4'}
                    </div>
                  )}
                </div>

                {/* Mentor Assignment (Automatic) */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-muted-text)', fontWeight: 600 }}>
                      Assigned Mentor
                    </div>
                    {formData.selectedSlot?.candidateMentor && (
                      <span className="badge badge-teal" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        Auto-Matched
                      </span>
                    )}
                  </div>
                  {formData.selectedSlot?.candidateMentor ? (
                    <div style={{ marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-dark-text)' }}>
                        {formData.selectedSlot.candidateMentor.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {formData.selectedSlot.candidateMentor.role || 'Senior Coach'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-muted-text)', marginTop: '0.3rem' }}>
                        Mentor's time: <strong>{formData.selectedSlot.mentorLocalTime} (India / IST)</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-light-text)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      Automatically matched in Step 4
                    </div>
                  )}
                </div>

                {/* Session Specifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-muted-text)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Duration:</span>
                    <strong style={{ color: 'var(--color-dark-text)' }}>30 Minutes</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Format:</span>
                    <strong style={{ color: 'var(--color-dark-text)' }}>1:1 Live Interactive</strong>
                  </div>
                  {formData.childName && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Student:</span>
                      <strong style={{ color: 'var(--color-dark-text)' }}>{formData.childName}</strong>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

        </div>
      </div>
    </div>
  );
}
