import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useApprovalRequests } from '@/hooks/useApprovalRequests';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import BackButton from '@/components/ui/back-button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import {
  Search,
  CalendarIcon,
  FileText,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Filter,
  X,
  Loader2,
  ClipboardCheck,
  Package,
  Truck,
  Building2,
  Recycle,
  User,
  FileSpreadsheet,
  ShieldCheck,
  Bell,
  BarChart3,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { usePDFExport } from '@/hooks/usePDFExport';

// Import from unified waste classification
import { wasteTypeLabels } from '@/lib/wasteClassification';

// Non-hazardous waste types
const NON_HAZARDOUS_WASTE_TYPES = ['plastic', 'paper', 'metal', 'glass', 'organic', 'construction', 'other'] as const;
type NonHazardousWasteType = typeof NON_HAZARDOUS_WASTE_TYPES[number];

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'موافق عليها',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  confirmed: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
};

const packagingLabels: Record<string, string> = {
  bags: 'أكياس',
  boxes: 'صناديق',
  drums: 'براميل',
  containers: 'حاويات',
  bulk: 'سائب',
  pallets: 'منصات',
};

type RegisterRequest = {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'sent';
  requested_at: string;
  prepared_at?: string;
  sent_at?: string;
  requested_by: string;
  date_from?: string;
  date_to?: string;
};

