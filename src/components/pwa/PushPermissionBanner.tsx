/**
 * PushPermissionBanner — بانر يظهر بعد تسجيل الدخول لطلب تفعيل الإشعارات بضغطة واحدة
 * يختفي بعد التفعيل أو الرفض أو الإغلاق اليدوي
 */
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'push_banner_dismissed';

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, loading, subscribe } = useWebPush();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    if (isSubscribed || permission === 'granted' || permission === 'denied') return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Show after short delay
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, [user, isSupported, isSubscribed, permission]);

  if (!visible) return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <div className={cn(
      'fixed bottom-20 left-4 right-4 z-[9999] mx-auto max-w-sm',
      'bg-primary text-primary-foreground rounded-2xl shadow-2xl',
      'p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-500'
    )}>
      <div className="shrink-0 bg-primary-foreground/20 rounded-full p-2 mt-0.5">
        <Bell className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight">تفعيل الإشعارات 🔔</p>
        <p className="text-xs opacity-90 mt-1 leading-relaxed">
          فعّل الإشعارات لتصلك التحديثات فوراً حتى لو التطبيق مغلق
        </p>
        <button
          onClick={handleEnable}
          disabled={loading}
          className={cn(
            'mt-2.5 w-full py-2 rounded-xl text-sm font-bold transition-all',
            'bg-primary-foreground text-primary hover:opacity-90',
            loading && 'opacity-60 cursor-wait'
          )}
        >
          {loading ? 'جاري التفعيل...' : 'تفعيل الآن'}
        </button>
      </div>

      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
