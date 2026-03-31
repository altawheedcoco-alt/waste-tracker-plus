import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateExternalMission from '@/components/transporter/CreateExternalMission';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Users,
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Package,
  Loader2,
  UserCheck,
  UserX,
  Copy,
  Eye,
  EyeOff,
  Key,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

import DriverTypeBadge from '@/components/drivers/DriverTypeBadge';
import type { DriverType } from '@/types/driver-types';

interface Driver {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  license_expiry: string | null;
  is_available: boolean;
  created_at: string;
  driver_type: DriverType;
  rating: number;
  total_trips: number;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    user_id: string;
  } | null;
  activeShipments: number;
}

const TransporterDrivers = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addingDriver, setAddingDriver] = useState(false);
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Edit credentials state
  const [editDialog, setEditDialog] = useState<{ open: boolean; driver: Driver | null }>({ open: false, driver: null });
  const [editForm, setEditForm] = useState({ new_email: '', new_password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [newDriver, setNewDriver] = useState({
    full_name: '',
    email: '',
    phone: '',
    license_number: '',
    vehicle_type: '',
    vehicle_plate: '',
    license_expiry: '',
  });

  useEffect(() => {
    if (organization?.id) {
      fetchDrivers();
    }
  }, [organization?.id]);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          license_expiry,
          is_available,
          created_at,
          driver_type,
          rating,
          total_trips,
          profile:profiles(id, full_name, email, phone, user_id)
        `)
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Single batch query for active shipment counts instead of N+1
      const driverIds = (data || []).map(d => d.id);
      let shipmentCounts: Record<string, number> = {};
      if (driverIds.length > 0) {
        const { data: activeShipments } = await supabase
          .from('shipments')
          .select('driver_id')
          .in('driver_id', driverIds)
          .in('status', ['new', 'approved', 'collecting', 'in_transit']);
        
        (activeShipments || []).forEach(s => {
          if (s.driver_id) {
            shipmentCounts[s.driver_id] = (shipmentCounts[s.driver_id] || 0) + 1;
          }
        });
      }

      const driversWithShipments = (data || []).map(driver => ({
        ...driver,
        activeShipments: shipmentCounts[driver.id] || 0,
      })) as Driver[];

      setDrivers(driversWithShipments);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverAvailability = async (driverId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: !currentStatus })
        .eq('id', driverId);

      if (error) throw error;

      setDrivers(prev =>
        prev.map(d =>
          d.id === driverId ? { ...d, is_available: !currentStatus } : d
        )
      );

      toast.success(!currentStatus ? 'تم تفعيل السائق' : 'تم إيقاف السائق');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddDriver = async () => {
    if (!newDriver.full_name || !newDriver.license_number) {
      toast.error('يرجى ملء الاسم ورقم الرخصة على الأقل');
      return;
    }

    setAddingDriver(true);

    try {
      const response = await supabase.functions.invoke('register-driver', {
        body: {
          full_name: newDriver.full_name,
          phone: newDriver.phone,
          license_number: newDriver.license_number,
          vehicle_type: newDriver.vehicle_type,
          vehicle_plate: newDriver.vehicle_plate,
          license_expiry: newDriver.license_expiry || null,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      setAddDialogOpen(false);

      // Show credentials dialog
      if (response.data?.credentials) {
        setCredentialsDialog({
          open: true,
          email: response.data.credentials.email,
          password: response.data.credentials.password,
        });
      }

      setNewDriver({
        full_name: '',
        email: '',
        phone: '',
        license_number: '',
        vehicle_type: '',
        vehicle_plate: '',
        license_expiry: '',
      });
      fetchDrivers();
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة السائق');
    } finally {
      setAddingDriver(false);
    }
  };

  const generateStrongPassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=';
    const all = lower + upper + digits + special;
    let pwd = [
      lower[Math.floor(Math.random() * lower.length)],
      upper[Math.floor(Math.random() * upper.length)],
      digits[Math.floor(Math.random() * digits.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    for (let i = 0; i < 8; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
    pwd.sort(() => Math.random() - 0.5);
    return pwd.join('');
  };

  const validatePassword = (pwd: string) => {
    if (!/[a-z]/.test(pwd)) return 'يجب أن تحتوي على حرف صغير';
    if (!/[A-Z]/.test(pwd)) return 'يجب أن تحتوي على حرف كبير';
    if (!/[0-9]/.test(pwd)) return 'يجب أن تحتوي على رقم';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(pwd)) return 'يجب أن تحتوي على رمز خاص';
    if (pwd.length < 8) return 'يجب أن تكون 8 أحرف على الأقل';
    return null;
  };

  const handleEditCredentials = async () => {
    if (!editDialog.driver?.profile?.user_id) return;
    if (!editForm.new_email && !editForm.new_password) {
      toast.error('أدخل البريد الجديد أو كلمة المرور الجديدة');
      return;
    }
    if (editForm.new_password) {
      const pwdError = validatePassword(editForm.new_password);
      if (pwdError) {
        toast.error(pwdError);
        return;
      }
    }

    setEditLoading(true);
    try {
      const response = await supabase.functions.invoke('update-driver-credentials', {
        body: {
          target_user_id: editDialog.driver.profile.user_id,
          new_email: editForm.new_email || undefined,
          new_password: editForm.new_password || undefined,
          mode: 'admin',
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('تم تحديث بيانات الدخول بنجاح');
      setEditDialog({ open: false, driver: null });
      setEditForm({ new_email: '', new_password: '' });
      fetchDrivers();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.is_available).length,
    busy: drivers.filter(d => d.activeShipments > 0).length,
  };

  return (
    <DashboardLayout>
    <div className="space-y-4 sm:space-y-6">
      <BackButton />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">إدارة السائقين</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">عرض وإدارة سائقي الشركة</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {organization?.id && (
            <CreateExternalMission organizationId={organization.id} />
          )}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="eco" size="sm" className="flex-1 sm:flex-none">
                <Plus className="ml-2 h-4 w-4" />
                إضافة سائق تابع
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة سائق جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات السائق - سيتم إنشاء بيانات الدخول تلقائياً
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  💡 سيتم توليد بريد إلكتروني وكلمة مرور تلقائياً للسائق وستظهر لك بعد الإنشاء مباشرة
                </p>
              </div>
              <div>
                <Label>الاسم الكامل *</Label>
                <Input
                  value={newDriver.full_name}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="اسم السائق"
                />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <div>
                <Label>رقم الرخصة *</Label>
                <Input
                  value={newDriver.license_number}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="رقم رخصة القيادة"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع المركبة</Label>
                  <Input
                    value={newDriver.vehicle_type}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_type: e.target.value }))}
                    placeholder="شاحنة، بيك أب..."
                  />
                </div>
                <div>
                  <Label>رقم اللوحة</Label>
                  <Input
                    value={newDriver.vehicle_plate}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                    placeholder="أ ب ج 1234"
                  />
                </div>
              </div>
              <div>
                <Label>تاريخ انتهاء الرخصة</Label>
                <Input
                  type="date"
                  value={newDriver.license_expiry}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, license_expiry: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button variant="eco" onClick={handleAddDriver} disabled={addingDriver}>
                  {addingDriver ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    'إضافة السائق'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Credentials Dialog - shown after successful creation */}
      <Dialog open={!!credentialsDialog?.open} onOpenChange={(open) => !open && setCredentialsDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              تم تسجيل السائق بنجاح!
            </DialogTitle>
            <DialogDescription>
              احفظ بيانات الدخول التالية - يمكن للسائق تغييرها بعد تسجيل الدخول
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 rounded bg-background border text-sm font-mono break-all" dir="ltr">
                    {credentialsDialog?.email}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(credentialsDialog?.email || '', 'email')}
                  >
                    {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">كلمة المرور</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 rounded bg-background border text-sm font-mono" dir="ltr">
                    {showPassword ? credentialsDialog?.password : '••••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(credentialsDialog?.password || '', 'password')}
                  >
                    {copiedField === 'password' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ احفظ هذه البيانات الآن - يمكنك تغييرها لاحقاً من صفحة إدارة السائقين، ويمكن للسائق تغييرها بنفسه بعد تسجيل الدخول.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                setCredentialsDialog(null);
                setShowPassword(false);
              }}
            >
              تم، إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Credentials Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => { if (!open) { setEditDialog({ open: false, driver: null }); setEditForm({ new_email: '', new_password: '' }); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              تعديل بيانات الدخول
            </DialogTitle>
            <DialogDescription>
              تعديل بيانات دخول السائق: {editDialog.driver?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>البريد الإلكتروني الحالي</Label>
              <code className="block p-2 rounded bg-muted border text-sm font-mono mt-1 break-all" dir="ltr">
                {editDialog.driver?.profile?.email}
              </code>
            </div>
            <div>
              <Label>البريد الإلكتروني الجديد (اختياري)</Label>
              <Input
                value={editForm.new_email}
                onChange={(e) => setEditForm(prev => ({ ...prev, new_email: e.target.value }))}
                placeholder="ادخل البريد الجديد"
                type="email"
                dir="ltr"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>كلمة المرور الجديدة (اختياري)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    const pwd = generateStrongPassword();
                    setEditForm(prev => ({ ...prev, new_password: pwd }));
                    setShowEditPassword(true);
                  }}
                >
                  توليد كلمة مرور قوية
                </Button>
              </div>
              <div className="relative">
                <Input
                  value={editForm.new_password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, new_password: e.target.value }))}
                  placeholder="ادخل كلمة المرور الجديدة"
                  type={showEditPassword ? 'text' : 'password'}
                  dir="ltr"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {editForm.new_password && validatePassword(editForm.new_password) && (
                <p className="text-xs text-destructive mt-1">{validatePassword(editForm.new_password)}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialog({ open: false, driver: null })}>
                إلغاء
              </Button>
              <Button variant="eco" onClick={handleEditCredentials} disabled={editLoading}>
                {editLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">إجمالي السائقين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{stats.available}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">متاحين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold">{stats.busy}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">في مهمة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الرخصة أو رقم اللوحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            جاري التحميل...
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا يوجد سائقين</p>
          </div>
        ) : (
          filteredDrivers.map((driver, index) => (
            <motion.div
              key={driver.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-eco-emerald flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {driver.profile?.full_name?.charAt(0) || '؟'}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-lg truncate">{driver.profile?.full_name || 'غير معروف'}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-[10px] sm:text-sm">
                          <Truck className="w-3 h-3 shrink-0" />
                          <span className="truncate">{driver.vehicle_type || 'غير محدد'} - {driver.vehicle_plate || 'بدون لوحة'}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={driver.is_available}
                        onCheckedChange={() => toggleDriverAvailability(driver.id, driver.is_available)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-6 pt-0 sm:pt-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={driver.is_available ? 'default' : 'secondary'}>
                        {driver.is_available ? 'متاح' : 'غير متاح'}
                      </Badge>
                      <DriverTypeBadge type={driver.driver_type || 'company'} />
                    </div>
                    {driver.activeShipments > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {driver.activeShipments} شحنات نشطة
                      </Badge>
                    )}
                  </div>
                  {/* Rating & Trips */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>⭐ {(driver.rating || 5).toFixed(1)}</span>
                    <span>🚛 {driver.total_trips || 0} رحلة</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate" dir="ltr">{driver.profile?.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{driver.profile?.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        انتهاء الرخصة:{' '}
                        {driver.license_expiry
                          ? format(new Date(driver.license_expiry), 'dd/MM/yyyy')
                          : 'غير محدد'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/dashboard/drivers/${driver.id}`)}
                    >
                      <MapPin className="ml-2 h-4 w-4" />
                      التفاصيل
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title="تعديل بيانات الدخول"
                      onClick={() => {
                        setEditDialog({ open: true, driver });
                        setEditForm({ new_email: '', new_password: '' });
                      }}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default TransporterDrivers;
