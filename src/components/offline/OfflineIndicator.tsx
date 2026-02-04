import { memo } from 'react';
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
 */
const OfflineIndicator = memo(({ 
  className, 
  showSlowConnection = true 
}: OfflineIndicatorProps) => {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  const handleRefresh = () => {
    window.location.reload();
  };

  const showWarning = !isOnline || (showSlowConnection && isSlowConnection);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[100] px-4 py-3',
            !isOnline 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-yellow-500 text-yellow-950',
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
                  <AlertTriangle className="w-5 h-5 shrink-0" />
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
