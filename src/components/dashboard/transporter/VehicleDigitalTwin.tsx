import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

const vehicles = [
  { id: 'V-001', name: 'مرسيدس أكتروس', engine: 92, tires: 78, brakes: 85, battery: 95, overall: 87 },
  { id: 'V-002', name: 'فولفو FH16', engine: 68, tires: 45, brakes: 72, battery: 88, overall: 68 },
  { id: 'V-003', name: 'سكانيا R450', engine: 95, tires: 90, brakes: 93, battery: 91, overall: 92 },
];

const getColor = (v: number) => v >= 80 ? 'text-green-600' : v >= 60 ? 'text-yellow-600' : 'text-red-600';

export default function VehicleDigitalTwin() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="w-5 h-5 text-primary" />
          التوأم الرقمي للأسطول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {vehicles.map(v => (
          <div key={v.id} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold">{v.name}</p>
                <p className="text-[10px] text-muted-foreground">{v.id}</p>
              </div>
              <Badge variant="outline" className={`${v.overall >= 80 ? 'bg-green-100 text-green-800' : v.overall >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {v.overall}%
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'محرك', val: v.engine },
                { label: 'إطارات', val: v.tires },
                { label: 'فرامل', val: v.brakes },
                { label: 'بطارية', val: v.battery },
              ].map(part => (
                <div key={part.label}>
                  <p className={`text-sm font-bold ${getColor(part.val)}`}>{part.val}%</p>
                  <p className="text-[9px] text-muted-foreground">{part.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
