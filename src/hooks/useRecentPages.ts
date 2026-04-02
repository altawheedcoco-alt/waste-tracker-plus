import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'irecycle_recent_pages';
const MAX_RECENT = 5;

interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
}

/**
 * Tracks recently visited dashboard pages for quick navigation
 */
export function useRecentPages() {
  const location = useLocation();
  const [recentPages, setRecentPages] = useState<RecentPage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Record page visit
  const recordVisit = useCallback((path: string, label: string) => {
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== path);
      const updated = [{ path, label, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Auto-record dashboard page visits
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard') && location.pathname !== '/dashboard') {
      // Extract a readable label from the path
      const segments = location.pathname.replace('/dashboard/', '').split('/');
      const label = segments[0]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      recordVisit(location.pathname, label);
    }
  }, [location.pathname, recordVisit]);

  const clearRecent = useCallback(() => {
    setRecentPages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { recentPages, recordVisit, clearRecent };
}
