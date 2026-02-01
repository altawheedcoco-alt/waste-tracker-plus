import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, TrendingUp, TrendingDown, Package, Users, 
  Clock, Loader2, BarChart3, Building2, MapPin, Sparkles, Route
} from 'lucide-react';
import { toast } from 'sonner';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels } from '@/lib/wasteClassification';

interface TransportStats {
  totalShipments: number;
  completedShipments: number;
  activeShipments: number;
  totalDrivers: number;
  activeDrivers: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

interface WasteBreakdown {
  waste_type: string;
  total_quantity: number;
  shipment_count: number;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const TransporterAnalytics = () => {
  const { organization } = useAuth();
  const { isLoading: aiLoading, generateReport } = useAIAssistant();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TransportStats>({
    totalShipments: 0,
    completedShipments: 0,
    activeShipments: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    averageDeliveryTime: 0,
    onTimeDeliveryRate: 0,
  });
  const [wasteBreakdown, setWasteBreakdown] = useState<WasteBreakdown[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [partnerStats, setPartnerStats] = useState<any[]>([]);
  const [driverPerformance, setDriverPerformance] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  useEffect(() => {
    if (organization?.id) {
      fetchAnalytics();
    }
  }, [organization?.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id, waste_type, quantity, unit, status, created_at,
          approved_at, delivered_at, expected_delivery_date, driver_id,
          generator:organizations!shipments_generator_id_fkey(name),
          recycler:organizations!shipments_recycler_id_fkey(name),
          driver:drivers(id, profile:profiles(full_name))
        `)
        .eq('transporter_id', organization?.id)
        .order('created_at', { ascending: false });

      // Fetch drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, is_available, profile:profiles(full_name)')
        .eq('organization_id', organization?.id);

      if (error) throw error;

      if (shipments && shipments.length > 0) {
        const activeStatuses = ['new', 'approved', 'collecting', 'in_transit'];
        const completedStatuses = ['delivered', 'confirmed'];
        
        const completedShipments = shipments.filter(s => completedStatuses.includes(s.status));
        const activeShipments = shipments.filter(s => activeStatuses.includes(s.status));

        // Calculate average delivery time
        let totalDays = 0;
        let deliveryCount = 0;
        let onTimeCount = 0;

        completedShipments.forEach(s => {
          if (s.approved_at && s.delivered_at) {
            const approvedDate = new Date(s.approved_at);
            const deliveredDate = new Date(s.delivered_at);
            const days = (deliveredDate.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24);
            totalDays += days;
            deliveryCount++;

            if (s.expected_delivery_date) {
              const expectedDate = new Date(s.expected_delivery_date);
              if (deliveredDate <= expectedDate) {
                onTimeCount++;
              }
            } else {
              onTimeCount++; // If no expected date, consider it on time
            }
          }
        });

        const avgDeliveryTime = deliveryCount > 0 ? totalDays / deliveryCount : 0;
        const onTimeRate = deliveryCount > 0 ? (onTimeCount / deliveryCount) * 100 : 0;

        setStats({
          totalShipments: shipments.length,
          completedShipments: completedShipments.length,
          activeShipments: activeShipments.length,
          totalDrivers: drivers?.length || 0,
          activeDrivers: drivers?.filter(d => d.is_available).length || 0,
          averageDeliveryTime: avgDeliveryTime,
          onTimeDeliveryRate: onTimeRate,
        });

        // Waste breakdown
        const breakdownMap: Record<string, WasteBreakdown> = {};
        shipments.forEach(s => {
          if (!breakdownMap[s.waste_type]) {
            breakdownMap[s.waste_type] = { waste_type: s.waste_type, total_quantity: 0, shipment_count: 0 };
          }
          breakdownMap[s.waste_type].total_quantity += s.quantity || 0;
          breakdownMap[s.waste_type].shipment_count += 1;
        });
        setWasteBreakdown(Object.values(breakdownMap).sort((a, b) => b.total_quantity - a.total_quantity));

        // Monthly trend
        const monthlyMap: Record<string, { month: string; shipments: number; completed: number; quantity: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthKey = format(monthDate, 'yyyy-MM');
          const monthLabel = format(monthDate, 'MMM', { locale: ar });
          monthlyMap[monthKey] = { month: monthLabel, shipments: 0, completed: 0, quantity: 0 };
        }

        shipments.forEach(s => {
          const monthKey = format(new Date(s.created_at), 'yyyy-MM');
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].shipments += 1;
            monthlyMap[monthKey].quantity += s.quantity || 0;
            if (completedStatuses.includes(s.status)) {
              monthlyMap[monthKey].completed += 1;
            }
          }
        });
        setMonthlyData(Object.values(monthlyMap));

        // Partner stats (generators + recyclers)
        const partnerMap: Record<string, { name: string; type: string; quantity: number; count: number }> = {};
        shipments.forEach(s => {
          const generatorName = (s.generator as any)?.name;
          const recyclerName = (s.recycler as any)?.name;
          
          if (generatorName) {
            if (!partnerMap[generatorName]) {
              partnerMap[generatorName] = { name: generatorName, type: 'مولد', quantity: 0, count: 0 };
            }
            partnerMap[generatorName].quantity += s.quantity || 0;
            partnerMap[generatorName].count += 1;
          }
          
          if (recyclerName) {
            if (!partnerMap[recyclerName]) {
              partnerMap[recyclerName] = { name: recyclerName, type: 'مدور', quantity: 0, count: 0 };
            }
            partnerMap[recyclerName].quantity += s.quantity || 0;
            partnerMap[recyclerName].count += 1;
          }
        });
        setPartnerStats(Object.values(partnerMap).sort((a, b) => b.quantity - a.quantity).slice(0, 6));

        // Driver performance
        const driverMap: Record<string, { name: string; shipments: number; completed: number }> = {};
        shipments.forEach(s => {
          const driverName = (s.driver as any)?.profile?.full_name || 'غير معين';
          if (!driverMap[driverName]) {
            driverMap[driverName] = { name: driverName, shipments: 0, completed: 0 };
          }
          driverMap[driverName].shipments += 1;
          if (completedStatuses.includes(s.status)) {
            driverMap[driverName].completed += 1;
          }
        });
        setDriverPerformance(Object.values(driverMap).sort((a, b) => b.shipments - a.shipments).slice(0, 5));
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
      total_shipments: stats.totalShipments,
      completed_shipments: stats.completedShipments,
      active_shipments: stats.activeShipments,
      total_drivers: stats.totalDrivers,
      active_drivers: stats.activeDrivers,
      average_delivery_time_days: stats.averageDeliveryTime.toFixed(1),
      on_time_delivery_rate: stats.onTimeDeliveryRate.toFixed(1),
      waste_breakdown: wasteBreakdown.map(w => ({
        type: wasteTypeLabels[w.waste_type] || w.waste_type,
        quantity_kg: w.total_quantity,
        shipment_count: w.shipment_count
      })),
      top_partners: partnerStats,
      driver_performance: driverPerformance,
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
    value: w.shipment_count,
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
                  <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                  <p className="text-2xl font-bold">{stats.totalShipments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold">{stats.completedShipments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Truck className="w-8 h-8 text-amber-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">نشطة</p>
                  <p className="text-2xl font-bold">{stats.activeShipments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-purple-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">السائقين</p>
                  <p className="text-2xl font-bold">{stats.activeDrivers}/{stats.totalDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-cyan-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">متوسط التسليم</p>
                  <p className="text-2xl font-bold">{stats.averageDeliveryTime.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">يوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Route className="w-8 h-8 text-emerald-500" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">التسليم بالموعد</p>
                  <p className="text-2xl font-bold">{stats.onTimeDeliveryRate.toFixed(0)}%</p>
                  <Progress value={stats.onTimeDeliveryRate} className="mt-2 h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <BarChart3 className="w-5 h-5 text-primary" />
              توزيع الشحنات حسب النوع
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
                  <Tooltip formatter={(value: number) => [`${value} شحنة`, 'العدد']} />
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
              الاتجاه الشهري للشحنات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="shipments" name="إجمالي الشحنات" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" name="المكتملة" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Partners & Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Partners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Building2 className="w-5 h-5 text-primary" />
              أهم الشركاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partnerStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={partnerStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} كجم`, 'الكمية']} />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end">
              <Users className="w-5 h-5 text-primary" />
              أداء السائقين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {driverPerformance.map((driver, index) => {
                const completionRate = driver.shipments > 0 ? (driver.completed / driver.shipments) * 100 : 0;
                return (
                  <div key={driver.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">{driver.completed}/{driver.shipments}</Badge>
                        <span className="text-muted-foreground">شحنة</span>
                      </span>
                      <span className="font-medium">{driver.name}</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                );
              })}
              {driverPerformance.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  لا توجد بيانات عن السائقين
                </div>
              )}
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
                التحليل الذكي لأداء النقل
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

export default TransporterAnalytics;
