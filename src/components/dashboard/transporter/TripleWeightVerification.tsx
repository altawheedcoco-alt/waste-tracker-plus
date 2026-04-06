import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';

const shipments = [
  { id: 'SH-3001', generator: 5200, scale: 5150, recycler: 5100, variance: 1.9, status: 'ok' as const },
  { id: 'SH-3002', generator: 3000, scale: 2800, recycler: 2750, variance: 8.3, status: 'alert' as const },
  { id: 'SH-3003', generator: 8500, scale: 8480, recycler: 8450, variance: 0.6, status: 'ok' as const },
  { id: 'SH-3004', generator: 4200, scale: 3900, recycler: 3850, variance: 8.3, status: 'alert' as const },
];

export default function TripleWeightVerification() {
  const alerts = shipments.filter(s => s.status === 'alert').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="w-5 h-5 text-primary" />
            نظام الوزن الثلاثي
          </CardTitle>
          {alerts > 0 && <Badge variant="destructive">{alerts} تنبيه</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {shipments.map(s => (
          <div key={s.id} className={`p-2.5 rounded-lg border ${s.status === 'alert' ? 'border-red-200 bg-red-50/50' : ''}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold">{s.id}</span>
              <div className="flex items-center gap-1">
                {s.status === 'alert' ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                <Badge variant="outline" className={`text-[10px] ${s.status === 'alert' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {s.variance}% فرق
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
              <div className="p-1 rounded bg-muted/50"><p className="text-muted-foreground">المولد</p><p className="font-bold">{s.generator} كجم</p></div>
              <div className="p-1 rounded bg-muted/50"><p className="text-muted-foreground">الميزان</p><p className="font-bold">{s.scale} كجم</p></div>
              <div className="p-1 rounded bg-muted/50"><p className="text-muted-foreground">المدور</p><p className="font-bold">{s.recycler} كجم</p></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
