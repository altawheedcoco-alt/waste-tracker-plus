import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, Loader2, TrendingUp, Calendar, CalendarDays, CalendarRange,
  ArrowUpRight, ArrowDownRight, Minus, Package, Scale, AlertTriangle, Leaf
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { format, subWeeks, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval } from 'date-fns';
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
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

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

  const wasteTypeStats = useMemo((): WasteTypeStats[] => {
    const now = new Date();
    const wasteTypes = [...new Set(shipments.map(s => s.waste_type))];

    return wasteTypes.map(wasteType => {
      const typeShipments = shipments.filter(s => s.waste_type === wasteType);

      // Weekly data - last 12 weeks
      const weeklyData: PeriodStats[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 6 });
        
        const weekShipments = typeShipments.filter(s => {
          const date = new Date(s.created_at);
          return isWithinInterval(date, { start: weekStart, end: weekEnd });
        });

        const quantity = weekShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        weeklyData.push({
          period: format(weekStart, 'd MMM', { locale: ar }),
          quantity,
          shipments: weekShipments.length,
          avgPerShipment: weekShipments.length > 0 ? quantity / weekShipments.length : 0,
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

        const quantity = monthShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        monthlyData.push({
          period: format(monthStart, 'MMM yyyy', { locale: ar }),
          quantity,
          shipments: monthShipments.length,
          avgPerShipment: monthShipments.length > 0 ? quantity / monthShipments.length : 0,
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

        const quantity = yearShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
        yearlyData.push({
          period: format(yearStart, 'yyyy', { locale: ar }),
          quantity,
          shipments: yearShipments.length,
          avgPerShipment: yearShipments.length > 0 ? quantity / yearShipments.length : 0,
        });
      }

      return {
        waste_type: wasteType,
        name: getWasteTypeName(wasteType),
        isHazardous: isHazardousWasteType(wasteType),
        weeklyData,
        monthlyData,
        yearlyData,
        totalQuantity: typeShipments.reduce((sum, s) => sum + (s.quantity || 0), 0),
        totalShipments: typeShipments.length,
        weeklyGrowth: calculateGrowth(weeklyData),
        monthlyGrowth: calculateGrowth(monthlyData),
        yearlyGrowth: calculateGrowth(yearlyData),
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

  return (
    <div className="space-y-6">
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
              <AreaChart data={allTypesChartData}>
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
              </AreaChart>
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
                  <div className="flex items-center gap-2 justify-end">
                    <Badge variant={stat.isHazardous ? 'destructive' : 'secondary'} className="text-xs">
                      {stat.isHazardous ? 'خطرة' : 'غير خطرة'}
                    </Badge>
                    <CardTitle className="text-base">{stat.name}</CardTitle>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
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

                  {/* Mini Chart */}
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={selectedPeriod === 'week' ? stat.weeklyData : selectedPeriod === 'month' ? stat.monthlyData : stat.yearlyData}
                      >
                        <Tooltip 
                          formatter={(value: number) => `${value.toLocaleString()} كجم`}
                          labelFormatter={(label) => label}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="quantity" 
                          stroke={COLORS[idx % COLORS.length]} 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
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
                    <BarChart data={selectedStats.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                      <Bar dataKey="quantity" name="الكمية" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الأسبوع</TableHead>
                        <TableHead className="text-right">الكمية (كجم)</TableHead>
                        <TableHead className="text-right">عدد الشحنات</TableHead>
                        <TableHead className="text-right">متوسط الشحنة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStats.weeklyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-right font-medium">{row.period}</TableCell>
                          <TableCell className="text-right">{row.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.shipments}</TableCell>
                          <TableCell className="text-right">{row.avgPerShipment.toFixed(0)} كجم</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="month">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedStats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                      <Bar dataKey="quantity" name="الكمية" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الشهر</TableHead>
                        <TableHead className="text-right">الكمية (كجم)</TableHead>
                        <TableHead className="text-right">عدد الشحنات</TableHead>
                        <TableHead className="text-right">متوسط الشحنة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStats.monthlyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-right font-medium">{row.period}</TableCell>
                          <TableCell className="text-right">{row.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.shipments}</TableCell>
                          <TableCell className="text-right">{row.avgPerShipment.toFixed(0)} كجم</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="year">
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedStats.yearlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} كجم`} />
                      <Bar dataKey="quantity" name="الكمية" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">السنة</TableHead>
                        <TableHead className="text-right">الكمية (كجم)</TableHead>
                        <TableHead className="text-right">عدد الشحنات</TableHead>
                        <TableHead className="text-right">متوسط الشحنة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStats.yearlyData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-right font-medium">{row.period}</TableCell>
                          <TableCell className="text-right">{row.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{row.shipments}</TableCell>
                          <TableCell className="text-right">{row.avgPerShipment.toFixed(0)} كجم</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
            مقارنة معدلات النمو والكميات لجميع أنواع المخلفات
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
                  <TableHead className="text-right">الشحنات</TableHead>
                  <TableHead className="text-right">النمو الأسبوعي</TableHead>
                  <TableHead className="text-right">النمو الشهري</TableHead>
                  <TableHead className="text-right">النمو السنوي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteTypeStats.map((stat, idx) => (
                  <TableRow key={stat.waste_type}>
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
                    <TableCell className="text-right">{stat.totalShipments}</TableCell>
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
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteTypeDetailedAnalytics;
