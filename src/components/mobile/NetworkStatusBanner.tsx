/**
 * NetworkStatusBanner - شريط حالة الاتصال
 * يظهر تلقائياً عند فقدان الاتصال أو بطء الشبكة
 */
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Signal } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const NetworkStatusBanner = memo(() => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const showBanner = !isOnline || isSlowConnection;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`overflow-hidden ${!isOnline ? 'bg-destructive' : 'bg-yellow-500/90'} text-white`}
        >
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-medium" dir="rtl">
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>لا يوجد اتصال بالإنترنت — يتم العمل بالبيانات المحفوظة</span>
              </>
            ) : (
              <>
                <Signal className="w-3.5 h-3.5" />
                <span>اتصال بطيء — قد يستغرق التحميل وقتاً أطول</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

NetworkStatusBanner.displayName = 'NetworkStatusBanner';
export default NetworkStatusBanner;
