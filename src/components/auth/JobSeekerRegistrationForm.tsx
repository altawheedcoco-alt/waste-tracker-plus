/**
 * JobSeekerRegistrationForm — نموذج تسجيل الباحث عن عمل
 * يدعم التسجيل بالبريد الإلكتروني أو رقم الهاتف
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Eye, EyeOff, User, Mail, Phone, KeyRound, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useNavigate } from 'react-router-dom';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import RegistrationTermsAcceptance from './RegistrationTermsAcceptance';

interface JobSeekerRegistrationFormProps {
  onBack: () => void;
}

type RegMethod = 'email' | 'phone';

const JobSeekerRegistrationForm = ({ onBack }: JobSeekerRegistrationFormProps) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regMethod, setRegMethod] = useState<RegMethod>('email');
  const [data, setData] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!data.fullName) errs.fullName = t('auth.nameRequired');
    if (regMethod === 'email' && !data.email) errs.email = t('auth.emailRequired');
    if (regMethod === 'phone' && (!data.phone || data.phone.trim().length < 8)) errs.phone = 'رقم الهاتف مطلوب (8 أرقام على الأقل)';
    if (!data.password || data.password.length < 6) errs.password = t('auth.passwordMinLength');
    if (!termsAccepted) errs.terms = 'يجب الموافقة على الشروط والأحكام';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('register-jobseeker', {
        body: {
          email: regMethod === 'email' ? data.email : null,
          password: data.password,
          full_name: data.fullName,
          phone: data.phone || null,
          registration_method: regMethod,
        },
      });
      if (response.error) throw new Error(response.data?.error || response.error?.message || 'حدث خطأ');
      if (!response.data?.success) throw new Error(response.data?.error || 'فشل التسجيل');

      // Sign in with the auth_email returned from edge function
      const authEmail = response.data.auth_email || data.email;
      const { error: signInError } = await signIn(authEmail, data.password);
      if (signInError) {
        toast({ title: t('auth.registerSuccess'), description: 'يمكنك تسجيل الدخول الآن' });
      } else {
        toast({ title: t('auth.registerSuccess'), description: 'مرحباً بك!' });
        navigate('/dashboard/omaluna');
      }
    } catch (error: any) {
      toast({ title: t('auth.registerError'), description: error?.message || t('common.error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) => `h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors ${errors[field] ? 'border-destructive' : ''}`;

  return (
    <motion.div key="jobseeker-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      {/* Quick badge */}
      <div className="flex items-center justify-center gap-2 p-2.5 bg-sky-50 dark:bg-sky-950/30 rounded-xl text-sm">
        <Briefcase className="w-4 h-4 text-sky-600" />
        <span className="text-sky-700 dark:text-sky-400 font-medium">تسجيل سريع — بيانات أساسية فقط</span>
      </div>

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

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.fullName')}</Label>
          <Input placeholder="أحمد محمد" value={data.fullName} onChange={e => handleChange('fullName', e.target.value)} className={inputClass('fullName')} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        {regMethod === 'email' ? (
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.email')}</Label>
            <Input type="email" placeholder="ahmed@example.com" value={data.email} onChange={e => handleChange('email', e.target.value)} className={inputClass('email')} dir="ltr" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> رقم الهاتف</Label>
            <Input placeholder="01xxxxxxxxx" value={data.phone} onChange={e => handleChange('phone', e.target.value)} className={inputClass('phone')} dir="ltr" inputMode="tel" maxLength={20} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        )}

        {/* Optional secondary field */}
        {regMethod === 'email' && (
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{t('auth.phone')} (اختياري)</Label>
            <Input placeholder="01xxxxxxxxx" value={data.phone} onChange={e => handleChange('phone', e.target.value)} className="h-11 rounded-xl bg-muted/30 border-border/50" dir="ltr" />
          </div>
        )}
        {regMethod === 'phone' && (
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> البريد الإلكتروني (اختياري)</Label>
            <Input type="email" placeholder="ahmed@example.com" value={data.email} onChange={e => handleChange('email', e.target.value)} className="h-11 rounded-xl bg-muted/30 border-border/50" dir="ltr" />
          </div>
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

      {/* Terms & Conditions */}
      <RegistrationTermsAcceptance
        accountType="jobseeker"
        onAcceptChange={(v) => { setTermsAccepted(v); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })); }}
      />
      {errors.terms && <p className="text-xs text-destructive text-center">{errors.terms}</p>}

      {/* Social Login */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">أو سجل عبر</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="w-full h-10 rounded-xl gap-2" disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
              if (error) { toast({ title: t('common.error'), description: t('auth.googleLoginError'), variant: 'destructive' }); }
            } finally { setLoading(false); }
          }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>
        <Button type="button" variant="outline" className="w-full h-10 rounded-xl gap-2" disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await lovable.auth.signInWithOAuth('apple', { redirect_uri: window.location.origin });
              if (error) { toast({ title: t('auth.loginError'), description: error.message, variant: 'destructive' }); }
            } finally { setLoading(false); }
          }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Apple
        </Button>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11 rounded-xl">
          <ArrowRight className="ml-2" size={18} />{t('common.previous')}
        </Button>
        <Button type="button" variant="eco" onClick={handleSubmit} disabled={loading || !termsAccepted} className="flex-1 h-11 rounded-xl">
          {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : null}
          {loading ? t('auth.creatingAccount') : 'إنشاء حساب'}
        </Button>
      </div>
    </motion.div>
  );
};

export default JobSeekerRegistrationForm;
