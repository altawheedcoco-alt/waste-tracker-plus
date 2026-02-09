import { memo, ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { MoreVertical, X } from 'lucide-react';

interface FloatingItem {
  id: string;
  component: ReactNode;
  priority: number; // Lower = shows first (main button)
}

interface MobileFloatingContainerProps {
  items: FloatingItem[];
  className?: string;
}

/**
 * Container for floating action buttons on mobile
 * Collapses multiple FABs into a single expandable menu on small screens
 */
const MobileFloatingContainer = memo(({ items, className }: MobileFloatingContainerProps) => {
  const { isMobile } = useDisplayMode();
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort by priority
  const sortedItems = [...items].sort((a, b) => a.priority - b.priority);

  // On desktop, render all items normally
  if (!isMobile) {
    return (
      <div className={cn('fixed bottom-6 left-6 z-40 flex flex-col-reverse gap-3', className)}>
        {sortedItems.map((item) => (
          <div key={item.id}>{item.component}</div>
        ))}
      </div>
    );
  }

  // On mobile, show collapsed menu
  const primaryItem = sortedItems[0];
  const secondaryItems = sortedItems.slice(1);

  return (
    <div 
      className={cn(
        'fixed z-40',
        'bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3',
        className
      )}
    >
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Secondary items */}
            <div className="absolute bottom-14 left-0 flex flex-col-reverse gap-2 z-40">
              {secondaryItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 10, 
                    scale: 0.8,
                    transition: { delay: (secondaryItems.length - index) * 0.03 }
                  }}
                >
                  {item.component}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main toggle button or primary action */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-11 h-11 rounded-full shadow-lg flex items-center justify-center',
          'bg-primary text-primary-foreground touch-manipulation',
          'transition-colors hover:bg-primary/90'
        )}
        whileTap={{ scale: 0.95 }}
        aria-label={isExpanded ? 'إغلاق القائمة' : 'فتح القائمة'}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MoreVertical className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Badge showing number of hidden items */}
        {!isExpanded && secondaryItems.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {secondaryItems.length}
          </span>
        )}
      </motion.button>
    </div>
  );
});

MobileFloatingContainer.displayName = 'MobileFloatingContainer';

export default MobileFloatingContainer;
