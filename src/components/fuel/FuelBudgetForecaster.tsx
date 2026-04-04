import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BudgetForecast } from '@/hooks/useFuelCalculations';

interface Props {
  forecast: BudgetForecast;
}

const TREND_CONFIG = {
  up: { icon: TrendingUp, label: 'ارتفاع', color: 'text-destructive' },
  stable: { icon: Minus, label: 'مستقر', color: 'text-primary' },
  down: { icon: TrendingDown, label: 'انخفاض', color: 'text-green-600 dark:text-green-400' },
};

const FuelBudgetForecaster = ({ forecast }: Props) => {
  const trend = TREND_CONFIG[forecast.trend];
  const TrendIcon = trend.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          تنبؤ ميزانية الشهر القادم
          <Badge variant="secondary" className="text-[10px] mr-auto">ثقة {forecast.confidence}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xl font-bold text-primary">{forecast.nextMonthCost.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">ج.م متوقعة</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-xl font-bold">{forecast.nextMonthLiters.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">لتر متوقع</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trend.color}`} />
          <span className={`text-xs font-medium ${trend.color}`}>الاتجاه: {trend.label}</span>
          <Progress value={forecast.confidence} className="h-1.5 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
};

export default FuelBudgetForecaster;
