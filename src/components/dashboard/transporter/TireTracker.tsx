import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDot, Droplets, Truck } from 'lucide-react';

const tires = [
  { position: 'أمامي يمين', km: 42000, maxKm: 80000, condition: 'good' as const },
  { position: 'أمامي يسار', km: 42000, maxKm: 80000, condition: 'good' as const },
  { position: 'خلفي يمين 1', km: 65000, maxKm: 80000, condition: 'warning' as const },
  { position: 'خلفي يسار 1', km: 71000, maxKm: 80000, condition: 'critical' as const },
  { position: 'خلفي يمين 2', km: 30000, maxKm: 80000, condition: 'good' as const },
  { position: 'خلفي يسار 2', km: 30000, maxKm: 80000, condition: 'good' as const },
];

const condConfig = {
  good: { label: 'جيد', color: 'bg-green-100 text-green-800' },
  warning: { label: 'تحذير', color: 'bg-yellow-100 text-yellow-800' },
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800' },
};

export default function TireTracker() {
  const criticalCount = tires.filter(t => t.condition === 'critical' || t.condition === 'warning').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleDot className="w-5 h-5 text-primary" />
            تتبع الإطارات الذكي
          </CardTitle>
          {criticalCount > 0 && <Badge variant="destructive">{criticalCount} تحذير</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">المركبة: V-001 مرسيدس أكتروس</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {tires.map((t, i) => {
            const usage = Math.round((t.km / t.maxKm) * 100);
            const config = condConfig[t.condition];
            return (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${t.condition === 'critical' ? 'border-red-200 bg-red-50/50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{t.position}</p>
                  <div className="w-full h-1.5 rounded-full bg-muted mt-1">
                    <div className={`h-full rounded-full ${t.condition === 'critical' ? 'bg-red-500' : t.condition === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${usage}%` }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{t.km.toLocaleString()} / {t.maxKm.toLocaleString()} كم</p>
                </div>
                <Badge variant="outline" className={`text-[9px] mr-2 ${config.color}`}>{config.label}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
