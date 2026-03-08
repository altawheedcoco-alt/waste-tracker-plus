import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sunrise, Sun, Moon, Zap, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, Package, Sparkles, Activity,
  Truck, Recycle, Factory, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartDailyBriefProps {
  stats?: {
    pending?: number;
    active?: number;
    completed?: number;
    total?: number;
  };
  role: 'generator' | 'transporter' | 'recycler' | 'driver' | 'disposal' | 'admin';
}

const roleConfig: Record<string, { icon: typeof Package; label: string }> = {
  generator: { icon: Package, label: 'مُولّد' },
  transporter: { icon: Truck, label: 'ناقل' },
  recycler: { icon: Recycle, label: 'مُدوِّر' },
  driver: { icon: Truck, label: 'سائق' },
  disposal: { icon: Factory, label: 'تخلص' },
  admin: { icon: Shield, label: 'مسؤول' },
};

const SmartDailyBrief = ({ stats, role }: SmartDailyBriefProps) => {
  const { profile } = useAuth();

  const { greeting, icon: GreetingIcon, gradientClass, accentColor } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'صباح الخير', icon: Sunrise, gradientClass: 'from-amber-500/15 via-orange-400/8 to-yellow-300/5', accentColor: 'text-amber-500' };
    if (hour < 17) return { greeting: 'مساء الخير', icon: Sun, gradientClass: 'from-sky-500/15 via-blue-400/8 to-cyan-300/5', accentColor: 'text-sky-500' };
    return { greeting: 'مساء النور', icon: Moon, gradientClass: 'from-indigo-500/15 via-violet-400/8 to-purple-300/5', accentColor: 'text-indigo-400' };
  }, []);

  const smartMessage = useMemo(() => {
    if (!stats) return null;
    const { pending = 0, active = 0, completed = 0, total = 0 } = stats;

    // Role-specific messages
    if (role === 'disposal') {
      if (pending > 3) return { text: `${pending} طلب تخلص بانتظار المعالجة`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} عملية تخلص جارية الآن`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `تم معالجة ${completed} عملية - أداء ممتاز! 🏭`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'recycler') {
      if (pending > 3) return { text: `${pending} شحنة واردة بانتظار الفرز`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} شحنة قيد المعالجة والتدوير`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أنجزت تدوير ${completed} شحنة - استمر! ♻️`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'transporter') {
      if (pending > 5) return { text: `لديك ${pending} شحنة بانتظار الاستلام`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} رحلة نشطة على الطريق`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أتممت ${completed} رحلة بنجاح - أحسنت! 🚛`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else if (role === 'driver') {
      if (pending > 0) return { text: `${pending} مهمة بانتظارك`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} رحلة جارية الآن`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أنجزت ${completed} مهمة اليوم 🌟`, icon: CheckCircle2, color: 'text-emerald-500' };
    } else {
      // generator / admin
      if (pending > 5) return { text: `لديك ${pending} شحنة بانتظار الموافقة`, icon: AlertTriangle, color: 'text-amber-500' };
      if (active > 0) return { text: `${active} رحلة نشطة الآن`, icon: Zap, color: 'text-primary' };
      if (completed > 0) return { text: `أنجزت ${completed} مهمة اليوم - أحسنت! 🎉`, icon: CheckCircle2, color: 'text-emerald-500' };
    }

    if (total === 0) return { text: 'يوم جديد مليء بالفرص!', icon: Sparkles, color: 'text-primary' };
    return { text: 'استمر في الأداء المتميز!', icon: TrendingUp, color: 'text-primary' };
  }, [stats, role]);

  const firstName = profile?.full_name?.split(' ')[0] || '';
  const completionRate = stats?.total ? Math.round(((stats.completed ?? 0) / stats.total) * 100) : 0;
  const RoleIcon = roleConfig[role]?.icon || Package;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/30 backdrop-blur-sm',
        `bg-gradient-to-l ${gradientClass}`
      )}
    >
      {/* Animated decorative elements */}
      <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-primary/5 blur-3xl" />
      <motion.div
        className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-primary/20"
        animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Right side - Greeting */}
          <div className="flex-1 text-right min-w-0">
            <div className="flex items-center gap-2.5 justify-end mb-1.5">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-background/60 shadow-sm backdrop-blur-sm')}>
                  <GreetingIcon className={cn('w-5 h-5', accentColor)} />
                </div>
              </motion.div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold truncate leading-tight">
                  {greeting}{firstName ? `، ${firstName}` : ''}
                </h2>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 justify-end">
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig[role]?.label} • {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            {smartMessage && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-1.5 justify-end mt-2.5 px-3 py-1.5 rounded-lg bg-background/40 backdrop-blur-sm w-fit mr-auto sm:mr-0 sm:ml-auto"
              >
                <smartMessage.icon className={cn('w-3.5 h-3.5 shrink-0', smartMessage.color)} />
                <span className="text-xs font-medium text-foreground/80">{smartMessage.text}</span>
              </motion.div>
            )}
          </div>

          {/* Left side - Stats pills & progress */}
          {stats && (stats.total ?? 0) > 0 && (
            <div className="flex flex-col gap-2 shrink-0 items-end">
              {/* Circular progress indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="relative w-14 h-14"
              >
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${completionRate}, 100` }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold tabular-nums">{completionRate}%</span>
                </div>
              </motion.div>

              {/* Mini stat pills */}
              <div className="flex gap-1.5">
                {(stats.active ?? 0) > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <Activity className="w-3 h-3 text-primary" />
                    <span className="text-[11px] font-bold text-primary tabular-nums">{stats.active}</span>
                  </motion.div>
                )}
                {(stats.pending ?? 0) > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                  >
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.pending}</span>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SmartDailyBrief;
