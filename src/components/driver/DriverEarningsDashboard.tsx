import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar,
  Truck, Target, ArrowUpRight, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const DriverEarningsDashboard = () => {
  const { profile } = useAuth();

  const { data: earnings } = useQuery({
    queryKey: ['driver-earnings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data: driver } = await supabase
        .from('drivers').select('id').eq('profile_id', profile.id).single();
      if (!driver) return null;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, quantity, delivered_at, created_at')
        .eq('driver_id', driver.id);

      if (!shipments) return null;

      const delivered = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));
      const todayDelivered = delivered.filter(s => s.delivered_at?.startsWith(todayStr));
      const weekDelivered = delivered.filter(s => s.delivered_at && new Date(s.delivered_at) >= weekAgo);
      const monthDelivered = delivered.filter(s => s.delivered_at && new Date(s.delivered_at) >= monthStart);

      // Estimate earnings (per-trip + per-ton)
      const RATE_PER_TRIP = 150; // SAR per trip base
      const RATE_PER_TON = 25; // SAR per ton bonus

      const calcEarnings = (list: typeof delivered) =>
        list.reduce((sum, s) => sum + RATE_PER_TRIP + (s.quantity || 0) * RATE_PER_TON, 0);

      const todayEarnings = calcEarnings(todayDelivered);
      const weekEarnings = calcEarnings(weekDelivered);
      const monthEarnings = calcEarnings(monthDelivered);
      const totalEarnings = calcEarnings(delivered);

      // Projection
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const projectedMonth = dayOfMonth > 0 ? (monthEarnings / dayOfMonth) * daysInMonth : 0;

      // Week over week comparison
      const prevWeekStart = new Date(weekAgo); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekDelivered = delivered.filter(s =>
        s.delivered_at && new Date(s.delivered_at) >= prevWeekStart && new Date(s.delivered_at) < weekAgo
      );
      const prevWeekEarnings = calcEarnings(prevWeekDelivered);
      const weekGrowth = prevWeekEarnings > 0 ? ((weekEarnings - prevWeekEarnings) / prevWeekEarnings) * 100 : 0;

      return {
        today: todayEarnings,
        todayTrips: todayDelivered.length,
        week: weekEarnings,
        weekTrips: weekDelivered.length,
        month: monthEarnings,
        monthTrips: monthDelivered.length,
        total: totalEarnings,
        totalTrips: delivered.length,
        projected: Math.round(projectedMonth),
        weekGrowth: Math.round(weekGrowth),
      };
    },
    enabled: !!profile?.id,
  });

  if (!earnings) return null;

  const periods = [
    { label: 'اليوم', amount: earnings.today, trips: earnings.todayTrips, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'الأسبوع', amount: earnings.week, trips: earnings.weekTrips, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'الشهر', amount: earnings.month, trips: earnings.monthTrips, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Earnings Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-primary" />
            لوحة الأرباح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <motion.p
              className="text-4xl font-bold text-primary"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              {earnings.month.toLocaleString('ar-SA')}
            </motion.p>
            <p className="text-sm text-muted-foreground">ريال هذا الشهر</p>
          </div>

          {/* Projected */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">التوقع الشهري</span>
            </div>
            <div className="text-left">
              <span className="font-bold">{earnings.projected.toLocaleString('ar-SA')}</span>
              <span className="text-xs text-muted-foreground mr-1">ريال</span>
            </div>
          </div>

          {/* Week Growth */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${
            earnings.weekGrowth >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'
          }`}>
            <div className="flex items-center gap-2">
              {earnings.weekGrowth >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span className="text-sm font-medium">نمو أسبوعي</span>
            </div>
            <Badge variant={earnings.weekGrowth >= 0 ? 'default' : 'destructive'} className="text-xs">
              {earnings.weekGrowth >= 0 ? '+' : ''}{earnings.weekGrowth}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Period Cards */}
      <div className="grid grid-cols-3 gap-3">
        {periods.map((period, idx) => (
          <motion.div
            key={period.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className={`w-9 h-9 rounded-lg ${period.bg} flex items-center justify-center mx-auto mb-2`}>
                  <period.icon className={`w-4 h-4 ${period.color}`} />
                </div>
                <p className="text-base font-bold">{period.amount.toLocaleString('ar-SA')}</p>
                <p className="text-[10px] text-muted-foreground">{period.label}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Truck className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{period.trips} رحلة</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">الإجمالي الكلي</p>
                <p className="text-[10px] text-muted-foreground">{earnings.totalTrips} رحلة مكتملة</p>
              </div>
            </div>
            <p className="text-lg font-bold text-primary">{earnings.total.toLocaleString('ar-SA')} <span className="text-xs text-muted-foreground">ريال</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverEarningsDashboard;
