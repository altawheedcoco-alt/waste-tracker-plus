import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, DollarSign, Truck, Users, Shield, Heart } from 'lucide-react';

const healthMetrics = [
  { category: 'مالي', score: 82, icon: DollarSign, details: 'هامش ربح 22% — تدفق نقدي إيجابي' },
  { category: 'تشغيلي', score: 78, icon: Truck, details: 'استغلال أسطول 72% — معدل تأخير 8%' },
  { category: 'امتثال', score: 91, icon: Shield, details: '95% تراخيص سارية — 1 تحذير' },
  { category: 'موارد بشرية', score: 85, icon: Users, details: 'معدل دوران 5% — رضا 4.2/5' },
  { category: 'عملاء', score: 88, icon: Heart, details: 'NPS 72 — 0 شكاوى مفتوحة' },
];

const getColor = (s: number) => s >= 85 ? 'text-green-600' : s >= 70 ? 'text-yellow-600' : 'text-red-600';
const getBg = (s: number) => s >= 85 ? 'bg-green-100 text-green-800' : s >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

export default function CorporateHealthReport() {
  const overall = Math.round(healthMetrics.reduce((s, m) => s + m.score, 0) / healthMetrics.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-primary" />
          تقرير الصحة المؤسسية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-primary/5 border">
          <p className="text-xs text-muted-foreground">الدرجة الإجمالية</p>
          <p className={`text-3xl font-bold ${getColor(overall)}`}>{overall}/100</p>
          <Badge variant="outline" className={getBg(overall)}>
            {overall >= 85 ? 'ممتاز' : overall >= 70 ? 'جيد' : 'يحتاج تحسين'}
          </Badge>
        </div>

        <div className="space-y-1.5">
          {healthMetrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{m.category}</span>
                    <span className={`text-sm font-bold ${getColor(m.score)}`}>{m.score}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate">{m.details}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
