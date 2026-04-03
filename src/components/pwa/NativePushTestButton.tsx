/**
 * زر اختبار Web Push الأصلي — للتجربة فقط
 */
import { Bell, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNativePush } from '@/hooks/useNativePush';
import { useAuth } from '@/contexts/AuthContext';

export default function NativePushTestButton() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = useNativePush();

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
        ⚠️ المتصفح لا يدعم Web Push — جرّب من Chrome أو Edge
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-bold text-base flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        اختبار Web Push الأصلي (بدون Firebase)
      </h3>

      <p className="text-sm text-muted-foreground">
        اضغط الزر وهيوصلك إشعار على الموبايل/اللابتوب مباشرة بدون Firebase
      </p>

      {!user ? (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            لازم تسجّل الدخول أولاً عشان نقدر نربط الإشعارات بحسابك ونبعت لك إشعار تجريبي.
          </div>
          <Button asChild className="w-full">
            <Link to="/auth">سجّل الدخول لتجربة الإشعارات</Link>
          </Button>
        </div>
      ) : isSubscribed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            الإشعارات مفعّلة — المفروض وصلك إشعار تجريبي!
          </div>
          <Button variant="outline" size="sm" onClick={unsubscribe}>
            إلغاء الاشتراك
          </Button>
        </div>
      ) : (
        <Button onClick={subscribe} disabled={loading} className="w-full">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري التفعيل...</>
          ) : (
            '🔔 فعّل الإشعارات الأصلية (اختبار)'
          )}
        </Button>
      )}
    </div>
  );
}
