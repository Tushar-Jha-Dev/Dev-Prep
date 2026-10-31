import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * DevPrep - Shared Empty State Component (`EmptyState.jsx`)
 * Conforms to Design.md Section 6:
 * "empty = one sentence plus a primary action."
 * 
 * Used across:
 * - Problems Library (empty search/filter results)
 * - Applications Tracker (empty applications / filtered status)
 * - Mock Tests (no past attempts / no questions for topic)
 * - Dashboard (empty activity feed)
 */
export default function EmptyState({
  icon: Icon = HelpCircle,
  title,
  message,
  actionLabel,
  onAction,
  actionHref,
  className = ''
}) {
  return (
    <div className={`empty-state-card ${className}`} role="status">
      <div className="empty-state-icon-wrapper" aria-hidden="true">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      {title && <h3 className="empty-state-title">{title}</h3>}
      {message && <p className="empty-state-message">{message}</p>}
      {actionLabel && (
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="btn btn-primary btn-sm empty-state-btn"
          >
            {actionLabel}
          </button>
        ) : actionHref ? (
          <a
            href={actionHref}
            className="btn btn-primary btn-sm empty-state-btn"
          >
            {actionLabel}
          </a>
        ) : null
      )}
    </div>
  );
}
