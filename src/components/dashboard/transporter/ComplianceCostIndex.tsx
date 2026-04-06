import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';

const costs = [
  { category: 'رسوم التراخيص', amount: 45000, percentage: 30 },
  { category: 'التدريبات الإلزامية', amount: 22000, percentage: 15 },
  { category: 'معدات السلامة', amount: 18000, percentage: 12 },
  { category: 'التأمين', amount: 35000, percentage: 23 },
  { category: 'الفحوصات الفنية', amount: 12000, percentage: 8 },
  { category: 'رسوم أخرى', amount: 18000, percentage: 12 },
];

export default function ComplianceCostIndex() {
  const total = costs.reduce((s, c) => s + c.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-primary" />
          مؤشر تكلفة الامتثال
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-primary/5 border">
          <p className="text-xs text-muted-foreground">التكلفة السنوية الإجمالية</p>
          <p className="text-2xl font-bold text-primary">{total.toLocaleString('ar-EG')} ج.م</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-yellow-600">
            <TrendingUp className="w-3 h-3" /> +8% عن العام السابق
          </div>
        </div>

        <div className="space-y-1.5">
          {costs.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs">{c.category}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.percentage}%` }} />
                </div>
                <span className="text-xs font-medium w-16 text-left">{c.amount.toLocaleString('ar-EG')}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
