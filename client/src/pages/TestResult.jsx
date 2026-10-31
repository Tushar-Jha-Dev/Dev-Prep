import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Home,
  AlertTriangle,
  Filter,
  FileQuestion
} from 'lucide-react';
import { api } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * DevPrep - Mock Test Result Scorecard & Review (`TestResult.jsx`)
 * Conforms to Design.md Section 7.7 & User Requirements:
 * - Reusable for both immediate test submission and historical report review (/mock-tests/attempts/:id)
 * - Large score and accuracy metrics
 * - Shared ProgressBar component for topic-wise performance
 * - Review filter chips: All, Incorrect, Unanswered with live counts
 * - Clear option letter chips (A/B/C/D), distinct correct vs your choice markers with text + icons
 * - Graceful fallback notice for older attempts without snapshots
 * - "Back to Past Tests" navigation link
 */
export default function TestResult() {
  useDocumentTitle('Assessment Scorecard');
  const location = useLocation();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(location.state?.result || null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'incorrect' | 'unanswered'

  // Fetch report by ID if not passed in router state
  useEffect(() => {
    if (!resultData && id) {
      let isMounted = true;
      setLoading(true);
      setError(null);

      api.getMockTestAttemptById(id)
        .then((res) => {
          if (isMounted) {
            setResultData(res);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err.message || 'Assessment report not found or access denied.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [id, resultData]);

  // Loading State
  if (loading) {
    return (
      <div className="test-result-page">
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Loader message="Loading assessment scorecard and question review..." />
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || (!resultData && !id)) {
    return (
      <div className="test-result-page">
        <div className="card report-not-found-card">
          <AlertTriangle size={36} className="not-found-icon" aria-hidden="true" />
          <h2 className="not-found-title">Assessment Report Not Found</h2>
          <p className="not-found-desc">
            {error || 'The requested test report does not exist or you do not have permission to view it.'}
          </p>
          <div className="not-found-actions">
            <Link to="/mock-tests" className="btn btn-primary">
              <ArrowLeft size={16} /> Back to Past Tests
            </Link>
            <Link to="/" className="btn btn-secondary">
              <Home size={16} /> Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!resultData || !resultData.attempt) {
    return null;
  }

  const { attempt } = resultData;
  const reviews = Array.isArray(resultData.reviews)
    ? resultData.reviews
    : Array.isArray(attempt.reviews)
    ? attempt.reviews
    : [];

  const hasSnapshot = resultData.hasSnapshot !== undefined
    ? resultData.hasSnapshot
    : reviews.length > 0;

  const { score, total, accuracy, timeTaken, topic, topicBreakdown, date } = attempt;

  // Format seconds to mm:ss
  function formatTime(seconds) {
    if (typeof seconds !== 'number') return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Status color tiers
  const isHighPass = accuracy >= 70;
  const isPass = accuracy >= 50;

  // Compute Review filter counts
  const allCount = reviews.length;
  const incorrectCount = reviews.filter((r) => !r.isCorrect && r.selectedIndex !== -1 && r.selectedIndex !== undefined).length;
  const unansweredCount = reviews.filter((r) => r.selectedIndex === -1 || r.selectedIndex === undefined).length;

  // Filter reviews
  const displayedReviews = reviews.filter((r) => {
    const isUnanswered = r.selectedIndex === -1 || r.selectedIndex === undefined;
    if (filterMode === 'incorrect') {
      return !r.isCorrect && !isUnanswered;
    }
    if (filterMode === 'unanswered') {
      return isUnanswered;
    }
    return true;
  });

  return (
    <div className="test-result-page">
      {/* Top Breadcrumb / Back Link */}
      <div className="result-back-bar">
        <Link to="/mock-tests" className="back-link-btn" title="Back to Past Tests">
          <ArrowLeft size={16} />
          <span>Back to Past Tests</span>
        </Link>
        {date && (
          <span className="result-date-badge mono-text">
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        )}
      </div>

      {/* Top Header Card: Score & Accuracy */}
      <div className="card result-score-card">
        <div className="result-score-header">
          <div className="score-badge-wrap">
            <Award size={26} className="score-trophy-icon" aria-hidden="true" />
            <span className="result-topic-pill">{topic} Assessment</span>
          </div>

          <div className="score-numbers-row">
            <div className="score-number-group">
              <span className="score-big">{score}</span>
              <span className="score-divider">/</span>
              <span className="score-total">{total}</span>
            </div>

            <div className="accuracy-pill-wrap">
              <span
                className={`accuracy-badge ${
                  isHighPass
                    ? 'accuracy-badge-high'
                    : isPass
                    ? 'accuracy-badge-medium'
                    : 'accuracy-badge-low'
                }`}
              >
                {accuracy}% Accuracy
              </span>
              <span className="time-taken-badge">
                <Clock size={13} aria-hidden="true" />
                <span>{formatTime(timeTaken)}</span>
              </span>
            </div>
          </div>

          <p className="result-feedback-text">
            {isHighPass
              ? 'Excellent performance! You demonstrate strong mastery of these core technical concepts.'
              : isPass
              ? 'Good effort! Review the detailed explanations below to strengthen weak areas.'
              : 'Keep practicing! Review the explanations below and take another test to build conceptual clarity.'}
          </p>

          <div className="result-actions-row">
            <Link to="/mock-tests" className="btn btn-primary">
              <RotateCcw size={16} /> Take Another Test
            </Link>
            <Link to="/mock-tests" className="btn btn-secondary">
              <ArrowLeft size={16} /> View All Past Tests
            </Link>
            <Link to="/" className="btn btn-secondary">
              <Home size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Topic Breakdown Bars (Unified Shared ProgressBar Component) */}
        {topicBreakdown && Object.keys(topicBreakdown).length > 0 && (
          <div className="topic-breakdown-section">
            <h4 className="topic-breakdown-title">Topic Performance</h4>
            <div className="topic-breakdown-grid">
              {Object.entries(topicBreakdown).map(([topName, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.score / stats.total) * 100) : 0;
                return (
                  <div key={topName} className="topic-stat-item">
                    <ProgressBar
                      label={topName}
                      current={stats.score}
                      total={stats.total}
                      percent={pct}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Answer Review Section */}
      <div className="card result-reviews-card">
        <div className="result-reviews-header">
          <div className="reviews-header-text">
            <h3 className="reviews-section-title">Detailed Question Review</h3>
            <p className="reviews-section-subtitle">
              Review each question, your selected option, the correct answer, and algorithmic explanations.
            </p>
          </div>

          {/* Filter Chips: All / Incorrect / Unanswered */}
          {hasSnapshot && (
            <div className="review-filter-chips" role="tablist" aria-label="Filter questions">
              <button
                type="button"
                className={`filter-chip ${filterMode === 'all' ? 'filter-chip-active' : ''}`}
                onClick={() => setFilterMode('all')}
                role="tab"
                aria-selected={filterMode === 'all'}
              >
                <span>All</span>
                <span className="chip-count mono-text">{allCount}</span>
              </button>
              <button
                type="button"
                className={`filter-chip filter-chip-danger ${filterMode === 'incorrect' ? 'filter-chip-active' : ''}`}
                onClick={() => setFilterMode('incorrect')}
                role="tab"
                aria-selected={filterMode === 'incorrect'}
              >
                <span>Incorrect</span>
                <span className="chip-count mono-text">{incorrectCount}</span>
              </button>
              <button
                type="button"
                className={`filter-chip filter-chip-muted ${filterMode === 'unanswered' ? 'filter-chip-active' : ''}`}
                onClick={() => setFilterMode('unanswered')}
                role="tab"
                aria-selected={filterMode === 'unanswered'}
              >
                <span>Unanswered</span>
                <span className="chip-count mono-text">{unansweredCount}</span>
              </button>
            </div>
          )}
        </div>

        {/* Older attempt without snapshot notification */}
        {!hasSnapshot && (
          <div className="legacy-attempt-notice">
            <FileQuestion size={20} className="legacy-notice-icon" aria-hidden="true" />
            <div>
              <strong>Detailed answers are not available for this older attempt.</strong>
              <p>
                Your overall score, accuracy ({accuracy}%), time taken ({formatTime(timeTaken)}), and topic breakdown have been safely preserved in your history.
              </p>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {hasSnapshot && (
          <div className="reviews-list">
            {displayedReviews.length === 0 ? (
              <div className="review-empty-filter">
                <CheckCircle2 size={32} className="empty-filter-icon" />
                <p>No questions match the current filter selection ({filterMode}).</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFilterMode('all')}
                >
                  Show All Questions
                </button>
              </div>
            ) : (
              displayedReviews.map((rev, index) => {
                const isCorrect = rev.isCorrect;
                const isUnanswered = rev.selectedIndex === -1 || rev.selectedIndex === undefined;

                return (
                  <div
                    key={rev.questionId || index}
                    className={`review-card ${
                      isCorrect
                        ? 'review-card-correct'
                        : isUnanswered
                        ? 'review-card-unanswered'
                        : 'review-card-wrong'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="review-card-top">
                      <div className="review-question-meta">
                        <span className="review-q-num">Question {index + 1}</span>
                        <span className="review-topic-tag">{rev.topic}</span>
                      </div>
                      <div className="review-status-indicator">
                        {isCorrect ? (
                          <span className="review-status-pill pill-correct">
                            <Check size={14} aria-hidden="true" />
                            <span>Correct (+1)</span>
                          </span>
                        ) : isUnanswered ? (
                          <span className="review-status-pill pill-unanswered">
                            <HelpCircle size={14} aria-hidden="true" />
                            <span>Unanswered (0)</span>
                          </span>
                        ) : (
                          <span className="review-status-pill pill-wrong">
                            <X size={14} aria-hidden="true" />
                            <span>Incorrect (0)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <h4 className="review-question-text">
                      {rev.question || 'Question content is unavailable.'}
                    </h4>

                    {/* Options List */}
                    {Array.isArray(rev.options) && rev.options.length > 0 ? (
                      <div className="review-options-grid">
                        {rev.options.map((optText, optIdx) => {
                          const isUserChoice = rev.selectedIndex === optIdx;
                          const isRightAnswer = rev.correctIndex === optIdx;

                          let optionClass = 'review-opt-neutral';
                          if (isRightAnswer && isUserChoice) {
                            optionClass = 'review-opt-correct-choice';
                          } else if (isRightAnswer) {
                            optionClass = 'review-opt-correct';
                          } else if (isUserChoice) {
                            optionClass = 'review-opt-wrong';
                          }

                          return (
                            <div key={optIdx} className={`review-option-card ${optionClass}`}>
                              <div className="review-opt-left">
                                <span className="review-opt-letter mono-text" aria-hidden="true">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="review-opt-text">{optText}</span>
                              </div>
                              <div className="review-opt-right">
                                {isRightAnswer && isUserChoice && (
                                  <span className="opt-flag flag-correct">
                                    <CheckCircle2 size={15} aria-hidden="true" />
                                    <span>Your Choice (Correct)</span>
                                  </span>
                                )}
                                {isRightAnswer && !isUserChoice && (
                                  <span className="opt-flag flag-correct">
                                    <CheckCircle2 size={15} aria-hidden="true" />
                                    <span>Correct Answer</span>
                                  </span>
                                )}
                                {isUserChoice && !isRightAnswer && (
                                  <span className="opt-flag flag-wrong">
                                    <XCircle size={15} aria-hidden="true" />
                                    <span>Your Choice</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="field-hint" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        Options snapshot is unavailable for this question.
                      </p>
                    )}

                    {/* Algorithmic Explanation Box */}
                    {rev.explanation && (
                      <div className="review-explanation-box">
                        <div className="explanation-header">
                          <HelpCircle size={15} className="explanation-icon" aria-hidden="true" />
                          <span>Algorithmic Explanation</span>
                        </div>
                        <p className="explanation-text">{rev.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
