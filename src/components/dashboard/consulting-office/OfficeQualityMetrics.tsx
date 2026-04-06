/**
 * مقاييس الجودة للمكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Target, Clock, FileCheck, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const metrics = [
  { label: 'نسبة التسليم في الموعد', value: 92, target: 95, icon: Clock },
  { label: 'جودة التقارير (تقييم العملاء)', value: 88, target: 90, icon: FileCheck },
  { label: 'معدل قبول التقارير من أول مراجعة', value: 78, target: 85, icon: Target },
  { label: 'رضا العملاء الإجمالي', value: 91, target: 90, icon: Award },
];

const OfficeQualityMetrics = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        مؤشرات الجودة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {metrics.map((m, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <m.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{m.label}</span>
            </div>
            <span className={`text-xs font-bold ${m.value >= m.target ? 'text-green-600' : 'text-amber-600'}`}>
              {m.value}%
            </span>
          </div>
          <div className="relative">
            <Progress value={m.value} className="h-1.5" />
            <div
              className="absolute top-0 h-1.5 w-0.5 bg-red-500 rounded"
              style={{ left: `${m.target}%` }}
              title={`الهدف: ${m.target}%`}
            />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeQualityMetrics;
