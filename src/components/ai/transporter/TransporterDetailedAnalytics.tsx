import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CalendarDays, TrendingUp, TrendingDown, Loader2, Package, 
  Truck, Clock, CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { 
  format, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval 
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels } from '@/lib/wasteClassification';

interface PeriodData {
  period: string;
  total: number;
  completed: number;
  deliveryRate: number;
}

interface WasteTypePeriodStats {
  waste_type: string;
  name: string;
  weeklyData: PeriodData[];
  monthlyData: PeriodData[];
  yearlyData: PeriodData[];
  totalShipments: number;
  totalCompleted: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

const TransporterDetailedAnalytics = () => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [wasteTypeStats, setWasteTypeStats] = useState<WasteTypePeriodStats[]>([]);
  const [selectedWasteType, setSelectedWasteType] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id) {
      fetchDetailedAnalytics();
    }
  }, [organization?.id]);

  const fetchDetailedAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, status, created_at, delivered_at')
        .eq('transporter_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (shipments && shipments.length > 0) {
        const completedStatuses = ['delivered', 'confirmed'];
        
        // Group by waste type
        const wasteTypeMap: Record<string, any[]> = {};
        shipments.forEach(s => {
          if (!wasteTypeMap[s.waste_type]) {
            wasteTypeMap[s.waste_type] = [];
          }
          wasteTypeMap[s.waste_type].push(s);
        });

        const now = new Date();
        const statsArray: WasteTypePeriodStats[] = [];

        Object.entries(wasteTypeMap).forEach(([wasteType, typeShipments]) => {
          // Weekly data (12 weeks)
          const weeklyData: PeriodData[] = [];
          for (let i = 11; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
            const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
            const weekShipments = typeShipments.filter(s => 
              isWithinInterval(new Date(s.created_at), { start: weekStart, end: weekEnd })
            );
            const total = weekShipments.length;
            const completed = weekShipments.filter(s => completedStatuses.includes(s.status)).length;
            
            weeklyData.push({
              period: format(weekStart, 'dd/MM', { locale: ar }),
              total,
              completed,
              deliveryRate: total > 0 ? (completed / total) * 100 : 0
            });
          }

          // Monthly data (12 months)
          const monthlyData: PeriodData[] = [];
          for (let i = 11; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));
            const monthShipments = typeShipments.filter(s => 
              isWithinInterval(new Date(s.created_at), { start: monthStart, end: monthEnd })
            );
            const total = monthShipments.length;
            const completed = monthShipments.filter(s => completedStatuses.includes(s.status)).length;
            
            monthlyData.push({
              period: format(monthStart, 'MMM yy', { locale: ar }),
              total,
              completed,
              deliveryRate: total > 0 ? (completed / total) * 100 : 0
            });
          }

          // Yearly data (5 years)
          const yearlyData: PeriodData[] = [];
          for (let i = 4; i >= 0; i--) {
            const yearStart = startOfYear(subYears(now, i));
            const yearEnd = endOfYear(subYears(now, i));
            const yearShipments = typeShipments.filter(s => 
              isWithinInterval(new Date(s.created_at), { start: yearStart, end: yearEnd })
            );
            const total = yearShipments.length;
            const completed = yearShipments.filter(s => completedStatuses.includes(s.status)).length;
            
            yearlyData.push({
              period: format(yearStart, 'yyyy'),
              total,
              completed,
              deliveryRate: total > 0 ? (completed / total) * 100 : 0
            });
          }

          const totalShipments = typeShipments.length;
          const totalCompleted = typeShipments.filter(s => completedStatuses.includes(s.status)).length;

          // Calculate growth
          const weeklyGrowth = weeklyData.length >= 2 && weeklyData[weeklyData.length - 2].total > 0
            ? ((weeklyData[weeklyData.length - 1].total - weeklyData[weeklyData.length - 2].total) / 
               weeklyData[weeklyData.length - 2].total) * 100
            : 0;

          const monthlyGrowth = monthlyData.length >= 2 && monthlyData[monthlyData.length - 2].total > 0
            ? ((monthlyData[monthlyData.length - 1].total - monthlyData[monthlyData.length - 2].total) / 
               monthlyData[monthlyData.length - 2].total) * 100
            : 0;

          statsArray.push({
            waste_type: wasteType,
            name: wasteTypeLabels[wasteType] || wasteType,
            weeklyData,
            monthlyData,
            yearlyData,
            totalShipments,
            totalCompleted,
            weeklyGrowth,
            monthlyGrowth,
          });
        });

        statsArray.sort((a, b) => b.totalShipments - a.totalShipments);
        setWasteTypeStats(statsArray);
        if (statsArray.length > 0) {
          setSelectedWasteType(statsArray[0].waste_type);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedStats = wasteTypeStats.find(s => s.waste_type === selectedWasteType);
  const chartData = selectedStats 
    ? (selectedPeriod === 'weekly' ? selectedStats.weeklyData 
      : selectedPeriod === 'monthly' ? selectedStats.monthlyData 
      : selectedStats.yearlyData)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Waste Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <CalendarDays className="w-5 h-5 text-primary" />
            تحليل تفصيلي للشحنات حسب النوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-end">
            {wasteTypeStats.map((stat) => (
              <Badge
                key={stat.waste_type}
                variant={selectedWasteType === stat.waste_type ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  selectedWasteType === stat.waste_type 
                    ? 'scale-105' 
                    : 'hover:scale-105'
                }`}
                onClick={() => setSelectedWasteType(stat.waste_type)}
              >
                {stat.name}
                <span className="mr-1 text-xs opacity-70">({stat.totalShipments} شحنة)</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedStats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Package className="w-6 h-6 text-blue-500" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
                      <p className="text-xl font-bold">{selectedStats.totalShipments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">المكتملة</p>
                      <p className="text-xl font-bold">{selectedStats.totalCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {selectedStats.weeklyGrowth >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">نمو أسبوعي</p>
                      <p className={`text-xl font-bold ${selectedStats.weeklyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedStats.weeklyGrowth >= 0 ? '+' : ''}{selectedStats.weeklyGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {selectedStats.monthlyGrowth >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">نمو شهري</p>
                      <p className={`text-xl font-bold ${selectedStats.monthlyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedStats.monthlyGrowth >= 0 ? '+' : ''}{selectedStats.monthlyGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Period Tabs */}
          <Card>
            <CardHeader>
              <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)} dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
                  <TabsTrigger value="monthly">شهري</TabsTrigger>
                  <TabsTrigger value="yearly">سنوي</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value, 
                      name === 'total' ? 'إجمالي الشحنات' : 'المكتملة'
                    ]} 
                  />
                  <Legend formatter={(value) => value === 'total' ? 'إجمالي الشحنات' : 'المكتملة'} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    fill="url(#totalGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    fill="url(#completedGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Delivery Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <Truck className="w-5 h-5 text-primary" />
                معدل التسليم عبر الزمن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'معدل التسليم']} 
                  />
                  <Bar 
                    dataKey="deliveryRate" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {wasteTypeStats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد بيانات لعرضها</p>
            <p className="text-sm">ستظهر الإحصائيات هنا بعد نقل الشحنات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TransporterDetailedAnalytics;
