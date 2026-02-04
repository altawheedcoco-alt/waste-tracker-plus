import { memo, ComponentType, useRef, useEffect } from 'react';

/**
 * دالة مقارنة عميقة للخصائص
 */
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (obj1 === null || obj2 === null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }

  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => 
    deepEqual(
      (obj1 as Record<string, unknown>)[key], 
      (obj2 as Record<string, unknown>)[key]
    )
  );
}

/**
 * دالة مقارنة سطحية للخصائص
 */
export function shallowEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  if (obj1 === null || obj2 === null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every(key => 
    (obj1 as Record<string, unknown>)[key] === (obj2 as Record<string, unknown>)[key]
  );
}

/**
 * مقارنة مخصصة تتجاهل الدوال
 */
export function propsAreEqualIgnoringFunctions<T extends object>(
  prevProps: T,
  nextProps: T
): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) return false;

  return prevKeys.every(key => {
    const prevValue = (prevProps as Record<string, unknown>)[key];
    const nextValue = (nextProps as Record<string, unknown>)[key];

    // تجاهل الدوال (تعتبر متساوية دائمًا)
    if (typeof prevValue === 'function' && typeof nextValue === 'function') {
      return true;
    }

    return prevValue === nextValue;
  });
}

/**
 * مقارنة تتجاهل خصائص معينة
 */
export function createPropsComparator<T extends object>(
  ignoreKeys: (keyof T)[] = []
): (prevProps: T, nextProps: T) => boolean {
  return (prevProps: T, nextProps: T) => {
    const prevFiltered = { ...prevProps };
    const nextFiltered = { ...nextProps };

    ignoreKeys.forEach(key => {
      delete prevFiltered[key];
      delete nextFiltered[key];
    });

    return shallowEqual(prevFiltered, nextFiltered);
  };
}

/**
 * إنشاء مكون memo مع مقارنة مخصصة
 */
export function withMemo<P extends object>(
  Component: ComponentType<P>,
  compareFunction?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, compareFunction);
}

/**
 * إنشاء مكون memo يتجاهل الدوال في المقارنة
 */
export function withMemoIgnoringFunctions<P extends object>(
  Component: ComponentType<P>
) {
  return memo(Component, propsAreEqualIgnoringFunctions);
}

/**
 * إنشاء مكون memo يتجاهل خصائص معينة
 */
export function withMemoIgnoring<P extends object>(
  Component: ComponentType<P>,
  ignoreKeys: (keyof P)[]
) {
  return memo(Component, createPropsComparator(ignoreKeys));
}

/**
 * Hook للتتبع عدد مرات إعادة الرندرة (للتطوير فقط)
 */
export function useRenderCount(componentName: string): number {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render Count] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * Hook لتتبع الخصائص التي تغيرت وتسببت في إعادة الرندرة
 */
export function useWhyDidYouUpdate<T extends object>(
  componentName: string,
  props: T
): void {
  const previousProps = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props }) as (keyof T)[];
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key as string] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[Why Update] ${componentName}:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

export default {
  deepEqual,
  shallowEqual,
  propsAreEqualIgnoringFunctions,
  createPropsComparator,
  withMemo,
  withMemoIgnoringFunctions,
  withMemoIgnoring,
  useRenderCount,
  useWhyDidYouUpdate,
};
