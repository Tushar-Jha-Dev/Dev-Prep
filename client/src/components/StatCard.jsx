import React from 'react';

/**
 * DevPrep - StatCard Component (`StatCard.jsx`)
 * Conforms strictly to Design.md Section 6:
 * - Small uppercase muted label on top
 * - Large Fraunces number below (34px, weight 600)
 * - Optional one-line muted note
 * - Flat styling (no icon boxes, no gradients)
 */
export default function StatCard({ label, value, subnote, icon: Icon, tag }) {
  return (
    <div className="card stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {tag && <span className="stat-card-tag">{tag}</span>}
        {Icon && <Icon size={16} className="stat-card-icon" aria-hidden="true" />}
      </div>

      <div className="stat-card-value-wrap">
        <span className="stat-card-value font-heading font-fraunces">{value}</span>
      </div>

      {subnote && (
        <span className="stat-card-subnote">{subnote}</span>
      )}
    </div>
  );
}
