import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Activity, Target, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrendAnalysisChartProps {
  organizationId: string | null;
  dateRange: {
    from: Date;
    to: Date;
  };
  wasteTypes?: string[];
}

const TrendAnalysisChart = ({ 
  organizationId, 
  dateRange,
  wasteTypes = []
}: TrendAnalysisChartProps) => {
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['trend-analysis', organizationId, dateRange.from, dateRange.to, wasteTypes],
    queryFn: async () => {
      if (!organizationId) return { data: [], stats: null };

      const { data } = await supabase
        .from('shipments')
        .select('id, quantity, status, created_at, waste_type')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      let shipments = data || [];
      
      // Filter by waste types if specified
      if (wasteTypes.length > 0) {
        shipments = shipments.filter(s => wasteTypes.includes(s.waste_type || ''));
      }
      const daysDiff = differenceInDays(dateRange.to, dateRange.from);
      let intervals: Date[];
      let formatPattern: string;

      if (daysDiff <= 14) {
        intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        formatPattern = 'dd/MM';
      } else if (daysDiff <= 90) {
        intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
        formatPattern = 'dd MMM';
      } else {
        intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
        formatPattern = 'MMM yyyy';
      }

      let cumulativeQuantity = 0;
      let cumulativeCount = 0;

      const chartData = intervals.map((date) => {
        const periodEnd = daysDiff <= 14 
          ? new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
          : daysDiff <= 90
            ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
            : new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const periodShipments = shipments.filter(s => {
          const shipmentDate = new Date(s.created_at);
          return shipmentDate >= date && shipmentDate <= periodEnd;
        });

        const periodQuantity = periodShipments.reduce((acc, s) => acc + (s.quantity || 0), 0);
        const periodCount = periodShipments.length;
        const confirmedCount = periodShipments.filter(s => s.status === 'confirmed').length;

        cumulativeQuantity += periodQuantity;
        cumulativeCount += periodCount;

        return {
          name: format(date, formatPattern, { locale: ar }),
          quantity: periodQuantity,
          count: periodCount,
          confirmed: confirmedCount,
          cumulativeQuantity,
          cumulativeCount,
          completionRate: periodCount > 0 ? Math.round((confirmedCount / periodCount) * 100) : 0,
        };
      });

      // Calculate trend statistics
      const values = chartData.map(d => d.quantity);
      const avgQuantity = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const maxQuantity = Math.max(...values, 0);
      const minQuantity = Math.min(...values.filter(v => v > 0), 0);

      // Simple linear regression for trend
      const n = values.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      values.forEach((y, x) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      });
      const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
      const trend = slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable';

      return {
        data: chartData,
        stats: {
          avgQuantity: Math.round(avgQuantity),
          maxQuantity,
          minQuantity: minQuantity === Infinity ? 0 : minQuantity,
          trend,
          growthRate: values[0] > 0 
            ? Math.round(((values[values.length - 1] - values[0]) / values[0]) * 100) 
            : 0,
        },
      };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            تحليل الاتجاهات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('en-US')}
              {entry.dataKey === 'quantity' || entry.dataKey === 'cumulativeQuantity' ? ' كجم' : ''}
              {entry.dataKey === 'completionRate' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const stats = trendData?.stats;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            تحليل الاتجاهات
          </CardTitle>
          {stats && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={stats.trend === 'up' ? 'default' : stats.trend === 'down' ? 'destructive' : 'secondary'}>
                {stats.trend === 'up' ? '↑ نمو' : stats.trend === 'down' ? '↓ تراجع' : '→ مستقر'}
                {' '}{stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
              </Badge>
              <Badge variant="outline">
                المتوسط: {stats.avgQuantity.toLocaleString('en-US')} كجم
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quantity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quantity">الكمية</TabsTrigger>
            <TabsTrigger value="cumulative">التراكمي</TabsTrigger>
            <TabsTrigger value="performance">الأداء</TabsTrigger>
          </TabsList>

          <TabsContent value="quantity">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData?.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {stats && (
                  <ReferenceLine 
                    y={stats.avgQuantity} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    label={{ value: 'المتوسط', position: 'insideTopRight', fontSize: 12 }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="quantity"
                  name="الكمية (كجم)"
                  stroke="hsl(var(--primary))"
                  fill="url(#quantityGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="cumulative">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData?.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulativeQuantity"
                  name="الكمية التراكمية (كجم)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeCount"
                  name="عدد الشحنات التراكمي"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="performance">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData?.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={80} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  label={{ value: 'الهدف 80%', position: 'insideTopRight', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="completionRate"
                  name="معدل الإنجاز (%)"
                  stroke="#10b981"
                  fill="url(#completionGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysisChart;
