import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, CloudOff, Database, RefreshCw, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  className?: string;
}

/**
 * بانر ثابت يظهر في أسفل الشاشة عند انقطاع الاتصال
 * مع معلومات عن المزامنة والعمليات المعلقة
 */
const OfflineBanner = ({ className }: OfflineBannerProps) => {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, pendingCount, syncNow, syncProgress } = useOfflineSync();
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Reconnected toast with sync progress
  if (showReconnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100]',
          'bg-primary text-primary-foreground rounded-lg shadow-lg p-4 space-y-2',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">تم استعادة الاتصال</p>
            <p className="text-xs opacity-90">
              {isSyncing ? `جاري مزامنة البيانات... ${syncProgress}%` : 
               pendingCount > 0 ? `${pendingCount} عملية معلقة` : 'تمت المزامنة بنجاح ✓'}
            </p>
          </div>
          {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
        {isSyncing && <Progress value={syncProgress} className="h-1 bg-primary-foreground/20" />}
      </motion.div>
    );
  }

  if (isOnline || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[100]',
          'bg-card border border-border rounded-xl shadow-xl overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="bg-destructive/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <WifiOff className="w-5 h-5" />
            <span className="font-semibold text-sm">وضع عدم الاتصال</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setDismissed(true)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            أنت تعمل بدون اتصال بالإنترنت. لا تقلق، بياناتك محفوظة وكل العمليات ستُزامن تلقائياً.
          </p>

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 text-sm">
              <RefreshCw className="w-4 h-4 text-warning" />
              <span className="text-warning-foreground">
                {pendingCount} عملية في انتظار المزامنة
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-primary" />
              <span>البيانات المحفوظة متاحة للعرض والتعديل</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CloudOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">كل التعديلات ستُرسل بترتيبها عند عودة الاتصال</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

OfflineBanner.displayName = 'OfflineBanner';

export default OfflineBanner;
