import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';

/**
 * DevPrep - Skill Tags Input Component (`SkillTagsInput.jsx`)
 * Conforms to Design.md & Phase 10 specs:
 * - Enter or comma adds a tag; x removes one
 * - Trim, ignore duplicates (case-insensitive)
 * - Max 15 tags of 30 characters each
 * - Supports read-only view mode without input/remove buttons
 */
const POPULAR_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'C++',
  'SQL',
  'System Design',
  'Docker',
  'Git',
  'DSA'
];

export default function SkillTagsInput({
  skills = [],
  onChange,
  maxSkills = 15,
  readOnly = false,
  inputRef = null
}) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(null);

  const addSingleTag = (tagToAdd, currentList) => {
    const trimmed = (tagToAdd || '').trim();
    if (!trimmed) return currentList;

    if (trimmed.length > 30) {
      setInputError(`"${trimmed.slice(0, 20)}..." exceeds 30 character limit.`);
      return currentList;
    }

    if (currentList.length >= maxSkills) {
      setInputError(`Maximum of ${maxSkills} skills allowed.`);
      return currentList;
    }

    const exists = currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setInputError(`"${trimmed}" is already added.`);
      return currentList;
    }

    setInputError(null);
    return [...currentList, trimmed];
  };

  const handleAddSkillsFromText = (rawText) => {
    if (readOnly || !onChange) return;
    if (!rawText || !rawText.trim()) return;

    // Split on comma in case user pasted or typed multiple tags
    const fragments = rawText.split(',').map((f) => f.trim()).filter(Boolean);
    let updated = [...skills];

    for (const fragment of fragments) {
      updated = addSingleTag(fragment, updated);
      if (updated.length >= maxSkills) break;
    }

    onChange(updated);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkillsFromText(inputValue);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (inputError) setInputError(null);

    // If comma was typed directly, extract tokens
    if (val.includes(',')) {
      handleAddSkillsFromText(val);
    } else {
      setInputValue(val);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    if (readOnly || !onChange) return;
    onChange(skills.filter((s) => s !== skillToRemove));
    if (inputError) setInputError(null);
  };

  // View Mode: Render clean static tags
  if (readOnly) {
    if (!skills || skills.length === 0) {
      return (
        <p className="view-mode-empty">
          No skills added yet. Click &quot;Edit Profile&quot; to add your technical stack.
        </p>
      );
    }

    return (
      <div className="skills-view-list" role="list" aria-label="Technical Skills">
        {skills.map((skill) => (
          <span key={skill} className="skill-chip skill-chip-readonly" role="listitem">
            {skill}
          </span>
        ))}
      </div>
    );
  }

  // Edit Mode: Dynamic Tag Input
  const availableSuggestions = POPULAR_SKILLS.filter(
    (suggested) => !skills.some((s) => s.toLowerCase() === suggested.toLowerCase())
  );

  return (
    <div className="skills-input-container">
      {/* Current Skill Chips */}
      <div className="skills-chips-list" role="list" aria-label="Selected Technical Skills">
        {skills.map((skill) => (
          <span key={skill} className="skill-chip" role="listitem">
            <span className="skill-chip-text">{skill}</span>
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill)}
              className="skill-chip-remove-btn"
              aria-label={`Remove skill ${skill}`}
              title={`Remove ${skill}`}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </span>
        ))}

        {skills.length === 0 && (
          <span className="skills-empty-hint">
            No technical skills added yet. Type below or choose from suggestions.
          </span>
        )}
      </div>

      {/* Input Row */}
      <div className="skills-add-row">
        <div className="skills-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type skill and press Enter or comma..."
            maxLength={30}
            className="form-input skills-text-input"
            aria-label="New technical skill"
          />
        </div>
        <button
          type="button"
          onClick={() => handleAddSkillsFromText(inputValue)}
          disabled={!inputValue.trim() || skills.length >= maxSkills}
          className="btn btn-secondary btn-sm skills-add-btn"
        >
          <Plus size={15} aria-hidden="true" />
          <span>Add</span>
        </button>
      </div>

      {/* Inline Validation Error */}
      {inputError && (
        <p className="form-error-hint" role="alert">
          {inputError}
        </p>
      )}

      {/* Quick Suggestions */}
      {skills.length < maxSkills && availableSuggestions.length > 0 && (
        <div className="skills-suggestions-box">
          <div className="suggestions-header">
            <Sparkles size={13} className="suggestions-icon" aria-hidden="true" />
            <span className="suggestions-title">Quick Suggestions:</span>
          </div>
          <div className="suggestions-list">
            {availableSuggestions.slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSingleTag(suggestion, skills) && onChange(addSingleTag(suggestion, skills))}
                className="suggestion-pill"
                title={`Add ${suggestion}`}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count Indicator */}
      <div className="skills-count-info mono-text">
        {skills.length} / {maxSkills} skills
      </div>
    </div>
  );
}
