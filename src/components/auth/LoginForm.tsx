/**
 * LoginForm — نموذج تسجيل الدخول المحسّن مع دعم الهاتف
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, AlertTriangle, Mail, KeyRound, LogIn, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import DemoQuickLogin from './DemoQuickLogin';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const emailLoginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(8, 'رقم الهاتف غير صالح').regex(/^[\d\s+\-()]{8,20}$/, 'رقم هاتف غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginMethod = 'email' | 'phone';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [loginData, setLoginData] = useState({
    email: localStorage.getItem('rememberEmail') || '',
    phone: localStorage.getItem('rememberPhone') || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [lookingUpPhone, setLookingUpPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberEmail') || !!localStorage.getItem('rememberPhone'));
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('loginLockout');
    if (stored) {
      const lockTime = parseInt(stored, 10);
      if (lockTime > Date.now()) {
        setLockedUntil(lockTime);
        setLoginAttempts(MAX_LOGIN_ATTEMPTS);
      } else {
        localStorage.removeItem('loginLockout');
        localStorage.removeItem('loginAttempts');
      }
    }
    setLoginAttempts(parseInt(localStorage.getItem('loginAttempts') || '0', 10));
  }, []);

  const getRemainingMinutes = useCallback(() => {
    if (!lockedUntil) return 0;
    return Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
  }, [lockedUntil]);

  const isLocked = lockedUntil ? lockedUntil > Date.now() : false;

  const handleChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast({ title: 'الحساب مقفل مؤقتاً', description: `حاول بعد ${getRemainingMinutes()} دقيقة`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let emailToUse = loginData.email;

      if (loginMethod === 'phone') {
        phoneLoginSchema.parse({ phone: loginData.phone, password: loginData.password });
        
        // Look up email by phone number
        setLookingUpPhone(true);
        const { data: lookupData, error: lookupError } = await supabase.functions.invoke('lookup-email-by-phone', {
          body: { phone: loginData.phone },
        });
        setLookingUpPhone(false);

        if (lookupError || !lookupData?.email) {
          const errorMsg = lookupData?.error || 'لا يوجد حساب مرتبط بهذا الرقم';
          setErrors({ phone: errorMsg });
          setLoading(false);
          return;
        }
        emailToUse = lookupData.email;
      } else {
        emailLoginSchema.parse({ email: loginData.email, password: loginData.password });
      }

      const { error } = await signIn(emailToUse, loginData.password);

      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('loginAttempts', String(newAttempts));

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockedUntil(lockTime);
          localStorage.setItem('loginLockout', String(lockTime));
          toast({ title: 'تم قفل الحساب مؤقتاً', description: 'محاولات كثيرة. حاول بعد 15 دقيقة.', variant: 'destructive' });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({ title: t('auth.loginError'), description: `${t('auth.invalidCredentials')} (${MAX_LOGIN_ATTEMPTS - newAttempts} متبقية)`, variant: 'destructive' });
        } else {
          toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
        }
      } else {
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginLockout');
        if (rememberMe) {
          if (loginMethod === 'email') {
            localStorage.setItem('rememberEmail', loginData.email);
            localStorage.removeItem('rememberPhone');
          } else {
            localStorage.setItem('rememberPhone', loginData.phone);
            localStorage.removeItem('rememberEmail');
          }
        } else {
          localStorage.removeItem('rememberEmail');
          localStorage.removeItem('rememberPhone');
        }
        toast({ title: t('auth.loginSuccess'), description: t('auth.welcomeBack') });
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => { if (err.path[0]) newErrors[err.path[0] as string] = err.message; });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
      setLookingUpPhone(false);
    }
  };

  return (
    <motion.form
      key="login"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onSubmit={handleLogin}
      className="space-y-5"
    >
      {/* Lockout Warning */}
      {isLocked && (
        <Alert className="bg-destructive/10 border-destructive/30 rounded-xl">
          <Lock className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm text-destructive">
            تم قفل الدخول مؤقتاً. حاول بعد {getRemainingMinutes()} دقيقة.
          </AlertDescription>
        </Alert>
      )}

      {loginAttempts >= 3 && loginAttempts < MAX_LOGIN_ATTEMPTS && !isLocked && (
        <Alert className="bg-accent/50 border-accent rounded-xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            ⚠️ {MAX_LOGIN_ATTEMPTS - loginAttempts} محاولات متبقية قبل القفل
          </AlertDescription>
        </Alert>
      )}

      {/* Login Method Toggle */}
      <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            loginMethod === 'email'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="w-4 h-4" />
          البريد الإلكتروني
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            loginMethod === 'phone'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Phone className="w-4 h-4" />
          رقم الهاتف
        </button>
      </div>

      {/* Email Field */}
      {loginMethod === 'email' && (
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="example@company.com"
            value={loginData.email}
            onChange={e => handleChange('email', e.target.value)}
            className={`h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors ${errors.email ? 'border-destructive' : ''}`}
            dir="ltr"
            disabled={isLocked}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      )}

      {/* Phone Field */}
      {loginMethod === 'phone' && (
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            رقم الهاتف
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="01xxxxxxxxx"
            value={loginData.phone}
            onChange={e => handleChange('phone', e.target.value)}
            className={`h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors ${errors.phone ? 'border-destructive' : ''}`}
            dir="ltr"
            inputMode="tel"
            maxLength={20}
            disabled={isLocked}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      )}

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-muted-foreground" />
          {t('auth.password')}
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={loginData.password}
            onChange={e => handleChange('password', e.target.value)}
            className={`h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors pl-10 ${errors.password ? 'border-destructive' : ''}`}
            dir="ltr"
            disabled={isLocked}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={c => setRememberMe(c === true)} />
          <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">تذكرني</Label>
        </div>
        <button type="button" onClick={() => navigate('/reset-password')}
          className="text-sm text-primary hover:underline font-medium">
          {t('auth.forgotPassword')}
        </button>
      </div>

      {/* Submit */}
      <Button type="submit" variant="default" className="w-full h-11 rounded-xl text-base font-semibold gap-2" disabled={loading || isLocked}>
        {loading ? (
          lookingUpPhone ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          )
        ) : (
          <LogIn className="w-5 h-5" />
        )}
        {loading ? (lookingUpPhone ? 'جاري البحث...' : t('auth.loggingIn')) : t('auth.loginButton')}
      </Button>

      {/* Social Login */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t('auth.orLoginWith')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="w-full h-11 rounded-xl gap-2 hover:bg-muted/50" disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
              if (error) { toast({ title: t('common.error'), description: t('auth.googleLoginError'), variant: 'destructive' }); }
            } finally { setLoading(false); }
          }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>
        <Button type="button" variant="outline" className="w-full h-11 rounded-xl gap-2 hover:bg-muted/50" disabled={loading}
          onClick={async () => {
            setLoading(true);
            try {
              const { error } = await lovable.auth.signInWithOAuth('apple', { redirect_uri: window.location.origin });
              if (error) { toast({ title: t('auth.loginError'), description: error.message, variant: 'destructive' }); }
            } finally { setLoading(false); }
          }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Apple
        </Button>
      </div>

      <DemoQuickLogin onLoginStart={() => setLoading(true)} onLoginEnd={() => setLoading(false)} />
    </motion.form>
  );
};

export default LoginForm;
