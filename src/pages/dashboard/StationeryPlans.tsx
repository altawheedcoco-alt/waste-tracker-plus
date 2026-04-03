/**
 * StationeryPlans — Pricing page for stationery subscription tiers
 */
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

const TIER_CONFIG: Record<string, { icon: any; gradient: string; badge: string }> = {
  free: { icon: Zap, gradient: 'from-gray-100 to-gray-200', badge: 'مجاني' },
  basic: { icon: Star, gradient: 'from-blue-50 to-blue-100', badge: 'أساسي' },
  professional: { icon: Sparkles, gradient: 'from-purple-50 to-purple-100', badge: 'احترافي' },
  enterprise: { icon: Crown, gradient: 'from-amber-50 to-amber-100', badge: 'مؤسسي VIP' },
};

const StationeryPlans = () => {
  const { profile } = useAuth();

  const { data: plans = [] } = useQuery({
    queryKey: ['stationery-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stationery_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: currentSub } = useQuery({
    queryKey: ['stationery-sub', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data } = await supabase
        .from('stationery_subscriptions')
        .select('*, plan:stationery_plans(*)')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const currentTier = (currentSub as any)?.plan?.plan_tier || 'free';

  const handleSubscribe = async (plan: any) => {
    if (!profile?.organization_id) {
      toast.error('يرجى تسجيل الدخول أولاً');
      return;
    }
    if (plan.plan_tier === 'free') {
      // Auto-activate free plan
      const { error } = await supabase.from('stationery_subscriptions').insert({
        organization_id: profile.organization_id,
        plan_id: plan.id,
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (!error) toast.success('تم تفعيل الباقة المجانية');
      else toast.error('حدث خطأ');
      return;
    }
    // For paid plans, show payment info (will integrate with Paymob)
    toast.info('سيتم ربط بوابة الدفع قريباً — تواصل مع الإدارة للتفعيل');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 max-w-6xl mx-auto" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">باقات المطبوعات الرسمية المؤمّنة</h1>
        <p className="text-muted-foreground mt-2">
          اختر الباقة المناسبة لمنظمتك — ورق رسمي مؤمّن بعلامات مائية وتشفير رقمي
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan: any) => {
          const config = TIER_CONFIG[plan.plan_tier] || TIER_CONFIG.free;
          const Icon = config.icon;
          const isCurrent = currentTier === plan.plan_tier;
          const features: string[] = Array.isArray(plan.features) ? plan.features : [];

          return (
            <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-xl ${isCurrent ? 'ring-2 ring-primary' : ''} ${plan.plan_tier === 'professional' ? 'scale-[1.02] shadow-lg' : ''}`}>
              {plan.plan_tier === 'professional' && (
                <div className="absolute top-0 right-0 left-0 bg-primary text-primary-foreground text-center text-xs py-1 font-bold">
                  ⭐ الأكثر شعبية
                </div>
              )}
              <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
              <CardHeader className={`text-center ${plan.plan_tier === 'professional' ? 'pt-8' : ''}`}>
                <div className="flex justify-center mb-2">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-foreground">{plan.price_monthly}</span>
                  <span className="text-sm text-muted-foreground mr-1">ج.م/شهر</span>
                </div>
                {plan.price_yearly > 0 && (
                  <p className="text-xs text-muted-foreground">أو {plan.price_yearly} ج.م/سنوياً (وفر {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  variant={isCurrent ? 'outline' : plan.plan_tier === 'professional' ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isCurrent ? '✓ باقتك الحالية' : plan.price_monthly === 0 ? 'ابدأ مجاناً' : 'اشترك الآن'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison note */}
      <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-4">
        <p>🔒 جميع المطبوعات مؤمّنة برموز QR للتحقق الإلكتروني</p>
        <p>📞 للباقات المؤسسية والتخصيص الكامل تواصل معنا</p>
      </div>
    </div>
  );
};

export default StationeryPlans;
