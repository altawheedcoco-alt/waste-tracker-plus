import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Flame } from 'lucide-react';

// Simulated heatmap data for Egyptian governorates
const GOVERNORATE_DATA = [
  { name: 'القاهرة', trips: 245, revenue: 182000, intensity: 95 },
  { name: 'الجيزة', trips: 198, revenue: 145000, intensity: 82 },
  { name: 'الإسكندرية', trips: 156, revenue: 120000, intensity: 70 },
  { name: 'الشرقية', trips: 89, revenue: 67000, intensity: 45 },
  { name: 'القليوبية', trips: 76, revenue: 55000, intensity: 38 },
  { name: 'الدقهلية', trips: 54, revenue: 41000, intensity: 28 },
  { name: 'المنوفية', trips: 43, revenue: 32000, intensity: 22 },
  { name: 'البحيرة', trips: 38, revenue: 28000, intensity: 19 },
  { name: 'الغربية', trips: 31, revenue: 24000, intensity: 16 },
  { name: 'أسيوط', trips: 22, revenue: 17000, intensity: 11 },
  { name: 'سوهاج', trips: 15, revenue: 11000, intensity: 8 },
  { name: 'المنيا', trips: 12, revenue: 9000, intensity: 6 },
];

const getIntensityColor = (intensity: number) => {
  if (intensity >= 80) return 'bg-red-500 dark:bg-red-600';
  if (intensity >= 60) return 'bg-orange-500 dark:bg-orange-600';
  if (intensity >= 40) return 'bg-yellow-500 dark:bg-yellow-600';
  if (intensity >= 20) return 'bg-green-400 dark:bg-green-600';
  return 'bg-green-200 dark:bg-green-800';
};

export default function OperationsHeatmap() {
  const totalTrips = GOVERNORATE_DATA.reduce((sum, g) => sum + g.trips, 0);
  const totalRevenue = GOVERNORATE_DATA.reduce((sum, g) => sum + g.revenue, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          خريطة حرارية لمناطق العمل
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4 text-sm">
          <Badge variant="outline">{totalRevenue.toLocaleString()} ج.م إيرادات</Badge>
          <Badge variant="secondary">{totalTrips} رحلة إجمالية</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GOVERNORATE_DATA.map(gov => (
            <div key={gov.name} className="relative p-3 rounded-lg border hover:shadow-md transition-shadow">
              <div className={`absolute top-1 left-1 w-3 h-3 rounded-full ${getIntensityColor(gov.intensity)}`} />
              <div className="text-right">
                <p className="text-sm font-medium flex items-center gap-1 justify-end">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {gov.name}
                </p>
                <p className="text-xs text-muted-foreground">{gov.trips} رحلة</p>
                <p className="text-xs font-medium text-primary">{gov.revenue.toLocaleString()} ج.م</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> عالي</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500" /> متوسط</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> معتدل</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-400" /> منخفض</div>
        </div>
      </CardContent>
    </Card>
  );
}
