import React from 'react';

/**
 * DevPrep - Shared Accessible Progress Bar Component (`ProgressBar.jsx`)
 * Conforms to Design.md Section 6 & User Requirements:
 * - props:
 *   - percent: Whole number from 0 to 100
 *   - label: Header label on the left
 *   - value: Right-aligned value string (e.g. "1/2 (50%)")
 *   - current / solved, total: Optional fallbacks for deriving percent and value
 * - Layout:
 *   - Header row with label on the left and value on the right in mono font
 *   - Track on its own line below with 6px gap
 *   - Fill uses var(--accent) with min-width: 4px when percent > 0
 *   - Smooth 300ms transition
 *   - role="progressbar" with aria-valuenow, aria-valuemin, aria-valuemax
 */
export default function ProgressBar({
  percent,
  percentage,
  current,
  solved,
  total,
  label,
  value,
  className = ''
}) {
  // Determine standard integer percentage (0 to 100)
  let calculatedPercent = 0;
  const rawPercent = percent !== undefined ? percent : percentage;

  if (rawPercent !== undefined && rawPercent !== null) {
    const num = Number(rawPercent);
    calculatedPercent = Number.isFinite(num) ? Math.max(0, Math.min(100, Math.round(num))) : 0;
  } else {
    const solvedCount = current !== undefined ? Number(current) : (solved !== undefined ? Number(solved) : 0);
    const totalCount = total !== undefined ? Number(total) : 0;
    calculatedPercent = totalCount > 0 ? Math.max(0, Math.min(100, Math.round((solvedCount / totalCount) * 100))) : 0;
  }

  // Derive right-aligned display value if not explicitly passed
  let displayValue = value;
  if (!displayValue) {
    const displayCount = current !== undefined ? current : solved;
    if (displayCount !== undefined && total !== undefined) {
      displayValue = `${displayCount}/${total} (${calculatedPercent}%)`;
    } else if (rawPercent !== undefined && rawPercent !== null) {
      displayValue = `${calculatedPercent}%`;
    }
  }

  return (
    <div className={`progress-bar-wrapper ${className}`}>
      {(label || displayValue) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {displayValue && (
            <span className="progress-bar-value mono-text">{displayValue}</span>
          )}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${calculatedPercent}%`,
            minWidth: calculatedPercent > 0 ? '4px' : '0'
          }}
          role="progressbar"
          aria-valuenow={calculatedPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={label || 'Progress'}
        />
      </div>
    </div>
  );
}
