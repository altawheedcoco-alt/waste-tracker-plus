import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  RefreshCw,
  Zap,
  Clock
} from 'lucide-react';
import { useDemandForecaster } from '@/hooks/useDemandForecaster';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, format } from 'date-fns';

const DemandForecastPanel = () => {
  const { isForecasting, result, error, forecastDemand, clearResults } = useDemandForecaster();
  const [forecastPeriod, setForecastPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const { user } = useAuth();

  // جلب البيانات التاريخية الفعلية من قاعدة البيانات
  useEffect(() => {
    const fetchHistorical = async () => {
      if (!user) return;
      const fromDate = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from('shipments')
        .select('created_at, actual_weight, client_total')
        .gte('created_at', fromDate)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const grouped = new Map<string, { count: number; weight: number; revenue: number }>();
        data.forEach(s => {
          const day = format(new Date(s.created_at!), 'yyyy-MM-dd');
          const prev = grouped.get(day) || { count: 0, weight: 0, revenue: 0 };
          grouped.set(day, {
            count: prev.count + 1,
            weight: prev.weight + (s.actual_weight || 0),
            revenue: prev.revenue + (s.client_total || 0),
          });
        });
        setHistoricalData(Array.from(grouped.entries()).map(([date, v]) => ({
          date,
          shipmentCount: v.count,
          totalWeight: v.weight,
          totalRevenue: v.revenue,
        })));
      } else {
        // بيانات أولية تقديرية بناءً على حجم المنصة
        const last7 = Array.from({ length: 7 }, (_, i) => ({
          date: format(subDays(new Date(), 7 - i), 'yyyy-MM-dd'),
          shipmentCount: 0,
          totalWeight: 0,
          totalRevenue: 0,
        }));
        setHistoricalData(last7);
      }
    };
    fetchHistorical();
  }, [user]);

  const handleForecast = () => {
    forecastDemand(historicalData.length > 0 ? historicalData : [{ date: format(new Date(), 'yyyy-MM-dd'), shipmentCount: 0, totalWeight: 0, totalRevenue: 0 }], forecastPeriod);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'نمو';
      case 'decreasing':
        return 'انخفاض';
      default:
        return 'مستقر';
    }
  };

  const chartData = result?.forecasts?.map((f, i) => ({
    name: f.period,
    predicted: f.predictedShipments,
    isPeak: f.isPeakPeriod
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">توقع الطلب الذكي</CardTitle>
                <p className="text-sm text-muted-foreground">
                  التنبؤ بحجم الشحنات والطلب المستقبلي
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(e.target.value as any)}
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
              </select>
              <Button onClick={handleForecast} disabled={isForecasting}>
                {isForecasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                    جاري التنبؤ...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 ml-2" />
                    إنشاء التنبؤات
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isForecasting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isForecasting && (
        <>
          {/* Trends Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الاتجاه العام</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getTrendIcon(result.trends?.overallTrend || 'stable')}
                      <span className="font-bold">{getTrendLabel(result.trends?.overallTrend || 'stable')}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`text-2xl font-bold ${(result.trends?.growthRate || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(result.trends?.growthRate || 0) >= 0 ? '+' : ''}{result.trends?.growthRate || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">فترات الذروة</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="font-bold">{result.peakAnalysis?.peakDays?.length || 0} أيام</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.peakAnalysis?.peakDays?.slice(0, 2).join('، ')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">عدد التنبؤات</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span className="font-bold">{result.forecasts?.length || 0} فترة</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Forecast Chart */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توقعات الشحنات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="predicted" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary)/0.2)" 
                          name="الشحنات المتوقعة"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Forecasts Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تفاصيل التنبؤات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3">الفترة</th>
                        <th className="text-center py-2 px-3">الشحنات</th>
                        <th className="text-center py-2 px-3">الوزن</th>
                        <th className="text-center py-2 px-3">الثقة</th>
                        <th className="text-center py-2 px-3">ذروة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.forecasts?.map((forecast, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">{forecast.period}</td>
                          <td className="py-2 px-3 text-center">{forecast.predictedShipments}</td>
                          <td className="py-2 px-3 text-center">{forecast.predictedWeight || '-'} طن</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant="outline">{forecast.confidence}%</Badge>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {forecast.isPeakPeriod ? (
                              <Zap className="w-4 h-4 text-orange-500 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resource Recommendations */}
          {result.resourceRecommendations && result.resourceRecommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توصيات الموارد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.resourceRecommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium">{rec.resource}</span>
                        <p className="text-sm text-muted-foreground">{rec.action}</p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          rec.priority === 'high' ? 'border-red-500 text-red-500' :
                          rec.priority === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-green-500 text-green-500'
                        }
                      >
                        {rec.priority === 'high' ? 'عالي' : rec.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Summary */}
          {result.summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-sm">{result.summary}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isForecasting && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">ابدأ التنبؤ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط على "إنشاء التنبؤات" للحصول على توقعات الطلب المستقبلي
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DemandForecastPanel;
