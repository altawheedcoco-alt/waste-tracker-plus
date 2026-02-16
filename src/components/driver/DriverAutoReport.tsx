import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Download, CheckCircle2, Clock, Truck,
  Route, Fuel, Star, TrendingUp, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const DriverAutoReport = () => {
  const { profile } = useAuth();

  const { data: reportData } = useQuery({
    queryKey: ['driver-auto-report', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data: driver } = await supabase
        .from('drivers').select('id').eq('profile_id', profile.id).single();
      if (!driver) return null;

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get today's shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, quantity, waste_type, created_at, delivered_at, in_transit_at')
        .eq('driver_id', driver.id);

      const todayDelivered = shipments?.filter(s => s.delivered_at?.startsWith(todayStr)) || [];
      const totalWeight = todayDelivered.reduce((sum, s) => sum + (s.quantity || 0), 0);

      const deliveryTimes = todayDelivered
        .filter(s => s.in_transit_at && s.delivered_at)
        .map(s => {
          const start = new Date(s.in_transit_at!).getTime();
          const end = new Date(s.delivered_at!).getTime();
          return (end - start) / (1000 * 60);
        });
      const avgTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

      const onTime = deliveryTimes.filter(t => t < 120).length; // < 2 hours
      const estimatedKm = todayDelivered.length * 35;
      const fuelSaved = Math.round(estimatedKm * 0.08);
      
      const score = Math.min(100, Math.round(
        (todayDelivered.length > 0 ? 40 : 0) +
        (onTime / Math.max(1, todayDelivered.length)) * 30 +
        Math.min(30, todayDelivered.length * 6)
      ));

      // Get weekly data
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekDelivered = shipments?.filter(s => 
        s.delivered_at && new Date(s.delivered_at) >= weekAgo
      ) || [];

      const weeklyAvg = weekDelivered.length / 7;

      // Generate summary text
      const hour = today.getHours();
      let greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';
      let summary = `${greeting}! `;
      if (todayDelivered.length === 0) {
        summary += 'لم يتم تسجيل تسليمات اليوم بعد. ';
      } else {
        summary += `أنجزت ${todayDelivered.length} رحلة بإجمالي ${totalWeight.toFixed(1)} طن. `;
        if (onTime === todayDelivered.length) {
          summary += 'جميع التسليمات في الوقت! ممتاز 🌟 ';
        }
        if (todayDelivered.length > weeklyAvg) {
          summary += `أداؤك اليوم أعلى من المتوسط الأسبوعي (${weeklyAvg.toFixed(1)} رحلة/يوم) 📈`;
        }
      }

      return {
        date: todayStr,
        deliveries: todayDelivered.length,
        totalWeight,
        avgTime: Math.round(avgTime),
        onTime,
        estimatedKm,
        fuelSaved,
        score,
        weeklyAvg: weeklyAvg.toFixed(1),
        weekDeliveries: weekDelivered.length,
        summary,
        driverId: driver.id,
      };
    },
    enabled: !!profile?.id,
  });

  const stats = useMemo(() => {
    if (!reportData) return [];
    return [
      { icon: CheckCircle2, label: 'التسليمات', value: reportData.deliveries, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { icon: Truck, label: 'طن منقول', value: reportData.totalWeight.toFixed(1), color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { icon: Clock, label: 'متوسط الوقت', value: `${reportData.avgTime} د`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { icon: Route, label: 'كم مقطوعة', value: reportData.estimatedKm, color: 'text-primary', bg: 'bg-primary/10' },
      { icon: Star, label: 'في الوقت', value: reportData.onTime, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
      { icon: Fuel, label: 'لتر وقود وُفر', value: reportData.fuelSaved, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];
  }, [reportData]);

  if (!reportData) return null;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-primary" />
            تقرير اليوم التلقائي
            <Badge variant="outline" className="text-[10px] mr-auto">
              <Calendar className="w-3 h-3 ml-1" />
              {new Date().toLocaleDateString('ar-SA')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Performance Score */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{reportData.score}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">نقاط الأداء اليومي</p>
              <p className="text-xs text-muted-foreground">{reportData.summary}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="text-center p-2.5 rounded-lg bg-card border"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-1.5`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-base font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Week Comparison */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">مقارنة أسبوعية</span>
            </div>
            <p className="text-xs text-muted-foreground">
              الأسبوع الماضي: {reportData.weekDeliveries} رحلة (متوسط {reportData.weeklyAvg} يومياً)
              {reportData.deliveries > parseFloat(reportData.weeklyAvg) && ' — أداء اليوم أعلى من المتوسط! 📈'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverAutoReport;
