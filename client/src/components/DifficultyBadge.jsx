import React from 'react';

/**
 * DevPrep - Difficulty Badge (`DifficultyBadge.jsx`)
 * Conforms to Design.md Section 2:
 * - Easy: success soft background + success text
 * - Medium: warning soft background + warning text
 * - Hard: danger soft background + danger text
 */
export default function DifficultyBadge({ difficulty }) {
  const normalized = (difficulty || '').toLowerCase();

  let badgeClass = 'badge-easy';
  if (normalized === 'medium') badgeClass = 'badge-medium';
  if (normalized === 'hard') badgeClass = 'badge-hard';

  return (
    <span className={`badge ${badgeClass}`}>
      {difficulty}
    </span>
  );
}
