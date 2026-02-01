import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CalendarDays, TrendingUp, TrendingDown, Loader2, Package, 
  Truck, Clock, CheckCircle2, Users, Route, MapPin, Zap,
  Activity, Target, Award, BarChart3, Timer
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar
} from 'recharts';
import { 
  format, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval,
  differenceInDays, differenceInHours
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels } from '@/lib/wasteClassification';

interface PeriodData {
  period: string;
  total: number;
  completed: number;
  deliveryRate: number;
  avgDeliveryTime: number;
  totalQuantity: number;
}

interface OverallStats {
  totalShipments: number;
  completedShipments: number;
  avgDeliveryRate: number;
  peakMonth: string;
  peakShipments: number;
  totalQuantity: number;
  avgDeliveryDays: number;
  activeDrivers: number;
  totalDrivers: number;
}

interface WasteTypePeriodStats {
  waste_type: string;
  name: string;
  weeklyData: PeriodData[];
  monthlyData: PeriodData[];
  yearlyData: PeriodData[];
  totalShipments: number;
  totalCompleted: number;
  totalQuantity: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  avgDeliveryTime: number;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const RADIAL_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

const TransporterDetailedAnalytics = () => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [wasteTypeStats, setWasteTypeStats] = useState<WasteTypePeriodStats[]>([]);
  const [selectedWasteType, setSelectedWasteType] = useState<string | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);

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
        .select('id, waste_type, quantity, status, created_at, approved_at, delivered_at')
        .eq('transporter_id', organization?.id)
        .order('created_at', { ascending: false });

      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, is_available')
        .eq('organization_id', organization?.id);

      if (error) throw error;

      if (shipments && shipments.length > 0) {
        const completedStatuses = ['delivered', 'confirmed'];
        const completedShipments = shipments.filter(s => completedStatuses.includes(s.status));
        const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

        // Calculate average delivery time
        let totalDeliveryDays = 0;
        let deliveryCount = 0;
        completedShipments.forEach(s => {
          if (s.approved_at && s.delivered_at) {
            const days = differenceInDays(new Date(s.delivered_at), new Date(s.approved_at));
            totalDeliveryDays += Math.max(0, days);
            deliveryCount++;
          }
        });

        // Find peak month
        const monthlyShipments: Record<string, number> = {};
        shipments.forEach(s => {
          const monthKey = format(new Date(s.created_at), 'yyyy-MM');
          monthlyShipments[monthKey] = (monthlyShipments[monthKey] || 0) + 1;
        });
        const peakEntry = Object.entries(monthlyShipments).sort((a, b) => b[1] - a[1])[0];

        setOverallStats({
          totalShipments: shipments.length,
          completedShipments: completedShipments.length,
          avgDeliveryRate: shipments.length > 0 ? (completedShipments.length / shipments.length) * 100 : 0,
          peakMonth: peakEntry ? format(new Date(peakEntry[0] + '-01'), 'MMMM yyyy', { locale: ar }) : '-',
          peakShipments: peakEntry ? peakEntry[1] : 0,
          totalQuantity,
          avgDeliveryDays: deliveryCount > 0 ? totalDeliveryDays / deliveryCount : 0,
          activeDrivers: drivers?.filter(d => d.is_available).length || 0,
          totalDrivers: drivers?.length || 0,
        });

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
            const completedWeek = weekShipments.filter(s => completedStatuses.includes(s.status));
            const completed = completedWeek.length;
            const totalQty = weekShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            let avgTime = 0;
            completedWeek.forEach(s => {
              if (s.approved_at && s.delivered_at) {
                avgTime += differenceInDays(new Date(s.delivered_at), new Date(s.approved_at));
              }
            });
            
            weeklyData.push({
              period: format(weekStart, 'dd/MM', { locale: ar }),
              total,
              completed,
              deliveryRate: total > 0 ? (completed / total) * 100 : 0,
              avgDeliveryTime: completedWeek.length > 0 ? avgTime / completedWeek.length : 0,
              totalQuantity: totalQty,
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
            const completedMonth = monthShipments.filter(s => completedStatuses.includes(s.status));
            const completed = completedMonth.length;
            const totalQty = monthShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            let avgTime = 0;
            completedMonth.forEach(s => {
              if (s.approved_at && s.delivered_at) {
                avgTime += differenceInDays(new Date(s.delivered_at), new Date(s.approved_at));
              }
            });
            
            monthlyData.push({
              period: format(monthStart, 'MMM yy', { locale: ar }),
              total,
              completed,
              deliveryRate: total > 0 ? (completed / total) * 100 : 0,
              avgDeliveryTime: completedMonth.length > 0 ? avgTime / completedMonth.length : 0,
              totalQuantity: totalQty,
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
            const completedYear = yearShipments.filter(s => completedStatuses.includes(s.status));
            const completed = completedYear.length;
            const totalQty = yearShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            let avgTime = 0;
            completedYear.forEach(s => {
              if (s.approved_at && s.delivered_at) {
                avgTime += differenceInDays(new Date(s.delivered_at), new Date(s.approved_at));
              }
            });
            
            yearlyData.push({
              period: format(yearStart, 'yyyy'),
              total,
              completed,
              deliveryRate: total > 0 ? (completed / total) * 100 : 0,
              avgDeliveryTime: completedYear.length > 0 ? avgTime / completedYear.length : 0,
              totalQuantity: totalQty,
            });
          }

          const typeCompleted = typeShipments.filter(s => completedStatuses.includes(s.status));
          const totalShipments = typeShipments.length;
          const totalCompleted = typeCompleted.length;
          const typeQuantity = typeShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

          // Calculate delivery time
          let totalDays = 0;
          let count = 0;
          typeCompleted.forEach(s => {
            if (s.approved_at && s.delivered_at) {
              totalDays += differenceInDays(new Date(s.delivered_at), new Date(s.approved_at));
              count++;
            }
          });

          // Calculate growth rates
          const weeklyGrowth = weeklyData.length >= 2 && weeklyData[weeklyData.length - 2].total > 0
            ? ((weeklyData[weeklyData.length - 1].total - weeklyData[weeklyData.length - 2].total) / 
               weeklyData[weeklyData.length - 2].total) * 100
            : 0;

          const monthlyGrowth = monthlyData.length >= 2 && monthlyData[monthlyData.length - 2].total > 0
            ? ((monthlyData[monthlyData.length - 1].total - monthlyData[monthlyData.length - 2].total) / 
               monthlyData[monthlyData.length - 2].total) * 100
            : 0;

          const yearlyGrowth = yearlyData.length >= 2 && yearlyData[yearlyData.length - 2].total > 0
            ? ((yearlyData[yearlyData.length - 1].total - yearlyData[yearlyData.length - 2].total) / 
               yearlyData[yearlyData.length - 2].total) * 100
            : 0;

          statsArray.push({
            waste_type: wasteType,
            name: wasteTypeLabels[wasteType] || wasteType,
            weeklyData,
            monthlyData,
            yearlyData,
            totalShipments,
            totalCompleted,
            totalQuantity: typeQuantity,
            weeklyGrowth,
            monthlyGrowth,
            yearlyGrowth,
            avgDeliveryTime: count > 0 ? totalDays / count : 0,
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

  // Radar chart data for top 6 waste types
  const top6Stats = wasteTypeStats.slice(0, 6);
  const radarData = [
    { metric: 'الشحنات', ...Object.fromEntries(top6Stats.map(s => [s.name, Math.min(100, (s.totalShipments / (overallStats?.totalShipments || 1)) * 100)])) },
    { metric: 'التسليم', ...Object.fromEntries(top6Stats.map(s => [s.name, s.totalShipments > 0 ? (s.totalCompleted / s.totalShipments) * 100 : 0])) },
    { metric: 'الكمية', ...Object.fromEntries(top6Stats.map(s => [s.name, Math.min(100, (s.totalQuantity / (overallStats?.totalQuantity || 1)) * 100)])) },
    { metric: 'النمو', ...Object.fromEntries(top6Stats.map(s => [s.name, Math.max(0, Math.min(100, 50 + s.monthlyGrowth))])) },
  ];

  // Radial chart data for delivery rates
  const radialData = top6Stats.map((s, i) => ({
    name: s.name,
    value: s.totalShipments > 0 ? (s.totalCompleted / s.totalShipments) * 100 : 0,
    fill: RADIAL_COLORS[i % RADIAL_COLORS.length],
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
      {/* Overall Stats Dashboard */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-3 text-center">
                <Package className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
                <p className="text-lg font-bold">{overallStats.totalShipments}</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">المكتملة</p>
                <p className="text-lg font-bold">{overallStats.completedShipments}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="p-3 text-center">
                <Target className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs text-muted-foreground">معدل التسليم</p>
                <p className="text-lg font-bold">{overallStats.avgDeliveryRate.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-3 text-center">
                <Clock className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">متوسط التسليم</p>
                <p className="text-lg font-bold">{overallStats.avgDeliveryDays.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">يوم</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
              <CardContent className="p-3 text-center">
                <Users className="w-6 h-6 mx-auto text-cyan-500 mb-1" />
                <p className="text-xs text-muted-foreground">السائقين</p>
                <p className="text-lg font-bold">{overallStats.activeDrivers}/{overallStats.totalDrivers}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-3 text-center">
                <Award className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-muted-foreground">شهر الذروة</p>
                <p className="text-sm font-bold truncate">{overallStats.peakMonth}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
              <CardContent className="p-3 text-center">
                <Truck className="w-6 h-6 mx-auto text-rose-500 mb-1" />
                <p className="text-xs text-muted-foreground">أعلى شحنات</p>
                <p className="text-lg font-bold">{overallStats.peakShipments}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
            <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
              <CardContent className="p-3 text-center">
                <Activity className="w-6 h-6 mx-auto text-indigo-500 mb-1" />
                <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
                <p className="text-lg font-bold">{(overallStats.totalQuantity / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">طن</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20">
              <CardContent className="p-3 text-center">
                <Route className="w-6 h-6 mx-auto text-teal-500 mb-1" />
                <p className="text-xs text-muted-foreground">أنواع المخلفات</p>
                <p className="text-lg font-bold">{wasteTypeStats.length}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Radar & Radial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              مقارنة أداء أنواع المخلفات
            </CardTitle>
            <CardDescription className="text-right">تحليل شامل للشحنات والتسليم والكمية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {top6Stats.map((stat, i) => (
                  <Radar
                    key={stat.waste_type}
                    name={stat.name}
                    dataKey={stat.name}
                    stroke={CHART_COLORS[i]}
                    fill={CHART_COLORS[i]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ direction: 'rtl' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-end text-base">
              <Zap className="w-5 h-5 text-primary" />
              معدلات التسليم حسب النوع
            </CardTitle>
            <CardDescription className="text-right">نسبة إتمام التسليم لكل نوع</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  label={{ fill: 'hsl(var(--foreground))', position: 'insideStart', fontSize: 10 }}
                />
                <Legend 
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ direction: 'rtl' }}
                />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'معدل التسليم']} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
          {/* Selected Type Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Timer className="w-6 h-6 text-purple-500" />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">متوسط التسليم</p>
                      <p className="text-xl font-bold">{selectedStats.avgDeliveryTime.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">يوم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {selectedStats.yearlyGrowth >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">نمو سنوي</p>
                      <p className={`text-xl font-bold ${selectedStats.yearlyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {selectedStats.yearlyGrowth >= 0 ? '+' : ''}{selectedStats.yearlyGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Period Tabs with Composed Chart */}
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
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="totalGradientTransporter" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="completedGradientTransporter" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'deliveryRate') return [`${value.toFixed(1)}%`, 'معدل التسليم'];
                      if (name === 'totalQuantity') return [`${value.toLocaleString()} كجم`, 'الكمية'];
                      return [value, name === 'total' ? 'إجمالي الشحنات' : 'المكتملة'];
                    }} 
                  />
                  <Legend formatter={(value) => {
                    if (value === 'total') return 'إجمالي الشحنات';
                    if (value === 'completed') return 'المكتملة';
                    if (value === 'deliveryRate') return 'معدل التسليم';
                    return value;
                  }} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    fill="url(#totalGradientTransporter)"
                    strokeWidth={2}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    fill="url(#completedGradientTransporter)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="deliveryRate" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <Truck className="w-5 h-5 text-primary" />
                جدول البيانات التفصيلي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-right">الشحنات</TableHead>
                      <TableHead className="text-right">المكتملة</TableHead>
                      <TableHead className="text-right">معدل التسليم</TableHead>
                      <TableHead className="text-right">متوسط التسليم</TableHead>
                      <TableHead className="text-right">الكمية (كجم)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.period}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.completed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={row.deliveryRate} className="h-2 w-16" />
                            <span className="text-sm">{row.deliveryRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{row.avgDeliveryTime.toFixed(1)} يوم</TableCell>
                        <TableCell>{row.totalQuantity.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Full Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <BarChart3 className="w-5 h-5 text-primary" />
            جدول مقارنة شامل لجميع الأنواع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع المخلفات</TableHead>
                  <TableHead className="text-right">الشحنات</TableHead>
                  <TableHead className="text-right">المكتملة</TableHead>
                  <TableHead className="text-right">النسبة</TableHead>
                  <TableHead className="text-right">نمو شهري</TableHead>
                  <TableHead className="text-right">متوسط التسليم</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteTypeStats.map((stat) => {
                  const percentage = overallStats?.totalShipments 
                    ? (stat.totalShipments / overallStats.totalShipments) * 100 
                    : 0;
                  return (
                    <TableRow key={stat.waste_type}>
                      <TableCell className="font-medium text-right">{stat.name}</TableCell>
                      <TableCell>{stat.totalShipments}</TableCell>
                      <TableCell>{stat.totalCompleted}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2 w-16" />
                          <span className="text-sm">{percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={stat.monthlyGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                          {stat.monthlyGrowth >= 0 ? '+' : ''}{stat.monthlyGrowth.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>{stat.avgDeliveryTime.toFixed(1)} يوم</TableCell>
                      <TableCell>{stat.totalQuantity.toLocaleString()} كجم</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
