/**
 * شريط KPI سريع للسائق — يعرض المقاييس الحيوية في سطر واحد
 * مثل: التقييم، الرحلات، معدل القبول، حالة التوثيق
 */
import { Star, Route, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverPerformanceStripProps {
  rating: number;
  totalTrips: number;
  acceptanceRate: number;
  isVerified: boolean;
  className?: string;
}

const DriverPerformanceStrip = ({
  rating,
  totalTrips,
  acceptanceRate,
  isVerified,
  className,
}: DriverPerformanceStripProps) => {
  const metrics = [
    {
      icon: Star,
      value: rating?.toFixed(1) || '0.0',
      label: 'التقييم',
      color: rating >= 4 ? 'text-amber-500' : rating >= 3 ? 'text-muted-foreground' : 'text-destructive',
    },
    {
      icon: Route,
      value: totalTrips?.toString() || '0',
      label: 'رحلة',
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      value: `${Math.round(acceptanceRate || 0)}%`,
      label: 'قبول',
      color: acceptanceRate >= 80 ? 'text-emerald-500' : acceptanceRate >= 50 ? 'text-amber-500' : 'text-destructive',
    },
    {
      icon: isVerified ? ShieldCheck : AlertTriangle,
      value: isVerified ? 'موثق' : 'غير موثق',
      label: 'الحالة',
      color: isVerified ? 'text-emerald-500' : 'text-amber-500',
    },
  ];

  return (
    <div className={cn('grid grid-cols-4 gap-1 rounded-xl border border-border/40 bg-card p-2', className)}>
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col items-center gap-0.5 text-center">
          <m.icon className={cn('w-3.5 h-3.5', m.color)} />
          <span className={cn('text-xs font-bold leading-none', m.color)}>{m.value}</span>
          <span className="text-[9px] text-muted-foreground leading-none">{m.label}</span>
        </div>
      ))}
    </div>
  );
};

export default DriverPerformanceStrip;
