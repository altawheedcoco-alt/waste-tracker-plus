/**
 * FleetUtilizationWidget — استخدام الأسطول
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Activity, Fuel, Route } from 'lucide-react';
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

      const [vehiclesRes, shipmentsRes] = await Promise.all([
        supabase.from('vehicles').select('id, plate_number, is_active, total_trips').eq('organization_id', orgId),
        supabase.from('shipments').select('id, driver_id, status, actual_weight')
          .eq('transporter_id', orgId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const vehicles = vehiclesRes.data || [];
      const shipments = shipmentsRes.data || [];

      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(v => v.is_active).length;
      const utilizationRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
      const avgTripsPerVehicle = totalVehicles > 0
        ? Math.round(vehicles.reduce((s, v) => s + (v.total_trips || 0), 0) / totalVehicles)
        : 0;

      const totalTonnage = Math.round(shipments.reduce((s, sh) => s + (sh.actual_weight || 0), 0) / 1000 * 10) / 10;

      // Group by vehicle activity level
      const chartData = [
        { name: 'نشط جداً', count: vehicles.filter(v => (v.total_trips || 0) > avgTripsPerVehicle * 1.5).length },
        { name: 'نشط', count: vehicles.filter(v => { const t = v.total_trips || 0; return t > avgTripsPerVehicle * 0.5 && t <= avgTripsPerVehicle * 1.5; }).length },
        { name: 'منخفض', count: vehicles.filter(v => { const t = v.total_trips || 0; return t > 0 && t <= avgTripsPerVehicle * 0.5; }).length },
        { name: 'خامل', count: vehicles.filter(v => !v.total_trips || v.total_trips === 0).length },
      ].filter(d => d.count > 0);

      return { totalVehicles, activeVehicles, utilizationRate, avgTripsPerVehicle, totalTonnage, shipmentCount: shipments.length, chartData };
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
                <p className="text-lg font-bold">{data.totalVehicles}</p>
                <p className="text-[9px] text-muted-foreground">مركبة</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.activeVehicles}</p>
                <p className="text-[9px] text-muted-foreground">نشطة</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-lg font-bold">{data.avgTripsPerVehicle}</p>
                <p className="text-[9px] text-muted-foreground">رحلة/مركبة</p>
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="عدد المركبات" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
