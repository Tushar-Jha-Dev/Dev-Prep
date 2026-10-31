import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Award,
  History,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
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

const QUESTION_COUNTS = [5, 10, 15, 20];

/**
 * DevPrep - Timed Mock Test Engine (`MockTest.jsx`)
 * Conforms to Design.md Section 7.6:
 * - Setup card (topic, number of questions, Start)
 * - In-test view: "Question 3 of 10", mono timer, thin progress strip
 * - Question card with 4 selectable options (accent border + soft fill when selected)
 * - Previous/Next buttons, Submit on last question
 * - Auto-submit when countdown timer reaches zero
 * - History list of user's past attempts
 */
export default function MockTest() {
  const navigate = useNavigate();

  // Setup Form State
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [questionCount, setQuestionCount] = useState(10);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [attemptsError, setAttemptsError] = useState(null);
  const [attemptsPage, setAttemptsPage] = useState(1);
  const [attemptsTotalPages, setAttemptsTotalPages] = useState(1);
  const [attemptsTotalCount, setAttemptsTotalCount] = useState(0);
  const [topicInventory, setTopicInventory] = useState({});
  const [totalInventory, setTotalInventory] = useState(0);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  // Active Test State
  const [isTestActive, setIsTestActive] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Synchronize document title after state is initialized
  useDocumentTitle(isTestActive ? `Assessment: ${selectedTopic}` : 'Mock Tests');

  // Lifecycle & Network State
  const [loadingTest, setLoadingTest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // 1. Fetch Past Attempts on Mount with Pagination
  const loadAttempts = useCallback(async (pageToLoad = 1) => {
    try {
      setLoadingAttempts(true);
      setAttemptsError(null);
      const res = await api.getMockTestAttempts({ page: pageToLoad, limit: 10 });
      if (Array.isArray(res)) {
        setPastAttempts(res);
        setAttemptsTotalCount(res.length);
        setAttemptsTotalPages(Math.ceil(res.length / 10) || 1);
        setAttemptsPage(1);
      } else if (res && Array.isArray(res.attempts)) {
        setPastAttempts(res.attempts);
        setAttemptsTotalCount(res.total || 0);
        setAttemptsTotalPages(res.totalPages || 1);
        setAttemptsPage(res.page || pageToLoad);
      } else {
        setPastAttempts([]);
      }
    } catch (err) {
      setAttemptsError(err.message || 'Failed to load past assessment attempts.');
      setPastAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  }, []);

  // 2. Fetch Topic Inventory Counts
  const loadCounts = useCallback(async () => {
    try {
      setLoadingInventory(true);
      setInventoryError(null);
      const res = await api.getMockTestCounts();
      if (res && res.counts) {
        setTopicInventory(res.counts);
        setTotalInventory(res.total || 0);
      } else {
        throw new Error('Invalid topic inventory received from server.');
      }
    } catch (err) {
      setInventoryError(err.message || 'Failed to load topic questions inventory.');
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    loadAttempts();
    loadCounts();
  }, [loadAttempts, loadCounts]);

  // Combined retry for setup state
  const handleRetrySetup = useCallback(() => {
    loadAttempts();
    loadCounts();
  }, [loadAttempts, loadCounts]);

  // Compute available questions for the selected topic
  const availableCount = React.useMemo(() => {
    if (selectedTopic === 'All Topics') {
      return totalInventory || 45;
    }
    return topicInventory[selectedTopic] !== undefined ? topicInventory[selectedTopic] : 5;
  }, [selectedTopic, topicInventory, totalInventory]);

  // Cap questionCount if current selection exceeds available count
  useEffect(() => {
    if (availableCount > 0 && questionCount > availableCount) {
      setQuestionCount(availableCount);
    }
  }, [availableCount, questionCount]);

  // Submit test handler
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Calculate elapsed time in seconds
    const timeTaken = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    // Format answers array
    const answersPayload = testQuestions.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
    }));

    try {
      const result = await api.submitMockTest({
        topic: selectedTopic === 'All Topics' ? 'Mixed' : selectedTopic,
        answers: answersPayload,
        timeTaken
      });

      // Navigate to result scorecard
      navigate('/mock-tests/result', { state: { result } });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit assessment. Please retry.');
      setIsSubmitting(false);
    }
  }, [isSubmitting, testQuestions, selectedAnswers, selectedTopic, navigate]);

  // 2. Countdown Timer Effect
  useEffect(() => {
    if (!isTestActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Auto-submit test on timeout
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTestActive, handleSubmitTest]);

  // Start new test
  async function handleStartTest() {
    setLoadingTest(true);
    setErrorMessage(null);

    try {
      const data = await api.getMockTest({
        topic: selectedTopic === 'All Topics' ? '' : selectedTopic,
        count: questionCount
      });

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions available for this topic selection.');
      }

      setTestQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedAnswers({});

      const duration = data.timeLimitSeconds || data.questions.length * 90;
      setTimeLeft(duration);
      setTotalTime(duration);
      startTimeRef.current = Date.now();
      setIsTestActive(true);
    } catch (err) {
      setErrorMessage(err.message || 'Could not start mock test.');
    } finally {
      setLoadingTest(false);
    }
  }

  // Answer selection
  function handleSelectOption(optionIndex) {
    const q = testQuestions[currentIndex];
    if (!q) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [q.id]: optionIndex
    }));
  }

  // Format time MM:SS
  function formatTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Format date helper
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  }

  // --------------------------------------------------------------------------
  // Active Assessment View
  // --------------------------------------------------------------------------
  if (isTestActive) {
    if (isSubmitting) {
      return <Loader message="Submitting and grading your assessment on the server..." />;
    }

    const currentQ = testQuestions[currentIndex];
    const totalQ = testQuestions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    const isLastQuestion = currentIndex === totalQ - 1;
    const isTimeUrgent = timeLeft < 60;

    return (
      <div className="active-test-container">
        {/* Sticky Active Test Bar */}
        <div className="active-test-header card">
          <div className="test-header-info">
            <span className="test-topic-pill">{selectedTopic}</span>
            <span className="test-counter-text">
              Question <strong>{currentIndex + 1}</strong> of {totalQ}
            </span>
          </div>

          <div className="test-header-center">
            <span className="answered-stats-pill">
              {answeredCount} of {totalQ} Answered
            </span>
          </div>

          <div className="test-header-right">
            <div className={`test-timer-badge ${isTimeUrgent ? 'timer-urgent' : ''}`}>
              <Clock size={16} className="timer-icon" aria-hidden="true" />
              <span className="timer-text mono-text">{formatTimer(timeLeft)}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSubmitTest}
              disabled={isSubmitting}
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Question Progress Navigator Strip */}
        <div className="question-strip-container">
          <div className="question-strip">
            {testQuestions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;

              let stripClass = 'strip-unanswered';
              if (isAnswered) stripClass = 'strip-answered';
              if (isCurrent) stripClass += ' strip-current';

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  className={`strip-pill ${stripClass}`}
                  onClick={() => setCurrentIndex(idx)}
                  title={`Go to Question ${idx + 1}`}
                  aria-label={`Question ${idx + 1} ${isAnswered ? 'Answered' : 'Unanswered'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="card active-question-card">
            <div className="question-card-top">
              <span className="q-badge-topic">{currentQ.topic}</span>
              <span className="q-badge-num">Q{currentIndex + 1}</span>
            </div>

            <h3 className="active-question-text">{currentQ.question}</h3>

            {/* 4 Options Grid */}
            <div className="options-grid">
              {currentQ.options.map((optText, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;

                return (
                  <div
                    key={optIdx}
                    className={`option-card ${isSelected ? 'option-selected' : ''}`}
                    onClick={() => handleSelectOption(optIdx)}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleSelectOption(optIdx);
                      }
                    }}
                  >
                    <div className="option-indicator">
                      <span className="option-letter mono-text">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                    </div>
                    <div className="option-text">{optText}</div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Bottom Controls */}
            <div className="question-nav-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <div className="nav-center-hint">
                <span>Select an option to save choice</span>
              </div>

              {isLastQuestion ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                >
                  Submit Assessment <CheckCircle2 size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                >
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Setup & History View (Default)
  // --------------------------------------------------------------------------
  return (
    <div className="mock-tests-page">
      {/* Page Header */}
      <div className="admin-header-row">
        <div>
          <h1 className="page-title">Timed Mock Assessments</h1>
          <p className="page-subtitle">
            Simulate campus technical MCQ rounds with topic-wise randomized tests and server-side evaluation
          </p>
        </div>
      </div>

      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={handleStartTest}
        />
      )}

      {inventoryError && (
        <ErrorMessage
          message={inventoryError}
          onRetry={loadCounts}
        />
      )}

      {/* Main Two-Column Setup Layout */}
      {totalInventory === 0 && !loadingInventory && !inventoryError ? (
        <div className="card" style={{ marginBottom: '24px' }}>
          <EmptyState
            icon={FileCheck2}
            title="No Mock Tests Available"
            message="There are currently no mock test questions configured in the question bank. Please check back later or notify an administrator."
            actionLabel="Refresh Inventory"
            onAction={loadCounts}
          />
        </div>
      ) : (
        <div className="mock-setup-grid">
        {/* Left Column: Assessment Setup Card */}
        <div className="card test-setup-card">
          <div className="setup-card-header">
            <div className="setup-icon-box">
              <FileCheck2 size={24} className="setup-icon" aria-hidden="true" />
            </div>
            <div>
              <h3 className="setup-title">Configure Assessment</h3>
              <p className="setup-desc">Choose your topic and preferred question length</p>
            </div>
          </div>

          <div className="setup-form-body">
            {/* Topic Select */}
            <div className="form-group">
              <label htmlFor="test-topic" className="form-label">
                Assessment Topic
              </label>
              <select
                id="test-topic"
                className="form-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={loadingTest}
              >
                <option value="All Topics">All Topics (Mixed Assessment)</option>
                {TOPICS.filter((t) => t !== 'All Topics').map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Select a specific DSA domain or test across all 9 topics simultaneously.
              </span>
            </div>

            {/* Question Count Selector */}
            <div className="form-group">
              <div className="label-with-counter">
                <label className="form-label">Number of Questions</label>
                {availableCount > 0 && availableCount < 10 && (
                  <span className="count-available-tag">
                    {availableCount} available
                  </span>
                )}
              </div>
              <div className="count-selector-row">
                {QUESTION_COUNTS.map((count) => {
                  const isCapped = availableCount > 0 && count > availableCount;
                  return (
                    <button
                      key={count}
                      type="button"
                      className={`count-btn ${questionCount === count ? 'count-btn-active' : ''} ${isCapped ? 'count-btn-disabled' : ''}`}
                      onClick={() => !isCapped && setQuestionCount(count)}
                      disabled={loadingTest || isCapped}
                      title={isCapped ? `Only ${availableCount} questions available for this topic` : `${count} questions`}
                    >
                      <span className="count-num mono-text">{count}</span>
                      <span className="count-sub">Questions</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Warning when topic has fewer questions */}
            {availableCount < 5 && availableCount > 0 && (
              <div className="topic-capacity-warning">
                <AlertTriangle size={16} className="capacity-warn-icon" aria-hidden="true" />
                <span>
                  Only <strong>{availableCount}</strong> questions available for this topic.
                </span>
              </div>
            )}
            {availableCount === 0 && (
              <div className="topic-capacity-warning topic-capacity-empty">
                <AlertTriangle size={16} className="capacity-warn-icon" aria-hidden="true" />
                <span>
                  No questions currently available for this topic.
                </span>
              </div>
            )}

            {/* Time Estimate Banner */}
            <div className="test-estimate-banner">
              <Clock size={16} className="estimate-icon" aria-hidden="true" />
              <div>
                <strong>Estimated Duration: {Math.round((questionCount * 90) / 60)} Minutes</strong>
                <p>Based on a standard 90 seconds allocation per question.</p>
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              className="btn btn-primary btn-block start-test-btn"
              onClick={handleStartTest}
              disabled={loadingTest || availableCount === 0}
            >
              {loadingTest ? (
                <span>Generating Assessment...</span>
              ) : (
                <>
                  <Play size={16} />
                  <span>Start Assessment Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Rules & Info Card */}
        <div className="card test-rules-card">
          <h3 className="rules-card-title">Assessment Guidelines</h3>
          <ul className="rules-list">
            <li className="rule-item">
              <div className="rule-bullet">•</div>
              <div>
                <strong>Anti-Cheat Information Hiding:</strong> Correct answers are never sent in the question payload. Full evaluation occurs strictly on the server upon submission.
              </div>
            </li>
            <li className="rule-item">
              <div className="rule-bullet">•</div>
              <div>
                <strong>Countdown Timer:</strong> A live timer ticks down at the top of your test. If time expires, your answers are automatically submitted.
              </div>
            </li>
            <li className="rule-item">
              <div className="rule-bullet">•</div>
              <div>
                <strong>Free Navigation:</strong> You can jump between questions anytime using the question indicator strip or the Previous and Next buttons.
              </div>
            </li>
            <li className="rule-item">
              <div className="rule-bullet">•</div>
              <div>
                <strong>Detailed Scorecard:</strong> After submitting, you will receive an accuracy breakdown and per-question reviews with algorithmic explanations.
              </div>
            </li>
          </ul>
        </div>
      </div>
      )}

      {/* Historical Attempts Section ("Past Tests") */}
      <div className="card past-attempts-card" id="past-tests">
        <div className="attempts-header">
          <div className="attempts-title-group">
            <History size={18} className="attempts-icon" aria-hidden="true" />
            <h3 className="attempts-title">Past Tests</h3>
          </div>
          <span className="attempts-count-badge">
            {attemptsTotalCount} total test{attemptsTotalCount === 1 ? '' : 's'}
          </span>
        </div>

        {attemptsError ? (
          <ErrorMessage
            message={attemptsError}
            onRetry={() => loadAttempts(attemptsPage)}
          />
        ) : loadingAttempts ? (
          <Loader message="Loading your historical performance..." />
        ) : pastAttempts.length === 0 ? (
          <div className="empty-attempts-box">
            <Award size={32} className="empty-attempts-icon" aria-hidden="true" />
            <p>You haven't taken a test yet. Configure a test above to test your skills!</p>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table */}
            <div className="table-responsive past-tests-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Time Taken</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAttempts.map((att) => {
                    const isHigh = att.accuracy >= 70;
                    const isMed = att.accuracy >= 50;

                    return (
                      <tr key={att.id}>
                        <td>
                          <div className="date-cell">
                            <Calendar size={13} className="date-icon" aria-hidden="true" />
                            <span>{formatDate(att.date)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="topic-text font-semibold">{att.topic}</span>
                        </td>
                        <td>
                          <span className="mono-text">
                            {att.score} / {att.total}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`app-status-badge ${
                              isHigh
                                ? 'status-badge-selected'
                                : isMed
                                ? 'status-badge-interview'
                                : 'status-badge-rejected'
                            }`}
                          >
                            {att.accuracy}%
                          </span>
                        </td>
                        <td>
                          <span className="mono-text text-muted">
                            {Math.floor((att.timeTaken || 0) / 60)}m {(att.timeTaken || 0) % 60}s
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/mock-tests/attempts/${att.id}`}
                            className="btn btn-secondary btn-sm"
                            title="View detailed scorecard and question review"
                          >
                            <span>View report</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (Visible on < 640px) */}
            <div className="past-tests-mobile-cards">
              {pastAttempts.map((att) => {
                const isHigh = att.accuracy >= 70;
                const isMed = att.accuracy >= 50;

                return (
                  <div key={att.id} className="past-test-mobile-card">
                    <div className="pt-card-header">
                      <span className="pt-card-topic font-semibold">{att.topic}</span>
                      <span
                        className={`app-status-badge ${
                          isHigh
                            ? 'status-badge-selected'
                            : isMed
                            ? 'status-badge-interview'
                            : 'status-badge-rejected'
                        }`}
                      >
                        {att.accuracy}%
                      </span>
                    </div>

                    <div className="pt-card-meta">
                      <div className="pt-meta-item">
                        <span className="pt-meta-label">Score:</span>
                        <span className="mono-text font-semibold">{att.score} / {att.total}</span>
                      </div>
                      <div className="pt-meta-item">
                        <span className="pt-meta-label">Time:</span>
                        <span className="mono-text text-muted">
                          {Math.floor((att.timeTaken || 0) / 60)}m {(att.timeTaken || 0) % 60}s
                        </span>
                      </div>
                      <div className="pt-meta-item">
                        <span className="pt-meta-label">Date:</span>
                        <span className="text-muted">{formatDate(att.date)}</span>
                      </div>
                    </div>

                    <Link
                      to={`/mock-tests/attempts/${att.id}`}
                      className="btn btn-secondary btn-sm btn-block pt-card-btn"
                    >
                      <span>View report</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {attemptsTotalPages > 1 && (
              <div className="past-tests-pagination">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => loadAttempts(attemptsPage - 1)}
                  disabled={attemptsPage <= 1 || loadingAttempts}
                  aria-label="Previous page of past tests"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="pagination-page-indicator mono-text">
                  Page {attemptsPage} of {attemptsTotalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => loadAttempts(attemptsPage + 1)}
                  disabled={attemptsPage >= attemptsTotalPages || loadingAttempts}
                  aria-label="Next page of past tests"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
