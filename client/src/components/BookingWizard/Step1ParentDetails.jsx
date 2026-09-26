import React, { useState } from 'react';
import { User, Mail, Smile, ArrowRight } from 'lucide-react';

export default function Step1ParentDetails({ initialData, onNext }) {
  const [parentName, setParentName] = useState(initialData.parentName || '');
  const [parentEmail, setParentEmail] = useState(initialData.parentEmail || '');
  const [childName, setChildName] = useState(initialData.childName || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!parentName.trim()) {
      errs.parentName = 'Please enter parent full name';
    }
    if (!parentEmail.trim()) {
      errs.parentEmail = 'Please enter parent email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      errs.parentEmail = 'Please provide a valid email address';
    }
    if (!childName.trim()) {
      errs.childName = "Please enter child's name";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext({
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        childName: childName.trim()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>Parent & Student Information</h2>
        <p className="text-body" style={{ fontSize: '0.9rem' }}>
          Tell us about yourself and who is taking the class. We will send the trial access details to your email.
        </p>
      </div>

      {/* Parent Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="parentName">
          Parent / Guardian Full Name *
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="parentName"
            type="text"
            className={`form-input ${errors.parentName ? 'error' : ''}`}
            placeholder="e.g. Jessica Miller"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <User size={18} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        {errors.parentName && <span className="form-error-msg">{errors.parentName}</span>}
      </div>

      {/* Parent Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="parentEmail">
          Parent Email Address *
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="parentEmail"
            type="email"
            className={`form-input ${errors.parentEmail ? 'error' : ''}`}
            placeholder="e.g. jessica.miller@example.com"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Mail size={18} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        {errors.parentEmail && <span className="form-error-msg">{errors.parentEmail}</span>}
        <span className="text-xs" style={{ color: 'var(--color-muted-text)', marginTop: '0.2rem' }}>
          Your confirmation and dummy classroom link will be sent here.
        </span>
      </div>

      {/* Child Name */}
      <div className="form-group" style={{ marginBottom: '1.75rem' }}>
        <label className="form-label" htmlFor="childName">
          Child / Student's First Name *
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="childName"
            type="text"
            className={`form-input ${errors.childName ? 'error' : ''}`}
            placeholder="e.g. Ethan"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Smile size={18} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
        {errors.childName && <span className="form-error-msg">{errors.childName}</span>}
      </div>



      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
      >
        <span>Continue to Choose a Course</span>
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
