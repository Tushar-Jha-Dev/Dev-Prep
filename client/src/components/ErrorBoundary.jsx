import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * DevPrep - React Error Boundary Component (`ErrorBoundary.jsx`)
 * Conforms to User Guidelines & Design.md:
 * - Catches any unhandled render-time exceptions in wrapped route trees
 * - Displays a themed card ("Something went wrong on this page")
 * - Features "Try again" (resets state) and "Go to Dashboard" buttons
 * - Logs errors and componentStack exclusively to console.error (never in the UI)
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console only; never show stack traces in UI
    console.error('ErrorBoundary caught an unhandled page exception:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoDashboard = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" role="alert">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper" aria-hidden="true">
              <AlertTriangle size={26} strokeWidth={2} />
            </div>
            <h2 className="error-boundary-title">Something went wrong on this page</h2>
            <p className="error-boundary-desc">
              An unexpected error occurred while rendering this view. You can try reloading or head back to the dashboard.
            </p>
            <div className="error-boundary-actions">
              <button
                type="button"
                onClick={this.handleTryAgain}
                className="btn btn-secondary"
              >
                <RotateCcw size={16} />
                <span>Try again</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoDashboard}
                className="btn btn-primary"
              >
                <Home size={16} />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
