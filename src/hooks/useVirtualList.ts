import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
}

interface VirtualListResult<T> {
  virtualItems: Array<{ item: T; index: number; style: React.CSSProperties }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number) => void;
}

/**
 * Hook for virtualizing long lists
 * تحسين عرض القوائم الطويلة
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight = 400,
}: UseVirtualListOptions<T>): VirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const result: Array<{ item: T; index: number; style: React.CSSProperties }> = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }
    
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  };
}

export default useVirtualList;
