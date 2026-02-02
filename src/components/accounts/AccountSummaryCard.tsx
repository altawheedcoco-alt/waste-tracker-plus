import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountSummaryCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  formatValue?: (value: number) => string;
}

const variantStyles = {
  default: {
    bg: 'bg-muted/50',
    border: 'border-border',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    textColor: 'text-foreground',
    subtitleColor: 'text-muted-foreground',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    subtitleColor: 'text-emerald-600 dark:text-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-700 dark:text-amber-300',
    subtitleColor: 'text-amber-600 dark:text-amber-500',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-700 dark:text-red-300',
    subtitleColor: 'text-red-600 dark:text-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-700 dark:text-blue-300',
    subtitleColor: 'text-blue-600 dark:text-blue-500',
  },
};

export default function AccountSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  formatValue = (v) => new Intl.NumberFormat('ar-EG').format(v),
}: AccountSummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all hover:shadow-md',
      styles.bg,
      styles.border
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn('text-sm font-medium', styles.subtitleColor)}>
            {title}
          </p>
          <p className={cn('text-2xl font-bold tracking-tight', styles.textColor)}>
            {formatValue(value)} <span className="text-sm font-normal">ج.م</span>
          </p>
          {subtitle && (
            <p className={cn('text-xs', styles.subtitleColor)}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', styles.iconBg)}>
          <Icon className={cn('h-5 w-5', styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
