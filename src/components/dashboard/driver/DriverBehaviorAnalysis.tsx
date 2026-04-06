import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const drivingMetrics = [
  { label: 'السرعة الزائدة', events: 2, severity: 'low', score: 92 },
  { label: 'الفرملة المفاجئة', events: 5, severity: 'medium', score: 78 },
  { label: 'الانعطاف الحاد', events: 1, severity: 'low', score: 95 },
  { label: 'استخدام الهاتف أثناء القيادة', events: 0, severity: 'none', score: 100 },
  { label: 'تجاوز ساعات القيادة', events: 1, severity: 'high', score: 85 },
];

const DriverBehaviorAnalysis = () => {
  const overallScore = Math.round(drivingMetrics.reduce((s, m) => s + m.score, 0) / drivingMetrics.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-5 w-5 text-primary" />
          تحليل سلوك القيادة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className={`text-3xl font-bold ${overallScore >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
            {overallScore}/100
          </p>
          <p className="text-sm text-muted-foreground">درجة السلامة الإجمالية</p>
        </div>
        {drivingMetrics.map((m, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.events} مرات</span>
            </div>
            <Progress value={m.score} className={`h-1.5 ${m.score < 80 ? '[&>div]:bg-yellow-500' : ''}`} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DriverBehaviorAnalysis;