const NonHazardousWasteRegister = () => {
  const { organization, roles, profile } = useAuth();
  const { createRequest } = useApprovalRequests();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const printRef = useRef<HTMLDivElement>(null);
  
  // PDF Export
  const { exportToPDF, printContent, isExporting: isExportingPDF } = usePDFExport({
    filename: 'سجل-المخلفات-غير-الخطرة',
    orientation: 'landscape',
  });

  const handleExportPDF = async () => {
    await exportToPDF(printRef.current, 'سجل-المخلفات-غير-الخطرة');
  };
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('all');
  
  // Request state (simulated - in real app would be stored in DB)
  const [registerRequest, setRegisterRequest] = useState<RegisterRequest | null>(null);

  // Fetch non-hazardous shipments
  const { data: shipments, isLoading } = useQuery({
    queryKey: ['non-hazardous-shipments', organization?.id, dateFrom, dateTo, selectedStatus, selectedWasteType],
    queryFn: async () => {
      let query = supabase
        .from('shipments')
        .select(`
          *,
          generator:organizations!shipments_generator_id_fkey(id, name, client_code),
          transporter:organizations!shipments_transporter_id_fkey(id, name, client_code),
          recycler:organizations!shipments_recycler_id_fkey(id, name, client_code),
          driver:drivers(id, profile_id, vehicle_plate, vehicle_type, profiles:profiles!drivers_profile_id_fkey(full_name, phone))
        `)
        .in('waste_type', NON_HAZARDOUS_WASTE_TYPES)
        .order('created_at', { ascending: false });

      // Apply organization filter for non-admins
      if (!isAdmin && organization?.id) {
        query = query.or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);
      }

      // Apply date filters
      if (dateFrom) {
        query = query.gte('created_at', format(dateFrom, 'yyyy-MM-dd'));
      }
      if (dateTo) {
        query = query.lte('created_at', format(dateTo, 'yyyy-MM-dd') + 'T23:59:59');
      }

      // Apply status filter
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus as any);
      }

      // Apply waste type filter
      if (selectedWasteType !== 'all') {
        query = query.eq('waste_type', selectedWasteType as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id || isAdmin,
  });

  // Filter by search query
  const filteredShipments = useMemo(() => {
    if (!shipments) return [];
    if (!searchQuery.trim()) return shipments;
    
    const search = searchQuery.toLowerCase();
    return shipments.filter((shipment: any) =>
      shipment.shipment_number?.toLowerCase().includes(search) ||
      shipment.generator?.name?.toLowerCase().includes(search) ||
      shipment.transporter?.name?.toLowerCase().includes(search) ||
      shipment.recycler?.name?.toLowerCase().includes(search) ||
      shipment.driver?.profiles?.full_name?.toLowerCase().includes(search) ||
      shipment.pickup_address?.toLowerCase().includes(search) ||
      shipment.delivery_address?.toLowerCase().includes(search)
    );
  }, [shipments, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!filteredShipments) return { total: 0, totalWeight: 0, confirmed: 0, inTransit: 0 };
    return {
      total: filteredShipments.length,
      totalWeight: filteredShipments.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0),
      confirmed: filteredShipments.filter((s: any) => s.status === 'confirmed').length,
      inTransit: filteredShipments.filter((s: any) => s.status === 'in_transit').length,
    };
  }, [filteredShipments]);

  // Compliance score
  const complianceData = useMemo(() => {
    if (!filteredShipments || filteredShipments.length === 0) return { score: 100, issues: [] as string[] };
    const issues: string[] = [];
    let compliant = 0;
    filteredShipments.forEach((s: any) => {
      let isCompliant = true;
      if (!s.packaging_method) isCompliant = false;
      if (!s.driver_id && !s.manual_driver_name) isCompliant = false;
      if (!s.recycler_id) isCompliant = false;
      if (isCompliant) compliant++;
    });
    const score = Math.round((compliant / filteredShipments.length) * 100);
    if (score < 100) {
      const noPack = filteredShipments.filter((s: any) => !s.packaging_method).length;
      const noDriver = filteredShipments.filter((s: any) => !s.driver_id && !s.manual_driver_name).length;
      const noRecycler = filteredShipments.filter((s: any) => !s.recycler_id).length;
      if (noPack > 0) issues.push(`${noPack} شحنة بدون تحديد طريقة التعبئة`);
      if (noDriver > 0) issues.push(`${noDriver} شحنة بدون سائق معيّن`);
      if (noRecycler > 0) issues.push(`${noRecycler} شحنة بدون جهة تدوير`);
    }
    return { score, issues };
  }, [filteredShipments]);

  // Overdue shipments
  const overdueShipments = useMemo(() => {
    if (!filteredShipments) return [];
    const now = new Date();
    return filteredShipments.filter((s: any) => {
      if (s.status === 'confirmed' || s.status === 'delivered') return false;
      const created = new Date(s.created_at);
      return differenceInHours(now, created) > 48;
    });
  }, [filteredShipments]);

  // Chart data
  const wasteTypeChartData = useMemo(() => {
    if (!filteredShipments) return [];
    const counts: Record<string, number> = {};
    filteredShipments.forEach((s: any) => {
      const type = wasteTypeLabels[s.waste_type] || s.waste_type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredShipments]);

  const monthlyChartData = useMemo(() => {
    if (!filteredShipments) return [];
    const months: Record<string, { name: string; count: number; weight: number }> = {};
    filteredShipments.forEach((s: any) => {
      const monthKey = format(new Date(s.created_at), 'yyyy-MM');
      const monthLabel = format(new Date(s.created_at), 'MMM yyyy', { locale: ar });
      if (!months[monthKey]) months[monthKey] = { name: monthLabel, count: 0, weight: 0 };
      months[monthKey].count++;
      months[monthKey].weight += Number(s.quantity) || 0;
    });
    return Object.values(months).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredShipments]);

  const statusChartData = useMemo(() => {
    if (!filteredShipments) return [];
    const counts: Record<string, number> = {};
    filteredShipments.forEach((s: any) => {
      const status = statusLabels[s.status || 'new'] || s.status || 'جديدة';
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredShipments]);

  const CHART_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#eab308', '#ef4444', '#06b6d4'];

  // Excel export
  const handleExportExcel = () => {
    if (!filteredShipments || filteredShipments.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const rows = filteredShipments.map((s: any, i: number) => ({
      '#': i + 1,
      'رقم الشحنة': s.shipment_number,
      'التاريخ': format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
      'نوع المخلف': wasteTypeLabels[s.waste_type] || s.waste_type,
      'الكمية': s.quantity,
      'الوحدة': s.unit || 'كجم',
      'التعبئة': packagingLabels[s.packaging_method] || s.packaging_method || '-',
      'الجهة المولدة': s.generator?.name || '-',
      'كود المولد': s.generator?.client_code || '-',
      'الجهة الناقلة': s.transporter?.name || '-',
      'الجهة المدورة': s.recycler?.name || '-',
      'السائق': s.driver?.profiles?.full_name || s.manual_driver_name || '-',
      'لوحة المركبة': s.driver?.vehicle_plate || s.manual_vehicle_plate || '-',
      'الحالة': statusLabels[s.status || 'new'],
      'عنوان الاستلام': s.pickup_address || '-',
      'عنوان التسليم': s.delivery_address || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سجل المخلفات غير الخطرة');
    XLSX.writeFile(wb, `سجل-المخلفات-غير-الخطرة-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('تم تصدير الملف بنجاح');
  };

  // Request register preparation - now saves to database
  const handleRequestRegister = async () => {
    const result = await createRequest({
      request_type: 'waste_register',
      request_title: 'طلب إعداد سجل المخلفات غير الخطرة',
      request_description: `طلب إعداد سجل رسمي للمخلفات غير الخطرة${dateFrom ? ` من تاريخ ${format(dateFrom, 'yyyy-MM-dd')}` : ''}${dateTo ? ` إلى ${format(dateTo, 'yyyy-MM-dd')}` : ''}`,
      priority: 'normal',
      target_resource_type: 'waste_register',
      request_data: {
        register_type: 'non_hazardous',
        date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
        date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : null,
        total_shipments: stats.total,
        total_weight: stats.totalWeight,
      },
    });
    
    if (result.success) {
      const newRequest: RegisterRequest = {
        id: crypto.randomUUID(),
        status: 'pending',
        requested_at: new Date().toISOString(),
        requested_by: profile?.full_name || 'مستخدم',
        date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
      };
      setRegisterRequest(newRequest);
    }
  };

  // Admin: Prepare register
  const handlePrepareRegister = () => {
    if (registerRequest) {
      setRegisterRequest({
        ...registerRequest,
        status: 'preparing',
      });
      
      // Simulate preparation time
      setTimeout(() => {
        setRegisterRequest(prev => prev ? {
          ...prev,
          status: 'ready',
          prepared_at: new Date().toISOString(),
        } : null);
        toast.success('تم إعداد السجل بنجاح وجاهز للإرسال');
      }, 2000);
    }
  };

  // Admin: Send register (requires owner approval simulation)
  const handleSendRegister = () => {
    if (registerRequest) {
      setRegisterRequest({
        ...registerRequest,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
      toast.success('تم إرسال السجل بموافقة المالك');
    }
  };

  // Print register
  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedStatus('all');
    setSelectedWasteType('all');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-foreground">سجل المخلفات الغير خطرة</h1>
              <p className="text-muted-foreground">سجل شامل لجميع شحنات المخلفات غير الخطرة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!registerRequest && (
              <Button onClick={handleRequestRegister} className="gap-2">
                <FileText className="w-4 h-4" />
                طلب إعداد السجل
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button onClick={handleExportPDF} disabled={isExportingPDF} className="gap-2">
              {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              تحميل PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              تصدير Excel
            </Button>
          </div>
        </div>

        {/* Request Status Card */}
        {registerRequest && (
          <Card className="border-primary/20 bg-primary/5 print:hidden">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  {registerRequest.status === 'pending' && (
                    <>
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-medium">في انتظار الإعداد</p>
                        <p className="text-sm text-muted-foreground">
                          طلب بواسطة: {registerRequest.requested_by} - {format(new Date(registerRequest.requested_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </>
                  )}
                  {registerRequest.status === 'preparing' && (
                    <>
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <div>
                        <p className="font-medium">جاري إعداد السجل...</p>
                        <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                      </div>
                    </>
                  )}
                  {registerRequest.status === 'ready' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">السجل جاهز للإرسال</p>
                        <p className="text-sm text-muted-foreground">
                          تم الإعداد: {registerRequest.prepared_at && format(new Date(registerRequest.prepared_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </>
                  )}
                  {registerRequest.status === 'sent' && (
                    <>
                      <Send className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">تم إرسال السجل</p>
                        <p className="text-sm text-muted-foreground">
                          تم الإرسال: {registerRequest.sent_at && format(new Date(registerRequest.sent_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    {registerRequest.status === 'pending' && (
                      <Button onClick={handlePrepareRegister} size="sm" className="gap-2">
                        <ClipboardCheck className="w-4 h-4" />
                        إعداد السجل
                      </Button>
                    )}
                    {registerRequest.status === 'ready' && (
                      <Button onClick={handleSendRegister} size="sm" className="gap-2">
                        <Send className="w-4 h-4" />
                        إرسال بموافقة المالك
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Recycle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalWeight.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الوزن (كجم)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                  <p className="text-sm text-muted-foreground">شحنات مؤكدة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inTransit}</p>
                  <p className="text-sm text-muted-foreground">في الطريق</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Indicator */}
        <Card className="print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              مؤشر الامتثال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">نسبة الامتثال</span>
                  <span className={cn(
                    "text-2xl font-bold",
                    complianceData.score >= 80 ? "text-green-600" :
                    complianceData.score >= 50 ? "text-amber-600" : "text-destructive"
                  )}>
                    {complianceData.score}%
                  </span>
                </div>
                <Progress 
                  value={complianceData.score} 
                  className={cn(
                    "h-3",
                    complianceData.score >= 80 ? "[&>div]:bg-green-500" :
                    complianceData.score >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive"
                  )}
                />
                {complianceData.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {complianceData.issues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Alerts */}
        {overdueShipments.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                <Bell className="w-5 h-5" />
                تنبيهات الشحنات المتأخرة ({overdueShipments.length})
              </CardTitle>
              <CardDescription>شحنات تجاوزت 48 ساعة بدون إكمال</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overdueShipments.slice(0, 10).map((s: any) => {
                  const days = differenceInDays(new Date(), new Date(s.created_at));
                  return (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                      <div className="flex items-center gap-3">
                        <Timer className="w-4 h-4 text-amber-600" />
                        <div>
                          <span className="font-mono text-sm font-medium">{s.shipment_number}</span>
                          <span className="text-xs text-muted-foreground mr-2">{s.generator?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          متأخرة {days} يوم
                        </Badge>
                        <Badge className={cn("text-xs", statusColors[s.status || 'new'])}>
                          {statusLabels[s.status || 'new']}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        {filteredShipments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:hidden">
            {/* Waste Type Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  توزيع أنواع المخلفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={wasteTypeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {wasteTypeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  توزيع الحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="عدد الشحنات" radius={[0, 4, 4, 0]}>
                      {statusChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  الاتجاه الشهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="عدد الشحنات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="print:hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                البحث والتصفية
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-4 h-4 ml-1" />
                مسح الفلاتر
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الشحنة، اسم الجهة، السائق..."
                  className="pr-9"
                />
              </div>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-right", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'من تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-right", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'إلى تاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Waste Type Filter */}
              <Select value={selectedWasteType} onValueChange={setSelectedWasteType}>
                <SelectTrigger>
                  <SelectValue placeholder="نوع المخلف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  {NON_HAZARDOUS_WASTE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{wasteTypeLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <div className="text-center border-b-2 border-primary pb-4 mb-4">
            <h1 className="text-2xl font-bold">سجل المخلفات الغير خطرة</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {organization?.name} | كود العميل: {(organization as any)?.client_code}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}
              {dateFrom && ` | من: ${format(dateFrom, 'dd/MM/yyyy')}`}
              {dateTo && ` | إلى: ${format(dateTo, 'dd/MM/yyyy')}`}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <Card ref={printRef}>
          <CardHeader className="print:hidden">
            <CardTitle>سجل الشحنات</CardTitle>
            <CardDescription>
              عرض {filteredShipments.length} شحنة من إجمالي {shipments?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد شحنات مطابقة للفلاتر المحددة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">رقم الشحنة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">نوع المخلف</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">التعبئة</TableHead>
                      <TableHead className="text-right">الجهة المولدة</TableHead>
                      <TableHead className="text-right">الجهة الناقلة</TableHead>
                      <TableHead className="text-right">الجهة المدورة</TableHead>
                      <TableHead className="text-right">السائق</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment: any, index: number) => (
                      <TableRow key={shipment.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{shipment.shipment_number}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}
                            <span className="block text-xs text-muted-foreground">
                              {format(new Date(shipment.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{shipment.quantity}</span>
                          <span className="text-muted-foreground text-sm mr-1">{shipment.unit || 'كجم'}</span>
                        </TableCell>
                        <TableCell>
                          {shipment.packaging_method ? (
                            <span className="text-sm">{packagingLabels[shipment.packaging_method] || shipment.packaging_method}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{shipment.generator?.name}</p>
                              <p className="text-xs text-muted-foreground">{shipment.generator?.client_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{shipment.transporter?.name}</p>
                              <p className="text-xs text-muted-foreground">{shipment.transporter?.client_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Recycle className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{shipment.recycler?.name}</p>
                              <p className="text-xs text-muted-foreground">{shipment.recycler?.client_code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipment.driver?.profiles ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{shipment.driver.profiles.full_name}</p>
                                <p className="text-xs text-muted-foreground">{shipment.driver.vehicle_plate}</p>
                              </div>
                            </div>
                          ) : shipment.manual_driver_name ? (
                            <div>
                              <p className="text-sm">{shipment.manual_driver_name}</p>
                              <p className="text-xs text-muted-foreground">{shipment.manual_vehicle_plate}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", statusColors[shipment.status || 'new'])}>
                            {statusLabels[shipment.status || 'new']}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t">
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="w-32 h-20 border-2 border-dashed border-gray-300 mb-2 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">الختم</span>
              </div>
              <p className="text-sm font-medium">ختم الجهة</p>
            </div>
            <div className="text-center">
              <p className="text-sm">إجمالي الشحنات: {stats.total}</p>
              <p className="text-sm">إجمالي الوزن: {stats.totalWeight.toLocaleString()} كجم</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-20 border-2 border-dashed border-gray-300 mb-2 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">التوقيع</span>
              </div>
              <p className="text-sm font-medium">توقيع المسؤول</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          table {
            font-size: 10px;
          }
          th, td {
            padding: 4px 6px !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default NonHazardousWasteRegister;
