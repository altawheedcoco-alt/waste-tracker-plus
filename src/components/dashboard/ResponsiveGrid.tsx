import { ReactNode } from 'react';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  /** عدد الأعمدة لكل وضع عرض */
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /** الفجوة بين العناصر */
  gap?: 'sm' | 'md' | 'lg';
}

/**
 * شبكة مستجيبة تتكيف مع وضع العرض المحدد
 */
const ResponsiveGrid = ({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 'md',
}: ResponsiveGridProps) => {
  const { isMobile, isTablet, isDesktop } = useDisplayMode();

  // تحديد عدد الأعمدة بناءً على وضع العرض
  const getColsCount = () => {
    if (isMobile) return cols.mobile || 1;
    if (isTablet) return cols.tablet || 2;
    return cols.desktop || 4;
  };

  const colsCount = getColsCount();

  // تحويل عدد الأعمدة لفئة Tailwind
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[colsCount] || 'grid-cols-1';

  const gapClass = {
    sm: 'gap-2',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
  }[gap];

  return (
    <div className={cn('grid', gridColsClass, gapClass, className)}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
