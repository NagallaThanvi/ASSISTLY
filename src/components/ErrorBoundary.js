import React from 'react';
import { logError, ErrorSeverity } from '../services/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to monitoring service
    logError(error, {
      component: this.props.componentName || 'Unknown',
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack
    }, ErrorSeverity.FATAL);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          color: '#111827',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
        }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Oops! Something went wrong</h1>
          <p style={{ marginBottom: '16px', color: '#4b5563' }}>We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 16px',
              backgroundColor: '#667eea',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;