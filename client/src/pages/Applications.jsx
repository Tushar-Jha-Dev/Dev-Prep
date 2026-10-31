import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Briefcase,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ApplicationModal from '../components/ApplicationModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STATUS_OPTIONS = ['Applied', 'Interview', 'Selected', 'Rejected'];

/**
 * DevPrep - Job & Internship Tracker Page (`Applications.jsx`)
 * Conforms to Design.md Section 7.8:
 * - 4 status count chips at top (plus All)
 * - Search plus status filter in responsive toolbar
 * - Table with Company, Role, Location, Applied Date, Status badge, Edit/Delete
 * - Loading, error, and empty states
 * - Modal for Add/Edit with inline validation
 * - Accessible Delete confirmation modal
 */
export default function Applications() {
  useDocumentTitle('Applications');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification
  const [notification, setNotification] = useState(null);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Load applications
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Status aggregation counts computed from user's full list
  const statusCounts = {
    All: applications.length,
    Applied: applications.filter((a) => a.status === 'Applied').length,
    Interview: applications.filter((a) => a.status === 'Interview').length,
    Selected: applications.filter((a) => a.status === 'Selected').length,
    Rejected: applications.filter((a) => a.status === 'Rejected').length
  };

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (selectedStatus !== 'All' && app.status !== selectedStatus) {
      return false;
    }
    // Search query (company, role, location, notes)
    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      const matchCompany = app.company?.toLowerCase().includes(q);
      const matchRole = app.role?.toLowerCase().includes(q);
      const matchLocation = app.location?.toLowerCase().includes(q);
      const matchNotes = app.notes?.toLowerCase().includes(q);
      return matchCompany || matchRole || matchLocation || matchNotes;
    }
    return true;
  });

  // Handle Save (Create or Update)
  async function handleSaveApplication(payload) {
    setIsSaving(true);
    try {
      if (editingApplication) {
        const updated = await api.updateApplication(editingApplication.id, payload);
        setApplications((prev) =>
          prev.map((a) => (a.id === editingApplication.id ? updated : a))
        );
        setNotification(`Application for "${updated.company}" updated successfully.`);
      } else {
        const created = await api.createApplication(payload);
        setApplications((prev) => [created, ...prev]);
        setNotification(`Application for "${created.company}" added successfully.`);
      }
      setIsModalOpen(false);
      setEditingApplication(null);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await api.deleteApplication(deleteTarget.id);
      setApplications((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setNotification(`Application for "${deleteTarget.company}" deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete application.');
    } finally {
      setIsDeleting(false);
    }
  }

  // Helper for Status Badge styling
  function renderStatusBadge(status) {
    let badgeClass = 'status-badge-applied';
    if (status === 'Interview') badgeClass = 'status-badge-interview';
    if (status === 'Selected') badgeClass = 'status-badge-selected';
    if (status === 'Rejected') badgeClass = 'status-badge-rejected';

    return <span className={`app-status-badge ${badgeClass}`}>{status}</span>;
  }

  // Helper for formatted date
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (_) {
      return dateStr;
    }
  }

  return (
    <div className="applications-page">
      {/* Top Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="page-title">Job & Internship Tracker</h1>
          <p className="page-subtitle">
            Manage and track your company recruitment pipeline in one place
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingApplication(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} /> Add Application
        </button>
      </div>

      {/* Success Notification Banner */}
      {notification && (
        <div className="form-alert form-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={loadApplications}
        />
      )}

      {/* Status Count Chips (Design.md 7.8) */}
      <div className="status-chips-container">
        {['All', 'Applied', 'Interview', 'Selected', 'Rejected'].map((st) => (
          <button
            key={st}
            type="button"
            className={`status-chip ${selectedStatus === st ? 'status-chip-active' : ''} chip-${st.toLowerCase()}`}
            onClick={() => setSelectedStatus(st)}
            aria-pressed={selectedStatus === st}
          >
            <span className="chip-label">{st}</span>
            <span className="chip-count">{statusCounts[st] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filter Controls Row */}
      <div className="filters-card card">
        <div className="filters-toolbar">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, role, location, or notes..."
              className="form-input search-input"
              aria-label="Search applications"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Select & Reset Group */}
          <div className="filter-selects-group">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select filter-select"
              aria-label="Filter by Status"
            >
              <option value="All">All Statuses ({applications.length})</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st} ({statusCounts[st] || 0})
                </option>
              ))}
            </select>

            {(search || selectedStatus !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedStatus('All');
                }}
                className="btn btn-secondary btn-sm reset-filters-btn"
                title="Reset filters"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applications Data Table */}
      {loading ? (
        <Loader message="Loading your recruitment pipeline..." />
      ) : errorMessage && applications.length === 0 ? null : filteredApplications.length === 0 ? (
        applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No Applications Found"
            message="You have not added any job or internship applications yet. Start tracking your placement journey!"
            actionLabel="Add First Application"
            onAction={() => {
              setEditingApplication(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No matching applications"
            message="No applications match your active search and status filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setSelectedStatus('All');
            }}
          />
        )
      ) : (
        <div className="card table-card table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Company</th>
                <th style={{ width: '22%' }}>Role / Position</th>
                <th style={{ width: '15%' }}>Location</th>
                <th style={{ width: '14%' }}>Applied Date</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.id}>
                  <td data-label="Company">
                    <div className="table-company-cell">
                      <span className="company-name">{app.company}</span>
                      {app.notes && (
                        <span className="app-notes-preview" title={app.notes}>
                          {app.notes}
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Role">
                    <span className="role-text">{app.role}</span>
                  </td>
                  <td data-label="Location">
                    <div className="location-cell">
                      {app.location ? (
                        <>
                          <MapPin size={13} className="location-icon" aria-hidden="true" />
                          <span>{app.location}</span>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Applied Date">
                    <div className="date-cell">
                      <Calendar size={13} className="date-icon" aria-hidden="true" />
                      <span>{formatDate(app.appliedDate)}</span>
                    </div>
                  </td>
                  <td data-label="Status">{renderStatusBadge(app.status)}</td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn-icon-ghost"
                        onClick={() => {
                          setEditingApplication(app);
                          setIsModalOpen(true);
                        }}
                        title={`Edit ${app.company}`}
                        aria-label={`Edit application for ${app.company}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-ghost btn-icon-ghost-danger"
                        onClick={() => setDeleteTarget(app)}
                        title={`Delete ${app.company}`}
                        aria-label={`Delete application for ${app.company}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Application Modal */}
      <ApplicationModal
        isOpen={isModalOpen}
        initialData={editingApplication}
        isLoading={isSaving}
        onSave={handleSaveApplication}
        onClose={() => {
          if (!isSaving) {
            setIsModalOpen(false);
            setEditingApplication(null);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Delete Application?"
        message={`Are you sure you want to delete your application for ${deleteTarget?.company} (${deleteTarget?.role})? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      />
    </div>
  );
}
