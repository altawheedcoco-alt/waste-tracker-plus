import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertOctagon, Car, ShieldAlert, Gauge, MapPin, Clock } from 'lucide-react';

interface DrivingPattern {
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  patterns: {
    type: 'hard_braking' | 'speeding' | 'sharp_turn' | 'idle_engine' | 'night_driving' | 'route_deviation';
    count: number;
    severity: 'low' | 'medium' | 'high';
    lastOccurrence: string;
  }[];
  overallRiskScore: number;
  totalTrips: number;
}

const PATTERN_LABELS: Record<string, { label: string; icon: any }> = {
  hard_braking: { label: 'فرملة مفاجئة', icon: AlertOctagon },
  speeding: { label: 'تجاوز السرعة', icon: Gauge },
  sharp_turn: { label: 'انعطاف حاد', icon: Car },
  idle_engine: { label: 'تشغيل المحرك بلا حركة', icon: Clock },
  night_driving: { label: 'قيادة ليلية مفرطة', icon: ShieldAlert },
  route_deviation: { label: 'انحراف عن المسار', icon: MapPin },
};

const MOCK_DRIVERS: DrivingPattern[] = [
  {
    driverId: '1', driverName: 'محمد أحمد', vehiclePlate: 'أ ب ج 1234',
    overallRiskScore: 72, totalTrips: 145,
    patterns: [
      { type: 'hard_braking', count: 23, severity: 'high', lastOccurrence: 'منذ ساعتين' },
      { type: 'speeding', count: 15, severity: 'medium', lastOccurrence: 'أمس' },
      { type: 'sharp_turn', count: 8, severity: 'low', lastOccurrence: 'منذ 3 أيام' },
    ],
  },
  {
    driverId: '2', driverName: 'عبدالله حسن', vehiclePlate: 'د هـ و 5678',
    overallRiskScore: 35, totalTrips: 198,
    patterns: [
      { type: 'idle_engine', count: 45, severity: 'medium', lastOccurrence: 'اليوم' },
      { type: 'night_driving', count: 12, severity: 'low', lastOccurrence: 'منذ أسبوع' },
    ],
  },
  {
    driverId: '3', driverName: 'خالد محمود', vehiclePlate: 'ز ح ط 9012',
    overallRiskScore: 85, totalTrips: 89,
    patterns: [
      { type: 'speeding', count: 34, severity: 'high', lastOccurrence: 'اليوم' },
      { type: 'hard_braking', count: 28, severity: 'high', lastOccurrence: 'اليوم' },
      { type: 'route_deviation', count: 7, severity: 'medium', lastOccurrence: 'أمس' },
    ],
  },
];

const getRiskColor = (score: number) => {
  if (score >= 70) return 'text-red-600 bg-red-50 dark:bg-red-950';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
  return 'text-green-600 bg-green-50 dark:bg-green-950';
};

export default function DrivingPatternAnalyzer() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          كشف أنماط القيادة الخطرة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[380px]">
          <div className="space-y-4">
            {MOCK_DRIVERS.sort((a, b) => b.overallRiskScore - a.overallRiskScore).map(driver => (
              <Card key={driver.driverId} className="border">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(driver.overallRiskScore)}`}>
                      خطورة: {driver.overallRiskScore}%
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{driver.driverName}</p>
                      <p className="text-xs text-muted-foreground">{driver.vehiclePlate} • {driver.totalTrips} رحلة</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {driver.patterns.map((p, i) => {
                      const info = PATTERN_LABELS[p.type];
                      const Icon = info.icon;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                          <span className="text-muted-foreground">{p.lastOccurrence}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={p.severity === 'high' ? 'destructive' : p.severity === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">
                              {p.count}×
                            </Badge>
                            <span>{info.label}</span>
                            <Icon className="w-3 h-3" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
