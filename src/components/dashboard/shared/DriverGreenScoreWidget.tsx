import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, Fuel, Route, Timer, TrendingUp, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DriverGreenScoreWidget: React.FC = () => {
  const { profile } = useAuth();

  const { data: metrics } = useQuery({
    queryKey: ['driver-green-score', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      // Get driver
      const { data: driver } = await supabase
        .from('drivers')
        .select('id, organization_id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (!driver) return null;

      // Get completed shipments this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, quantity, unit, waste_type, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, created_at, delivered_at')
        .eq('driver_id', driver.id)
        .in('status', ['delivered', 'confirmed'])
        .gte('delivered_at', monthStart.toISOString());

      if (!shipments || shipments.length === 0) {
        return {
          totalDeliveries: 0,
          totalDistanceKm: 0,
          totalTonsRecycled: 0,
          co2SavedKg: 0,
          avgDeliveryTimeMin: 0,
          greenScore: 0,
          badge: 'يحتاج تحسين ⚠️',
        };
      }

      // Calculate metrics
      let totalDistanceKm = 0;
      let totalTons = 0;
      let totalDeliveryMin = 0;
      let validTimes = 0;

      for (const s of shipments) {
        const qty = Number(s.quantity) || 0;
        const tons = (s.unit === 'كجم' || s.unit === 'kg' || !s.unit) ? qty / 1000 : qty;
        totalTons += tons;

        if (s.pickup_latitude && s.delivery_latitude) {
          const R = 6371;
          const dLat = ((s.delivery_latitude - s.pickup_latitude) * Math.PI) / 180;
          const dLon = ((s.delivery_longitude! - s.pickup_longitude!) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((s.pickup_latitude * Math.PI) / 180) *
            Math.cos((s.delivery_latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
          totalDistanceKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
        }

        if (s.created_at && s.delivered_at) {
          const diff = (new Date(s.delivered_at).getTime() - new Date(s.created_at).getTime()) / 60000;
          if (diff > 0 && diff < 1440) {
            totalDeliveryMin += diff;
            validTimes++;
          }
        }
      }

      const co2SavedKg = totalTons * 1.2 * 1000; // avg recycling savings
      const avgDeliveryTimeMin = validTimes > 0 ? Math.round(totalDeliveryMin / validTimes) : 0;

      // Green score: 0-100
      const deliveryScore = Math.min(shipments.length * 5, 30); // max 30
      const tonsScore = Math.min(totalTons * 20, 30); // max 30
      const efficiencyScore = avgDeliveryTimeMin > 0 ? Math.min(30, Math.max(0, 30 - (avgDeliveryTimeMin / 60) * 5)) : 15;
      const co2Score = Math.min(co2SavedKg / 100, 10); // max 10
      const greenScore = Math.round(deliveryScore + tonsScore + efficiencyScore + co2Score);

      let badge = 'يحتاج تحسين ⚠️';
      if (greenScore >= 90) badge = 'بطل النقل الأخضر 🏆';
      else if (greenScore >= 75) badge = 'ناقل أخضر معتمد ✅';
      else if (greenScore >= 50) badge = 'في طريقه للاعتماد 📈';

      return {
        totalDeliveries: shipments.length,
        totalDistanceKm: Math.round(totalDistanceKm),
        totalTonsRecycled: Math.round(totalTons * 100) / 100,
        co2SavedKg: Math.round(co2SavedKg),
        avgDeliveryTimeMin,
        greenScore,
        badge,
      };
    },
    enabled: !!profile?.id,
  });

  if (!metrics) return null;

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-emerald-700 border-emerald-300">
            {metrics.badge}
          </Badge>
          <div className="flex items-center gap-1.5">
            <span>النقاط الخضراء</span>
            <Leaf className="h-4 w-4 text-emerald-600" />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-3">
        {/* Green Score */}
        <div className="text-center py-1">
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
            {metrics.greenScore}
          </div>
          <p className="text-xs text-muted-foreground">درجة الأداء الأخضر</p>
          <Progress value={metrics.greenScore} className="h-2 mt-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <MiniStat icon={<Route className="w-3.5 h-3.5 text-blue-500" />} value={metrics.totalDeliveries} label="تسليم" />
          <MiniStat icon={<Fuel className="w-3.5 h-3.5 text-orange-500" />} value={`${metrics.totalDistanceKm} كم`} label="مسافة" />
          <MiniStat icon={<Leaf className="w-3.5 h-3.5 text-emerald-500" />} value={`${metrics.co2SavedKg} كجم`} label="CO₂ وُفّر" />
          <MiniStat icon={<Timer className="w-3.5 h-3.5 text-purple-500" />} value={`${metrics.avgDeliveryTimeMin} د`} label="متوسط التسليم" />
        </div>
      </CardContent>
    </Card>
  );
};

const MiniStat = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <div className="bg-background/60 rounded-lg p-2 border border-emerald-100 dark:border-emerald-900/50 text-center">
    <div className="flex justify-center mb-0.5">{icon}</div>
    <div className="text-sm font-bold">{value}</div>
    <p className="text-[8px] text-muted-foreground">{label}</p>
  </div>
);

export default DriverGreenScoreWidget;
