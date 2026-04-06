import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';

const metrics = [
  { label: 'تكلفة شراء الخام', value: '1,250,000 ج.م', type: 'cost' },
  { label: 'تكلفة التشغيل', value: '580,000 ج.م', type: 'cost' },
  { label: 'تكلفة العمالة', value: '320,000 ج.م', type: 'cost' },
  { label: 'إيرادات المبيعات', value: '3,150,000 ج.م', type: 'revenue' },
  { label: 'صافي الربح', value: '1,000,000 ج.م', type: 'profit' },
  { label: 'هامش الربح', value: '31.7%', type: 'ratio' },
  { label: 'ROI الشهري', value: '46.5%', type: 'ratio' },
  { label: 'نقطة التعادل', value: '2,150,000 ج.م', type: 'breakeven' },
];

const RecyclerROICalculator = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Calculator className="h-5 w-5 text-primary" />
        حاسبة العائد على الاستثمار
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <span className="text-sm text-muted-foreground">{m.label}</span>
          <span className={`text-sm font-bold ${
            m.type === 'revenue' || m.type === 'profit' ? 'text-green-600' :
            m.type === 'cost' ? 'text-destructive' : 'text-primary'
          }`}>
            {m.value}
          </span>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerROICalculator;
