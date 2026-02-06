import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Share2,
  Settings2,
  Building2,
  Lock,
  Unlock,
  Pin,
  PinOff,
  BarChart3,
  Clock,
  StickyNote,
  User,
  Car,
  Phone,
  CreditCard,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Driver {
  id: string;
  profile_id: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  license_number: string | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
  };
}

interface DriverLink {
  id: string;
  organization_id: string;
  driver_id: string | null;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  preset_driver_name: string | null;
  preset_phone: string | null;
  preset_vehicle_type: string | null;
  preset_plate_number: string | null;
  preset_license_number: string | null;
  preset_notes: string | null;
  allow_name_edit: boolean;
  allow_phone_edit: boolean;
  allow_vehicle_edit: boolean;
  is_for_registration: boolean;
  is_pinned: boolean;
  usage_count: number;
  last_used_at: string | null;
  notes: string | null;
}

const vehicleTypes = [
  { value: 'pickup', label: 'بيك أب' },
  { value: 'truck', label: 'شاحنة' },
  { value: 'van', label: 'فان' },
  { value: 'trailer', label: 'مقطورة' },
  { value: 'tanker', label: 'صهريج' },
  { value: 'other', label: 'أخرى' },
];

const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const DriverLinksManager = () => {
  const { profile } = useAuth();
  const [links, setLinks] = useState<DriverLink[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [isForRegistration, setIsForRegistration] = useState(true);

  // Preset fields
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [presetDriverName, setPresetDriverName] = useState('');
  const [presetPhone, setPresetPhone] = useState('');
  const [presetVehicleType, setPresetVehicleType] = useState('');
  const [presetPlateNumber, setPresetPlateNumber] = useState('');
  const [presetLicenseNumber, setPresetLicenseNumber] = useState('');
  const [presetNotes, setPresetNotes] = useState('');
  const [allowNameEdit, setAllowNameEdit] = useState(true);
  const [allowPhoneEdit, setAllowPhoneEdit] = useState(true);
  const [allowVehicleEdit, setAllowVehicleEdit] = useState(true);

  const loadLinks = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('driver_quick_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data } = await supabase
        .from('drivers')
        .select('id, profile_id, vehicle_type, vehicle_plate, license_number, profiles(full_name, phone)')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      setDrivers((data || []) as Driver[]);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  useEffect(() => {
    loadLinks();
    loadDrivers();
  }, [profile?.organization_id]);

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setHasExpiry(false);
    setExpiryDate('');
    setIsForRegistration(true);
    setSelectedDriverId('');
    setPresetDriverName('');
    setPresetPhone('');
    setPresetVehicleType('');
    setPresetPlateNumber('');
    setPresetLicenseNumber('');
    setPresetNotes('');
    setAllowNameEdit(true);
    setAllowPhoneEdit(true);
    setAllowVehicleEdit(true);
  };

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      const profile = Array.isArray(driver.profiles) ? driver.profiles[0] : driver.profiles;
      setPresetDriverName(profile?.full_name || '');
      setPresetPhone(profile?.phone || '');
      setPresetVehicleType(driver.vehicle_type || '');
      setPresetPlateNumber(driver.vehicle_plate || '');
      setIsForRegistration(false);
    }
  };

  const createLink = async () => {
    if (!profile?.organization_id) return;

    setCreating(true);
    try {
      const token = generateToken();

      const insertData = {
        organization_id: profile.organization_id,
        driver_id: selectedDriverId || null,
        token,
        title: newTitle || (isForRegistration ? 'رابط تسجيل سائق جديد' : 'رابط تحديث بيانات سائق'),
        description: newDescription || null,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : null,
        created_by: profile.id,
        preset_driver_name: presetDriverName || null,
        preset_phone: presetPhone || null,
        preset_vehicle_type: presetVehicleType || null,
        preset_plate_number: presetPlateNumber || null,
        preset_license_number: presetLicenseNumber || null,
        preset_notes: presetNotes || null,
        allow_name_edit: allowNameEdit,
        allow_phone_edit: allowPhoneEdit,
        allow_vehicle_edit: allowVehicleEdit,
        is_for_registration: isForRegistration,
      };

      const { error } = await supabase
        .from('driver_quick_links')
        .insert(insertData);

      if (error) throw error;

      toast.success('✅ تم إنشاء الرابط بنجاح');
      setDialogOpen(false);
      resetForm();
      loadLinks();
    } catch (error) {
      console.error('Error creating link:', error);
      toast.error('فشل في إنشاء الرابط');
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (linkId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('driver_quick_links')
        .update({ is_active: !isActive })
        .eq('id', linkId);

      if (error) throw error;

      loadLinks();
      toast.success(isActive ? 'تم إيقاف الرابط' : 'تم تفعيل الرابط');
    } catch (error) {
      console.error('Error toggling link:', error);
      toast.error('فشل في تحديث الرابط');
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;

    try {
      const { error } = await supabase
        .from('driver_quick_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      loadLinks();
      toast.success('تم حذف الرابط');
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('فشل في حذف الرابط');
    }
  };

  const togglePin = async (linkId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('driver_quick_links')
        .update({ is_pinned: !isPinned })
        .eq('id', linkId);

      if (error) throw error;

      loadLinks();
      toast.success(isPinned ? 'تم إلغاء التثبيت' : 'تم تثبيت الرابط');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('فشل في تحديث الرابط');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/driver/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ الرابط');
  };

  const shareLink = async (link: DriverLink) => {
    const url = `${window.location.origin}/driver/${link.token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title || 'رابط سائق سريع',
          text: link.description || 'سجل بياناتك كسائق بسهولة',
          url,
        });
      } catch (error) {
        copyLink(link.token);
      }
    } else {
      copyLink(link.token);
    }
  };

  const getDriverName = (link: DriverLink) => {
    if (link.driver_id) {
      const driver = drivers.find(d => d.id === link.driver_id);
      const profile = Array.isArray(driver?.profiles) ? driver.profiles[0] : driver?.profiles;
      return profile?.full_name || 'سائق محدد';
    }
    return link.preset_driver_name || null;
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!profile?.organization_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لا يوجد جهة مرتبطة</h3>
            <p className="text-muted-foreground">
              هذه الميزة متاحة فقط للشركات المسجلة.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              روابط السائقين السريعة
            </CardTitle>
            <CardDescription>
              أنشئ روابط مخصصة لتسجيل السائقين الجدد أو تحديث بيانات السائقين الحاليين
            </CardDescription>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء رابط جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء رابط سائق جديد</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Link Type */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">رابط تسجيل سائق جديد</p>
                      <p className="text-xs text-muted-foreground">
                        يستخدم لتسجيل سائقين جدد في المنظومة
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isForRegistration}
                    onCheckedChange={setIsForRegistration}
                  />
                </div>

                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>عنوان الرابط</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="مثال: تسجيل سائقين مناطق القاهرة"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الوصف (اختياري)</Label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="تعليمات أو معلومات للسائق..."
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                {/* Link to existing driver (for update links) */}
                {!isForRegistration && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      اختر السائق (لتحديث بياناته)
                    </Label>
                    <Select value={selectedDriverId} onValueChange={handleDriverSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السائق..." />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => {
                          const driverProfile = Array.isArray(driver.profiles) ? driver.profiles[0] : driver.profiles;
                          return (
                            <SelectItem key={driver.id} value={driver.id}>
                              <div className="flex items-center gap-2">
                                <span>{driverProfile?.full_name || 'سائق'}</span>
                                {driverProfile?.phone && (
                                  <span className="text-muted-foreground text-xs">({driverProfile.phone})</span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preset Data Section */}
                <Accordion type="single" collapsible defaultValue="preset">
                  <AccordionItem value="preset" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Settings2 className="h-4 w-4 text-primary" />
                        البيانات المحددة مسبقاً
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            اسم السائق
                          </Label>
                          <Input
                            value={presetDriverName}
                            onChange={(e) => setPresetDriverName(e.target.value)}
                            placeholder="اسم السائق"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            رقم الهاتف
                          </Label>
                          <Input
                            value={presetPhone}
                            onChange={(e) => setPresetPhone(e.target.value)}
                            placeholder="رقم الهاتف"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            نوع المركبة
                          </Label>
                          <Select value={presetVehicleType} onValueChange={setPresetVehicleType}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر..." />
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
                          <Label className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            رقم اللوحة
                          </Label>
                          <Input
                            value={presetPlateNumber}
                            onChange={(e) => setPresetPlateNumber(e.target.value)}
                            placeholder="رقم اللوحة"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          رقم الرخصة
                        </Label>
                        <Input
                          value={presetLicenseNumber}
                          onChange={(e) => setPresetLicenseNumber(e.target.value)}
                          placeholder="رقم رخصة القيادة"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>ملاحظات</Label>
                        <Textarea
                          value={presetNotes}
                          onChange={(e) => setPresetNotes(e.target.value)}
                          placeholder="أي ملاحظات إضافية..."
                          rows={2}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Edit Permissions */}
                  <AccordionItem value="permissions" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Lock className="h-4 w-4 text-amber-500" />
                        صلاحيات التعديل
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowName" className="text-sm">السماح بتعديل الاسم</Label>
                        <Switch
                          id="allowName"
                          checked={allowNameEdit}
                          onCheckedChange={setAllowNameEdit}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowPhone" className="text-sm">السماح بتعديل الهاتف</Label>
                        <Switch
                          id="allowPhone"
                          checked={allowPhoneEdit}
                          onCheckedChange={setAllowPhoneEdit}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowVehicle" className="text-sm">السماح بتعديل بيانات المركبة</Label>
                        <Switch
                          id="allowVehicle"
                          checked={allowVehicleEdit}
                          onCheckedChange={setAllowVehicleEdit}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Expiry */}
                  <AccordionItem value="expiry" className="border-none">
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        تاريخ الانتهاء
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="hasExpiry" className="text-sm">تحديد تاريخ انتهاء</Label>
                        <Switch
                          id="hasExpiry"
                          checked={hasExpiry}
                          onCheckedChange={setHasExpiry}
                        />
                      </div>
                      {hasExpiry && (
                        <Input
                          type="datetime-local"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Separator />

                <Button
                  onClick={createLink}
                  disabled={creating}
                  className="w-full gap-2"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  إنشاء الرابط
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">لا توجد روابط</h3>
            <p className="text-sm text-muted-foreground mb-4">
              أنشئ رابطاً جديداً لبدء استقبال بيانات السائقين
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border rounded-lg ${
                  link.is_pinned ? 'border-primary/50 bg-primary/5' : ''
                } ${!link.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {link.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                      <h4 className="font-medium truncate">{link.title || 'رابط سائق'}</h4>
                      <Badge variant={link.is_active ? 'default' : 'secondary'} className="text-xs">
                        {link.is_active ? 'نشط' : 'متوقف'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {link.is_for_registration ? 'تسجيل جديد' : 'تحديث بيانات'}
                      </Badge>
                    </div>

                    {link.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {link.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {getDriverName(link) && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getDriverName(link)}
                        </span>
                      )}
                      {link.preset_vehicle_type && (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {vehicleTypes.find(t => t.value === link.preset_vehicle_type)?.label || link.preset_vehicle_type}
                        </span>
                      )}
                      {link.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          ينتهي: {formatDate(link.expires_at)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {link.usage_count} استخدام
                      </span>
                      {link.last_used_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          آخر استخدام: {formatDate(link.last_used_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePin(link.id, link.is_pinned)}
                      className="h-8 w-8"
                    >
                      {link.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => shareLink(link)}
                      className="h-8 w-8"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLink(link.token)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`/driver/${link.token}`, '_blank')}
                      className="h-8 w-8"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleLink(link.id, link.is_active)}
                      className="h-8 w-8"
                    >
                      {link.is_active ? (
                        <Lock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLink(link.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverLinksManager;
