import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, X, CloudOff, Database } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  className?: string;
}

/**
 * بانر ثابت يظهر في أسفل الشاشة عند انقطاع الاتصال
 * مع معلومات عن البيانات المحفوظة محلياً
 */
const OfflineBanner = memo(({ className }: OfflineBannerProps) => {
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // تتبع حالة إعادة الاتصال
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setDismissed(false);
    } else if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleDismiss = () => {
    setDismissed(true);
  };

  // عرض رسالة إعادة الاتصال
  if (showReconnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100]',
          'bg-primary text-primary-foreground rounded-lg shadow-lg p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Wifi className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">تم استعادة الاتصال</p>
            <p className="text-xs opacity-90">جاري مزامنة البيانات...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // لا تعرض شيء إذا كان متصل أو تم إغلاق البانر
  if (isOnline || dismissed) {
    return null;
  }

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
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            أنت تعمل بدون اتصال بالإنترنت. لا تقلق، بياناتك محفوظة.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-primary" />
              <span>البيانات المحفوظة متاحة للعرض</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CloudOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">التحديثات ستتم عند عودة الاتصال</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

export default OfflineBanner;
