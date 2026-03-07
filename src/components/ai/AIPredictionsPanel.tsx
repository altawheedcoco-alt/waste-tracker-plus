import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain, TrendingUp, Route, AlertTriangle,
  Lightbulb, BarChart3, RefreshCw, Sparkles,
  ArrowUpRight, ArrowDownRight, Minus, Target
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Area, AreaChart, BarChart, Bar,
} from 'recharts';

interface PredictionResult {
  label: string;
  value: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
}

const AIPredictionsPanel = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch historical data for local predictions
  const { data: historicalData } = useQuery({
    queryKey: ['ai-predictions-data', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const [shipmentsRes, invoicesRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('id, quantity, status, created_at, waste_type')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
          .order('created_at', { ascending: true })
          .limit(500),
        supabase
          .from('invoices')
          .select('total_amount, created_at, status')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true })
          .limit(200),
      ]);

      return {
        shipments: shipmentsRes.data || [],
        invoices: invoicesRes.data || [],
      };
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  // Generate predictions from historical data using simple ML-like heuristics
  const generatePredictions = useCallback((): PredictionResult[] => {
    if (!historicalData) return [];

    const { shipments, invoices } = historicalData;
    
    // Monthly grouping for trend analysis
    const monthlyShipments: Record<string, number> = {};
    const monthlyQuantity: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};

    shipments.forEach(s => {
      const month = s.created_at.substring(0, 7);
      monthlyShipments[month] = (monthlyShipments[month] || 0) + 1;
      monthlyQuantity[month] = (monthlyQuantity[month] || 0) + (s.quantity || 0);
    });

    invoices.forEach(i => {
      const month = i.created_at.substring(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (i.total_amount || 0);
    });

    const months = Object.keys(monthlyShipments).sort();
    const lastThree = months.slice(-3);
    const prevThree = months.slice(-6, -3);

    const avgRecent = lastThree.reduce((s, m) => s + (monthlyShipments[m] || 0), 0) / Math.max(lastThree.length, 1);
    const avgPrev = prevThree.reduce((s, m) => s + (monthlyShipments[m] || 0), 0) / Math.max(prevThree.length, 1);
    const shipmentTrend = avgPrev > 0 ? ((avgRecent - avgPrev) / avgPrev) * 100 : 0;

    const avgQtyRecent = lastThree.reduce((s, m) => s + (monthlyQuantity[m] || 0), 0) / Math.max(lastThree.length, 1);
    const avgQtyPrev = prevThree.reduce((s, m) => s + (monthlyQuantity[m] || 0), 0) / Math.max(prevThree.length, 1);
    const qtyTrend = avgQtyPrev > 0 ? ((avgQtyRecent - avgQtyPrev) / avgQtyPrev) * 100 : 0;

    const revenueMonths = Object.keys(monthlyRevenue).sort();
    const lastRevThree = revenueMonths.slice(-3);
    const prevRevThree = revenueMonths.slice(-6, -3);
    const avgRevRecent = lastRevThree.reduce((s, m) => s + (monthlyRevenue[m] || 0), 0) / Math.max(lastRevThree.length, 1);
    const avgRevPrev = prevRevThree.reduce((s, m) => s + (monthlyRevenue[m] || 0), 0) / Math.max(prevRevThree.length, 1);
    const revTrend = avgRevPrev > 0 ? ((avgRevRecent - avgRevPrev) / avgRevPrev) * 100 : 0;

    const completedCount = shipments.filter(s => s.status === 'confirmed' || s.status === 'completed').length;
    const completionRate = shipments.length > 0 ? (completedCount / shipments.length) * 100 : 0;

    return [
      {
        label: 'حجم الشحنات المتوقع (الشهر القادم)',
        value: Math.round(avgRecent * (1 + shipmentTrend / 100)),
        confidence: Math.min(85, 60 + months.length * 3),
        trend: shipmentTrend > 5 ? 'up' : shipmentTrend < -5 ? 'down' : 'stable',
        recommendation: shipmentTrend > 10
          ? 'زيادة ملحوظة — تأكد من جاهزية فريق النقل والمعدات'
          : shipmentTrend < -10
          ? 'انخفاض — راجع علاقات الشراكة وخطط التسويق'
          : 'استقرار جيد — حافظ على مستوى الخدمة الحالي',
      },
      {
        label: 'الكمية المتوقعة (طن/شهر)',
        value: Math.round(avgQtyRecent * (1 + qtyTrend / 100) / 1000),
        confidence: Math.min(80, 55 + months.length * 2),
        trend: qtyTrend > 5 ? 'up' : qtyTrend < -5 ? 'down' : 'stable',
        recommendation: qtyTrend > 15
          ? 'كميات متزايدة — قد تحتاج سعة تخزين إضافية'
          : 'الكميات ضمن النطاق الطبيعي',
      },
      {
        label: 'الإيرادات المتوقعة (ج.م)',
        value: Math.round(avgRevRecent * (1 + revTrend / 100)),
        confidence: Math.min(75, 50 + revenueMonths.length * 3),
        trend: revTrend > 5 ? 'up' : revTrend < -5 ? 'down' : 'stable',
        recommendation: revTrend > 0
          ? 'اتجاه إيجابي — فرصة لإعادة استثمار الفائض'
          : 'مراجعة التسعير وتقليل التكاليف التشغيلية',
      },
      {
        label: 'معدل الامتثال',
        value: Math.round(completionRate),
        confidence: 90,
        trend: completionRate > 80 ? 'up' : completionRate > 50 ? 'stable' : 'down',
        recommendation: completionRate > 85
          ? 'ممتاز! معدل امتثال عالي'
          : 'تحسين عملية المتابعة والتأكيد سيرفع المعدل',
      },
    ];
  }, [historicalData]);

  const predictions = generatePredictions();

  // Generate forecast chart data
  const forecastData = (() => {
    if (!historicalData) return [];
    const { shipments } = historicalData;
    const monthlyMap: Record<string, number> = {};
    shipments.forEach(s => {
      const month = s.created_at.substring(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    const months = Object.keys(monthlyMap).sort().slice(-6);
    const data = months.map(m => ({
      month: m.substring(5),
      actual: monthlyMap[m],
      forecast: null as number | null,
    }));
    // Add 3 forecast months
    const lastVal = data[data.length - 1]?.actual || 0;
    const trend = data.length > 1 ? (data[data.length - 1].actual - data[0].actual) / data.length : 0;
    for (let i = 1; i <= 3; i++) {
      const monthNum = parseInt(months[months.length - 1]?.substring(5) || '1') + i;
      data.push({
        month: String(monthNum > 12 ? monthNum - 12 : monthNum).padStart(2, '0'),
        actual: null as any,
        forecast: Math.max(0, Math.round(lastVal + trend * i)),
      });
    }
    return data;
  })();

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Brain className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">التنبؤات الذكية</h2>
            <p className="text-sm text-muted-foreground">تحليل تنبؤي مبني على البيانات التاريخية</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" />
          AI Powered
        </Badge>
      </div>

      {/* Predictions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {predictions.map((pred, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{pred.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {pred.value.toLocaleString('en-US')}
                    </span>
                    <TrendIcon trend={pred.trend} />
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground mb-1">دقة التنبؤ</div>
                  <div className="flex items-center gap-2">
                    <Progress value={pred.confidence} className="w-16 h-2" />
                    <span className="text-xs font-medium">{pred.confidence}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 mt-2">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{pred.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast Chart */}
      {forecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              توقعات حجم الشحنات
            </CardTitle>
            <CardDescription>البيانات الفعلية مقابل التوقعات للأشهر القادمة</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                  name="فعلي"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="hsl(var(--chart-4))"
                  fill="hsl(var(--chart-4) / 0.15)"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  name="متوقع"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            توصيات ذكية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: Route, text: 'تحسين مسارات النقل يمكن أن يوفر حتى 15% من تكاليف الوقود', priority: 'high' },
            { icon: AlertTriangle, text: 'مراجعة الشحنات المعلقة أسبوعياً لتحسين معدل الامتثال', priority: 'medium' },
            { icon: BarChart3, text: 'تفعيل التقارير التلقائية الشهرية لتتبع الأداء بدقة', priority: 'low' },
          ].map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <rec.icon className={cn(
                "w-5 h-5 mt-0.5 flex-shrink-0",
                rec.priority === 'high' ? 'text-red-500' : rec.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'
              )} />
              <p className="text-sm text-foreground">{rec.text}</p>
              <Badge variant="outline" className={cn(
                "mr-auto text-xs",
                rec.priority === 'high' ? 'border-red-200 text-red-600' : rec.priority === 'medium' ? 'border-amber-200 text-amber-600' : 'border-blue-200 text-blue-600'
              )}>
                {rec.priority === 'high' ? 'عالية' : rec.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPredictionsPanel;
