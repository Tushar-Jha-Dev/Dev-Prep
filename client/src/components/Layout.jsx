import React, { useState, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import Avatar from './Avatar';
import ErrorBoundary from './ErrorBoundary';

/**
 * DevPrep - Main Application Shell Layout (`Layout.jsx`)
 * Conforms to Design.md Section 5:
 * - 232px fixed sidebar
 * - Top bar with page title and ThemeToggle
 * - Content area with max-width 1180px and 28-32px padding
 */
export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const menuBtnRef = useRef(null);
  const { user } = useAuth();

  // Map route pathname to clean page title
  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/problems/')) return 'Problem Details';
    if (pathname.startsWith('/problems')) return 'Problem Library';
    if (pathname.startsWith('/mock-tests/result')) return 'Mock Test Result';
    if (pathname.startsWith('/mock-tests')) return 'Mock Tests';
    if (pathname.startsWith('/applications')) return 'Applications Tracker';
    if (pathname.startsWith('/admin/questions/new')) return 'Add New Question';
    if (pathname.startsWith('/admin/questions/') && pathname.endsWith('/edit')) return 'Edit Question';
    if (pathname.startsWith('/admin/questions')) return 'Admin Questions';
    if (pathname.startsWith('/admin/mcq')) return 'Admin MCQ Bank';
    if (pathname.startsWith('/profile')) return 'Profile & Settings';
    return 'DevPrep';
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        triggerRef={menuBtnRef}
      />

      <div className="app-main-wrapper">
        {/* Top Bar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              ref={menuBtnRef}
              id="mobile-menu-btn"
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isSidebarOpen}
              aria-controls="app-sidebar"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <Link to="/" className="topbar-mobile-logo" aria-label="DevPrep Dashboard">
              <Logo size={24} showWordmark={false} />
            </Link>
            <h1 className="topbar-title">{getPageTitle(location.pathname)}</h1>
          </div>

          <div className="topbar-right">
            <ThemeToggle />
            <Link
              to="/profile"
              className="topbar-avatar-link"
              title="Profile & Settings"
              aria-label="Profile & Settings"
            >
              <Avatar user={user} size={40} />
            </Link>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="app-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
