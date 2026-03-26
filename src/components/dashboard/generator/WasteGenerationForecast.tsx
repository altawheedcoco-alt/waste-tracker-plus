import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

const WasteGenerationForecast = () => {
  const { organization } = useAuth();

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['waste-forecast-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const { data } = await supabase
        .from('shipments')
        .select('id, quantity, waste_type, created_at, status')
        .eq('generator_id', organization.id)
        .gte('created_at', oneYearAgo.toISOString())
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const forecast = useMemo(() => {
    if (!shipments?.length || shipments.length < 3) return null;

    // Group by month
    const monthlyMap = new Map<string, number>();
    shipments.forEach(s => {
      const month = s.created_at.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (s.quantity || 0));
    });

    const sorted = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    const values = sorted.map(([, v]) => v);

    // Simple linear regression for forecast
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    values.forEach((y, x) => {
      num += (x - xMean) * (y - yMean);
      den += (x - xMean) ** 2;
    });
    const slope = den !== 0 ? num / den : 0;
    const intercept = yMean - slope * xMean;

    // Historical + 3 months forecast
    const historicalData = sorted.map(([month, qty], i) => ({
      month: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' }),
      actual: Math.round(qty),
      forecast: null as number | null,
    }));

    const lastDate = new Date(sorted[sorted.length - 1][0] + '-01');
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      const predicted = Math.max(0, Math.round(slope * (n - 1 + i) + intercept));
      historicalData.push({
        month: futureDate.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' }),
        actual: null as any,
        forecast: predicted,
      });
    }

    const trend = slope > 0.5 ? 'increasing' : slope < -0.5 ? 'decreasing' : 'stable';
    const avgMonthly = Math.round(yMean);

    return { data: historicalData, trend, avgMonthly, slope: Math.round(slope * 10) / 10 };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[350px]" />;
  if (!forecast) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={forecast.trend === 'increasing' ? 'default' : forecast.trend === 'decreasing' ? 'destructive' : 'secondary'}>
            {forecast.trend === 'increasing' ? '📈 اتجاه صاعد' : forecast.trend === 'decreasing' ? '📉 اتجاه هابط' : '➡️ مستقر'}
          </Badge>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Brain className="w-5 h-5" />
              التنبؤ بتوليد المخلفات
            </CardTitle>
            <CardDescription>تحليل تاريخي + توقعات ٣ أشهر — متوسط شهري: {forecast.avgMonthly} طن</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={forecast.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="فعلي (طن)" connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="متوقع (طن)" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WasteGenerationForecast;
