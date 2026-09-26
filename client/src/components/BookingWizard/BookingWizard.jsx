import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Step1ParentDetails from './Step1ParentDetails.jsx';
import Step2SubjectSelect from './Step2SubjectSelect.jsx';
import Step3SubjectInfo from './Step3SubjectInfo.jsx';
import Step4DateTimezone from './Step4DateTimezone.jsx';
import Step5ReviewBooking from './Step5ReviewBooking.jsx';
import Step6Confirmation from './Step6Confirmation.jsx';
import { getDefaultTimezone } from '../../utils/timezones.js';

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
  initialSubjectId, 
  onClose, 
  onJoinClass 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    childName: '',
    subject: initialSubjectId ? subjects.find(s => s.id === initialSubjectId) || null : null,
    parentTimezone: getDefaultTimezone(),
    selectedDate: null,
    selectedSlot: null
  });

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

  return (
    <div id="booking-wizard-container" style={{
      backgroundColor: 'var(--color-bg)',
      padding: '3rem 0 4rem',
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
            <span className="badge badge-teal" style={{ marginBottom: '0.25rem' }}>
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

        {/* Step Progress Pills */}
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
                  width: '1.75rem',
                  height: '1.75rem',
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
                  fontSize: '0.8rem',
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

        {/* Active Step Body */}
        <div>
          {currentStep === 1 && (
            <Step1ParentDetails
              initialData={formData}
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
              subject={formData.subject}
              initialTimezone={formData.parentTimezone}
              initialDate={formData.selectedDate}
              initialSlot={formData.selectedSlot}
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
