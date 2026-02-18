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
 * بطاقة مستجيبة تتكيف مع وضع العرض
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
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();

  const paddingClass = getResponsiveClass({
    mobile: compact ? 'p-3' : 'p-4',
    tablet: compact ? 'p-4' : 'p-5',
    desktop: compact ? 'p-4' : 'p-6',
  });

  const titleClass = getResponsiveClass({
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg',
  });

  const descriptionClass = getResponsiveClass({
    mobile: 'text-xs',
    tablet: 'text-xs',
    desktop: 'text-sm',
  });

  const iconSizeClass = getResponsiveClass({
    mobile: 'w-8 h-8',
    tablet: 'w-10 h-10',
    desktop: 'w-12 h-12',
  });

  const iconInnerClass = getResponsiveClass({
    mobile: 'w-4 h-4',
    tablet: 'w-5 h-5',
    desktop: 'w-6 h-6',
  });

  const cardContent = (
    <Card
      className={cn(
        'transition-all duration-300 glass-card-hover',
        interactive && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(title || Icon) && (
        <CardHeader className={cn(paddingClass, 'pb-2')}>
          <div className="flex items-start justify-between gap-3">
            {Icon && (
              <motion.div
                className={cn(
                  'rounded-xl flex items-center justify-center shrink-0 shadow-sm',
                  iconSizeClass,
                  iconBgClass
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.3 }}
              >
                <Icon className={cn(iconInnerClass, 'text-primary')} />
              </motion.div>
            )}
            <div className="flex-1 text-right">
              {title && (
                <CardTitle className={cn('font-semibold', titleClass)}>
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className={cn('mt-1', descriptionClass)}>
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
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default ResponsiveCard;
