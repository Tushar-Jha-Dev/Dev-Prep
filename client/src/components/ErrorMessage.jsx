import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * DevPrep - Error Message Component (`ErrorMessage.jsx`)
 * Conforms to Design.md: "error = message plus Retry"
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-card" role="alert">
      <div className="error-content">
        <AlertCircle size={20} className="error-icon" aria-hidden="true" />
        <span className="error-text">{message || 'An unexpected error occurred'}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm error-retry-btn">
          <RotateCcw size={14} aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
