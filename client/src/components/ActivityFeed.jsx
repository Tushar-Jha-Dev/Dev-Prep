import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileCheck2, Clock, Calendar, ChevronRight } from 'lucide-react';

/**
 * Helper to format ISO timestamp into human-readable relative time
 */
function formatTimeAgo(isoString) {
  if (!isoString) return 'Recently';

  try {
    const eventTime = new Date(isoString).getTime();
    if (isNaN(eventTime)) return 'Recently';

    const now = Date.now();
    const diffSeconds = Math.floor((now - eventTime) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (_) {
    return 'Recently';
  }
}

/**
 * DevPrep - Recent Activity Timeline (`ActivityFeed.jsx`)
 * Conforms to Design.md Section 7.2:
 * - Simple vertical list of recent events
 * - Clear relative time markers
 * - Graceful empty state
 */
export default function ActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="activity-empty-box">
        <Clock size={28} className="activity-empty-icon" aria-hidden="true" />
        <p className="activity-empty-text">
          No practice activity recorded yet. Mark your first problem solved or take a mock test to start your timeline!
        </p>
      </div>
    );
  }

  // Display top 6 recent items
  const displayItems = activities.slice(0, 6);

  return (
    <div className="activity-timeline">
      {displayItems.map((item, index) => {
        const isSolved = item.type === 'solved' || !item.type;
        const isMockTest = item.type === 'mock_test';
        const hasAttemptLink = isMockTest && item.attemptId;

        const content = (
          <div className="activity-item-content">
            <span className="activity-text">{item.text || 'Completed practice task'}</span>
            <span className="activity-time mono-text">{formatTimeAgo(item.date)}</span>
          </div>
        );

        return (
          <div key={index} className={`activity-item ${hasAttemptLink ? 'activity-item-clickable' : ''}`}>
            <div className="activity-item-marker">
              {isSolved ? (
                <CheckCircle2 size={16} className="marker-icon marker-icon-solved" aria-hidden="true" />
              ) : (
                <FileCheck2 size={16} className="marker-icon marker-icon-test" aria-hidden="true" />
              )}
            </div>

            {hasAttemptLink ? (
              <Link
                to={`/mock-tests/attempts/${item.attemptId}`}
                className="activity-item-link"
                title="View full assessment scorecard and review"
              >
                {content}
                <ChevronRight size={14} className="activity-link-chevron" aria-hidden="true" />
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
