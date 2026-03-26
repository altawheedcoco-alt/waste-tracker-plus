/**
 * ١. لوحة KPI مركزية ذكية — بيانات حية من قاعدة البيانات
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Truck, Clock, DollarSign, Star, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';

interface KPIData {
  onTimeRate: number;
  fleetUtilization: number;
  costPerKm: number;
  customerSatisfaction: number;
  totalShipments: number;
  activeShipments: number;
  avgDeliveryHours: number;
  weeklyTrend: { day: string; shipments: number; onTime: number }[];
  alerts: string[];
}

const TransporterSmartKPIs = () => {
  const { organization } = useAuth();
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKPIs = async () => {
    if (!organization?.id) return;
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [shipmentsRes, fleetRes, ratingsRes] = await Promise.all([
        supabase.from('shipments').select('id, status, created_at, delivered_at, expected_delivery_date, in_transit_at')
          .eq('transporter_id', organization.id).gte('created_at', monthAgo.toISOString()),
        supabase.from('fleet_vehicles').select('id, status').eq('organization_id', organization.id),
        supabase.from('partner_ratings').select('overall_rating').eq('rated_organization_id', organization.id).gte('created_at', monthAgo.toISOString()),

      const shipments = shipmentsRes.data || [];
      const fleet = fleetRes.data || [];
      const ratings = ratingsRes.data || [];

      const delivered = shipments.filter(s => s.status === 'delivered' || s.status === 'confirmed');
      const onTime = delivered.filter(s => {
        if (!s.delivered_at || !s.expected_delivery_date) return true;
        return new Date(s.delivered_at) <= new Date(s.expected_delivery_date);
      });
      const onTimeRate = delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 100;

      const activeVehicles = fleet.filter(v => v.status === 'active' || v.status === 'in_use').length;
      const fleetUtilization = fleet.length > 0 ? Math.round((activeVehicles / fleet.length) * 100) : 0;

      const avgRating = ratings.length > 0 ? ratings.reduce((a, r) => a + (r.rating || 0), 0) / ratings.length : 0;

      const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length;

      // Weekly trend
      const weeklyTrend: { day: string; shipments: number; onTime: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString('ar-EG', { weekday: 'short' });
        const dayShipments = shipments.filter(s => {
          const sd = new Date(s.created_at);
          return sd.toDateString() === d.toDateString();
        });
        weeklyTrend.push({
          day: dayStr,
          shipments: dayShipments.length,
          onTime: dayShipments.filter(s => s.status === 'delivered' || s.status === 'confirmed').length,
        });
      }

      const alerts: string[] = [];
      if (onTimeRate < 80) alerts.push('⚠️ معدل التسليم في الوقت انخفض عن 80%');
      if (fleetUtilization < 50) alerts.push('🚛 استغلال الأسطول أقل من 50%');
      if (activeShipments > 20) alerts.push('📦 حمولة عمل عالية: أكثر من 20 شحنة نشطة');

      setData({
        onTimeRate,
        fleetUtilization,
        costPerKm: 0,
        customerSatisfaction: Math.round(avgRating * 10) / 10,
        totalShipments: shipments.length,
        activeShipments,
        avgDeliveryHours: 0,
        weeklyTrend,
        alerts,
      });
    } catch (err) {
      console.error('KPI fetch error:', err);
      toast.error('خطأ في تحميل مؤشرات الأداء');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchKPIs(); }, [organization?.id]);

  const handleRefresh = () => { setRefreshing(true); fetchKPIs(); };

  const getTrendIcon = (val: number, threshold: number) => {
    if (val >= threshold) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (val >= threshold * 0.7) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
    </div>
  );

  if (!data) return null;

  const kpis = [
    { label: 'التسليم بالوقت', value: `${data.onTimeRate}%`, icon: Clock, color: 'text-emerald-600', threshold: 85 },
    { label: 'استغلال الأسطول', value: `${data.fleetUtilization}%`, icon: Truck, color: 'text-blue-600', threshold: 70 },
    { label: 'شحنات نشطة', value: data.activeShipments.toString(), icon: DollarSign, color: 'text-amber-600', threshold: 0 },
    { label: 'رضا العملاء', value: data.customerSatisfaction > 0 ? `${data.customerSatisfaction}/5` : 'لا يوجد', icon: Star, color: 'text-purple-600', threshold: 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          مركز مؤشرات الأداء الذكي
        </h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ml-1 ${refreshing ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                {kpi.threshold > 0 && getTrendIcon(parseFloat(kpi.value), kpi.threshold)}
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sparkline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">اتجاه الشحنات — آخر ٧ أيام</CardTitle>
        </CardHeader>
        <CardContent className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weeklyTrend}>
              <defs>
                <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip formatter={(v: number) => [v, 'شحنات']} labelFormatter={(l) => l} />
              <Area type="monotone" dataKey="shipments" stroke="hsl(var(--primary))" fill="url(#kpiGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">تنبيهات الأداء</span>
            </div>
            {data.alerts.map((alert, i) => (
              <p key={i} className="text-xs text-muted-foreground">{alert}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransporterSmartKPIs;
