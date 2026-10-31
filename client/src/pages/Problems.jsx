import React, { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { api } from '../services/api';
import QuestionTable from '../components/QuestionTable';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/**
 * DevPrep - Problem Library (`Problems.jsx`)
 * Conforms to Design.md Section 7.4:
 * - Search plus Topic and Difficulty dropdown filters
 * - Solved vs total progress bar
 * - Handles loading, error, and empty states
 */
export default function Problems() {
  useDocumentTitle('Problems');
  const [questions, setQuestions] = useState([]);
  const [solvedIds, setSolvedIds] = useState([]);
  const [solutionQuestionIds, setSolutionQuestionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch filtered questions, user progress, and saved solution metadata in parallel
      const [questionsData, progressData, solutionsData] = await Promise.all([
        api.getQuestions({
          topic: selectedTopic,
          difficulty: selectedDifficulty,
          search: search.trim()
        }),
        api.getProgress(),
        api.getSolutions()
      ]);

      setQuestions(questionsData);
      setSolvedIds(progressData.solvedQuestionIds || []);

      const uniqueSolutionQIds = Array.from(new Set((solutionsData || []).map((s) => s.questionId)));
      setSolutionQuestionIds(uniqueSolutionQIds);
    } catch (err) {
      setError(err.message || 'Failed to load problem library');
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, selectedDifficulty, search]);

  useEffect(() => {
    // Debounce search slightly to avoid excessive calls
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedTopic('');
    setSelectedDifficulty('');
  };

  const solvedCount = questions.filter((q) => solvedIds.includes(q.id)).length;

  return (
    <div className="problems-page">
      {/* Page Header with Stats Summary */}
      <div className="problems-header-card card">
        <div className="problems-header-info">
          <h2 className="section-title">DSA Problem Library</h2>
          <p className="section-desc">
            Practice handpicked algorithmic problems categorized across 9 fundamental placement topics.
          </p>
        </div>
        <div className="problems-header-progress">
          <ProgressBar
            current={solvedCount}
            total={questions.length}
            label="Library Completion"
          />
        </div>
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
              placeholder="Search problems by title or keyword..."
              className="form-input search-input"
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

          {/* Selects & Actions Group */}
          <div className="filter-selects-group">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="form-select filter-select"
              aria-label="Filter by Topic"
            >
              <option value="">All Topics (9)</option>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="form-select filter-select"
              aria-label="Filter by Difficulty"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>

            {/* Reset Filters */}
            {(search || selectedTopic || selectedDifficulty) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm reset-filters-btn"
                title="Reset all filters"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Loading, Error, Empty, or Table */}
      <div className="card table-container-card">
        {loading && <Loader message="Loading problem library..." />}

        {error && !loading && (
          <ErrorMessage message={error} onRetry={loadData} />
        )}

        {!loading && !error && questions.length === 0 && (
          <EmptyState
            icon={Filter}
            title="No matching problems found"
            message="Try adjusting your search criteria or clearing your filters to see more problems."
            actionLabel="Clear All Filters"
            onAction={handleResetFilters}
          />
        )}

        {!loading && !error && questions.length > 0 && (
          <QuestionTable
            questions={questions}
            solvedIds={solvedIds}
            solutionQuestionIds={solutionQuestionIds}
          />
        )}
      </div>
    </div>
  );
}
