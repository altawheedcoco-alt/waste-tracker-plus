/**
 * صفحة تسجيل السائق المستقل (Onboarding)
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Shield, MapPin, Package, Banknote,
  CheckCircle, Loader2, UserCheck, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WASTE_TYPES = [
  'نفايات صلبة', 'نفايات خطرة', 'نفايات طبية', 'نفايات إلكترونية',
  'نفايات بناء', 'نفايات عضوية', 'بلاستيك', 'معادن', 'ورق وكرتون', 'زجاج',
];

const VEHICLE_TYPES = [
  { value: 'pickup', label: 'بيك أب' },
  { value: 'van', label: 'فان' },
  { value: 'truck_small', label: 'شاحنة صغيرة (3.5 طن)' },
  { value: 'truck_medium', label: 'شاحنة متوسطة (7 طن)' },
  { value: 'truck_large', label: 'شاحنة كبيرة (12+ طن)' },
  { value: 'tanker', label: 'صهريج' },
  { value: 'compactor', label: 'كابسة ضغط' },
];

const STEPS = ['البيانات الأساسية', 'المركبة والنطاق', 'التخصص والتسعيرة', 'المراجعة'];

const IndependentDriverOnboarding = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    license_number: '',
    license_expiry: '',
    vehicle_type: '',
    vehicle_plate: '',
    service_area_km: 10,
    preferred_waste_types: [] as string[],
    bio: '',
    per_trip_rate: '',
    hourly_rate: '',
  });

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleWasteType = (type: string) => {
    setForm(prev => ({
      ...prev,
      preferred_waste_types: prev.preferred_waste_types.includes(type)
        ? prev.preferred_waste_types.filter(t => t !== type)
        : [...prev.preferred_waste_types, type],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.license_number && form.license_expiry;
      case 1: return form.vehicle_type && form.vehicle_plate;
      case 2: return form.preferred_waste_types.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('drivers').insert({
        profile_id: profile.id,
        driver_type: 'independent',
        license_number: form.license_number,
        license_expiry: form.license_expiry || null,
        vehicle_type: form.vehicle_type,
        vehicle_plate: form.vehicle_plate,
        service_area_km: form.service_area_km,
        preferred_waste_types: form.preferred_waste_types,
        bio: form.bio || null,
        per_trip_rate: form.per_trip_rate ? parseFloat(form.per_trip_rate) : null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        is_available: true,
        is_verified: false,
        rating: 5.0,
        total_trips: 0,
        acceptance_rate: 1.0,
        rejection_count: 0,
      });

      if (error) throw error;

      toast.success('تم تسجيلك كسائق مستقل بنجاح! ⚡');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'فشل في التسجيل');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <UserCheck className="w-4 h-4" />
            تسجيل سائق مستقل
          </div>
          <h1 className="text-2xl font-bold">انضم كسائق مستقل</h1>
          <p className="text-sm text-muted-foreground">استلم شحنات تلقائياً في نطاق خدمتك</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary/20 text-primary border-2 border-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">{STEPS[step]}</p>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                {step === 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">البيانات الأساسية</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>رقم رخصة القيادة *</Label>
                        <Input
                          value={form.license_number}
                          onChange={e => updateField('license_number', e.target.value)}
                          placeholder="أدخل رقم الرخصة"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label>تاريخ انتهاء الرخصة *</Label>
                        <Input
                          type="date"
                          value={form.license_expiry}
                          onChange={e => updateField('license_expiry', e.target.value)}
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">المركبة ونطاق الخدمة</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>نوع المركبة *</Label>
                        <Select value={form.vehicle_type} onValueChange={v => updateField('vehicle_type', v)}>
                          <SelectTrigger><SelectValue placeholder="اختر نوع المركبة" /></SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPES.map(v => (
                              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>رقم اللوحة *</Label>
                        <Input
                          value={form.vehicle_plate}
                          onChange={e => updateField('vehicle_plate', e.target.value)}
                          placeholder="مثال: أ ب ج ١٢٣٤"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          نطاق الخدمة: <strong>{form.service_area_km} كم</strong>
                        </Label>
                        <Slider
                          value={[form.service_area_km]}
                          onValueChange={([v]) => updateField('service_area_km', v)}
                          min={5}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          ستصلك عروض شحنات ضمن هذا النطاق من موقعك الحالي
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">التخصص والتسعيرة</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>أنواع النفايات المفضلة * (اختر واحدة أو أكثر)</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {WASTE_TYPES.map(type => (
                            <Badge
                              key={type}
                              variant={form.preferred_waste_types.includes(type) ? 'default' : 'outline'}
                              className="cursor-pointer transition-all"
                              onClick={() => toggleWasteType(type)}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" /> تسعيرة الرحلة (ج.م)
                          </Label>
                          <Input
                            type="number"
                            value={form.per_trip_rate}
                            onChange={e => updateField('per_trip_rate', e.target.value)}
                            placeholder="مثال: 200"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <Label className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" /> تسعيرة الساعة (ج.م)
                          </Label>
                          <Input
                            type="number"
                            value={form.hourly_rate}
                            onChange={e => updateField('hourly_rate', e.target.value)}
                            placeholder="مثال: 50"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>نبذة عنك (اختياري)</Label>
                        <Textarea
                          value={form.bio}
                          onChange={e => updateField('bio', e.target.value)}
                          placeholder="خبرتك، تخصصك، المناطق التي تخدمها..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-bold">مراجعة البيانات</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
                        <div>
                          <span className="text-muted-foreground">رقم الرخصة:</span>
                          <p className="font-medium" dir="ltr">{form.license_number}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">انتهاء الرخصة:</span>
                          <p className="font-medium">{form.license_expiry}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">نوع المركبة:</span>
                          <p className="font-medium">{VEHICLE_TYPES.find(v => v.value === form.vehicle_type)?.label}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">رقم اللوحة:</span>
                          <p className="font-medium" dir="ltr">{form.vehicle_plate}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">نطاق الخدمة:</span>
                          <p className="font-medium">{form.service_area_km} كم</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">التسعيرة:</span>
                          <p className="font-medium">
                            {form.per_trip_rate && `${form.per_trip_rate} ج.م/رحلة`}
                            {form.per_trip_rate && form.hourly_rate && ' • '}
                            {form.hourly_rate && `${form.hourly_rate} ج.م/ساعة`}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">أنواع النفايات:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {form.preferred_waste_types.map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      {form.bio && (
                        <div>
                          <span className="text-muted-foreground">نبذة:</span>
                          <p className="text-xs mt-1">{form.bio}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            {step > 0 ? 'السابق' : 'رجوع'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-1.5"
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              تسجيل كسائق مستقل
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndependentDriverOnboarding;
