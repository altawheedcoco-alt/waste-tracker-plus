import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Truck, CheckCircle2, Users, Route, Gauge, Zap, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

const TransporterCommandCenter = () => {
  const { organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['transporter-command-center', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayResult = await supabase
        .from('shipments')
        .select('status, quantity, created_at')
        .eq('transporter_id', organization!.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const yesterdayResult = await supabase
        .from('shipments')
        .select('id')
        .eq('transporter_id', organization!.id)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      const activeResult = await supabase
        .from('shipments')
        .select('id')
        .eq('transporter_id', organization!.id)
        .in('status', ['in_transit', 'approved']);

      const driversResult = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', organization!.id);

      const todayData = todayResult.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

      return {
        todayTrips: todayData.length,
        yesterdayTrips: yesterdayResult.data?.length || 0,
        activeShipments: activeResult.data?.length || 0,
        todayDelivered: todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length,
        activeDrivers: driversResult.data?.length || 0,
        todayQuantity,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-white/10 rounded w-1/3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = stats ? stats.todayTrips - stats.yesterdayTrips : 0;
  const trendPercent = stats?.yesterdayTrips
    ? Math.round((trend / stats.yesterdayTrips) * 100)
    : 0;

  const metrics = [
    {
      label: 'رحلات اليوم',
      value: stats?.todayTrips || 0,
      icon: Truck,
      gradient: 'from-blue-500 to-cyan-400',
      glow: 'shadow-blue-500/25',
      ring: 'ring-blue-400/20',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'شحنات نشطة',
      value: stats?.activeShipments || 0,
      icon: Route,
      gradient: 'from-amber-500 to-orange-400',
      glow: 'shadow-amber-500/25',
      ring: 'ring-amber-400/20',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'تم التسليم',
      value: stats?.todayDelivered || 0,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-400',
      glow: 'shadow-emerald-500/25',
      ring: 'ring-emerald-400/20',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'السائقين',
      value: stats?.activeDrivers || 0,
      icon: Users,
      gradient: 'from-violet-500 to-purple-400',
      glow: 'shadow-violet-500/25',
      ring: 'ring-violet-400/20',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-cyan-500/3 rounded-full blur-3xl" />
        </div>

        <CardContent className="p-4 sm:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {trend >= 0 ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                  <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 backdrop-blur-sm">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
                  </Badge>
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                  <Badge className="gap-1.5 bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20 backdrop-blur-sm">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {trendPercent}%
                  </Badge>
                </motion.div>
              )}
              <span className="text-xs text-slate-400 hidden sm:inline">
                مقارنة بالأمس
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 justify-end">
                  مركز القيادة
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Gauge className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                </h2>
                <p className="text-xs text-slate-400">
                  {format(new Date(), 'EEEE d MMMM yyyy', { locale: ar })}
                </p>
              </div>
              <motion.div
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {metrics.map((m, index) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.4, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`relative group rounded-2xl border border-white/[0.06] ${m.bg} backdrop-blur-sm p-4 ring-1 ${m.ring} transition-all duration-300 hover:shadow-xl ${m.glow} cursor-default`}
              >
                {/* Icon */}
                <div className="flex items-center justify-between mb-3">
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Zap className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg ${m.glow}`}>
                    <m.icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <motion.p
                    className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    {m.value}
                  </motion.p>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">{m.label}</p>
                </div>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
              </motion.div>
            ))}
          </div>

          {/* Bottom bar */}
          {stats && stats.todayQuantity > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 bg-white/[0.03] rounded-xl py-2.5 px-4 border border-white/[0.04]"
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span>إجمالي الكمية اليوم:</span>
              <span className="font-bold text-white">{stats.todayQuantity.toLocaleString('ar-SA')}</span>
              <span>طن</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransporterCommandCenter;
