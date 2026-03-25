/**
 * PushPermissionBanner — بانر إلزامي لتفعيل الإشعارات
 * لا يمكن إغلاقه — يظهر دائماً حتى يتم التفعيل
 */
import { useState, useEffect } from 'react';
import { Bell, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';
import { cn } from '@/lib/utils';

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, loading, subscribe } = useWebPush();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    // Hide only if already subscribed
    if (isSubscribed) {
      setVisible(false);
      return;
    }

    // Show after short delay
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, [user, isSupported, isSubscribed, permission]);

  if (!visible) return null;

  const isDenied = permission === 'denied';

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) setVisible(false);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" />
      
      <div className={cn(
        'fixed bottom-20 left-4 right-4 z-[9999] mx-auto max-w-sm',
        'bg-primary text-primary-foreground rounded-2xl shadow-2xl',
        'p-5 flex flex-col items-center gap-3 animate-in slide-in-from-bottom-5 duration-500'
      )}>
        <div className="shrink-0 bg-primary-foreground/20 rounded-full p-3">
          {isDenied ? (
            <ShieldAlert className="w-7 h-7" />
          ) : (
            <Bell className="w-7 h-7" />
          )}
        </div>

        <div className="text-center">
          <p className="text-base font-bold leading-tight">
            {isDenied ? 'الإشعارات محظورة ⚠️' : 'تفعيل الإشعارات إلزامي 🔔'}
          </p>
          <p className="text-xs opacity-90 mt-2 leading-relaxed">
            {isDenied
              ? 'يجب تفعيل الإشعارات من إعدادات المتصفح ← الأذونات ← السماح بالإشعارات، ثم أعد تحميل الصفحة'
              : 'لضمان وصول التحديثات والتنبيهات المهمة، يجب تفعيل الإشعارات للاستمرار في استخدام المنصة'
            }
          </p>

          {!isDenied && (
            <button
              onClick={handleEnable}
              disabled={loading}
              className={cn(
                'mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-all',
                'bg-primary-foreground text-primary hover:opacity-90',
                loading && 'opacity-60 cursor-wait'
              )}
            >
              {loading ? 'جاري التفعيل...' : 'تفعيل الإشعارات الآن'}
            </button>
          )}

          {isDenied && (
            <button
              onClick={() => window.location.reload()}
              className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold bg-primary-foreground text-primary hover:opacity-90"
            >
              إعادة تحميل الصفحة
            </button>
          )}
        </div>
      </div>
    </>
  );
}
