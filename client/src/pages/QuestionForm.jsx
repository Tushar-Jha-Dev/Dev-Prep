import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, Code, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ALLOWED_TOPICS = [
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

const ALLOWED_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const ALLOWED_COMPARE_MODES = ['exact', 'unorderedArray'];

/**
 * DevPrep - Admin Question Creation & Editing Form (`QuestionForm.jsx`)
 * Conforms to Design.md & Phase 10B Client-Side Test Runner:
 * - Title, Topic, Difficulty, Description
 * - Dynamic Examples and Constraints
 * - Solution Approach Guide
 * - Client-Side Test Runner Configuration (Optional):
 *   - Target Function Name (JS identifier)
 *   - Compare Mode (exact / unorderedArray)
 *   - Starter Code (JavaScript template)
 *   - Test Cases JSON Editor with real-time validation
 */
export default function QuestionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Form Fields State
  const [title, setTitle] = useState('');
  useDocumentTitle(isEditMode ? (title ? `Edit: ${title}` : 'Edit Question') : 'Add Question');
  const [topic, setTopic] = useState(ALLOWED_TOPICS[0]);
  const [difficulty, setDifficulty] = useState(ALLOWED_DIFFICULTIES[0]);
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState([
    { input: '', output: '', explanation: '' }
  ]);
  const [constraints, setConstraints] = useState(['']);
  const [solutionApproach, setSolutionApproach] = useState('');

  // Phase 10B Test Runner Fields
  const [functionName, setFunctionName] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [compare, setCompare] = useState('exact');
  const [testCasesJson, setTestCasesJson] = useState('');

  // Page Lifecycle State
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch question details if in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    async function fetchQuestion() {
      try {
        setInitialLoading(true);
        setErrorMessage(null);
        const q = await api.getQuestion(id);
        if (!isMounted) return;

        setTitle(q.title || '');
        setTopic(q.topic || ALLOWED_TOPICS[0]);
        setDifficulty(q.difficulty || ALLOWED_DIFFICULTIES[0]);
        setDescription(q.description || '');
        setExamples(
          Array.isArray(q.examples) && q.examples.length > 0
            ? q.examples
            : [{ input: '', output: '', explanation: '' }]
        );
        setConstraints(
          Array.isArray(q.constraints) && q.constraints.length > 0
            ? q.constraints
            : ['']
        );
        setSolutionApproach(q.solutionApproach || '');

        // Phase 10B fields
        setFunctionName(q.functionName || '');
        setStarterCode(q.starterCode || '');
        setCompare(q.compare || 'exact');
        setTestCasesJson(
          Array.isArray(q.testCases) && q.testCases.length > 0
            ? JSON.stringify(q.testCases, null, 2)
            : ''
        );
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load question details');
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    fetchQuestion();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Dynamic Examples Helpers
  function handleAddExample() {
    setExamples([...examples, { input: '', output: '', explanation: '' }]);
  }

  function handleRemoveExample(index) {
    if (examples.length === 1) {
      setExamples([{ input: '', output: '', explanation: '' }]);
      return;
    }
    setExamples(examples.filter((_, i) => i !== index));
  }

  function handleExampleChange(index, field, value) {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    setExamples(updated);
  }

  // Dynamic Constraints Helpers
  function handleAddConstraint() {
    setConstraints([...constraints, '']);
  }

  function handleRemoveConstraint(index) {
    if (constraints.length === 1) {
      setConstraints(['']);
      return;
    }
    setConstraints(constraints.filter((_, i) => i !== index));
  }

  function handleConstraintChange(index, value) {
    const updated = [...constraints];
    updated[index] = value;
    setConstraints(updated);
  }

  // Load sample test cases JSON template
  function handleInsertTestCasesTemplate() {
    const fnName = functionName.trim() || 'solution';
    const sample = [
      {
        args: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        hidden: false
      },
      {
        args: [[3, 2, 4], 6],
        expected: [1, 2],
        hidden: false
      },
      {
        args: [[3, 3], 6],
        expected: [0, 1],
        hidden: true
      }
    ];
    setTestCasesJson(JSON.stringify(sample, null, 2));

    if (!starterCode.trim()) {
      setStarterCode(`/**\n * @param {...any} args\n * @return {any}\n */\nfunction ${fnName}(...args) {\n  // Write your code here\n}`);
    }
  }

  // Form Submission
  async function handleSubmit(e) {
    e.preventDefault();

    // Client-side validation
    const errors = {};
    if (!title.trim()) errors.title = 'Title is required';
    if (!description.trim()) errors.description = 'Description is required';
    if (!ALLOWED_TOPICS.includes(topic)) errors.topic = 'Please select a valid topic';
    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) errors.difficulty = 'Please select a valid difficulty';

    // Phase 10B validations
    if (functionName.trim()) {
      const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
      if (!identifierRegex.test(functionName.trim())) {
        errors.functionName = 'Function name must be a valid JavaScript identifier (e.g. twoSum)';
      }
    }

    let parsedTestCases = undefined;
    if (testCasesJson.trim()) {
      try {
        parsedTestCases = JSON.parse(testCasesJson);
        if (!Array.isArray(parsedTestCases)) {
          errors.testCases = 'Test cases JSON must be an array of test case objects';
        } else if (parsedTestCases.length > 20) {
          errors.testCases = 'Cannot have more than 20 test cases per question';
        } else {
          for (let i = 0; i < parsedTestCases.length; i++) {
            const tc = parsedTestCases[i];
            if (!tc || typeof tc !== 'object') {
              errors.testCases = `Test case #${i + 1} must be an object`;
              break;
            }
            if (!Array.isArray(tc.args)) {
              errors.testCases = `Test case #${i + 1} must have an "args" array`;
              break;
            }
            if (tc.expected === undefined) {
              errors.testCases = `Test case #${i + 1} must specify an "expected" value`;
              break;
            }
          }
        }
      } catch (err) {
        errors.testCases = `Invalid JSON format in test cases: ${err.message}`;
      }

      if (!functionName.trim()) {
        errors.functionName = 'Function name is required when test cases are provided';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setErrorMessage(null);

    // Filter out completely empty examples and constraints
    const cleanExamples = examples.filter(
      (ex) => ex.input.trim() !== '' || ex.output.trim() !== ''
    );
    const cleanConstraints = constraints
      .map((c) => c.trim())
      .filter((c) => c !== '');

    const payload = {
      title: title.trim(),
      topic,
      difficulty,
      description: description.trim(),
      examples: cleanExamples,
      constraints: cleanConstraints,
      solutionApproach: solutionApproach.trim(),
      functionName: functionName.trim() || undefined,
      starterCode: starterCode ? starterCode : undefined,
      compare: compare || undefined,
      testCases: testCasesJson.trim() && parsedTestCases ? parsedTestCases : (isEditMode ? [] : undefined)
    };

    try {
      if (isEditMode) {
        await api.updateQuestion(id, payload);
      } else {
        await api.createQuestion(payload);
      }
      navigate('/admin/questions', {
        state: {
          notification: `Question "${payload.title}" successfully ${isEditMode ? 'updated' : 'created'}!`
        }
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (initialLoading) {
    return <Loader message="Loading question details for editing..." />;
  }

  if (errorMessage && isEditMode && !title) {
    return (
      <div className="admin-form-container">
        <ErrorMessage
          message={errorMessage}
          onRetry={() => window.location.reload()}
        />
        <div style={{ marginTop: '16px' }}>
          <Link to="/admin/questions" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Question List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-form-container">
      {/* Back navigation */}
      <div className="admin-form-nav">
        <Link to="/admin/questions" className="back-link">
          <ArrowLeft size={16} /> Back to Admin Questions
        </Link>
      </div>

      <div className="card admin-form-card">
        <div className="admin-form-header">
          <h2 className="admin-form-title">
            {isEditMode ? 'Edit DSA Question' : 'Add New DSA Question'}
          </h2>
          <p className="admin-form-subtitle">
            {isEditMode
              ? `Editing question identifier: ${id}`
              : 'Add a new algorithmic problem to the DevPrep question repository.'}
          </p>
        </div>

        {errorMessage && (
          <div className="form-alert form-alert-danger" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="q-title" className="form-label">
              Question Title <span className="required-star">*</span>
            </label>
            <input
              id="q-title"
              type="text"
              className={`form-input ${fieldErrors.title ? 'input-error' : ''}`}
              placeholder="e.g. Longest Palindromic Substring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
          </div>

          {/* Topic & Difficulty Row */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="q-topic" className="form-label">
                Topic Category <span className="required-star">*</span>
              </label>
              <select
                id="q-topic"
                className={`form-select ${fieldErrors.topic ? 'input-error' : ''}`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isSubmitting}
              >
                {ALLOWED_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldErrors.topic && <span className="field-error">{fieldErrors.topic}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="q-difficulty" className="form-label">
                Difficulty Level <span className="required-star">*</span>
              </label>
              <select
                id="q-difficulty"
                className={`form-select ${fieldErrors.difficulty ? 'input-error' : ''}`}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isSubmitting}
              >
                {ALLOWED_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {fieldErrors.difficulty && (
                <span className="field-error">{fieldErrors.difficulty}</span>
              )}
            </div>
          </div>

          {/* Problem Description */}
          <div className="form-group">
            <label htmlFor="q-description" className="form-label">
              Problem Description <span className="required-star">*</span>
            </label>
            <textarea
              id="q-description"
              rows={5}
              className={`form-textarea ${fieldErrors.description ? 'input-error' : ''}`}
              placeholder="Describe the problem clearly, including input expectations and edge cases..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
            {fieldErrors.description && (
              <span className="field-error">{fieldErrors.description}</span>
            )}
          </div>

          {/* Dynamic Examples Section */}
          <div className="dynamic-section">
            <div className="dynamic-section-header">
              <div>
                <h4 className="dynamic-section-title">Examples (Display Test Cases)</h4>
                <p className="dynamic-section-hint">
                  Visual samples rendered for students on the problem details page.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddExample}
                disabled={isSubmitting}
              >
                <Plus size={14} /> Add Example
              </button>
            </div>

            <div className="dynamic-list">
              {examples.map((ex, index) => (
                <div key={index} className="dynamic-card">
                  <div className="dynamic-card-header">
                    <span className="dynamic-badge">Example {index + 1}</span>
                    <button
                      type="button"
                      className="btn-icon-danger"
                      onClick={() => handleRemoveExample(index)}
                      title="Remove example"
                      aria-label={`Remove example ${index + 1}`}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label-sub">Input</label>
                      <input
                        type="text"
                        className="form-input form-input-mono"
                        placeholder="e.g. s = &quot;babad&quot;"
                        value={ex.input}
                        onChange={(e) => handleExampleChange(index, 'input', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label-sub">Output</label>
                      <input
                        type="text"
                        className="form-input form-input-mono"
                        placeholder="e.g. &quot;bab&quot;"
                        value={ex.output}
                        onChange={(e) => handleExampleChange(index, 'output', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label-sub">Explanation (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. &quot;aba&quot; is also a valid answer."
                      value={ex.explanation || ''}
                      onChange={(e) => handleExampleChange(index, 'explanation', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Constraints Section */}
          <div className="dynamic-section">
            <div className="dynamic-section-header">
              <div>
                <h4 className="dynamic-section-title">Constraints</h4>
                <p className="dynamic-section-hint">
                  Mathematical boundaries, array sizes, and value limits.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddConstraint}
                disabled={isSubmitting}
              >
                <Plus size={14} /> Add Constraint
              </button>
            </div>

            <div className="dynamic-list">
              {constraints.map((c, index) => (
                <div key={index} className="dynamic-constraint-row">
                  <span className="constraint-bullet" aria-hidden="true">•</span>
                  <input
                    type="text"
                    className="form-input form-input-mono flex-1"
                    placeholder="e.g. 1 <= s.length <= 1000"
                    value={c}
                    onChange={(e) => handleConstraintChange(index, e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="btn-icon-danger"
                    onClick={() => handleRemoveConstraint(index)}
                    title="Remove constraint"
                    aria-label={`Remove constraint ${index + 1}`}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Solution Approach (Collapsible guide for students) */}
          <div className="form-group">
            <label htmlFor="q-solution" className="form-label">
              Solution Approach (Hint & Algorithm Overview)
            </label>
            <textarea
              id="q-solution"
              rows={4}
              className="form-textarea"
              placeholder="Outline the algorithmic strategy (e.g. Expand around center, two pointers, time/space complexity)..."
              value={solutionApproach}
              onChange={(e) => setSolutionApproach(e.target.value)}
              disabled={isSubmitting}
            />
            <span className="form-hint">
              This approach is shown in the collapsible "Solution Approach" accordion on the Problem Details page.
            </span>
          </div>

          {/* Phase 10B: Client-Side Test Runner Configuration (Optional) */}
          <div className="dynamic-section test-runner-admin-section">
            <div className="dynamic-section-header">
              <div>
                <h4 className="dynamic-section-title">
                  <Code size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Client-Side Test Runner (Optional — JavaScript Web Worker)
                </h4>
                <p className="dynamic-section-hint">
                  Configure automated browser testing. If left blank, this problem remains a notes-only problem without a "Run Tests" button.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleInsertTestCasesTemplate}
                disabled={isSubmitting}
              >
                Insert Sample Template
              </button>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="q-fnName" className="form-label">
                  Target Function Name
                </label>
                <input
                  id="q-fnName"
                  type="text"
                  className={`form-input form-input-mono ${fieldErrors.functionName ? 'input-error' : ''}`}
                  placeholder="e.g. twoSum, maxProfit, isValid"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  disabled={isSubmitting}
                />
                <span className="form-hint">Valid JavaScript identifier name called by the test runner.</span>
                {fieldErrors.functionName && <span className="field-error">{fieldErrors.functionName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="q-compare" className="form-label">
                  Comparison Mode
                </label>
                <select
                  id="q-compare"
                  className="form-select"
                  value={compare}
                  onChange={(e) => setCompare(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="exact">exact (Deep equality match)</option>
                  <option value="unorderedArray">unorderedArray (Ignore array element order)</option>
                </select>
                <span className="form-hint">Use unorderedArray for algorithms where returned sets/indices can appear in any sequence.</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="q-starterCode" className="form-label">
                Starter Code (JavaScript)
              </label>
              <textarea
                id="q-starterCode"
                rows={5}
                className="form-textarea form-input-mono"
                placeholder={`/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction solution(nums) {\n  // Write your code here\n}`}
                value={starterCode}
                onChange={(e) => setStarterCode(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="form-hint">Prefilled in the student editor when they first open the problem.</span>
            </div>

            <div className="form-group">
              <label htmlFor="q-testCases" className="form-label">
                Test Cases (JSON Array)
              </label>
              <textarea
                id="q-testCases"
                rows={7}
                className={`form-textarea form-input-mono ${fieldErrors.testCases ? 'input-error' : ''}`}
                placeholder={`[\n  {\n    "args": [[2, 7, 11, 15], 9],\n    "expected": [0, 1],\n    "hidden": false\n  }\n]`}
                value={testCasesJson}
                onChange={(e) => setTestCasesJson(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="form-hint">
                Array of objects with <code>args</code> (arguments list), <code>expected</code> (expected return value), and <code>hidden</code> (boolean). Maximum 20 cases.
              </span>
              {fieldErrors.testCases && <span className="field-error">{fieldErrors.testCases}</span>}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="admin-form-actions">
            <Link
              to="/admin/questions"
              className="btn btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={16} />
              {isSubmitting
                ? 'Saving Question...'
                : isEditMode
                ? 'Update Question'
                : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
