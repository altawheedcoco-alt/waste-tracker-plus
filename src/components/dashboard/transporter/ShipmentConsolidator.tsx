import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Truck, MapPin, DollarSign } from 'lucide-react';

const groups = [
  {
    area: 'حلوان — العاشر من رمضان',
    shipments: ['SH-3005', 'SH-3008', 'SH-3012'],
    totalWeight: 28,
    estimatedSaving: 1200,
    vehicle: 'V-001',
  },
  {
    area: 'مدينة نصر — العبور',
    shipments: ['SH-3006', 'SH-3009'],
    totalWeight: 15,
    estimatedSaving: 800,
    vehicle: 'V-004',
  },
];

export default function ShipmentConsolidator() {
  const totalSaving = groups.reduce((s, g) => s + g.estimatedSaving, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="w-5 h-5 text-primary" />
          محرك تجميع الشحنات
        </CardTitle>
        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
          وفر {totalSaving.toLocaleString()} ج.م
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((g, i) => (
          <div key={i} className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{g.area}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {g.shipments.map(s => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div><Truck className="w-3 h-3 mx-auto mb-0.5 text-primary" />{g.vehicle}</div>
              <div className="font-bold">{g.totalWeight} طن</div>
              <div className="text-green-600 font-bold flex items-center justify-center gap-0.5">
                <DollarSign className="w-3 h-3" />{g.estimatedSaving}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
