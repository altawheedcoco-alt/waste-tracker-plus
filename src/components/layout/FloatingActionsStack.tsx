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
  const buttonSize = isMobile ? 'w-10 h-10' : 'w-14 h-14';
  const iconSize = isMobile ? 16 : 22;
  const gap = isMobile ? 'gap-2' : 'gap-3';
  
  // Position classes based on device and position prop - moved higher on mobile to avoid overlap
  const getPositionClasses = () => {
    if (position === 'bottom-right') {
      return isMobile 
        ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] right-3' 
        : 'bottom-6 right-6';
    }
    // bottom-left (default) - stacked above other widgets with more spacing
    return isMobile 
      ? 'bottom-[calc(11rem+env(safe-area-inset-bottom))] left-3' // Higher on mobile to avoid FAB overlap
      : isTablet 
        ? 'bottom-6 left-20' // Clear of sidebar
        : 'bottom-6 left-24'; // Desktop with sidebar
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
