import { useRef, useMemo, useCallback, DependencyList } from 'react';
import { deepEqual } from '@/lib/memoUtils';

/**
 * useMemo مع مقارنة عميقة للتبعيات
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T } | undefined>(undefined);

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * useCallback مع مقارنة عميقة للتبعيات
 */
export function useDeepCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  const ref = useRef<{ deps: DependencyList; callback: T } | undefined>(undefined);

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, callback };
  }

  return ref.current.callback;
}

/**
 * Hook لحفظ القيمة السابقة
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const previous = ref.current;
  ref.current = value;
  return previous;
}

/**
 * Hook لمقارنة القيمة الحالية بالسابقة
 */
export function useHasChanged<T>(value: T, compareFn?: (a: T, b: T) => boolean): boolean {
  const previous = usePrevious(value);
  
  if (previous === undefined) return false;
  
  if (compareFn) {
    return !compareFn(previous, value);
  }
  
  return previous !== value;
}

/**
 * useCallback مستقر - يحتفظ بنفس المرجع دائمًا
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  // تحديث المرجع في كل render
  callbackRef.current = callback;

  // إرجاع دالة ثابتة
  return useCallback(
    ((...args: unknown[]) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Hook لتأخير تحديث القيمة (debounce)
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const ref = useRef(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useMemo(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      ref.current = value;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return ref.current;
}

/**
 * Hook للحفاظ على مرجع ثابت للكائنات
 */
export function useStableObject<T extends object>(obj: T): T {
  const ref = useRef(obj);

  if (!deepEqual(ref.current, obj)) {
    ref.current = obj;
  }

  return ref.current;
}

/**
 * Hook للحفاظ على مرجع ثابت للمصفوفات
 */
export function useStableArray<T>(arr: T[]): T[] {
  const ref = useRef(arr);

  if (
    ref.current.length !== arr.length ||
    !ref.current.every((item, index) => item === arr[index])
  ) {
    ref.current = arr;
  }

  return ref.current;
}

/**
 * Hook لتخزين القيم المحسوبة مؤقتًا
 */
export function useMemoizedMap<K, V>() {
  const cacheRef = useRef(new Map<K, V>());

  const get = useCallback((key: K): V | undefined => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key: K, value: V): void => {
    cacheRef.current.set(key, value);
  }, []);

  const has = useCallback((key: K): boolean => {
    return cacheRef.current.has(key);
  }, []);

  const remove = useCallback((key: K): boolean => {
    return cacheRef.current.delete(key);
  }, []);

  const clear = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  const getOrCompute = useCallback((key: K, compute: () => V): V => {
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }
    const value = compute();
    cacheRef.current.set(key, value);
    return value;
  }, []);

  return useMemo(
    () => ({ get, set, has, remove, clear, getOrCompute }),
    [get, set, has, remove, clear, getOrCompute]
  );
}

/**
 * Hook لتجميع التحديثات المتعددة
 */
export function useBatchedUpdates<T>(
  initialValue: T,
  updateFn: (current: T, updates: Partial<T>[]) => T,
  delay: number = 100
): [T, (update: Partial<T>) => void, () => void] {
  const valueRef = useRef(initialValue);
  const updatesRef = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdateRef = useRef<() => void>();

  const flush = useCallback(() => {
    if (updatesRef.current.length > 0) {
      valueRef.current = updateFn(valueRef.current, updatesRef.current);
      updatesRef.current = [];
      forceUpdateRef.current?.();
    }
  }, [updateFn]);

  const update = useCallback((partialUpdate: Partial<T>) => {
    updatesRef.current.push(partialUpdate);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(flush, delay);
  }, [delay, flush]);

  return [valueRef.current, update, flush];
}
