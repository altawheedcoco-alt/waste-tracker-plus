import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, Package, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const zones = [
  { name: 'مخزن المواد الخام', capacity: 500, used: 380, unit: 'طن', type: 'input' },
  { name: 'مخزن المنتجات النهائية', capacity: 300, used: 195, unit: 'طن', type: 'output' },
  { name: 'مخزن قطع الغيار', capacity: 100, used: 42, unit: 'قطعة', type: 'parts' },
  { name: 'ساحة الاستقبال', capacity: 200, used: 155, unit: 'طن', type: 'input' },
  { name: 'منطقة الرفض/الإعادة', capacity: 50, used: 12, unit: 'طن', type: 'reject' },
];

const RecyclerWarehouseManager = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Warehouse className="h-5 w-5 text-primary" />
        إدارة المخازن والمستودعات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {zones.map((z, i) => {
        const pct = Math.round((z.used / z.capacity) * 100);
        return (
          <div key={i} className="p-3 rounded-lg border bg-card/50 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {z.type === 'input' ? <ArrowDownToLine className="h-3 w-3" /> : <ArrowUpFromLine className="h-3 w-3" />}
                <span className="text-sm font-medium">{z.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{z.used}/{z.capacity} {z.unit}</span>
            </div>
            <Progress value={pct} className={`h-2 ${pct > 85 ? '[&>div]:bg-destructive' : ''}`} />
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RecyclerWarehouseManager;
