import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, TrendingUp, Loader2, CheckCircle2, 
  AlertTriangle, Target, Sparkles, Clock, Truck, Users, Route, Package
} from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import ReactMarkdown from 'react-markdown';

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'needs_improvement';
}

const TransporterPerformanceAdvisor = () => {
  const { organization } = useAuth();
  const { isLoading: aiLoading, generateReport } = useAIAssistant();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [transportStats, setTransportStats] = useState({
    totalShipments: 0,
    completedShipments: 0,
    avgDeliveryTime: 0,
    onTimeRate: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    uniquePartners: 0,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchPerformanceData();
    }
  }, [organization?.id]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, status, approved_at, delivered_at, expected_delivery_date, generator_id, recycler_id')
        .eq('transporter_id', organization?.id);

      // Fetch drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, is_available')
        .eq('organization_id', organization?.id);

      if (error) throw error;

      if (shipments) {
        const completedStatuses = ['delivered', 'confirmed'];
        const completedShipments = shipments.filter(s => completedStatuses.includes(s.status));

        // Calculate avg delivery time and on-time rate
        let totalDays = 0;
        let deliveryCount = 0;
        let onTimeCount = 0;

        completedShipments.forEach(s => {
          if (s.approved_at && s.delivered_at) {
            const days = (new Date(s.delivered_at).getTime() - new Date(s.approved_at).getTime()) / (1000 * 60 * 60 * 24);
            totalDays += days;
            deliveryCount++;

            if (s.expected_delivery_date) {
              if (new Date(s.delivered_at) <= new Date(s.expected_delivery_date)) {
                onTimeCount++;
              }
            } else {
              onTimeCount++;
            }
          }
        });

        // Unique partners
        const partners = new Set([
          ...shipments.map(s => s.generator_id).filter(Boolean),
          ...shipments.map(s => s.recycler_id).filter(Boolean)
        ]);

        const stats = {
          totalShipments: shipments.length,
          completedShipments: completedShipments.length,
          avgDeliveryTime: deliveryCount > 0 ? totalDays / deliveryCount : 0,
          onTimeRate: deliveryCount > 0 ? (onTimeCount / deliveryCount) * 100 : 0,
          totalDrivers: drivers?.length || 0,
          activeDrivers: drivers?.filter(d => d.is_available).length || 0,
          uniquePartners: partners.size,
        };
        setTransportStats(stats);

        // Calculate metrics
        const completionRate = shipments.length > 0 ? (completedShipments.length / shipments.length) * 100 : 0;
        const driverUtilization = stats.totalDrivers > 0 ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0;

        const metricsData: PerformanceMetric[] = [
          {
            name: 'معدل إتمام الشحنات',
            value: completionRate,
            target: 95,
            unit: '%',
            status: completionRate >= 90 ? 'excellent' : completionRate >= 70 ? 'good' : 'needs_improvement'
          },
          {
            name: 'التسليم في الموعد',
            value: stats.onTimeRate,
            target: 95,
            unit: '%',
            status: stats.onTimeRate >= 90 ? 'excellent' : stats.onTimeRate >= 75 ? 'good' : 'needs_improvement'
          },
          {
            name: 'سرعة التسليم',
            value: stats.avgDeliveryTime,
            target: 2,
            unit: 'يوم',
            status: stats.avgDeliveryTime <= 2 ? 'excellent' : stats.avgDeliveryTime <= 4 ? 'good' : 'needs_improvement'
          },
          {
            name: 'استخدام السائقين',
            value: driverUtilization,
            target: 80,
            unit: '%',
            status: driverUtilization >= 70 ? 'excellent' : driverUtilization >= 50 ? 'good' : 'needs_improvement'
          },
        ];
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    const analysisData = {
      organization_type: 'transporter',
      organization_name: organization?.name,
      performance_metrics: metrics.map(m => ({
        metric_name: m.name,
        current_value: m.value,
        target_value: m.target,
        unit: m.unit,
        status: m.status
      })),
      transport_stats: {
        total_shipments: transportStats.totalShipments,
        completed_shipments: transportStats.completedShipments,
        avg_delivery_time_days: transportStats.avgDeliveryTime.toFixed(1),
        on_time_rate: transportStats.onTimeRate.toFixed(1),
        total_drivers: transportStats.totalDrivers,
        active_drivers: transportStats.activeDrivers,
        unique_partners: transportStats.uniquePartners
      },
      request: `
        بناءً على بيانات أداء شركة النقل، قدم تقريراً تفصيلياً يتضمن:
        1. تقييم عام لأداء الشركة
        2. تحليل نقاط القوة والضعف
        3. استراتيجيات لتحسين سرعة التسليم
        4. توصيات لزيادة معدل التسليم في الموعد
        5. نصائح لتحسين إدارة السائقين
        6. فرص التوسع وزيادة الجهات المرتبطة
        7. أفضل الممارسات في نقل المخلفات الخطرة
        قدم التوصيات بشكل عملي وقابل للتنفيذ.
      `
    };

    const result = await generateReport(analysisData);
    if (result) {
      setAiRecommendations(result);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-amber-500';
      default: return 'text-red-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'good': return <Target className="w-5 h-5 text-amber-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      default: return 'يحتاج تحسين';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{transportStats.totalShipments}</p>
            <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{transportStats.completedShipments}</p>
            <p className="text-xs text-muted-foreground">شحنة مكتملة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{transportStats.avgDeliveryTime.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">يوم متوسط</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4 text-center">
            <Route className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">{transportStats.onTimeRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">بالموعد</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{transportStats.activeDrivers}/{transportStats.totalDrivers}</p>
            <p className="text-xs text-muted-foreground">سائق</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
            <p className="text-2xl font-bold">{transportStats.uniquePartners}</p>
            <p className="text-xs text-muted-foreground">شريك</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Target className="w-5 h-5 text-primary" />
            مؤشرات الأداء الرئيسية
          </CardTitle>
          <CardDescription className="text-right">
            تقييم أداء شركة النقل مقارنة بالأهداف المحددة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border bg-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={metric.status === 'excellent' ? 'default' : metric.status === 'good' ? 'secondary' : 'destructive'}>
                    {getStatusLabel(metric.status)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <span className="font-medium">{metric.name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">الهدف: {metric.target} {metric.unit}</span>
                    <span className={`font-bold ${getStatusColor(metric.status)}`}>
                      {metric.value.toFixed(1)} {metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((metric.value / metric.target) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={handleGetRecommendations}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'جاري التحليل...' : 'توصيات ذكية'}
            </Button>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Lightbulb className="w-5 h-5 text-primary" />
                توصيات تحسين الأداء
              </CardTitle>
              <CardDescription>
                تحليل ذكي وتوصيات مخصصة لتحسين كفاءة النقل
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {aiRecommendations && (
          <CardContent>
            <div className="p-4 rounded-xl bg-muted/50 border border-border prose prose-sm dark:prose-invert max-w-none text-right">
              <ReactMarkdown>{aiRecommendations}</ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TransporterPerformanceAdvisor;
