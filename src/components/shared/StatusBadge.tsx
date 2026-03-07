import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusLevel = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  level: StatusLevel;
  children: React.ReactNode;
  className?: string;
}

const levelStyles: Record<StatusLevel, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

/**
 * Semantic status badge with consistent color coding.
 * Replaces hardcoded color classes across dashboard pages.
 */
export const StatusBadge = ({ level, children, className }: StatusBadgeProps) => (
  <Badge variant="outline" className={cn(levelStyles[level], className)}>
    {children}
  </Badge>
);

export default StatusBadge;
