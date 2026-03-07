/**
 * SmartPriorityIndicator - مؤشر الأولوية الذكي
 * يعرض حالة المحرك (بارد/دافئ/ساخن) مع تفاصيل التنبيهات النشطة
 */
import { motion } from 'framer-motion';
import { Flame, Thermometer, Snowflake, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface SmartPriorityIndicatorProps {
  heatLevel: 'cool' | 'warm' | 'hot';
  activeBoosts: Array<{ widgetId: string; conditionId: string; labelAr: string; boostAmount: number }>;
}

const HEAT_CONFIG = {
  cool: {
    icon: Snowflake,
    label: 'هادئ',
    className: 'text-muted-foreground',
    bgClass: 'bg-muted/50',
    pulseClass: '',
  },
  warm: {
    icon: Thermometer,
    label: 'نشط',
    className: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    pulseClass: '',
  },
  hot: {
    icon: Flame,
    label: 'عاجل',
    className: 'text-destructive',
    bgClass: 'bg-destructive/10',
    pulseClass: 'animate-pulse',
  },
};

const SmartPriorityIndicator = ({ heatLevel, activeBoosts }: SmartPriorityIndicatorProps) => {
  const config = HEAT_CONFIG[heatLevel];
  const Icon = config.icon;

  if (activeBoosts.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.bgClass} ${config.className} ${config.pulseClass}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{config.label}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1">
            {activeBoosts.length}
          </Badge>
          <ChevronDown className="w-3 h-3" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 rounded-xl" align="end" dir="rtl">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">
            أولويات ذكية نشطة
          </p>
          <div className="space-y-1.5">
            {activeBoosts.map((boost, i) => (
              <motion.div
                key={boost.conditionId}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-muted/50"
              >
                <span className="text-foreground/80">{boost.labelAr}</span>
                <span className={`font-bold ${config.className}`}>
                  +{boost.boostAmount}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
            يتم ترتيب الودجات تلقائياً حسب البيانات الحية
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SmartPriorityIndicator;
