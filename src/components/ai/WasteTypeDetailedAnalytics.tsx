import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, Loader2, TrendingUp, Calendar, CalendarDays, CalendarRange,
  ArrowUpRight, ArrowDownRight, Minus, Package, Scale, AlertTriangle, Leaf,
  Target, Award, Activity, Zap, PieChart, Timer, Truck, Recycle,
  ThermometerSun, Droplets, Factory, BarChart2, LineChart as LineChartIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, PieChart as RechartsPie, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
  Scatter, RadialBarChart, RadialBar
} from 'recharts';
import { format, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { isHazardousWasteType, wasteTypeLabels, findCategoryById } from '@/lib/wasteClassification';

interface ShipmentData {
  id: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  status: string;
}

interface PeriodStats {
  period: string;
  quantity: number;
  shipments: number;
  avgPerShipment: number;
  minQuantity: number;
  maxQuantity: number;
}

interface WasteTypeStats {
  waste_type: string;
  name: string;
  isHazardous: boolean;
  weeklyData: PeriodStats[];
  monthlyData: PeriodStats[];
  yearlyData: PeriodStats[];
  totalQuantity: number;
  totalShipments: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  avgQuantityPerShipment: number;
  maxSingleShipment: number;
  minSingleShipment: number;
  firstShipmentDate: string;
  lastShipmentDate: string;
  activeDays: number;
  percentageOfTotal: number;
}

interface OverallStats {
  totalQuantity: number;
  totalShipments: number;
  hazardousQuantity: number;
  nonHazardousQuantity: number;
  hazardousPercentage: number;
  avgDailyQuantity: number;
  avgWeeklyQuantity: number;
  avgMonthlyQuantity: number;
  peakMonth: string;
  peakMonthQuantity: number;
  uniqueWasteTypes: number;
  avgShipmentWeight: number;
  totalActiveDays: number;
  shipmentFrequency: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];
const HAZARDOUS_COLOR = '#EF4444';
const NON_HAZARDOUS_COLOR = '#10B981';

const WasteTypeDetailedAnalytics = () => {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWasteType, setSelectedWasteType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (organization?.id) {
      fetchShipments();
    }
  }, [organization?.id]);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, waste_type, quantity, unit, created_at, status')
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWasteTypeName = (type: string): string => {
    if (wasteTypeLabels[type]) return wasteTypeLabels[type];
    const category = findCategoryById(type);
    if (category) return category.name;
    return type;
  };

  const calculateGrowth = (data: PeriodStats[]): number => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1]?.quantity || 0;
    const previous = data[data.length - 2]?.quantity || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Overall Statistics
  const overallStats = useMemo((): OverallStats => {
    const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalShipments = shipments.length;
    
    const hazardousShipments = shipments.filter(s => isHazardousWasteType(s.waste_type));
    const hazardousQuantity = hazardousShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const nonHazardousQuantity = totalQuantity - hazardousQuantity;
    
    const dates = shipments.map(s => new Date(s.created_at)).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const totalDays = firstDate && lastDate ? Math.max(1, differenceInDays(lastDate, firstDate)) : 1;
    
    // Monthly quantities for peak calculation
    const monthlyQuantities: Record<string, number> = {};
    shipments.forEach(s => {
      const monthKey = format(new Date(s.created_at), 'yyyy-MM');
      monthlyQuantities[monthKey] = (monthlyQuantities[monthKey] || 0) + (s.quantity || 0);
    });
    
    const peakEntry = Object.entries(monthlyQuantities).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalQuantity,
      totalShipments,
      hazardousQuantity,
      nonHazardousQuantity,
      hazardousPercentage: totalQuantity > 0 ? (hazardousQuantity / totalQuantity) * 100 : 0,
      avgDailyQuantity: totalQuantity / totalDays,
      avgWeeklyQuantity: (totalQuantity / totalDays) * 7,
      avgMonthlyQuantity: (totalQuantity / totalDays) * 30,
      peakMonth: peakEntry ? format(new Date(peakEntry[0] + '-01'), 'MMMM yyyy', { locale: ar }) : '-',
      peakMonthQuantity: peakEntry ? peakEntry[1] : 0,
      uniqueWasteTypes: [...new Set(shipments.map(s => s.waste_type))].length,
      avgShipmentWeight: totalShipments > 0 ? totalQuantity / totalShipments : 0,
      totalActiveDays: totalDays,
      shipmentFrequency: totalDays > 0 ? totalShipments / totalDays : 0,
    };
  }, [shipments]);

  const wasteTypeStats = useMemo((): WasteTypeStats[] => {
    const now = new Date();
    const wasteTypes = [...new Set(shipments.map(s => s.waste_type))];
    const totalQuantity = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

    return wasteTypes.map(wasteType => {
      const typeShipments = shipments.filter(s => s.waste_type === wasteType);
      const quantities = typeShipments.map(s => s.quantity || 0);
      const typeTotal = quantities.reduce((sum, q) => sum + q, 0);
      const dates = typeShipments.map(s => new Date(s.created_at)).sort((a, b) => a.getTime() - b.getTime());

      // Weekly data - last 12 weeks
      const weeklyData: PeriodStats[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
        
        const weekShipments = typeShipments.filter(s => {
          const date = new Date(s.created_at);
          return isWithinInterval(date, { start: weekStart, end: weekEnd });
        });

        const weekQuantities = weekShipments.map(s => s.quantity || 0);
        const quantity = weekQuantities.reduce((sum, q) => sum + q, 0);
        weeklyData.push({
          period: format(weekStart, 'd MMM', { locale: ar }),
          quantity,
          shipments: weekShipments.length,
          avgPerShipment: weekShipments.length > 0 ? quantity / weekShipments.length : 0,
          minQuantity: weekQuantities.length > 0 ? Math.min(...weekQuantities) : 0,
          maxQuantity: weekQuantities.length > 0 ? Math.max(...weekQuantities) : 0,
        });
      }

      // Monthly data - last 12 months
      const monthlyData: PeriodStats[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const monthShipments = typeShipments.filter(s => {
          const date = new Date(s.created_at);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        });

        const monthQuantities = monthShipments.map(s => s.quantity || 0);
        const quantity = monthQuantities.reduce((sum, q) => sum + q, 0);
        monthlyData.push({
          period: format(monthStart, 'MMM yyyy', { locale: ar }),
          quantity,
          shipments: monthShipments.length,
          avgPerShipment: monthShipments.length > 0 ? quantity / monthShipments.length : 0,
          minQuantity: monthQuantities.length > 0 ? Math.min(...monthQuantities) : 0,
          maxQuantity: monthQuantities.length > 0 ? Math.max(...monthQuantities) : 0,
        });
      }

      // Yearly data - last 5 years
      const yearlyData: PeriodStats[] = [];
      for (let i = 4; i >= 0; i--) {
        const yearStart = startOfYear(subYears(now, i));
        const yearEnd = endOfYear(subYears(now, i));
        
        const yearShipments = typeShipments.filter(s => {
          const date = new Date(s.created_at);
          return isWithinInterval(date, { start: yearStart, end: yearEnd });
        });

        const yearQuantities = yearShipments.map(s => s.quantity || 0);
        const quantity = yearQuantities.reduce((sum, q) => sum + q, 0);
        yearlyData.push({
          period: format(yearStart, 'yyyy', { locale: ar }),
          quantity,
          shipments: yearShipments.length,
          avgPerShipment: yearShipments.length > 0 ? quantity / yearShipments.length : 0,
          minQuantity: yearQuantities.length > 0 ? Math.min(...yearQuantities) : 0,
          maxQuantity: yearQuantities.length > 0 ? Math.max(...yearQuantities) : 0,
        });
      }

      return {
        waste_type: wasteType,
        name: getWasteTypeName(wasteType),
        isHazardous: isHazardousWasteType(wasteType),
        weeklyData,
        monthlyData,
        yearlyData,
        totalQuantity: typeTotal,
        totalShipments: typeShipments.length,
        weeklyGrowth: calculateGrowth(weeklyData),
        monthlyGrowth: calculateGrowth(monthlyData),
        yearlyGrowth: calculateGrowth(yearlyData),
        avgQuantityPerShipment: typeShipments.length > 0 ? typeTotal / typeShipments.length : 0,
        maxSingleShipment: quantities.length > 0 ? Math.max(...quantities) : 0,
        minSingleShipment: quantities.length > 0 ? Math.min(...quantities) : 0,
        firstShipmentDate: dates[0] ? format(dates[0], 'dd/MM/yyyy', { locale: ar }) : '-',
        lastShipmentDate: dates[dates.length - 1] ? format(dates[dates.length - 1], 'dd/MM/yyyy', { locale: ar }) : '-',
        activeDays: dates.length >= 2 ? differenceInDays(dates[dates.length - 1], dates[0]) : 0,
        percentageOfTotal: totalQuantity > 0 ? (typeTotal / totalQuantity) * 100 : 0,
      };
    }).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [shipments]);

  const uniqueWasteTypes = useMemo(() => 
    [...new Set(shipments.map(s => s.waste_type))], 
    [shipments]
  );

  const selectedStats = useMemo(() => {
    if (selectedWasteType === 'all') return null;
    return wasteTypeStats.find(s => s.waste_type === selectedWasteType);
  }, [selectedWasteType, wasteTypeStats]);

  const allTypesChartData = useMemo(() => {
    if (selectedPeriod === 'week') {
      const periods = wasteTypeStats[0]?.weeklyData.map(d => d.period) || [];
      return periods.map((period, idx) => {
        const data: Record<string, any> = { period };
        wasteTypeStats.forEach(stat => {
          data[stat.name] = stat.weeklyData[idx]?.quantity || 0;
        });
        return data;
      });
    } else if (selectedPeriod === 'month') {
      const periods = wasteTypeStats[0]?.monthlyData.map(d => d.period) || [];
      return periods.map((period, idx) => {
        const data: Record<string, any> = { period };
        wasteTypeStats.forEach(stat => {
          data[stat.name] = stat.monthlyData[idx]?.quantity || 0;
        });
        return data;
      });
    } else {
      const periods = wasteTypeStats[0]?.yearlyData.map(d => d.period) || [];
      return periods.map((period, idx) => {
        const data: Record<string, any> = { period };
        wasteTypeStats.forEach(stat => {
          data[stat.name] = stat.yearlyData[idx]?.quantity || 0;
        });
        return data;
      });
    }
  }, [wasteTypeStats, selectedPeriod]);

  // Pie chart data for hazardous vs non-hazardous
  const hazardousPieData = useMemo(() => [
    { name: 'مخلفات خطرة', value: overallStats.hazardousQuantity, color: HAZARDOUS_COLOR },
    { name: 'مخلفات غير خطرة', value: overallStats.nonHazardousQuantity, color: NON_HAZARDOUS_COLOR },
  ], [overallStats]);

  // Distribution pie chart
  const distributionPieData = useMemo(() => 
    wasteTypeStats.slice(0, 8).map((stat, idx) => ({
      name: stat.name,
      value: stat.totalQuantity,
      color: COLORS[idx % COLORS.length],
    })),
  [wasteTypeStats]);

  // Radar chart data for top 6 waste types
  const radarData = useMemo(() => {
    const top6 = wasteTypeStats.slice(0, 6);
    return [
      {
        metric: 'الكمية',
        ...Object.fromEntries(top6.map(s => [s.name, Math.min(100, (s.totalQuantity / (wasteTypeStats[0]?.totalQuantity || 1)) * 100)])),
      },
      {
        metric: 'الشحنات',
        ...Object.fromEntries(top6.map(s => [s.name, Math.min(100, (s.totalShipments / (wasteTypeStats[0]?.totalShipments || 1)) * 100)])),
      },
      {
        metric: 'المتوسط',
        ...Object.fromEntries(top6.map(s => [s.name, Math.min(100, (s.avgQuantityPerShipment / (wasteTypeStats[0]?.avgQuantityPerShipment || 1)) * 100)])),
      },
      {
        metric: 'النمو',
        ...Object.fromEntries(top6.map(s => [s.name, Math.max(0, Math.min(100, 50 + s.monthlyGrowth))])),
      },
    ];
  }, [wasteTypeStats]);

  // Performance indicators data
  const performanceData = useMemo(() => 
    wasteTypeStats.slice(0, 6).map((stat, idx) => ({
      name: stat.name,
      value: stat.percentageOfTotal,
      fill: COLORS[idx % COLORS.length],
    })),
  [wasteTypeStats]);

  const GrowthIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-amber-600">
          <ArrowUpRight className="w-4 h-4" />
          <span className="text-sm font-medium">+{value.toFixed(1)}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowDownRight className="w-4 h-4" />
          <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span className="text-sm">0%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد بيانات شحنات</h3>
          <p className="text-muted-foreground">قم بإنشاء شحنات لعرض التحليلات التفصيلية</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full" />
            <CardContent className="p-4 text-right">
              <Scale className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
              <p className="text-xl font-bold">{overallStats.totalQuantity.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">كجم</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full" />
            <CardContent className="p-4 text-right">
              <Truck className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
              <p className="text-xl font-bold">{overallStats.totalShipments.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">شحنة</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />
            <CardContent className="p-4 text-right">
              <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
              <p className="text-xs text-muted-foreground">مخلفات خطرة</p>
              <p className="text-xl font-bold">{overallStats.hazardousPercentage.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{overallStats.hazardousQuantity.toLocaleString()} كجم</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full" />
            <CardContent className="p-4 text-right">
              <Recycle className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-xs text-muted-foreground">أنواع المخلفات</p>
              <p className="text-xl font-bold">{overallStats.uniqueWasteTypes}</p>
              <p className="text-xs text-muted-foreground">نوع مختلف</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full" />
            <CardContent className="p-4 text-right">
              <Activity className="w-5 h-5 text-purple-500 mb-2" />
              <p className="text-xs text-muted-foreground">متوسط الشحنة</p>
              <p className="text-xl font-bold">{overallStats.avgShipmentWeight.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">كجم/شحنة</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full" />
            <CardContent className="p-4 text-right">
              <Award className="w-5 h-5 text-amber-500 mb-2" />
              <p className="text-xs text-muted-foreground">شهر الذروة</p>
              <p className="text-sm font-bold truncate">{overallStats.peakMonth}</p>
              <p className="text-xs text-muted-foreground">{overallStats.peakMonthQuantity.toLocaleString()} كجم</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Advanced Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <Timer className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">المعدل اليومي</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{overallStats.avgDailyQuantity.toFixed(1)}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">كجم/يوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <CalendarDays className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-green-600 dark:text-green-400">المعدل الأسبوعي</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{overallStats.avgWeeklyQuantity.toFixed(0)}</p>
                <p className="text-xs text-green-600 dark:text-green-400">كجم/أسبوع</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400">المعدل الشهري</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{overallStats.avgMonthlyQuantity.toFixed(0)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">كجم/شهر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <Zap className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-xs text-amber-600 dark:text-amber-400">معدل التكرار</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{overallStats.shipmentFrequency.toFixed(2)}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">شحنة/يوم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Hazardous Split & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2 justify-end">
              <PieChart className="w-4 h-4 text-primary" />
              توزيع الخطورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={hazardousPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {hazardousPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2 justify-end">
              <BarChart2 className="w-4 h-4 text-primary" />
              توزيع الأنواع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={distributionPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                >
                  {distributionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-base flex items-center gap-2 justify-end">
              <Target className="w-4 h-4 text-primary" />
              مؤشرات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="90%" 
                data={performanceData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                  background
                  dataKey="value"
                />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader className="text-right pb-2">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Calendar className="w-5 h-5 text-primary" />
            تحليلات تفصيلية حسب الفترة الزمنية
          </CardTitle>
          <CardDescription>
            عرض بيانات كل نوع مخلف بالأسبوع والشهر والسنة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center justify-end">
            <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
              <SelectTrigger className="w-48 text-right">
                <SelectValue placeholder="اختر نوع المخلف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {uniqueWasteTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {getWasteTypeName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="week" className="gap-1">
                  <CalendarDays className="w-4 h-4" />
                  أسبوعي
                </TabsTrigger>
                <TabsTrigger value="month" className="gap-1">
                  <Calendar className="w-4 h-4" />
                  شهري
                </TabsTrigger>
                <TabsTrigger value="year" className="gap-1">
                  <CalendarRange className="w-4 h-4" />
                  سنوي
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* All Types Overview Chart */}
      {selectedWasteType === 'all' && (
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <BarChart3 className="w-5 h-5 text-primary" />
              مقارنة جميع الأنواع - {selectedPeriod === 'week' ? 'أسبوعي' : selectedPeriod === 'month' ? 'شهري' : 'سنوي'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={allTypesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                <Legend />
                {wasteTypeStats.slice(0, 8).map((stat, idx) => (
                  <Area
                    key={stat.waste_type}
                    type="monotone"
                    dataKey={stat.name}
                    stackId="1"
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.6}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Individual Waste Type Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wasteTypeStats.slice(0, selectedWasteType === 'all' ? 9 : wasteTypeStats.length).map((stat, idx) => {
          if (selectedWasteType !== 'all' && stat.waste_type !== selectedWasteType) return null;
          
          return (
            <motion.div
              key={stat.waste_type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`h-full ${stat.isHazardous ? 'border-red-200 dark:border-red-900/30' : 'border-green-200 dark:border-green-900/30'}`}>
                <CardHeader className="pb-2 text-right">
                  <div className="flex items-center gap-2 justify-between">
                    <Badge variant="outline" className="text-xs">
                      {stat.percentageOfTotal.toFixed(1)}%
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant={stat.isHazardous ? 'destructive' : 'secondary'} className="text-xs">
                        {stat.isHazardous ? 'خطرة' : 'غير خطرة'}
                      </Badge>
                      <CardTitle className="text-base">{stat.name}</CardTitle>
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2 text-right">
                      <p className="text-muted-foreground text-xs">إجمالي الكمية</p>
                      <p className="font-bold">{stat.totalQuantity.toLocaleString()} كجم</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-right">
                      <p className="text-muted-foreground text-xs">عدد الشحنات</p>
                      <p className="font-bold">{stat.totalShipments}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-right">
                      <p className="text-muted-foreground text-xs">أقصى شحنة</p>
                      <p className="font-bold">{stat.maxSingleShipment.toLocaleString()} كجم</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-right">
                      <p className="text-muted-foreground text-xs">متوسط الشحنة</p>
                      <p className="font-bold">{stat.avgQuantityPerShipment.toFixed(0)} كجم</p>
                    </div>
                  </div>

                  {/* Progress bar for percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{stat.percentageOfTotal.toFixed(1)}%</span>
                      <span className="text-muted-foreground">نسبة من الإجمالي</span>
                    </div>
                    <Progress value={stat.percentageOfTotal} className="h-2" />
                  </div>

                  {/* Growth Rates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <GrowthIndicator value={stat.weeklyGrowth} />
                      <span className="text-muted-foreground">نمو أسبوعي</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <GrowthIndicator value={stat.monthlyGrowth} />
                      <span className="text-muted-foreground">نمو شهري</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <GrowthIndicator value={stat.yearlyGrowth} />
                      <span className="text-muted-foreground">نمو سنوي</span>
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="text-xs text-muted-foreground text-right border-t pt-2">
                    <p>من: {stat.firstShipmentDate} - إلى: {stat.lastShipmentDate}</p>
                    <p>({stat.activeDays} يوم نشاط)</p>
                  </div>

                  {/* Mini Chart */}
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={selectedPeriod === 'week' ? stat.weeklyData : selectedPeriod === 'month' ? stat.monthlyData : stat.yearlyData}
                      >
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} كجم`}
                          labelFormatter={(label) => label}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="quantity" 
                          stroke={COLORS[idx % COLORS.length]} 
                          fill={COLORS[idx % COLORS.length]}
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Table for Selected Waste Type */}
      {selectedStats && (
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <TrendingUp className="w-5 h-5 text-primary" />
              التفاصيل الكاملة - {selectedStats.name}
            </CardTitle>
            <CardDescription>
              تحليل شامل يتضمن الحد الأدنى والأقصى والمتوسط لكل فترة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="week">أسبوعي (12 أسبوع)</TabsTrigger>
                <TabsTrigger value="month">شهري (12 شهر)</TabsTrigger>
                <TabsTrigger value="year">سنوي (5 سنوات)</TabsTrigger>
              </TabsList>

              <TabsContent value="week">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={selectedStats.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                      <Legend />
                      <Bar dataKey="quantity" name="الكمية" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="avgPerShipment" name="المتوسط" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الأسبوع</TableHead>
                          <TableHead className="text-right">الكمية (كجم)</TableHead>
                          <TableHead className="text-right">الشحنات</TableHead>
                          <TableHead className="text-right">المتوسط</TableHead>
                          <TableHead className="text-right">الحد الأدنى</TableHead>
                          <TableHead className="text-right">الحد الأقصى</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStats.weeklyData.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-right font-medium">{row.period}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{row.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{row.shipments}</TableCell>
                            <TableCell className="text-right">{row.avgPerShipment.toFixed(0)} كجم</TableCell>
                            <TableCell className="text-right text-green-600">{row.minQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-600">{row.maxQuantity.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="month">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={selectedStats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                      <Legend />
                      <Bar dataKey="quantity" name="الكمية" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="avgPerShipment" name="المتوسط" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الشهر</TableHead>
                          <TableHead className="text-right">الكمية (كجم)</TableHead>
                          <TableHead className="text-right">الشحنات</TableHead>
                          <TableHead className="text-right">المتوسط</TableHead>
                          <TableHead className="text-right">الحد الأدنى</TableHead>
                          <TableHead className="text-right">الحد الأقصى</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStats.monthlyData.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-right font-medium">{row.period}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{row.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{row.shipments}</TableCell>
                            <TableCell className="text-right">{row.avgPerShipment.toFixed(0)} كجم</TableCell>
                            <TableCell className="text-right text-green-600">{row.minQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-600">{row.maxQuantity.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="year">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={selectedStats.yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                      <Legend />
                      <Bar dataKey="quantity" name="الكمية" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="avgPerShipment" name="المتوسط" stroke="#EC4899" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">السنة</TableHead>
                          <TableHead className="text-right">الكمية (كجم)</TableHead>
                          <TableHead className="text-right">الشحنات</TableHead>
                          <TableHead className="text-right">المتوسط</TableHead>
                          <TableHead className="text-right">الحد الأدنى</TableHead>
                          <TableHead className="text-right">الحد الأقصى</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStats.yearlyData.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-right font-medium">{row.period}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{row.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{row.shipments}</TableCell>
                            <TableCell className="text-right">{row.avgPerShipment.toFixed(0)} كجم</TableCell>
                            <TableCell className="text-right text-green-600">{row.minQuantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-red-600">{row.maxQuantity.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Full Comparison Table */}
      <Card>
        <CardHeader className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <BarChart3 className="w-5 h-5 text-primary" />
            ملخص شامل لجميع الأنواع
          </CardTitle>
          <CardDescription>
            مقارنة تفصيلية شاملة لجميع أنواع المخلفات مع الإحصائيات الكاملة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نوع المخلف</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">إجمالي الكمية</TableHead>
                  <TableHead className="text-right">النسبة</TableHead>
                  <TableHead className="text-right">الشحنات</TableHead>
                  <TableHead className="text-right">متوسط الشحنة</TableHead>
                  <TableHead className="text-right">أقصى شحنة</TableHead>
                  <TableHead className="text-right">النمو الأسبوعي</TableHead>
                  <TableHead className="text-right">النمو الشهري</TableHead>
                  <TableHead className="text-right">النمو السنوي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteTypeStats.map((stat, idx) => (
                  <TableRow key={stat.waste_type} className="hover:bg-muted/50">
                    <TableCell className="text-right font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        {stat.name}
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stat.isHazardous ? 'destructive' : 'secondary'}>
                        {stat.isHazardous ? 'خطرة' : 'غير خطرة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {stat.totalQuantity.toLocaleString()} كجم
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Progress value={stat.percentageOfTotal} className="w-16 h-2" />
                        <span className="text-sm">{stat.percentageOfTotal.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{stat.totalShipments}</TableCell>
                    <TableCell className="text-right">{stat.avgQuantityPerShipment.toFixed(0)} كجم</TableCell>
                    <TableCell className="text-right text-amber-600">{stat.maxSingleShipment.toLocaleString()} كجم</TableCell>
                    <TableCell className="text-right">
                      <GrowthIndicator value={stat.weeklyGrowth} />
                    </TableCell>
                    <TableCell className="text-right">
                      <GrowthIndicator value={stat.monthlyGrowth} />
                    </TableCell>
                    <TableCell className="text-right">
                      <GrowthIndicator value={stat.yearlyGrowth} />
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-muted/30 font-bold border-t-2">
                  <TableCell className="text-right">الإجمالي</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right text-primary">{overallStats.totalQuantity.toLocaleString()} كجم</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                  <TableCell className="text-right">{overallStats.totalShipments}</TableCell>
                  <TableCell className="text-right">{overallStats.avgShipmentWeight.toFixed(0)} كجم</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Radar Comparison Chart */}
      {wasteTypeStats.length >= 3 && (
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Target className="w-5 h-5 text-primary" />
              مقارنة رادارية متعددة الأبعاد
            </CardTitle>
            <CardDescription>
              مقارنة بصرية للأنواع الستة الأكثر كمية عبر عدة معايير
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {wasteTypeStats.slice(0, 6).map((stat, idx) => (
                  <Radar
                    key={stat.waste_type}
                    name={stat.name}
                    dataKey={stat.name}
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WasteTypeDetailedAnalytics;
