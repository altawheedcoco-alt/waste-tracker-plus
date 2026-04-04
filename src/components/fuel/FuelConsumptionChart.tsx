import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { BudgetForecast } from '@/hooks/useFuelCalculations';

interface Props {
  forecast: BudgetForecast;
}

const FuelConsumptionChart = ({ forecast }: Props) => {
  const data = forecast.monthlyHistory.slice(-6).map(m => ({
    month: m.month.slice(5),
    liters: Math.round(m.liters),
    cost: Math.round(m.cost),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          استهلاك الوقود الشهري
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-[10px]" />
              <YAxis className="text-[10px]" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number, name: string) => [v.toLocaleString('ar-EG'), name === 'liters' ? 'لتر' : 'ج.م']}
              />
              <Legend formatter={(v) => v === 'liters' ? 'لترات' : 'تكلفة (ج.م)'} />
              <Bar dataKey="liters" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelConsumptionChart;
