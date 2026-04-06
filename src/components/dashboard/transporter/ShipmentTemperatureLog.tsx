import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, AlertTriangle, CheckCircle2 } from 'lucide-react';

const readings = [
  { shipmentId: 'SH-3010', wasteType: 'طبية', tempStart: 4.2, tempCurrent: 5.1, tempMax: 8, status: 'ok' as const },
  { shipmentId: 'SH-3011', wasteType: 'كيميائية', tempStart: 18, tempCurrent: 24, tempMax: 25, status: 'warning' as const },
  { shipmentId: 'SH-3012', wasteType: 'طبية', tempStart: 3.8, tempCurrent: 9.5, tempMax: 8, status: 'alert' as const },
];

const statusConfig = {
  ok: { label: 'طبيعي', color: 'bg-green-100 text-green-800' },
  warning: { label: 'قريب من الحد', color: 'bg-yellow-100 text-yellow-800' },
  alert: { label: 'تجاوز!', color: 'bg-red-100 text-red-800' },
};

export default function ShipmentTemperatureLog() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Thermometer className="w-5 h-5 text-primary" />
          سجل درجة حرارة الشحنة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {readings.map(r => {
          const config = statusConfig[r.status];
          return (
            <div key={r.shipmentId} className={`p-2.5 rounded-lg border ${r.status === 'alert' ? 'border-red-200 bg-red-50/50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{r.shipmentId} — {r.wasteType}</span>
                <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div><p className="text-muted-foreground">عند التحميل</p><p className="font-bold">{r.tempStart}°C</p></div>
                <div><p className="text-muted-foreground">الحالي</p><p className={`font-bold ${r.status === 'alert' ? 'text-red-600' : ''}`}>{r.tempCurrent}°C</p></div>
                <div><p className="text-muted-foreground">الحد الأقصى</p><p className="font-bold">{r.tempMax}°C</p></div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
