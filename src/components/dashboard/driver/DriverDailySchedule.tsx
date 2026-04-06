import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, MapPin, CheckCircle } from 'lucide-react';

const tasks = [
  { id: 'T-401', task: 'استلام شحنة من مولد القاهرة', time: '08:00', status: 'done', location: 'مدينة نصر' },
  { id: 'T-402', task: 'توصيل إلى مصنع التدوير', time: '10:30', status: 'in_progress', location: '6 أكتوبر' },
  { id: 'T-403', task: 'استلام شحنة من مولد الجيزة', time: '13:00', status: 'pending', location: 'الهرم' },
  { id: 'T-404', task: 'توصيل إلى مدفن أبو رواش', time: '15:30', status: 'pending', location: 'أبو رواش' },
];

const statusMap = {
  done: { label: 'مكتمل', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  in_progress: { label: 'جارٍ', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  pending: { label: 'قادم', color: 'bg-muted text-muted-foreground border-border' },
};

const DriverDailySchedule = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Package className="h-5 w-5 text-primary" />
        جدول اليوم
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {tasks.map((t) => {
        const cfg = statusMap[t.status as keyof typeof statusMap];
        return (
          <div key={t.id} className="flex items-center justify-between p-2 rounded border">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-mono">{t.time}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{t.task}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {t.location}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default DriverDailySchedule;
