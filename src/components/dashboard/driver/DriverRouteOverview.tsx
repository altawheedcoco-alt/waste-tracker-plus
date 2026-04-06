import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';

const routes = [
  { from: 'مصنع القاهرة', to: 'مدفن أبو رواش', distance: '35 كم', eta: '45 دقيقة', traffic: 'متوسط' },
  { from: 'مولد الجيزة', to: 'مصنع تدوير 6 أكتوبر', distance: '22 كم', eta: '30 دقيقة', traffic: 'خفيف' },
  { from: 'فرع المعادي', to: 'مدفن القطامية', distance: '18 كم', eta: '25 دقيقة', traffic: 'كثيف' },
];

const trafficColor = {
  'خفيف': 'text-green-600',
  'متوسط': 'text-yellow-600',
  'كثيف': 'text-destructive',
};

const DriverRouteOverview = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Navigation className="h-5 w-5 text-primary" />
        المسارات القادمة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {routes.map((r, i) => (
        <div key={i} className="p-3 rounded-lg border bg-card/50">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3 w-3 text-green-600" />
            <span className="text-sm font-medium">{r.from}</span>
            <span className="text-xs text-muted-foreground">→</span>
            <MapPin className="h-3 w-3 text-destructive" />
            <span className="text-sm font-medium">{r.to}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{r.distance}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {r.eta}
            </div>
            <span className={trafficColor[r.traffic as keyof typeof trafficColor]}>
              حركة: {r.traffic}
            </span>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default DriverRouteOverview;
