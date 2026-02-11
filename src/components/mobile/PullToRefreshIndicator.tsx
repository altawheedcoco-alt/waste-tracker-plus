/**
 * PullToRefreshIndicator - مؤشر سحب للتحديث
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullProgress: number;
  pullDistance: number;
}

const PullToRefreshIndicator = memo(({
  isPulling,
  isRefreshing,
  pullProgress,
  pullDistance,
}: PullToRefreshIndicatorProps) => {
  const show = isPulling || isRefreshing;
  const ready = pullProgress >= 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: isPulling ? pullDistance - 40 : 10 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-0 left-0 right-0 z-[110] flex justify-center pointer-events-none"
        >
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shadow-lg',
            'bg-card border border-border',
            ready && !isRefreshing && 'bg-primary text-primary-foreground border-primary'
          )}>
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <motion.div
                animate={{ rotate: pullProgress * 180 }}
              >
                <RefreshCw className={cn(
                  'h-5 w-5',
                  ready ? 'text-primary-foreground' : 'text-muted-foreground'
                )} />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PullToRefreshIndicator.displayName = 'PullToRefreshIndicator';

export default PullToRefreshIndicator;
