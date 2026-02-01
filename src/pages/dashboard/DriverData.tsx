import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Shield, 
  Calendar, 
  Save, 
  Loader2,
  CreditCard,
  Car,
  FileCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Activity,
} from 'lucide-react';
import ResponsivePageContainer from '@/components/dashboard/ResponsivePageContainer';
import { motion } from 'framer-motion';
import { format, differenceInDays, isPast } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DriverInfo {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  license_expiry: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  organization: {
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string;
  } | null;
}

interface DriverStats {
  totalShipments: number;
  activeShipments: number;
  completedShipments: number;
  lastLocationUpdate: string | null;
}

const vehicleTypes = [
  { value: 'pickup', label: 'بيك أب' },
  { value: 'truck_small', label: 'شاحنة صغيرة' },
  { value: 'truck_medium', label: 'شاحنة متوسطة' },
  { value: 'truck_large', label: 'شاحنة كبيرة' },
  { value: 'tanker', label: 'صهريج' },
  { value: 'container', label: 'حاوية' },
  { value: 'refrigerated', label: 'مبردة' },
  { value: 'flatbed', label: 'مسطحة' },
  { value: 'van', label: 'فان' },
  { value: 'other', label: 'أخرى' },
];

const DriverData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [stats, setStats] = useState<DriverStats>({
    totalShipments: 0,
    activeShipments: 0,
    completedShipments: 0,
    lastLocationUpdate: null,
  });
  const [formData, setFormData] = useState({
    license_number: '',
    vehicle_type: '',
    vehicle_plate: '',
    license_expiry: '',
    is_available: true,
  });

  useEffect(() => {
    if (profile?.id) {
      fetchDriverData();
    }
  }, [profile?.id]);

  const fetchDriverData = async () => {
    try {
      // Fetch driver info
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          license_expiry,
          is_available,
          created_at,
          updated_at,
          organization:organizations(id, name, phone, address, city)
        `)
        .eq('profile_id', profile?.id)
        .single();

      if (driverError) throw driverError;

      if (driver) {
        setDriverInfo(driver as unknown as DriverInfo);
        setFormData({
          license_number: driver.license_number || '',
          vehicle_type: driver.vehicle_type || '',
          vehicle_plate: driver.vehicle_plate || '',
          license_expiry: driver.license_expiry || '',
          is_available: driver.is_available ?? true,
        });

        // Fetch shipment stats
        const { data: shipments } = await supabase
          .from('shipments')
          .select('id, status')
          .eq('driver_id', driver.id);

        const activeStatuses = ['new', 'approved', 'collecting', 'in_transit'];
        const completedStatuses = ['delivered', 'confirmed'];

        // Fetch last location update
        const { data: lastLocation } = await supabase
          .from('driver_location_logs')
          .select('recorded_at')
          .eq('driver_id', driver.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single();

        setStats({
          totalShipments: shipments?.length || 0,
          activeShipments: shipments?.filter(s => activeStatuses.includes(s.status)).length || 0,
          completedShipments: shipments?.filter(s => completedStatuses.includes(s.status)).length || 0,
          lastLocationUpdate: lastLocation?.recorded_at || null,
        });
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!driverInfo?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          license_number: formData.license_number,
          vehicle_type: formData.vehicle_type,
          vehicle_plate: formData.vehicle_plate,
          license_expiry: formData.license_expiry || null,
          is_available: formData.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driverInfo.id);

      if (error) throw error;

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث بيانات السائق',
      });

      fetchDriverData();
    } catch (error: any) {
      console.error('Error saving driver data:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error.message || 'فشل في حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getLicenseStatus = () => {
    if (!formData.license_expiry) return { status: 'unknown', label: 'غير محدد', color: 'secondary' };
    
    const expiryDate = new Date(formData.license_expiry);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());

    if (isPast(expiryDate)) {
      return { status: 'expired', label: 'منتهية', color: 'destructive' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `تنتهي خلال ${daysUntilExpiry} يوم`, color: 'warning' };
    } else {
      return { status: 'valid', label: 'سارية', color: 'success' };
    }
  };

  const licenseStatus = getLicenseStatus();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ResponsivePageContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">بيانات السائق</h1>
              <p className="text-muted-foreground">معلومات الرخصة والمركبة والإحصائيات</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={formData.is_available ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {formData.is_available ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {formData.is_available ? 'متاح للعمل' : 'غير متاح'}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalShipments}</p>
                    <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeShipments}</p>
                    <p className="text-sm text-muted-foreground">شحنات نشطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completedShipments}</p>
                    <p className="text-sm text-muted-foreground">شحنات مكتملة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <MapPin className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">آخر تحديث للموقع</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.lastLocationUpdate 
                        ? format(new Date(stats.lastLocationUpdate), 'dd MMM yyyy - HH:mm', { locale: ar })
                        : 'لا يوجد'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                بيانات رخصة القيادة
              </CardTitle>
              <CardDescription>
                معلومات رخصة القيادة وحالتها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* License Number */}
                <div className="space-y-2">
                  <Label htmlFor="license_number" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    رقم الرخصة
                  </Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    placeholder="أدخل رقم رخصة القيادة"
                    dir="ltr"
                    className="text-left"
                  />
                </div>

                {/* License Expiry */}
                <div className="space-y-2">
                  <Label htmlFor="license_expiry" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    تاريخ انتهاء الرخصة
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="license_expiry"
                      type="date"
                      value={formData.license_expiry}
                      onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                      className="flex-1"
                    />
                    <Badge 
                      variant={
                        licenseStatus.color === 'success' ? 'default' :
                        licenseStatus.color === 'warning' ? 'secondary' :
                        licenseStatus.color === 'destructive' ? 'destructive' : 'outline'
                      }
                      className="whitespace-nowrap"
                    >
                      {licenseStatus.status === 'expired' && <AlertTriangle className="h-3 w-3 ml-1" />}
                      {licenseStatus.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                بيانات المركبة
              </CardTitle>
              <CardDescription>
                معلومات المركبة المستخدمة في النقل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Vehicle Type */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type" className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    نوع المركبة
                  </Label>
                  <Select 
                    value={formData.vehicle_type} 
                    onValueChange={(value) => handleInputChange('vehicle_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المركبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Plate */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle_plate" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    رقم لوحة المركبة
                  </Label>
                  <Input
                    id="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={(e) => handleInputChange('vehicle_plate', e.target.value)}
                    placeholder="مثال: أ ب ج 1234"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>

              <Separator />

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="is_available" className="text-base font-medium">
                    حالة التوفر للعمل
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    عند تفعيل هذا الخيار، ستظهر كسائق متاح لاستلام شحنات جديدة
                  </p>
                </div>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Organization Info */}
          {driverInfo?.organization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  الجهة المنتسب إليها
                </CardTitle>
                <CardDescription>
                  معلومات شركة النقل التي تعمل معها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">اسم الجهة</p>
                      <p className="text-sm text-muted-foreground">{driverInfo.organization.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">المدينة</p>
                      <p className="text-sm text-muted-foreground">{driverInfo.organization.city}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">العنوان</p>
                      <p className="text-sm text-muted-foreground">{driverInfo.organization.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registration Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                معلومات التسجيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">تاريخ التسجيل</p>
                    <p className="text-sm text-muted-foreground">
                      {driverInfo?.created_at 
                        ? format(new Date(driverInfo.created_at), 'dd MMMM yyyy', { locale: ar })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">آخر تحديث للبيانات</p>
                    <p className="text-sm text-muted-foreground">
                      {driverInfo?.updated_at 
                        ? format(new Date(driverInfo.updated_at), 'dd MMMM yyyy - HH:mm', { locale: ar })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ جميع التغييرات
            </Button>
          </div>
        </motion.div>
      </ResponsivePageContainer>
    </DashboardLayout>
  );
};

export default DriverData;
