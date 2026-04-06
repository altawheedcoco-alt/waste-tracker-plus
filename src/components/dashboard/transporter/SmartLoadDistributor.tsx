import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const vehicles = [
  { id: 'V-001', name: 'مرسيدس أكتروس', capacity: 15, currentLoad: 12, wasteType: 'صلبة عادية', available: true },
  { id: 'V-002', name: 'فولفو FH16', capacity: 20, currentLoad: 0, wasteType: 'خطرة', available: true },
  { id: 'V-003', name: 'سكانيا R450', capacity: 18, currentLoad: 18, wasteType: 'صلبة عادية', available: false },
  { id: 'V-004', name: 'إيسوزو NPR', capacity: 8, currentLoad: 5, wasteType: 'طبية', available: true },
];

export default function SmartLoadDistributor() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-5 h-5 text-primary" />
          محرك توزيع الحمولة الذكي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {vehicles.map(v => {
          const usage = Math.round((v.currentLoad / v.capacity) * 100);
          return (
            <div key={v.id} className="p-2.5 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{v.name}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${v.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {v.available ? 'متاح' : 'ممتلئ'}
                </Badge>
              </div>
              <Progress value={usage} className="h-1.5 mb-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{v.currentLoad}/{v.capacity} طن</span>
                <span>{v.wasteType}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
