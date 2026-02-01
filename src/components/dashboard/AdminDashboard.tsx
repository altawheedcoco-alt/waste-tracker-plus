import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import QuickActionsGrid, { QuickAction } from './QuickActionsGrid';
import ShipmentPrintView from '@/components/shipments/ShipmentPrintView';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import ChatWidget from '@/components/chat/ChatWidget';
import SmartRequestDialog from './SmartRequestDialog';
import {
  Package,
  Building2,
  Truck,
  Users,
  FileText,
  Settings,
  MapPin,
  Activity,
  ChartBar,
  UserPlus,
  Recycle,
  Eye,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Link,
  TestTube,
  Upload,
  Bot,
  LayoutDashboard,
  Search,
  KeyRound,
  UserX,
  UserCheck,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Leaf,
  ClipboardList,
  Plus,
  Bell,
  AlertCircle,
  Shield,
  Send,
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
  phone: string | null;
  is_active: boolean;
  organization_id: string | null;
  organization_name?: string;
  organization_type?: string;
  position?: string | null;
  department?: string | null;
  created_at?: string;
  role?: string;
}

interface UserRole {
  user_id: string;
  role: string;
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

  // User management states
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isTogglingUser, setIsTogglingUser] = useState<string | null>(null);
  
  // Print dialog states
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedShipmentForPrint, setSelectedShipmentForPrint] = useState<any>(null);
  const [loadingShipmentDetails, setLoadingShipmentDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch shipments with full details
      const { data: shipments, count: totalShipments } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          status,
          waste_type,
          quantity,
          unit,
          created_at,
          pickup_address,
          delivery_address,
          pickup_date,
          expected_delivery_date,
          notes,
          generator_notes,
          recycler_notes,
          waste_description,
          hazard_level,
          packaging_method,
          disposal_method,
          approved_at,
          collection_started_at,
          in_transit_at,
          delivered_at,
          confirmed_at,
          manual_driver_name,
          manual_vehicle_plate,
          generator:organizations!shipments_generator_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, delegate_name, delegate_phone, delegate_email, delegate_national_id, agent_name, agent_phone, agent_email, agent_national_id, stamp_url, signature_url, logo_url),
          transporter:organizations!shipments_transporter_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, delegate_name, delegate_phone, delegate_email, delegate_national_id, agent_name, agent_phone, agent_email, agent_national_id, stamp_url, signature_url, logo_url),
          recycler:organizations!shipments_recycler_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, delegate_name, delegate_phone, delegate_email, delegate_national_id, agent_name, agent_phone, agent_email, agent_national_id, stamp_url, signature_url, logo_url),
          driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      const activeShipments = shipments?.filter(s => 
        ['new', 'approved', 'collecting', 'in_transit'].includes(s.status || '')
      ).length || 0;

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

      // Fetch pending users (profiles without organization)
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

  // Fetch full shipment details for print
  const fetchShipmentForPrint = async (shipmentId: string) => {
    setLoadingShipmentDetails(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          generator:organizations!shipments_generator_id_fkey(
            name, email, phone, address, city, representative_name, client_code
          ),
          transporter:organizations!shipments_transporter_id_fkey(
            name, email, phone, address, city, representative_name, client_code
          ),
          recycler:organizations!shipments_recycler_id_fkey(
            name, email, phone, address, city, representative_name, client_code
          ),
          driver:drivers(
            license_number, vehicle_type, vehicle_plate,
            profile:profiles(full_name, phone)
          )
        `)
        .eq('id', shipmentId)
        .single();

      if (error) throw error;
      
      setSelectedShipmentForPrint(data);
      setPrintDialogOpen(true);
    } catch (error) {
      console.error('Error fetching shipment for print:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب بيانات الشحنة',
        variant: 'destructive',
      });
    } finally {
      setLoadingShipmentDetails(false);
    }
  };

  // Fetch all users with roles
  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      // Fetch profiles with organization data
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          is_active,
          organization_id,
          position,
          department,
          created_at,
          organization:organizations(name, organization_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;
      setUserRoles(roles || []);

      // Map roles to users
      const rolesMap = new Map<string, string>();
      roles?.forEach(r => {
        const existing = rolesMap.get(r.user_id);
        if (existing) {
          rolesMap.set(r.user_id, `${existing}, ${r.role}`);
        } else {
          rolesMap.set(r.user_id, r.role);
        }
      });

      setAllUsers(profiles?.map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        is_active: p.is_active ?? true,
        organization_id: p.organization_id,
        organization_name: (p.organization as any)?.name,
        organization_type: (p.organization as any)?.organization_type,
        position: p.position,
        department: p.department,
        created_at: p.created_at,
        role: rolesMap.get(p.user_id) || 'user',
      })) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب بيانات المستخدمين',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    if (newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: {
          targetUserId: selectedUser.user_id,
          newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في إعادة تعيين كلمة المرور');
      }

      toast({
        title: 'تم بنجاح',
        description: `تم إعادة تعيين كلمة مرور ${selectedUser.full_name}`,
      });

      setResetPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إعادة تعيين كلمة المرور',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Toggle user active status
  const handleToggleUser = async (user: UserProfile) => {
    setIsTogglingUser(user.id);
    
    try {
      const action = user.is_active ? 'deactivate' : 'activate';
      
      const response = await supabase.functions.invoke('admin-toggle-user', {
        body: {
          targetUserId: user.user_id,
          profileId: user.id,
          action,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في تغيير حالة المستخدم');
      }

      toast({
        title: 'تم بنجاح',
        description: user.is_active 
          ? `تم تعطيل حساب ${user.full_name}` 
          : `تم تفعيل حساب ${user.full_name}`,
      });

      await fetchAllUsers();
    } catch (error: any) {
      console.error('Error toggling user:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تغيير حالة المستخدم',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingUser(null);
    }
  };

  const openResetPasswordDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordDialog(true);
  };

  const filteredUsers = allUsers.filter(user =>
    user.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.organization_name?.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const getOrgTypeLabel = (type?: string) => {
    switch (type) {
      case 'generator': return 'الجهة المولدة';
      case 'transporter': return 'الجهة الناقلة';
      case 'recycler': return 'الجهة المدورة';
      default: return 'غير محدد';
    }
  };

  const getRoleLabel = (role?: string) => {
    if (!role) return 'مستخدم';
    const roleLabels: Record<string, string> = {
      admin: 'مسؤول النظام',
      company_admin: 'مدير الجهة',
      employee: 'موظف',
      driver: 'سائق',
    };
    return role.split(', ').map(r => roleLabels[r] || r).join('، ');
  };

  const getRoleBadgeVariant = (role?: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (role?.includes('admin')) return 'default';
    if (role?.includes('company_admin')) return 'secondary';
    return 'outline';
  };

  const statCards = [
    { title: 'إجمالي الشحنات', value: stats.totalShipments, subtitle: 'جميع الشحنات', icon: FileText },
    { title: 'الشحنات النشطة', value: stats.activeShipments, subtitle: 'قيد التنفيذ حالياً', icon: Truck },
    { title: 'الجهات المسجلة', value: stats.registeredCompanies, subtitle: 'جميع الفئات', icon: Building2 },
    { title: 'السائقون النشطون', value: stats.activeDrivers, subtitle: `من أصل ${stats.totalDrivers}`, icon: Users },
  ];

  const quickActions: QuickAction[] = [
    { title: 'نظرة عامة على النظام', subtitle: 'لوحة تحكم شاملة لجميع الجهات', icon: LayoutDashboard, path: '/dashboard/system-overview', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
    { title: 'إدارة الشحنات', subtitle: 'عرض وإدارة جميع الشحنات', icon: Package, path: '/dashboard/shipments', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'إدارة الطلبات', subtitle: 'مراجعة طلبات الموافقة', icon: ClipboardList, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600' },
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
          <p className="text-primary">
            مرحباً بك، مدير النظام
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Organization Breakdown */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => navigate('/dashboard/partners')}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الجهات المولدة</p>
                <p className="text-2xl font-bold">{stats.generatorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => navigate('/dashboard/partners')}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الجهات الناقلة</p>
                <p className="text-2xl font-bold">{stats.transporterCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => navigate('/dashboard/partners')}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Recycle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الجهات المدورة</p>
                <p className="text-2xl font-bold">{stats.recyclerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="partners">الشركاء</TabsTrigger>
          <TabsTrigger value="tracking">تتبع السائقين</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick Actions */}
          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="إدارة الشحنات والجهات والتقارير"
          />

          {/* Recent Shipments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                  <Eye className="ml-2 h-4 w-4" />
                  عرض الكل
                </Button>
                <div className="text-right">
                  <CardTitle>الشحنات الأخيرة</CardTitle>
                  <CardDescription>أحدث الشحنات في النظام</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentShipments.length === 0 ? (
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
        </TabsContent>

        <TabsContent value="partners" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="text-right">
              <div className="flex items-center justify-between">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => navigate('/dashboard/partners')}
                >
                  <Eye className="w-4 h-4" />
                  عرض صفحة الشركاء الكاملة
                </Button>
                <div>
                  <CardTitle>جميع الجهات والشركاء</CardTitle>
                  <CardDescription>عرض سريع لجميع الجهات المسجلة في النظام</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => navigate('/dashboard/partners')}>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الجهات المولدة</p>
                        <p className="text-2xl font-bold">{stats.generatorCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => navigate('/dashboard/partners')}>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الجهات الناقلة</p>
                        <p className="text-2xl font-bold">{stats.transporterCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => navigate('/dashboard/partners')}>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Recycle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">الجهات المدورة</p>
                        <p className="text-2xl font-bold">{stats.recyclerCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  للاطلاع على كافة بيانات الجهات وإدارتها، انتقل إلى صفحة الشركاء
                </p>
                <Button onClick={() => navigate('/dashboard/partners')} className="gap-2">
                  <Building2 className="w-4 h-4" />
                  عرض جميع الشركاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="text-right">
              <div className="flex items-center justify-between">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => navigate('/dashboard/driver-tracking')}
                >
                  <MapPin className="w-4 h-4" />
                  خريطة التتبع
                </Button>
                <div>
                  <CardTitle>تتبع السائقين</CardTitle>
                  <CardDescription>خريطة مواقع السائقين في الوقت الفعلي</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">السائقون النشطون</p>
                        <p className="text-2xl font-bold">{stats.activeDrivers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
                        <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  انتقل إلى صفحة التتبع لمشاهدة خريطة السائقين في الوقت الفعلي
                </p>
                <Button onClick={() => navigate('/dashboard/driver-tracking')}>
                  <MapPin className="w-4 h-4 ml-2" />
                  فتح خريطة التتبع
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Dialog */}
      <ShipmentPrintView 
        isOpen={printDialogOpen} 
        onClose={() => setPrintDialogOpen(false)} 
        shipment={selectedShipmentForPrint} 
      />

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
            <DialogDescription>
              تعيين كلمة مرور جديدة لـ {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="text-right"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialog(false)}
              disabled={isResettingPassword}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResettingPassword || !newPassword || !confirmPassword}
            >
              {isResettingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : null}
              تعيين كلمة المرور
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Widget */}
      <ChatWidget />
    </motion.div>
  );
};

export default AdminDashboard;
