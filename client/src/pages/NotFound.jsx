import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, ArrowLeft } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * DevPrep - 404 Page Not Found Component (`NotFound.jsx`)
 */
export default function NotFound() {
  useDocumentTitle('Page Not Found');

  return (
    <div className="not-found-container" role="main">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-desc">
          The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={16} />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
