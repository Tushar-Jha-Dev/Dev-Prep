/**
 * DevPrep - Theme & Visual Skin Context (`ThemeContext.jsx`)
 * 
 * Provides global state management for:
 * 1. Visual Theme Skins: 'paper' | 'studio' (persisted in `devprep-skin`, default from DEFAULT_SKIN)
 * 2. Mode / Color Scheme: 'light' | 'dark' (persisted in `devprep-theme`, with OS preference detection)
 * 
 * Exposed API:
 * - { skin, setSkin, mode, toggleMode, theme, setTheme, toggleTheme, isDark }
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_SKIN,
  AVAILABLE_SKINS,
  SKIN_STORAGE_KEY,
  THEME_STORAGE_KEY
} from '../config/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 1. Visual Skin State ('paper' | 'studio')
  const [skin, setSkinState] = useState(() => {
    try {
      const savedSkin = localStorage.getItem(SKIN_STORAGE_KEY);
      if (savedSkin && AVAILABLE_SKINS.includes(savedSkin)) {
        return savedSkin;
      }
    } catch (_) {
      // LocalStorage access fallback
    }
    return DEFAULT_SKIN;
  });

  // 2. Light/Dark Mode State
  const [mode, setModeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (_) {
      // LocalStorage access fallback
    }
    return 'light';
  });

  // Apply data-skin attribute and persist whenever skin changes
  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch (_) {}
  }, [skin]);

  // Apply data-theme attribute and persist whenever mode changes
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (_) {}
  }, [mode]);

  // Safe skin setter with validation against supported skins
  const setSkin = useCallback((newSkin) => {
    if (AVAILABLE_SKINS.includes(newSkin)) {
      setSkinState(newSkin);
    } else {
      setSkinState(DEFAULT_SKIN);
    }
  }, []);

  // Safe mode toggler
  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setMode = useCallback((newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setModeState(newMode);
    }
  }, []);

  const value = {
    // Current primary API
    skin,
    setSkin,
    mode,
    setMode,
    toggleMode,

    // Backward-compatible aliases for existing components
    theme: mode,
    setTheme: setMode,
    toggleTheme: toggleMode,
    isDark: mode === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
