import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Recycle, TrendingUp, TrendingDown, Package, AlertTriangle, 
  CheckCircle2, Clock, Loader2, BarChart3, Building2, Scale, Sparkles,
  Target, Award, Focus, Star, Zap, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar,
  RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels, isHazardousWasteType, getWasteTypeCode } from '@/lib/wasteClassification';

interface ProcessingStats {
  totalReceived: number;
  totalProcessed: number;
  hazardousReceived: number;
  nonHazardousReceived: number;
  averageProcessingTime: number;
  processingEfficiency: number;
}

interface WasteBreakdown {
  waste_type: string;
  total_quantity: number;
  shipment_count: number;
  processed_quantity: number;
  avg_processing_time: number;
}

interface SpecializationData {
  primaryType: string;
  secondaryType: string | null;
  primaryPercentage: number;
  secondaryPercentage: number;
  specializationScore: number;
  isPrimaryHazardous: boolean;
  isSecondaryHazardous: boolean;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const RecyclerWasteAnalytics = () => {
  const { organization, profile } = useAuth();
  const { isLoading: aiLoading, generateReport } = useAIAssistant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProcessingStats>({
    totalReceived: 0,
    totalProcessed: 0,
    hazardousReceived: 0,
    nonHazardousReceived: 0,
    averageProcessingTime: 0,
    processingEfficiency: 0,
  });
  const [wasteBreakdown, setWasteBreakdown] = useState<WasteBreakdown[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [generatorStats, setGeneratorStats] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [specialization, setSpecialization] = useState<SpecializationData | null>(null);
  const [specializationTrend, setSpecializationTrend] = useState<any[]>([]);

  useEffect(() => {
    if (organization?.id) {
      fetchAnalytics();
    }
  }, [organization?.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id, waste_type, quantity, unit, status, created_at,
          delivered_at, confirmed_at, generator_id,
          generator:organizations!shipments_generator_id_fkey(name)
        `)
        .eq('recycler_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (shipments && shipments.length > 0) {
        // Calculate stats
        const totalReceived = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const confirmedShipments = shipments.filter(s => s.status === 'confirmed');
        const totalProcessed = confirmedShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        
        const hazardousReceived = shipments
          .filter(s => isHazardousWasteType(s.waste_type))
          .reduce((sum, s) => sum + (s.quantity || 0), 0);
        
        const nonHazardousReceived = totalReceived - hazardousReceived;

        // Calculate average processing time (delivered to confirmed)
        let totalProcessingDays = 0;
        let processedCount = 0;
        confirmedShipments.forEach(s => {
          if (s.delivered_at && s.confirmed_at) {
            const days = differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
            totalProcessingDays += Math.max(0, days);
            processedCount++;
          }
        });

        const avgProcessingTime = processedCount > 0 ? totalProcessingDays / processedCount : 0;
        const processingEfficiency = totalReceived > 0 ? (totalProcessed / totalReceived) * 100 : 0;

        setStats({
          totalReceived,
          totalProcessed,
          hazardousReceived,
          nonHazardousReceived,
          averageProcessingTime: avgProcessingTime,
          processingEfficiency,
        });

        // Waste breakdown by type with processing details
        const breakdownMap: Record<string, WasteBreakdown> = {};
        shipments.forEach(s => {
          if (!breakdownMap[s.waste_type]) {
            breakdownMap[s.waste_type] = { 
              waste_type: s.waste_type, 
              total_quantity: 0, 
              shipment_count: 0,
              processed_quantity: 0,
              avg_processing_time: 0
            };
          }
          breakdownMap[s.waste_type].total_quantity += s.quantity || 0;
          breakdownMap[s.waste_type].shipment_count += 1;
          if (s.status === 'confirmed') {
            breakdownMap[s.waste_type].processed_quantity += s.quantity || 0;
          }
        });
        
        // Calculate avg processing time per type
        Object.keys(breakdownMap).forEach(type => {
          const typeShipments = confirmedShipments.filter(s => s.waste_type === type);
          let typeDays = 0;
          let typeCount = 0;
          typeShipments.forEach(s => {
            if (s.delivered_at && s.confirmed_at) {
              typeDays += differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
              typeCount++;
            }
          });
          breakdownMap[type].avg_processing_time = typeCount > 0 ? typeDays / typeCount : 0;
        });

        const sortedBreakdown = Object.values(breakdownMap).sort((a, b) => b.total_quantity - a.total_quantity);
        setWasteBreakdown(sortedBreakdown);

        // Calculate Specialization Data
        if (sortedBreakdown.length > 0) {
          const primary = sortedBreakdown[0];
          const secondary = sortedBreakdown.length > 1 ? sortedBreakdown[1] : null;
          
          const primaryPct = (primary.total_quantity / totalReceived) * 100;
          const secondaryPct = secondary ? (secondary.total_quantity / totalReceived) * 100 : 0;
          
          // Specialization score: higher if focused on 1-2 types
          const top2Pct = primaryPct + secondaryPct;
          const specializationScore = Math.min(100, top2Pct * 1.1);

          setSpecialization({
            primaryType: primary.waste_type,
            secondaryType: secondary?.waste_type || null,
            primaryPercentage: primaryPct,
            secondaryPercentage: secondaryPct,
            specializationScore,
            isPrimaryHazardous: isHazardousWasteType(primary.waste_type),
            isSecondaryHazardous: secondary ? isHazardousWasteType(secondary.waste_type) : false,
          });
        }

        // Monthly trend data for specialization (last 12 months)
        const monthlyMap: Record<string, { month: string; primary: number; secondary: number; others: number; efficiency: number }> = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthKey = format(monthDate, 'yyyy-MM');
          const monthLabel = format(monthDate, 'MMM', { locale: ar });
          monthlyMap[monthKey] = { month: monthLabel, primary: 0, secondary: 0, others: 0, efficiency: 0 };
        }

        const primaryType = sortedBreakdown[0]?.waste_type;
        const secondaryType = sortedBreakdown[1]?.waste_type;

        shipments.forEach(s => {
          const monthKey = format(new Date(s.created_at), 'yyyy-MM');
          if (monthlyMap[monthKey]) {
            if (s.waste_type === primaryType) {
              monthlyMap[monthKey].primary += s.quantity || 0;
            } else if (s.waste_type === secondaryType) {
              monthlyMap[monthKey].secondary += s.quantity || 0;
            } else {
              monthlyMap[monthKey].others += s.quantity || 0;
            }
          }
        });

        // Calculate monthly efficiency
        Object.keys(monthlyMap).forEach(monthKey => {
          const monthStart = startOfMonth(new Date(monthKey + '-01'));
          const monthEnd = endOfMonth(new Date(monthKey + '-01'));
          const monthShipments = shipments.filter(s => 
            isWithinInterval(new Date(s.created_at), { start: monthStart, end: monthEnd })
          );
          const monthReceived = monthShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
          const monthProcessed = monthShipments.filter(s => s.status === 'confirmed')
            .reduce((sum, s) => sum + (s.quantity || 0), 0);
          monthlyMap[monthKey].efficiency = monthReceived > 0 ? (monthProcessed / monthReceived) * 100 : 0;
        });

        setMonthlyData(Object.values(monthlyMap));
        setSpecializationTrend(Object.values(monthlyMap));

        // Generator stats
        const generatorMap: Record<string, { name: string; quantity: number; count: number; primaryTypeQty: number }> = {};
        shipments.forEach(s => {
          const generatorName = (s.generator as any)?.name || 'غير محدد';
          if (!generatorMap[generatorName]) {
            generatorMap[generatorName] = { name: generatorName, quantity: 0, count: 0, primaryTypeQty: 0 };
          }
          generatorMap[generatorName].quantity += s.quantity || 0;
          generatorMap[generatorName].count += 1;
          if (s.waste_type === primaryType) {
            generatorMap[generatorName].primaryTypeQty += s.quantity || 0;
          }
        });
        setGeneratorStats(Object.values(generatorMap).sort((a, b) => b.primaryTypeQty - a.primaryTypeQty).slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIAnalysis = async () => {
    const analysisData = {
      organization_name: organization?.name,
      specialization_type: 'recycler_specialization',
      primary_waste_type: specialization ? wasteTypeLabels[specialization.primaryType] : null,
      primary_waste_percentage: specialization?.primaryPercentage.toFixed(1),
      secondary_waste_type: specialization?.secondaryType ? wasteTypeLabels[specialization.secondaryType] : null,
      secondary_waste_percentage: specialization?.secondaryPercentage.toFixed(1),
      specialization_score: specialization?.specializationScore.toFixed(0),
      total_received_kg: stats.totalReceived,
      total_processed_kg: stats.totalProcessed,
      processing_efficiency_percent: stats.processingEfficiency.toFixed(1),
      hazardous_received_kg: stats.hazardousReceived,
      average_processing_time_days: stats.averageProcessingTime.toFixed(1),
      waste_breakdown: wasteBreakdown.slice(0, 5).map(w => ({
        type: wasteTypeLabels[w.waste_type] || w.waste_type,
        code: getWasteTypeCode(w.waste_type),
        quantity_kg: w.total_quantity,
        processed_kg: w.processed_quantity,
        efficiency: w.total_quantity > 0 ? ((w.processed_quantity / w.total_quantity) * 100).toFixed(1) : 0,
        avg_processing_days: w.avg_processing_time.toFixed(1),
        is_hazardous: isHazardousWasteType(w.waste_type)
      })),
      top_generators_for_primary: generatorStats.map(g => ({
        name: g.name,
        primary_type_quantity_kg: g.primaryTypeQty,
        total_quantity_kg: g.quantity
      })),
      request: `
        هذه منشأة تدوير متخصصة في معالجة نوع محدد من المخلفات (${wasteTypeLabels[specialization?.primaryType || ''] || 'غير محدد'}).
        قدم تحليلاً شاملاً يتضمن:
        1. تقييم مستوى التخصص والتركيز في نوع المخلف الرئيسي
        2. تحليل كفاءة المعالجة للتخصص الرئيسي مقارنة بالأنواع الأخرى
        3. توصيات لتعميق التخصص وزيادة الكفاءة
        4. فرص التوسع ضمن نفس التخصص
        5. مقارنة بمعايير الصناعة للمنشآت المتخصصة
        6. استراتيجيات لجذب المزيد من الجهات المولدة لنوع التخصص
      `
    };

    const result = await generateReport(analysisData);
    if (result) {
      setAiAnalysis(result);
    }
  };

  const getWasteTypeName = (type: string) => wasteTypeLabels[type] || type;

  // Radial chart for specialization score
  const specializationRadialData = specialization ? [
    { name: 'التخصص', value: specialization.specializationScore, fill: '#10b981' }
  ] : [];

  // Pie data only for top 2 types + others
  const pieData = wasteBreakdown.length > 0 ? [
    { name: getWasteTypeName(wasteBreakdown[0]?.waste_type), value: wasteBreakdown[0]?.total_quantity || 0, color: '#10b981' },
    ...(wasteBreakdown[1] ? [{ name: getWasteTypeName(wasteBreakdown[1]?.waste_type), value: wasteBreakdown[1]?.total_quantity || 0, color: '#3b82f6' }] : []),
    ...(wasteBreakdown.length > 2 ? [{ 
      name: 'أخرى', 
      value: wasteBreakdown.slice(2).reduce((sum, w) => sum + w.total_quantity, 0), 
      color: '#94a3b8' 
    }] : [])
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Specialization Banner */}
      {specialization && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <Card className="bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-teal-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Specialization Score Radial */}
                <div className="w-40 h-40 flex-shrink-0">
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
                        <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">{specialization.specializationScore.toFixed(0)}%</tspan>
                        <tspan x="50%" dy="1.5em" className="text-xs fill-muted-foreground">مستوى التخصص</tspan>
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Specialization Details */}
                <div className="flex-1 text-center lg:text-right">
                  <div className="flex items-center justify-center lg:justify-end gap-2 mb-3">
                    <Focus className="w-6 h-6 text-green-500" />
                    <h3 className="text-xl font-bold">التخصص الرئيسي</h3>
                  </div>
                  
                  <div className="flex flex-wrap justify-center lg:justify-end gap-3 mb-4">
                    <Badge className="text-lg py-2 px-4 bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                      <Star className="w-4 h-4 ml-2" />
                      {getWasteTypeName(specialization.primaryType)}
                      <span className="mr-2 font-bold">{specialization.primaryPercentage.toFixed(0)}%</span>
                    </Badge>
                    
                    {specialization.secondaryType && (
                      <Badge className="text-md py-2 px-3 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                        {getWasteTypeName(specialization.secondaryType)}
                        <span className="mr-2">{specialization.secondaryPercentage.toFixed(0)}%</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center lg:justify-end gap-4 text-sm">
                    {specialization.isPrimaryHazardous && (
                      <div className="flex items-center gap-1 text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span>التخصص الرئيسي: مخلفات خطرة</span>
                      </div>
                    )}
                    {!specialization.isPrimaryHazardous && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>التخصص الرئيسي: مخلفات غير خطرة</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="w-8 h-8 text-blue-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي المستلم</p>
                  <p className="text-xl font-bold">{(stats.totalReceived / 1000).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">طن</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Recycle className="w-8 h-8 text-green-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">تم معالجته</p>
                  <p className="text-xl font-bold">{(stats.totalProcessed / 1000).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">طن</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Target className="w-8 h-8 text-amber-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">كفاءة المعالجة</p>
                  <p className="text-xl font-bold">{stats.processingEfficiency.toFixed(0)}%</p>
                  <Progress value={stats.processingEfficiency} className="mt-1 h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-purple-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">متوسط المعالجة</p>
                  <p className="text-xl font-bold">{stats.averageProcessingTime.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">يوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">مخلفات خطرة</p>
                  <p className="text-xl font-bold">{(stats.hazardousReceived / 1000).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">طن</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">غير خطرة</p>
                  <p className="text-xl font-bold">{(stats.nonHazardousReceived / 1000).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">طن</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialization Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Focus className="w-5 h-5 text-primary" />
              توزيع التخصص
            </CardTitle>
            <CardDescription className="text-right">
              التركيز على التخصص الرئيسي والثانوي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(2)} طن`, 'الكمية']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specialization Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <TrendingUp className="w-5 h-5 text-primary" />
              اتجاه التخصص الشهري
            </CardTitle>
            <CardDescription className="text-right">
              مقارنة استلام التخصص الرئيسي والثانوي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={specializationTrend}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(2)} طن`]} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="primary" 
                  name={specialization ? getWasteTypeName(specialization.primaryType) : 'الرئيسي'} 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorPrimary)"
                />
                {specialization?.secondaryType && (
                  <Area 
                    type="monotone" 
                    dataKey="secondary" 
                    name={getWasteTypeName(specialization.secondaryType)} 
                    stroke="#3b82f6" 
                    fillOpacity={1}
                    fill="url(#colorSecondary)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Primary Type Performance & Top Generators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Type Detailed Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Zap className="w-5 h-5 text-primary" />
              أداء التخصص الرئيسي
            </CardTitle>
            <CardDescription className="text-right">
              مؤشرات الأداء للمخلف الرئيسي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wasteBreakdown.length > 0 && (
              <div className="space-y-4">
                {wasteBreakdown.slice(0, 2).map((item, index) => {
                  const efficiency = item.total_quantity > 0 
                    ? (item.processed_quantity / item.total_quantity) * 100 
                    : 0;
                  const isHazardous = isHazardousWasteType(item.waste_type);
                  
                  return (
                    <motion.div
                      key={item.waste_type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border ${index === 0 ? 'bg-green-500/5 border-green-500/30' : 'bg-blue-500/5 border-blue-500/30'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Star className="w-5 h-5 text-amber-500" />}
                          <Badge variant={isHazardous ? 'destructive' : 'secondary'}>
                            {isHazardous ? 'خطرة' : 'غير خطرة'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{getWasteTypeName(item.waste_type)}</span>
                          <Badge variant="outline">{getWasteTypeCode(item.waste_type)}</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">المستلم</p>
                          <p className="text-lg font-bold">{(item.total_quantity / 1000).toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">طن</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">المعالج</p>
                          <p className="text-lg font-bold">{(item.processed_quantity / 1000).toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">طن</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">الكفاءة</p>
                          <p className="text-lg font-bold">{efficiency.toFixed(0)}%</p>
                          <Progress value={efficiency} className="h-1.5 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">وقت المعالجة</p>
                          <p className="text-lg font-bold">{item.avg_processing_time.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">يوم</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Generators for Primary Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Building2 className="w-5 h-5 text-primary" />
              أكثر الموردين للتخصص الرئيسي
            </CardTitle>
            <CardDescription className="text-right">
              الجهات المولدة الأكثر إرسالاً لنوع التخصص
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatorStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={generatorStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(1)}t`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${(value / 1000).toFixed(2)} طن`]} />
                  <Legend />
                  <Bar dataKey="primaryTypeQty" name="التخصص الرئيسي" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="quantity" name="الإجمالي" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Button & Result */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={handleGenerateAIAnalysis}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'جاري التحليل...' : 'تحليل التخصص بالذكاء الاصطناعي'}
            </Button>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Activity className="w-5 h-5 text-primary" />
                تحليل التخصص والأداء
              </CardTitle>
              <CardDescription>
                تحليل متعمق لأداء المنشأة في تخصصها الرئيسي
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {aiAnalysis && (
          <CardContent>
            <div className="p-4 rounded-xl bg-muted/50 border prose prose-sm dark:prose-invert max-w-none text-right whitespace-pre-line">
              {aiAnalysis}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default RecyclerWasteAnalytics;
