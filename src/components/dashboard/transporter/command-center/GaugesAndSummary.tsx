/**
 * GaugesAndSummary — المقاييس والملخص الشهري والأسبوعي
 */
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Truck, Compass, BarChart3 } from 'lucide-react';
import ArcGauge from './ArcGauge';
import MiniSparkline from './MiniSparkline';

interface GaugesAndSummaryProps {
  stats: any;
  animatedValues: Record<string, number | string>;
}

const GaugesAndSummary = ({ stats, animatedValues: a }: GaugesAndSummaryProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Gauges */}
        <div className="flex items-center justify-around p-3 rounded-xl bg-muted/20 border border-border/30">
          <ArcGauge value={stats?.completionRate || 0} label="الإنجاز" color="hsl(var(--primary))" icon={Target} size={80} />
          <ArcGauge value={stats?.driverUtilization || 0} label="استخدام الأسطول" color="#F59E0B" icon={Truck} size={80} />
        </div>

        {/* Monthly Summary */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-right space-y-2">
          <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 justify-end">
            ملخص الشهر <Compass className="w-3.5 h-3.5 text-primary" />
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: a.monthTotal, l: 'شحنة' },
              { v: (stats?.monthQuantity || 0).toLocaleString('ar-SA'), l: 'طن' },
              { v: stats?.monthDelivered || 0, l: 'تم التسليم', c: 'text-primary' },
              { v: a.partners, l: 'شريك' },
            ].map((item, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-card/60 border border-border/20">
                <p className={`text-lg font-black tabular-nums ${item.c || 'text-foreground'}`}>{item.v}</p>
                <p className="text-[9px] text-muted-foreground">{item.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Quantity Bars */}
        <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-right space-y-2">
          <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 justify-end">
            اتجاه الكميات (أسبوعي) <BarChart3 className="w-3.5 h-3.5 text-primary" />
          </p>
          <div className="flex items-end gap-1 h-16 justify-center">
            {(stats?.weeklyQuantitySparkline || []).map((qty: number, i: number) => {
              const max = Math.max(...(stats?.weeklyQuantitySparkline || [1]), 1);
              const pct = Math.max((qty / max) * 100, 4);
              const isToday = i === (stats?.weeklyQuantitySparkline?.length || 0) - 1;
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <motion.div className={`w-6 sm:w-8 rounded-t-md ${isToday ? 'bg-primary' : 'bg-primary/30'}`}
                      initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                      transition={{ delay: 0.7 + i * 0.05, duration: 0.5, ease: 'easeOut' }} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{qty.toLocaleString('ar-SA')} طن</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] text-muted-foreground/50 px-1">
            <span>قبل ٧ أيام</span>
            <span>اليوم</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GaugesAndSummary;
