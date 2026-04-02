/**
 * MobileResponsiveWrapper - غلاف تجاوبي ذكي للمحتوى
 * يضبط التخطيط والمسافات تلقائياً حسب حجم الشاشة
 */
import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
  /** Grid columns: auto-adjusts on mobile */
  cols?: 1 | 2 | 3 | 4;
  /** Remove padding on mobile */
  noPadMobile?: boolean;
}

const MobileResponsiveWrapper = memo(({ 
  children, 
  className,
  cols = 2,
  noPadMobile = false,
}: MobileResponsiveWrapperProps) => {
  const isMobile = useIsMobile();

  const gridClass = isMobile
    ? 'grid-cols-1'
    : cols === 1 ? 'grid-cols-1'
    : cols === 2 ? 'sm:grid-cols-2'
    : cols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3'
    : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className={cn(
      'grid gap-3 sm:gap-4',
      gridClass,
      noPadMobile && isMobile && 'px-0',
      className,
    )}>
      {children}
    </div>
  );
});

MobileResponsiveWrapper.displayName = 'MobileResponsiveWrapper';
export default MobileResponsiveWrapper;
