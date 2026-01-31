import { ReactNode } from 'react';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { cn } from '@/lib/utils';

interface ResponsivePageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * مكون حاوي مستجيب للصفحات
 * يتكيف تلقائياً مع وضع العرض المحدد في الإعدادات
 */
const ResponsivePageContainer = ({
  children,
  className,
  title,
  subtitle,
  actions,
}: ResponsivePageContainerProps) => {
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();

  const containerClass = getResponsiveClass({
    mobile: 'space-y-3',
    tablet: 'space-y-4',
    desktop: 'space-y-6',
  });

  const headerClass = getResponsiveClass({
    mobile: 'flex-col gap-3',
    tablet: 'flex-col sm:flex-row gap-3',
    desktop: 'flex-row gap-4',
  });

  const titleClass = getResponsiveClass({
    mobile: 'text-lg',
    tablet: 'text-xl',
    desktop: 'text-2xl',
  });

  const subtitleClass = getResponsiveClass({
    mobile: 'text-xs',
    tablet: 'text-sm',
    desktop: 'text-base',
  });

  return (
    <div className={cn(containerClass, className)}>
      {(title || actions) && (
        <div className={cn('flex items-start justify-between', headerClass)}>
          {title && (
            <div className="text-right">
              <h1 className={cn('font-bold', titleClass)}>{title}</h1>
              {subtitle && (
                <p className={cn('text-muted-foreground', subtitleClass)}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {actions && (
            <div className={cn('flex flex-wrap gap-2', isMobile ? 'w-full' : '')}>
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default ResponsivePageContainer;
