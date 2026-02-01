import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Loader2, TrendingUp, PieChart, Calendar, FileText, Sparkles } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface WasteData {
  waste_type: string;
  total_quantity: number;
  shipment_count: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const WasteAnalytics = () => {
  const { organization } = useAuth();
  const { isLoading, generateReport } = useAIAssistant();
  const [wasteData, setWasteData] = useState<WasteData[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [shipmentCount, setShipmentCount] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [customQuery, setCustomQuery] = useState('');

  useEffect(() => {
    if (organization?.id) {
      fetchWasteData();
    }
  }, [organization?.id]);

  const fetchWasteData = async () => {
    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('waste_type, quantity, unit, status, created_at')
        .eq('generator_id', organization?.id);

      if (error) throw error;

      if (shipments) {
        // Aggregate by waste type
        const aggregated: Record<string, { quantity: number; count: number }> = {};
        let total = 0;
        
        shipments.forEach(s => {
          if (!aggregated[s.waste_type]) {
            aggregated[s.waste_type] = { quantity: 0, count: 0 };
          }
          aggregated[s.waste_type].quantity += s.quantity || 0;
          aggregated[s.waste_type].count += 1;
          total += s.quantity || 0;
        });

        const wasteDataArray = Object.entries(aggregated).map(([type, data]) => ({
          waste_type: getWasteTypeName(type),
          total_quantity: data.quantity,
          shipment_count: data.count,
        }));

        setWasteData(wasteDataArray);
        setTotalWeight(total);
        setShipmentCount(shipments.length);
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getWasteTypeName = (type: string): string => {
    const names: Record<string, string> = {
      plastic: 'بلاستيك',
      paper: 'ورق وكرتون',
      metal: 'معادن',
      glass: 'زجاج',
      electronic: 'إلكترونيات',
      organic: 'عضوية',
      chemical: 'كيميائية',
      medical: 'طبية',
      construction: 'مخلفات بناء',
      other: 'أخرى',
    };
    return names[type] || type;
  };

  const handleGenerateAnalysis = async () => {
    const analysisData = {
      organization_name: organization?.name,
      total_shipments: shipmentCount,
      total_weight_kg: totalWeight,
      waste_breakdown: wasteData,
      custom_query: customQuery || undefined,
    };

    const prompt = customQuery 
      ? `تحليل بيانات المخلفات للمنشأة "${organization?.name}" مع الإجابة على السؤال: ${customQuery}\n\nالبيانات:\n${JSON.stringify(analysisData, null, 2)}`
      : `قدم تحليلاً شاملاً لبيانات المخلفات للمنشأة "${organization?.name}" يتضمن:
1. ملخص عام للأداء
2. توزيع أنواع المخلفات ونسبها
3. اتجاهات ملحوظة
4. مقارنة بالمعايير الصناعية
5. توصيات للتحسين

البيانات:\n${JSON.stringify(analysisData, null, 2)}`;

    const result = await generateReport({ prompt, data: analysisData });
    setAiAnalysis(result);
  };

  const pieData = wasteData.map(d => ({
    name: d.waste_type,
    value: d.total_quantity,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي الكمية</p>
                  <p className="text-2xl font-bold">{totalWeight.toLocaleString()} كجم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">عدد الشحنات</p>
                  <p className="text-2xl font-bold">{shipmentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">أنواع المخلفات</p>
                  <p className="text-2xl font-bold">{wasteData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <PieChart className="w-5 h-5 text-primary" />
              توزيع أنواع المخلفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : wasteData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <BarChart3 className="w-5 h-5 text-primary" />
              كميات المخلفات حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : wasteData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={wasteData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="waste_type" type="category" width={80} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                  <Bar dataKey="total_quantity" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Sparkles className="w-5 h-5 text-primary" />
            تحليل ذكي بالذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            احصل على تحليل شامل لبيانات مخلفاتك مع توصيات مخصصة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="اكتب سؤالاً محدداً (اختياري)... مثال: ما هي أفضل طرق تقليل مخلفات البلاستيك؟"
            className="min-h-[80px] text-right"
            dir="rtl"
          />
          <Button 
            onClick={handleGenerateAnalysis}
            disabled={isLoading || loadingData}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري التحليل...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                تحليل البيانات
              </>
            )}
          </Button>

          {aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-muted/50 border border-border"
            >
              <div className="prose prose-sm max-w-none text-right dark:prose-invert">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteAnalytics;
