import { BellRing, Loader2 } from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const EnableNotificationsButton = () => {
  const { user } = useAuth();
  const { isSupported, supportChecked, unsupportedReason, isSubscribed, permission, loading, subscribe } = useWebPush();

  if (!user || isSubscribed || permission === 'denied') return null;

  const hintLabel = !isSupported && supportChecked
    ? (unsupportedReason?.includes('الشاشة الرئيسية') ? 'ثبّت التطبيق أولاً' : 'تحقق من دعم المتصفح')
    : '🔔 فعّل الإشعارات';

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => subscribe()}
        disabled={loading}
        className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
        dir="rtl"
        title={unsupportedReason || 'تفعيل الإشعارات'}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <BellRing className="h-5 w-5 animate-pulse" />
        )}
        <span className="text-sm font-medium">
          {loading ? 'جاري التفعيل...' : hintLabel}
        </span>
      </motion.button>
    </AnimatePresence>
  );
};

export default EnableNotificationsButton;
