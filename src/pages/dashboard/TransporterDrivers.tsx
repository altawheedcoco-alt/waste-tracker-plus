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
          profile:profiles(id, full_name, email, phone)
        `)
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch active shipments count for each driver
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

      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Store the credentials locally for the team credentials page
      if (response.data?.credentials) {
        const { storeCredentials } = await import('./TeamCredentials');
        storeCredentials(response.data.credentials.email, response.data.credentials.password);
        
        toast.success(
          <div className="space-y-2">
            <p className="font-bold">تم تسجيل السائق بنجاح!</p>
            <p className="text-sm">بيانات الدخول:</p>
            <p className="text-xs font-mono bg-muted p-2 rounded">
              البريد: {response.data.credentials.email}<br/>
              كلمة المرور: {response.data.credentials.password}
            </p>
            <p className="text-xs text-muted-foreground">
              يمكنك عرض البيانات لاحقاً من صفحة "بيانات الفريق"
            </p>
          </div>,
          { duration: 15000 }
        );
      }

      setAddDialogOpen(false);
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
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة السائقين</h1>
          <p className="text-muted-foreground">عرض وإدارة سائقي الشركة</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="eco">
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
                  💡 سيتم توليد بريد إلكتروني وكلمة مرور تلقائياً للسائق، ويمكنك عرضها لاحقاً من صفحة "بيانات الفريق"
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
                  placeholder="05xxxxxxxx"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.available}</p>
              <p className="text-sm text-muted-foreground">متاحين</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Truck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.busy}</p>
              <p className="text-sm text-muted-foreground">في مهمة</p>
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
                      <span>{driver.profile?.email || '-'}</span>
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

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/drivers/${driver.id}`)}
                  >
                    <MapPin className="ml-2 h-4 w-4" />
                    عرض التفاصيل والموقع
                  </Button>
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
