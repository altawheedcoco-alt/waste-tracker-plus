import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// ==================== Context ====================
interface InfoListContextValue {
  layout?: 'vertical' | 'horizontal' | 'grid';
  size?: 'sm' | 'default' | 'lg';
}

const InfoListContext = React.createContext<InfoListContextValue>({ layout: 'vertical', size: 'default' });

// ==================== Root ====================
interface RootProps {
  children: React.ReactNode;
  layout?: 'vertical' | 'horizontal' | 'grid';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const Root = ({ children, layout = 'vertical', size = 'default', className }: RootProps) => {
  const layoutClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-wrap items-center',
    grid: 'grid grid-cols-2 md:grid-cols-3',
  };

  const gapClasses = {
    sm: layout === 'horizontal' ? 'gap-3' : 'gap-2',
    default: layout === 'horizontal' ? 'gap-4' : 'gap-3',
    lg: layout === 'horizontal' ? 'gap-6' : 'gap-4',
  };

  return (
    <InfoListContext.Provider value={{ layout, size }}>
      <div className={cn(layoutClasses[layout], gapClasses[size], className)}>
        {children}
      </div>
    </InfoListContext.Provider>
  );
};

// ==================== Item ====================
interface ItemProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  label?: string;
  className?: string;
}

const Item = ({ children, icon: Icon, label, className }: ItemProps) => {
  const { layout, size } = React.useContext(InfoListContext);

  const textSizes = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn(
      'flex items-center gap-2',
      layout === 'vertical' && 'justify-between',
      className
    )}>
      {Icon && <Icon className={cn('w-4 h-4 text-muted-foreground shrink-0')} />}
      {label && (
        <span className={cn('text-muted-foreground', textSizes[size || 'default'])}>
          {label}:
        </span>
      )}
      <span className={cn('font-medium', textSizes[size || 'default'])}>
        {children}
      </span>
    </div>
  );
};

// ==================== Row ====================
interface RowProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

const Row = ({ label, value, icon: Icon, className }: RowProps) => {
  const { size } = React.useContext(InfoListContext);

  const textSizes = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        <span className={textSizes[size || 'default']}>{label}</span>
      </div>
      <span className={cn('font-medium', textSizes[size || 'default'])}>
        {value}
      </span>
    </div>
  );
};

// ==================== Badge Item ====================
interface BadgeItemProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  icon?: LucideIcon;
  className?: string;
}

const BadgeItem = ({ children, variant = 'secondary', icon: Icon, className }: BadgeItemProps) => {
  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </Badge>
  );
};

// ==================== Divider ====================
interface DividerProps {
  className?: string;
}

const Divider = ({ className }: DividerProps) => {
  return <Separator className={className} />;
};

// ==================== Section ====================
interface SectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Section = ({ children, title, className }: SectionProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      )}
      {children}
    </div>
  );
};

// ==================== Export ====================
export const InfoList = {
  Root,
  Item,
  Row,
  BadgeItem,
  Divider,
  Section,
};
