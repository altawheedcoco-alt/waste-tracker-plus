import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const budget = [
  { department: 'الوقود', planned: 50000, actual: 55000 },
  { department: 'الصيانة', planned: 25000, actual: 22000 },
  { department: 'الرواتب', planned: 80000, actual: 80000 },
  { department: 'التأمين', planned: 15000, actual: 15000 },
  { department: 'التراخيص', planned: 10000, actual: 12000 },
];

export default function OperationalBudget() {
  const totalPlanned = budget.reduce((s, b) => s + b.planned, 0);
  const totalActual = budget.reduce((s, b) => s + b.actual, 0);
  const overBudget = totalActual > totalPlanned;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-primary" />
          الميزانية التشغيلية
        </CardTitle>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">المخطط: {totalPlanned.toLocaleString()}</span>
          <span className={overBudget ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
            الفعلي: {totalActual.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {budget.map((b, i) => {
          const usage = Math.round((b.actual / b.planned) * 100);
          const over = b.actual > b.planned;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{b.department}</span>
                <span className={over ? 'text-red-600 font-bold' : 'text-green-600'}>
                  {b.actual.toLocaleString()} / {b.planned.toLocaleString()}
                </span>
              </div>
              <Progress value={Math.min(usage, 100)} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
