/**
 * ٦. تحليل تكلفة الرحلة — بيانات حية من trip_costs + fuel_records
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Fuel, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#ef4444'];

const TripCostAnalytics = () => {
  const { organization } = useAuth();
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCosts = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [tripsRes, fuelRes, shipmentsRes] = await Promise.all([
        supabase.from('trip_costs').select('*').eq('organization_id', organization.id).gte('created_at', monthAgo),
        supabase.from('fuel_records').select('*').eq('organization_id', organization.id).gte('created_at', monthAgo),
        supabase.from('shipments').select('id, status, quantity, created_at')
          .eq('transporter_id', organization.id).gte('created_at', monthAgo),
      ]);

      const trips = tripsRes.data || [];
      const fuel = fuelRes.data || [];
      const shipments = shipmentsRes.data || [];

      const totalFuelCost = fuel.reduce((a, f) => a + (f.total_cost || 0), 0);
      const totalTripCost = trips.reduce((a, t) => a + (t.total_cost || 0), 0);
      const totalDistance = trips.reduce((a, t) => a + (t.distance_km || 0), 0);
      const costPerKm = totalDistance > 0 ? totalTripCost / totalDistance : 0;
      const totalLiters = fuel.reduce((a, f) => a + (f.quantity_liters || 0), 0);
      const avgConsumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;

      // Cost breakdown by category
      const breakdown = [
        { name: 'الوقود', value: totalFuelCost },
        { name: 'رسوم الطريق', value: trips.reduce((a, t) => a + (t.toll_fees || 0), 0) },
        { name: 'صيانة', value: trips.reduce((a, t) => a + (t.maintenance_cost || 0), 0) },
        { name: 'أخرى', value: trips.reduce((a, t) => a + (t.other_costs || 0), 0) },
      ].filter(b => b.value > 0);

      // Daily trend
      const dailyMap = new Map<string, number>();
      trips.forEach(t => {
        const day = (t.trip_date || t.created_at)?.split('T')[0];
        if (day) dailyMap.set(day, (dailyMap.get(day) || 0) + (t.total_cost || 0));
      });
      const dailyTrend = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, cost]) => ({
          date: date.slice(5),
          تكلفة: Math.round(cost),
        }));

      setCostData({
        totalFuelCost, totalTripCost, totalDistance, costPerKm, avgConsumption,
        breakdown, dailyTrend, totalTrips: trips.length, totalShipments: shipments.length,
      });
    } catch (err) {
      console.error('Cost analytics error:', err);
      toast.error('خطأ في تحليل التكاليف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCosts(); }, [organization?.id]);

  if (loading) return (
    <Card><CardContent className="p-6"><p className="text-center text-sm text-muted-foreground animate-pulse">جاري تحليل التكاليف...</p></CardContent></Card>
  );

  if (!costData) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            تحليل تكاليف الرحلات
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchCosts}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'التكلفة/كم', value: `${costData.costPerKm.toFixed(1)} ج.م`, icon: TrendingUp },
            { label: 'إجمالي الوقود', value: `${Math.round(costData.totalFuelCost)} ج.م`, icon: Fuel },
            { label: 'المسافة', value: `${Math.round(costData.totalDistance)} كم`, icon: TrendingUp },
            { label: 'استهلاك/100كم', value: `${costData.avgConsumption.toFixed(1)} لتر`, icon: AlertCircle },
          ].map((item, i) => (
            <div key={i} className="p-2 bg-muted/50 rounded-lg text-center">
              <item.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Daily Trend */}
        {costData.dailyTrend.length > 0 && (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="تكلفة" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cost Breakdown */}
        {costData.breakdown.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="h-[100px] w-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costData.breakdown} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={25}>
                    {costData.breakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {costData.breakdown.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{b.name}</span>
                  </div>
                  <span className="font-medium">{Math.round(b.value)} ج.م</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripCostAnalytics;
