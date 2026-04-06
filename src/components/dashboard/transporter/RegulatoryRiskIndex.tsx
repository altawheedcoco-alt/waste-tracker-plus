import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Trend = 'up' | 'down' | 'stable';
type Impact = 'high' | 'medium' | 'low';
const riskFactors: { factor: string; impact: Impact; trend: Trend; description: string }[] = [
  { factor: 'تعديل لائحة نقل المخلفات الخطرة', impact: 'high', trend: 'up', description: 'قد يتطلب تصاريح إضافية' },
  { factor: 'زيادة رسوم التراخيص السنوية', impact: 'medium', trend: 'up', description: 'زيادة متوقعة 15%' },
  { factor: 'اشتراطات GPS جديدة', impact: 'low', trend: 'stable', description: 'متوافق حالياً' },
  { factor: 'تحديث معايير الحاويات', impact: 'medium', trend: 'up', description: 'قد يتطلب استبدال حاويات' },
];

const impactColors = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };
const impactLabels = { high: 'مرتفع', medium: 'متوسط', low: 'منخفض' };
const TrendIcon: Record<string, typeof TrendingUp> = { up: TrendingUp, down: TrendingDown, stable: Minus };

export default function RegulatoryRiskIndex() {
  const overallRisk = 72;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="w-5 h-5 text-primary" />
          مؤشر المخاطر التنظيمية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{overallRisk}/100</div>
          <p className="text-xs text-yellow-600">مستوى المخاطر: متوسط-مرتفع</p>
        </div>

        <div className="space-y-2">
          {riskFactors.map((rf, i) => {
            const Trend = TrendIcon[rf.trend];
            return (
              <div key={i} className="p-2.5 rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{rf.factor}</span>
                  <div className="flex items-center gap-1.5">
                    <Trend className={`w-3.5 h-3.5 ${rf.trend === 'up' ? 'text-red-500' : rf.trend === 'down' ? 'text-green-500' : 'text-gray-400'}`} />
                    <Badge variant="outline" className={`text-[10px] ${impactColors[rf.impact]}`}>{impactLabels[rf.impact]}</Badge>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{rf.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
