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
  AlertTriangle, Target, Sparkles, Clock, Recycle, Award,
  Focus, Star, Building2, Zap, Shield, Users
} from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { wasteTypeLabels, isHazardousWasteType, getWasteTypeCode } from '@/lib/wasteClassification';
import ReactMarkdown from 'react-markdown';
import { differenceInDays } from 'date-fns';
import { RadialBarChart, RadialBar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SpecializationMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'needs_improvement';
  description: string;
}

interface SpecializationData {
  primaryType: string;
  primaryName: string;
  primaryCode: string;
  primaryPercentage: number;
  primaryEfficiency: number;
  primaryProcessingTime: number;
  secondaryType: string | null;
  secondaryName: string | null;
  secondaryPercentage: number;
  isHazardous: boolean;
  uniqueGenerators: number;
  certificatesIssued: number;
}

const RecyclerPerformanceAdvisor = () => {
  const { organization } = useAuth();
  const { isLoading: aiLoading, generateReport } = useAIAssistant();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SpecializationMetric[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [specialization, setSpecialization] = useState<SpecializationData | null>(null);
  const [processingStats, setProcessingStats] = useState({
    totalReceived: 0,
    totalProcessed: 0,
    avgProcessingTime: 0,
    hazardousPercentage: 0,
    certificatesIssued: 0,
    uniqueGenerators: 0,
    specializationScore: 0,
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
            const days = differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
            totalDays += Math.max(0, days);
            count++;
          }
        });

        const uniqueGenerators = new Set(shipments.map(s => s.generator_id).filter(Boolean)).size;

        // Calculate specialization
        const wasteTypeMap: Record<string, { quantity: number; processed: number; count: number; days: number; processedCount: number }> = {};
        shipments.forEach(s => {
          if (!wasteTypeMap[s.waste_type]) {
            wasteTypeMap[s.waste_type] = { quantity: 0, processed: 0, count: 0, days: 0, processedCount: 0 };
          }
          wasteTypeMap[s.waste_type].quantity += s.quantity || 0;
          wasteTypeMap[s.waste_type].count += 1;
          if (s.status === 'confirmed') {
            wasteTypeMap[s.waste_type].processed += s.quantity || 0;
            if (s.delivered_at && s.confirmed_at) {
              wasteTypeMap[s.waste_type].days += differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
              wasteTypeMap[s.waste_type].processedCount += 1;
            }
          }
        });

        const sortedTypes = Object.entries(wasteTypeMap)
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.quantity - a.quantity);

        const primary = sortedTypes[0];
        const secondary = sortedTypes[1];

        const primaryPct = primary ? (primary.quantity / totalReceived) * 100 : 0;
        const secondaryPct = secondary ? (secondary.quantity / totalReceived) * 100 : 0;
        const specializationScore = Math.min(100, (primaryPct + secondaryPct) * 1.1);

        // Primary type unique generators
        const primaryGenerators = new Set(
          shipments.filter(s => s.waste_type === primary?.type).map(s => s.generator_id).filter(Boolean)
        ).size;

        const specializationData: SpecializationData = {
          primaryType: primary?.type || '',
          primaryName: wasteTypeLabels[primary?.type || ''] || primary?.type || '',
          primaryCode: getWasteTypeCode(primary?.type || ''),
          primaryPercentage: primaryPct,
          primaryEfficiency: primary && primary.quantity > 0 ? (primary.processed / primary.quantity) * 100 : 0,
          primaryProcessingTime: primary && primary.processedCount > 0 ? primary.days / primary.processedCount : 0,
          secondaryType: secondary?.type || null,
          secondaryName: secondary ? wasteTypeLabels[secondary.type] || secondary.type : null,
          secondaryPercentage: secondaryPct,
          isHazardous: isHazardousWasteType(primary?.type || ''),
          uniqueGenerators: primaryGenerators,
          certificatesIssued: certificates?.length || 0,
        };

        setSpecialization(specializationData);

        const stats = {
          totalReceived,
          totalProcessed,
          avgProcessingTime: count > 0 ? totalDays / count : 0,
          hazardousPercentage: totalReceived > 0 ? (hazardousQuantity / totalReceived) * 100 : 0,
          certificatesIssued: certificates?.length || 0,
          uniqueGenerators,
          specializationScore,
        };
        setProcessingStats(stats);

        // Calculate metrics focused on specialization
        const processingEfficiency = totalReceived > 0 ? (totalProcessed / totalReceived) * 100 : 0;
        const primaryEfficiency = specializationData.primaryEfficiency;
        const certificateRate = confirmedShipments.length > 0 
          ? ((certificates?.length || 0) / confirmedShipments.length) * 100 
          : 0;

        const metricsData: SpecializationMetric[] = [
          {
            name: 'مستوى التخصص',
            value: specializationScore,
            target: 85,
            unit: '%',
            status: specializationScore >= 85 ? 'excellent' : specializationScore >= 70 ? 'good' : 'needs_improvement',
            description: 'نسبة التركيز على التخصص الرئيسي والثانوي'
          },
          {
            name: 'كفاءة التخصص الرئيسي',
            value: primaryEfficiency,
            target: 95,
            unit: '%',
            status: primaryEfficiency >= 90 ? 'excellent' : primaryEfficiency >= 70 ? 'good' : 'needs_improvement',
            description: `كفاءة معالجة ${specializationData.primaryName}`
          },
          {
            name: 'سرعة المعالجة',
            value: specializationData.primaryProcessingTime,
            target: 3,
            unit: 'يوم',
            status: specializationData.primaryProcessingTime <= 2 ? 'excellent' : specializationData.primaryProcessingTime <= 5 ? 'good' : 'needs_improvement',
            description: 'متوسط وقت معالجة التخصص الرئيسي'
          },
          {
            name: 'معدل إصدار الشهادات',
            value: certificateRate,
            target: 100,
            unit: '%',
            status: certificateRate >= 90 ? 'excellent' : certificateRate >= 70 ? 'good' : 'needs_improvement',
            description: 'نسبة الشحنات المؤكدة التي صدرت لها شهادات'
          },
          {
            name: 'قاعدة الموردين',
            value: primaryGenerators,
            target: 10,
            unit: 'جهة',
            status: primaryGenerators >= 10 ? 'excellent' : primaryGenerators >= 5 ? 'good' : 'needs_improvement',
            description: 'عدد الجهات المولدة للتخصص الرئيسي'
          },
          {
            name: 'كفاءة المعالجة العامة',
            value: processingEfficiency,
            target: 95,
            unit: '%',
            status: processingEfficiency >= 90 ? 'excellent' : processingEfficiency >= 70 ? 'good' : 'needs_improvement',
            description: 'نسبة المخلفات المعالجة من إجمالي المستلم'
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
      organization_type: 'specialized_recycler',
      organization_name: organization?.name,
      specialization_focus: {
        primary_waste_type: specialization?.primaryName,
        primary_code: specialization?.primaryCode,
        primary_percentage: specialization?.primaryPercentage.toFixed(1),
        primary_efficiency: specialization?.primaryEfficiency.toFixed(1),
        primary_processing_days: specialization?.primaryProcessingTime.toFixed(1),
        is_hazardous: specialization?.isHazardous,
        secondary_waste_type: specialization?.secondaryName,
        secondary_percentage: specialization?.secondaryPercentage.toFixed(1),
        primary_generators_count: specialization?.uniqueGenerators,
      },
      performance_metrics: metrics.map(m => ({
        metric_name: m.name,
        current_value: m.value,
        target_value: m.target,
        unit: m.unit,
        status: m.status,
        description: m.description
      })),
      processing_stats: {
        total_received_kg: processingStats.totalReceived,
        total_processed_kg: processingStats.totalProcessed,
        avg_processing_time_days: processingStats.avgProcessingTime.toFixed(1),
        hazardous_percentage: processingStats.hazardousPercentage.toFixed(1),
        certificates_issued: processingStats.certificatesIssued,
        unique_generators: processingStats.uniqueGenerators,
        specialization_score: processingStats.specializationScore.toFixed(1)
      },
      request: `
        هذه منشأة تدوير متخصصة في ${specialization?.primaryName || 'نوع محدد من المخلفات'} ${specialization?.isHazardous ? '(مخلفات خطرة)' : '(مخلفات غير خطرة)'}.
        مستوى التخصص الحالي: ${processingStats.specializationScore.toFixed(0)}%
        
        قدم تقريراً تفصيلياً وتوصيات عملية تتضمن:
        1. تقييم مستوى التخصص والتركيز الحالي
        2. تحليل نقاط القوة في التخصص الرئيسي
        3. توصيات لتعميق التخصص وزيادة الكفاءة
        4. استراتيجيات لتقليل وقت المعالجة للتخصص الرئيسي
        5. فرص توسيع قاعدة الموردين للتخصص
        6. أفضل الممارسات للمنشآت المتخصصة في هذا النوع من المخلفات
        7. مقارنة بمعايير الصناعة للمنشآت المتخصصة
        ${specialization?.isHazardous ? '8. إجراءات السلامة المحسنة للمخلفات الخطرة' : ''}
        قدم التوصيات بشكل عملي وقابل للتنفيذ مع تحديد أولويات التنفيذ.
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

  // Radial data for specialization score
  const specializationRadialData = [
    { name: 'التخصص', value: processingStats.specializationScore, fill: '#10b981' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Specialization Overview Banner */}
      {specialization && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-teal-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Specialization Score Radial */}
                <div className="w-36 h-36 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%" 
                      outerRadius="100%" 
                      data={specializationRadialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        background={{ fill: 'hsl(var(--muted))' }}
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                        <tspan x="50%" dy="-0.3em" className="text-xl font-bold">{processingStats.specializationScore.toFixed(0)}%</tspan>
                        <tspan x="50%" dy="1.3em" className="text-[10px] fill-muted-foreground">تخصص</tspan>
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Specialization Info */}
                <div className="flex-1 text-center lg:text-right">
                  <div className="flex items-center justify-center lg:justify-end gap-2 mb-2">
                    <Focus className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold">منشأة تدوير متخصصة</h3>
                  </div>
                  
                  <div className="flex flex-wrap justify-center lg:justify-end gap-2 mb-3">
                    <Badge className="py-1.5 px-3 bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                      <Star className="w-3 h-3 ml-1" />
                      {specialization.primaryName}
                      <span className="mr-1 font-bold">{specialization.primaryPercentage.toFixed(0)}%</span>
                    </Badge>
                    <Badge variant="outline">{specialization.primaryCode}</Badge>
                    {specialization.isHazardous && (
                      <Badge variant="destructive" className="gap-1">
                        <Shield className="w-3 h-3" />
                        مخلفات خطرة
                      </Badge>
                    )}
                  </div>

                  {specialization.secondaryName && (
                    <p className="text-sm text-muted-foreground">
                      تخصص ثانوي: {specialization.secondaryName} ({specialization.secondaryPercentage.toFixed(0)}%)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4 text-center">
            <Recycle className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xl font-bold">{(processingStats.totalReceived / 1000).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">طن مستلم</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-xl font-bold">{(processingStats.totalProcessed / 1000).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">طن معالج</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-xl font-bold">{processingStats.avgProcessingTime.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">يوم متوسط</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-xl font-bold">{processingStats.certificatesIssued}</p>
            <p className="text-xs text-muted-foreground">شهادة صادرة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
            <p className="text-xl font-bold">{specialization?.uniqueGenerators || 0}</p>
            <p className="text-xs text-muted-foreground">مورد للتخصص</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-xl font-bold">{specialization?.primaryEfficiency.toFixed(0) || 0}%</p>
            <p className="text-xs text-muted-foreground">كفاءة التخصص</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Target className="w-5 h-5 text-primary" />
            مؤشرات أداء التخصص
          </CardTitle>
          <CardDescription className="text-right">
            تقييم أداء المنشأة في تخصصها الرئيسي مقارنة بالأهداف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span className="font-medium text-sm">{metric.name}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 text-right">{metric.description}</p>
                
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
              {aiLoading ? 'جاري التحليل...' : 'توصيات التخصص الذكية'}
            </Button>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Lightbulb className="w-5 h-5 text-primary" />
                توصيات تحسين التخصص
              </CardTitle>
              <CardDescription>
                تحليل ذكي وتوصيات مخصصة لتعميق التخصص وزيادة الكفاءة
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
