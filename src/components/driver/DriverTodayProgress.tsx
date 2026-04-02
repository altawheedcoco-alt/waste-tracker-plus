/**
 * شريط تقدم اليوم — يعرض عدد المهام المكتملة vs المتبقية اليوم
 * مع شريط تقدم بصري يحفز السائق على إكمال المهام
 */
import { CheckCircle2, Clock, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { DriverShipment } from '@/hooks/useDriverDashboardData';

interface DriverTodayProgressProps {
  shipments: DriverShipment[];
}

const DriverTodayProgress = ({ shipments }: DriverTodayProgressProps) => {
  const today = new Date().toISOString().split('T')[0];

  const todayShipments = shipments.filter((s) => s.created_at?.startsWith(today));
  const completed = todayShipments.filter((s) => ['delivered', 'confirmed'].includes(s.status)).length;
  const active = todayShipments.filter((s) => ['new', 'approved', 'in_transit'].includes(s.status)).length;
  const total = todayShipments.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">تقدم اليوم</span>
        </div>
        <span className="text-xs font-bold text-primary">{progress}%</span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex items-center justify-around text-center">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">{completed}</span> مكتملة
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">{active}</span> نشطة
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">{total}</span> إجمالي
          </span>
        </div>
      </div>
    </div>
  );
};

export default DriverTodayProgress;
