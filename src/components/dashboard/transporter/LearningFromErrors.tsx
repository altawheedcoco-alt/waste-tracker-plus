import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const delays = [
  { pattern: 'تأخير عند بوابة المصانع (الأحد)', frequency: '78% من الرحلات', suggestion: 'تنسيق مسبق مع المصنع لحجز موعد', impact: 'high' as const },
  { pattern: 'ازدحام طريق السويس (8-10 صباحاً)', frequency: '65% من الرحلات', suggestion: 'تحويل الرحلات لقبل الساعة 7', impact: 'medium' as const },
  { pattern: 'تأخر استلام من مستشفيات', frequency: '40% من الرحلات', suggestion: 'إضافة 30 دقيقة للوقت المقدر', impact: 'low' as const },
];

const impactConfig = {
  high: { label: 'تأثير عالي', color: 'bg-red-100 text-red-800' },
  medium: { label: 'تأثير متوسط', color: 'bg-yellow-100 text-yellow-800' },
  low: { label: 'تأثير منخفض', color: 'bg-green-100 text-green-800' },
};

export default function LearningFromErrors() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-primary" />
          محرك التعلم من الأخطاء
        </CardTitle>
        <p className="text-xs text-muted-foreground">تحليل أنماط التأخير والرفض</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {delays.map((d, i) => {
          const config = impactConfig[d.impact];
          return (
            <div key={i} className="p-2.5 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{d.pattern}</span>
                <Badge variant="outline" className={`text-[9px] ${config.color}`}>{config.label}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">التكرار: {d.frequency}</p>
              <div className="p-1.5 rounded bg-primary/5 text-[10px] text-primary">
                💡 {d.suggestion}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
