import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Loader2, TrendingUp, PieChart, FileText, Sparkles, Scale, Package, AlertTriangle, Leaf, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { format, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { isHazardousWasteType, wasteTypeLabels, findCategoryById } from '@/lib/wasteClassification';

interface WasteData {
  waste_type: string;
  total_quantity: number;
  shipment_count: number;
  hazard_level: string;
  category: 'hazardous' | 'non_hazardous';
}

interface MonthlyData {
  month: string;
  quantity: number;
  shipments: number;
}

interface ShipmentDetail {
  id: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

const WasteAnalytics = () => {
  const { organization } = useAuth();
  const { isLoading, generateReport } = useAIAssistant();
  const [wasteData, setWasteData] = useState<WasteData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetail[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [shipmentCount, setShipmentCount] = useState(0);
  const [hazardousWeight, setHazardousWeight] = useState(0);
  const [nonHazardousWeight, setNonHazardousWeight] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [customQuery, setCustomQuery] = useState('');
  const [avgMonthlyQuantity, setAvgMonthlyQuantity] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);

  useEffect(() => {
    if (organization?.id) {
      fetchWasteData();
    }
  }, [organization?.id]);

  const fetchWasteData = async () => {
    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, unit, status, created_at, hazard_level, packaging_method, disposal_method')
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (shipments) {
        setShipmentDetails(shipments as ShipmentDetail[]);

        // Aggregate by waste type with categories
        const aggregated: Record<string, { quantity: number; count: number; hazardLevel: string; category: 'hazardous' | 'non_hazardous' }> = {};
        let total = 0;
        let hazardous = 0;
        let nonHazardous = 0;
        
        shipments.forEach(s => {
          const isHazardous = isHazardousWasteType(s.waste_type);
          
          if (!aggregated[s.waste_type]) {
            aggregated[s.waste_type] = { 
              quantity: 0, 
              count: 0, 
              hazardLevel: s.hazard_level || (isHazardous ? 'خطرة' : 'غير خطرة'),
              category: isHazardous ? 'hazardous' : 'non_hazardous'
            };
          }
          aggregated[s.waste_type].quantity += s.quantity || 0;
          aggregated[s.waste_type].count += 1;
          total += s.quantity || 0;
          
          if (isHazardous) {
            hazardous += s.quantity || 0;
          } else {
            nonHazardous += s.quantity || 0;
          }
        });

        const wasteDataArray = Object.entries(aggregated).map(([type, data]) => ({
          waste_type: type,
          total_quantity: data.quantity,
          shipment_count: data.count,
          hazard_level: data.hazardLevel,
          category: data.category,
        })).sort((a, b) => b.total_quantity - a.total_quantity);

        setWasteData(wasteDataArray);
        setTotalWeight(total);
        setShipmentCount(shipments.length);
        setHazardousWeight(hazardous);
        setNonHazardousWeight(nonHazardous);

        // Calculate monthly data for the last 6 months
        const monthlyAgg: Record<string, { quantity: number; shipments: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthKey = format(monthDate, 'yyyy-MM');
          monthlyAgg[monthKey] = { quantity: 0, shipments: 0 };
        }

        shipments.forEach(s => {
          const monthKey = format(new Date(s.created_at), 'yyyy-MM');
          if (monthlyAgg[monthKey]) {
            monthlyAgg[monthKey].quantity += s.quantity || 0;
            monthlyAgg[monthKey].shipments += 1;
          }
        });

        const monthlyDataArray = Object.entries(monthlyAgg).map(([month, data]) => ({
          month: format(new Date(month + '-01'), 'MMM yyyy', { locale: ar }),
          quantity: data.quantity,
          shipments: data.shipments,
        }));

        setMonthlyData(monthlyDataArray);

        // Calculate average and growth rate
        const quantities = monthlyDataArray.map(m => m.quantity);
        const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
        setAvgMonthlyQuantity(avg);

        if (quantities.length >= 2 && quantities[quantities.length - 2] > 0) {
          const growth = ((quantities[quantities.length - 1] - quantities[quantities.length - 2]) / quantities[quantities.length - 2]) * 100;
          setGrowthRate(growth);
        }
      }
    } catch (error) {
      console.error('Error fetching waste data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getWasteTypeName = (type: string): string => {
    // First check wasteTypeLabels from classification
    if (wasteTypeLabels[type]) return wasteTypeLabels[type];
    
    // Check if it's a category ID
    const category = findCategoryById(type);
    if (category) return category.name;
    
    return type;
  };

  const handleGenerateAnalysis = async () => {
    const analysisData = {
      organization_name: organization?.name,
      total_shipments: shipmentCount,
      total_weight_kg: totalWeight,
      hazardous_weight_kg: hazardousWeight,
      non_hazardous_weight_kg: nonHazardousWeight,
      hazardous_percentage: totalWeight > 0 ? ((hazardousWeight / totalWeight) * 100).toFixed(1) : 0,
      waste_types_count: wasteData.length,
      waste_breakdown: wasteData.map(w => ({
        type: getWasteTypeName(w.waste_type),
        quantity_kg: w.total_quantity,
        shipments: w.shipment_count,
        percentage: totalWeight > 0 ? ((w.total_quantity / totalWeight) * 100).toFixed(1) : 0,
        category: w.category === 'hazardous' ? 'خطرة' : 'غير خطرة',
      })),
      monthly_trend: monthlyData,
      avg_monthly_quantity: avgMonthlyQuantity.toFixed(0),
      growth_rate: growthRate.toFixed(1),
      custom_query: customQuery || undefined,
    };

    const prompt = customQuery 
      ? `تحليل بيانات المخلفات للمنشأة "${organization?.name}" مع الإجابة على السؤال: ${customQuery}\n\nالبيانات:\n${JSON.stringify(analysisData, null, 2)}`
      : `قدم تحليلاً شاملاً ومفصلاً لبيانات المخلفات للمنشأة "${organization?.name}" يتضمن:

1. **ملخص تنفيذي**
   - إجمالي المخلفات وتوزيعها
   - نسبة المخلفات الخطرة مقابل غير الخطرة
   
2. **تحليل الأنواع**
   - أكثر الأنواع توليداً وأسبابها المحتملة
   - توصيات لكل نوع رئيسي
   
3. **تحليل الاتجاهات**
   - معدل النمو الشهري (${growthRate.toFixed(1)}%)
   - توقعات للأشهر القادمة
   
4. **مقارنة بالمعايير**
   - مقارنة بالمنشآت المماثلة
   - الالتزام بالمعايير البيئية المصرية
   
5. **توصيات عملية**
   - خطوات فورية
   - خطة طويلة المدى

البيانات:\n${JSON.stringify(analysisData, null, 2)}`;

    const result = await generateReport({ prompt, data: analysisData });
    setAiAnalysis(result);
  };

  const pieData = wasteData.map(d => ({
    name: getWasteTypeName(d.waste_type),
    value: d.total_quantity,
  }));

  const categoryPieData = [
    { name: 'مخلفات خطرة', value: hazardousWeight },
    { name: 'مخلفات غير خطرة', value: nonHazardousWeight },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">إجمالي الكمية</span>
              </div>
              <p className="text-lg font-bold">{totalWeight.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">كجم</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">عدد الشحنات</span>
              </div>
              <p className="text-lg font-bold">{shipmentCount}</p>
              <p className="text-xs text-muted-foreground">شحنة</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-muted-foreground">مخلفات خطرة</span>
              </div>
              <p className="text-lg font-bold">{hazardousWeight.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">كجم ({totalWeight > 0 ? ((hazardousWeight / totalWeight) * 100).toFixed(1) : 0}%)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">غير خطرة</span>
              </div>
              <p className="text-lg font-bold">{nonHazardousWeight.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">كجم ({totalWeight > 0 ? ((nonHazardousWeight / totalWeight) * 100).toFixed(1) : 0}%)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <PieChart className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">أنواع المخلفات</span>
              </div>
              <p className="text-lg font-bold">{wasteData.length}</p>
              <p className="text-xs text-muted-foreground">نوع</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className={`bg-gradient-to-br ${growthRate >= 0 ? 'from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'from-green-500/10 to-emerald-500/10 border-green-500/20'}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                {growthRate >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-amber-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-green-600" />
                )}
                <span className="text-xs text-muted-foreground">معدل النمو</span>
              </div>
              <p className="text-lg font-bold">{growthRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">شهري</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waste Type Distribution */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="flex items-center gap-2 justify-end text-base">
              <PieChart className="w-4 h-4 text-primary" />
              توزيع أنواع المخلفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : wasteData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Hazardous vs Non-Hazardous */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="flex items-center gap-2 justify-end text-base">
              <AlertTriangle className="w-4 h-4 text-primary" />
              التصنيف حسب الخطورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : categoryPieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#EF4444" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="flex items-center gap-2 justify-end text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              الاتجاه الشهري
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                  <Line type="monotone" dataKey="quantity" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Waste Types Table */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <BarChart3 className="w-5 h-5 text-primary" />
            تفاصيل أنواع المخلفات
          </CardTitle>
          <CardDescription>
            جدول تفصيلي لجميع أنواع المخلفات وكمياتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : wasteData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نوع المخلف</TableHead>
                    <TableHead className="text-right">التصنيف</TableHead>
                    <TableHead className="text-right">الكمية (كجم)</TableHead>
                    <TableHead className="text-right">عدد الشحنات</TableHead>
                    <TableHead className="text-right">النسبة</TableHead>
                    <TableHead className="text-right">متوسط الشحنة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wasteData.map((waste, index) => (
                    <TableRow key={waste.waste_type}>
                      <TableCell className="font-medium text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {getWasteTypeName(waste.waste_type)}
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={waste.category === 'hazardous' ? 'destructive' : 'secondary'}>
                          {waste.category === 'hazardous' ? 'خطرة' : 'غير خطرة'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {waste.total_quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {waste.shipment_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {totalWeight > 0 ? ((waste.total_quantity / totalWeight) * 100).toFixed(1) : 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {waste.shipment_count > 0 ? (waste.total_quantity / waste.shipment_count).toFixed(0) : 0} كجم
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell className="text-right">الإجمالي</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">{totalWeight.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{shipmentCount}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">
                      {shipmentCount > 0 ? (totalWeight / shipmentCount).toFixed(0) : 0} كجم
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart - Quantities */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <BarChart3 className="w-5 h-5 text-primary" />
            مقارنة كميات المخلفات
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wasteData.map(d => ({ ...d, name: getWasteTypeName(d.waste_type) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} كجم`, 
                    name === 'total_quantity' ? 'الكمية' : 'الشحنات'
                  ]} 
                />
                <Legend />
                <Bar dataKey="total_quantity" name="الكمية (كجم)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Sparkles className="w-5 h-5 text-primary" />
            تحليل ذكي شامل بالذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            احصل على تحليل مفصل وتوصيات مخصصة بناءً على جميع بيانات مخلفاتك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="اكتب سؤالاً محدداً (اختياري)... مثال: ما هي أفضل طرق التخلص من المخلفات الكيميائية؟"
            className="min-h-[80px] text-right"
            dir="rtl"
          />
          <Button 
            onClick={handleGenerateAnalysis}
            disabled={isLoading || loadingData}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري إعداد التحليل الشامل...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                تحليل شامل للبيانات
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
