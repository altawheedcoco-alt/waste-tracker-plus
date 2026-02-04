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

// ==================== Variant Styles (using semantic tokens) ====================
const variantStyles = {
  default: {
    bg: 'bg-card',
    icon: 'bg-primary/10 text-primary',
    value: 'text-foreground',
    border: 'border-border',
  },
  success: {
    bg: 'bg-accent/20',
    icon: 'bg-accent/30 text-accent-foreground',
    value: 'text-accent-foreground',
    border: 'border-accent/50',
  },
  warning: {
    bg: 'bg-secondary/50',
    icon: 'bg-secondary text-secondary-foreground',
    value: 'text-secondary-foreground',
    border: 'border-secondary',
  },
  danger: {
    bg: 'bg-destructive/10',
    icon: 'bg-destructive/20 text-destructive',
    value: 'text-destructive',
    border: 'border-destructive/50',
  },
  info: {
    bg: 'bg-muted',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
    border: 'border-primary/30',
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
      isPositive ? 'text-primary' : 'text-destructive',
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

const badgeVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-accent text-accent-foreground',
  warning: 'bg-secondary text-secondary-foreground',
  danger: 'bg-destructive/10 text-destructive',
};

const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-full font-medium',
      badgeVariantStyles[variant],
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
