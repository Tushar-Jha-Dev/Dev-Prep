/**
 * DevPrep - Global Theme & Skin Configuration (`theme.js`)
 * 
 * Central registry for active visual theme skins.
 * Reverting the theme skin across the entire app is a one-line change:
 * set DEFAULT_SKIN = 'paper'.
 */

export const DEFAULT_SKIN = 'paper';
export const AVAILABLE_SKINS = ['paper', 'studio'];
export const DEFAULT_THEME = 'light';
export const AVAILABLE_THEMES = ['light', 'dark'];
export const SKIN_STORAGE_KEY = 'devprep-skin';
export const THEME_STORAGE_KEY = 'devprep-theme';
