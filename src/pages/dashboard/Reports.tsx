import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  ChartBar,
  Download,
  Loader2,
  Package,
  Building2,
  Truck,
  Recycle,
  TrendingUp,
  Calendar as CalendarIcon,
  FileText,
  Printer,
  RefreshCw,
  Filter,
  Stamp,
  PenLine,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import OfficialReportPrint from '@/components/reports/OfficialReportPrint';
import ReportRequestWrapper from '@/components/reports/ReportRequestWrapper';

interface ReportData {
  shipmentsByStatus: { name: string; value: number; color: string }[];
  shipmentsByWasteType: { name: string; value: number }[];
  shipmentsTrend: { date: string; count: number }[];
  organizationsByType: { name: string; value: number; color: string }[];
  topGenerators: { name: string; shipments: number }[];
  topTransporters: { name: string; shipments: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  collecting: 'جاري التجميع',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مكتمل',
};

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'بناء',
  other: 'أخرى',
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [includeStamps, setIncludeStamps] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [data, setData] = useState<ReportData>({
    shipmentsByStatus: [],
    shipmentsByWasteType: [],
    shipmentsTrend: [],
    organizationsByType: [],
    topGenerators: [],
    topTransporters: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Build shipments query with filters
      let shipmentsQuery = supabase
        .from('shipments')
        .select('status, waste_type, created_at, generator_id, transporter_id, quantity');

      // Apply date filters
      if (fromDate) {
        shipmentsQuery = shipmentsQuery.gte('created_at', fromDate.toISOString());
      }
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        shipmentsQuery = shipmentsQuery.lte('created_at', endOfDay.toISOString());
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        shipmentsQuery = shipmentsQuery.eq('status', statusFilter as 'new' | 'approved' | 'collecting' | 'in_transit' | 'delivered' | 'confirmed');
      }

      // Apply waste type filter
      if (wasteTypeFilter !== 'all') {
        shipmentsQuery = shipmentsQuery.eq('waste_type', wasteTypeFilter as 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'chemical' | 'medical' | 'construction' | 'other');
      }

      const { data: shipments } = await shipmentsQuery;

      // Fetch organizations
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name, organization_type');

      if (!shipments || !organizations) throw new Error('No data');

      // Process shipments by status
      const statusCounts: Record<string, number> = {};
      shipments.forEach(s => {
        statusCounts[s.status || 'new'] = (statusCounts[s.status || 'new'] || 0) + 1;
      });
      const shipmentsByStatus = Object.entries(statusCounts).map(([key, value], index) => ({
        name: statusLabels[key] || key,
        value,
        color: COLORS[index % COLORS.length],
      }));

      // Process shipments by waste type
      const wasteTypeCounts: Record<string, number> = {};
      shipments.forEach(s => {
        wasteTypeCounts[s.waste_type] = (wasteTypeCounts[s.waste_type] || 0) + 1;
      });
      const shipmentsByWasteType = Object.entries(wasteTypeCounts).map(([key, value]) => ({
        name: wasteTypeLabels[key] || key,
        value,
      }));

      // Process organizations by type
      const orgTypeCounts: Record<string, number> = {};
      organizations.forEach(o => {
        orgTypeCounts[o.organization_type] = (orgTypeCounts[o.organization_type] || 0) + 1;
      });
      const orgTypeLabels: Record<string, string> = {
        generator: 'جهات مولدة',
        transporter: 'ناقلون',
        recycler: 'معيدو تدوير',
      };
      const organizationsByType = Object.entries(orgTypeCounts).map(([key, value], index) => ({
        name: orgTypeLabels[key] || key,
        value,
        color: COLORS[index % COLORS.length],
      }));

      // Process shipments trend (last 7 days)
      const now = new Date();
      const shipmentsTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = shipments.filter(s => 
          s.created_at?.startsWith(dateStr)
        ).length;
        shipmentsTrend.push({
          date: date.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' }),
          count,
        });
      }

      // Top generators
      const generatorCounts: Record<string, number> = {};
      shipments.forEach(s => {
        if (s.generator_id) {
          generatorCounts[s.generator_id] = (generatorCounts[s.generator_id] || 0) + 1;
        }
      });
      const topGenerators = Object.entries(generatorCounts)
        .map(([id, count]) => ({
          name: organizations.find(o => o.id === id)?.name || 'غير معروف',
          shipments: count,
        }))
        .sort((a, b) => b.shipments - a.shipments)
        .slice(0, 5);

      // Top transporters
      const transporterCounts: Record<string, number> = {};
      shipments.forEach(s => {
        if (s.transporter_id) {
          transporterCounts[s.transporter_id] = (transporterCounts[s.transporter_id] || 0) + 1;
        }
      });
      const topTransporters = Object.entries(transporterCounts)
        .map(([id, count]) => ({
          name: organizations.find(o => o.id === id)?.name || 'غير معروف',
          shipments: count,
        }))
        .sort((a, b) => b.shipments - a.shipments)
        .slice(0, 5);

