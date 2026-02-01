import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, TrendingUp, TrendingDown, Loader2, CheckCircle2, 
  AlertTriangle, Target, Sparkles, Clock, Recycle, Award
} from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { wasteTypeLabels, isHazardousWasteType } from '@/lib/wasteClassification';
import ReactMarkdown from 'react-markdown';

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'needs_improvement';
}

const RecyclerPerformanceAdvisor = () => {
  const { organization } = useAuth();
  const { isLoading: aiLoading, generateReport } = useAIAssistant();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [processingStats, setProcessingStats] = useState({
    totalReceived: 0,
    totalProcessed: 0,
    avgProcessingTime: 0,
    hazardousPercentage: 0,
    certificatesIssued: 0,
    uniqueGenerators: 0,
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
        .select('id, waste_type, quantity, status, created_at, delivered_at, confirmed_at, generator_id')
        .eq('recycler_id', organization?.id);

      if (error) throw error;

      // Fetch certificates
      const { data: certificates } = await supabase
        .from('recycling_reports')
        .select('id')
        .eq('recycler_organization_id', organization?.id);

      if (shipments) {
        const totalReceived = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const confirmedShipments = shipments.filter(s => s.status === 'confirmed');
        const totalProcessed = confirmedShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        
        const hazardousQuantity = shipments
          .filter(s => isHazardousWasteType(s.waste_type))
          .reduce((sum, s) => sum + (s.quantity || 0), 0);

        // Calculate avg processing time
        let totalDays = 0;
        let count = 0;
        confirmedShipments.forEach(s => {
          if (s.delivered_at && s.confirmed_at) {
            const days = (new Date(s.confirmed_at).getTime() - new Date(s.delivered_at).getTime()) / (1000 * 60 * 60 * 24);
            totalDays += days;
            count++;
          }
        });

        const uniqueGenerators = new Set(shipments.map(s => s.generator_id).filter(Boolean)).size;

        const stats = {
          totalReceived,
          totalProcessed,
          avgProcessingTime: count > 0 ? totalDays / count : 0,
          hazardousPercentage: totalReceived > 0 ? (hazardousQuantity / totalReceived) * 100 : 0,
          certificatesIssued: certificates?.length || 0,
          uniqueGenerators,
        };
        setProcessingStats(stats);

        // Calculate metrics
        const processingEfficiency = totalReceived > 0 ? (totalProcessed / totalReceived) * 100 : 0;
        const certificateRate = confirmedShipments.length > 0 
          ? ((certificates?.length || 0) / confirmedShipments.length) * 100 
          : 0;

        const metricsData: PerformanceMetric[] = [
          {
            name: 'كفاءة المعالجة',
            value: processingEfficiency,
            target: 95,
            unit: '%',
            status: processingEfficiency >= 90 ? 'excellent' : processingEfficiency >= 70 ? 'good' : 'needs_improvement'
          },
          {
            name: 'سرعة المعالجة',
            value: stats.avgProcessingTime,
            target: 3,
            unit: 'يوم',
            status: stats.avgProcessingTime <= 2 ? 'excellent' : stats.avgProcessingTime <= 5 ? 'good' : 'needs_improvement'
          },
          {
            name: 'معدل إصدار الشهادات',
            value: certificateRate,
            target: 100,
            unit: '%',
            status: certificateRate >= 90 ? 'excellent' : certificateRate >= 70 ? 'good' : 'needs_improvement'
          },
          {
            name: 'تنوع الشركاء',
            value: uniqueGenerators,
            target: 10,
            unit: 'جهة',
            status: uniqueGenerators >= 10 ? 'excellent' : uniqueGenerators >= 5 ? 'good' : 'needs_improvement'
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
      organization_type: 'recycler',
      organization_name: organization?.name,
      performance_metrics: metrics.map(m => ({
        metric_name: m.name,
        current_value: m.value,
        target_value: m.target,
        unit: m.unit,
        status: m.status
      })),
      processing_stats: {
        total_received_kg: processingStats.totalReceived,
        total_processed_kg: processingStats.totalProcessed,
        avg_processing_time_days: processingStats.avgProcessingTime.toFixed(1),
        hazardous_percentage: processingStats.hazardousPercentage.toFixed(1),
        certificates_issued: processingStats.certificatesIssued,
        unique_generators: processingStats.uniqueGenerators
      },
      request: `
        بناءً على بيانات أداء منشأة التدوير، قدم تقريراً تفصيلياً يتضمن:
        1. تقييم عام لأداء المنشأة
        2. تحليل نقاط القوة والضعف
        3. توصيات محددة لتحسين كفاءة المعالجة
        4. استراتيجيات لتقليل وقت المعالجة
        5. نصائح لزيادة معدل إصدار الشهادات
        6. فرص التوسع وزيادة الشركاء
        7. أفضل الممارسات في التعامل مع المخلفات الخطرة
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
            <Recycle className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{processingStats.totalReceived.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">كجم مستلم</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{processingStats.totalProcessed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">كجم معالج</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{processingStats.avgProcessingTime.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">يوم متوسط</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{processingStats.hazardousPercentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">مخلفات خطرة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{processingStats.certificatesIssued}</p>
            <p className="text-xs text-muted-foreground">شهادة صادرة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
            <p className="text-2xl font-bold">{processingStats.uniqueGenerators}</p>
            <p className="text-xs text-muted-foreground">جهة مولدة</p>
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
            تقييم أداء منشأة التدوير مقارنة بالأهداف المحددة
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
                تحليل ذكي وتوصيات مخصصة لتحسين كفاءة التدوير
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

export default RecyclerPerformanceAdvisor;
