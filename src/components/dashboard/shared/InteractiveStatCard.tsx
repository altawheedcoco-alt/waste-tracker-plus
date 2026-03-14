import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import InteractiveDetailDrawer, { DetailSection } from './InteractiveDetailDrawer';
import AnimatedCounter from './AnimatedCounter';

export interface InteractiveStatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  gradient?: string;
  subtitle?: string;
  suffix?: string;
  trend?: { value: number; label?: string };
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  /** Detail sections for drill-down */
  detailSections?: DetailSection[];
  detailTitle?: string;
  detailDescription?: string;
  /** Simple onClick without drawer */
  onClick?: () => void;
  /** Animation delay */
  delay?: number;
  /** Custom detail content instead of sections */
  detailContent?: ReactNode;
  isLoading?: boolean;
}

const InteractiveStatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  gradient,
  subtitle,
  suffix,
  trend,
  badge,
  badgeVariant,
  detailSections,
  detailTitle,
  detailDescription,
  onClick,
  delay = 0,
  detailContent,
  isLoading,
}: InteractiveStatCardProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasDetails = detailSections && detailSections.length > 0;
  const isClickable = hasDetails || onClick;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (hasDetails) {
      setDrawerOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-7 bg-muted rounded w-1/2" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={isClickable ? { scale: 1.03, y: -3 } : undefined}
        whileTap={isClickable ? { scale: 0.97 } : undefined}
      >
        <Card
          className={cn(
            'glass-card-hover group overflow-hidden relative',
            isClickable && 'cursor-pointer'
          )}
          onClick={handleClick}
        >
          {/* Top gradient accent */}
          <div className={cn(
            'absolute top-0 left-0 right-0 h-1 transition-all duration-500',
            gradient ? `bg-gradient-to-r ${gradient}` : bgColor,
            'opacity-60 group-hover:opacity-100 group-hover:h-1.5'
          )} />

          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.03] group-hover:to-primary/[0.08] transition-all duration-500 pointer-events-none" />
          
          {/* Corner decoration */}
          <div className={cn(
            'absolute -top-8 -left-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none',
            gradient ? `bg-gradient-to-br ${gradient}` : bgColor
          )} />

          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-5 px-3 sm:px-6 relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 shrink-0">
                {isClickable && (
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                    animate={{ x: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronLeft className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
                {badge && (
                  <Badge variant={badgeVariant || 'destructive'} className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5">
                    {badge}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse flex-1 min-w-0">
                <motion.div 
                  className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0',
                    'group-hover:scale-110 group-hover:shadow-lg',
                    gradient ? `bg-gradient-to-br ${gradient} text-white shadow-sm` : bgColor
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', !gradient && color)} />
                </motion.div>
                <div className="min-w-0 text-right flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
                  <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 justify-end">
                    <AnimatedCounter
                      value={value}
                      className="text-xl sm:text-2xl font-bold tracking-tight"
                    />
                    {suffix && (
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{suffix}</span>
                    )}
                  </div>
                  {subtitle && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
                  )}
                  {trend && (
                    <p className={cn('text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                      {trend.label && <span className="text-muted-foreground mr-1">{trend.label}</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {hasDetails && (
        <InteractiveDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={detailTitle || title}
          description={detailDescription}
          icon={Icon}
          iconColor={color}
          iconBgColor={bgColor}
          summaryValue={typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
          summaryLabel={title}
          sections={detailSections!}
        />
      )}
    </>
  );
};

export default InteractiveStatCard;
