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
  CheckCircle2, Clock, Loader2, BarChart3, Building2, Scale, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels, isHazardousWasteType } from '@/lib/wasteClassification';

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
            const deliveredDate = new Date(s.delivered_at);
            const confirmedDate = new Date(s.confirmed_at);
            const days = (confirmedDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
            totalProcessingDays += days;
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

        // Waste breakdown by type
        const breakdownMap: Record<string, WasteBreakdown> = {};
        shipments.forEach(s => {
          if (!breakdownMap[s.waste_type]) {
            breakdownMap[s.waste_type] = { waste_type: s.waste_type, total_quantity: 0, shipment_count: 0 };
          }
          breakdownMap[s.waste_type].total_quantity += s.quantity || 0;
          breakdownMap[s.waste_type].shipment_count += 1;
        });
        setWasteBreakdown(Object.values(breakdownMap).sort((a, b) => b.total_quantity - a.total_quantity));

        // Monthly trend data (last 6 months)
        const monthlyMap: Record<string, { month: string; received: number; processed: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthKey = format(monthDate, 'yyyy-MM');
          const monthLabel = format(monthDate, 'MMM', { locale: ar });
          monthlyMap[monthKey] = { month: monthLabel, received: 0, processed: 0 };
        }

        shipments.forEach(s => {
          const monthKey = format(new Date(s.created_at), 'yyyy-MM');
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].received += s.quantity || 0;
            if (s.status === 'confirmed') {
              monthlyMap[monthKey].processed += s.quantity || 0;
            }
          }
        });
        setMonthlyData(Object.values(monthlyMap));

        // Generator stats
        const generatorMap: Record<string, { name: string; quantity: number; count: number }> = {};
        shipments.forEach(s => {
          const generatorName = (s.generator as any)?.name || 'غير محدد';
          if (!generatorMap[generatorName]) {
            generatorMap[generatorName] = { name: generatorName, quantity: 0, count: 0 };
          }
          generatorMap[generatorName].quantity += s.quantity || 0;
          generatorMap[generatorName].count += 1;
        });
        setGeneratorStats(Object.values(generatorMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5));
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
      total_received_kg: stats.totalReceived,
      total_processed_kg: stats.totalProcessed,
      processing_efficiency_percent: stats.processingEfficiency.toFixed(1),
      hazardous_received_kg: stats.hazardousReceived,
      non_hazardous_received_kg: stats.nonHazardousReceived,
      average_processing_time_days: stats.averageProcessingTime.toFixed(1),
      waste_breakdown: wasteBreakdown.map(w => ({
        type: wasteTypeLabels[w.waste_type] || w.waste_type,
        quantity_kg: w.total_quantity,
        shipment_count: w.shipment_count
      })),
      top_generators: generatorStats.map(g => ({
        name: g.name,
        quantity_kg: g.quantity,
        shipment_count: g.count
      })),
      monthly_trend: monthlyData
    };

    const result = await generateReport(analysisData);
    if (result) {
      setAiAnalysis(result);
    }
  };

  const getWasteTypeName = (type: string) => wasteTypeLabels[type] || type;

  const pieData = wasteBreakdown.map((w, i) => ({
    name: getWasteTypeName(w.waste_type),
    value: w.total_quantity,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="w-8 h-8 text-blue-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي المستلم</p>
                  <p className="text-2xl font-bold">{stats.totalReceived.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">كجم</p>
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
                  <p className="text-2xl font-bold">{stats.totalProcessed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">كجم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">مخلفات خطرة</p>
                  <p className="text-2xl font-bold">{stats.hazardousReceived.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">كجم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">غير خطرة</p>
                  <p className="text-2xl font-bold">{stats.nonHazardousReceived.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">كجم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-purple-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">متوسط المعالجة</p>
                  <p className="text-2xl font-bold">{stats.averageProcessingTime.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">يوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-amber-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">كفاءة المعالجة</p>
                  <p className="text-2xl font-bold">{stats.processingEfficiency.toFixed(0)}%</p>
                  <Progress value={stats.processingEfficiency} className="mt-2 h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <BarChart3 className="w-5 h-5 text-primary" />
              توزيع أنواع المخلفات المستلمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} كجم`, 'الكمية']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <TrendingUp className="w-5 h-5 text-primary" />
              الاتجاه الشهري (الاستلام والمعالجة)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} كجم`]} />
                <Legend />
                <Line type="monotone" dataKey="received" name="المستلم" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="processed" name="المعالج" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Generators & Waste Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Generators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Building2 className="w-5 h-5 text-primary" />
              أكثر الجهات المولدة إرسالاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatorStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={generatorStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} كجم`, 'الكمية']} />
                  <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waste Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Scale className="w-5 h-5 text-primary" />
              تفاصيل المخلفات المستلمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {wasteBreakdown.map((item, index) => {
                const percentage = stats.totalReceived > 0 
                  ? (item.total_quantity / stats.totalReceived) * 100 
                  : 0;
                const isHazardous = isHazardousWasteType(item.waste_type);
                
                return (
                  <div key={item.waste_type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        {isHazardous && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        {getWasteTypeName(item.waste_type)}
                      </span>
                      <span className="text-muted-foreground">
                        {item.total_quantity.toLocaleString()} كجم ({item.shipment_count} شحنة)
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2" 
                      style={{ '--progress-color': CHART_COLORS[index % CHART_COLORS.length] } as any}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              onClick={handleGenerateAIAnalysis}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? 'جاري التحليل...' : 'تحليل ذكي'}
            </Button>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Sparkles className="w-5 h-5 text-primary" />
                التحليل الذكي لأداء التدوير
              </CardTitle>
              <CardDescription>تحليل شامل باستخدام الذكاء الاصطناعي</CardDescription>
            </div>
          </div>
        </CardHeader>
        {aiAnalysis && (
          <CardContent>
            <div className="p-4 rounded-xl bg-muted/50 border border-border whitespace-pre-wrap text-right leading-relaxed">
              {aiAnalysis}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default RecyclerWasteAnalytics;
