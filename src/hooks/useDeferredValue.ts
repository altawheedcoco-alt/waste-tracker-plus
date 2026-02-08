import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for deferring expensive computations
 * تأجيل العمليات الحسابية الثقيلة
 */
export function useDeferredValue<T>(value: T, delay: number = 200): T {
  const [deferredValue, setDeferredValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return deferredValue;
}

/**
 * Hook for debouncing function calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedFn = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

/**
 * Hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 100
): T {
  const lastRun = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledFn = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      lastRun.current = now;
      fn(...args);
    } else {
      // Schedule for remaining time
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        fn(...args);
      }, delay - timeSinceLastRun);
    }
  }, [fn, delay]) as T;

  return throttledFn;
}

export default useDeferredValue;
