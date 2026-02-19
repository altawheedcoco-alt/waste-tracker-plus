import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  User,
  Phone,
  Car,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Truck,
  Calendar,
} from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';

interface DriverLink {
  id: string;
  organization_id: string;
  driver_id: string | null;
  token: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  expires_at: string | null;
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
}

const vehicleTypes = [
  { value: 'pickup', label: 'بيك أب' },
  { value: 'truck', label: 'شاحنة' },
  { value: 'van', label: 'فان' },
  { value: 'trailer', label: 'مقطورة' },
  { value: 'tanker', label: 'صهريج' },
  { value: 'other', label: 'أخرى' },
];

const QuickDriver = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<DriverLink | null>(null);
  const [organization, setOrganization] = useState<{ name: string; logo_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [driverName, setDriverName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadLink = async () => {
      if (!token) {
        setError('رابط غير صالح');
        setLoading(false);
        return;
      }

      try {
        const { data: linkData, error: linkError } = await supabase
          .from('driver_quick_links')
          .select('*')
          .eq('token', token)
          .single();

        if (linkError || !linkData) {
          setError('الرابط غير موجود أو منتهي الصلاحية');
          setLoading(false);
          return;
        }

        // Check if link is active
        if (!linkData.is_active) {
          setError('هذا الرابط غير نشط حالياً');
          setLoading(false);
          return;
        }

        // Check expiry
        if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
          setError('انتهت صلاحية هذا الرابط');
          setLoading(false);
          return;
        }

        setLink(linkData);

        // Set preset values
        setDriverName(linkData.preset_driver_name || '');
        setPhone(linkData.preset_phone || '');
        setVehicleType(linkData.preset_vehicle_type || '');
        setPlateNumber(linkData.preset_plate_number || '');
        setLicenseNumber(linkData.preset_license_number || '');
        setNotes(linkData.preset_notes || '');

        // Load organization info
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name, logo_url')
          .eq('id', linkData.organization_id)
          .single();

        if (orgData) {
          setOrganization(orgData);
        }
      } catch (err) {
        console.error('Error loading link:', err);
        setError('حدث خطأ في تحميل الرابط');
      } finally {
        setLoading(false);
      }
    };

    loadLink();
  }, [token]);

  const handleSubmit = async () => {
    if (!link) return;

    if (!driverName.trim()) {
      toast.error('يرجى إدخال اسم السائق');
      return;
    }

    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }

    setSubmitting(true);
    try {
      if (link.is_for_registration) {
        // For new driver registration, we need to create a profile first
        // Since this is a public form, we'll store the data as a pending driver request
        // The organization will review and create the actual driver record
        const { error: insertError } = await supabase
          .from('driver_quick_links')
          .update({
            preset_driver_name: driverName,
            preset_phone: phone,
            preset_vehicle_type: vehicleType || 'other',
            preset_plate_number: plateNumber,
            preset_license_number: licenseNumber,
            preset_notes: `طلب تسجيل جديد: ${notes}`,
            usage_count: (link as any).usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', link.id);

        if (insertError) throw insertError;
      } else if (link.driver_id) {
        // Update existing driver
        const updateData: any = {};
        if (link.allow_vehicle_edit) {
          updateData.vehicle_type = vehicleType;
          updateData.vehicle_plate = plateNumber;
          updateData.license_number = licenseNumber;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('drivers')
            .update(updateData)
            .eq('id', link.driver_id);

          if (updateError) throw updateError;
        }

        // Update usage count
        await supabase
          .from('driver_quick_links')
          .update({
            usage_count: (link as any).usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', link.id);
      }

      setSubmitted(true);
      toast.success('تم إرسال البيانات بنجاح');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('حدث خطأ في إرسال البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">الرابط غير متاح</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card>
            <CardContent className="pt-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">
                {link?.is_for_registration ? 'تم التسجيل بنجاح!' : 'تم تحديث البيانات بنجاح!'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {link?.is_for_registration
                  ? 'شكراً لتسجيلك. سيتم مراجعة بياناتك والتواصل معك قريباً.'
                  : 'تم حفظ التحديثات بنجاح.'}
              </p>
              {organization && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{organization.name}</span>
                </div>
              )}
              <div className="mt-8 pt-4 border-t">
                <div className="flex items-center justify-center gap-2">
                  <PlatformLogo size="xs" showText />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 px-4" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          {organization && (
            <p className="text-sm text-muted-foreground">{organization.name}</p>
          )}
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {link?.title || (link?.is_for_registration ? 'تسجيل سائق جديد' : 'تحديث بيانات السائق')}
              </CardTitle>
              {link?.description && (
                <CardDescription>{link.description}</CardDescription>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {link?.is_for_registration ? 'تسجيل جديد' : 'تحديث بيانات'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Driver Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  اسم السائق *
                </Label>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="أدخل اسم السائق الكامل"
                  disabled={!link?.allow_name_edit && !link?.is_for_registration}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  رقم الهاتف *
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                  dir="ltr"
                  disabled={!link?.allow_phone_edit && !link?.is_for_registration}
                />
              </div>

              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  نوع المركبة
                </Label>
                <Select
                  value={vehicleType}
                  onValueChange={setVehicleType}
                  disabled={!link?.allow_vehicle_edit && !link?.is_for_registration}
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

              {/* Plate Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  رقم اللوحة
                </Label>
                <Input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="أدخل رقم لوحة المركبة"
                  disabled={!link?.allow_vehicle_edit && !link?.is_for_registration}
                />
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  رقم رخصة القيادة
                </Label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="أدخل رقم رخصة القيادة"
                  disabled={!link?.allow_vehicle_edit && !link?.is_for_registration}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !driverName.trim() || !phone.trim()}
                className="w-full gap-2 mt-6"
                size="lg"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {link?.is_for_registration ? 'إرسال طلب التسجيل' : 'حفظ التحديثات'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <PlatformLogo size="xs" showText />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickDriver;
