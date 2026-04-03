/**
 * FleetUtilizationWidget — استخدام الأسطول
 * يحلل نشاط السائقين كمؤشر لاستخدام الأسطول
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function FleetUtilizationWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-utilization', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('driver_id, status, actual_weight')
        .eq('transporter_id', orgId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('driver_id', 'is', null);

      const driverTrips = new Map<string, number>();
      let totalWeight = 0;

      (shipments || []).forEach(s => {
        if (s.driver_id) {
          driverTrips.set(s.driver_id, (driverTrips.get(s.driver_id) || 0) + 1);
        }
        totalWeight += s.actual_weight || 0;
      });

      const totalDrivers = driverTrips.size;
      const totalTrips = shipments?.length || 0;
      const avgTrips = totalDrivers > 0 ? Math.round(totalTrips / totalDrivers) : 0;

      // Activity buckets
      const trips = Array.from(driverTrips.values());
      const chartData = [
        { name: 'نشط جداً', count: trips.filter(t => t > avgTrips * 1.5).length },
        { name: 'نشط', count: trips.filter(t => t > avgTrips * 0.5 && t <= avgTrips * 1.5).length },
        { name: 'منخفض', count: trips.filter(t => t > 0 && t <= avgTrips * 0.5).length },
      ].filter(d => d.count > 0);

      const utilizationRate = totalDrivers > 0 ? Math.round((trips.filter(t => t >= avgTrips * 0.5).length / totalDrivers) * 100) : 0;

      return { totalDrivers, totalTrips, avgTrips, totalTonnage: Math.round(totalWeight / 1000 * 10) / 10, utilizationRate, chartData };
    },
    enabled: !!orgId,
    staleTime: 15 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-primary" />
            استخدام الأسطول
          </CardTitle>
          {data && (
            <Badge variant={data.utilizationRate >= 70 ? 'default' : 'secondary'} className="gap-1 text-xs">
              <Activity className="h-3 w-3" />
              {data.utilizationRate}% استخدام
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data ? (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.totalDrivers}</p>
                <p className="text-[9px] text-muted-foreground">سائق</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.totalTrips}</p>
                <p className="text-[9px] text-muted-foreground">رحلة</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.avgTrips}</p>
                <p className="text-[9px] text-muted-foreground">رحلة/سائق</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.totalTonnage}</p>
                <p className="text-[9px] text-muted-foreground">طن</p>
              </div>
            </div>
            {data.chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="عدد السائقين" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
