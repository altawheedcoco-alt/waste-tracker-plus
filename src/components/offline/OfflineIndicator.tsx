import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

/**
 * مؤشر حالة الاتصال بالإنترنت
 * نقطة خضراء = اتصال جيد
 * نقطة حمراء = اتصال ضعيف أو منقطع
 */
const OfflineIndicator = memo(({ className }: OfflineIndicatorProps) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const isWeakConnection = !isOnline || isSlowConnection;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        className={cn(
          'w-2.5 h-2.5 rounded-full shrink-0',
          isWeakConnection ? 'bg-red-500' : 'bg-green-500'
        )}
        animate={isWeakConnection ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={isWeakConnection ? { duration: 1.5, repeat: Infinity } : {}}
      />
      {isWeakConnection && (
        <span className="text-xs text-muted-foreground">
          ضعف الاتصال بالشبكة
        </span>
      )}
    </div>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

export default OfflineIndicator;
