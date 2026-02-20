import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, Clock, AlertTriangle, Crown, Sparkles, Receipt, Users, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const SubscriptionManagement = () => {
  const { user, organization } = useAuth();
  const { requiredSeats, linkedOrgsCount, needsUpgrade } = useSubscriptionStatus();

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_egp', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: currentSub } = useQuery({
    queryKey: ['my-subscription', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: linkedPartners = [] } = useQuery({
    queryKey: ['linked-partners-for-sub', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('verified_partnerships')
        .select('partner_org_id, partner:organizations!verified_partnerships_partner_org_id_fkey(name, organization_type)')
        .eq('requester_org_id', organization.id)
        .eq('status', 'active');
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['my-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleSubscribe = async (planId: string) => {
    if (!user?.id || !organization?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('paymob-checkout', {
        body: { 
          user_id: user.id, 
          organization_id: organization.id,
          plan_id: planId, 
          payment_method: 'card',
          seats: requiredSeats,
        },
      });
      if (error) throw error;
      if (data?.payment_url) {
        window.open(data.payment_url, '_blank');
      } else {
        toast.error('لم يتم الحصول على رابط الدفع');
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء بدء عملية الدفع');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 gap-1"><CheckCircle className="w-3 h-3" /> نشط</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> منتهي</Badge>;
      case 'grace_period':
        return <Badge className="bg-amber-500/10 text-amber-600 gap-1"><Clock className="w-3 h-3" /> فترة سماح</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOrgTypeName = (type: string) => {
    const map: Record<string, string> = { generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص' };
    return map[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 px-1 sm:px-0 overflow-hidden" dir="rtl">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              إدارة الاشتراك والدفع
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">إدارة خطتك الحالية ومعاملاتك المالية</p>
          </div>
        </div>

        {/* Seats Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg">{requiredSeats} مقعد مطلوب</p>
                  <p className="text-sm text-muted-foreground">جهتك + {linkedOrgsCount} جهة مرتبطة</p>
                </div>
              </div>
              {needsUpgrade && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  يلزم ترقية الاشتراك
                </Badge>
              )}
            </div>

            {/* Linked Partners List */}
            {linkedPartners.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الجهات المرتبطة (أنت تدفع اشتراكها):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {linkedPartners.map((p: any) => (
                    <div key={p.partner_org_id} className="flex items-center gap-2 bg-background rounded-lg p-2 border">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{p.partner?.name || 'جهة غير معروفة'}</span>
                      <Badge variant="outline" className="text-xs mr-auto shrink-0">
                        {getOrgTypeName(p.partner?.organization_type || '')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Subscription */}
        {currentSub && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                اشتراكك الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-lg sm:text-xl font-bold truncate">{(currentSub as any).plan?.name_ar || 'خطة غير معروفة'}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <span>{currentSub.total_seats || 1} مقعد مدفوع</span>
                    {currentSub.start_date && (
                      <span>بدأ: {format(new Date(currentSub.start_date), 'dd MMM yyyy', { locale: ar })}</span>
                    )}
                    {currentSub.expiry_date && (
                      <span>ينتهي: {format(new Date(currentSub.expiry_date), 'dd MMM yyyy', { locale: ar })}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(currentSub.status)}
                  {currentSub.auto_renew && (
                    <Badge variant="outline" className="gap-1"><Sparkles className="w-3 h-3" /> تجديد تلقائي</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-lg font-semibold mb-3">الخطط المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan: any) => {
              const isCurrentPlan = currentSub?.plan_id === plan.id && currentSub?.status === 'active' && !needsUpgrade;
              const features = Array.isArray(plan.features) ? plan.features : [];
              const totalPrice = plan.price_egp * requiredSeats;
              return (
                <Card key={plan.id} className={`relative overflow-hidden transition-all ${isCurrentPlan ? 'border-primary ring-1 ring-primary/20' : 'hover:border-primary/40'}`}>
                  {isCurrentPlan && <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name_ar}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-bold text-primary">{totalPrice.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">ج.م / {plan.duration_days === 30 ? 'شهر' : plan.duration_days === 365 ? 'سنة' : `${plan.duration_days} يوم`}</span>
                      </div>
                      {requiredSeats > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {plan.price_egp.toLocaleString()} ج.م × {requiredSeats} مقعد
                        </p>
                      )}
                    </div>
                    {features.length > 0 && (
                      <ul className="space-y-1.5">
                        {features.map((f: string, i: number) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {isCurrentPlan ? 'خطتك الحالية' : needsUpgrade ? 'ترقية الاشتراك' : 'اشترك الآن'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              سجل المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>لا توجد معاملات بعد</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge className={tx.status === 'completed' ? 'bg-green-500/10 text-green-600' : tx.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-destructive/10 text-destructive'}>
                        {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'قيد الانتظار' : tx.status === 'failed' ? 'فشل' : tx.status}
                      </Badge>
                      <span className="font-semibold">{tx.amount?.toLocaleString()} {tx.currency || 'EGP'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{tx.payment_method === 'card' ? 'بطاقة' : tx.payment_method === 'wallet' ? 'محفظة' : tx.payment_method}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'dd MMM yyyy hh:mm a', { locale: ar })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionManagement;
