import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, HardHat, Flame } from 'lucide-react';

const safetyMetrics = [
  { label: 'أيام بدون حوادث', value: 127, icon: ShieldCheck, color: 'text-green-600' },
  { label: 'حوادث هذا العام', value: 2, icon: AlertTriangle, color: 'text-yellow-600' },
  { label: 'معدات وقاية منتهية', value: 5, icon: HardHat, color: 'text-destructive' },
  { label: 'تدريبات سلامة مكتملة', value: '94%', icon: Flame, color: 'text-primary' },
];

const incidents = [
  { date: '2026-01-15', type: 'انزلاق', severity: 'طفيف', resolved: true },
  { date: '2025-11-03', type: 'حرق كيميائي', severity: 'متوسط', resolved: true },
];

const RecyclerSafetyDashboard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <HardHat className="h-5 w-5 text-primary" />
        لوحة السلامة المهنية
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {safetyMetrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-3 rounded-lg border bg-card/50 text-center">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">آخر الحوادث</p>
        {incidents.map((inc, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded border text-xs">
            <span>{inc.date} — {inc.type}</span>
            <span className={inc.severity === 'طفيف' ? 'text-yellow-600' : 'text-orange-600'}>{inc.severity}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default RecyclerSafetyDashboard;
