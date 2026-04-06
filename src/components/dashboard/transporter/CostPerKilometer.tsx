import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, TrendingUp, TrendingDown } from 'lucide-react';

const costPerKm = [
  { vehicle: 'V-001 مرسيدس', fuel: 3.2, maintenance: 0.8, driver: 1.5, insurance: 0.3, depreciation: 0.7, total: 6.5 },
  { vehicle: 'V-002 فولفو', fuel: 3.8, maintenance: 1.2, driver: 1.5, insurance: 0.3, depreciation: 0.5, total: 7.3 },
  { vehicle: 'V-003 سكانيا', fuel: 2.9, maintenance: 0.5, driver: 1.5, insurance: 0.3, depreciation: 0.9, total: 6.1 },
  { vehicle: 'V-004 إيسوزو', fuel: 2.5, maintenance: 0.6, driver: 1.2, insurance: 0.2, depreciation: 0.4, total: 4.9 },
];

export default function CostPerKilometer() {
  const avg = (costPerKm.reduce((s, v) => s + v.total, 0) / costPerKm.length).toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="w-5 h-5 text-primary" />
          تكلفة الكيلومتر
        </CardTitle>
        <p className="text-xs text-muted-foreground">متوسط: {avg} ج.م/كم</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {costPerKm.map((v, i) => (
          <div key={i} className="p-2.5 rounded-lg border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{v.vehicle}</span>
              <span className={`text-sm font-bold ${v.total <= 6 ? 'text-green-600' : v.total <= 7 ? 'text-yellow-600' : 'text-red-600'}`}>
                {v.total} ج.م/كم
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center text-[9px]">
              <div><p className="font-bold">{v.fuel}</p><p className="text-muted-foreground">وقود</p></div>
              <div><p className="font-bold">{v.maintenance}</p><p className="text-muted-foreground">صيانة</p></div>
              <div><p className="font-bold">{v.driver}</p><p className="text-muted-foreground">سائق</p></div>
              <div><p className="font-bold">{v.insurance}</p><p className="text-muted-foreground">تأمين</p></div>
              <div><p className="font-bold">{v.depreciation}</p><p className="text-muted-foreground">إهلاك</p></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
