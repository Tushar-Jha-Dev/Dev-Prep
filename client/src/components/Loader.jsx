import React from 'react';

/**
 * DevPrep - Loading State Indicator (`Loader.jsx`)
 * Conforms to Design.md: "simple text 'Loading...' with a small CSS spinner"
 */
export default function Loader({ message = 'Loading...', fullPage = false }) {
  return (
    <div className={`loader-container ${fullPage ? 'loader-fullpage' : ''}`} role="status">
      <div className="spinner" aria-hidden="true"></div>
      <span className="loader-text">{message}</span>
    </div>
  );
}
