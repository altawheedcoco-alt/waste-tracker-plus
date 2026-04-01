/**
 * HeroMetricsGrid — البطاقات الأربع الرئيسية لمركز القيادة
 */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, Route, CheckCircle2, Users, LucideIcon } from 'lucide-react';
import MiniSparkline from './MiniSparkline';

interface HeroMetric {
  label: string;
  value: number | string;
  raw: number;
  icon: LucideIcon;
  gradient: string;
  color: string;
  sub: string;
  sparkData?: number[] | null;
  route: string;
}

interface HeroMetricsGridProps {
  stats: any;
  animatedValues: Record<string, number | string>;
  periodLabel: string;
}

const HeroMetricsGrid = ({ stats, animatedValues, periodLabel }: HeroMetricsGridProps) => {
  const navigate = useNavigate();

  const metrics: HeroMetric[] = [
    {
      label: `رحلات ${periodLabel}`, value: animatedValues.trips, raw: stats?.todayTrips || 0,
      icon: Truck, gradient: 'from-blue-500 to-cyan-400', color: '#3B82F6',
      sub: `${stats?.yesterdayTrips || 0} أمس`, sparkData: stats?.weeklySparkline,
      route: '/dashboard/transporter-shipments',
    },
    {
      label: 'على الطريق', value: animatedValues.inTransit, raw: stats?.inTransit || 0,
      icon: Route, gradient: 'from-amber-500 to-orange-400', color: '#F59E0B',
      sub: `${stats?.collecting || 0} قيد الجمع`, sparkData: null,
      route: '/dashboard/tracking-center',
    },
    {
      label: 'تم التسليم', value: animatedValues.delivered, raw: stats?.todayDelivered || 0,
      icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-400', color: '#10B981',
      sub: `إنجاز ${stats?.completionRate || 0}%`, sparkData: null,
      route: '/dashboard/transporter-shipments',
    },
    {
      label: 'السائقون', value: animatedValues.drivers, raw: stats?.totalDrivers || 0,
      icon: Users, gradient: 'from-violet-500 to-purple-400', color: '#8B5CF6',
      sub: `${stats?.availableDrivers || 0} متاح · ${stats?.activeDrivers || 0} نشط`,
      sparkData: null, route: '/dashboard/transporter-drivers',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {metrics.map((m, index) => (
        <motion.div key={m.label}
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 + index * 0.07, duration: 0.5, type: 'spring', stiffness: 200 }}
          whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate(m.route)}
          className="relative group rounded-xl sm:rounded-2xl border border-border/30 bg-card/80 backdrop-blur-md p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-border/60 overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
          <div className="flex items-start justify-between mb-2 relative z-10">
            {m.sparkData && <MiniSparkline data={m.sparkData} color={m.color} height={24} width={60} />}
            {!m.sparkData && <div className="w-[60px]" />}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg`}>
              <m.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-right relative z-10">
            <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums leading-none">{m.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-semibold">{m.label}</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">{m.sub}</p>
          </div>
          {m.raw > 0 && (
            <motion.div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: m.color }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: index * 0.25 }} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default HeroMetricsGrid;
