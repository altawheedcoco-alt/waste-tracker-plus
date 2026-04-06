import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fuel, Route, Clock, TrendingDown } from 'lucide-react';

const metrics = [
  { label: 'استهلاك الوقود اليوم', value: '45 لتر', icon: Fuel, change: -5 },
  { label: 'المسافة المقطوعة', value: '285 كم', icon: Route, change: +12 },
  { label: 'ساعات القيادة', value: '7.5 ساعة', icon: Clock, change: 0 },
  { label: 'معدل الوقود/كم', value: '0.158 لتر/كم', icon: TrendingDown, change: -8 },
];

const weeklyData = [
  { day: 'السبت', km: 310, fuel: 48, trips: 5 },
  { day: 'الأحد', km: 275, fuel: 42, trips: 4 },
  { day: 'الاثنين', km: 290, fuel: 45, trips: 5 },
  { day: 'الثلاثاء', km: 320, fuel: 50, trips: 6 },
  { day: 'الأربعاء', km: 285, fuel: 45, trips: 4 },
];

const DriverFuelEfficiency = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Fuel className="h-5 w-5 text-primary" />
        كفاءة الوقود
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-2 rounded-lg border bg-card/50 text-center">
              <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-sm font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              {m.change !== 0 && (
                <span className={`text-xs ${m.change < 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {m.change > 0 ? '+' : ''}{m.change}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">ملخص الأسبوع</p>
        {weeklyData.map((d, i) => (
          <div key={i} className="flex justify-between text-xs p-1.5 rounded border">
            <span>{d.day}</span>
            <span>{d.km} كم</span>
            <span>{d.fuel} لتر</span>
            <span>{d.trips} رحلات</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DriverFuelEfficiency;
