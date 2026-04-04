/**
 * OfflineQueueIndicator - مؤشر بصري صغير للعمليات المعلقة
 * يظهر في شريط التنقل العلوي لإعلام المستخدم بحالة المزامنة
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';
import { offlineStorage } from '@/lib/offlineStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const OfflineQueueIndicator = () => {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const stats = await offlineStorage.getStats();
        const prev = pendingCount;
        setPendingCount(stats.pendingActions);
        
        // إذا انخفض العدد وأصبح صفراً = اكتملت المزامنة
        if (prev > 0 && stats.pendingActions === 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [pendingCount]);

  // لا تعرض شيء إذا كل شيء طبيعي
  if (isOnline && pendingCount === 0 && !justSynced) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'relative flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors',
              !isOnline ? 'bg-destructive/10 text-destructive' :
              pendingCount > 0 ? 'bg-warning/10 text-warning' :
              justSynced ? 'bg-primary/10 text-primary' : ''
            )}
          >
            <AnimatePresence mode="wait">
              {!isOnline ? (
                <motion.div key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CloudOff className="w-4 h-4" />
                </motion.div>
              ) : pendingCount > 0 ? (
                <motion.div key="syncing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.div>
              ) : justSynced ? (
                <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
                  <Check className="w-4 h-4" />
                </motion.div>
              ) : (
                <Cloud className="w-4 h-4" />
              )}
            </AnimatePresence>

            {/* Badge عدد العمليات */}
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {!isOnline ? (
            <span>غير متصل — {pendingCount > 0 ? `${pendingCount} عملية في الانتظار` : 'بيانات محفوظة محلياً'}</span>
          ) : pendingCount > 0 ? (
            <span>جاري مزامنة {pendingCount} عملية...</span>
          ) : justSynced ? (
            <span>تمت المزامنة بنجاح ✓</span>
          ) : (
            <span>متصل</span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OfflineQueueIndicator;
