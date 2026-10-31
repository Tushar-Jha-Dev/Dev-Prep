import React from 'react';
import { Target, Plus, Trash2, AlertCircle } from 'lucide-react';

/**
 * DevPrep - Goals List Editor Component (`GoalsListEditor.jsx`)
 * Conforms to Design.md & Phase 10 specs:
 * - View mode: Displays goals as clean text items
 * - Edit mode: Add/remove rows, max 10 goals of 150 characters each, no empty rows
 */
export default function GoalsListEditor({
  goals = [],
  onChange,
  maxGoals = 10,
  readOnly = false,
  error = null
}) {
  // View Mode: Clean static list
  if (readOnly) {
    if (!goals || goals.length === 0) {
      return (
        <p className="view-mode-empty">
          No placement goals set yet. Click &quot;Edit Profile&quot; to set target milestones.
        </p>
      );
    }

    return (
      <div className="goals-view-list" role="list" aria-label="Placement Goals">
        {goals.map((goal, idx) => (
          <div key={idx} className="goal-view-item" role="listitem">
            <span className="goal-index-badge mono-text">{idx + 1}</span>
            <Target size={16} className="goal-item-icon" aria-hidden="true" />
            <span className="goal-item-text">{goal}</span>
          </div>
        ))}
      </div>
    );
  }

  // Edit Mode: Add / remove / edit row inputs
  const handleGoalChange = (index, newValue) => {
    const updated = [...goals];
    updated[index] = newValue;
    onChange(updated);
  };

  const handleRemoveRow = (index) => {
    const updated = goals.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleAddRow = () => {
    if (goals.length >= maxGoals) return;
    onChange([...goals, '']);
  };

  return (
    <div className="goals-editor-container">
      <div className="goals-rows-stack" role="list" aria-label="Edit Placement Goals">
        {goals.map((goal, idx) => (
          <div key={idx} className="goal-edit-row" role="listitem">
            <span className="goal-index-badge mono-text">{idx + 1}</span>
            <div className="goal-input-wrapper">
              <input
                type="text"
                value={goal}
                onChange={(e) => handleGoalChange(idx, e.target.value)}
                placeholder="e.g. Crack Google Summer Internship 2026, Solve 150 DSA questions..."
                maxLength={150}
                className={`form-input goal-row-input ${!goal.trim() ? 'goal-input-empty' : ''}`}
                aria-label={`Goal ${idx + 1}`}
              />
              <span className="goal-char-counter mono-text">
                {goal.length}/150
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveRow(idx)}
              className="btn-icon-ghost btn-icon-ghost-danger goal-remove-btn"
              aria-label={`Remove goal ${idx + 1}`}
              title="Remove this goal"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="goals-empty-state">
            <Target size={24} className="goals-empty-icon" aria-hidden="true" />
            <p className="goals-empty-text">
              No placement goals added yet. Click &quot;Add Goal Row&quot; below to define your targets.
            </p>
          </div>
        )}
      </div>

      {/* Add Row Button & Limit Indicator */}
      <div className="goals-editor-footer">
        <button
          type="button"
          onClick={handleAddRow}
          disabled={goals.length >= maxGoals}
          className="btn btn-secondary btn-sm goals-add-row-btn"
        >
          <Plus size={15} aria-hidden="true" />
          <span>Add Goal Row</span>
        </button>

        <span className="goals-count-info mono-text">
          {goals.length} / {maxGoals} goals
        </span>
      </div>

      {/* Component Level Error */}
      {error && (
        <div className="form-error-hint flex-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
