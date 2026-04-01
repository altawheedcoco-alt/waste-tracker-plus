/**
 * بطاقة الملخص السيادي — نظرة عامة سريعة على حالة المنصة
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, Users, Package, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SovereignOverviewCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['sovereign-overview'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      const [
        { count: totalOrgs },
        { count: activeShipments },
        { count: todayShipments },
        { count: pendingOrgs },
        { count: unverifiedDrivers },
        { count: weekShipments },
        unresolvedAlerts,
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).in('status', ['new', 'approved', 'in_transit', 'collecting']),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
        (supabase.from('organizations').select('*', { count: 'exact', head: true }) as any).eq('status', 'pending'),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('early_warning_alerts').select('id, severity', { count: 'exact', head: false }).eq('is_resolved', false),
      ]);

      const criticalCount = (unresolvedAlerts.data || []).filter((a: any) => a.severity === 'critical' || a.severity === 'emergency').length;
      const pendingActions = (pendingOrgs || 0) + (unverifiedDrivers || 0);

      return {
        totalOrgs: totalOrgs || 0,
        activeShipments: activeShipments || 0,
        todayShipments: todayShipments || 0,
        weekShipments: weekShipments || 0,
        criticalAlerts: criticalCount,
        pendingActions,
        healthScore: criticalCount === 0 && pendingActions < 5 ? 'excellent' : criticalCount > 0 ? 'warning' : 'good',
      };
    },
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />;
  }

  const healthConfig = {
    excellent: { label: 'ممتاز', color: 'text-emerald-500', bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20' },
    good: { label: 'جيد', color: 'text-blue-500', bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20' },
    warning: { label: 'يحتاج اهتمام', color: 'text-amber-500', bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20' },
  };

  const health = healthConfig[data.healthScore];

  return (
    <Card className={`bg-gradient-to-l ${health.bg} ${health.border} border`}>
      <CardContent className="p-3">
        {/* Top Row: Health Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${health.color}`} />
            <span className="text-xs font-bold">حالة المنصة</span>
          </div>
          <Badge variant="outline" className={`text-[10px] ${health.color}`}>
            {data.criticalAlerts > 0 ? (
              <AlertTriangle className="w-3 h-3 ml-1" />
            ) : (
              <CheckCircle2 className="w-3 h-3 ml-1" />
            )}
            {health.label}
          </Badge>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <Building2 className="w-3.5 h-3.5 mx-auto text-blue-500 mb-0.5" />
            <div className="text-sm font-bold">{data.totalOrgs}</div>
            <p className="text-[9px] text-muted-foreground">كيان</p>
          </div>
          <div className="text-center">
            <Package className="w-3.5 h-3.5 mx-auto text-emerald-500 mb-0.5" />
            <div className="text-sm font-bold">{data.activeShipments}</div>
            <p className="text-[9px] text-muted-foreground">شحنة نشطة</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-3.5 h-3.5 mx-auto text-purple-500 mb-0.5" />
            <div className="text-sm font-bold">{data.todayShipments}</div>
            <p className="text-[9px] text-muted-foreground">اليوم</p>
          </div>
          <div className="text-center">
            {data.pendingActions > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 mx-auto text-amber-500 mb-0.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-emerald-500 mb-0.5" />
            )}
            <div className="text-sm font-bold">{data.pendingActions}</div>
            <p className="text-[9px] text-muted-foreground">بانتظار</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SovereignOverviewCard;
