import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Brain,
  Eye,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  Package,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Zap,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  Flame,
  Snowflake,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

// Types
interface InsightItem {
  id: string;
  type: 'prediction' | 'behavior' | 'issue' | 'recommendation';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  confidence: number;
  data?: any;
  actionable?: string;
  icon: any;
}

interface PartnerBehavior {
  id: string;
  name: string;
  type: string;
  activityScore: number;
  reliabilityScore: number;
  trend: 'up' | 'down' | 'stable';
  shipmentsCount: number;
  avgDeliveryTime: number;
  issuesCount: number;
}

export default function SmartInsights() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<InsightItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all necessary data
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['smart-insights-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          generator:organizations!shipments_generator_id_fkey(id, name, organization_type),
          transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type),
          recycler:organizations!shipments_recycler_id_fkey(id, name, organization_type)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['smart-insights-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['smart-insights-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*, profile:profiles(full_name)');
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const last30Days = subDays(now, 30);
    const last7Days = subDays(now, 7);

    const recentShipments = shipments.filter(s => new Date(s.created_at) >= last30Days);
    const weekShipments = shipments.filter(s => new Date(s.created_at) >= last7Days);

    // Status distribution
    const statusCounts = shipments.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Waste type distribution
    const wasteTypeCounts = shipments.reduce((acc, s) => {
      acc[s.waste_type] = (acc[s.waste_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate delivery times
    const deliveredShipments = shipments.filter(s => s.status === 'delivered' && s.delivered_at && s.created_at);
    const avgDeliveryTime = deliveredShipments.length > 0
      ? deliveredShipments.reduce((sum, s) => {
          return sum + differenceInDays(new Date(s.delivered_at), new Date(s.created_at));
        }, 0) / deliveredShipments.length
      : 0;

    // Delayed shipments
    const delayedCount = shipments.filter(s => 
      s.expected_delivery_date && 
      new Date(s.expected_delivery_date) < now && 
      !['delivered', 'confirmed', 'cancelled'].includes(s.status)
    ).length;

    // Growth rate
    const previousWeekShipments = shipments.filter(s => {
      const date = new Date(s.created_at);
      return date >= subDays(last7Days, 7) && date < last7Days;
    });
    const growthRate = previousWeekShipments.length > 0 
      ? ((weekShipments.length - previousWeekShipments.length) / previousWeekShipments.length) * 100 
      : 0;

    return {
      totalShipments: shipments.length,
      recentShipments: recentShipments.length,
      weekShipments: weekShipments.length,
      statusCounts,
      wasteTypeCounts,
      avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
      delayedCount,
      growthRate: Math.round(growthRate),
      totalOrganizations: organizations.length,
      totalDrivers: drivers.length,
      completionRate: shipments.length > 0 
        ? Math.round((statusCounts['delivered'] || 0) / shipments.length * 100)
        : 0,
    };
  }, [shipments, organizations, drivers]);

  // Partner behavior analysis
  const partnerBehaviors = useMemo((): PartnerBehavior[] => {
    return organizations.map(org => {
      const orgShipments = shipments.filter(s => 
        s.generator_id === org.id || s.transporter_id === org.id || s.recycler_id === org.id
      );
      
      const deliveredShipments = orgShipments.filter(s => s.status === 'delivered');
      const delayedShipments = orgShipments.filter(s => 
        s.expected_delivery_date && 
        new Date(s.expected_delivery_date) < new Date() &&
        !['delivered', 'confirmed', 'cancelled'].includes(s.status)
      );

      const avgDeliveryTime = deliveredShipments.length > 0
        ? deliveredShipments.reduce((sum, s) => {
            if (s.delivered_at && s.created_at) {
              return sum + differenceInDays(new Date(s.delivered_at), new Date(s.created_at));
            }
            return sum;
          }, 0) / deliveredShipments.length
        : 0;

      // Activity score based on recent shipments
      const recentOrgShipments = orgShipments.filter(s => 
        new Date(s.created_at) >= subDays(new Date(), 30)
      );
      const activityScore = Math.min(100, (recentOrgShipments.length / 5) * 100);

      // Reliability score based on completion and delays
      const reliabilityScore = orgShipments.length > 0
        ? Math.max(0, 100 - (delayedShipments.length / orgShipments.length * 50) - (avgDeliveryTime > 5 ? 20 : 0))
        : 50;

      // Trend based on recent activity
      const last7DaysShipments = orgShipments.filter(s => 
        new Date(s.created_at) >= subDays(new Date(), 7)
      ).length;
      const previous7DaysShipments = orgShipments.filter(s => {
        const date = new Date(s.created_at);
        return date >= subDays(new Date(), 14) && date < subDays(new Date(), 7);
      }).length;

      const trend: 'up' | 'down' | 'stable' = last7DaysShipments > previous7DaysShipments ? 'up' 
        : last7DaysShipments < previous7DaysShipments ? 'down' : 'stable';

      return {
        id: org.id,
        name: org.name,
        type: org.organization_type,
        activityScore: Math.round(activityScore),
        reliabilityScore: Math.round(reliabilityScore),
        trend,
        shipmentsCount: orgShipments.length,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        issuesCount: delayedShipments.length,
      };
    }).sort((a, b) => b.activityScore - a.activityScore);
  }, [organizations, shipments]);

  // Generate AI insights
  const generateInsights = async () => {
    setIsAnalyzing(true);
    const insights: InsightItem[] = [];

    try {
      // 1. Prediction insights
      if (stats.growthRate > 0) {
        insights.push({
          id: 'pred-1',
          type: 'prediction',
          severity: 'success',
          title: 'نمو متوقع في الشحنات',
          description: `بناءً على معدل النمو الحالي (${stats.growthRate}%)، نتوقع زيادة الشحنات بنسبة ${Math.round(stats.growthRate * 1.5)}% خلال الأسبوعين القادمين`,
          confidence: 78,
          icon: TrendingUp,
          actionable: 'جهّز موارد إضافية للتعامل مع الطلب المتزايد',
        });
      }

      // Predict busy waste types
      const topWasteType = Object.entries(stats.wasteTypeCounts)
        .sort(([,a], [,b]) => b - a)[0];
      if (topWasteType) {
        insights.push({
          id: 'pred-2',
          type: 'prediction',
          severity: 'info',
          title: `توقع ارتفاع شحنات ${getWasteTypeLabel(topWasteType[0])}`,
          description: `نوع "${getWasteTypeLabel(topWasteType[0])}" يمثل ${Math.round(topWasteType[1] / stats.totalShipments * 100)}% من الشحنات - متوقع استمرار هذا النمط`,
          confidence: 85,
          icon: BarChart3,
        });
      }

      // 2. Behavior insights
      const activePartners = partnerBehaviors.filter(p => p.activityScore > 70);
      const inactivePartners = partnerBehaviors.filter(p => p.activityScore < 30);
      
      if (activePartners.length > 0) {
        insights.push({
          id: 'behav-1',
          type: 'behavior',
          severity: 'success',
          title: 'جهات مرتبطة نشطة',
          description: `${activePartners.length} شريك يُظهر نشاطاً عالياً: ${activePartners.slice(0, 3).map(p => p.name).join('، ')}`,
          confidence: 92,
          icon: Flame,
          data: activePartners,
        });
      }

      if (inactivePartners.length > 0) {
        insights.push({
          id: 'behav-2',
          type: 'behavior',
          severity: 'warning',
          title: 'جهات مرتبطة غير نشطة',
          description: `${inactivePartners.length} جهة بنشاط منخفض - قد تحتاج متابعة`,
          confidence: 88,
          icon: Snowflake,
          actionable: 'تواصل مع هذه الجهات لفهم احتياجاتهم',
          data: inactivePartners,
        });
      }

      // Reliability issues
      const unreliablePartners = partnerBehaviors.filter(p => p.reliabilityScore < 60);
      if (unreliablePartners.length > 0) {
        insights.push({
          id: 'behav-3',
          type: 'behavior',
          severity: 'warning',
          title: 'مخاوف بشأن الموثوقية',
          description: `${unreliablePartners.length} شريك لديهم تأخيرات متكررة أو مشاكل في التسليم`,
          confidence: 80,
          icon: Shield,
          actionable: 'راجع أداء هذه الجهات واتخذ إجراءات تحسينية',
        });
      }

      // 3. Issue detection
      if (stats.delayedCount > 0) {
        insights.push({
          id: 'issue-1',
          type: 'issue',
          severity: stats.delayedCount > 5 ? 'critical' : 'warning',
          title: 'شحنات متأخرة',
          description: `${stats.delayedCount} شحنة تجاوزت موعد التسليم المتوقع`,
          confidence: 100,
          icon: Clock,
          actionable: 'راجع الشحنات المتأخرة وتواصل مع الأطراف المعنية',
        });
      }

      if (stats.avgDeliveryTime > 5) {
        insights.push({
          id: 'issue-2',
          type: 'issue',
          severity: 'warning',
          title: 'متوسط وقت التسليم مرتفع',
          description: `متوسط وقت التسليم ${stats.avgDeliveryTime} أيام - أعلى من المعدل الطبيعي`,
          confidence: 95,
          icon: AlertTriangle,
          actionable: 'حلل أسباب التأخير وحسّن عمليات النقل',
        });
      }

      // Check for stuck shipments
      const stuckShipments = shipments.filter(s => 
        ['new', 'approved'].includes(s.status) &&
        differenceInDays(new Date(), new Date(s.created_at)) > 3
      );
      if (stuckShipments.length > 0) {
        insights.push({
          id: 'issue-3',
          type: 'issue',
          severity: 'warning',
          title: 'شحنات معلقة',
          description: `${stuckShipments.length} شحنة لم تتحرك منذ أكثر من 3 أيام`,
          confidence: 100,
          icon: XCircle,
          actionable: 'تابع هذه الشحنات مع الناقلين',
        });
      }

      // 4. Recommendations
      if (stats.completionRate < 70) {
        insights.push({
          id: 'rec-1',
          type: 'recommendation',
          severity: 'info',
          title: 'تحسين معدل الإنجاز',
          description: `معدل إنجاز الشحنات ${stats.completionRate}% - يمكن تحسينه`,
          confidence: 90,
          icon: Target,
          actionable: 'راجع العمليات وحدد نقاط الاختناق',
        });
      }

      if (organizations.length < 5) {
        insights.push({
          id: 'rec-2',
          type: 'recommendation',
          severity: 'info',
          title: 'توسيع شبكة الجهات المرتبطة',
          description: 'عدد الجهات المرتبطة محدود - فكر في جذب جهات جديدة',
          confidence: 75,
          icon: Users,
          actionable: 'أطلق حملة لجذب جهات جديدة للمنصة',
        });
      }

      // Efficiency recommendation
      const busyDays = shipments.reduce((acc, s) => {
        const day = format(new Date(s.created_at), 'EEEE', { locale: ar });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const busiestDay = Object.entries(busyDays).sort(([,a], [,b]) => b - a)[0];
      if (busiestDay) {
        insights.push({
          id: 'rec-3',
          type: 'recommendation',
          severity: 'success',
          title: 'تحسين جدولة الموارد',
          description: `يوم "${busiestDay[0]}" هو الأكثر نشاطاً - خصص موارد إضافية`,
          confidence: 82,
          icon: Zap,
        });
      }

      setAiInsights(insights);
      toast.success(`تم تحليل ${insights.length} رؤية ذكية`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('فشل في تحليل البيانات');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getWasteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plastic: 'البلاستيك',
      paper: 'الورق',
      metal: 'المعادن',
      glass: 'الزجاج',
      electronic: 'الإلكترونيات',
      organic: 'العضوية',
      chemical: 'الكيميائية',
      medical: 'الطبية',
      construction: 'الإنشائية',
      other: 'أخرى',
    };
    return labels[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400';
      case 'success': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400';
      default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prediction': return 'تنبؤ';
      case 'behavior': return 'سلوك';
      case 'issue': return 'مشكلة';
      case 'recommendation': return 'توصية';
      default: return type;
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'مولّد';
      case 'transporter': return 'ناقل';
      case 'recycler': return 'مدوّر';
      default: return type;
    }
  };

  const isLoading = shipmentsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                العين الذكية
                <Sparkles className="h-5 w-5 text-amber-500" />
              </h1>
              <p className="text-muted-foreground">نظام تحليل البيانات والتنبؤات الذكية</p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={generateInsights}
            disabled={isAnalyzing || isLoading}
            className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جارٍ التحليل...
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                تحليل البيانات
              </>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">{stats.totalShipments}</span>
              </div>
              <p className="text-sm text-blue-600 mt-2">إجمالي الشحنات</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-700">{stats.completionRate}%</span>
              </div>
              <p className="text-sm text-emerald-600 mt-2">معدل الإنجاز</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-amber-600" />
                <span className="text-2xl font-bold text-amber-700">{stats.avgDeliveryTime}</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">متوسط التسليم (يوم)</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <span className="text-2xl font-bold text-red-700">{stats.delayedCount}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">شحنات متأخرة</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700">{stats.totalOrganizations}</span>
              </div>
              <p className="text-sm text-purple-600 mt-2">الجهات المرتبطة</p>
            </CardContent>
          </Card>

          <Card className={cn(
            "bg-gradient-to-br border-violet-200/50",
            stats.growthRate >= 0 
              ? "from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20"
              : "from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {stats.growthRate >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-violet-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-rose-600" />
                )}
                <span className={cn(
                  "text-2xl font-bold",
                  stats.growthRate >= 0 ? "text-violet-700" : "text-rose-700"
                )}>
                  {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
                </span>
              </div>
              <p className={cn(
                "text-sm mt-2",
                stats.growthRate >= 0 ? "text-violet-600" : "text-rose-600"
              )}>
                معدل النمو الأسبوعي
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">التنبؤات</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">سلوك الجهات المرتبطة</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">المشاكل</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* AI Insights */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    الرؤى الذكية
                  </CardTitle>
                  <CardDescription>
                    تحليلات وتوصيات مبنية على بيانات المنصة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsights.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">اضغط "تحليل البيانات" للحصول على رؤى ذكية</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <AnimatePresence>
                        {aiInsights.map((insight, index) => (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className={cn("border-2", getSeverityColor(insight.severity))}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-background rounded-lg">
                                    <insight.icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {getTypeLabel(insight.type)}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        ثقة {insight.confidence}%
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                                    {insight.actionable && (
                                      <p className="text-xs mt-2 p-2 bg-background/50 rounded">
                                        <Lightbulb className="h-3 w-3 inline ml-1" />
                                        {insight.actionable}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  التنبؤات والتوقعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiInsights.filter(i => i.type === 'prediction').length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">قم بتحليل البيانات لعرض التنبؤات</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiInsights.filter(i => i.type === 'prediction').map(insight => (
                      <Card key={insight.id} className={cn("border", getSeverityColor(insight.severity))}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <insight.icon className="h-8 w-8" />
                            <div className="flex-1">
                              <h4 className="font-semibold">{insight.title}</h4>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>
                            </div>
                            <div className="text-left">
                              <div className="text-lg font-bold">{insight.confidence}%</div>
                              <div className="text-xs text-muted-foreground">ثقة</div>
                            </div>
                          </div>
                          <Progress value={insight.confidence} className="mt-3 h-2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  تحليل سلوك الجهات المرتبطة
                </CardTitle>
                <CardDescription>
                  مراقبة نشاط وموثوقية الجهات المرتبطة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {partnerBehaviors.map(partner => (
                      <Card key={partner.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                partner.type === 'generator' ? 'bg-blue-100 text-blue-600' :
                                partner.type === 'transporter' ? 'bg-amber-100 text-amber-600' :
                                'bg-emerald-100 text-emerald-600'
                              )}>
                                {partner.type === 'generator' ? <Building2 className="h-5 w-5" /> :
                                 partner.type === 'transporter' ? <Truck className="h-5 w-5" /> :
                                 <Package className="h-5 w-5" />}
                              </div>
                              <div>
                                <h4 className="font-semibold">{partner.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {getOrgTypeLabel(partner.type)}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {partner.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                              {partner.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                              {partner.trend === 'stable' && <Activity className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-sm text-muted-foreground">النشاط</div>
                              <div className="font-bold">{partner.activityScore}%</div>
                              <Progress value={partner.activityScore} className="h-1 mt-1" />
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">الموثوقية</div>
                              <div className={cn(
                                "font-bold",
                                partner.reliabilityScore >= 70 ? "text-emerald-600" :
                                partner.reliabilityScore >= 50 ? "text-amber-600" : "text-red-600"
                              )}>
                                {partner.reliabilityScore}%
                              </div>
                              <Progress 
                                value={partner.reliabilityScore} 
                                className={cn(
                                  "h-1 mt-1",
                                  partner.reliabilityScore >= 70 ? "[&>div]:bg-emerald-500" :
                                  partner.reliabilityScore >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                                )} 
                              />
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">الشحنات</div>
                              <div className="font-bold">{partner.shipmentsCount}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">التأخيرات</div>
                              <div className={cn(
                                "font-bold",
                                partner.issuesCount === 0 ? "text-emerald-600" :
                                partner.issuesCount <= 2 ? "text-amber-600" : "text-red-600"
                              )}>
                                {partner.issuesCount}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    المشاكل المكتشفة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights.filter(i => i.type === 'issue').length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                      <p className="text-muted-foreground">لم يتم اكتشاف مشاكل حرجة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiInsights.filter(i => i.type === 'issue').map(issue => (
                        <Card key={issue.id} className={cn("border-2", getSeverityColor(issue.severity))}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <issue.icon className="h-6 w-6 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold">{issue.title}</h4>
                                <p className="text-sm text-muted-foreground">{issue.description}</p>
                                {issue.actionable && (
                                  <p className="text-xs mt-2 p-2 bg-background/50 rounded">
                                    <Lightbulb className="h-3 w-3 inline ml-1" />
                                    {issue.actionable}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <Lightbulb className="h-5 w-5" />
                    التوصيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiInsights.filter(i => i.type === 'recommendation').length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">قم بتحليل البيانات لعرض التوصيات</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiInsights.filter(i => i.type === 'recommendation').map(rec => (
                        <Card key={rec.id} className={cn("border", getSeverityColor(rec.severity))}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <rec.icon className="h-6 w-6 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold">{rec.title}</h4>
                                <p className="text-sm text-muted-foreground">{rec.description}</p>
                                {rec.actionable && (
                                  <Button variant="outline" size="sm" className="mt-2">
                                    {rec.actionable}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
