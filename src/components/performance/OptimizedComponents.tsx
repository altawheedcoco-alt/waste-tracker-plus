import { memo, ReactNode, useMemo } from 'react';
import { shallowEqual } from '@/lib/memoUtils';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
}

/**
 * قائمة محسّنة تمنع إعادة رندرة العناصر التي لم تتغير
 */
function OptimizedListInner<T>({
  items,
  renderItem,
  keyExtractor,
  className,
}: OptimizedListProps<T>) {
  const renderedItems = useMemo(() => {
    return items.map((item, index) => ({
      key: keyExtractor(item, index),
      element: renderItem(item, index),
    }));
  }, [items, renderItem, keyExtractor]);

  return (
    <div className={className}>
      {renderedItems.map(({ key, element }) => (
        <MemoizedItem key={key}>{element}</MemoizedItem>
      ))}
    </div>
  );
}

const MemoizedItem = memo(
  ({ children }: { children: ReactNode }) => <>{children}</>,
  () => true // لا تعيد الرندرة أبدًا
);

export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

// ============================================

interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  columns?: number;
  gap?: number;
  className?: string;
}

/**
 * شبكة محسّنة مع تحكم في الأعمدة
 */
function OptimizedGridInner<T>({
  items,
  renderItem,
  keyExtractor,
  columns = 3,
  gap = 16,
  className,
}: OptimizedGridProps<T>) {
  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: `${gap}px`,
    }),
    [columns, gap]
  );

  return (
    <div className={className} style={gridStyle}>
      {items.map((item, index) => (
        <MemoizedGridItem key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </MemoizedGridItem>
      ))}
    </div>
  );
}

const MemoizedGridItem = memo(
  ({ children }: { children: ReactNode }) => <>{children}</>,
  () => true
);

export const OptimizedGrid = memo(OptimizedGridInner) as typeof OptimizedGridInner;

// ============================================

interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * مكون للرندرة الشرطية المحسّنة
 */
export const ConditionalRender = memo(
  ({ condition, children, fallback = null }: ConditionalRenderProps) => {
    return <>{condition ? children : fallback}</>;
  },
  (prevProps, nextProps) => {
    // أعد الرندرة فقط إذا تغير الشرط
    return prevProps.condition === nextProps.condition;
  }
);

// ============================================

interface StableChildrenProps {
  children: ReactNode;
  deps?: unknown[];
}

/**
 * مكون يمنع إعادة رندرة الأطفال إلا عند تغيير التبعيات
 */
export const StableChildren = memo(
  ({ children }: StableChildrenProps) => <>{children}</>,
  (prevProps, nextProps) => {
    if (!prevProps.deps && !nextProps.deps) return true;
    if (!prevProps.deps || !nextProps.deps) return false;
    return shallowEqual(prevProps.deps, nextProps.deps);
  }
);

// ============================================

interface ExpensiveComponentProps {
  data: unknown;
  render: (data: unknown) => ReactNode;
}

/**
 * مكون للمحتوى المكلف حسابياً
 */
export const ExpensiveComponent = memo(
  ({ data, render }: ExpensiveComponentProps) => {
    const content = useMemo(() => render(data), [data, render]);
    return <>{content}</>;
  },
  (prevProps, nextProps) => {
    // استخدام مقارنة عميقة للبيانات
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
  }
);

// ============================================

export default {
  OptimizedList,
  OptimizedGrid,
  ConditionalRender,
  StableChildren,
  ExpensiveComponent,
};
