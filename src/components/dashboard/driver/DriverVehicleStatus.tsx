import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, AlertCircle, CheckCircle, Wrench } from 'lucide-react';

const vehicleInfo = {
  plate: 'أ ب ج - 1234',
  model: 'مرسيدس أكتروس 2024',
  type: 'شاحنة 10 طن',
  nextService: '2026-04-15',
  odometerKm: 85200,
  fuelLevel: 72,
  tireCondition: 'جيدة',
  insuranceExpiry: '2027-01-20',
};

const checks = [
  { item: 'الإطارات', status: 'ok' },
  { item: 'الفرامل', status: 'ok' },
  { item: 'الأضواء', status: 'ok' },
  { item: 'زيت المحرك', status: 'warning' },
  { item: 'مياه التبريد', status: 'ok' },
];

const DriverVehicleStatus = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Truck className="h-5 w-5 text-primary" />
        حالة المركبة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-lg font-bold">{vehicleInfo.plate}</p>
        <p className="text-sm text-muted-foreground">{vehicleInfo.model} — {vehicleInfo.type}</p>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
          <span>العداد: {vehicleInfo.odometerKm.toLocaleString()} كم</span>
          <span>الوقود: {vehicleInfo.fuelLevel}%</span>
          <span>صيانة قادمة: {vehicleInfo.nextService}</span>
          <span>تأمين: {vehicleInfo.insuranceExpiry}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">فحص ما قبل الرحلة</p>
        {checks.map((c, i) => (
          <div key={i} className="flex items-center justify-between p-1.5 rounded border text-sm">
            <span>{c.item}</span>
            {c.status === 'ok' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DriverVehicleStatus;
