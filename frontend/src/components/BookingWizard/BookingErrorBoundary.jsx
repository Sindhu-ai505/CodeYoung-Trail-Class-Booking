import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class BookingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[BookingErrorBoundary] Caught render exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid #FECACA',
          boxShadow: 'var(--shadow-sm)',
          maxWidth: '640px',
          margin: '2rem auto'
        }}>
          <AlertCircle size={36} color="var(--color-error)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-dark-text)', marginBottom: '0.5rem' }}>
            Unable to load date & time selection.
          </h3>
          <p className="text-body" style={{ fontSize: '0.88rem', color: 'var(--color-muted-text)', marginBottom: '1.5rem' }}>
            We encountered an unexpected issue while rendering this step. Please try again or return to step overview.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem', gap: '0.4rem', display: 'inline-flex', alignItems: 'center' }}
            >
              <RefreshCw size={14} />
              <span>Retry Step</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
