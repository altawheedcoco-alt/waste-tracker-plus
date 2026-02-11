import { useQuery, useQueryClient, useMutation, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { getCacheOptions, cascadeInvalidate, CacheProfile, CACHE_PROFILES } from '@/lib/queryCacheConfig';

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  /** تحميل مسبق عند التركيب */
  prefetchOnMount?: boolean;
  /** تحديث في الخلفية */
  backgroundRefetch?: boolean;
  /** فترة منع التكرار (مللي ثانية) */
  dedupeInterval?: number;
  /** فرض فئة تخزين مؤقت معينة */
  cacheProfile?: CacheProfile;
}

/**
 * Hook محسّن للاستعلامات مع تخزين مؤقت ذكي تكيّفي
 * يختار تلقائياً أفضل استراتيجية تخزين حسب نوع البيانات
 */
export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  prefetchOnMount = false,
  backgroundRefetch = false,
  dedupeInterval = 5000,
  cacheProfile,
  ...options
}: OptimizedQueryOptions<T>) {
  const queryClient = useQueryClient();
  const lastFetchRef = useRef<number>(0);

  // حساب إعدادات الكاش تلقائياً
  const cacheOptions = cacheProfile
    ? CACHE_PROFILES[cacheProfile]
    : getCacheOptions(queryKey);

  // دالة استعلام مع منع التكرار
  const optimizedQueryFn = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    if (timeSinceLastFetch < dedupeInterval) {
      const cached = queryClient.getQueryData<T>(queryKey);
      if (cached) return cached;
    }

    lastFetchRef.current = now;
    return queryFn();
  }, [queryFn, queryKey, queryClient, dedupeInterval]);

  const query = useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: cacheOptions.staleTime,
    gcTime: cacheOptions.gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: options.refetchOnMount ?? 'always',
    ...options,
  });

  // تحميل مسبق
  useEffect(() => {
    if (prefetchOnMount && !query.data) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: cacheOptions.staleTime,
      });
    }
  }, [prefetchOnMount, queryKey, queryFn, queryClient, query.data, cacheOptions.staleTime]);

  // تحديث في الخلفية
  useEffect(() => {
    if (!backgroundRefetch || !query.data) return;

    // فترة التحديث = ضعف وقت الـ staleTime
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
    }, cacheOptions.staleTime * 2);

    return () => clearInterval(interval);
  }, [backgroundRefetch, queryKey, queryClient, query.data, cacheOptions.staleTime]);

  return query;
}

/**
 * Hook للطفرات مع إبطال تسلسلي ذكي
 * يبطل تلقائياً كل الاستعلامات المرتبطة عند نجاح العملية
 */
export function useSmartMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  primaryKey: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      // إبطال تسلسلي ذكي
      cascadeInvalidate(queryClient, primaryKey);
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

/**
 * Hook لتحميل مسبق دُفعي للاستعلامات
 */
export function useBatchPrefetch() {
  const queryClient = useQueryClient();

  const prefetchBatch = useCallback(async (
    queries: Array<{ queryKey: string[]; queryFn: () => Promise<unknown> }>
  ) => {
    await Promise.all(
      queries.map(({ queryKey, queryFn }) => {
        const cacheOptions = getCacheOptions(queryKey);
        return queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: cacheOptions.staleTime,
        });
      })
    );
  }, [queryClient]);

  return { prefetchBatch };
}

export default useOptimizedQuery;
