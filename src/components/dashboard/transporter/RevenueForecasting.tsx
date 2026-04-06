import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Brain, Calendar } from 'lucide-react';

interface RevenueForcast {
  month: string;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

const MOCK_FORECASTS: RevenueForcast[] = [
  { month: 'أبريل 2026', predicted: 285000, confidence: 92, trend: 'up', factors: ['زيادة عقود المولدين', 'موسم البناء'] },
  { month: 'مايو 2026', predicted: 310000, confidence: 85, trend: 'up', factors: ['عقد جديد مع مصنع X', 'ارتفاع الطلب الصيفي'] },
  { month: 'يونيو 2026', predicted: 295000, confidence: 78, trend: 'down', factors: ['إجازات صيفية', 'صيانة مخطط للأسطول'] },
  { month: 'يوليو 2026', predicted: 320000, confidence: 72, trend: 'up', factors: ['عودة النشاط', 'توسعة الأسطول المتوقعة'] },
];

export default function RevenueForecasting() {
  const totalPredicted = MOCK_FORECASTS.reduce((s, f) => s + f.predicted, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          توقعات الإيرادات بالذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
          <p className="text-xs text-muted-foreground">إجمالي الإيرادات المتوقعة (4 أشهر)</p>
          <p className="text-2xl font-bold text-primary">{totalPredicted.toLocaleString()} ج.م</p>
        </div>

        <div className="space-y-3">
          {MOCK_FORECASTS.map((forecast, idx) => (
            <div key={idx} className="p-3 border rounded-lg hover:bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {forecast.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                  )}
                  <span className="text-sm font-bold text-primary">{forecast.predicted.toLocaleString()} ج.م</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-sm font-medium">{forecast.month}</span>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px]">ثقة: {forecast.confidence}%</Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {forecast.factors.map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{f}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
