import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseAutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export const useAutoRefresh = ({ intervalMs = 15000, enabled = true }: UseAutoRefreshOptions = {}) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 800);
  }, [queryClient]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      queryClient.invalidateQueries();
      setLastRefresh(new Date());
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, intervalMs, queryClient]);

  return { refresh, isRefreshing, lastRefresh };
};
