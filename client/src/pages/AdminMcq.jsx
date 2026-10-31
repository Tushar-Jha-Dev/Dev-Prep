import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { adminCache } from '../services/adminCache';
import Modal from '../components/Modal';
import McqModal from '../components/McqModal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const TOPICS = [
  'All Topics',
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

const RAW_TOPICS = [
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
 * DevPrep - Admin MCQ Bank Management (`AdminMcq.jsx`)
 * 
 * Conforms to Design.md Section 7.5 & UI Fix Pass:
 * - In-memory session cache eliminates blank flash on route switches
 * - Skeleton rows match real row heights to prevent layout jumping
 * - Ghost-style 32px action buttons with danger hover on delete
 * - Proper table header styles with consistent column alignments
 * - Responsive stacked card layout under 700px
 * - Portal-based accessible Add/Edit and Deletion modals
 */
export default function AdminMcq() {
  useDocumentTitle('MCQ Bank');
  // Initialize from session cache if available
  const cached = adminCache.getMcqs();
  const [mcqs, setMcqs] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMcq, setEditingMcq] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast State
  const [notification, setNotification] = useState(null);

  // Auto-dismiss notification after 5s
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Load MCQs with background cache refresh
  async function loadMcqs() {
    try {
      if (!adminCache.getMcqs()) {
        setLoading(true);
      }
      setErrorMessage(null);
      const data = await api.getAdminMcqs();
      const list = Array.isArray(data) ? data : [];
      setMcqs(list);
      adminCache.setMcqs(list);
    } catch (err) {
      if (!adminCache.getMcqs()) {
        setErrorMessage(err.message || 'Failed to load MCQ question bank.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMcqs();
  }, []);

  // Compute Topic Distribution Summary
  const topicCounts = useMemo(() => {
    const counts = {};
    for (const t of RAW_TOPICS) {
      counts[t] = 0;
    }
    for (const m of mcqs) {
      if (counts[m.topic] !== undefined) {
        counts[m.topic]++;
      }
    }
    return counts;
  }, [mcqs]);

  // Filtered MCQs
  const filteredMcqs = useMemo(() => {
    return mcqs.filter((m) => {
      if (selectedTopic !== 'All Topics' && m.topic !== selectedTopic) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const qMatch = m.question && m.question.toLowerCase().includes(query);
        const optMatch = Array.isArray(m.options) && m.options.some((o) => o.toLowerCase().includes(query));
        return qMatch || optMatch;
      }
      return true;
    });
  }, [mcqs, selectedTopic, searchTerm]);

  // Handle Save (Create or Update)
  async function handleSaveMcq(formData) {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingMcq) {
        const updated = await api.updateAdminMcq(editingMcq.id, formData);
        const nextList = mcqs.map((m) => (m.id === editingMcq.id ? updated : m));
        setMcqs(nextList);
        adminCache.setMcqs(nextList);
        setNotification(`MCQ successfully updated.`);
      } else {
        const created = await api.createAdminMcq(formData);
        const nextList = [created, ...mcqs];
        setMcqs(nextList);
        adminCache.setMcqs(nextList);
        setNotification(`MCQ added to "${created.topic}" successfully.`);
      }

      setIsFormOpen(false);
      setEditingMcq(null);
    } catch (err) {
      alert(`Error saving MCQ: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.deleteAdminMcq(deleteTarget.id);

      const nextList = mcqs.filter((m) => m.id !== deleteTarget.id);
      setMcqs(nextList);
      adminCache.setMcqs(nextList);

      setNotification(`MCQ removed from the bank successfully.`);
      setDeleteTarget(null);
    } catch (err) {
      alert(`Error deleting MCQ: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="admin-subpage">
      {/* Main Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="page-title">MCQ Assessment Bank</h1>
          <p className="page-subtitle">
            Curate and manage multiple-choice questions for timed mock assessments ({mcqs.length} total MCQs)
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingMcq(null);
            setIsFormOpen(true);
          }}
        >
          <Plus size={16} /> Add MCQ
        </button>
      </div>

      {/* Toast Notification */}
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
          onRetry={loadMcqs}
        />
      )}

      {/* Topic Count Distribution Bar */}
      <div className="card topic-distribution-card">
        <div className="distribution-card-header">
          <span className="distribution-title">Topic Question Inventory</span>
          <span className="distribution-legend-hint">
            Topics with &lt; 5 questions are flagged
          </span>
        </div>

        <div className="topic-pills-grid">
          {RAW_TOPICS.map((t) => {
            const count = topicCounts[t] || 0;
            const isLow = count < 5;
            const isSelected = selectedTopic === t;

            return (
              <button
                key={t}
                type="button"
                className={`topic-inv-pill ${isSelected ? 'topic-inv-pill-active' : ''} ${isLow ? 'topic-inv-low' : ''}`}
                onClick={() => setSelectedTopic(selectedTopic === t ? 'All Topics' : t)}
                title={isLow ? `Low inventory: only ${count} question(s) available!` : `${t}: ${count} questions`}
              >
                <span className="pill-topic-name">{t}</span>
                <span className="pill-topic-count">
                  {isLow && <AlertTriangle size={12} className="low-inv-icon" aria-hidden="true" />}
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unified Toolbar Row: Search, Topic Filter, & Add Button */}
      <div className="filters-toolbar admin-filters-toolbar">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search questions or options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search MCQs"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Topic Filter */}
        <div className="filter-select-group">
          <select
            className="form-select filter-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            aria-label="Filter by Topic"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t === 'All Topics' ? 'All Topics' : `${t} (${topicCounts[t] || 0})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content: Skeletons, Empty State, or Table */}
      {loading ? (
        <div className="card table-container">
          <table className="standard-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Question</th>
                <th style={{ width: '16%' }}>Topic</th>
                <th style={{ width: '14%' }}>Options</th>
                <th style={{ width: '20%' }}>Correct Answer</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((n) => (
                <tr key={n} className="table-skeleton-row">
                  <td>
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-sub" />
                  </td>
                  <td><div className="skeleton-line skeleton-badge" /></td>
                  <td><div className="skeleton-line skeleton-badge" /></td>
                  <td><div className="skeleton-line skeleton-medium" /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions skeleton-actions">
                      <div className="skeleton-btn" />
                      <div className="skeleton-btn" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredMcqs.length === 0 ? (
        <div className="card empty-state-card">
          <HelpCircle size={36} className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">No MCQs Found</h3>
          <p className="empty-state-desc">
            {searchTerm || selectedTopic !== 'All Topics'
              ? 'No MCQs matched your current search filters. Try resetting the filters.'
              : 'The MCQ bank is currently empty. Click "Add MCQ" above to create your first question.'}
          </p>
          {(searchTerm || selectedTopic !== 'All Topics') && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedTopic('All Topics');
              }}
              style={{ marginTop: '12px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="card table-container">
          <table className="standard-table mcq-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Question</th>
                <th style={{ width: '16%' }}>Topic</th>
                <th style={{ width: '14%' }}>Options</th>
                <th style={{ width: '20%' }}>Correct Answer</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMcqs.map((mcq) => {
                const correctOption = mcq.options?.[mcq.correctIndex] || 'Unknown';
                const correctLetter = String.fromCharCode(65 + (mcq.correctIndex || 0));

                return (
                  <tr key={mcq.id}>
                    <td data-label="Question">
                      <div className="mcq-question-cell" title={mcq.question}>
                        <span className="mcq-question-text">{mcq.question}</span>
                      </div>
                    </td>
                    <td data-label="Topic">
                      <span className="topic-badge">{mcq.topic}</span>
                    </td>
                    <td data-label="Options">
                      <div className="options-with-meta">
                        <span className="meta-count-badge">
                          {mcq.options?.length || 0} options
                        </span>
                        {mcq.explanation && (
                          <span className="explanation-indicator-badge" title={mcq.explanation}>
                            <BookOpen size={12} aria-hidden="true" /> Expl
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Correct Answer">
                      <div className="mcq-correct-preview" title={correctOption}>
                        <span className="correct-opt-marker">{correctLetter}</span>
                        <span className="correct-opt-text">{correctOption}</span>
                      </div>
                    </td>
                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-icon-ghost"
                          title="Edit this MCQ"
                          aria-label={`Edit MCQ: ${mcq.question}`}
                          onClick={() => {
                            setEditingMcq(mcq);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-ghost btn-icon-ghost-danger"
                          title="Delete this MCQ"
                          aria-label={`Delete MCQ: ${mcq.question}`}
                          onClick={() => setDeleteTarget(mcq)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit MCQ Modal (uses portal Modal) */}
      <McqModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMcq(null);
        }}
        onSave={handleSaveMcq}
        editingMcq={editingMcq}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal (uses portal Modal) */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Multiple-Choice Question"
        confirmText="Delete Question"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        maxWidth="520px"
      >
        <p>
          Are you sure you want to delete this MCQ from the active assessment bank?
        </p>
        {deleteTarget && (
          <div className="delete-preview-box">
            <strong>{deleteTarget.topic}</strong>
            <p className="delete-q-preview">{deleteTarget.question}</p>
          </div>
        )}
        <p className="delete-subtext">
          Past test attempts already graded with this question preserve their historical snapshots and will not be affected.
        </p>
      </Modal>
    </div>
  );
}
