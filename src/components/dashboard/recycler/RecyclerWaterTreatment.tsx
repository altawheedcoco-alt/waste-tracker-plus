import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, AlertTriangle, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const params = [
  { name: 'pH', value: 7.2, min: 6.5, max: 8.5, status: 'ok' },
  { name: 'TSS (مواد عالقة)', value: 28, min: 0, max: 50, status: 'ok', unit: 'mg/L' },
  { name: 'BOD', value: 42, min: 0, max: 50, status: 'warning', unit: 'mg/L' },
  { name: 'COD', value: 85, min: 0, max: 100, status: 'warning', unit: 'mg/L' },
  { name: 'معادن ثقيلة', value: 0.3, min: 0, max: 1, status: 'ok', unit: 'mg/L' },
];

const RecyclerWaterTreatment = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Droplets className="h-5 w-5 text-primary" />
        مراقبة معالجة المياه
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {params.map((p, i) => {
        const pct = ((p.value - p.min) / (p.max - p.min)) * 100;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                {p.status === 'ok' ? <CheckCircle className="h-3 w-3 text-green-600" /> : <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                <span>{p.name}</span>
              </div>
              <span className="font-mono text-xs">{p.value} {p.unit || ''}</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground pt-2 border-t">
        آخر تحديث: منذ 15 دقيقة • معدل إعادة الاستخدام: 78%
      </p>
    </CardContent>
  </Card>
);

export default RecyclerWaterTreatment;
