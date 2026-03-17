import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';

interface FloatingAction {
  id: string;
  icon: ReactNode;
  onClick: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'accent';
  visible?: boolean;
  badge?: number;
}

interface FloatingActionsStackProps {
  actions: FloatingAction[];
  position?: 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * Unified floating actions stack component
 * Handles responsive positioning for web and mobile
 * Actions are stacked vertically with proper spacing
 */
const FloatingActionsStack = memo(({ 
  actions, 
  position = 'bottom-left',
  className 
}: FloatingActionsStackProps) => {
  const { isMobile, isTablet } = useDisplayMode();
  
  const visibleActions = actions.filter(action => action.visible !== false);
  
  if (visibleActions.length === 0) return null;

  // Responsive sizing - smaller on mobile
  const buttonSize = isMobile ? 'w-11 h-11' : 'w-12 h-12';
  const gap = isMobile ? 'gap-2' : 'gap-3';
  
  // Position classes — consistent layering above bottom nav (mobile) or at bottom (desktop)
  // Mobile bottom nav = 60px + safe-area. We sit above it with clear spacing.
  const getPositionClasses = () => {
    if (position === 'bottom-right') {
      return isMobile 
        ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-16' // Right side but clear of UnifiedFloatingMenu
        : 'bottom-6 right-24'; // Clear of UnifiedFloatingMenu on desktop
    }
    // bottom-left (default)
    return isMobile 
      ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3'
      : isTablet 
        ? 'bottom-6 left-6'
        : 'bottom-6 left-6';
  };

  const getVariantClasses = (variant: FloatingAction['variant']) => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/90';
      case 'accent':
        return 'bg-accent text-accent-foreground hover:bg-accent/90';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };

  return (
    <div 
      className={cn(
        'fixed z-40 flex flex-col-reverse items-center',
        gap,
        getPositionClasses(),
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {visibleActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: { delay: index * 0.05 }
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={action.onClick}
            className={cn(
              'rounded-full shadow-lg flex items-center justify-center relative',
              'touch-manipulation transition-colors',
              buttonSize,
              getVariantClasses(action.variant)
            )}
            title={action.label}
            aria-label={action.label}
          >
            {action.icon}
            
            {/* Badge */}
            {action.badge && action.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                {action.badge > 99 ? '99+' : action.badge}
              </span>
            )}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingActionsStack.displayName = 'FloatingActionsStack';

export default FloatingActionsStack;
