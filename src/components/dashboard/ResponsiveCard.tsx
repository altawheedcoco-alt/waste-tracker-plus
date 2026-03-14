import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ResponsiveCardProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconBgClass?: string;
  onClick?: () => void;
  interactive?: boolean;
  compact?: boolean;
}

/**
 * بطاقة مستجيبة تتكيف مع وضع العرض — v4.0 Modern Elegant
 */
const ResponsiveCard = ({
  children,
  className,
  title,
  description,
  icon: Icon,
  iconBgClass = 'bg-primary/10',
  onClick,
  interactive = false,
  compact = false,
}: ResponsiveCardProps) => {
  const { isMobile, getResponsiveClass } = useDisplayMode();

  const paddingClass = getResponsiveClass({
    mobile: compact ? 'p-3' : 'p-4',
    tablet: compact ? 'p-4' : 'p-5',
    desktop: compact ? 'p-4' : 'p-6',
  });

  const titleClass = getResponsiveClass({
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-base',
  });

  const descriptionClass = getResponsiveClass({
    mobile: 'text-xs',
    tablet: 'text-xs',
    desktop: 'text-sm',
  });

  const iconSizeClass = getResponsiveClass({
    mobile: 'w-8 h-8',
    tablet: 'w-9 h-9',
    desktop: 'w-10 h-10',
  });

  const iconInnerClass = getResponsiveClass({
    mobile: 'w-4 h-4',
    tablet: 'w-4.5 h-4.5',
    desktop: 'w-5 h-5',
  });

  const cardContent = (
    <Card
      className={cn(
        'border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200',
        interactive && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(title || Icon) && (
        <CardHeader className={cn(paddingClass, 'pb-2')}>
          <div className="flex items-start justify-between gap-3">
            {Icon && (
              <div
                className={cn(
                  'rounded-lg flex items-center justify-center shrink-0',
                  iconSizeClass,
                  iconBgClass
                )}
              >
                <Icon className={cn(iconInnerClass, 'text-primary')} />
              </div>
            )}
            <div className="flex-1 text-right">
              {title && (
                <CardTitle className={cn('font-semibold tracking-tight', titleClass)}>
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className={cn('mt-0.5', descriptionClass)}>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      {children && (
        <CardContent className={cn(paddingClass, title && 'pt-0')}>
          {children}
        </CardContent>
      )}
    </Card>
  );

  if (interactive) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default ResponsiveCard;