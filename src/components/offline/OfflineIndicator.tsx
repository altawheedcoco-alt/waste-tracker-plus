import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showSlowConnection?: boolean;
}

/**
 * مؤشر حالة الاتصال بالإنترنت
 * يظهر عند انقطاع الاتصال أو بطء الشبكة
 * يتحدث تلقائياً ويظهر بتأثير وميض
 */
const OfflineIndicator = memo(({ 
  className, 
  showSlowConnection = true 
}: OfflineIndicatorProps) => {
  const { isOnline, isSlowConnection, effectiveType, checkConnection } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(true);

  const handleRefresh = () => {
    window.location.reload();
  };

  const showWarning = !isOnline || (showSlowConnection && isSlowConnection);

  // Auto-refresh connection status every 10 seconds
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      checkConnection?.();
    }, 10000);

    return () => clearInterval(interval);
  }, [showWarning, checkConnection]);

  // Blinking effect - show/hide every 4 seconds for slow connection
  useEffect(() => {
    if (!isOnline) {
      // Always show when offline
      setIsVisible(true);
      return;
    }

    if (!isSlowConnection) {
      setIsVisible(true);
      return;
    }

    // Blink effect for slow connection
    const blinkInterval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 4000);

    return () => clearInterval(blinkInterval);
  }, [isOnline, isSlowConnection]);

  return (
    <AnimatePresence>
      {showWarning && isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[100] px-4 py-3',
            !isOnline 
              ? 'bg-destructive/90 text-destructive-foreground backdrop-blur-sm' 
              : 'bg-yellow-500/80 text-yellow-950 backdrop-blur-sm',
            className
          )}
        >
          <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <>
                  <WifiOff className="w-5 h-5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold">لا يوجد اتصال بالإنترنت</p>
                    <p className="text-xs opacity-90">
                      بعض الميزات قد لا تعمل بشكل صحيح
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  </motion.div>
                  <div className="text-sm">
                    <p className="font-semibold">اتصال بطيء ({effectiveType})</p>
                    <p className="text-xs opacity-90">
                      قد يستغرق التحميل وقتاً أطول
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-current hover:bg-white/20 shrink-0"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

export default OfflineIndicator;
