import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Auto-color based on percentage thresholds */
  autoColor?: boolean;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-4',
};

/**
 * Reusable progress bar with auto-coloring based on fill level.
 * Replaces repeated div > div progress patterns.
 */
export const ProgressBar = ({ value, max = 100, className, barClassName, size = 'md', autoColor = false }: ProgressBarProps) => {
  const percent = Math.min((value / max) * 100, 100);
  
  const getAutoColor = () => {
    if (percent > 90) return 'bg-destructive';
    if (percent > 75) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={cn('bg-muted rounded-full overflow-hidden', sizeClasses[size], className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          autoColor ? getAutoColor() : (barClassName || 'bg-primary'),
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export default ProgressBar;
