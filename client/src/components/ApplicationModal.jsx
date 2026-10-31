import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import Modal from './Modal';

const STATUS_OPTIONS = ['Applied', 'Interview', 'Selected', 'Rejected'];

/**
 * DevPrep - Add/Edit Application Modal (`ApplicationModal.jsx`)
 * Refactored to leverage the shared portal-based `Modal` component.
 */
export default function ApplicationModal({
  isOpen,
  initialData = null,
  isLoading = false,
  onSave,
  onClose
}) {
  const isEdit = Boolean(initialData?.id);

  // Form State
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Populate or reset form when opened or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCompany(initialData.company || '');
        setRole(initialData.role || '');
        setLocation(initialData.location || '');
        setAppliedDate(initialData.appliedDate || '');
        setStatus(initialData.status || STATUS_OPTIONS[0]);
        setNotes(initialData.notes || '');
      } else {
        setCompany('');
        setRole('');
        setLocation('');
        const today = new Date().toISOString().split('T')[0];
        setAppliedDate(today);
        setStatus(STATUS_OPTIONS[0]);
        setNotes('');
      }
      setFieldErrors({});
      setSubmitError(null);
      setIsDirty(false);
    }
  }, [isOpen, initialData]);

  async function handleSubmit(e) {
    if (e) e.preventDefault();

    // Client-side validation
    const errors = {};
    if (!company.trim()) errors.company = 'Company name is required';
    if (!role.trim()) errors.role = 'Role or position is required';
    if (!appliedDate.trim()) errors.appliedDate = 'Applied date is required';
    if (!STATUS_OPTIONS.includes(status)) errors.status = 'Please select a valid status';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);

    const payload = {
      company: company.trim(),
      role: role.trim(),
      location: location.trim(),
      appliedDate: appliedDate.trim(),
      status,
      notes: notes.trim()
    };

    try {
      await onSave(payload);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save application');
    }
  }

  const modalFooter = (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isLoading}
      >
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        <Save size={16} />
        {isLoading ? 'Saving...' : isEdit ? 'Update Application' : 'Save Application'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Application' : 'Add New Application'}
      maxWidth="600px"
      isLoading={isLoading}
      hasUnsavedChanges={isDirty}
      footer={modalFooter}
    >
      <form onSubmit={handleSubmit} className="modal-form-content">
        {submitError && (
          <div className="form-alert form-alert-danger" role="alert">
            <AlertCircle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Company & Role Row */}
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="app-company" className="form-label">
              Company Name <span className="required-star">*</span>
            </label>
            <input
              id="app-company"
              type="text"
              className={`form-input ${fieldErrors.company ? 'form-input-error' : ''}`}
              placeholder="e.g. Google, Microsoft, Uber"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setIsDirty(true);
                if (fieldErrors.company) {
                  setFieldErrors((prev) => ({ ...prev, company: null }));
                }
              }}
              disabled={isLoading}
              required
            />
            {fieldErrors.company && (
              <span className="field-error-text">{fieldErrors.company}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="app-role" className="form-label">
              Role / Position <span className="required-star">*</span>
            </label>
            <input
              id="app-role"
              type="text"
              className={`form-input ${fieldErrors.role ? 'form-input-error' : ''}`}
              placeholder="e.g. SDE Intern, Graduate Engineer"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setIsDirty(true);
                if (fieldErrors.role) {
                  setFieldErrors((prev) => ({ ...prev, role: null }));
                }
              }}
              disabled={isLoading}
              required
            />
            {fieldErrors.role && (
              <span className="field-error-text">{fieldErrors.role}</span>
            )}
          </div>
        </div>

        {/* Location & Applied Date Row */}
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="app-location" className="form-label">
              Location
            </label>
            <input
              id="app-location"
              type="text"
              className="form-input"
              placeholder="e.g. Bengaluru, Remote, Hyderabad"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setIsDirty(true);
              }}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="app-applied-date" className="form-label">
              Applied Date <span className="required-star">*</span>
            </label>
            <input
              id="app-applied-date"
              type="date"
              className={`form-input ${fieldErrors.appliedDate ? 'form-input-error' : ''}`}
              value={appliedDate}
              onChange={(e) => {
                setAppliedDate(e.target.value);
                setIsDirty(true);
                if (fieldErrors.appliedDate) {
                  setFieldErrors((prev) => ({ ...prev, appliedDate: null }));
                }
              }}
              disabled={isLoading}
              required
            />
            {fieldErrors.appliedDate && (
              <span className="field-error-text">{fieldErrors.appliedDate}</span>
            )}
          </div>
        </div>

        {/* Status Selection */}
        <div className="form-group">
          <label htmlFor="app-status" className="form-label">
            Application Status <span className="required-star">*</span>
          </label>
          <select
            id="app-status"
            className="form-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setIsDirty(true);
            }}
            disabled={isLoading}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="app-notes" className="form-label">
            Notes & Interview Details
          </label>
          <textarea
            id="app-notes"
            rows={3}
            className="form-textarea"
            placeholder="e.g. Round 1 DSA cleared. Technical interview on React scheduled for next week..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setIsDirty(true);
            }}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
}
