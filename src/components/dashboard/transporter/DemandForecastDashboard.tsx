/**
 * ٤. التنبؤ بالطلب — يربط useDemandForecaster مع Recharts
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemandForecaster } from '@/hooks/useDemandForecaster';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Brain, TrendingUp, Calendar, AlertTriangle, RefreshCw, Lightbulb } from 'lucide-react';

const DemandForecastDashboard = () => {
  const { organization } = useAuth();
  const { isForecasting, result, forecastDemand } = useDemandForecaster();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [autoLoaded, setAutoLoaded] = useState(false);

  const loadAndForecast = async () => {
    if (!organization?.id) return;
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: shipments } = await supabase
      .from('shipments')
      .select('created_at, quantity, waste_type')
      .eq('transporter_id', organization.id)
      .gte('created_at', threeMonthsAgo);

    if (!shipments?.length) return;

    // Aggregate by day
    const dailyMap = new Map<string, { count: number; weight: number }>();
    shipments.forEach(s => {
      const day = s.created_at.split('T')[0];
      const existing = dailyMap.get(day) || { count: 0, weight: 0 };
      existing.count++;
      existing.weight += s.quantity || 0;
      dailyMap.set(day, existing);
    });

    const historicalData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        shipmentCount: data.count,
        totalWeight: data.weight,
      }));

    await forecastDemand(historicalData, period);
  };

  useEffect(() => {
    if (!autoLoaded && organization?.id) {
      setAutoLoaded(true);
      loadAndForecast();
    }
  }, [organization?.id]);

  const chartData = result?.forecasts?.map(f => ({
    name: f.period,
    متوقع: f.predictedShipments,
    ثقة: Math.round(f.confidence * 100),
    ذروة: f.isPeakPeriod ? f.predictedShipments : 0,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            التنبؤ بالطلب (AI)
          </CardTitle>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">يومي</SelectItem>
                <SelectItem value="weekly">أسبوعي</SelectItem>
                <SelectItem value="monthly">شهري</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadAndForecast} disabled={isForecasting}>
              <RefreshCw className={`h-4 w-4 ml-1 ${isForecasting ? 'animate-spin' : ''}`} />
              تحليل
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isForecasting && <p className="text-sm text-center text-muted-foreground animate-pulse">جاري التنبؤ بالذكاء الاصطناعي...</p>}

        {result && (
          <>
            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground">{result.summary}</p>
              {result.trends && (
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    الاتجاه: {result.trends.overallTrend === 'increasing' ? 'تصاعدي ↑' : result.trends.overallTrend === 'decreasing' ? 'تنازلي ↓' : 'مستقر →'}
                    {result.trends.growthRate > 0 && ` (${result.trends.growthRate}%)`}
                  </span>
                </div>
              )}
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="متوقع" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ذروة" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Peak Analysis */}
            {result.peakAnalysis?.peakDays && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">أيام الذروة:</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {result.peakAnalysis.peakDays.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.resourceRecommendations?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium">توصيات الموارد</span>
                </div>
                {result.resourceRecommendations.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <span>{r.resource}: {r.action}</span>
                    <Badge variant={r.priority === 'high' ? 'destructive' : r.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px]">
                      {r.priority === 'high' ? 'عاجل' : r.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!result && !isForecasting && (
          <p className="text-center text-sm text-muted-foreground py-6">اضغط "تحليل" لبدء التنبؤ</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DemandForecastDashboard;
