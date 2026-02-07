import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import QuickActionsGrid, { QuickAction } from './QuickActionsGrid';
import ShipmentPrintView from '@/components/shipments/ShipmentPrintView';
import ChatWidget from '@/components/chat/ChatWidget';
import SmartRequestDialog from './SmartRequestDialog';
import AdminDashboardSwitcher from './admin/AdminDashboardSwitcher';
import {
  AdminStatsGrid,
  OrganizationBreakdown,
  ResetPasswordDialog,
  AdminRecentShipments,
  AdminPartnersTab,
  AdminTrackingTab,
  StatCard,
} from './admin';
import {
  Package,
  Building2,
  Truck,
  Users,
  FileText,
  MapPin,
  Activity,
  ChartBar,
  UserPlus,
  Recycle,
  Plus,
  Bot,
  LayoutDashboard,
  Link,
  Leaf,
  ClipboardList,
  Shield,
  FileCheck,
  Navigation,
} from 'lucide-react';

interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  registeredCompanies: number;
  activeDrivers: number;
  totalDrivers: number;
  pendingUsers: number;
  generatorCount: number;
  transporterCount: number;
  recyclerCount: number;
}

interface RecentShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
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
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    activeShipments: 0,
    registeredCompanies: 0,
    activeDrivers: 0,
    totalDrivers: 0,
    pendingUsers: 0,
    generatorCount: 0,
    transporterCount: 0,
    recyclerCount: 0,
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Password reset dialog states
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Print dialog states
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedShipmentForPrint, setSelectedShipmentForPrint] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch shipments with simplified query
      const { data: shipmentsRaw, count: totalShipments } = await supabase
        .from('shipments')
        .select(`id, shipment_number, status, waste_type, quantity, unit, created_at, generator_id, transporter_id, recycler_id`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch organizations for enrichment
      const { data: orgsData } = await supabase.from('organizations').select('id, name');
      const orgsMap: Record<string, any> = {};
      orgsData?.forEach(o => { orgsMap[o.id] = { name: o.name }; });

      const shipments = (shipmentsRaw || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: null,
      }));

      const activeShipments = shipments.filter(s => 
        ['new', 'approved', 'in_transit'].includes(s.status || '')
      ).length;

      // Fetch organizations stats
      const { data: organizations } = await supabase
        .from('organizations')
        .select('organization_type');

      const generatorCount = organizations?.filter(o => o.organization_type === 'generator').length || 0;
      const transporterCount = organizations?.filter(o => o.organization_type === 'transporter').length || 0;
      const recyclerCount = organizations?.filter(o => o.organization_type === 'recycler').length || 0;

      // Fetch drivers stats
      const { data: drivers } = await supabase
        .from('drivers')
        .select('is_available');

      const activeDrivers = drivers?.filter(d => d.is_available).length || 0;

      // Fetch pending users
      const { data: pendingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .is('organization_id', null);

      setStats({
        totalShipments: totalShipments || 0,
        activeShipments,
        registeredCompanies: organizations?.length || 0,
        activeDrivers,
        totalDrivers: drivers?.length || 0,
        pendingUsers: pendingProfiles?.length || 0,
        generatorCount,
        transporterCount,
        recyclerCount,
      });

      setRecentShipments(shipments as unknown as RecentShipment[] || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    { title: 'إجمالي الشحنات', value: stats.totalShipments, subtitle: 'جميع الشحنات', icon: FileText },
    { title: 'الشحنات النشطة', value: stats.activeShipments, subtitle: 'قيد التنفيذ حالياً', icon: Truck },
    { title: 'الجهات المسجلة', value: stats.registeredCompanies, subtitle: 'جميع الفئات', icon: Building2 },
    { title: 'السائقون النشطون', value: stats.activeDrivers, subtitle: `من أصل ${stats.totalDrivers}`, icon: Users },
  ];

  const quickActions: QuickAction[] = [
    { title: 'عرض توضيحي للملاحة', subtitle: 'محاكاة رحلة نقل كاملة', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600' },
    { title: 'نظرة عامة على النظام', subtitle: 'لوحة تحكم شاملة لجميع الجهات', icon: LayoutDashboard, path: '/dashboard/system-overview', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
    { title: 'إدارة الشحنات', subtitle: 'عرض وإدارة جميع الشحنات', icon: Package, path: '/dashboard/shipments', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'إدارة الطلبات', subtitle: 'مراجعة طلبات الموافقة', icon: ClipboardList, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { title: 'التحقق من المستندات', subtitle: 'نظام التحقق التلقائي من الوثائق القانونية', icon: Shield, path: '/dashboard/document-verification', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
    { title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600' },
    { title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'أدوات الذكاء الاصطناعي', subtitle: 'استخراج البيانات وتحليلها', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { title: 'إدارة الشركات', subtitle: 'إضافة وإدارة الشركات', icon: Building2, path: '/dashboard/company-management', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي جميع الشركات', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
    { title: 'موافقات الشركات', subtitle: 'مراجعة طلبات التسجيل', icon: Building2, path: '/dashboard/company-approvals' },
    { title: 'إضافة سائق', subtitle: 'تسجيل سائقين جدد', icon: UserPlus, path: '/dashboard/driver-approvals' },
    { title: 'إدارة أنواع المخلفات', subtitle: 'تحرير فئات المخلفات', icon: Recycle, path: '/dashboard/waste-types' },
    { title: 'عرض التقارير', subtitle: 'إنشاء تقارير النظام', icon: ChartBar, path: '/dashboard/reports' },
    { title: 'ربط المستخدمين بالشركات', subtitle: 'إدارة ربط المستخدمين بالشركات', icon: Link, path: '/dashboard/user-linking' },
    { title: 'مستندات الشركات', subtitle: 'عرض وطباعة مستندات الشروط والأختام', icon: FileText, path: '/dashboard/documents' },
    { title: 'موافقات الشروط والأحكام', subtitle: 'متابعة موافقات الجهات على السياسات', icon: FileCheck, path: '/dashboard/terms-acceptances', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { title: 'إنشاء شحنة', subtitle: 'إنشاء شحنة جديدة', icon: Plus, path: '/dashboard/shipments/new' },
    { title: 'تتبع السائقين', subtitle: 'خريطة مواقع السائقين', icon: MapPin, path: '/dashboard/driver-tracking' },
    { title: 'سجل النشاطات', subtitle: 'تتبع جميع العمليات', icon: Activity, path: '/dashboard/activity-log' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold">لوحة تحكم جهة الإدارة والمراقبة</h1>
          <p className="text-primary">مرحباً بك، مدير النظام</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AdminDashboardSwitcher />
          <SmartRequestDialog buttonText="طلب تقارير" buttonVariant="outline" />
          <Button variant="outline" onClick={() => navigate('/dashboard/shipments')}>
            <FileText className="ml-2 h-4 w-4" />
            عرض جميع الشحنات
          </Button>
          <Button variant="eco" onClick={() => navigate('/dashboard/shipments/new')}>
            <Plus className="ml-2 h-4 w-4" />
            إنشاء شحنة
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <AdminStatsGrid stats={statCards} />
      </motion.div>

      {/* Organization Breakdown */}
      <motion.div variants={itemVariants}>
        <OrganizationBreakdown 
          generatorCount={stats.generatorCount}
          transporterCount={stats.transporterCount}
          recyclerCount={stats.recyclerCount}
        />
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="partners">الشركاء</TabsTrigger>
          <TabsTrigger value="tracking">تتبع السائقين</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="إدارة الشحنات والجهات والتقارير"
          />
          <AdminRecentShipments 
            shipments={recentShipments} 
            onRefresh={fetchDashboardData} 
          />
        </TabsContent>

        <TabsContent value="partners" className="space-y-6 mt-6">
          <AdminPartnersTab 
            generatorCount={stats.generatorCount}
            transporterCount={stats.transporterCount}
            recyclerCount={stats.recyclerCount}
          />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6 mt-6">
          <AdminTrackingTab 
            activeDrivers={stats.activeDrivers}
            totalDrivers={stats.totalDrivers}
          />
        </TabsContent>
      </Tabs>

      {/* Print Dialog */}
      <ShipmentPrintView 
        isOpen={printDialogOpen} 
        onClose={() => setPrintDialogOpen(false)} 
        shipment={selectedShipmentForPrint} 
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetPasswordDialog}
        onOpenChange={setResetPasswordDialog}
        user={selectedUser}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </motion.div>
  );
};

export default AdminDashboard;
