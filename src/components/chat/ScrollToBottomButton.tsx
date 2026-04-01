import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScrollToBottomButtonProps {
  isVisible: boolean;
  unreadCount?: number;
  onClick: () => void;
  className?: string;
}

/**
 * زر "انزل للأسفل" يظهر عند التمرير لأعلى — بنمط واتساب
 */
const ScrollToBottomButton = memo(({ isVisible, unreadCount = 0, onClick, className }: ScrollToBottomButtonProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onClick}
          className={cn(
            "absolute bottom-20 left-4 z-10",
            "w-10 h-10 rounded-full bg-card border border-border shadow-lg",
            "flex items-center justify-center",
            "hover:bg-muted active:scale-95 transition-colors",
            className
          )}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-1"
            >
              <Badge className="h-5 min-w-5 rounded-full text-[10px] px-1.5 bg-primary text-primary-foreground">
                {unreadCount}
              </Badge>
            </motion.div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
});

ScrollToBottomButton.displayName = 'ScrollToBottomButton';
export default ScrollToBottomButton;
