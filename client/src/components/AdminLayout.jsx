import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Code2, FileCheck2 } from 'lucide-react';

/**
 * DevPrep - Shared Admin Layout (`AdminLayout.jsx`)
 * 
 * Concepts explained:
 * 1. Persistent Shared Header: Keeps the segmented tab bar mounted during navigation
 *    between "Coding Questions" and "MCQ Bank", avoiding layout jumps.
 * 2. Segmented Tab Indicator: Highlights the active section with `--accent-soft` background
 *    and `--accent` text.
 * 3. Route Change Effects: Scrolls to the top and triggers a smooth 150ms content fade-in.
 */
export default function AdminLayout() {
  const location = useLocation();
  const isQuestionsActive = location.pathname.startsWith('/admin/questions');
  const isMcqActive = location.pathname.startsWith('/admin/mcq');

  // Scroll to top whenever sub-route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="admin-page-container">
      {/* Segmented Tab Bar at the top of Admin Content */}
      <div className="admin-segmented-tabs" role="tablist" aria-label="Admin Navigation Tabs">
        <NavLink
          to="/admin/questions"
          className={`admin-segmented-tab ${isQuestionsActive ? 'admin-tab-active' : ''}`}
          role="tab"
          aria-selected={isQuestionsActive}
        >
          <Code2 size={16} aria-hidden="true" />
          <span>Coding Questions</span>
        </NavLink>

        <NavLink
          to="/admin/mcq"
          className={`admin-segmented-tab ${isMcqActive ? 'admin-tab-active' : ''}`}
          role="tab"
          aria-selected={isMcqActive}
        >
          <FileCheck2 size={16} aria-hidden="true" />
          <span>MCQ Bank</span>
        </NavLink>
      </div>

      {/* Main Content Area with 150ms transition and reserved min-height */}
      <div key={location.pathname} className="admin-content-view">
        <Outlet />
      </div>
    </div>
  );
}
