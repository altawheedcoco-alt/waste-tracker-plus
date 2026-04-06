import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

const parts = [
  { name: 'فلتر زيت', vehicle: 'V-001', stock: 5, minStock: 3, status: 'ok' as const },
  { name: 'تيل فرامل', vehicle: 'عام', stock: 2, minStock: 4, status: 'low' as const },
  { name: 'سير مروحة', vehicle: 'V-002', stock: 1, minStock: 2, status: 'low' as const },
  { name: 'بطارية 12V', vehicle: 'عام', stock: 3, minStock: 2, status: 'ok' as const },
  { name: 'إطار 315/80', vehicle: 'V-001, V-003', stock: 4, minStock: 4, status: 'ok' as const },
];

export default function SparePartsManager() {
  const lowStock = parts.filter(p => p.status === 'low').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="w-5 h-5 text-primary" />
            إدارة القطع البديلة
          </CardTitle>
          {lowStock > 0 && <Badge variant="destructive">{lowStock} نقص</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {parts.map((p, i) => (
          <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${p.status === 'low' ? 'border-red-200 bg-red-50/50' : ''}`}>
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">مركبة: {p.vehicle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${p.status === 'low' ? 'text-red-600' : 'text-green-600'}`}>{p.stock}</span>
              {p.status === 'low' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-1 mt-2"><Plus className="w-3.5 h-3.5" /> طلب قطع</Button>
      </CardContent>
    </Card>
  );
}
