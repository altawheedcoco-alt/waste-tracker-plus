import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Truck,
  Recycle,
  Factory,
  Users,
  Package,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  FileText,
  Activity,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCcw,
  BarChart3,
  Calendar,
  User,
  History,
  Key,
  AlertTriangle,
  TrendingUp,
  Loader2,
  KeyRound,
  Lock,
  Power,
  UserX,
  UserCheck,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  secondary_phone: string | null;
  address: string;
  city: string;
  region: string | null;
  organization_type: string;
  is_verified: boolean;
  is_active: boolean;
  commercial_register: string | null;
  environmental_license: string | null;
  logo_url: string | null;
  representative_name: string | null;
  representative_email: string | null;
  representative_phone: string | null;
  delegate_name: string | null;
  delegate_email: string | null;
  delegate_phone: string | null;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    user_id: string;
    is_active: boolean;
  }[];
  shipments_as_generator?: { id: string }[];
  shipments_as_transporter?: { id: string }[];
  shipments_as_recycler?: { id: string }[];
  documents?: { id: string; document_type: string; file_name: string }[];
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  action: string;
  action_type: string;
  resource_type: string | null;
  created_at: string;
  details: unknown;
}

interface SystemStats {
  totalOrganizations: number;
  generators: number;
  transporters: number;
  recyclers: number;
  totalShipments: number;
  activeShipments: number;
  totalDrivers: number;
  activeDrivers: number;
  totalUsers: number;
  verifiedOrgs: number;
  pendingOrgs: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminSystemOverview = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Password reset states
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; user_id: string; full_name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Toggle user states
  const [isTogglingUser, setIsTogglingUser] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrganizations(),
      fetchActivityLogs(),
      fetchStats(),
    ]);
    setLoading(false);
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          profiles!profiles_organization_id_fkey(id, full_name, email, phone, user_id, is_active),
          documents:organization_documents(id, document_type, file_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch shipment counts separately
      const orgsWithShipments = await Promise.all((data || []).map(async (org) => {
        const [generatorShipments, transporterShipments, recyclerShipments] = await Promise.all([
          supabase.from('shipments').select('id').eq('generator_id', org.id),
          supabase.from('shipments').select('id').eq('transporter_id', org.id),
          supabase.from('shipments').select('id').eq('recycler_id', org.id),
        ]);

        return {
          ...org,
          shipments_as_generator: generatorShipments.data || [],
          shipments_as_transporter: transporterShipments.data || [],
          shipments_as_recycler: recyclerShipments.data || [],
        };
      }));

      setOrganizations(orgsWithShipments);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات المؤسسات',
        variant: 'destructive',
      });
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [orgsResult, shipmentsResult, driversResult, profilesResult] = await Promise.all([
        supabase.from('organizations').select('organization_type, is_verified'),
        supabase.from('shipments').select('status'),
        supabase.from('drivers').select('is_available'),
        supabase.from('profiles').select('id'),
      ]);

      const orgs = orgsResult.data || [];
      const shipments = shipmentsResult.data || [];
      const drivers = driversResult.data || [];
      const profiles = profilesResult.data || [];

      setStats({
        totalOrganizations: orgs.length,
        generators: orgs.filter(o => o.organization_type === 'generator').length,
        transporters: orgs.filter(o => o.organization_type === 'transporter').length,
        recyclers: orgs.filter(o => o.organization_type === 'recycler').length,
        totalShipments: shipments.length,
        activeShipments: shipments.filter(s => s.status !== 'confirmed' && s.status !== 'delivered').length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.is_available).length,
        totalUsers: profiles.length,
        verifiedOrgs: orgs.filter(o => o.is_verified).length,
        pendingOrgs: orgs.filter(o => !o.is_verified).length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getOrgTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generator: 'مولد نفايات',
      transporter: 'ناقل',
      recycler: 'مدور',
    };
    return labels[type] || type;
  };

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return <Factory className="w-4 h-4" />;
      case 'transporter': return <Truck className="w-4 h-4" />;
      case 'recycler': return <Recycle className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getOrgTypeColor = (type: string) => {
    switch (type) {
      case 'generator': return 'bg-amber-500';
      case 'transporter': return 'bg-blue-500';
      case 'recycler': return 'bg-green-500';
      default: return 'bg-muted-foreground';
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.phone.includes(searchQuery);
    const matchesType = filterType === 'all' || org.organization_type === filterType;
    return matchesSearch && matchesType;
  });

  const orgTypeChartData = stats ? [
    { name: 'مولدات', value: stats.generators, color: '#f59e0b' },
    { name: 'ناقلون', value: stats.transporters, color: '#3b82f6' },
    { name: 'مدورون', value: stats.recyclers, color: '#22c55e' },
  ] : [];

  const getShipmentCount = (org: Organization) => {
    switch (org.organization_type) {
      case 'generator': return org.shipments_as_generator?.length || 0;
      case 'transporter': return org.shipments_as_transporter?.length || 0;
      case 'recycler': return org.shipments_as_recycler?.length || 0;
      default: return 0;
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    if (newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingPassword(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('غير مصرح');
      }

      const response = await supabase.functions.invoke('admin-reset-password', {
        body: {
          targetUserId: selectedUser.user_id,
          newPassword: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في إعادة تعيين كلمة المرور');
      }

      toast({
        title: 'تم بنجاح',
        description: `تم إعادة تعيين كلمة المرور للمستخدم ${selectedUser.full_name}`,
      });

      setResetPasswordDialog(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
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

  const openResetPasswordDialog = (profile: { id: string; user_id: string; full_name: string; email: string }) => {
    setSelectedUser(profile);
    setNewPassword('');
    setConfirmPassword('');
    setResetPasswordDialog(true);
  };

  const handleToggleUser = async (profile: { id: string; user_id: string; full_name: string; is_active: boolean }) => {
    setIsTogglingUser(profile.id);
    
    try {
      const action = profile.is_active ? 'deactivate' : 'activate';
      
      const response = await supabase.functions.invoke('admin-toggle-user', {
        body: {
          targetUserId: profile.user_id,
          profileId: profile.id,
          action,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في تغيير حالة المستخدم');
      }

      toast({
        title: 'تم بنجاح',
        description: profile.is_active 
          ? `تم تعطيل حساب ${profile.full_name}` 
          : `تم تفعيل حساب ${profile.full_name}`,
      });

      // Refresh organizations to get updated data
      await fetchOrganizations();
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
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
          <Button onClick={fetchAllData} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            تحديث
          </Button>
          <div className="text-right">
            <h1 className="text-3xl font-bold">نظرة عامة على النظام</h1>
            <p className="text-muted-foreground">إدارة شاملة لجميع المؤسسات والأنشطة</p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
                <p className="text-xs text-muted-foreground">إجمالي المؤسسات</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 text-center">
                <Factory className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold text-amber-600">{stats.generators}</p>
                <p className="text-xs text-muted-foreground">مولدات</p>
              </CardContent>
            </Card>
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-4 text-center">
                <Truck className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{stats.transporters}</p>
                <p className="text-xs text-muted-foreground">ناقلون</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 text-center">
                <Recycle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{stats.recyclers}</p>
                <p className="text-xs text-muted-foreground">مدورون</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalShipments}</p>
                <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">المستخدمين</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="w-4 h-4" />
              المؤسسات
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              سجل النشاط
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <Shield className="w-4 h-4" />
              التحقق
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Types Chart */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle>توزيع المؤسسات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={orgTypeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {orgTypeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle>حالة التحقق</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
                      <Badge variant="default" className="bg-green-500">
                        {stats?.verifiedOrgs || 0}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span>مؤسسات موثقة</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10">
                      <Badge variant="secondary" className="bg-amber-500 text-white">
                        {stats?.pendingOrgs || 0}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span>بانتظار التحقق</span>
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10">
                      <Badge variant="outline">
                        {stats?.activeShipments || 0}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span>شحنات نشطة</span>
                        <Package className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/10">
                      <Badge variant="outline">
                        {stats?.activeDrivers || 0} / {stats?.totalDrivers || 0}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span>سائقين متاحين</span>
                        <User className="w-5 h-5 text-purple-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Organizations */}
            <Card>
              <CardHeader className="text-right">
                <CardTitle>أكثر المؤسسات نشاطاً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...organizations]
                    .sort((a, b) => getShipmentCount(b) - getShipmentCount(a))
                    .slice(0, 5)
                    .map((org, index) => (
                      <div
                        key={org.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <span className="text-2xl font-bold text-muted-foreground w-8">
                          {index + 1}
                        </span>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={org.logo_url || undefined} />
                          <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-right">
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getOrgTypeLabel(org.organization_type)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {getShipmentCount(org)} شحنة
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  الكل
                </Button>
                <Button
                  variant={filterType === 'generator' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('generator')}
                  className="gap-1"
                >
                  <Factory className="w-4 h-4" />
                  مولدات
                </Button>
                <Button
                  variant={filterType === 'transporter' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('transporter')}
                  className="gap-1"
                >
                  <Truck className="w-4 h-4" />
                  ناقلون
                </Button>
                <Button
                  variant={filterType === 'recycler' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('recycler')}
                  className="gap-1"
                >
                  <Recycle className="w-4 h-4" />
                  مدورون
                </Button>
              </div>
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو الإيميل أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>

            {/* Organizations List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrganizations.map((org) => (
                <Card
                  key={org.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedOrg(org)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 justify-end mb-2">
                          <Badge
                            variant={org.is_verified ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {org.is_verified ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {org.is_verified ? 'موثقة' : 'قيد المراجعة'}
                          </Badge>
                          <Badge variant="outline" className={`${getOrgTypeColor(org.organization_type)} text-white`}>
                            {getOrgTypeIcon(org.organization_type)}
                            <span className="mr-1">{getOrgTypeLabel(org.organization_type)}</span>
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg">{org.name}</h3>
                        <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 justify-end">
                            <span>{org.email}</span>
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <span dir="ltr">{org.phone}</span>
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <span>{org.city}</span>
                            <MapPin className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-3 pt-3 border-t">
                          <Badge variant="outline">
                            {getShipmentCount(org)} شحنة
                          </Badge>
                          <Badge variant="outline">
                            {org.profiles?.length || 0} مستخدم
                          </Badge>
                          <Badge variant="outline">
                            {org.documents?.length || 0} وثيقة
                          </Badge>
                        </div>
                      </div>
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={org.logo_url || undefined} />
                        <AvatarFallback className="text-lg">
                          {org.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader className="text-right">
                <CardTitle>سجل النشاطات</CardTitle>
                <CardDescription>آخر 100 نشاط في النظام</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {activityLogs.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد سجلات نشاط بعد</p>
                      </div>
                    ) : (
                      activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center gap-4 p-3 rounded-lg border"
                        >
                          <Badge variant="outline" className="text-xs">
                            {log.action_type}
                          </Badge>
                          <div className="flex-1 text-right">
                            <p className="font-medium">{log.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.resource_type && `${log.resource_type} • `}
                              {format(new Date(log.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
                            </p>
                          </div>
                          <Activity className="w-5 h-5 text-muted-foreground" />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Verification */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <span>بانتظار التحقق</span>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {organizations.filter(o => !o.is_verified).map((org) => (
                        <div
                          key={org.id}
                          className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedOrg(org)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-right">
                              <p className="font-medium">{org.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {getOrgTypeLabel(org.organization_type)} • {org.city}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {org.documents?.length || 0} وثيقة
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {organizations.filter(o => !o.is_verified).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>لا توجد مؤسسات بانتظار التحقق</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Verified Organizations */}
              <Card>
                <CardHeader className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <span>مؤسسات موثقة</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {organizations.filter(o => o.is_verified).map((org) => (
                        <div
                          key={org.id}
                          className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedOrg(org)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={org.logo_url || undefined} />
                              <AvatarFallback>{org.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-right">
                              <p className="font-medium">{org.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {getOrgTypeLabel(org.organization_type)} • {org.city}
                              </p>
                            </div>
                            <Badge variant="default" className="bg-green-500">
                              موثقة
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Organization Details Dialog */}
        <Dialog open={!!selectedOrg} onOpenChange={(open) => !open && setSelectedOrg(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedOrg && (
              <>
                <DialogHeader className="text-right">
                  <DialogTitle className="flex items-center gap-3 justify-end">
                    <span>{selectedOrg.name}</span>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedOrg.logo_url || undefined} />
                      <AvatarFallback>{selectedOrg.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">المعلومات</TabsTrigger>
                    <TabsTrigger value="users">المستخدمين</TabsTrigger>
                    <TabsTrigger value="documents">الوثائق</TabsTrigger>
                    <TabsTrigger value="contacts">جهات الاتصال</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4 text-right">
                          <p className="text-sm text-muted-foreground">نوع الجهة</p>
                          <Badge className={`${getOrgTypeColor(selectedOrg.organization_type)} text-white mt-1`}>
                            {getOrgTypeIcon(selectedOrg.organization_type)}
                            <span className="mr-1">{getOrgTypeLabel(selectedOrg.organization_type)}</span>
                          </Badge>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-right">
                          <p className="text-sm text-muted-foreground">حالة التحقق</p>
                          <Badge variant={selectedOrg.is_verified ? 'default' : 'secondary'} className="mt-1">
                            {selectedOrg.is_verified ? 'موثقة' : 'قيد المراجعة'}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="p-4 space-y-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-medium">{selectedOrg.email}</span>
                          <Mail className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-medium" dir="ltr">{selectedOrg.phone}</span>
                          <Phone className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {selectedOrg.secondary_phone && (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-medium" dir="ltr">{selectedOrg.secondary_phone}</span>
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-medium">{selectedOrg.address}, {selectedOrg.city}</span>
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {selectedOrg.commercial_register && (
                          <div className="flex items-center gap-2 justify-end">
                            <span>السجل التجاري: {selectedOrg.commercial_register}</span>
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        {selectedOrg.environmental_license && (
                          <div className="flex items-center gap-2 justify-end">
                            <span>الترخيص البيئي: {selectedOrg.environmental_license}</span>
                            <Shield className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                          <span>تاريخ التسجيل: {format(new Date(selectedOrg.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{getShipmentCount(selectedOrg)}</p>
                          <p className="text-sm text-muted-foreground">شحنة</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{selectedOrg.profiles?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">مستخدم</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{selectedOrg.documents?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">وثيقة</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="users" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        {selectedOrg.profiles && selectedOrg.profiles.length > 0 ? (
                          <div className="space-y-3">
                            {selectedOrg.profiles.map((profile) => (
                              <div key={profile.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => openResetPasswordDialog(profile)}
                                  >
                                    <KeyRound className="w-4 h-4" />
                                    إعادة تعيين
                                  </Button>
                                  <Button
                                    variant={profile.is_active ? "destructive" : "default"}
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => handleToggleUser(profile)}
                                    disabled={isTogglingUser === profile.id}
                                  >
                                    {isTogglingUser === profile.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : profile.is_active ? (
                                      <UserX className="w-4 h-4" />
                                    ) : (
                                      <UserCheck className="w-4 h-4" />
                                    )}
                                    {profile.is_active ? 'تعطيل' : 'تفعيل'}
                                  </Button>
                                </div>
                                <div className="flex-1 text-right">
                                  <div className="flex items-center gap-2 justify-end">
                                    <Badge variant={profile.is_active ? 'default' : 'destructive'}>
                                      {profile.is_active ? 'نشط' : 'معطل'}
                                    </Badge>
                                    <p className="font-medium">{profile.full_name}</p>
                                  </div>
                                  <div className="flex items-center gap-4 justify-end mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      {profile.email}
                                      <Mail className="w-3 h-3" />
                                    </span>
                                    {profile.phone && (
                                      <span className="flex items-center gap-1" dir="ltr">
                                        {profile.phone}
                                        <Phone className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Avatar>
                                  <AvatarFallback>{profile.full_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>لا يوجد مستخدمين مسجلين</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        {selectedOrg.documents && selectedOrg.documents.length > 0 ? (
                          <div className="space-y-3">
                            {selectedOrg.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border">
                                <FileText className="w-8 h-8 text-primary" />
                                <div className="flex-1 text-right">
                                  <p className="font-medium">{doc.file_name}</p>
                                  <Badge variant="outline">{doc.document_type}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>لا توجد وثائق مرفوعة</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contacts" className="mt-4 space-y-4">
                    {selectedOrg.representative_name && (
                      <Card>
                        <CardHeader className="text-right pb-2">
                          <CardTitle className="text-base">الممثل القانوني</CardTitle>
                        </CardHeader>
                        <CardContent className="text-right space-y-2">
                          <p className="font-medium">{selectedOrg.representative_name}</p>
                          {selectedOrg.representative_email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2 justify-end">
                              {selectedOrg.representative_email}
                              <Mail className="w-4 h-4" />
                            </p>
                          )}
                          {selectedOrg.representative_phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2 justify-end" dir="ltr">
                              {selectedOrg.representative_phone}
                              <Phone className="w-4 h-4" />
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {selectedOrg.delegate_name && (
                      <Card>
                        <CardHeader className="text-right pb-2">
                          <CardTitle className="text-base">المفوض</CardTitle>
                        </CardHeader>
                        <CardContent className="text-right space-y-2">
                          <p className="font-medium">{selectedOrg.delegate_name}</p>
                          {selectedOrg.delegate_email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2 justify-end">
                              {selectedOrg.delegate_email}
                              <Mail className="w-4 h-4" />
                            </p>
                          )}
                          {selectedOrg.delegate_phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2 justify-end" dir="ltr">
                              {selectedOrg.delegate_phone}
                              <Phone className="w-4 h-4" />
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {!selectedOrg.representative_name && !selectedOrg.delegate_name && (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد جهات اتصال إضافية</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader className="text-right">
              <DialogTitle className="flex items-center gap-2 justify-end">
                إعادة تعيين كلمة المرور
                <Lock className="w-5 h-5" />
              </DialogTitle>
              <DialogDescription className="text-right">
                {selectedUser && (
                  <span>
                    إعادة تعيين كلمة المرور للمستخدم: <strong>{selectedUser.full_name}</strong>
                    <br />
                    <span className="text-xs">{selectedUser.email}</span>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-right block">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-right block">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-right"
                  dir="ltr"
                />
              </div>
              
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive text-right">كلمات المرور غير متطابقة</p>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialog(false)}
                disabled={isResettingPassword}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="gap-2"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التعيين...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    تعيين كلمة المرور
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminSystemOverview;
