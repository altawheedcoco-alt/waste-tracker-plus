import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, MapPin, Fuel } from 'lucide-react';

const trips = [
  { id: 'SH-3001', route: 'حلوان → العاشر', plannedMin: 90, actualMin: 105, fuelUsed: 28, events: ['تأخير مرور 15 دقيقة'] },
  { id: 'SH-3002', route: 'مدينة نصر → العبور', plannedMin: 45, actualMin: 42, fuelUsed: 12, events: [] },
  { id: 'SH-3003', route: 'المعادي → 6 أكتوبر', plannedMin: 60, actualMin: 85, fuelUsed: 22, events: ['انتظار 20 دقيقة عند البوابة'] },
];

export default function AutoTripReport() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5 text-primary" />
          تقرير الرحلة الآلي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trips.map(t => {
          const diff = t.actualMin - t.plannedMin;
          const late = diff > 0;
          return (
            <div key={t.id} className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{t.id}</span>
                <Badge variant="outline" className={`text-[10px] ${late ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {late ? `+${diff} دقيقة` : `${Math.abs(diff)} دقيقة مبكر`}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                <MapPin className="w-3 h-3" /> {t.route}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div><p className="text-muted-foreground">المخطط</p><p className="font-bold">{t.plannedMin} د</p></div>
                <div><p className="text-muted-foreground">الفعلي</p><p className={`font-bold ${late ? 'text-red-600' : 'text-green-600'}`}>{t.actualMin} د</p></div>
                <div><p className="text-muted-foreground">الوقود</p><p className="font-bold">{t.fuelUsed} لتر</p></div>
              </div>
              {t.events.length > 0 && (
                <div className="mt-1.5 text-[9px] text-muted-foreground">
                  {t.events.map((e, i) => <p key={i}>⚠️ {e}</p>)}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
