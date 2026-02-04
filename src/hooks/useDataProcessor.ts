import { useCallback, useMemo } from 'react';
import { useWebWorker } from './useWebWorker';

interface DataProcessorInput {
  type: 'sort' | 'search' | 'aggregate' | 'transform' | 'filter';
  payload: unknown;
}

interface SortOptions {
  key?: string;
  order?: 'asc' | 'desc';
}

interface SearchOptions {
  keys: string[];
  fuzzy?: boolean;
}

interface AggregateOperation {
  field: string;
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

interface AggregateOptions {
  operations: AggregateOperation[];
  groupBy?: string;
}

/**
 * Hook متخصص لمعالجة البيانات باستخدام Web Worker
 */
export function useDataProcessor<T = unknown>() {
  // إنشاء Worker
  const createWorker = useCallback(() => {
    return new Worker(
      new URL('../workers/dataProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }, []);

  const { execute, status, error, isProcessing, terminate } = useWebWorker<
    DataProcessorInput,
    unknown
  >(createWorker);

  // فرز البيانات
  const sort = useCallback(
    async (data: T[], options: SortOptions = {}): Promise<T[]> => {
      if (data.length < 1000) {
        // للبيانات الصغيرة، استخدم الفرز المباشر
        return [...data].sort((a, b) => {
          const aVal = options.key ? (a as Record<string, unknown>)[options.key] : a;
          const bVal = options.key ? (b as Record<string, unknown>)[options.key] : b;
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return options.order === 'desc' ? -comparison : comparison;
        });
      }

      const result = await execute({
        type: 'sort',
        payload: { data, ...options },
      });
      return result as T[];
    },
    [execute]
  );

  // بحث في البيانات
  const search = useCallback(
    async (data: T[], query: string, options: SearchOptions): Promise<T[]> => {
      if (data.length < 500 || !query.trim()) {
        // للبيانات الصغيرة
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return data;
        
        return data.filter(item =>
          options.keys.some(key => {
            const value = (item as Record<string, unknown>)[key];
            return value && String(value).toLowerCase().includes(normalizedQuery);
          })
        );
      }

      const result = await execute({
        type: 'search',
        payload: { data, query, ...options },
      });
      return result as T[];
    },
    [execute]
  );

  // تجميع البيانات
  const aggregate = useCallback(
    async <R = Record<string, number>>(
      data: T[],
      options: AggregateOptions
    ): Promise<R> => {
      const result = await execute({
        type: 'aggregate',
        payload: { data, ...options },
      });
      return result as R;
    },
    [execute]
  );

  // تحويل البيانات
  const transform = useCallback(
    async <R = T>(data: T[], transformer: (item: T, index: number) => R): Promise<R[]> => {
      if (data.length < 1000) {
        return data.map(transformer);
      }

      const result = await execute({
        type: 'transform',
        payload: { data, transformer: transformer.toString() },
      });
      return result as R[];
    },
    [execute]
  );

  // فلترة البيانات
  const filter = useCallback(
    async (data: T[], predicate: (item: T, index: number) => boolean): Promise<T[]> => {
      if (data.length < 1000) {
        return data.filter(predicate);
      }

      const result = await execute({
        type: 'filter',
        payload: { data, predicate: predicate.toString() },
      });
      return result as T[];
    },
    [execute]
  );

  return useMemo(
    () => ({
      sort,
      search,
      aggregate,
      transform,
      filter,
      status,
      error,
      isProcessing,
      terminate,
    }),
    [sort, search, aggregate, transform, filter, status, error, isProcessing, terminate]
  );
}

export default useDataProcessor;
