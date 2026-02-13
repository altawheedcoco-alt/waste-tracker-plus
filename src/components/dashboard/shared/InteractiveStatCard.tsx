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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
        whileTap={isClickable ? { scale: 0.98 } : undefined}
      >
        <Card
          className={cn(
            'hover:shadow-md transition-all duration-300 group overflow-hidden relative',
            isClickable && 'cursor-pointer hover:border-primary/40'
          )}
          onClick={handleClick}
        >
          {/* Top accent */}
          <div className={cn('absolute top-0 left-0 right-0 h-1 opacity-60', bgColor)} />

          <CardContent className="pt-6 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isClickable && (
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronLeft className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
                {badge && (
                  <Badge variant={badgeVariant || 'destructive'} className="text-[10px] px-1.5 py-0.5">
                    {badge}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 flex-row-reverse">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                  gradient ? `bg-gradient-to-br ${gradient} text-white` : bgColor
                )}>
                  <Icon className={cn('w-6 h-6', !gradient && color)} />
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-sm text-muted-foreground truncate">{title}</p>
                  <div className="flex items-baseline gap-1.5 mt-1 justify-end">
                    <AnimatedCounter
                      value={value}
                      className="text-2xl font-bold tracking-tight"
                    />
                    {suffix && (
                      <span className="text-xs text-muted-foreground">{suffix}</span>
                    )}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                  )}
                  {trend && (
                    <p className={cn('text-xs mt-1', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
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
          summaryValue={typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
          summaryLabel={title}
          sections={detailSections!}
        />
      )}
    </>
  );
};

export default InteractiveStatCard;
