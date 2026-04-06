import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, Clock, Truck } from 'lucide-react';

const vehicles = [
  { id: 'V-001', name: 'مرسيدس أكتروس', workHours: 14, totalHours: 18, trips: 4, km: 180 },
  { id: 'V-002', name: 'فولفو FH16', workHours: 6, totalHours: 18, trips: 2, km: 95 },
  { id: 'V-003', name: 'سكانيا R450', workHours: 16, totalHours: 18, trips: 5, km: 220 },
  { id: 'V-004', name: 'إيسوزو NPR', workHours: 0, totalHours: 18, trips: 0, km: 0 },
];

export default function FleetUtilizationIndex() {
  const avgUtil = Math.round(vehicles.reduce((s, v) => s + (v.workHours / v.totalHours) * 100, 0) / vehicles.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="w-5 h-5 text-primary" />
          مؤشر الاستغلال الأمثل للأسطول
        </CardTitle>
        <div className="flex items-center gap-2">
          <Progress value={avgUtil} className="flex-1" />
          <span className="text-sm font-bold">{avgUtil}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {vehicles.map(v => {
          const util = Math.round((v.workHours / v.totalHours) * 100);
          return (
            <div key={v.id} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">{v.name}</p>
                  <p className="text-[9px] text-muted-foreground">{v.trips} رحلات — {v.km} كم</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3" />
                  {v.workHours}/{v.totalHours}h
                </div>
                <Badge variant="outline" className={`text-[10px] ${util >= 70 ? 'bg-green-100 text-green-800' : util > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {util}%
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
