import React, { useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  FileCheck2,
  Briefcase,
  User,
  ShieldAlert,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import Avatar from './Avatar';

/**
 * DevPrep - Sidebar Navigation (`Sidebar.jsx`)
 * Conforms to Design.md Section 5 & Phase 11 Accessibility & Drawer Specs:
 * - 232px, --sidebar-bg, 1px right border
 * - Fraunces wordmark with terracotta dot
 * - Lucide icons (18px, 1.75 stroke)
 * - Conditional Admin link
 * - User summary and logout button at bottom
 * - Responsive off-canvas slide-out drawer on mobile (< 900px)
 * - Body scroll locking while mobile drawer is open
 * - Keyboard Escape listener and focus restoration to trigger
 */
export default function Sidebar({ isOpen, onClose, triggerRef }) {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const isAdminActive = location.pathname.startsWith('/admin');

  // Handle close and return focus to trigger
  const handleClose = useCallback(() => {
    if (onClose) onClose();
    if (triggerRef?.current) {
      setTimeout(() => triggerRef.current.focus(), 50);
    }
  }, [onClose, triggerRef]);

  // Lock background body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/problems', label: 'Problems', icon: Code2 },
    { to: '/mock-tests', label: 'Mock Tests', icon: FileCheck2 },
    { to: '/applications', label: 'Applications', icon: Briefcase },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}
        role={isOpen ? 'dialog' : 'complementary'}
        aria-modal={isOpen ? 'true' : undefined}
        aria-label="Navigation sidebar"
      >
        {/* Top Header & Brand */}
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={handleClose} aria-label="DevPrep Dashboard">
            <Logo size={28} showWordmark={true} />
          </NavLink>
          {onClose && (
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={handleClose}
              aria-label="Close navigation"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="nav-item">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
                    }
                    onClick={handleClose}
                  >
                    <Icon size={18} strokeWidth={1.75} className="nav-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}

            {/* Admin Section (Single unified link for all /admin routes) */}
            {isAdmin && (
              <>
                <li className="nav-divider" aria-hidden="true"></li>
                <li className="nav-item">
                  <NavLink
                    to="/admin/questions"
                    className={`nav-link ${isAdminActive ? 'nav-link-active' : ''}`}
                    onClick={handleClose}
                  >
                    <ShieldAlert size={18} strokeWidth={1.75} className="nav-icon" aria-hidden="true" />
                    <span>Admin</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-info">
            <Avatar user={user} size={38} />
            <div className="user-details">
              <span className="user-name" title={user?.name}>{user?.name || 'User'}</span>
              <span className="user-email" title={user?.email}>{user?.email || ''}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="logout-btn"
            title="Log out of DevPrep"
            aria-label="Log out"
          >
            <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
