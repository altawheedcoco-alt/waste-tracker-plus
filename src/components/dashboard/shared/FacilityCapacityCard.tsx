import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Gauge, TrendingUp } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface FacilityCapacityCardProps {
  facility: {
    current_fill_percentage?: number | null;
    total_capacity_tons?: number | null;
    daily_capacity_tons?: number | null;
    price_per_ton?: number | null;
    currency?: string | null;
    eeaa_rating?: string | null;
  };
}

const FacilityCapacityCard = ({ facility }: FacilityCapacityCardProps) => {
  const fillPercent = facility.current_fill_percentage || 0;
  const isNearFull = fillPercent > 80;
  const isCritical = fillPercent > 90;

  const getStatusColor = () => {
    if (isCritical) return 'text-red-600';
    if (isNearFull) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getProgressColor = () => {
    if (isCritical) return '[&>div]:bg-red-500';
    if (isNearFull) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-emerald-500';
  };

  const getStatusLabel = () => {
    if (isCritical) return { text: 'سعة حرجة', variant: 'destructive' as const };
    if (isNearFull) return { text: 'قارب على الامتلاء', variant: 'secondary' as const };
    return { text: 'طبيعي', variant: 'outline' as const };
  };

  const status = getStatusLabel();

  const metrics = [
    { label: 'السعة الكلية', value: facility.total_capacity_tons, unit: 'طن', icon: '📦' },
    { label: 'السعة اليومية', value: facility.daily_capacity_tons, unit: 'طن/يوم', icon: '📊' },
    { label: 'سعر الطن', value: facility.price_per_ton, unit: facility.currency || 'ر.س', icon: '💰' },
    { label: 'التقييم', value: facility.eeaa_rating, unit: '', icon: '⭐' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className={`overflow-hidden ${isCritical ? 'border-red-300 dark:border-red-800/50' : isNearFull ? 'border-amber-300 dark:border-amber-800/50' : ''}`}>
        {/* Top accent bar */}
        <div className={`h-1 ${isCritical ? 'bg-red-500' : isNearFull ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant={status.variant} className="gap-1">
              {isCritical && <AlertTriangle className="w-3 h-3" />}
              {status.text}
            </Badge>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className={`w-5 h-5 ${getStatusColor()}`} />
              السعة التشغيلية
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fill percentage with animated counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-bold text-lg ${getStatusColor()}`}>
                <AnimatedCounter value={fillPercent} />%
              </span>
              <span className="text-muted-foreground">نسبة الامتلاء الحالية</span>
            </div>
            <Progress value={fillPercent} className={`h-3 ${getProgressColor()}`} />
            {/* Visual scale markers */}
            <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-lg">{m.icon}</span>
                <p className="text-sm font-bold mt-1">
                  {m.value != null ? m.value : '-'}
                  {m.unit && m.value != null && <span className="text-xs text-muted-foreground mr-1">{m.unit}</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacilityCapacityCard;
