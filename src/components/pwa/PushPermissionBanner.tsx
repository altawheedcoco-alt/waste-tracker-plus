/**
 * PushPermissionBanner — بانر بسيط لتفعيل الإشعارات بنقرة واحدة
 * يظهر مرة واحدة فقط — يضغط المستخدم "تفعيل" ← إذن المتصفح ← اشتراك ← يختفي
 */
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'push_banner_dismissed_session';

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, loading, subscribe } = useWebPush();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    if (isSubscribed || permission === 'denied') return;
    // Show every session unless dismissed in this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    setVisible(true);
  }, [user, isSupported, isSubscribed, permission]);

  // Hide after successful subscription
  useEffect(() => {
    if (isSubscribed && visible) setVisible(false);
  }, [isSubscribed, visible]);

  if (!visible) return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) {
      setVisible(false);
      localStorage.setItem(DISMISSED_KEY, '1');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <div className={cn(
      'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm',
      'bg-card border border-border rounded-2xl shadow-lg',
      'p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300'
    )}>
      <div className="shrink-0 bg-primary/10 rounded-full p-2.5">
        <Bell className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">تفعيل الإشعارات</p>
        <p className="text-xs text-muted-foreground mt-0.5">لتصلك التنبيهات المهمة فوراً</p>
      </div>

      <button
        onClick={handleEnable}
        disabled={loading}
        className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? '...' : 'تفعيل'}
      </button>

      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-full hover:bg-muted/60 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
