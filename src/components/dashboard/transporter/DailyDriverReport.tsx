import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileBarChart, TrendingUp, TrendingDown, Minus, Clock, MapPin, Fuel, CheckCircle2 } from 'lucide-react';

interface DailyDriverReport {
  driverName: string;
  date: string;
  tripsCompleted: number;
  tripsTarget: number;
  totalKm: number;
  totalHours: number;
  fuelConsumed: number;
  onTimeRate: number;
  avgSpeed: number;
  violations: number;
  revenue: number;
  customerRating: number;
  highlights: string[];
}

const MOCK_REPORTS: DailyDriverReport[] = [
  {
    driverName: 'محمد أحمد', date: '2026-04-05',
    tripsCompleted: 8, tripsTarget: 10, totalKm: 245, totalHours: 9.5,
    fuelConsumed: 78, onTimeRate: 87.5, avgSpeed: 42, violations: 1,
    revenue: 4200, customerRating: 4.5,
    highlights: ['أعلى إيرادات اليوم', 'مخالفة سرعة واحدة'],
  },
  {
    driverName: 'عبدالله حسن', date: '2026-04-05',
    tripsCompleted: 10, tripsTarget: 10, totalKm: 312, totalHours: 10.2,
    fuelConsumed: 95, onTimeRate: 100, avgSpeed: 38, violations: 0,
    revenue: 5100, customerRating: 4.8,
    highlights: ['أنجز كل الرحلات', 'صفر مخالفات', 'أفضل تقييم عملاء'],
  },
  {
    driverName: 'خالد محمود', date: '2026-04-05',
    tripsCompleted: 6, tripsTarget: 8, totalKm: 180, totalHours: 7,
    fuelConsumed: 62, onTimeRate: 66.7, avgSpeed: 35, violations: 3,
    revenue: 2800, customerRating: 3.2,
    highlights: ['تأخر في 3 رحلات', '3 مخالفات قيادة'],
  },
];

const getTrend = (actual: number, target: number) => {
  const ratio = actual / target;
  if (ratio >= 1) return { icon: TrendingUp, color: 'text-green-600' };
  if (ratio >= 0.8) return { icon: Minus, color: 'text-yellow-600' };
  return { icon: TrendingDown, color: 'text-red-600' };
};

export default function DailyDriverReport() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-primary" />
          التقرير اليومي للسائقين
          <Badge variant="outline" className="mr-auto text-xs">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {MOCK_REPORTS.map((report, idx) => {
              const tripTrend = getTrend(report.tripsCompleted, report.tripsTarget);
              const TripIcon = tripTrend.icon;
              return (
                <Card key={idx} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{report.customerRating}</span>
                      </div>
                      <p className="text-sm font-semibold">{report.driverName}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-muted/50 rounded">
                        <TripIcon className={`w-3 h-3 mx-auto mb-1 ${tripTrend.color}`} />
                        <p className="font-bold">{report.tripsCompleted}/{report.tripsTarget}</p>
                        <p className="text-muted-foreground">رحلات</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <MapPin className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                        <p className="font-bold">{report.totalKm}</p>
                        <p className="text-muted-foreground">كم</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <Clock className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                        <p className="font-bold">{report.totalHours}h</p>
                        <p className="text-muted-foreground">ساعات</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <Fuel className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                        <p className="font-bold">{report.fuelConsumed}L</p>
                        <p className="text-muted-foreground">وقود</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <Badge variant={report.violations === 0 ? 'secondary' : 'destructive'} className="text-[10px]">
                        {report.violations} مخالفة
                      </Badge>
                      <span className="text-green-600 font-medium">{report.revenue.toLocaleString()} ج.م</span>
                      <span className={report.onTimeRate >= 90 ? 'text-green-600' : 'text-orange-600'}>
                        التزام: {report.onTimeRate}%
                      </span>
                    </div>

                    {report.highlights.length > 0 && (
                      <div className="text-xs space-y-0.5">
                        {report.highlights.map((h, i) => (
                          <p key={i} className="text-muted-foreground">• {h}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
