/**
 * ٧. تخطيط السعة الذكي — يربط useCapacityPlanner مع واجهة بصرية
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutGrid, Users, Truck, Clock, RefreshCw, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CapacityPlanningDashboard = () => {
  const { organization } = useAuth();
  const [horizon, setHorizon] = useState('30');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const analyze = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const [fleetRes, driversRes, shipmentsRes] = await Promise.all([
        supabase.from('fleet_vehicles').select('id, status, vehicle_type, capacity_tons').eq('organization_id', organization.id),
        supabase.from('drivers').select('id, status').eq('organization_id', organization.id),
        supabase.from('shipments').select('id, status, created_at, quantity')
          .eq('transporter_id', organization.id)
          .gte('created_at', new Date(Date.now() - parseInt(horizon) * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const fleet = fleetRes.data || [];
      const drivers = driversRes.data || [];
      const shipments = shipmentsRes.data || [];

      const activeVehicles = fleet.filter(v => v.status === 'active' || v.status === 'in_use').length;
      const activeDrivers = drivers.filter(d => d.status === 'active').length;
      const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length;

      const vehicleUtil = fleet.length > 0 ? Math.round((activeVehicles / fleet.length) * 100) : 0;
      const driverUtil = drivers.length > 0 ? Math.round((activeDrivers / drivers.length) * 100) : 0;

      const dailyAvg = shipments.length / Math.max(1, parseInt(horizon));
      const peakDay = Math.max(...Array.from({ length: parseInt(horizon) }, (_, i) => {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        return shipments.filter(s => new Date(s.created_at).toDateString() === d.toDateString()).length;
      }));

      // Try AI capacity planning
      try {
        const { data: aiData, error } = await supabase.functions.invoke('ai-capacity-planner', {
          body: {
            organizationId: organization.id,
            horizon: parseInt(horizon),
            resources: {
              vehicles: { total: fleet.length, active: activeVehicles },
              drivers: { total: drivers.length, active: activeDrivers },
            },
            shipmentData: { total: shipments.length, dailyAvg, peakDay },
          }
        });
        if (!error && aiData) {
          setData({ ...aiData, vehicleUtil, driverUtil, activeShipments, dailyAvg, peakDay, fleetTotal: fleet.length, driversTotal: drivers.length });
          setLoading(false);
          return;
        }
      } catch { /* fallback below */ }

      setData({
        vehicleUtil, driverUtil, activeShipments, dailyAvg: Math.round(dailyAvg * 10) / 10,
        peakDay, fleetTotal: fleet.length, driversTotal: drivers.length,
        recommendations: [
          vehicleUtil > 85 ? { text: 'استغلال الأسطول عالي — فكر في إضافة مركبات', priority: 'high' } : null,
          driverUtil > 90 ? { text: 'حمل السائقين مرتفع — يُنصح بتوظيف سائقين إضافيين', priority: 'high' } : null,
          vehicleUtil < 40 ? { text: 'استغلال منخفض — يمكن تقليص عدد المركبات', priority: 'medium' } : null,
        ].filter(Boolean),
      });
    } catch (err) {
      console.error('Capacity error:', err);
      toast.error('خطأ في تحليل السعة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { analyze(); }, [organization?.id, horizon]);

  const getUtilColor = (val: number) => {
    if (val >= 85) return 'text-destructive';
    if (val >= 60) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            تخطيط السعة الذكي
          </CardTitle>
          <div className="flex gap-2">
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">٧ أيام</SelectItem>
                <SelectItem value="30">٣٠ يوم</SelectItem>
                <SelectItem value="90">٩٠ يوم</SelectItem>
                <SelectItem value="365">سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={analyze} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground animate-pulse py-4">جاري تحليل السعة...</p>
        ) : data ? (
          <>
            {/* Utilization Meters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">المركبات</span>
                </div>
                <Progress value={data.vehicleUtil} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className={getUtilColor(data.vehicleUtil)}>{data.vehicleUtil}%</span>
                  <span className="text-muted-foreground">{data.fleetTotal} إجمالي</span>
                </div>
              </div>
              <div className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">السائقين</span>
                </div>
                <Progress value={data.driverUtil} className="h-2" />
                <div className="flex justify-between text-xs">
                  <span className={getUtilColor(data.driverUtil)}>{data.driverUtil}%</span>
                  <span className="text-muted-foreground">{data.driversTotal} إجمالي</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold">{data.dailyAvg}</p>
                <p className="text-[10px] text-muted-foreground">شحنة/يوم</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold">{data.peakDay}</p>
                <p className="text-[10px] text-muted-foreground">أقصى ذروة</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-lg font-bold">{data.activeShipments}</p>
                <p className="text-[10px] text-muted-foreground">نشطة حالياً</p>
              </div>
            </div>

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <div className="space-y-2">
                {data.recommendations.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded text-xs">
                    <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد بيانات كافية</p>
        )}
      </CardContent>
    </Card>
  );
};

export default CapacityPlanningDashboard;
