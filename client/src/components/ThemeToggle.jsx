import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * DevPrep - Theme Toggle Button (`ThemeToggle.jsx`)
 * 
 * Concepts explained:
 * 1. Accessibility: Uses `aria-label` and `aria-pressed` for screen readers.
 * 2. Visual Polish: Uses Lucide Sun and Moon icons with smooth transitions.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
