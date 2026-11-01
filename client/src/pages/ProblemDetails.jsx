import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  CircleDashed,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Code2,
  Save,
  Trash2,
  Clock,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Terminal,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { runTestsAsync } from '../utils/testRunner';
import { handleEditorKeyDown, getCursorLineCol } from '../utils/codeEditorUtils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C++'];
const MAX_CODE_CHARS = 20000;

function formatArgValue(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch (_) {
      return String(val);
    }
  }
  return String(val);
}

function formatArgsList(args) {
  if (!Array.isArray(args)) return formatArgValue(args);
  return args.map((a) => formatArgValue(a)).join(', ');
}

/**
 * DevPrep - Problem Details Page (`ProblemDetails.jsx`)
 * Conforms to Design.md & Phase 10B Client-Side Test Runner:
 * - Title, difficulty and topic badges
 * - "Mark as Solved" toggle button
 * - Description, code-styled example blocks, constraints list
 * - Collapsible Solution Approach
 * - "My Solution" Code Notepad:
 *   - JetBrains Mono monospace textarea
 *   - Tab key inserts 2 spaces without losing focus
 *   - Language switcher preserving in-memory drafts across languages
 *   - Unsaved changes indicator & "Saved at <time>" timestamp
 *   - Character count indicator (max 20,000 chars)
 *   - Clear button with confirmation
 * - Client-Side Test Runner (Phase 10B):
 *   - Web Worker isolated execution with 2.0s hard timeout
 *   - "Run Tests" action for JavaScript when testCases exist
 *   - Automatic prefill of starterCode when draft is empty
 *   - Test results panel: passed/failed cards, hidden test concealment, runtime ms
 *   - Captured console logs view
 *   - "All tests passed! 🎉" celebration with "Mark as Solved" action
 */
