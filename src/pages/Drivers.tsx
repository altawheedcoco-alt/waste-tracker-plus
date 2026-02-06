import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Edit,
  Eye,
} from 'lucide-react';
import { z } from 'zod';

interface Driver {
  id: string;
  license_number: string;
  license_expiry: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  active_shipments?: number;
}

const driverSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  licenseNumber: z.string().min(5, 'رقم الرخصة مطلوب'),
  licenseExpiry: z.string().optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
});

const Drivers = () => {
  const { user, organization, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: '',
    vehiclePlate: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (organization?.id && organization.organization_type === 'transporter') {
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
          license_expiry,
          vehicle_type,
          vehicle_plate,
          is_available,
          created_at,
          profile:profiles!drivers_profile_id_fkey(
            id,
            full_name,
            email,
            phone,
            avatar_url
          )
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
            .in('status', ['new', 'approved', 'in_transit']);

          return {
            ...driver,
            profile: driver.profile as Driver['profile'],
            active_shipments: count || 0,
          };
        })
      );

      setDrivers(driversWithShipments);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات السائقين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddDriver = async () => {
    try {
      driverSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Create auth user for driver
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            organization_id: organization?.id,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            organization_id: organization?.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // 3. Create driver record
        const { error: driverError } = await supabase
          .from('drivers')
          .insert({
            profile_id: profileData.id,
            organization_id: organization?.id,
            license_number: formData.licenseNumber,
            license_expiry: formData.licenseExpiry || null,
            vehicle_type: formData.vehicleType || null,
            vehicle_plate: formData.vehiclePlate || null,
          });

        if (driverError) throw driverError;

        // 4. Assign driver role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'driver',
          });

        if (roleError) throw roleError;

        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة السائق بنجاح',
        });

        setIsDialogOpen(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          licenseNumber: '',
          licenseExpiry: '',
          vehicleType: '',
          vehiclePlate: '',
        });
        fetchDrivers();
      }
    } catch (error: any) {
      console.error('Error adding driver:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إضافة السائق',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDriverAvailability = async (driverId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: !currentStatus })
        .eq('id', driverId);

      if (error) throw error;

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId ? { ...d, is_available: !currentStatus } : d
        )
      );

      toast({
        title: 'تم التحديث',
        description: `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} السائق`,
      });
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة السائق',
        variant: 'destructive',
      });
    }
  };

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (organization?.organization_type !== 'transporter') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground">
                صفحة إدارة السائقين متاحة فقط لشركات الجمع والنقل
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              إدارة السائقين
            </h1>
            <p className="text-muted-foreground">
              {drivers.length} سائق مسجل في {organization?.name}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="eco">
                <Plus className="ml-2 h-4 w-4" />
                إضافة سائق جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة سائق جديد</DialogTitle>
                <DialogDescription>
                  أدخل بيانات السائق الجديد لإضافته إلى فريق العمل
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل *</Label>
                    <Input
                      placeholder="أحمد محمد"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف *</Label>
                    <Input
                      placeholder="01234567890"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={errors.phone ? 'border-destructive' : ''}
                      dir="ltr"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    placeholder="driver@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>كلمة المرور *</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={errors.password ? 'border-destructive' : ''}
                    dir="ltr"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">بيانات الرخصة والمركبة</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الرخصة *</Label>
                      <Input
                        placeholder="DL-123456"
                        value={formData.licenseNumber}
                        onChange={(e) => handleChange('licenseNumber', e.target.value)}
                        className={errors.licenseNumber ? 'border-destructive' : ''}
                        dir="ltr"
                      />
                      {errors.licenseNumber && (
                        <p className="text-sm text-destructive">{errors.licenseNumber}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ انتهاء الرخصة</Label>
                      <Input
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المركبة</Label>
                    <Input
                      placeholder="شاحنة صغيرة"
                      value={formData.vehicleType}
                      onChange={(e) => handleChange('vehicleType', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم اللوحة</Label>
                    <Input
                      placeholder="أ ب ج 1234"
                      value={formData.vehiclePlate}
                      onChange={(e) => handleChange('vehiclePlate', e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  variant="eco"
                  className="w-full"
                  onClick={handleAddDriver}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    <>
                      <Plus className="ml-2 h-4 w-4" />
                      إضافة السائق
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، البريد، رقم الرخصة أو اللوحة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Drivers list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'لا توجد نتائج' : 'لا يوجد سائقون مسجلون'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'جرب البحث بكلمات مختلفة'
                  : 'أضف سائقين لبدء إدارة فريق العمل'}
              </p>
              {!searchQuery && (
                <Button variant="eco" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة أول سائق
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredDrivers.map((driver, index) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {driver.profile.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {driver.profile.full_name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {driver.license_number}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={driver.is_available ? 'default' : 'secondary'}
                          className={
                            driver.is_available
                              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              : ''
                          }
                        >
                          {driver.is_available ? 'متاح' : 'غير متاح'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span dir="ltr">{driver.profile.phone || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{driver.vehicle_plate || '-'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate" dir="ltr">
                          {driver.profile.email}
                        </span>
                      </div>

                      {driver.license_expiry && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            انتهاء الرخصة:{' '}
                            {new Date(driver.license_expiry).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">
                            {driver.active_shipments} رحلة نشطة
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/dashboard/drivers/${driver.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              toggleDriverAvailability(driver.id, driver.is_available)
                            }
                          >
                            {driver.is_available ? (
                              <XCircle className="w-4 h-4 text-destructive" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Drivers;
