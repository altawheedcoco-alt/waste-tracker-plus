/**
 * DriverRegistrationForm — نموذج تسجيل السائق
 * يدعم التسجيل بالبريد الإلكتروني أو رقم الهاتف
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Car, User, Mail, Phone, KeyRound, CreditCard, Truck, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import RegistrationTermsAcceptance from './RegistrationTermsAcceptance';

const driverSchema = z.object({
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  licenseNumber: z.string().min(5, 'رقم الرخصة مطلوب'),
  vehicleType: z.string().min(2, 'نوع المركبة مطلوب'),
  vehiclePlate: z.string().min(3, 'لوحة المركبة مطلوبة'),
});

interface DriverRegistrationFormProps {
  onBack: () => void;
}

type RegMethod = 'email' | 'phone';

const DriverRegistrationForm = ({ onBack }: DriverRegistrationFormProps) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regMethod, setRegMethod] = useState<RegMethod>('email');
  const [data, setData] = useState({
    email: '', password: '', fullName: '', phone: '',
    licenseNumber: '', vehicleType: '', vehiclePlate: '', licenseExpiry: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!data.fullName) errs.fullName = t('auth.nameRequired');
      if (regMethod === 'email' && !data.email) errs.email = t('auth.emailRequired');
      if (regMethod === 'phone' && (!data.phone || data.phone.trim().length < 8)) errs.phone = 'رقم الهاتف مطلوب (8 أرقام على الأقل)';
      if (regMethod === 'email' && !data.phone) errs.phone = t('auth.phoneRequired');
      if (!data.password || data.password.length < 6) errs.password = t('auth.passwordMinLength');
    } else {
      if (!data.licenseNumber) errs.licenseNumber = t('auth.licenseRequired');
      if (!data.vehicleType) errs.vehicleType = t('auth.vehicleTypeRequired');
      if (!data.vehiclePlate) errs.vehiclePlate = t('auth.vehiclePlateRequired');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    if (!termsAccepted) {
      setErrors(prev => ({ ...prev, terms: 'يجب الموافقة على الشروط والأحكام' }));
      return;
    }
    setLoading(true);
    try {
      driverSchema.parse(data);
      const response = await supabase.functions.invoke('register-driver-external', {
        body: {
          email: regMethod === 'email' ? data.email : null,
          password: data.password,
          full_name: data.fullName,
          phone: data.phone,
          license_number: data.licenseNumber,
          vehicle_type: data.vehicleType,
          vehicle_plate: data.vehiclePlate,
          license_expiry: data.licenseExpiry || null,
          registration_method: regMethod,
        },
      });
      if (response.error) throw new Error(response.data?.error || response.error?.message || 'حدث خطأ');
      if (!response.data?.success) throw new Error(response.data?.error || 'فشل التسجيل');

      const authEmail = response.data.auth_email || data.email;
      const { error: signInError } = await signIn(authEmail, data.password);
      if (signInError) {
        toast({ title: t('auth.registerSuccess'), description: t('auth.reviewPending') });
      } else {
        toast({ title: t('auth.registerSuccess'), description: t('auth.reviewPending') });
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errs: Record<string, string> = {};
        error.errors.forEach(e => { if (e.path[0]) errs[e.path[0] as string] = e.message; });
        setErrors(errs);
      } else {
        toast({ title: t('auth.registerError'), description: error?.message || t('common.error'), variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) => `h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors ${errors[field] ? 'border-destructive' : ''}`;

  return (
    <motion.div key={`driver-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-1.5 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>{s}</div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {s === 1 ? 'البيانات الشخصية' : 'بيانات المركبة'}
            </span>
            {s < 2 && <div className={`flex-1 h-0.5 rounded ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3.5">
          {/* Registration method toggle */}
          <Tabs value={regMethod} onValueChange={(v) => { setRegMethod(v as RegMethod); setErrors({}); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl">
              <TabsTrigger value="email" className="rounded-lg gap-1.5 text-xs">
                <Mail className="w-3.5 h-3.5" /> البريد الإلكتروني
              </TabsTrigger>
              <TabsTrigger value="phone" className="rounded-lg gap-1.5 text-xs">
                <Phone className="w-3.5 h-3.5" /> رقم الهاتف
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.fullName')}</Label>
            <Input placeholder="أحمد محمد" value={data.fullName} onChange={e => handleChange('fullName', e.target.value)} className={inputClass('fullName')} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          {regMethod === 'email' ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.email')}</Label>
                <Input type="email" placeholder="ahmed@example.com" value={data.email} onChange={e => handleChange('email', e.target.value)} className={inputClass('email')} dir="ltr" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.phone')}</Label>
                <Input placeholder="01xxxxxxxxx" value={data.phone} onChange={e => handleChange('phone', e.target.value)} className={inputClass('phone')} dir="ltr" inputMode="tel" maxLength={20} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> رقم الهاتف</Label>
                <Input placeholder="01xxxxxxxxx" value={data.phone} onChange={e => handleChange('phone', e.target.value)} className={inputClass('phone')} dir="ltr" inputMode="tel" maxLength={20} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> البريد الإلكتروني (اختياري)</Label>
                <Input type="email" placeholder="ahmed@example.com" value={data.email} onChange={e => handleChange('email', e.target.value)} className="h-11 rounded-xl bg-muted/30 border-border/50" dir="ltr" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><KeyRound className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.password')}</Label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={data.password}
                onChange={e => handleChange('password', e.target.value)} className={`${inputClass('password')} pl-10`} dir="ltr" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            <PasswordStrengthMeter password={data.password} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.licenseNumber')}</Label>
            <Input placeholder="DL-123456" value={data.licenseNumber} onChange={e => handleChange('licenseNumber', e.target.value)} className={inputClass('licenseNumber')} dir="ltr" />
            {errors.licenseNumber && <p className="text-xs text-destructive">{errors.licenseNumber}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.licenseExpiry')}</Label>
            <Input type="date" value={data.licenseExpiry} onChange={e => handleChange('licenseExpiry', e.target.value)} className="h-11 rounded-xl bg-muted/30 border-border/50" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.vehicleType')}</Label>
            <Input placeholder="شاحنة نقل" value={data.vehicleType} onChange={e => handleChange('vehicleType', e.target.value)} className={inputClass('vehicleType')} />
            {errors.vehicleType && <p className="text-xs text-destructive">{errors.vehicleType}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Car className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.vehiclePlate')}</Label>
            <Input placeholder="أ ب ج 1234" value={data.vehiclePlate} onChange={e => handleChange('vehiclePlate', e.target.value)} className={inputClass('vehiclePlate')} dir="ltr" />
            {errors.vehiclePlate && <p className="text-xs text-destructive">{errors.vehiclePlate}</p>}
          </div>

          {/* Terms & Conditions */}
          <RegistrationTermsAcceptance
            accountType="driver"
            onAcceptChange={(v) => { setTermsAccepted(v); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })); }}
          />
          {errors.terms && <p className="text-xs text-destructive text-center">{errors.terms}</p>}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(1) : onBack()} className="flex-1 h-11 rounded-xl">
          <ArrowRight className="ml-2" size={18} />{t('common.previous')}
        </Button>
        {step < 2 ? (
          <Button type="button" variant="eco" onClick={() => validateStep(1) && setStep(2)} className="flex-1 h-11 rounded-xl">
            {t('common.next')}<ArrowLeft className="mr-2" size={18} />
          </Button>
        ) : (
          <Button type="button" variant="eco" onClick={handleSubmit} disabled={loading || !termsAccepted} className="flex-1 h-11 rounded-xl">
            {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : null}
            {loading ? t('auth.creatingAccount') : t('auth.submitRequest')}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default DriverRegistrationForm;
