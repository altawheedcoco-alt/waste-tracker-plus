import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CreditCard, Crown, Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const EXEMPT_ROUTES = ['/dashboard/subscription', '/dashboard/settings'];

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasActiveSubscription, isExempt, isLoading } = useSubscriptionStatus();

  // Exempt routes (subscription page must be accessible to subscribe)
  const isExemptRoute = EXEMPT_ROUTES.some(r => location.pathname.startsWith(r));

  // Not logged in - let auth handle it
  if (!user) return <>{children}</>;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // System admin, has active subscription, or exempt route
  if (isExempt || hasActiveSubscription || isExemptRoute) {
    return <>{children}</>;
  }

  // No active subscription - show paywall
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
            للاستمرار في استخدام المنصة وجميع خدماتها، يرجى تفعيل اشتراكك الشهري.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate('/dashboard/subscription')}
            >
              <CreditCard className="w-5 h-5" />
              اشترك الآن
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
            >
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
