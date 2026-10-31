import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, FileCode } from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';

/**
 * DevPrep - Question Table Component (`QuestionTable.jsx`)
 * Conforms to Design.md Section 6 & Phase 5B:
 * - Table header row on --surface-2
 * - Displays solve status, title, topic, difficulty, saved-solution indicator, and action
 */
export default function QuestionTable({ questions, solvedIds = [], solutionQuestionIds = [] }) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '48px', textAlign: 'center' }}>Status</th>
            <th>Title</th>
            <th style={{ width: '180px' }}>Topic</th>
            <th style={{ width: '120px' }}>Difficulty</th>
            <th style={{ width: '100px', textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => {
            const isSolved = solvedIds.includes(q.id);
            const hasSolution = solutionQuestionIds.includes(q.id);

            return (
              <tr key={q.id} className="table-row">
                <td data-label="Status" style={{ textAlign: 'center' }}>
                  {isSolved ? (
                    <span title="Solved" className="status-icon status-solved">
                      <CheckCircle2 size={18} strokeWidth={2} />
                    </span>
                  ) : (
                    <span title="Unsolved" className="status-icon status-unsolved">
                      <CircleDashed size={18} strokeWidth={1.5} />
                    </span>
                  )}
                </td>
                <td data-label="Title">
                  <div className="question-title-cell">
                    <Link to={`/problems/${q.id}`} className="question-table-link">
                      {q.title}
                    </Link>
                    {hasSolution && (
                      <span className="solution-pill" title="You have saved code for this problem">
                        <FileCode size={12} aria-hidden="true" />
                        <span>Solution</span>
                      </span>
                    )}
                  </div>
                </td>
                <td data-label="Topic">
                  <span className="topic-tag">{q.topic}</span>
                </td>
                <td data-label="Difficulty">
                  <DifficultyBadge difficulty={q.difficulty} />
                </td>
                <td data-label="Action" style={{ textAlign: 'right' }}>
                  <Link
                    to={`/problems/${q.id}`}
                    className={`btn btn-sm ${isSolved ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {isSolved ? 'Review' : 'Solve'}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
