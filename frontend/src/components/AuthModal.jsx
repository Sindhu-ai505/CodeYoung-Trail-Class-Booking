import React, { useState } from 'react';
import { X, Mail, User, ArrowRight, RefreshCw, AlertCircle, Sparkles, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import { api } from '../services/api.js';
import { validateEmail, INVALID_EMAIL_MESSAGE } from '../utils/validation.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialRole = 'parent', initialEmail = '' }) {
  const [activeTab, setActiveTab] = useState(initialRole); // 'parent' | 'mentor'
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState('');
  const [mentorIdentifier, setMentorIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const validateParent = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return false;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(INVALID_EMAIL_MESSAGE);
      return false;
    }
    return true;
  };

  const validateMentor = () => {
    const trimmedId = mentorIdentifier.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your mentor ID or Codeyoung email.');
      return false;
    }
    return true;
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateParent()) return;

    setLoading(true);
    try {
      const response = await api.login({
        role: 'parent',
        email: email.trim(),
        name: name.trim()
      });

      if (response.success && response.parent) {
        onAuthSuccess({
          role: 'parent',
          parent: response.parent,
          isNew: response.isNew,
          token: response.token
        });
      } else {
        throw new Error(response.message || 'Unable to sign in at this time.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      if (err.code === 'NAME_REQUIRED') {
        setErrorMessage('Welcome! Since this is your first time here, please enter your name above.');
      } else if (err.code === 'INVALID_EMAIL') {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage(err.message || 'We could not sign you in right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMentorSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateMentor()) return;

    setLoading(true);
    try {
      const response = await api.mentorLogin({
        identifier: mentorIdentifier.trim()
      });

      if (response.success && response.mentor) {
        onAuthSuccess({
          role: 'mentor',
          mentor: response.mentor,
          token: response.token
        });
      } else {
        throw new Error(response.message || 'Unable to sign in as mentor.');
      }
    } catch (err) {
      console.error('Mentor authentication error:', err);
      if (err.code === 'MENTOR_NOT_FOUND') {
        setErrorMessage('Mentor account not found. Check your mentor ID or Codeyoung email and try again.');
      } else {
        setErrorMessage(err.message || 'Mentor account not found. Check your mentor ID or Codeyoung email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(22, 61, 74, 0.55)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.25rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '2rem',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(22, 61, 74, 0.2)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: '#FFFFFF'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            padding: '0.4rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-surface-hover)',
            color: 'var(--color-muted-text)'
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Role Toggle Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-md)',
          padding: '0.25rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--color-border)'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('parent');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'parent' ? 700 : 500,
              backgroundColor: activeTab === 'parent' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'parent' ? 'var(--color-primary)' : 'var(--color-muted-text)',
              boxShadow: activeTab === 'parent' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={16} />
            <span>Parent</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mentor');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: activeTab === 'mentor' ? 700 : 500,
              backgroundColor: activeTab === 'mentor' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'mentor' ? 'var(--color-primary)' : 'var(--color-muted-text)',
              boxShadow: activeTab === 'mentor' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <GraduationCap size={16} />
            <span>Mentor Portal</span>
          </button>
        </div>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src="/assets/logo.png" 
            alt="CodeYoung Logo" 
            style={{
              height: '56px',
              width: 'auto',
              objectFit: 'contain',
              margin: '0 auto 0.75rem',
              display: 'block'
            }}
          />

          <h3 className="heading-md" style={{ marginBottom: '0.25rem', color: 'var(--color-dark-text)' }}>
            {activeTab === 'parent' ? 'Parent Sign In & Registration' : 'Mentor Workspace Sign In'}
          </h3>
          <p className="text-body" style={{ fontSize: '0.84rem', color: 'var(--color-muted-text)' }}>
            {activeTab === 'parent'
              ? "Enter your details to access your booked trial classes and child's schedule."
              : 'Sign in with your mentor ID or Codeyoung email to view your assigned 1:1 trials.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: PARENT FORM */}
        {activeTab === 'parent' && (
          <form onSubmit={handleParentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="auth-email">
                Parent Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={loading}
                  autoFocus
                />
                <Mail size={18} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--color-muted-text)', marginTop: '0.25rem', display: 'block' }}>
                Returning parents are recognized automatically by email.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="auth-name">
                Parent / Guardian Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={loading}
                />
                <User size={18} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--color-muted-text)', marginTop: '0.25rem', display: 'block' }}>
                Required for first-time parent registration.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.35rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="spin" />
                  <span>Verifying account...</span>
                </>
              ) : (
                <>
                  <span>Continue to Dashboard</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: MENTOR FORM */}
        {activeTab === 'mentor' && (
          <form onSubmit={handleMentorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="mentor-identifier">
                Mentor ID or Codeyoung Email *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="mentor-identifier"
                  type="text"
                  className="form-input"
                  placeholder="Enter mentor_XX or your Codeyoung email"
                  value={mentorIdentifier}
                  onChange={(e) => setMentorIdentifier(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={loading}
                  autoFocus
                />
                <GraduationCap size={18} color="var(--color-muted-text)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--color-muted-text)', marginTop: '0.35rem', display: 'block' }}>
                Enter the mentor ID assigned to you or your registered Codeyoung email.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.35rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="spin" />
                  <span>Signing in as mentor...</span>
                </>
              ) : (
                <>
                  <span>Enter Mentor Workspace</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          marginTop: '1.4rem',
          fontSize: '0.75rem',
          color: 'var(--color-muted-text)'
        }}>
          <ShieldCheck size={14} color="var(--color-success)" />
          <span>Secure session • No password required</span>
        </div>
      </div>
    </div>
  );
}