      setData({
        shipmentsByStatus,
        shipmentsByWasteType,
        shipmentsTrend,
        organizationsByType,
        topGenerators,
        topTransporters,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات التقارير',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: 'جاري التحضير',
      description: 'سيتم تحميل التقرير قريباً',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <BackButton />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReportRequestWrapper
              reportType="statistics_report"
              reportTitle="التقرير الإحصائي الرسمي"
              resourceData={{ period, statusFilter, wasteTypeFilter, fromDate: fromDate?.toISOString(), toDate: toDate?.toISOString() }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <FileText className="w-4 h-4" />
                    التقرير الرسمي (طراز 1919)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-right">التقرير الإحصائي الرسمي</DialogTitle>
                  </DialogHeader>
                  <OfficialReportPrint 
                    data={data} 
                    period={period} 
                    includeStamps={includeStamps}
                    includeSignatures={includeSignatures}
                  />
                </DialogContent>
              </Dialog>
            </ReportRequestWrapper>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
            <p className="text-muted-foreground">تحليل شامل لأداء النظام</p>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader className="text-right pb-4">
            <CardTitle className="flex items-center gap-2 justify-end text-lg">
              <Filter className="w-5 h-5" />
              معايير التصفية
            </CardTitle>
            <CardDescription>حدد معايير التصفية لإنشاء التقرير المجمع للشحنات أو الشركات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range and Status/Type Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* From Date */}
              <div className="space-y-2 text-right">
                <Label>من تاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* To Date */}
              <div className="space-y-2 text-right">
                <Label>إلى تاريخ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-right font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div className="space-y-2 text-right">
                <Label>حالة الشحنة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="new">جديدة</SelectItem>
                    <SelectItem value="approved">معتمدة</SelectItem>
                    <SelectItem value="collecting">جاري التجميع</SelectItem>
                    <SelectItem value="in_transit">في الطريق</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="confirmed">مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Waste Type Filter */}
              <div className="space-y-2 text-right">
                <Label>نوع المخلفات</Label>
                <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="plastic">بلاستيك</SelectItem>
                    <SelectItem value="paper">ورق</SelectItem>
                    <SelectItem value="metal">معادن</SelectItem>
                    <SelectItem value="glass">زجاج</SelectItem>
                    <SelectItem value="electronic">إلكترونيات</SelectItem>
                    <SelectItem value="organic">عضوية</SelectItem>
                    <SelectItem value="chemical">كيميائية</SelectItem>
                    <SelectItem value="medical">طبية</SelectItem>
                    <SelectItem value="construction">بناء</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Print Options and Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t">
              {/* Print Options */}
              <div className="flex flex-wrap items-center gap-6">
                <span className="text-sm font-medium text-muted-foreground">خيارات الطباعة:</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeStamps"
                    checked={includeStamps}
                    onCheckedChange={(checked) => setIncludeStamps(checked as boolean)}
                  />
                  <Label htmlFor="includeStamps" className="flex items-center gap-1 cursor-pointer">
                    <Stamp className="w-4 h-4" />
                    تضمين الأختام
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeSignatures"
                    checked={includeSignatures}
                    onCheckedChange={(checked) => setIncludeSignatures(checked as boolean)}
                  />
                  <Label htmlFor="includeSignatures" className="flex items-center gap-1 cursor-pointer">
                    <PenLine className="w-4 h-4" />
                    تضمين التوقيعات
                  </Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button onClick={fetchReportData} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  تحديث البيانات
                </Button>
                <ReportRequestWrapper
                  reportType="statistics_report"
                  reportTitle="التقرير الإحصائي الرسمي - طباعة"
                  resourceData={{ period, statusFilter, wasteTypeFilter, fromDate: fromDate?.toISOString(), toDate: toDate?.toISOString() }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Printer className="w-4 h-4" />
                        طباعة التقرير
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-right">التقرير الإحصائي الرسمي</DialogTitle>
                      </DialogHeader>
                      <OfficialReportPrint 
                        data={data} 
                        period={period}
                        includeStamps={includeStamps}
                        includeSignatures={includeSignatures}
                      />
                    </DialogContent>
                  </Dialog>
                </ReportRequestWrapper>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                  <p className="text-3xl font-bold">
                    {data.shipmentsByStatus.reduce((a, b) => a + b.value, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جهات مولدة</p>
                  <p className="text-3xl font-bold">
                    {data.organizationsByType.find(o => o.name === 'جهات مولدة')?.value || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شركات نقل</p>
                  <p className="text-3xl font-bold">
                    {data.organizationsByType.find(o => o.name === 'ناقلون')?.value || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Recycle className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">جهات تدوير</p>
                  <p className="text-3xl font-bold">
                    {data.organizationsByType.find(o => o.name === 'معيدو تدوير')?.value || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipments Trend */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <TrendingUp className="w-5 h-5" />
                اتجاه الشحنات
              </CardTitle>
              <CardDescription>عدد الشحنات خلال الأسبوع الماضي</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.shipmentsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Shipments by Status */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <ChartBar className="w-5 h-5" />
                الشحنات حسب الحالة
              </CardTitle>
              <CardDescription>توزيع الشحنات على الحالات المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.shipmentsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.shipmentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waste Types */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle>الشحنات حسب نوع النفايات</CardTitle>
              <CardDescription>توزيع أنواع النفايات المنقولة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.shipmentsByWasteType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Organization Types */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle>توزيع المنظمات</CardTitle>
              <CardDescription>عدد المنظمات حسب النوع</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.organizationsByType}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.organizationsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="text-right">
              <CardTitle>أعلى الجهات المولدة نشاطاً</CardTitle>
              <CardDescription>حسب عدد الشحنات</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topGenerators.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-4">
                  {data.topGenerators.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Badge variant="secondary">{item.shipments} شحنة</Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{item.name}</span>
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-right">
              <CardTitle>أعلى شركات النقل نشاطاً</CardTitle>
              <CardDescription>حسب عدد الشحنات</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topTransporters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-4">
                  {data.topTransporters.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <Badge variant="secondary">{item.shipments} شحنة</Badge>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{item.name}</span>
                        <span className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-sm font-bold text-amber-600">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
