import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to auto-save form data to localStorage.
 * @param key - Unique storage key
 * @param data - Current form data
 * @param debounceMs - Debounce delay in ms (default: 1000)
 * @returns { clearSaved, hasSavedData, loadSaved }
 */
export function useFormAutoSave<T>(key: string, data: T, debounceMs = 1000) {
  const storageKey = `form_autosave_${key}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Check for saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setHasSavedData(saved !== null);
    } catch {
      setHasSavedData(false);
    }
  }, [storageKey]);

  // Auto-save with debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        // Only save if data has meaningful content
        const hasContent = Object.values(data as Record<string, unknown>).some(
          v => typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined
        );
        if (hasContent) {
          localStorage.setItem(storageKey, JSON.stringify(data));
          setHasSavedData(true);
        }
      } catch {
        // Storage full or unavailable — silently ignore
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, storageKey, debounceMs]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSavedData(false);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const loadSaved = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  return { clearSaved, hasSavedData, loadSaved };
}
