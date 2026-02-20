import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CreditCard, Crown, Loader2, Users, AlertTriangle } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const EXEMPT_ROUTES = ['/dashboard/subscription', '/dashboard/settings'];

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasActiveSubscription, isExempt, isLoading, needsUpgrade, requiredSeats, linkedOrgsCount, planPrice } = useSubscriptionStatus();

  const isExemptRoute = EXEMPT_ROUTES.some(r => location.pathname.startsWith(r));

  if (!user) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isExempt || hasActiveSubscription || isExemptRoute) {
    return <>{children}</>;
  }

  // Needs upgrade - has subscription but not enough seats
  if (needsUpgrade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-lg w-full border-amber-500/30 shadow-xl">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">يلزم ترقية الاشتراك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              لديك <strong>{linkedOrgsCount}</strong> جهة مرتبطة. اشتراكك الحالي لا يغطي جميع الجهات.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>المقاعد المطلوبة:</span>
                <strong>{requiredSeats} (أنت + {linkedOrgsCount} جهة)</strong>
              </div>
              <div className="flex justify-between">
                <span>التكلفة الإجمالية:</span>
                <strong>{(planPrice * requiredSeats).toLocaleString()} ج.م/شهر</strong>
              </div>
            </div>
            <Button size="lg" className="w-full gap-2" onClick={() => navigate('/dashboard/subscription')}>
              <CreditCard className="w-5 h-5" />
              ترقية الاشتراك
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No subscription at all
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-lg w-full border-destructive/30 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">يلزم اشتراك نشط للوصول</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            للاستمرار في استخدام المنصة، يرجى تفعيل اشتراكك.
          </p>
          {linkedOrgsCount > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>جهتك + الجهات المرتبطة:</span>
                <strong>{requiredSeats} جهة</strong>
              </div>
              <div className="flex justify-between">
                <span>التكلفة الإجمالية:</span>
                <strong>{(planPrice > 0 ? planPrice * requiredSeats : 299 * requiredSeats).toLocaleString()} ج.م/شهر</strong>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full gap-2" onClick={() => navigate('/dashboard/subscription')}>
              <CreditCard className="w-5 h-5" />
              اشترك الآن
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              العودة للصفحة الرئيسية
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Crown className="w-4 h-4" />
            <span>مدراء النظام معفيون من الاشتراك</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGuard;
