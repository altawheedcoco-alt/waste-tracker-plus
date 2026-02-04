import { memo, useState, useRef, useEffect, useCallback, ReactNode, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  isLoading?: boolean;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  headerComponent?: ReactNode;
  footerComponent?: ReactNode;
}

export interface VirtualListRef {
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

/**
 * قائمة افتراضية متقدمة لتحسين الأداء مع القوائم الطويلة
 * تدعم الارتفاعات المتغيرة والتحميل اللانهائي
 */
function VirtualListInner<T>(
  {
    items,
    itemHeight,
    containerHeight,
    renderItem,
    className,
    overscan = 3,
    getItemKey,
    onEndReached,
    endReachedThreshold = 200,
    isLoading = false,
    loadingComponent,
    emptyComponent,
    headerComponent,
    footerComponent,
  }: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListRef>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const endReachedCalledRef = useRef(false);

  // حساب ارتفاع عنصر
  const getHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // حساب موقع عنصر
  const getOffset = useCallback(
    (index: number): number => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getHeight(i);
      }
      return offset;
    },
    [getHeight]
  );

  // حساب الارتفاع الكلي
  const totalHeight = items.reduce((sum, _, i) => sum + getHeight(i), 0);

  // تحديد العناصر المرئية
  const { startIndex, endIndex, visibleItems } = (() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    let start = 0;
    let offset = 0;

    // البحث عن أول عنصر مرئي
    for (let i = 0; i < items.length; i++) {
      const height = getHeight(i);
      if (offset + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      offset += height;
    }

    // البحث عن آخر عنصر مرئي
    let end = start;
    offset = getOffset(start);
    for (let i = start; i < items.length; i++) {
      if (offset > scrollTop + containerHeight) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
      offset += getHeight(i);
      end = i;
    }
    end = Math.min(items.length - 1, end + overscan);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1),
    };
  })();

  const offsetY = getOffset(startIndex);

  // معالجة التمرير
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop: newScrollTop, scrollHeight, clientHeight } = containerRef.current;
      setScrollTop(newScrollTop);

      // التحقق من الوصول لنهاية القائمة
      const distanceFromEnd = scrollHeight - newScrollTop - clientHeight;
      if (distanceFromEnd < endReachedThreshold && !endReachedCalledRef.current && onEndReached) {
        endReachedCalledRef.current = true;
        onEndReached();
      } else if (distanceFromEnd >= endReachedThreshold) {
        endReachedCalledRef.current = false;
      }
    }
  }, [endReachedThreshold, onEndReached]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // إعادة تعيين الـ endReached عند تغيير العناصر
  useEffect(() => {
    endReachedCalledRef.current = false;
  }, [items.length]);

  // واجهة الـ ref
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!containerRef.current || index < 0 || index >= items.length) return;

      const itemOffset = getOffset(index);
      const itemSize = getHeight(index);

      let targetScrollTop: number;
      switch (align) {
        case 'center':
          targetScrollTop = itemOffset - containerHeight / 2 + itemSize / 2;
          break;
        case 'end':
          targetScrollTop = itemOffset - containerHeight + itemSize;
          break;
        default:
          targetScrollTop = itemOffset;
      }

      containerRef.current.scrollTo({
        top: Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight)),
        behavior: 'smooth',
      });
    },
    scrollToTop: () => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    scrollToBottom: () => {
      containerRef.current?.scrollTo({ top: totalHeight, behavior: 'smooth' });
    },
  }));

  // عرض حالة الفراغ
  if (items.length === 0 && !isLoading) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <p className="text-muted-foreground">لا توجد عناصر للعرض</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
    >
      {headerComponent}
      
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
            const height = getHeight(actualIndex);

            return (
              <div key={key} style={{ height }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          {loadingComponent || (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
        </div>
      )}

      {footerComponent}
    </div>
  );
}

// استخدام forwardRef مع الـ generics
export const VirtualList = memo(forwardRef(VirtualListInner)) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<VirtualListRef> }
) => ReturnType<typeof VirtualListInner>;

export default VirtualList;
