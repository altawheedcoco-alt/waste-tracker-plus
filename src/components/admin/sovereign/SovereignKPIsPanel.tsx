import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Building2, Truck, Package, DollarSign, Users, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SovereignKPIsPanel = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['sovereign-kpis'],
    queryFn: async () => {
      const [
        { count: orgCount },
        { count: shipmentCount },
        { count: activeShipments },
        { count: driverCount },
        { count: partnerCount },
        { data: orgTypes },
        { data: recentShipments },
        { count: invoiceCount },
      ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('shipments').select('*', { count: 'exact', head: true }),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).in('status', ['new', 'approved', 'in_transit']),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('partner_links').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('organization_type'),
        supabase.from('shipments').select('status, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
      ]);

      const generators = orgTypes?.filter(o => o.organization_type === 'generator').length || 0;
      const transporters = orgTypes?.filter(o => o.organization_type === 'transporter').length || 0;
      const recyclers = orgTypes?.filter(o => o.organization_type === 'recycler').length || 0;

      const completed = recentShipments?.filter(s => s.status === 'delivered' || s.status === 'confirmed').length || 0;
      const completionRate = recentShipments?.length ? Math.round((completed / recentShipments.length) * 100) : 0;

      // Calculate weekly trend
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
      const thisWeek = recentShipments?.filter(s => new Date(s.created_at) >= weekAgo).length || 0;
      const lastWeek = recentShipments?.filter(s => new Date(s.created_at) >= twoWeeksAgo && new Date(s.created_at) < weekAgo).length || 0;
      const weeklyTrend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;

      return {
        orgCount: orgCount || 0, generators, transporters, recyclers,
        shipmentCount: shipmentCount || 0, activeShipments: activeShipments || 0,
        driverCount: driverCount || 0, partnerCount: partnerCount || 0,
        completionRate, weeklyTrend, invoiceCount: invoiceCount || 0,
        thisWeek, lastWeek,
      };
    },
    refetchInterval: 30_000,
  });

  if (isLoading || !metrics) {
    return <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => (
      <Card key={i}><CardContent className="p-4 h-24 animate-pulse bg-muted/30" /></Card>
    ))}</div>;
  }

  const kpis = [
    { label: 'إجمالي الكيانات', value: metrics.orgCount, icon: Building2, color: 'text-blue-500', sub: `مولد ${metrics.generators} · ناقل ${metrics.transporters} · مدور ${metrics.recyclers}` },
    { label: 'إجمالي الشحنات', value: metrics.shipmentCount, icon: Package, color: 'text-emerald-500', sub: `${metrics.activeShipments} نشطة`, trend: metrics.weeklyTrend },
    { label: 'السائقون', value: metrics.driverCount, icon: Truck, color: 'text-amber-500', sub: 'مسجلون في المنصة' },
    { label: 'الشراكات', value: metrics.partnerCount, icon: Users, color: 'text-purple-500', sub: 'رابط نشط' },
    { label: 'معدل الإتمام', value: `${metrics.completionRate}%`, icon: ShieldCheck, color: metrics.completionRate >= 90 ? 'text-emerald-500' : 'text-amber-500', sub: 'آخر 100 شحنة' },
    { label: 'الفواتير', value: metrics.invoiceCount, icon: DollarSign, color: 'text-primary', sub: 'إجمالي الفواتير' },
    { label: 'هذا الأسبوع', value: metrics.thisWeek, icon: Activity, color: 'text-blue-500', sub: `الأسبوع الماضي: ${metrics.lastWeek}`, trend: metrics.weeklyTrend },
    { label: 'اتجاه النمو', value: `${metrics.weeklyTrend > 0 ? '+' : ''}${metrics.weeklyTrend}%`, icon: BarChart3, color: metrics.weeklyTrend >= 0 ? 'text-emerald-500' : 'text-red-500', sub: 'مقارنة أسبوعية' },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">مؤشرات الأداء السيادية</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                {kpi.trend !== undefined && kpi.trend !== 0 && (
                  <Badge variant="outline" className={`text-[10px] ${kpi.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {kpi.trend > 0 ? <TrendingUp className="w-3 h-3 ml-0.5" /> : <TrendingDown className="w-3 h-3 ml-0.5" />}
                    {Math.abs(kpi.trend)}%
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold">{kpi.value}</div>
                <p className="text-xs font-medium text-foreground/80">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entity Breakdown Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">توزيع الكيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'مولدات النفايات', count: metrics.generators, color: 'bg-blue-500', pct: metrics.orgCount ? Math.round((metrics.generators / metrics.orgCount) * 100) : 0 },
              { label: 'شركات النقل', count: metrics.transporters, color: 'bg-amber-500', pct: metrics.orgCount ? Math.round((metrics.transporters / metrics.orgCount) * 100) : 0 },
              { label: 'مصانع التدوير', count: metrics.recyclers, color: 'bg-emerald-500', pct: metrics.orgCount ? Math.round((metrics.recyclers / metrics.orgCount) * 100) : 0 },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SovereignKPIsPanel;
