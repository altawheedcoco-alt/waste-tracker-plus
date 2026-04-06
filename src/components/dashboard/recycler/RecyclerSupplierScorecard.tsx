import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const suppliers = [
  { name: 'شركة النيل للمخلفات', score: 92, deliveries: 48, purity: 91, trend: 'up', type: 'مولد' },
  { name: 'مصانع الدلتا', score: 85, deliveries: 35, purity: 84, trend: 'up', type: 'مولد' },
  { name: 'شركة الصعيد للنظافة', score: 71, deliveries: 22, purity: 72, trend: 'down', type: 'ناقل' },
  { name: 'مجمع سكندرية البيئي', score: 88, deliveries: 30, purity: 87, trend: 'up', type: 'مولد' },
  { name: 'شركة الوادي للنقل', score: 65, deliveries: 15, purity: 68, trend: 'down', type: 'ناقل' },
];

const RecyclerSupplierScorecard = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Users className="h-5 w-5 text-primary" />
        تقييم الموردين
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {suppliers.map((s, i) => (
        <div key={i} className="p-3 rounded-lg border bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.type} • {s.deliveries} توريد</p>
            </div>
            <div className="flex items-center gap-1">
              {s.trend === 'up' ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
              <span className="text-lg font-bold text-primary">{s.score}</span>
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">نقاء:</span>
            <Progress value={s.purity} className="flex-1 h-1.5" />
            <span className="text-xs">{s.purity}%</span>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default RecyclerSupplierScorecard;
