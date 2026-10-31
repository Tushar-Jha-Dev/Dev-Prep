import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { adminCache } from '../services/adminCache';
import DifficultyBadge from '../components/DifficultyBadge';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
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

const DIFFICULTIES = ['All Difficulties', 'Easy', 'Medium', 'Hard'];

/**
 * DevPrep - Admin Coding Questions Repository (`AdminQuestions.jsx`)
 * 
 * Conforms to Design.md Section 7.5 & UI Fix Pass:
 * - In-memory session cache eliminates blank flash on route switches
 * - Skeleton rows match real row heights to prevent layout jumping
 * - Ghost-style 32px action buttons with danger hover on delete
 * - Proper table header styles with consistent alignment
 * - Responsive stacked card layout under 700px
 * - Portal-based accessible deletion modal
 */
export default function AdminQuestions() {
  useDocumentTitle('Admin Questions');
  const location = useLocation();

  // Initialize from session cache if available to prevent flash
  const cached = adminCache.getQuestions();
  const [questions, setQuestions] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulties');

  // Deletion Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Notification State
  const [notification, setNotification] = useState(
    location.state?.notification || null
  );

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Fetch / Refresh Questions in background
  async function loadQuestions() {
    try {
      if (!adminCache.getQuestions()) {
        setLoading(true);
      }
      setErrorMessage(null);
      const data = await api.getQuestions();
      const list = Array.isArray(data) ? data : [];
      setQuestions(list);
      adminCache.setQuestions(list);
    } catch (err) {
      if (!adminCache.getQuestions()) {
        setErrorMessage(err.message || 'Failed to load questions repository.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  // Filtered List
  const filteredQuestions = questions.filter((q) => {
    if (selectedTopic !== 'All Topics' && q.topic !== selectedTopic) {
      return false;
    }
    if (selectedDifficulty !== 'All Difficulties' && q.difficulty !== selectedDifficulty) {
      return false;
    }
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(query);
      const matchId = q.id.toLowerCase().includes(query);
      const matchDesc = q.description && q.description.toLowerCase().includes(query);
      return matchTitle || matchId || matchDesc;
    }
    return true;
  });

  // Handle Delete Confirmation
  async function handleConfirmDelete() {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.deleteQuestion(deleteTarget.id);

      const updated = questions.filter((q) => q.id !== deleteTarget.id);
      setQuestions(updated);
      adminCache.setQuestions(updated);

      setNotification(`Question "${deleteTarget.title}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (err) {
      alert(`Error deleting question: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="admin-subpage">
      {/* Header Row */}
      <div className="admin-header-row">
        <div>
          <h1 className="page-title">Coding Questions</h1>
          <p className="page-subtitle">
            Manage the central DSA question library ({questions.length} total problems)
          </p>
        </div>
        <Link to="/admin/questions/new" className="btn btn-primary">
          <Plus size={16} /> Add New Question
        </Link>
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
          onRetry={loadQuestions}
        />
      )}

      {/* Filter Toolbar */}
      <div className="filters-toolbar admin-filters-toolbar">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by title, ID, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search questions"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="search-clear-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filter-select-group">
          <select
            className="form-select filter-select"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            aria-label="Filter by Topic"
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          <select
            className="form-select filter-select"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            aria-label="Filter by Difficulty"
          >
            {DIFFICULTIES.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
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
                <th style={{ width: '42%' }}>Title & ID</th>
                <th style={{ width: '18%' }}>Topic</th>
                <th style={{ width: '15%' }}>Difficulty</th>
                <th style={{ width: '15%' }}>Examples</th>
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
                  <td><div className="skeleton-line skeleton-small" /></td>
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
      ) : filteredQuestions.length === 0 ? (
        <div className="card empty-state-card">
          <AlertTriangle size={36} className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">No Questions Found</h3>
          <p className="empty-state-desc">
            {questions.length === 0
              ? 'The repository has no questions yet. Create the first one now!'
              : 'No questions match your current search and filter criteria.'}
          </p>
          {questions.length === 0 ? (
            <Link to="/admin/questions/new" className="btn btn-primary" style={{ marginTop: '12px' }}>
              <Plus size={16} /> Add First Question
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedTopic('All Topics');
                setSelectedDifficulty('All Difficulties');
              }}
              style={{ marginTop: '12px' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="card table-container">
          <table className="standard-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Title & ID</th>
                <th style={{ width: '18%' }}>Topic</th>
                <th style={{ width: '15%' }}>Difficulty</th>
                <th style={{ width: '15%' }}>Examples</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id}>
                  <td data-label="Title & ID">
                    <div className="table-title-cell">
                      <Link
                        to={`/problems/${q.id}`}
                        className="table-problem-link"
                        title="Preview Problem Details page"
                      >
                        <span className="problem-link-text">{q.title}</span>
                        <ExternalLink size={13} className="external-icon" aria-hidden="true" />
                      </Link>
                      <span className="table-id-sub mono-text">{q.id}</span>
                    </div>
                  </td>
                  <td data-label="Topic">
                    <span className="topic-badge">{q.topic}</span>
                  </td>
                  <td data-label="Difficulty">
                    <DifficultyBadge difficulty={q.difficulty} />
                  </td>
                  <td data-label="Examples">
                    <span className="meta-count-badge">
                      {Array.isArray(q.examples) ? q.examples.length : 0} cases
                    </span>
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <div className="table-actions">
                      <Link
                        to={`/admin/questions/${q.id}/edit`}
                        className="btn-icon-ghost"
                        title="Edit question"
                        aria-label={`Edit ${q.title}`}
                      >
                        <Edit2 size={15} />
                      </Link>
                      <button
                        type="button"
                        className="btn-icon-ghost btn-icon-ghost-danger"
                        title="Delete question"
                        aria-label={`Delete ${q.title}`}
                        onClick={() => setDeleteTarget(q)}
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

      {/* Delete Confirmation Modal using shared Portal Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Question"
        confirmText="Delete Question"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        maxWidth="500px"
      >
        <p>
          Are you sure you want to permanently delete this question from the library?
        </p>
        {deleteTarget && (
          <div className="delete-preview-box">
            <strong>{deleteTarget.title}</strong>
            <span className="delete-preview-meta">
              {deleteTarget.topic} • {deleteTarget.difficulty} • ID: {deleteTarget.id}
            </span>
          </div>
        )}
        <p className="delete-subtext">
          Deleting a question will permanently remove it from the Problem Library and clean up any saved code solutions for this question. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