export default function ProblemDetails() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  useDocumentTitle(question ? question.title : 'Problem Details');

  const [isSolved, setIsSolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [showApproach, setShowApproach] = useState(false);

  // My Solution States
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [drafts, setDrafts] = useState({
    JavaScript: '',
    Python: '',
    Java: '',
    'C++': ''
  });
  const [savedSolutions, setSavedSolutions] = useState({});
  const [savingSolution, setSavingSolution] = useState(false);
  const [solutionMessage, setSolutionMessage] = useState(null);
  const [solutionError, setSolutionError] = useState(null);
  const [autoSaveError, setAutoSaveError] = useState(null);

  // Save queue & concurrency management
  const isSavingRef = useRef(false);
  const nextSaveRef = useRef(null);
  const savedSolutionsRef = useRef(savedSolutions);
  const draftsRef = useRef(drafts);
  const lastConfirmedSavedCodeRef = useRef({});

  useEffect(() => {
    savedSolutionsRef.current = savedSolutions;
  }, [savedSolutions]);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  // Warn before leaving page if there are unsaved changes
  const hasAnyUnsavedChanges = LANGUAGES.some((lang) => {
    const code = drafts[lang] || '';
    const saved = savedSolutions[lang];
    if (saved) {
      return code !== saved.code;
    }
    if (code === '') return false;
    if (lang === 'JavaScript' && question?.starterCode && code === question.starterCode) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!hasAnyUnsavedChanges) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasAnyUnsavedChanges]);


  // Editor DOM References & Cursor Tracking
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Test Runner States (Phase 10B)
  const [runningTests, setRunningTests] = useState(false);
  const [testReport, setTestReport] = useState(null);
  const [activeTestTab, setActiveTestTab] = useState('cases'); // 'cases' | 'console'

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [questionData, progressData, solutionsData] = await Promise.all([
        api.getQuestion(id),
        api.getProgress(),
        api.getQuestionSolutions(id)
      ]);

      setQuestion(questionData);
      const solvedList = progressData.solvedQuestionIds || [];
      setIsSolved(solvedList.includes(id));

      // Process saved solutions map
      const solMap = {};
      const initialDrafts = {
        JavaScript: '',
        Python: '',
        Java: '',
        'C++': ''
      };

      const confirmedMap = {};
      (solutionsData || []).forEach((item) => {
        solMap[item.language] = {
          id: item.id,
          code: item.code,
          updatedAt: item.updatedAt
        };
        initialDrafts[item.language] = item.code;
        confirmedMap[item.language] = item.code;
      });
      lastConfirmedSavedCodeRef.current = confirmedMap;

      // Phase 10B: If no saved JavaScript code exists and question has starterCode, prefill draft
      if (!initialDrafts.JavaScript && questionData.starterCode) {
        initialDrafts.JavaScript = questionData.starterCode;
      }

      setSavedSolutions(solMap);
      setDrafts(initialDrafts);
    } catch (err) {
      setError(err.message || 'Failed to load problem details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Mark as solved toggle
  const handleToggleSolved = async () => {
    if (toggleLoading) return;
    setToggleLoading(true);

    const nextSolvedState = !isSolved;
    const action = nextSolvedState ? 'markSolved' : 'unmarkSolved';
    setIsSolved(nextSolvedState);

    try {
      await api.updateProgress({ action, questionId: id });
    } catch (err) {
      setIsSolved(!nextSolvedState);
      alert(`Could not update solved status: ${err.message}`);
    } finally {
      setToggleLoading(false);
    }
  };

  // Sync cursor position (Line & Col) from textarea selection
  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const { value, selectionStart } = textareaRef.current;
      setCursorPos(getCursorLineCol(value, selectionStart));
    }
  };

  // Sync line number gutter scroll position to textarea scroll
  const handleEditorScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keep gutter scroll aligned when switching language tab
  useEffect(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    updateCursorPosition();
  }, [selectedLanguage]);

  // Accessible & IDE-like KeyDown Handler with undo/redo preservation
  const handleEditorKeyDownEvent = (e) => {
    const hasTests = question && Array.isArray(question.testCases) && question.testCases.length > 0;
    const isJS = selectedLanguage === 'JavaScript';

    handleEditorKeyDown(e, {
      onRunTests: hasTests && isJS ? handleRunTests : undefined,
      onSave: handleSaveSolution
    });

    // Update line and column immediately after key action
    setTimeout(updateCursorPosition, 0);
  };

  // Check if auto-save should be skipped
  const shouldSkipAutoSave = (code, lang) => {
    const saved = savedSolutionsRef.current[lang] || savedSolutions[lang];
    const lastSavedCode = saved ? saved.code : (lastConfirmedSavedCodeRef.current[lang] ?? null);

    // Skip if code equals what was last saved
    if (lastSavedCode !== null && code === lastSavedCode) {
      return true;
    }

    // Skip if no saved solution yet and code is empty or unchanged starter code
    if (!saved && lastSavedCode === null) {
      if (code === '') return true;
      const starter = (lang === 'JavaScript' && question?.starterCode) ? question.starterCode : '';
      if (starter && code === starter) return true;
    }

    return false;
  };

  // Core save executor with serialization queue (prevent overlapping requests, latest code wins)
  const performSave = async (lang, codeToSave, { isAutoSave = false } = {}) => {
    if (isSavingRef.current) {
      nextSaveRef.current = { lang, code: codeToSave, isAutoSave };
      return;
    }

    isSavingRef.current = true;
    setSavingSolution(true);
    if (!isAutoSave) {
      setSolutionError(null);
      setSolutionMessage(null);
    }
    setAutoSaveError(null);

    let targetLang = lang;
    let targetCode = codeToSave;
    let targetIsAutoSave = isAutoSave;

    try {
      while (targetLang && targetCode !== undefined) {
        if (targetCode.length > MAX_CODE_CHARS) {
          const limitMsg = `Code exceeds the maximum limit of ${MAX_CODE_CHARS.toLocaleString()} characters.`;
          if (targetIsAutoSave) {
            setAutoSaveError(`Tests ran, but your code could not be saved: ${limitMsg}`);
          } else {
            setSolutionError(limitMsg);
          }
          break;
        }

        try {
          const saved = await api.saveSolution(id, {
            language: targetLang,
            code: targetCode
          });

          lastConfirmedSavedCodeRef.current[targetLang] = saved.code;

          setSavedSolutions((prev) => ({
            ...prev,
            [targetLang]: {
              id: saved.id,
              code: saved.code,
              updatedAt: saved.updatedAt
            }
          }));

          if (!targetIsAutoSave) {
            setSolutionMessage(`Saved successfully at ${new Date(saved.updatedAt).toLocaleTimeString()}`);
            setTimeout(() => setSolutionMessage(null), 4000);
          }
        } catch (err) {
          const reason = err.message || 'Failed to save solution';
          if (targetIsAutoSave) {
            setAutoSaveError(`Tests ran, but your code could not be saved: ${reason}`);
          } else {
            setSolutionError(reason);
          }
        }

        // Handle any newer save request queued while the request was in-flight
        if (nextSaveRef.current) {
          const next = nextSaveRef.current;
          nextSaveRef.current = null;
          const lastSaved = lastConfirmedSavedCodeRef.current[next.lang];
          if (next.code !== lastSaved) {
            targetLang = next.lang;
            targetCode = next.code;
            targetIsAutoSave = next.isAutoSave;
            continue;
          }
        }

        break;
      }
    } finally {
      isSavingRef.current = false;
      setSavingSolution(false);
    }
  };

  // Save current language solution
  const handleSaveSolution = async () => {
    const currentCode = drafts[selectedLanguage] || '';
    await performSave(selectedLanguage, currentCode, { isAutoSave: false });
  };

  // Reset to starter code template (JavaScript only)
  const handleResetStarterCode = () => {
    if (!question || !question.starterCode) return;
    if (window.confirm('Reset JavaScript solution to the starter code template? Current edits will be replaced.')) {
      setDrafts((prev) => ({
        ...prev,
        JavaScript: question.starterCode
      }));
      setSolutionMessage('Reset to starter code template');
      setTimeout(() => setSolutionMessage(null), 3000);
    }
  };

  // Clear current language code with confirmation
  const handleClearSolution = async () => {
    const isSaved = Boolean(savedSolutions[selectedLanguage]);
    const confirmText = isSaved
      ? `Are you sure you want to delete your saved ${selectedLanguage} solution? This will also remove it from the database.`
      : `Are you sure you want to clear your current ${selectedLanguage} draft?`;

    if (window.confirm(confirmText)) {
      if (isSaved) {
        try {
          await api.deleteSolution(id, selectedLanguage);
          setSavedSolutions((prev) => {
            const copy = { ...prev };
            delete copy[selectedLanguage];
            return copy;
          });
          delete lastConfirmedSavedCodeRef.current[selectedLanguage];
        } catch (err) {
          alert(`Failed to delete saved solution: ${err.message}`);
          return;
        }
      }

      setDrafts((prev) => ({
        ...prev,
        [selectedLanguage]: ''
      }));
      setSolutionMessage(`Cleared ${selectedLanguage} code`);
      setTimeout(() => setSolutionMessage(null), 3000);
    }
  };

  // Phase 10B: Client-Side Test Runner Execution
  const handleRunTests = async () => {
    if (!question || !Array.isArray(question.testCases) || question.testCases.length === 0) return;
    if (runningTests) return;

    const codeToTest = drafts.JavaScript || '';

    // Auto-save user code concurrently if changes exist; do not await before running tests
    if (!shouldSkipAutoSave(codeToTest, 'JavaScript')) {
      performSave('JavaScript', codeToTest, { isAutoSave: true }).catch(() => {});
    }

    setRunningTests(true);
    setTestReport(null);
    setActiveTestTab('cases');

    try {
      const report = await runTestsAsync({
        userCode: codeToTest,
        functionName: question.functionName,
        testCases: question.testCases,
        compareMode: question.compare || 'exact'
      });
      setTestReport(report);
    } catch (err) {
      setTestReport({
        status: 'error',
        error: err && err.message ? err.message : 'Failed to execute test suite',
        results: [],
        logs: [],
        passCount: 0,
        totalCount: question.testCases.length
      });
    } finally {
      setRunningTests(false);
    }
  };

  if (loading) {
    return <Loader message="Loading problem details..." />;
  }

  if (error) {
    return (
      <div className="problem-details-container">
        <Link to="/problems" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Problem Library</span>
        </Link>
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="problem-details-container">
        <div className="problem-top-nav">
          <Link to="/problems" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Problem Library</span>
          </Link>
        </div>
        <EmptyState
          icon={Code2}
          title="Question Not Found"
          message="The algorithmic problem you are looking for does not exist or may have been removed."
          actionLabel="Back to Problem Library"
          actionHref="/problems"
        />
      </div>
    );
  }

  const currentCode = drafts[selectedLanguage] || '';
  const currentSaved = savedSolutions[selectedLanguage];
  const hasUnsavedChanges = currentCode !== (currentSaved?.code || '');
  const hasTestCases = Array.isArray(question.testCases) && question.testCases.length > 0;
  const isJavaScript = selectedLanguage === 'JavaScript';


  const lineCount = Math.max(1, currentCode.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  return (
    <div className="problem-details-page">
      {/* Top Navigation */}
      <div className="problem-top-nav">
        <Link to="/problems" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Problem Library</span>
        </Link>
      </div>

      {/* Problem Header Card */}
      <div className="card problem-header-card">
        <div className="problem-header-top">
          <div className="problem-meta-tags">
            <span className="topic-badge">{question.topic}</span>
            <DifficultyBadge difficulty={question.difficulty} />
          </div>

          <button
            type="button"
            onClick={handleToggleSolved}
            disabled={toggleLoading}
            className={`btn ${isSolved ? 'btn-solved' : 'btn-primary'} solve-toggle-btn`}
            title={isSolved ? 'Click to unmark as solved' : 'Click to mark as solved'}
          >
            {isSolved ? (
              <>
                <CheckCircle size={18} />
                <span>Solved</span>
              </>
            ) : (
              <>
                <CircleDashed size={18} />
                <span>Mark as Solved</span>
              </>
            )}
          </button>
        </div>

        <h2 className="problem-title">{question.title}</h2>
      </div>

      {/* Problem Body (Description, Examples, Constraints, Approach) */}
      <div className="card problem-body-card">
        <h3 className="section-heading">Description</h3>
        <p className="problem-description">{question.description}</p>

        {/* Examples Section */}
        {question.examples && question.examples.length > 0 && (
          <div className="problem-examples-section">
            <h3 className="section-heading">Examples</h3>
            {question.examples.map((example, index) => (
              <div key={index} className="example-block">
                <span className="example-label">Example {index + 1}:</span>
                <div className="example-code-wrapper">
                  <div className="example-row">
                    <span className="code-key">Input:</span>
                    <code>{example.input}</code>
                  </div>
                  <div className="example-row">
                    <span className="code-key">Output:</span>
                    <code>{example.output}</code>
                  </div>
                  {example.explanation && (
                    <div className="example-row">
                      <span className="code-key">Explanation:</span>
                      <span className="explanation-text">{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints Section */}
        {question.constraints && question.constraints.length > 0 && (
          <div className="problem-constraints-section">
            <h3 className="section-heading">Constraints</h3>
            <ul className="constraints-list">
              {question.constraints.map((constraint, index) => (
                <li key={index} className="constraint-item">
                  <code>{constraint}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Solution Approach (Collapsible Accordion) */}
        {question.solutionApproach && (
          <div className="solution-approach-container">
            <button
              type="button"
              className="approach-toggle-btn"
              onClick={() => setShowApproach(!showApproach)}
              aria-expanded={showApproach}
            >
              <div className="approach-btn-left">
                <Lightbulb size={18} className="approach-icon" />
                <span>Solution Approach & Intuition</span>
              </div>
              {showApproach ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showApproach && (
              <div className="approach-content">
                <p>{question.solutionApproach}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* "My Solution" Code Notepad Section (Phase 5B & 10B) */}
      <div className="card solution-editor-card">
        <div className="editor-header">
          <div className="editor-title-group">
            <div className="editor-icon-wrapper">
              <Code2 size={20} className="editor-icon" aria-hidden="true" />
            </div>
            <div>
              <h3 className="editor-title">My Solution</h3>
              <p className="editor-subtitle">
                {hasTestCases && isJavaScript
                  ? 'Write your solution and run automated test cases directly in your browser.'
                  : hasTestCases && !isJavaScript
                  ? 'Running code is supported for JavaScript only. Solutions in other languages are saved as notes.'
                  : 'Save your personal solution notes (text notepad only — not compiled or executed).'}
              </p>
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="editor-controls">
            <label htmlFor="solution-language" className="sr-only">Language</label>
            <select
              id="solution-language"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                if (solutionError) setSolutionError(null);
                if (autoSaveError) setAutoSaveError(null);
              }}
              className="form-select editor-language-select"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang} {savedSolutions[lang] ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback Banners */}
        {solutionError && (
          <div className="editor-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{solutionError}</span>
          </div>
        )}

        {solutionMessage && (
          <div className="editor-success-banner">
            <CheckCircle size={16} />
            <span>{solutionMessage}</span>
          </div>
        )}

        {/* Monospace Code Editor Shell with Line Numbers Gutter */}
        <div className="code-editor-shell">
          <div className="editor-gutter" ref={gutterRef} aria-hidden="true">
            {lineNumbers.map((num) => (
              <div
                key={num}
                className={`gutter-line ${num === cursorPos.line ? 'active' : ''}`}
              >
                {num}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={currentCode}
            onChange={(e) => {
              const val = e.target.value;
              setDrafts((prev) => ({ ...prev, [selectedLanguage]: val }));
              if (solutionError) setSolutionError(null);
              if (autoSaveError) setAutoSaveError(null);
              updateCursorPosition();
            }}
            onKeyDown={handleEditorKeyDownEvent}
            onScroll={handleEditorScroll}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onSelect={updateCursorPosition}
            placeholder={`// Write your ${selectedLanguage} solution here...\n// Press Tab to insert indentation`}
            className="editor-textarea"
            maxLength={MAX_CODE_CHARS}
            spellCheck="false"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
          />
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="editor-shortcuts-hint">
          <span><kbd>{isMac ? '⌘' : 'Ctrl'}+Enter</kbd> Run Tests</span>
          <span><kbd>{isMac ? '⌘' : 'Ctrl'}+S</kbd> Save</span>
          <span><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> Indent</span>
          <span><kbd>Esc</kbd> Exit Editor</span>
        </div>

        {/* Editor Footer: Metadata, Status & Actions */}
        <div className="editor-footer">
          <div className="editor-status-info">
            {savingSolution ? (
              <span className="saved-time-label">
                <Loader2 size={13} className="spin-icon" />
                <span>Saving...</span>
              </span>
            ) : hasUnsavedChanges ? (
              <span className="unsaved-badge">
                <span className="unsaved-dot">•</span> Unsaved changes
              </span>
            ) : currentSaved ? (
              <span className="saved-time-label">
                <Clock size={14} />
                <span>Saved at {new Date(currentSaved.updatedAt).toLocaleTimeString()} ({new Date(currentSaved.updatedAt).toLocaleDateString()})</span>
              </span>
            ) : (
              <span className="empty-draft-label">No code saved for {selectedLanguage} yet</span>
            )}

            {autoSaveError && (
              <span className="editor-autosave-error" role="status">
                <AlertCircle size={14} />
                <span>{autoSaveError}</span>
              </span>
            )}

            <span className="editor-cursor-pos">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="char-count-label">
              {currentCode.length} / {MAX_CODE_CHARS.toLocaleString()} chars
            </span>
            {hasTestCases && !isJavaScript && (
              <span className="test-runner-notice-badge">
                Running code is supported for JavaScript only.
              </span>
            )}
          </div>

          <div className="editor-actions">
            {isJavaScript && question.starterCode && (
              <button
                type="button"
                onClick={handleResetStarterCode}
                className="btn btn-secondary btn-sm"
                title="Reset to original starter code template"
              >
                <RotateCcw size={14} />
                <span>Starter Code</span>
              </button>
            )}

            {currentCode.trim().length > 0 && (
              <button
                type="button"
                onClick={handleClearSolution}
                className="btn btn-secondary btn-sm editor-clear-btn"
                title={`Clear ${selectedLanguage} code`}
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveSolution}
              disabled={savingSolution || (!hasUnsavedChanges && currentCode.length === 0)}
              className="btn btn-secondary btn-sm editor-save-btn"
            >
              <Save size={14} />
              <span>{savingSolution ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Phase 10B: Run Tests Button */}
            {hasTestCases && isJavaScript && (
              <button
                type="button"
                onClick={handleRunTests}
                disabled={runningTests}
                className="btn btn-primary btn-sm btn-run-tests"
                title="Run tests in browser Web Worker sandbox"
              >
                {runningTests ? (
                  <>
                    <Loader2 size={15} className="spin-icon" />
                    <span>Running Tests...</span>
                  </>
                ) : (
                  <>
                    <Play size={15} fill="currentColor" />
                    <span>Run Tests</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phase 10B: Test Runner Results Panel */}
      {hasTestCases && (runningTests || testReport) && (
        <div className="card test-runner-panel" role="region" aria-label="Test Execution Results">
          {/* Panel Header */}
          <div className="test-runner-header">
            <div className="test-runner-header-left">
              <h3 className="test-runner-title">Test Results</h3>
              {runningTests ? (
                <span className="test-runner-pill test-pill-running">
                  <Loader2 size={13} className="spin-icon" /> Executing in sandbox...
                </span>
              ) : testReport?.status === 'timeout' ? (
                <span className="test-runner-pill test-pill-timeout">
                  <AlertTriangle size={13} /> Time limit exceeded (2.0s cap)
                </span>
              ) : testReport?.status === 'error' ? (
                <span className="test-runner-pill test-pill-error">
                  <AlertCircle size={13} /> Execution Error
                </span>
              ) : testReport?.status === 'completed' ? (
                <span
                  className={`test-runner-pill ${
                    testReport.passCount === testReport.totalCount
                      ? 'test-pill-success'
                      : 'test-pill-failed'
                  }`}
                >
                  {testReport.passCount === testReport.totalCount ? (
                    <CheckCircle size={13} />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  {testReport.passCount} of {testReport.totalCount} tests passed
                </span>
              ) : null}
            </div>

            {testReport?.logs && testReport.logs.length > 0 && !runningTests && (
              <div className="test-runner-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTestTab === 'cases'}
                  className={`test-tab-btn ${activeTestTab === 'cases' ? 'active' : ''}`}
                  onClick={() => setActiveTestTab('cases')}
                >
                  Test Cases ({testReport.passCount}/{testReport.totalCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTestTab === 'console'}
                  className={`test-tab-btn ${activeTestTab === 'console' ? 'active' : ''}`}
                  onClick={() => setActiveTestTab('console')}
                >
                  <Terminal size={13} /> Console ({testReport.logs.length})
                </button>
              </div>
            )}
          </div>

          {/* Running State Loader */}
          {runningTests && (
            <div className="test-running-state">
              <Loader2 size={24} className="spin-icon" />
              <p>Executing test cases in isolated background Web Worker thread...</p>
            </div>
          )}

          {/* Timeout Alert Box */}
          {!runningTests && testReport?.status === 'timeout' && (
            <div className="test-alert-box test-alert-timeout">
              <div className="test-alert-title">
                <AlertTriangle size={18} />
                <span>Time Limit Exceeded</span>
              </div>
              <p className="test-alert-message">
                Your code took longer than the 2.0-second execution cap to finish. The worker sandbox was terminated. Please check for infinite loops, recursive calls without base cases, or computationally intensive algorithms.
              </p>
            </div>
          )}

          {/* Syntax / Runtime Compilation Error Alert Box */}
          {!runningTests && testReport?.status === 'error' && (
            <div className="test-alert-box test-alert-error">
              <div className="test-alert-title">
                <AlertCircle size={18} />
                <span>Runtime or Syntax Error</span>
              </div>
              <pre className="test-alert-code">{testReport.error}</pre>
            </div>
          )}

          {/* Completed Report Display */}
          {!runningTests && testReport?.status === 'completed' && (
            <>
              {/* All Tests Passed Celebration Banner */}
              {testReport.passCount === testReport.totalCount && testReport.totalCount > 0 && (
                <div className="test-celebration-banner">
                  <div className="celebration-content">
                    <Sparkles size={20} className="celebration-icon" />
                    <div>
                      <strong className="celebration-text">All tests passed! 🎉</strong>
                      <p className="celebration-subtext">All {testReport.totalCount} automated test cases verified your solution successfully.</p>
                    </div>
                  </div>
                  {!isSolved ? (
                    <button
                      type="button"
                      onClick={handleToggleSolved}
                      disabled={toggleLoading}
                      className="btn btn-solved celebration-action-btn"
                    >
                      <CheckCircle size={16} />
                      <span>Mark as Solved</span>
                    </button>
                  ) : (
                    <span className="celebration-badge-solved">
                      <CheckCircle size={15} /> Already Solved
                    </span>
                  )}
                </div>
              )}

              {/* View Tab 1: Test Cases Cards */}
              {activeTestTab === 'cases' && (
                <div className="test-cases-list" role="tabpanel" aria-label="Test cases details">
                  {testReport.results.map((res) => (
                    <div
                      key={res.index}
                      className={`test-case-card ${res.passed ? 'tc-pass' : 'tc-fail'}`}
                    >
                      <div className="tc-card-header">
                        <div className="tc-title-group">
                          <span className="tc-title">Test Case #{res.index}</span>
                          {res.hidden && <span className="tc-hidden-pill">Hidden Test</span>}
                        </div>
                        <div className="tc-meta-group">
                          <span className="tc-duration">{res.durationMs}ms</span>
                          <span className={`tc-status-badge ${res.passed ? 'status-pass' : 'status-fail'}`}>
                            {res.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>

                      <div className="tc-card-body">
                        {res.hidden ? (
                          <p className="tc-hidden-description">
                            Hidden test case to verify edge cases and algorithmic boundaries. Input parameters and expected output values are kept private.
                          </p>
                        ) : (
                          <div className="tc-details-grid">
                            <div className="tc-detail-row">
                              <span className="tc-detail-label">Input:</span>
                              <pre className="tc-detail-value">{formatArgsList(res.args)}</pre>
                            </div>
                            <div className="tc-detail-row">
                              <span className="tc-detail-label">Expected:</span>
                              <pre className="tc-detail-value">{formatArgValue(res.expected)}</pre>
                            </div>
                            <div className="tc-detail-row">
                              <span className="tc-detail-label">Output:</span>
                              <pre className={`tc-detail-value ${res.passed ? 'val-pass' : 'val-fail'}`}>
                                {res.error ? `Error: ${res.error}` : formatArgValue(res.got)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View Tab 2: Console Logs Panel */}
              {activeTestTab === 'console' && testReport.logs && (
                <div className="test-console-panel" role="tabpanel" aria-label="Console output logs">
                  <div className="test-console-header">
                    <span>Captured Console Output (Max 50 lines)</span>
                  </div>
                  <pre className="test-console-body">
                    {testReport.logs.map((line, idx) => (
                      <div key={idx} className="console-line">
                        <span className="console-line-num">{idx + 1}</span>
                        <span className="console-line-text">{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
