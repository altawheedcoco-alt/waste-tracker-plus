import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Target, Zap, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';

const TransporterDailyPulse = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['transporter-daily-pulse', organization?.id];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [weekResult, todayResult] = await Promise.all([
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', weekAgo.toISOString()),
        supabase.from('shipments').select('status, quantity').eq('transporter_id', organization!.id).gte('created_at', today.toISOString()),
      ]);

      const weekData = weekResult.data || [];
      const todayData = todayResult.data || [];
      const avgDaily = weekData.length > 0 ? Math.round(weekData.length / 7) : 0;
      const todayVsAvg = avgDaily > 0 ? Math.round(((todayData.length - avgDaily) / avgDaily) * 100) : 0;

      const totalQty = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const weekQty = weekData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const avgQty = weekData.length > 0 ? Math.round(weekQty / 7) : 0;

      const delivered = todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length;
      const healthScore = todayData.length > 0 ? Math.round((delivered / todayData.length) * 100) : 100;

      return {
        todayTrips: todayData.length,
        avgDaily,
        todayVsAvg,
        totalQty,
        avgQty,
        healthScore,
        weekTotal: weekData.length,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  // Realtime: invalidate on shipment changes
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('daily-pulse-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  if (isLoading || !data) return null;

  const pulseItems = [
    {
      label: 'أداء اليوم',
      value: `${data.todayVsAvg > 0 ? '+' : ''}${data.todayVsAvg}%`,
      desc: `${data.todayTrips} رحلة مقابل ${data.avgDaily} متوسط`,
      icon: data.todayVsAvg > 0 ? ArrowUpRight : data.todayVsAvg < 0 ? ArrowDownRight : Minus,
      color: data.todayVsAvg >= 0 ? 'text-emerald-400' : 'text-red-400',
      bg: data.todayVsAvg >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      label: 'مؤشر الصحة',
      value: `${data.healthScore}%`,
      desc: 'نسبة التسليم الناجح',
      icon: Target,
      color: data.healthScore >= 70 ? 'text-cyan-400' : 'text-amber-400',
      bg: data.healthScore >= 70 ? 'bg-cyan-500/10' : 'bg-amber-500/10',
    },
    {
      label: 'الحجم الأسبوعي',
      value: data.weekTotal.toString(),
      desc: `${data.totalQty.toLocaleString('ar-SA')} طن اليوم`,
      icon: BarChart3,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="border border-border/50 bg-card backdrop-blur-sm overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        <CardContent className="p-3 sm:p-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
              <Sparkles className="w-3 h-3" />
              تحليل مباشر
            </Badge>
            <div className="flex items-center gap-1.5 text-right">
              <span className="text-xs font-semibold text-foreground">النبض اليومي</span>
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {pulseItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: 'spring' }}
                className={`${item.bg} rounded-xl p-3 border border-border/30 text-right`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
                <p className={`text-xl sm:text-2xl font-black ${item.color} tabular-nums`}>{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransporterDailyPulse;
