import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Driver {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  license_expiry: string | null;
  is_available: boolean;
  created_at: string;
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
          profile:profiles(id, full_name, email, phone, user_id)
        `)
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const driversWithShipments = await Promise.all(
        (data || []).map(async (driver) => {
          const { count } = await supabase
            .from('shipments')
            .select('id', { count: 'exact', head: true })
            .eq('driver_id', driver.id)
            .in('status', ['new', 'approved', 'collecting', 'in_transit']);

          return {
            ...driver,
            activeShipments: count || 0,
          } as Driver;
        })
      );

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

  const handleEditCredentials = async () => {
    if (!editDialog.driver?.profile?.user_id) return;
    if (!editForm.new_email && !editForm.new_password) {
      toast.error('أدخل البريد الجديد أو كلمة المرور الجديدة');
      return;
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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="eco" size="sm" className="w-full sm:w-auto">
              <Plus className="ml-2 h-4 w-4" />
              إضافة سائق
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
              <Label>كلمة المرور الجديدة (اختياري)</Label>
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
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-eco-emerald flex items-center justify-center text-white font-bold">
                        {driver.profile?.full_name?.charAt(0) || '؟'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{driver.profile?.full_name || 'غير معروف'}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {driver.vehicle_type || 'غير محدد'} - {driver.vehicle_plate || 'بدون لوحة'}
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
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={driver.is_available ? 'default' : 'secondary'}>
                      {driver.is_available ? 'متاح' : 'غير متاح'}
                    </Badge>
                    {driver.activeShipments > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {driver.activeShipments} شحنات نشطة
                      </Badge>
                    )}
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
