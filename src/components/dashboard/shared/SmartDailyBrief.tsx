import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sunrise, Sun, Moon, Zap, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, Package, Sparkles 
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

const SmartDailyBrief = ({ stats, role }: SmartDailyBriefProps) => {
  const { profile } = useAuth();

  const { greeting, icon: GreetingIcon, gradientClass } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'صباح الخير', icon: Sunrise, gradientClass: 'from-amber-500/20 via-orange-500/10 to-transparent' };
    if (hour < 17) return { greeting: 'مساء الخير', icon: Sun, gradientClass: 'from-blue-500/20 via-sky-500/10 to-transparent' };
    return { greeting: 'مساء النور', icon: Moon, gradientClass: 'from-indigo-500/20 via-violet-500/10 to-transparent' };
  }, []);

  const smartMessage = useMemo(() => {
    if (!stats) return null;
    const { pending = 0, active = 0, completed = 0 } = stats;

    if (pending > 5) return { text: `لديك ${pending} شحنة بانتظار الموافقة`, icon: AlertTriangle, color: 'text-amber-500' };
    if (active > 0) return { text: `${active} رحلة نشطة الآن`, icon: Zap, color: 'text-primary' };
    if (completed > 0) return { text: `أنجزت ${completed} مهمة اليوم - أحسنت! 🎉`, icon: CheckCircle2, color: 'text-emerald-500' };
    return { text: 'يوم جديد مليء بالفرص!', icon: Sparkles, color: 'text-primary' };
  }, [stats]);

  const firstName = profile?.full_name?.split(' ')[0] || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/40 p-4 sm:p-5',
        `bg-gradient-to-l ${gradientClass}`
      )}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center gap-2 justify-end mb-1">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <GreetingIcon className="w-5 h-5 text-amber-500" />
            </motion.div>
            <h2 className="text-lg sm:text-xl font-bold truncate">
              {greeting}، {firstName}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {smartMessage && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 justify-end mt-2"
            >
              <smartMessage.icon className={cn('w-3.5 h-3.5 shrink-0', smartMessage.color)} />
              <span className="text-xs font-medium text-foreground/80">{smartMessage.text}</span>
            </motion.div>
          )}
        </div>

        {/* Mini stats pills */}
        {stats && (stats.total ?? 0) > 0 && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {(stats.active ?? 0) > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                <Package className="w-3 h-3 text-primary" />
                <span className="text-xs font-bold text-primary tabular-nums">{stats.active}</span>
              </motion.div>
            )}
            {(stats.pending ?? 0) > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
              >
                <Clock className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-bold text-amber-600 tabular-nums">{stats.pending}</span>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SmartDailyBrief;
