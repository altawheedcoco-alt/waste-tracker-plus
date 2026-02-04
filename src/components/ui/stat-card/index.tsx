import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

// ==================== Context ====================
interface StatCardContextValue {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  interactive?: boolean;
}

const StatCardContext = React.createContext<StatCardContextValue | null>(null);

const useStatCard = () => {
  const context = React.useContext(StatCardContext);
  if (!context) {
    throw new Error('StatCard compound components must be used within StatCard.Root');
  }
  return context;
};

// ==================== Variant Styles ====================
const variantStyles = {
  default: {
    bg: 'bg-card',
    icon: 'bg-primary/10 text-primary',
    value: 'text-foreground',
    border: 'border-border',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

// ==================== Root ====================
interface RootProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

const Root = ({ children, variant = 'default', interactive = false, onClick, className }: RootProps) => {
  const styles = variantStyles[variant];
  
  const content = (
    <Card className={cn(
      'transition-all',
      styles.bg,
      styles.border,
      interactive && 'cursor-pointer hover:shadow-md',
      className
    )} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  if (interactive) {
    return (
      <StatCardContext.Provider value={{ variant, interactive }}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {content}
        </motion.div>
      </StatCardContext.Provider>
    );
  }

  return (
    <StatCardContext.Provider value={{ variant, interactive }}>
      {content}
    </StatCardContext.Provider>
  );
};

// ==================== Icon ====================
interface IconProps {
  icon: LucideIcon;
  className?: string;
}

const Icon = ({ icon: IconComponent, className }: IconProps) => {
  const { variant = 'default' } = useStatCard();
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
      styles.icon,
      className
    )}>
      <IconComponent className="w-6 h-6" />
    </div>
  );
};

// ==================== Content ====================
interface ContentProps {
  children: React.ReactNode;
  className?: string;
}

const Content = ({ children, className }: ContentProps) => {
  return (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  );
};

// ==================== Label ====================
interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

const Label = ({ children, className }: LabelProps) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
};

// ==================== Value ====================
interface ValueProps {
  children: React.ReactNode;
  className?: string;
}

const Value = ({ children, className }: ValueProps) => {
  const { variant = 'default' } = useStatCard();
  const styles = variantStyles[variant];

  return (
    <p className={cn('text-2xl font-bold', styles.value, className)}>
      {children}
    </p>
  );
};

// ==================== Trend ====================
interface TrendProps {
  value: number;
  suffix?: string;
  className?: string;
}

const Trend = ({ value, suffix = '%', className }: TrendProps) => {
  const isPositive = value >= 0;

  return (
    <span className={cn(
      'text-xs font-medium',
      isPositive ? 'text-emerald-600' : 'text-red-600',
      className
    )}>
      {isPositive ? '+' : ''}{value}{suffix}
    </span>
  );
};

// ==================== Badge ====================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  const badgeVariants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  };

  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-full font-medium',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
};

// ==================== Export ====================
export const StatCard = {
  Root,
  Icon,
  Content,
  Label,
  Value,
  Trend,
  Badge,
};

export { useStatCard };
