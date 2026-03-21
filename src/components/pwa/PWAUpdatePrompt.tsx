import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      if (r) {
        // فحص التحديثات كل 2 دقيقة
        setInterval(() => r.update(), 2 * 60 * 1000);

        // فحص فوري عند العودة من الخلفية
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            r.update();
          }
        });

        // فحص فوري عند استعادة الاتصال
        window.addEventListener('online', () => {
          r.update();
        });
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-[100] mx-auto max-w-sm safe-top-pwa"
        >
          <div className="bg-primary text-primary-foreground rounded-xl shadow-lg p-3 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 flex-shrink-0 animate-spin" />
            <div className="flex-1 text-sm">
              تحديث جديد متوفر!
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="text-xs h-7"
            >
              تحديث
            </Button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="text-primary-foreground/70 hover:text-primary-foreground text-lg leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdatePrompt;
