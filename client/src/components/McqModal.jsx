import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import Modal from './Modal';

const TOPICS = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stack',
  'Queue',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Binary Search'
];

/**
 * DevPrep - Admin MCQ Add/Edit Modal (`McqModal.jsx`)
 * Refactored to leverage the shared portal-based `Modal` component.
 */
export default function McqModal({ isOpen, onClose, onSave, editingMcq, isSaving }) {
  const [topic, setTopic] = useState('Arrays');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [formError, setFormError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Populate form when editing or resetting
  useEffect(() => {
    if (editingMcq) {
      setTopic(editingMcq.topic || 'Arrays');
      setQuestion(editingMcq.question || '');
      setOptions(
        Array.isArray(editingMcq.options) && editingMcq.options.length >= 2
          ? [...editingMcq.options]
          : ['', '', '', '']
      );
      setCorrectIndex(typeof editingMcq.correctIndex === 'number' ? editingMcq.correctIndex : 0);
      setExplanation(editingMcq.explanation || '');
      setFormError(null);
      setIsDirty(false);
    } else {
      setTopic('Arrays');
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
      setExplanation('');
      setFormError(null);
      setIsDirty(false);
    }
  }, [editingMcq, isOpen]);

  // Options Handlers
  function handleOptionChange(index, val) {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
    setIsDirty(true);
    if (formError) setFormError(null);
  }

  function handleAddOption() {
    if (options.length >= 6) return;
    setOptions([...options, '']);
    setIsDirty(true);
  }

  function handleRemoveOption(index) {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    setIsDirty(true);
    
    if (correctIndex === index) {
      setCorrectIndex(0);
    } else if (correctIndex > index) {
      setCorrectIndex(correctIndex - 1);
    }
  }

  // Submit Handler
  function handleSubmit(e) {
    if (e) e.preventDefault();
    setFormError(null);

    if (!question.trim()) {
      setFormError('Question text cannot be empty');
      return;
    }
    if (question.trim().length > 500) {
      setFormError('Question cannot exceed 500 characters');
      return;
    }

    if (options.length < 2 || options.length > 6) {
      setFormError('Must provide between 2 and 6 options');
      return;
    }

    const trimmedOptions = options.map((o) => o.trim());
    for (let i = 0; i < trimmedOptions.length; i++) {
      if (!trimmedOptions[i]) {
        setFormError(`Option ${i + 1} cannot be empty`);
        return;
      }
      if (trimmedOptions[i].length > 200) {
        setFormError(`Option ${i + 1} cannot exceed 200 characters`);
        return;
      }
    }

    const unique = new Set(trimmedOptions.map((o) => o.toLowerCase()));
    if (unique.size !== trimmedOptions.length) {
      setFormError('All options must be unique (duplicate option detected)');
      return;
    }

    if (correctIndex < 0 || correctIndex >= trimmedOptions.length) {
      setFormError('Please select a valid correct option');
      return;
    }

    if (explanation.trim().length > 500) {
      setFormError('Explanation cannot exceed 500 characters');
      return;
    }

    onSave({
      topic,
      question: question.trim(),
      options: trimmedOptions,
      correctIndex,
      explanation: explanation.trim()
    });
  }

  const modalFooter = (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isSaving}
      >
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : editingMcq ? 'Update MCQ' : 'Create MCQ'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMcq ? 'Edit MCQ' : 'Add New MCQ'}
      maxWidth="640px"
      isLoading={isSaving}
      hasUnsavedChanges={isDirty}
      footer={modalFooter}
    >
      <form onSubmit={handleSubmit} className="modal-form-content">
        {formError && (
          <div className="form-alert form-alert-danger" role="alert">
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        {/* Topic Select */}
        <div className="form-group">
          <label htmlFor="mcq-topic-input" className="form-label">
            Topic <span className="required-star">*</span>
          </label>
          <select
            id="mcq-topic-input"
            className="form-select"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setIsDirty(true);
            }}
            disabled={isSaving}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Question Textarea */}
        <div className="form-group">
          <div className="label-with-counter">
            <label htmlFor="mcq-question-input" className="form-label">
              Question <span className="required-star">*</span>
            </label>
            <span className={`char-counter ${question.length > 500 ? 'counter-over' : ''}`}>
              {question.length}/500
            </span>
          </div>
          <textarea
            id="mcq-question-input"
            className="form-textarea"
            rows={3}
            placeholder="e.g. What is the time complexity of searching an element in a Balanced Binary Search Tree?"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setIsDirty(true);
            }}
            disabled={isSaving}
            required
          />
        </div>

        {/* Dynamic Options List */}
        <div className="form-group">
          <div className="label-with-counter">
            <label className="form-label">
              Options & Correct Answer <span className="required-star">*</span>
            </label>
            <span className="char-counter">
              {options.length}/6 options (min 2)
            </span>
          </div>
          <p className="field-hint">
            Select the radio button next to the option that represents the correct answer.
          </p>

          <div className="mcq-options-builder">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className={`mcq-builder-row ${correctIndex === idx ? 'builder-row-correct' : ''}`}
              >
                <label className="option-radio-label" title={`Mark Option ${idx + 1} as correct`}>
                  <input
                    type="radio"
                    name="correct-option-group"
                    checked={correctIndex === idx}
                    onChange={() => {
                      setCorrectIndex(idx);
                      setIsDirty(true);
                    }}
                    disabled={isSaving}
                    className="option-radio-input"
                  />
                  <span className="option-letter-badge">
                    {String.fromCharCode(65 + idx)}
                  </span>
                </label>

                <input
                  type="text"
                  className="form-input mcq-option-input"
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  disabled={isSaving}
                  maxLength={200}
                  required
                />

                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => handleRemoveOption(idx)}
                    disabled={isSaving}
                    title="Remove this option"
                    aria-label={`Remove option ${String.fromCharCode(65 + idx)}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm add-option-btn"
              onClick={handleAddOption}
              disabled={isSaving}
            >
              <Plus size={14} /> Add Another Option
            </button>
          )}
        </div>

        {/* Explanation Textarea */}
        <div className="form-group">
          <div className="label-with-counter">
            <label htmlFor="mcq-explanation-input" className="form-label">
              Explanation <span className="optional-tag">(Optional)</span>
            </label>
            <span className={`char-counter ${explanation.length > 500 ? 'counter-over' : ''}`}>
              {explanation.length}/500
            </span>
          </div>
          <textarea
            id="mcq-explanation-input"
            className="form-textarea"
            rows={2}
            placeholder="Provide context on why this is the correct answer and why common alternatives are incorrect."
            value={explanation}
            onChange={(e) => {
              setExplanation(e.target.value);
              setIsDirty(true);
            }}
            disabled={isSaving}
          />
        </div>
      </form>
    </Modal>
  );
}
