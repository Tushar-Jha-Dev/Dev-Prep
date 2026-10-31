import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Flame,
  FileCheck2,
  Briefcase,
  ArrowRight,
  TrendingUp,
  History,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import WeeklyChart from '../components/WeeklyChart';
import ActivityFeed from '../components/ActivityFeed';
import ErrorMessage from '../components/ErrorMessage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * DevPrep - Student Analytics & Activity Dashboard (`Dashboard.jsx`)
 * Conforms strictly to Design.md Section 7.2:
 * 1. Warm greeting with the user's name
 * 2. 4 Stat Cards: Problems Solved, Day Streak, Mock Tests, Applications
 * 3. Left: DSA progress card with calculated bars per topic
 * 4. Right: Weekly progress chart (Recharts with flat --accent bars, no gradients)
 * 5. Bottom: Recent activity list & quick preparation shortcuts
 * 6. Responsive adaptation (4 -> 2 -> 1 columns under 900px/700px)
 */
export default function Dashboard() {
  const { user } = useAuth();
  useDocumentTitle('Dashboard');

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load progress and aggregated metrics
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await api.getProgress();
      setDashboardData(data);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load preparation dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const handleProgressUpdated = () => {
      loadDashboard();
    };

    window.addEventListener('devprep-progress-updated', handleProgressUpdated);
    window.addEventListener('focus', handleProgressUpdated);
    return () => {
      window.removeEventListener('devprep-progress-updated', handleProgressUpdated);
      window.removeEventListener('focus', handleProgressUpdated);
    };
  }, [loadDashboard]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header-skeleton">
          <div className="skeleton-line" style={{ width: '220px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '380px', height: '16px' }} />
        </div>

        {/* 4 Stat Skeletons */}
        <div className="dashboard-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card stat-card">
              <div className="skeleton-line" style={{ width: '80px', height: '14px', marginBottom: '14px' }} />
              <div className="skeleton-line" style={{ width: '60px', height: '36px', marginBottom: '10px' }} />
              <div className="skeleton-line" style={{ width: '120px', height: '12px' }} />
            </div>
          ))}
        </div>

        {/* Middle Section Skeletons */}
        <div className="dashboard-middle-grid">
          <div className="card dashboard-section-card" style={{ minHeight: '340px' }}>
            <div className="skeleton-line" style={{ width: '160px', height: '20px', marginBottom: '20px' }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '6px' }} />
                <div className="skeleton-line" style={{ width: '100%', height: '8px' }} />
              </div>
            ))}
          </div>

          <div className="card dashboard-section-card" style={{ minHeight: '340px' }}>
            <div className="skeleton-line" style={{ width: '180px', height: '20px', marginBottom: '20px' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '200px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (errorMessage) {
    return (
      <div className="dashboard-page">
        <ErrorMessage
          message={errorMessage}
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  const { stats, topicProgress, weeklyActivity, activity } = dashboardData || {};
  const streak = stats?.streak || { current: 0 };

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="dashboard-greeting-banner">
        <Avatar user={user} size={48} className="dashboard-greeting-avatar" />
        <div>
          <h1 className="greeting-title font-fraunces">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Student'}!
          </h1>
          <p className="greeting-subtitle">
            Track your DSA practice, simulate campus technical tests, and monitor your placement applications in one place.
          </p>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="dashboard-stats-grid">
        <StatCard
          label="Problems Solved"
          value={stats?.totalSolved || 0}
          subnote={`of ${stats?.totalQuestions || 36} total (${stats?.solvePercentage || 0}%)`}
          icon={Code2}
        />

        <StatCard
          label="Current Day Streak"
          value={streak.current || 0}
          subnote={streak.current === 1 ? '1 day active' : `${streak.current} consecutive days active`}
          tag={streak.current > 0 ? 'Active' : null}
          icon={Flame}
        />

        <StatCard
          label="Mock Tests"
          value={stats?.mockTestsCount || 0}
          subnote="Assessments completed"
          icon={FileCheck2}
        />

        <StatCard
          label="Applications"
          value={stats?.applicationsCount || 0}
          subnote={
            stats?.interviewCount > 0
              ? `${stats.interviewCount} in interview round`
              : 'Recruitment pipeline'
          }
          icon={Briefcase}
        />
      </div>

      {/* Middle Grid: DSA Topic Proficiency & Weekly Chart */}
      <div className="dashboard-middle-grid">
        {/* Left Card: DSA Topic Proficiency Bars */}
        <div className="card dashboard-section-card topic-proficiency-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-card-title font-fraunces">Topic Proficiency</h2>
              <p className="section-card-subtitle">
                Progress computed across all 9 core DSA syllabus domains
              </p>
            </div>
            <Link to="/problems" className="card-header-link" title="Open Problem Library">
              <span>View All</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="topic-bars-list">
            {(topicProgress || []).map((t) => (
              <div key={t.topic} className="topic-bar-row">
                <ProgressBar
                  label={t.topic}
                  current={t.solved}
                  total={t.total}
                  percent={t.percent}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Weekly Progress Activity Chart (Recharts) */}
        <div className="card dashboard-section-card weekly-chart-card">
          <div className="section-card-header">
            <div>
              <h2 className="section-card-title font-fraunces">Weekly Activity</h2>
              <p className="section-card-subtitle">
                Problems solved daily over the past 7 days
              </p>
            </div>
            <div className="chart-legend-badge">
              <TrendingUp size={14} className="legend-icon" aria-hidden="true" />
              <span>7-Day Rolling</span>
            </div>
          </div>

          <div className="chart-container-box">
            <WeeklyChart data={weeklyActivity || []} />
          </div>

          <div className="chart-card-footer">
            <span className="chart-footer-note">
              Consistent daily practice builds your problem-solving intuition and maintains your streak.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Quick Actions */}
      <div className="dashboard-bottom-grid">
        {/* Recent Activity Feed */}
        <div className="card dashboard-section-card activity-feed-card">
          <div className="section-card-header">
            <div className="header-with-icon">
              <History size={18} className="section-title-icon" aria-hidden="true" />
              <h2 className="section-card-title font-fraunces">Recent Practice Activity</h2>
            </div>
            <span className="section-header-tag">Live Feed</span>
          </div>

          <ActivityFeed activities={activity || []} />
        </div>

        {/* Quick Preparation Actions */}
        <div className="card dashboard-section-card quick-actions-card">
          <div className="section-card-header">
            <div className="header-with-icon">
              <Compass size={18} className="section-title-icon" aria-hidden="true" />
              <h2 className="section-card-title font-fraunces">Quick Practice</h2>
            </div>
          </div>

          <div className="quick-actions-list">
            <Link to="/problems" className="quick-action-btn">
              <div className="action-btn-left">
                <Code2 size={18} className="action-icon action-icon-code" aria-hidden="true" />
                <div className="action-text-group">
                  <span className="action-title">Solve DSA Problems</span>
                  <span className="action-desc">Pick problems filtered by difficulty</span>
                </div>
              </div>
              <ArrowRight size={16} className="action-arrow" aria-hidden="true" />
            </Link>

            <Link to="/mock-tests" className="quick-action-btn">
              <div className="action-btn-left">
                <FileCheck2 size={18} className="action-icon action-icon-test" aria-hidden="true" />
                <div className="action-text-group">
                  <span className="action-title">Take Mock Assessment</span>
                  <span className="action-desc">Test conceptual speed with 90s timer</span>
                </div>
              </div>
              <ArrowRight size={16} className="action-arrow" aria-hidden="true" />
            </Link>

            <Link to="/applications" className="quick-action-btn">
              <div className="action-btn-left">
                <Briefcase size={18} className="action-icon action-icon-app" aria-hidden="true" />
                <div className="action-text-group">
                  <span className="action-title">Track Applications</span>
                  <span className="action-desc">Log interviews and recruitment stages</span>
                </div>
              </div>
              <ArrowRight size={16} className="action-arrow" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
