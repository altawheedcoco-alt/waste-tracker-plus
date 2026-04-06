import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

const schedule = [
  { vehicle: 'V-001', lastWash: '2026-04-02', nextDue: '2026-04-06', wasteType: 'طبية', status: 'due' as const },
  { vehicle: 'V-002', lastWash: '2026-04-04', nextDue: '2026-04-08', wasteType: 'خطرة', status: 'ok' as const },
  { vehicle: 'V-003', lastWash: '2026-03-28', nextDue: '2026-04-04', wasteType: 'صلبة', status: 'overdue' as const },
  { vehicle: 'V-004', lastWash: '2026-04-05', nextDue: '2026-04-09', wasteType: 'طبية', status: 'ok' as const },
];

const statusConfig = {
  ok: { label: 'نظيف', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  due: { label: 'مستحق اليوم', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
  overdue: { label: 'متأخر!', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

export default function VehicleSanitizationSchedule() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="w-5 h-5 text-primary" />
          جدولة غسيل وتعقيم المركبات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.map((s, i) => {
          const config = statusConfig[s.status];
          const Icon = config.icon;
          return (
            <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${s.status === 'overdue' ? 'border-red-200 bg-red-50/50' : ''}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${s.status === 'overdue' ? 'text-red-500' : s.status === 'due' ? 'text-yellow-500' : 'text-green-500'}`} />
                <div>
                  <p className="text-sm font-medium">{s.vehicle}</p>
                  <p className="text-[10px] text-muted-foreground">نقل: {s.wasteType}</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
