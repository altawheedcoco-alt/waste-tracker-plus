/**
 * ملخص تنفيذي حي — يعرض المؤشرات الحرجة التي تتطلب انتباه المدير فوراً
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CriticalMetric {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: 'destructive' | 'warning' | 'success';
  path?: string;
}

const AdminExecutiveSummary = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const { data: metrics } = useQuery({
    queryKey: ['admin-executive-summary'],
    queryFn: async () => {
      const [delayed, pendingApprovals, pendingOrgs] = await Promise.all([
        // شحنات متأخرة (أكثر من 48 ساعة في حالة new)
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new')
          .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
        // طلبات اعتماد سائقين معلقة
        supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true })
          .eq('is_verified', false),
        // جهات بانتظار الموافقة
        (supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true }) as any)
          .eq('status', 'pending'),
      ]);

      // استعلام منفصل لتجنب مشكلة الأنواع
      const activeShipments = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['approved', 'in_transit', 'collecting']);

      return {
        delayedShipments: delayed.count ?? 0,
        pendingDrivers: pendingApprovals.count ?? 0,
        pendingOrgs: pendingOrgs.count ?? 0,
        activeNow: activeShipments.count ?? 0,
      };
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (!metrics) return null;

  const items: CriticalMetric[] = [
    {
      label: isRTL ? 'شحنات متأخرة' : 'Delayed Shipments',
      value: metrics.delayedShipments,
      icon: AlertTriangle,
      variant: metrics.delayedShipments > 0 ? 'destructive' : 'success',
      path: '/dashboard/shipments',
    },
    {
      label: isRTL ? 'سائقون بانتظار الاعتماد' : 'Pending Drivers',
      value: metrics.pendingDrivers,
      icon: UserCheck,
      variant: metrics.pendingDrivers > 3 ? 'warning' : 'success',
      path: '/dashboard/driver-approvals',
    },
    {
      label: isRTL ? 'جهات بانتظار الموافقة' : 'Pending Orgs',
      value: metrics.pendingOrgs,
      icon: ShieldAlert,
      variant: metrics.pendingOrgs > 0 ? 'warning' : 'success',
      path: '/dashboard/company-approvals',
    },
    {
      label: isRTL ? 'شحنات نشطة الآن' : 'Active Now',
      value: metrics.activeNow,
      icon: Clock,
      variant: 'success',
      path: '/dashboard/shipments',
    },
  ];

  const hasCritical = metrics.delayedShipments > 0 || metrics.pendingOrgs > 0;

  return (
    <Card className={`border ${hasCritical ? 'border-destructive/30 bg-destructive/5' : 'border-border/40 bg-muted/5'} transition-colors`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          {hasCritical ? (
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
          ) : (
            <TrendingUp className="w-4 h-4 text-primary" />
          )}
          <span className="text-sm font-bold">
            {isRTL ? 'الملخص التنفيذي' : 'Executive Summary'}
          </span>
          {hasCritical && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {isRTL ? 'يتطلب انتباه' : 'Needs Attention'}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                item.variant === 'destructive'
                  ? 'bg-destructive/10 hover:bg-destructive/15'
                  : item.variant === 'warning'
                  ? 'bg-amber-500/10 hover:bg-amber-500/15'
                  : 'bg-primary/5 hover:bg-primary/10'
              }`}
            >
              <item.icon className={`w-5 h-5 ${
                item.variant === 'destructive'
                  ? 'text-destructive'
                  : item.variant === 'warning'
                  ? 'text-amber-500'
                  : 'text-primary'
              }`} />
              <span className="text-xl font-bold">{item.value}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminExecutiveSummary;
