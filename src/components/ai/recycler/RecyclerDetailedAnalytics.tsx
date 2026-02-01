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
  AlertTriangle, CheckCircle2, Clock
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
import { wasteTypeLabels, isHazardousWasteType } from '@/lib/wasteClassification';

interface PeriodData {
  period: string;
  received: number;
  processed: number;
  efficiency: number;
}

interface WasteTypePeriodStats {
  waste_type: string;
  name: string;
  weeklyData: PeriodData[];
  monthlyData: PeriodData[];
  yearlyData: PeriodData[];
  totalReceived: number;
  totalProcessed: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const RecyclerDetailedAnalytics = () => {
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
        .select('id, waste_type, quantity, status, created_at, confirmed_at')
        .eq('recycler_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (shipments && shipments.length > 0) {
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
            const received = weekShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            const processed = weekShipments
              .filter(s => s.status === 'confirmed')
              .reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            weeklyData.push({
              period: format(weekStart, 'dd/MM', { locale: ar }),
              received,
              processed,
              efficiency: received > 0 ? (processed / received) * 100 : 0
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
            const received = monthShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            const processed = monthShipments
              .filter(s => s.status === 'confirmed')
              .reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            monthlyData.push({
              period: format(monthStart, 'MMM yy', { locale: ar }),
              received,
              processed,
              efficiency: received > 0 ? (processed / received) * 100 : 0
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
            const received = yearShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            const processed = yearShipments
              .filter(s => s.status === 'confirmed')
              .reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            yearlyData.push({
              period: format(yearStart, 'yyyy'),
              received,
              processed,
              efficiency: received > 0 ? (processed / received) * 100 : 0
            });
          }

          const totalReceived = typeShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
          const totalProcessed = typeShipments
            .filter(s => s.status === 'confirmed')
            .reduce((sum, s) => sum + (s.quantity || 0), 0);

          // Calculate growth
          const weeklyGrowth = weeklyData.length >= 2 && weeklyData[weeklyData.length - 2].received > 0
            ? ((weeklyData[weeklyData.length - 1].received - weeklyData[weeklyData.length - 2].received) / 
               weeklyData[weeklyData.length - 2].received) * 100
            : 0;

          const monthlyGrowth = monthlyData.length >= 2 && monthlyData[monthlyData.length - 2].received > 0
            ? ((monthlyData[monthlyData.length - 1].received - monthlyData[monthlyData.length - 2].received) / 
               monthlyData[monthlyData.length - 2].received) * 100
            : 0;

          statsArray.push({
            waste_type: wasteType,
            name: wasteTypeLabels[wasteType] || wasteType,
            weeklyData,
            monthlyData,
            yearlyData,
            totalReceived,
            totalProcessed,
            weeklyGrowth,
            monthlyGrowth,
          });
        });

        statsArray.sort((a, b) => b.totalReceived - a.totalReceived);
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
            تحليل تفصيلي لكل نوع مخلفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-end">
            {wasteTypeStats.map((stat) => {
              const isHazardous = isHazardousWasteType(stat.waste_type);
              return (
                <Badge
                  key={stat.waste_type}
                  variant={selectedWasteType === stat.waste_type ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    selectedWasteType === stat.waste_type 
                      ? 'scale-105' 
                      : 'hover:scale-105'
                  } ${isHazardous ? 'border-red-500/50' : ''}`}
                  onClick={() => setSelectedWasteType(stat.waste_type)}
                >
                  {isHazardous && <AlertTriangle className="w-3 h-3 ml-1" />}
                  {stat.name}
                  <span className="mr-1 text-xs opacity-70">({stat.totalReceived.toLocaleString()} كجم)</span>
                </Badge>
              );
            })}
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
                      <p className="text-xs text-muted-foreground">إجمالي المستلم</p>
                      <p className="text-xl font-bold">{selectedStats.totalReceived.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">كجم</p>
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
                      <p className="text-xs text-muted-foreground">تم معالجته</p>
                      <p className="text-xl font-bold">{selectedStats.totalProcessed.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">كجم</p>
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
                    <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="processedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} كجم`, 
                      name === 'received' ? 'المستلم' : 'المعالج'
                    ]} 
                  />
                  <Legend formatter={(value) => value === 'received' ? 'المستلم' : 'المعالج'} />
                  <Area 
                    type="monotone" 
                    dataKey="received" 
                    stroke="#3b82f6" 
                    fill="url(#receivedGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="processed" 
                    stroke="#10b981" 
                    fill="url(#processedGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Efficiency Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <TrendingUp className="w-5 h-5 text-primary" />
                كفاءة المعالجة عبر الزمن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'كفاءة المعالجة']} 
                  />
                  <Bar 
                    dataKey="efficiency" 
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
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد بيانات لعرضها</p>
            <p className="text-sm">ستظهر الإحصائيات هنا بعد استلام الشحنات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecyclerDetailedAnalytics;
