import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

const benchmarks = [
  { metric: 'تكلفة الكيلومتر', yours: 6.2, industry: 5.8, lastMonth: 6.5, trend: 'improving' as const },
  { metric: 'معدل التأخير', yours: 8, industry: 12, lastMonth: 10, trend: 'improving' as const },
  { metric: 'استغلال الأسطول', yours: 72, industry: 78, lastMonth: 68, trend: 'improving' as const },
  { metric: 'رضا العملاء', yours: 4.5, industry: 4.2, lastMonth: 4.3, trend: 'improving' as const },
  { metric: 'هامش الربح', yours: 22, industry: 25, lastMonth: 20, trend: 'improving' as const },
];

export default function BenchmarkingEngine() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-5 h-5 text-primary" />
          المقارنة المعيارية
        </CardTitle>
        <p className="text-xs text-muted-foreground">أداؤك vs متوسط القطاع</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {benchmarks.map((b, i) => {
          const better = b.metric === 'تكلفة الكيلومتر' || b.metric === 'معدل التأخير'
            ? b.yours < b.industry
            : b.yours > b.industry;
          return (
            <div key={i} className="p-2 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{b.metric}</span>
                <Badge variant="outline" className={`text-[9px] ${better ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {better ? 'أفضل من القطاع' : 'أقل من القطاع'}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div><p className="font-bold text-primary">{b.yours}</p><p className="text-muted-foreground">أنت</p></div>
                <div><p className="font-bold">{b.industry}</p><p className="text-muted-foreground">القطاع</p></div>
                <div>
                  <p className="font-bold flex items-center justify-center gap-0.5">
                    <TrendingUp className="w-3 h-3 text-green-500" /> {b.lastMonth}
                  </p>
                  <p className="text-muted-foreground">الشهر السابق</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
