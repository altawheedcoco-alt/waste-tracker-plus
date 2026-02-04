import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2, LucideIcon } from 'lucide-react';

// ==================== Context ====================
interface ActionMenuContextValue {
  loading?: boolean;
  disabled?: boolean;
}

const ActionMenuContext = React.createContext<ActionMenuContextValue | null>(null);

// ==================== Root ====================
interface RootProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

const Root = ({ children, loading, disabled }: RootProps) => {
  return (
    <ActionMenuContext.Provider value={{ loading, disabled }}>
      <DropdownMenu>
        {children}
      </DropdownMenu>
    </ActionMenuContext.Provider>
  );
};

// ==================== Trigger ====================
interface TriggerProps {
  children?: React.ReactNode;
  icon?: LucideIcon;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'eco';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  showChevron?: boolean;
}

const Trigger = ({ 
  children, 
  icon: Icon, 
  label, 
  variant = 'default',
  size = 'sm',
  className,
  showChevron = true,
}: TriggerProps) => {
  const context = React.useContext(ActionMenuContext);

  return (
    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
      <Button
        size={size}
        variant={variant}
        className={cn('gap-1', className)}
        disabled={context?.disabled || context?.loading}
      >
        {context?.loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className="w-4 h-4" />
        ) : null}
        {label || children}
        {showChevron && <ChevronDown className="w-3 h-3" />}
      </Button>
    </DropdownMenuTrigger>
  );
};

// ==================== Content ====================
interface ContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const Content = ({ children, align = 'start', className }: ContentProps) => {
  return (
    <DropdownMenuContent 
      align={align} 
      className={cn('w-48 bg-popover z-50', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </DropdownMenuContent>
  );
};

// ==================== Item ====================
interface ItemProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}

const Item = ({ 
  children, 
  icon: Icon, 
  iconClassName,
  onClick, 
  disabled,
  destructive,
  className 
}: ItemProps) => {
  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'gap-2 cursor-pointer',
        destructive && 'text-destructive focus:text-destructive',
        className
      )}
    >
      {Icon && (
        <Icon className={cn('w-4 h-4', iconClassName)} />
      )}
      <span>{children}</span>
    </DropdownMenuItem>
  );
};

// ==================== Item with Badge ====================
interface ItemWithBadgeProps extends ItemProps {
  badge?: React.ReactNode;
  badgeClassName?: string;
}

const ItemWithBadge = ({ 
  children, 
  icon: Icon,
  iconClassName,
  badge,
  badgeClassName,
  onClick, 
  disabled,
  className 
}: ItemWithBadgeProps) => {
  return (
    <DropdownMenuItem
      onClick={onClick}
      disabled={disabled}
      className={cn('gap-2 cursor-pointer', className)}
    >
      {Icon && (
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', iconClassName)}>
          <Icon className="w-3 h-3" />
        </div>
      )}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className={cn('text-xs', badgeClassName)}>{badge}</span>
      )}
    </DropdownMenuItem>
  );
};

// ==================== Separator ====================
const Separator = () => {
  return <DropdownMenuSeparator />;
};

// ==================== Group ====================
interface GroupProps {
  children: React.ReactNode;
  label?: string;
}

const Group = ({ children, label }: GroupProps) => {
  return (
    <>
      {label && (
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {label}
        </div>
      )}
      {children}
    </>
  );
};

// ==================== Export ====================
export const ActionMenu = {
  Root,
  Trigger,
  Content,
  Item,
  ItemWithBadge,
  Separator,
  Group,
};
