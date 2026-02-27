import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  User,
  Truck,
  Building2,
  Mail,
  Key,
  Phone,
  Save,
  Loader2,
  Shield,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  is_verified: boolean;
}

interface DriverSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  onUpdate?: () => void;
}

const DriverSettingsDialog = ({
  open,
  onOpenChange,
  driverId,
  onUpdate,
}: DriverSettingsDialogProps) => {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Profile data
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Driver/Vehicle data
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');

  // Organization data
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);

  // Credentials
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (open && driverId) {
      fetchDriverData();
      fetchAvailableOrganizations();
    }
  }, [open, driverId]);

  const fetchDriverData = async () => {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          license_expiry,
          organization_id,
          profile:profiles!drivers_profile_id_fkey(
            full_name,
            phone,
            email
          )
        `)
        .eq('id', driverId)
        .single();

      if (error) throw error;

      if (driver) {
        setLicenseNumber(driver.license_number || '');
        setVehicleType(driver.vehicle_type || '');
        setVehiclePlate(driver.vehicle_plate || '');
        setLicenseExpiry(driver.license_expiry || '');
        setCurrentOrgId(driver.organization_id);
        setSelectedOrgId(driver.organization_id || '');

        if (driver.profile) {
          const p = driver.profile as { full_name: string; phone: string | null; email: string };
          setFullName(p.full_name || '');
          setPhone(p.phone || '');
        }
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOrganizations = async () => {
    try {
      // Fetch transporter organizations that the driver can join
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type, is_verified')
        .eq('organization_type', 'transporter')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableOrgs(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'خطأ',
        description: 'الاسم مطلوب',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات الملف الشخصي' });
      refreshProfile();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!licenseNumber.trim()) {
      toast({
        title: 'خطأ',
        description: 'رقم الرخصة مطلوب',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          license_number: licenseNumber.trim(),
          vehicle_type: vehicleType.trim() || null,
          vehicle_plate: vehiclePlate.trim() || null,
          license_expiry: licenseExpiry || null,
        })
        .eq('id', driverId);

      if (error) throw error;

      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات المركبة' });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!selectedOrgId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار جهة',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Update driver's organization
      const { error: driverError } = await supabase
        .from('drivers')
        .update({ organization_id: selectedOrgId })
        .eq('id', driverId);

      if (driverError) throw driverError;

      // Update profile's organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: selectedOrgId,
          active_organization_id: selectedOrgId 
        })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      // Add/Update user_organizations entry for proper system linkage
      if (user?.id) {
        // First check if entry exists
        const { data: existingEntry } = await supabase
          .from('user_organizations')
          .select('id')
          .eq('user_id', user.id)
          .eq('organization_id', selectedOrgId)
          .maybeSingle();

        if (!existingEntry) {
          // Remove old organization entries for this user (driver can only belong to one org)
          await supabase
            .from('user_organizations')
            .delete()
            .eq('user_id', user.id);

          // Insert new entry
          const { error: userOrgError } = await supabase
            .from('user_organizations')
            .insert({
              user_id: user.id,
              organization_id: selectedOrgId,
              role_in_organization: 'driver',
              is_primary: true,
              is_active: true,
            });

          if (userOrgError) {
            console.error('Error linking user to organization:', userOrgError);
          }
        }
      }

      setCurrentOrgId(selectedOrgId);
      toast({ title: 'تم الحفظ', description: 'تم ربط السائق بالجهة بنجاح' });
      refreshProfile();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!newEmail && !newPassword) {
      toast({
        title: 'خطأ',
        description: 'أدخل البريد أو كلمة المرور الجديدة',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (newEmail && newEmail !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: newEmail,
        });
        if (emailError) throw emailError;

        await supabase
          .from('profiles')
          .update({ email: newEmail })
          .eq('user_id', user?.id);
      }

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passwordError) throw passwordError;
      }

      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات الدخول' });
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
      refreshProfile();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث بيانات الدخول',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getOrgTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generator: 'مولدة',
      transporter: 'ناقلة',
      recycler: 'مدورة',
    };
    return labels[type] || type;
  };

  const vehicleTypes = [
    { value: 'truck', label: 'شاحنة' },
    { value: 'van', label: 'فان' },
    { value: 'pickup', label: 'بيك أب' },
    { value: 'tanker', label: 'صهريج' },
    { value: 'other', label: 'أخرى' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] rounded-2xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>إعدادات السائق</span>
            <Settings className="h-5 w-5 text-primary" />
          </DialogTitle>
          <DialogDescription>
            تحديث بياناتك الشخصية وبيانات المركبة والجهة التابع لها
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="text-xs sm:text-sm">
                <User className="w-4 h-4 sm:ml-1" />
                <span className="hidden sm:inline">الملف</span>
              </TabsTrigger>
              <TabsTrigger value="vehicle" className="text-xs sm:text-sm">
                <Truck className="w-4 h-4 sm:ml-1" />
                <span className="hidden sm:inline">المركبة</span>
              </TabsTrigger>
              <TabsTrigger value="organization" className="text-xs sm:text-sm">
                <Building2 className="w-4 h-4 sm:ml-1" />
                <span className="hidden sm:inline">الجهة</span>
              </TabsTrigger>
              <TabsTrigger value="credentials" className="text-xs sm:text-sm">
                <Key className="w-4 h-4 sm:ml-1" />
                <span className="hidden sm:inline">الدخول</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 justify-end">
                <div className="text-right">
                  <p className="font-medium">{profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <Avatar className="h-14 w-14">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">الاسم الكامل *</Label>
                <div className="relative">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="text-right pr-10"
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">رقم الهاتف</Label>
                <div className="relative">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    className="text-right pr-10"
                    dir="ltr"
                  />
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving} 
                className="w-full gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ بيانات الملف
              </Button>
            </TabsContent>

            {/* Vehicle Tab */}
            <TabsContent value="vehicle" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-right block">رقم الرخصة *</Label>
                <div className="relative">
                  <Input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="رقم رخصة القيادة"
                    className="text-right pr-10"
                  />
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">نوع المركبة</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="text-right">
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

              <div className="space-y-2">
                <Label className="text-right block">رقم لوحة المركبة</Label>
                <div className="relative">
                  <Input
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="رقم اللوحة"
                    className="text-right pr-10"
                  />
                  <Truck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">تاريخ انتهاء الرخصة</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="text-right pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <Button 
                onClick={handleSaveVehicle} 
                disabled={saving} 
                className="w-full gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ بيانات المركبة
              </Button>
            </TabsContent>

            {/* Organization Tab */}
            <TabsContent value="organization" className="space-y-4 mt-4">
              {currentOrgId && (
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2 text-right">الجهة الحالية:</p>
                  <div className="flex items-center gap-2 justify-end">
                    <Badge variant="secondary">
                      {availableOrgs.find(o => o.id === currentOrgId)?.name || 'غير معروفة'}
                    </Badge>
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-right block">اختر الجهة الناقلة</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر الجهة التابع لها" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          {org.is_verified && <CheckCircle2 className="w-4 h-4 text-primary" />}
                          <span>{org.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getOrgTypeLabel(org.organization_type)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground text-right">
                  اختيار الجهة يحدد الشحنات التي ستتلقاها وترسلها
                </p>
              </div>

              <Button 
                onClick={handleSaveOrganization} 
                disabled={saving || !selectedOrgId || selectedOrgId === currentOrgId} 
                className="w-full gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                تحديث الجهة
              </Button>
            </TabsContent>

            {/* Credentials Tab */}
            <TabsContent value="credentials" className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground text-right">
                  البريد الحالي: <span className="font-mono" dir="ltr">{user?.email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">البريد الإلكتروني الجديد</Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="البريد الجديد (اختياري)"
                    className="text-right pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة (اختياري)"
                    className="text-right pr-10"
                  />
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label className="text-right block">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تأكيد كلمة المرور"
                      className="text-right pr-10"
                    />
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              )}

              <Button 
                onClick={handleSaveCredentials} 
                disabled={saving || (!newEmail && !newPassword)} 
                className="w-full gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ بيانات الدخول
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DriverSettingsDialog;
