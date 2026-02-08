import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  prefetchOnMount?: boolean;
  backgroundRefetch?: boolean;
  dedupeInterval?: number;
}

/**
 * Hook محسّن للاستعلامات مع تخزين مؤقت ذكي
 */
export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  prefetchOnMount = false,
  backgroundRefetch = false,
  dedupeInterval = 5000,
  ...options
}: OptimizedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const lastFetchRef = useRef<number>(0);

  // Deduplicated query function
  const optimizedQueryFn = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    // Return cached data if within dedupe interval
    if (timeSinceLastFetch < dedupeInterval) {
      const cached = queryClient.getQueryData<T>(queryKey);
      if (cached) return cached;
    }

    lastFetchRef.current = now;
    return queryFn();
  }, [queryFn, queryKey, queryClient, dedupeInterval]);

  // Use optimized query
  const query = useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });

  // Prefetch on mount
  useEffect(() => {
    if (prefetchOnMount && !query.data) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [prefetchOnMount, queryKey, queryFn, queryClient, query.data]);

  // Background refetch
  useEffect(() => {
    if (!backgroundRefetch || !query.data) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [backgroundRefetch, queryKey, queryClient, query.data]);

  return query;
}

/**
 * Hook for batch prefetching multiple queries
 */
export function useBatchPrefetch() {
  const queryClient = useQueryClient();

  const prefetchBatch = useCallback(async (
    queries: Array<{ queryKey: string[]; queryFn: () => Promise<unknown> }>
  ) => {
    await Promise.all(
      queries.map(({ queryKey, queryFn }) =>
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 10 * 60 * 1000,
        })
      )
    );
  }, [queryClient]);

  return { prefetchBatch };
}

export default useOptimizedQuery;
