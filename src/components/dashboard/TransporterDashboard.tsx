import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QuickActionsGrid, { QuickAction } from './QuickActionsGrid';
import PartnersView from './PartnersView';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentStatusTimeline from '@/components/shipments/ShipmentStatusTimeline';
import ShipmentStatusDialog from '@/components/shipments/ShipmentStatusDialog';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import BulkStatusChangeDropdown from '@/components/shipments/BulkStatusChangeDropdown';

import DocumentVerificationWidget from './DocumentVerificationWidget';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import SmartRequestDialog from './SmartRequestDialog';
import ChatWidget from '@/components/chat/ChatWidget';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import {
  Package,
  Truck,
  Users,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Eye,
  Recycle,
  FileText,
  Search,
  Stamp,
  Building2,
  Bell,
  AlertTriangle,
  Printer,
  CalendarIcon,
  BarChart3,
  UserPlus,
  X,
  Bot,
  Factory,
  Shield,
  Leaf,
  Scale,
  Sparkles,
  Send,
  FileSignature,
  Banknote,
  Navigation,
  Zap,
  Link2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ShipmentStats {
  total: number;
  active: number;
  drivers: number;
  partnerCompanies: number;
}

interface Notification {
  id: string;
  shipment_number: string;
  message: string;
  created_at: string;
  type: string;
}

interface RecentShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
}

const TransporterDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    active: 0,
    drivers: 0,
    partnerCompanies: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Report filters
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusShipment, setStatusShipment] = useState<RecentShipment | null>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch shipments with simplified query
      const { data: shipmentsRaw } = await supabase
        .from('shipments')
        .select(`id, shipment_number, waste_type, quantity, unit, status, created_at, pickup_address, delivery_address, generator_id, recycler_id, driver_id`)
        .eq('transporter_id', organization?.id)
        .order('created_at', { ascending: false });

      // Fetch organizations for enrichment
      const orgIds = [...new Set([
        ...(shipmentsRaw || []).map(s => s.generator_id).filter(Boolean),
        ...(shipmentsRaw || []).map(s => s.recycler_id).filter(Boolean),
      ])] as string[];
      
      const orgsMap: Record<string, any> = {};
      if (orgIds.length > 0) {
        const { data: orgsData } = await supabase.from('organizations').select('id, name').in('id', orgIds);
        orgsData?.forEach(o => { orgsMap[o.id] = o; });
      }

      // Fetch drivers
      const driverIds = [...new Set((shipmentsRaw || []).map(s => s.driver_id).filter(Boolean))] as string[];
      const driversMap: Record<string, any> = {};
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase.from('drivers').select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)').in('id', driverIds);
        driversData?.forEach(d => { driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile }; });
      }

      const shipments = (shipmentsRaw || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: s.driver_id ? driversMap[s.driver_id] || null : null,
      }));

      // Fetch drivers count
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', organization?.id);

      // Fetch actual partner companies from shipments
      const partnerIds = new Set<string>();
      if (shipments) {
        shipments.forEach((s: any) => {
          if (s.generator?.name) partnerIds.add(s.generator.name);
          if (s.recycler?.name) partnerIds.add(s.recycler.name);
        });
      }

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (shipments) {
        // Fetch recycling reports to check which shipments have reports
        const shipmentIds = shipments.map(s => s.id);
        const { data: reportsData } = await supabase
          .from('recycling_reports')
          .select('shipment_id')
          .in('shipment_id', shipmentIds);

        const reportedShipmentIds = new Set(reportsData?.map(r => r.shipment_id) || []);

        const shipmentsWithReportStatus = shipments.map(s => ({
          ...s,
          has_report: reportedShipmentIds.has(s.id),
        }));

        setRecentShipments(shipmentsWithReportStatus.slice(0, 5) as unknown as RecentShipment[]);
        
        const activeStatuses = ['new', 'approved', 'in_transit'];
        setStats({
          total: shipments.length,
          active: shipments.filter(s => activeStatuses.includes(s.status || '')).length,
          drivers: driversData?.length || 0,
          partnerCompanies: partnerIds.size,
        });
      }

      if (notificationsData) {
        setNotifications(notificationsData.map(n => ({
          id: n.id,
          shipment_number: n.title,
          message: n.message,
          created_at: n.created_at || '',
          type: n.type || 'info',
        })));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: 'جديدة', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: 'معتمدة', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      in_transit: { label: 'في الطريق', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      delivered: { label: 'تم التسليم', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
      confirmed: { label: 'مؤكدة', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getWasteTypeLabel = (type: string) => {
    const wasteTypes: Record<string, string> = {
      plastic: 'بلاستيك',
      paper: 'ورق',
      metal: 'معادن',
      glass: 'زجاج',
      electronic: 'إلكترونيات',
      organic: 'عضوية',
      chemical: 'كيميائية',
      medical: 'طبية',
      construction: 'مخلفات بناء',
      other: 'أخرى',
    };
    return wasteTypes[type] || type;
  };

  const handleViewShipment = (shipment: RecentShipment) => {
    setSelectedShipment(shipment);
    setShowPrintDialog(true);
  };

  const handleQuickStatusChange = async (shipmentId: string, newStatus: string) => {
    try {
      const updateData: Record<string, any> = { status: newStatus };
      const now = new Date().toISOString();
      
      // Set timestamp based on status
      switch (newStatus) {
        case 'approved':
          updateData.approved_at = now;
          break;
        case 'in_transit':
          updateData.in_transit_at = now;
          break;
        case 'delivered':
          updateData.delivered_at = now;
          break;
        case 'confirmed':
          updateData.confirmed_at = now;
          break;
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);

      if (error) throw error;

      // Log the status change
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          await supabase.from('shipment_logs').insert({
            shipment_id: shipmentId,
            status: newStatus as any,
            notes: 'تم التحديث من لوحة التحكم',
            changed_by: profileData.id,
          });
        }
      }

      // Refresh data
      fetchDashboardData();
      
      // Show success toast
      const statusLabels: Record<string, string> = {
        approved: 'معتمدة',
        in_transit: 'قيد النقل',
        delivered: 'تم التسليم',
        confirmed: 'مؤكدة',
      };
      
      toast.success(`تم تحديث الحالة إلى "${statusLabels[newStatus] || newStatus}"`);
    } catch (error) {
      console.error('Error updating shipment status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };


  const quickActions: QuickAction[] = [
    { title: 'روابط الإيداع السريع ⚡', subtitle: 'روابط مخصصة لاستقبال الإيداعات', icon: Zap, path: '/dashboard/quick-deposit-links', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { title: 'روابط الشحنات السريعة', subtitle: 'روابط مخصصة لتسجيل الشحنات', icon: Link2, path: '/dashboard/quick-shipment-links', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { title: 'شهادات استلام الشحنات', subtitle: 'إصدار وإدارة شهادات الاستلام', icon: FileText, path: '/dashboard/transporter-receipts', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { title: 'عرض توضيحي للملاحة', subtitle: 'محاكاة رحلة نقل كاملة', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600' },
    { title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: () => setShowDepositDialog(true), iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { title: 'قوالب العقود', subtitle: 'إنشاء صيغ عقود الجمع والنقل', icon: FileText, path: '/dashboard/contract-templates', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
    { title: 'سجل الكميات الخارجية', subtitle: 'تسجيل كميات من مصادر خارجية', icon: Scale, path: '/dashboard/external-records', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600' },
    { title: 'أدوات تحليل النقل', subtitle: 'إحصائيات وتحليلات الشحنات', icon: Bot, path: '/dashboard/transporter-ai-tools', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600' },
    { title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'طلب تقارير بيئية', subtitle: 'إرسال طلب تقارير للإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
    { title: 'تسجيل شركة', subtitle: 'تسجيل شركة مولدة أو مدورة', icon: Building2, path: '/dashboard/register-company' },
    { title: 'إدارة السائقين', subtitle: 'إضافة أو تعديل السائقين', icon: Users, path: '/dashboard/transporter-drivers' },
    { title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي الشركة', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'البحث والتصفية', subtitle: 'بحث متقدم عن الشحنات', icon: Search, path: '/dashboard/transporter-shipments' },
    { title: 'التقرير المجمع', subtitle: 'طباعة تقرير مجمع للشحنات', icon: FileText, path: '/dashboard/reports' },
    { title: 'الامضاءات والأختام', subtitle: 'رفع امضاء وختم الشركة', icon: Stamp, path: '/dashboard/signatures' },
    { title: 'تتبع السائقين', subtitle: 'متابعة مواقع السائقين', icon: MapPin, path: '/dashboard/driver-tracking' },
    { title: 'الشركاء', subtitle: 'عرض الجهات المولدة والمدورة', icon: Factory, path: '/dashboard/partners' },
  ];

  const statCards = [
    { title: 'إجمالي الشحنات', value: stats.total, subtitle: 'جميع الشحنات', icon: FileText },
    { title: 'الشحنات النشطة', value: stats.active, subtitle: 'قيد التنفيذ حالياً', icon: Truck },
    { title: 'سائقي', value: stats.drivers, subtitle: 'سائقين مسجلين', icon: Users },
    { title: 'الشركات الشريكة', value: stats.partnerCompanies, subtitle: 'مولدين ومدورين', icon: Building2 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="text-right">
          <h1 className="text-xl sm:text-2xl font-bold">لوحة تحكم الجهة الناقلة</h1>
          <p className="text-primary text-sm sm:text-base">
            مرحباً بعودتك، {organization?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AutomationSettingsDialog />
          <SmartRequestDialog buttonText="طلب تقارير" buttonVariant="outline" />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSmartWeightUpload(true)}
            className="bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/30 hover:border-primary text-xs sm:text-sm"
          >
            <Sparkles className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            رفع الوزنة الذكي
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/transporter-shipments')} className="text-xs sm:text-sm">
            <FileText className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            عرض شحنات الشركة
          </Button>
          <Button variant="eco" size="sm" onClick={() => navigate('/dashboard/shipments/new')} className="text-xs sm:text-sm">
            <Plus className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            إنشاء شحنة
          </Button>
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-right">
              <Bell className="w-5 h-5 text-primary" />
              إشعارات الشحنات
              {notifications.length > 0 && (
                <Badge variant="destructive" className="mr-2">{notifications.length} جديد</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-right">إشعارات متعلقة بحالة الشحنات وطلبات الموافقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                    مقبولة تلقائياً
                  </Badge>
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">تم قبول الشحنة تلقائياً رقم {notification.shipment_number}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.created_at && format(new Date(notification.created_at), 'PPp', { locale: ar })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document Verification Widget */}
      <DocumentVerificationWidget />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">نظرة عامة</TabsTrigger>
          <TabsTrigger value="partners" className="text-xs sm:text-sm whitespace-nowrap">الشركاء</TabsTrigger>
          <TabsTrigger value="tracking" className="text-xs sm:text-sm whitespace-nowrap">تتبع السائقين</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-xl sm:text-3xl font-bold mt-1">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{stat.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="إدارة الشحنات والسائقين والتقارير"
          />

          {/* My Shipments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BulkStatusChangeDropdown 
                    shipments={recentShipments.map(s => ({
                      id: s.id,
                      status: s.status,
                      created_at: s.created_at,
                      waste_type: s.waste_type,
                    }))}
                    onStatusChange={fetchDashboardData}
                  />
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/transporter-shipments')}>
                    <Eye className="ml-2 h-4 w-4" />
                    عرض الكل
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle>شحناتي</CardTitle>
                  <CardDescription>الشحنات المدارة بواسطة شركة النقل الخاصة بك</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد شحنات حتى الآن</p>
                  <Button variant="eco" className="mt-4" onClick={() => navigate('/dashboard/shipments/new')}>
                    <Plus className="ml-2 h-4 w-4" />
                    إنشاء أول شحنة
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentShipments.map((shipment) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onStatusChange={fetchDashboardData}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aggregate Report Section */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <FileText className="w-5 h-5" />
                التقرير المجمع للشحنات
              </CardTitle>
              <CardDescription className="text-primary">
                طباعة تقرير مجمع للشحنات مع التوقيعات والأختام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Date */}
                <div className="space-y-2 text-right">
                  <Label>من تاريخ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {fromDate ? format(fromDate, "PPP", { locale: ar }) : "yyyy/شهر/يوم"}
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
                          "w-full justify-start text-right",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {toDate ? format(toDate, "PPP", { locale: ar }) : "yyyy/شهر/يوم"}
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

                {/* Waste Type Filter */}
                <div className="space-y-2 text-right">
                  <Label>نوع المخلف</Label>
                  <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                    <SelectTrigger>
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
                      <SelectItem value="construction">مخلفات بناء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Company Filter */}
                <div className="space-y-2 text-right">
                  <Label>الشركة</Label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الشركات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الشركات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFromDate(undefined);
                    setToDate(undefined);
                    setWasteTypeFilter('all');
                    setCompanyFilter('all');
                  }}
                >
                  <X className="ml-2 h-4 w-4" />
                  إعادة تعيين الفلاتر
                </Button>
              </div>

              {/* Generate Report Button */}
              <Button variant="eco" className="w-full" size="lg">
                <Printer className="ml-2 h-5 w-5" />
                إنشاء وطباعة التقرير المجمع
              </Button>

              {/* Notes */}
              <div className="p-4 rounded-lg bg-muted/50 text-right">
                <p className="font-medium mb-2">ملاحظات:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>سيتم تضمين التوقيعات والأختام المحفوظة تلقائياً</li>
                  <li>يمكن تصفية الشحنات حسب التاريخ، نوع المخلف، والشركة</li>
                  <li>سيتم عرض معاينة العدد قبل الطباعة</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="mt-6">
          <PartnersView />
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                تتبع السائقين
              </CardTitle>
              <CardDescription>عرض مواقع السائقين على الخريطة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">خريطة تتبع السائقين</p>
                  <Button variant="eco" className="mt-4" onClick={() => navigate('/dashboard/driver-tracking')}>
                    فتح التتبع الكامل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Dialog */}
      <EnhancedShipmentPrintView
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        shipment={selectedShipment as any}
      />

      {/* Smart Weight Upload Dialog */}
      <SmartWeightUpload 
        open={showSmartWeightUpload} 
        onOpenChange={setShowSmartWeightUpload} 
      />

      {/* Status Change Dialog */}
      {statusShipment && (
        <ShipmentStatusDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setStatusShipment(null);
          }}
          shipment={statusShipment}
          onStatusChanged={fetchDashboardData}
        />
      )}

      {/* Chat Widget */}
      <ChatWidget />

      {/* Deposit Dialog */}
      <AddDepositDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
      />
    </div>
  );
};

export default TransporterDashboard;
