import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, AlertTriangle, CheckCircle } from 'lucide-react';

const loads = [
  { trip: 'رحلة #1201', vehicle: 'شاحنة 10 طن', maxLoad: 10, actualLoad: 9.2, status: 'ok' },
  { trip: 'رحلة #1202', vehicle: 'شاحنة 5 طن', maxLoad: 5, actualLoad: 5.3, status: 'overload' },
  { trip: 'رحلة #1203', vehicle: 'بيك أب 2 طن', maxLoad: 2, actualLoad: 1.8, status: 'ok' },
  { trip: 'رحلة #1204', vehicle: 'شاحنة 10 طن', maxLoad: 10, actualLoad: 10.8, status: 'overload' },
];

const DriverLoadCompliance = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Scale className="h-5 w-5 text-primary" />
        امتثال الأحمال
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {loads.map((l, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <div className="flex items-center gap-2">
            {l.status === 'ok' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
            <div>
              <p className="text-sm font-medium">{l.trip}</p>
              <p className="text-xs text-muted-foreground">{l.vehicle} • الحد: {l.maxLoad} طن</p>
            </div>
          </div>
          <span className={`text-sm font-bold ${l.status === 'ok' ? 'text-green-600' : 'text-destructive'}`}>
            {l.actualLoad} طن
          </span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-2 border-t">
        ⚠️ تحميل زائد = مخالفة مرورية + تلف مركبة
      </p>
    </CardContent>
  </Card>
);

export default DriverLoadCompliance;
