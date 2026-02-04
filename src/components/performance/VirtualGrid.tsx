import { memo, ReactNode, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columnCount: number;
  rowHeight: number;
  containerHeight: number;
  gap?: number;
  className?: string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * شبكة افتراضية لعرض البطاقات والعناصر في تخطيط Grid
 * مثالي لعرض الصور أو البطاقات بأعداد كبيرة
 */
function VirtualGridComponent<T>({
  items,
  renderItem,
  columnCount,
  rowHeight,
  containerHeight,
  gap = 16,
  className,
  overscan = 2,
  getItemKey,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // حساب عدد الصفوف
  const rowCount = Math.ceil(items.length / columnCount);
  const effectiveRowHeight = rowHeight + gap;
  const totalHeight = rowCount * effectiveRowHeight - gap;

  // تحديد الصفوف المرئية
  const { startRow, endRow } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / effectiveRowHeight) - overscan);
    const visibleRows = Math.ceil(containerHeight / effectiveRowHeight);
    const end = Math.min(rowCount - 1, start + visibleRows + overscan * 2);
    return { startRow: start, endRow: end };
  }, [scrollTop, effectiveRowHeight, containerHeight, rowCount, overscan]);

  // بناء العناصر المرئية
  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; row: number; col: number }[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnCount; col++) {
        const index = row * columnCount + col;
        if (index < items.length) {
          result.push({
            item: items[index],
            index,
            row,
            col,
          });
        }
      }
    }

    return result;
  }, [items, startRow, endRow, columnCount]);

  const columnWidth = `calc((100% - ${(columnCount - 1) * gap}px) / ${columnCount})`;
  const offsetY = startRow * effectiveRowHeight;

  if (items.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ height: containerHeight }}
      >
        لا توجد عناصر للعرض
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, ${columnWidth})`,
            gap,
          }}
        >
          {visibleItems.map(({ item, index }) => {
            const key = getItemKey ? getItemKey(item, index) : index;
            return (
              <div key={key} style={{ height: rowHeight }}>
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const VirtualGrid = memo(VirtualGridComponent) as typeof VirtualGridComponent;
export default VirtualGrid;
