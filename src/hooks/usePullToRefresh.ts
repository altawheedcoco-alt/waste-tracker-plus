/**
 * usePullToRefresh - هوك لسحب الشاشة للتحديث على الموبايل
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number; // 0-1
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: PullToRefreshOptions): PullToRefreshState => {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    pullProgress: 0,
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    // Only trigger if scrolled to top
    if (window.scrollY > 5) return;
    startY.current = e.touches[0].clientY;
    pulling.current = false;
  }, [disabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    if (window.scrollY > 5) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 10) {
      pulling.current = true;
      const distance = Math.min(diff * 0.5, maxPull);
      const progress = Math.min(distance / threshold, 1);
      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance: distance,
        pullProgress: progress,
      }));
      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, state.isRefreshing, maxPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || disabled) {
      setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, pullProgress: 0 }));
      return;
    }

    const distance = currentY.current - startY.current;
    pulling.current = false;

    if (distance * 0.5 >= threshold) {
      setState(prev => ({ ...prev, isPulling: false, isRefreshing: true, pullDistance: 0, pullProgress: 0 }));
      try {
        await onRefresh();
      } finally {
        setState({ isPulling: false, isRefreshing: false, pullDistance: 0, pullProgress: 0 });
      }
    } else {
      setState({ isPulling: false, isRefreshing: false, pullDistance: 0, pullProgress: 0 });
    }
  }, [disabled, threshold, onRefresh]);

  useEffect(() => {
    const opts: AddEventListenerOptions = { passive: false };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, opts);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
};

export default usePullToRefresh;
