import { useEffect } from 'react';

/**
 * Custom React hook to set the page document.title dynamically
 * Conforms to DevPrep title format: "<Page Title> · DevPrep"
 * Falls back to "DevPrep – Developer Preparation Platform" when title is omitted.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title && title.trim()) {
      document.title = `${title.trim()} · DevPrep`;
    } else {
      document.title = 'DevPrep – Developer Preparation Platform';
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
