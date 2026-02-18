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
  AlertTriangle, CheckCircle2, Clock, Recycle, Scale, Zap,
  Activity, Target, Award, BarChart3, Focus, Star, Building2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  RadialBarChart, RadialBar, Cell, LineChart
} from 'recharts';
import { 
  format, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval,
  differenceInDays
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels, isHazardousWasteType, getWasteTypeCode } from '@/lib/wasteClassification';

interface PeriodData {
  period: string;
  received: number;
  processed: number;
  efficiency: number;
  avgProcessingTime: number;
  shipmentCount: number;
}

interface SpecializationStats {
  waste_type: string;
  name: string;
  code: string;
  weeklyData: PeriodData[];
  monthlyData: PeriodData[];
  yearlyData: PeriodData[];
  totalReceived: number;
  totalProcessed: number;
  efficiency: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  avgProcessingTime: number;
  shipmentCount: number;
  isHazardous: boolean;
  uniqueGenerators: number;
  isPrimary: boolean;
}

interface OverallStats {
  totalReceived: number;
  totalProcessed: number;
  avgEfficiency: number;
  peakMonth: string;
  peakQuantity: number;
  totalShipments: number;
  hazardousRatio: number;
  avgProcessingDays: number;
  specializationScore: number;
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const RecyclerDetailedAnalytics = () => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [specializationStats, setSpecializationStats] = useState<SpecializationStats[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [generatorBreakdown, setGeneratorBreakdown] = useState<any[]>([]);

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
        .select('id, waste_type, quantity, status, created_at, delivered_at, confirmed_at, generator_id')
        .eq('recycler_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (shipments && shipments.length > 0) {
        // Calculate overall stats
        const totalReceived = shipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const confirmedShipments = shipments.filter(s => s.status === 'confirmed');
        const totalProcessed = confirmedShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const hazardousQuantity = shipments
          .filter(s => isHazardousWasteType(s.waste_type))
          .reduce((sum, s) => sum + (s.quantity || 0), 0);

        // Calculate average processing time
        let totalProcessingDays = 0;
        let processedCount = 0;
        confirmedShipments.forEach(s => {
          if (s.delivered_at && s.confirmed_at) {
            const days = differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
            totalProcessingDays += Math.max(0, days);
            processedCount++;
          }
        });

        // Find peak month
        const monthlyQuantities: Record<string, number> = {};
        shipments.forEach(s => {
          const monthKey = format(new Date(s.created_at), 'yyyy-MM');
          monthlyQuantities[monthKey] = (monthlyQuantities[monthKey] || 0) + (s.quantity || 0);
        });
        const peakEntry = Object.entries(monthlyQuantities).sort((a, b) => b[1] - a[1])[0];

        // Group by waste type
        const wasteTypeMap: Record<string, any[]> = {};
        shipments.forEach(s => {
          if (!wasteTypeMap[s.waste_type]) {
            wasteTypeMap[s.waste_type] = [];
          }
          wasteTypeMap[s.waste_type].push(s);
        });

        // Calculate specialization score (concentration on top 2 types)
        const typeTotals = Object.entries(wasteTypeMap).map(([type, items]) => ({
          type,
          total: items.reduce((sum, s) => sum + (s.quantity || 0), 0)
        })).sort((a, b) => b.total - a.total);

        const top2Total = typeTotals.slice(0, 2).reduce((sum, t) => sum + t.total, 0);
        const specializationScore = totalReceived > 0 ? (top2Total / totalReceived) * 100 : 0;

        setOverallStats({
          totalReceived,
          totalProcessed,
          avgEfficiency: totalReceived > 0 ? (totalProcessed / totalReceived) * 100 : 0,
          peakMonth: peakEntry ? format(new Date(peakEntry[0] + '-01'), 'MMMM yyyy', { locale: ar }) : '-',
          peakQuantity: peakEntry ? peakEntry[1] : 0,
          totalShipments: shipments.length,
          hazardousRatio: totalReceived > 0 ? (hazardousQuantity / totalReceived) * 100 : 0,
          avgProcessingDays: processedCount > 0 ? totalProcessingDays / processedCount : 0,
          specializationScore,
        });

        const now = new Date();
        const statsArray: SpecializationStats[] = [];

        // Only process top 2 waste types (specialization focus)
        const topTypes = typeTotals.slice(0, 2);

        topTypes.forEach(({ type: wasteType }, idx) => {
          const typeShipments = wasteTypeMap[wasteType];
          
          // Weekly data (12 weeks)
          const weeklyData: PeriodData[] = [];
          for (let i = 11; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
            const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
            const weekShipments = typeShipments.filter(s => 
              isWithinInterval(new Date(s.created_at), { start: weekStart, end: weekEnd })
            );
            const received = weekShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
            const confirmedWeek = weekShipments.filter(s => s.status === 'confirmed');
            const processed = confirmedWeek.reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            let avgTime = 0;
            confirmedWeek.forEach(s => {
              if (s.delivered_at && s.confirmed_at) {
                avgTime += differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
              }
            });
            
            weeklyData.push({
              period: format(weekStart, 'dd/MM', { locale: ar }),
              received,
              processed,
              efficiency: received > 0 ? (processed / received) * 100 : 0,
              avgProcessingTime: confirmedWeek.length > 0 ? avgTime / confirmedWeek.length : 0,
              shipmentCount: weekShipments.length,
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
            const confirmedMonth = monthShipments.filter(s => s.status === 'confirmed');
            const processed = confirmedMonth.reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            let avgTime = 0;
            confirmedMonth.forEach(s => {
              if (s.delivered_at && s.confirmed_at) {
                avgTime += differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
              }
            });
            
            monthlyData.push({
              period: format(monthStart, 'MMM yy', { locale: ar }),
              received,
              processed,
              efficiency: received > 0 ? (processed / received) * 100 : 0,
              avgProcessingTime: confirmedMonth.length > 0 ? avgTime / confirmedMonth.length : 0,
              shipmentCount: monthShipments.length,
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
            const confirmedYear = yearShipments.filter(s => s.status === 'confirmed');
            const processed = confirmedYear.reduce((sum, s) => sum + (s.quantity || 0), 0);
            
            let avgTime = 0;
            confirmedYear.forEach(s => {
              if (s.delivered_at && s.confirmed_at) {
                avgTime += differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
              }
            });
            
            yearlyData.push({
              period: format(yearStart, 'yyyy'),
              received,
              processed,
              efficiency: received > 0 ? (processed / received) * 100 : 0,
              avgProcessingTime: confirmedYear.length > 0 ? avgTime / confirmedYear.length : 0,
              shipmentCount: yearShipments.length,
            });
          }

          const typeConfirmed = typeShipments.filter(s => s.status === 'confirmed');
          const typeReceived = typeShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
          const typeProcessed = typeConfirmed.reduce((sum, s) => sum + (s.quantity || 0), 0);

          // Calculate processing time
          let totalDays = 0;
          let count = 0;
          typeConfirmed.forEach(s => {
            if (s.delivered_at && s.confirmed_at) {
              totalDays += differenceInDays(new Date(s.confirmed_at), new Date(s.delivered_at));
              count++;
            }
          });

          // Unique generators
          const uniqueGenerators = new Set(typeShipments.map(s => s.generator_id).filter(Boolean)).size;

          // Calculate growth rates
          const weeklyGrowth = weeklyData.length >= 2 && weeklyData[weeklyData.length - 2].received > 0
            ? ((weeklyData[weeklyData.length - 1].received - weeklyData[weeklyData.length - 2].received) / 
               weeklyData[weeklyData.length - 2].received) * 100
            : 0;

          const monthlyGrowth = monthlyData.length >= 2 && monthlyData[monthlyData.length - 2].received > 0
            ? ((monthlyData[monthlyData.length - 1].received - monthlyData[monthlyData.length - 2].received) / 
               monthlyData[monthlyData.length - 2].received) * 100
            : 0;

          const yearlyGrowth = yearlyData.length >= 2 && yearlyData[yearlyData.length - 2].received > 0
            ? ((yearlyData[yearlyData.length - 1].received - yearlyData[yearlyData.length - 2].received) / 
               yearlyData[yearlyData.length - 2].received) * 100
            : 0;

          statsArray.push({
            waste_type: wasteType,
            name: wasteTypeLabels[wasteType] || wasteType,
            code: getWasteTypeCode(wasteType),
            weeklyData,
            monthlyData,
            yearlyData,
            totalReceived: typeReceived,
            totalProcessed: typeProcessed,
            efficiency: typeReceived > 0 ? (typeProcessed / typeReceived) * 100 : 0,
            weeklyGrowth,
            monthlyGrowth,
            yearlyGrowth,
            avgProcessingTime: count > 0 ? totalDays / count : 0,
            shipmentCount: typeShipments.length,
            isHazardous: isHazardousWasteType(wasteType),
            uniqueGenerators,
            isPrimary: idx === 0,
          });
        });

        setSpecializationStats(statsArray);
        if (statsArray.length > 0) {
          setSelectedSpecialization(statsArray[0].waste_type);
        }

        // Generator breakdown for primary specialization
        if (topTypes.length > 0) {
          const primaryType = topTypes[0].type;
          const primaryShipments = wasteTypeMap[primaryType];
          const generatorMap: Record<string, { id: string; quantity: number; count: number }> = {};
          
          primaryShipments.forEach(s => {
            if (s.generator_id) {
              if (!generatorMap[s.generator_id]) {
                generatorMap[s.generator_id] = { id: s.generator_id, quantity: 0, count: 0 };
              }
              generatorMap[s.generator_id].quantity += s.quantity || 0;
              generatorMap[s.generator_id].count += 1;
            }
          });

          setGeneratorBreakdown(Object.values(generatorMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedStats = specializationStats.find(s => s.waste_type === selectedSpecialization);
  const chartData = selectedStats 
    ? (selectedPeriod === 'weekly' ? selectedStats.weeklyData 
      : selectedPeriod === 'monthly' ? selectedStats.monthlyData 
      : selectedStats.yearlyData)
    : [];

  // Radar chart comparing both specializations
  const radarData = specializationStats.length >= 2 ? [
    { 
      metric: 'الكفاءة', 
      [specializationStats[0].name]: specializationStats[0].efficiency,
      [specializationStats[1].name]: specializationStats[1].efficiency,
    },
    { 
      metric: 'الكمية %', 
      [specializationStats[0].name]: overallStats ? (specializationStats[0].totalReceived / overallStats.totalReceived) * 100 : 0,
      [specializationStats[1].name]: overallStats ? (specializationStats[1].totalReceived / overallStats.totalReceived) * 100 : 0,
    },
    { 
      metric: 'الجهات المرتبطة', 
      [specializationStats[0].name]: Math.min(100, specializationStats[0].uniqueGenerators * 10),
      [specializationStats[1].name]: Math.min(100, specializationStats[1].uniqueGenerators * 10),
    },
    { 
      metric: 'النمو', 
      [specializationStats[0].name]: Math.max(0, Math.min(100, 50 + specializationStats[0].monthlyGrowth)),
      [specializationStats[1].name]: Math.max(0, Math.min(100, 50 + specializationStats[1].monthlyGrowth)),
    },
  ] : [];

  // Efficiency comparison radial
  const efficiencyRadial = specializationStats.map((s, i) => ({
    name: s.name,
    value: s.efficiency,
    fill: CHART_COLORS[i % CHART_COLORS.length],
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
      {/* Specialization Overview Stats */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-3 text-center">
                <Focus className="w-6 h-6 mx-auto text-green-500 mb-1" />
                <p className="text-xs text-muted-foreground">مستوى التخصص</p>
                <p className="text-lg font-bold">{overallStats.specializationScore.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-3 text-center">
                <Package className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-muted-foreground">إجمالي المستلم</p>
                <p className="text-lg font-bold">{(overallStats.totalReceived / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">طن</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="p-3 text-center">
                <Recycle className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs text-muted-foreground">تم معالجته</p>
                <p className="text-lg font-bold">{(overallStats.totalProcessed / 1000).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">طن</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-3 text-center">
                <Target className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-muted-foreground">كفاءة المعالجة</p>
                <p className="text-lg font-bold">{overallStats.avgEfficiency.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-3 text-center">
                <Clock className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">متوسط المعالجة</p>
                <p className="text-lg font-bold">{overallStats.avgProcessingDays.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">يوم</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="p-3 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto text-red-500 mb-1" />
                <p className="text-xs text-muted-foreground">نسبة الخطرة</p>
                <p className="text-lg font-bold">{overallStats.hazardousRatio.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
              <CardContent className="p-3 text-center">
                <Award className="w-6 h-6 mx-auto text-cyan-500 mb-1" />
                <p className="text-xs text-muted-foreground">شهر الذروة</p>
                <p className="text-sm font-bold truncate">{overallStats.peakMonth}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}>
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
              <CardContent className="p-3 text-center">
                <BarChart3 className="w-6 h-6 mx-auto text-pink-500 mb-1" />
                <p className="text-xs text-muted-foreground">عدد الشحنات</p>
                <p className="text-lg font-bold">{overallStats.totalShipments}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Specialization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specializationStats.map((spec, index) => (
          <motion.div
            key={spec.waste_type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all ${
                selectedSpecialization === spec.waste_type 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              } ${spec.isPrimary ? 'bg-gradient-to-br from-green-500/5 to-emerald-500/5' : 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5'}`}
              onClick={() => setSelectedSpecialization(spec.waste_type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {spec.isPrimary && <Star className="w-5 h-5 text-amber-500" />}
                    <Badge variant={spec.isHazardous ? 'destructive' : 'secondary'}>
                      {spec.isHazardous ? 'خطرة' : 'غير خطرة'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <h3 className="text-lg font-bold">{spec.name}</h3>
                      <Badge variant="outline">{spec.code}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {spec.isPrimary ? 'التخصص الرئيسي' : 'التخصص الثانوي'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">المستلم</p>
                    <p className="text-lg font-bold">{(spec.totalReceived / 1000).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">طن</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الكفاءة</p>
                    <p className="text-lg font-bold">{spec.efficiency.toFixed(0)}%</p>
                    <Progress value={spec.efficiency} className="h-1 mt-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المعالجة</p>
                    <p className="text-lg font-bold">{spec.avgProcessingTime.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">يوم</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">النمو</p>
                    <div className="flex items-center justify-center gap-1">
                      {spec.monthlyGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-lg font-bold ${spec.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(spec.monthlyGrowth).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Comparison Charts */}
      {specializationStats.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <Activity className="w-5 h-5 text-primary" />
                مقارنة التخصصات
              </CardTitle>
              <CardDescription className="text-right">
                مقارنة متعددة الأبعاد بين التخصص الرئيسي والثانوي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar 
                    name={specializationStats[0].name} 
                    dataKey={specializationStats[0].name} 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.5} 
                  />
                  <Radar 
                    name={specializationStats[1].name} 
                    dataKey={specializationStats[1].name} 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.5} 
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Efficiency Radial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-end">
                <Target className="w-5 h-5 text-primary" />
                كفاءة المعالجة
              </CardTitle>
              <CardDescription className="text-right">
                مقارنة كفاءة المعالجة لكل تخصص
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="30%" 
                  outerRadius="90%" 
                  data={efficiencyRadial}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                  />
                  <Legend 
                    iconSize={10}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'الكفاءة']} />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Trend Analysis */}
      {selectedStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                <TabsList>
                  <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
                  <TabsTrigger value="monthly">شهري</TabsTrigger>
                  <TabsTrigger value="yearly">سنوي</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  التحليل الزمني للتخصص
                </CardTitle>
                <CardDescription className="flex items-center gap-2 justify-end">
                  <Badge variant="outline">{selectedStats.code}</Badge>
                  <span>{selectedStats.name}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000).toFixed(1)}t`} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'الكفاءة') return [`${value.toFixed(1)}%`, name];
                    return [`${(value / 1000).toFixed(2)} طن`, name];
                  }} 
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="received" 
                  name="المستلم" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorReceived)"
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="processed" 
                  name="المعالج" 
                  stroke="#3b82f6" 
                  fillOpacity={1}
                  fill="url(#colorProcessed)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="efficiency" 
                  name="الكفاءة" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Specialization Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-end">
            <Scale className="w-5 h-5 text-primary" />
            تفاصيل التخصصات
          </CardTitle>
          <CardDescription className="text-right">
            جدول مقارنة تفصيلي للتخصص الرئيسي والثانوي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">النمو الشهري</TableHead>
                <TableHead className="text-center">وقت المعالجة</TableHead>
                <TableHead className="text-center">الكفاءة</TableHead>
                <TableHead className="text-center">الجهات المرتبطة</TableHead>
                <TableHead className="text-center">الشحنات</TableHead>
                <TableHead className="text-center">المستلم (طن)</TableHead>
                <TableHead className="text-center">الكود</TableHead>
                <TableHead className="text-right">التخصص</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specializationStats.map((spec, index) => (
                <TableRow key={spec.waste_type} className={spec.isPrimary ? 'bg-green-500/5' : ''}>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {spec.monthlyGrowth >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={spec.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(spec.monthlyGrowth).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{spec.avgProcessingTime.toFixed(1)} يوم</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2">
                      <Progress value={spec.efficiency} className="h-2 w-16" />
                      <span>{spec.efficiency.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{spec.uniqueGenerators}</TableCell>
                  <TableCell className="text-center">{spec.shipmentCount}</TableCell>
                  <TableCell className="text-center font-bold">{(spec.totalReceived / 1000).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{spec.code}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {spec.isPrimary && <Star className="w-4 h-4 text-amber-500" />}
                      <span className="font-medium">{spec.name}</span>
                      <Badge variant={spec.isHazardous ? 'destructive' : 'secondary'} className="text-xs">
                        {spec.isHazardous ? 'خطرة' : 'غير خطرة'}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecyclerDetailedAnalytics;
