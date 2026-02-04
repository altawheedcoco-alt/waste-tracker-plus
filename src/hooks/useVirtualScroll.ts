import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  scrollToIndex?: number;
}

interface VirtualScrollResult {
  virtualItems: VirtualItem[];
  totalHeight: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  containerRef: React.RefObject<HTMLDivElement>;
  handleScroll: () => void;
  scrollTop: number;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  measureRef: (el: HTMLElement | null) => void;
}

/**
 * Hook متقدم للـ Virtual Scrolling مع دعم الارتفاعات المتغيرة
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
  scrollToIndex: initialScrollToIndex,
}: UseVirtualScrollOptions): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());

  // حساب ارتفاع عنصر معين
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        return measuredHeights.get(index) ?? itemHeight(index);
      }
      return itemHeight;
    },
    [itemHeight, measuredHeights]
  );

  // حساب موقع بداية كل عنصر
  const getItemOffset = useCallback(
    (index: number): number => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight]
  );

  // حساب الارتفاع الكلي
  const totalHeight = useMemo(() => {
    let total = 0;
    for (let i = 0; i < itemCount; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [itemCount, getItemHeight]);

  // تحديد العناصر المرئية
  const virtualItems = useMemo((): VirtualItem[] => {
    if (itemCount === 0) return [];

    const items: VirtualItem[] = [];
    let currentOffset = 0;
    let startIndex = -1;
    let endIndex = -1;

    // البحث عن أول عنصر مرئي
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeight(i);
      if (currentOffset + height > scrollTop && startIndex === -1) {
        startIndex = Math.max(0, i - overscan);
      }
      if (currentOffset > scrollTop + containerHeight && endIndex === -1) {
        endIndex = Math.min(itemCount - 1, i + overscan);
        break;
      }
      currentOffset += height;
    }

    if (startIndex === -1) startIndex = 0;
    if (endIndex === -1) endIndex = Math.min(itemCount - 1, startIndex + Math.ceil(containerHeight / (typeof itemHeight === 'number' ? itemHeight : 50)) + overscan * 2);

    // بناء العناصر الافتراضية
    for (let i = startIndex; i <= endIndex; i++) {
      const start = getItemOffset(i);
      const size = getItemHeight(i);

      items.push({
        index: i,
        start,
        size,
        measureRef: (el: HTMLElement | null) => {
          if (el) {
            const measuredHeight = el.getBoundingClientRect().height;
            if (measuredHeight !== getItemHeight(i)) {
              setMeasuredHeights((prev) => {
                const next = new Map(prev);
                next.set(i, measuredHeight);
                return next;
              });
            }
          }
        },
      });
    }

    return items;
  }, [itemCount, scrollTop, containerHeight, overscan, getItemHeight, getItemOffset, itemHeight]);

  // التمرير إلى عنصر معين
  const scrollToIndexFn = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!containerRef.current || index < 0 || index >= itemCount) return;

      const itemOffset = getItemOffset(index);
      const itemSize = getItemHeight(index);

      let targetScrollTop: number;

      switch (align) {
        case 'center':
          targetScrollTop = itemOffset - containerHeight / 2 + itemSize / 2;
          break;
        case 'end':
          targetScrollTop = itemOffset - containerHeight + itemSize;
          break;
        case 'start':
        default:
          targetScrollTop = itemOffset;
          break;
      }

      targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight));

      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
    },
    [itemCount, containerHeight, totalHeight, getItemOffset, getItemHeight]
  );

  // معالجة التمرير
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // التمرير الأولي
  useEffect(() => {
    if (initialScrollToIndex !== undefined && initialScrollToIndex >= 0) {
      scrollToIndexFn(initialScrollToIndex);
    }
  }, [initialScrollToIndex, scrollToIndexFn]);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex: scrollToIndexFn,
    containerRef,
    handleScroll,
    scrollTop,
  };
}

export default useVirtualScroll;
