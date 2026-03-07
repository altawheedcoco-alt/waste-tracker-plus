import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Building2, Truck, Recycle, ArrowLeft, ArrowRight, Eye, EyeOff, User, AlertCircle, Shield, Car, Factory, ClipboardCheck, BookOpen, Award, Briefcase, Lock, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import PlatformLogo from '@/components/common/PlatformLogo';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CompanyRegistrationForm, { CompanyFormData } from '@/components/auth/CompanyRegistrationForm';
import DemoQuickLogin from '@/components/auth/DemoQuickLogin';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import PasswordStrengthMeter from '@/components/auth/PasswordStrengthMeter';

import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const companySignupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  organizationType: z.enum(['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office', 'iso_body']),
  organizationName: z.string().min(2, 'اسم المنشأة مطلوب'),
  organizationEmail: z.string().email('بريد المنشأة غير صالح'),
  organizationPhone: z.string().min(10, 'رقم هاتف المنشأة غير صالح'),
  address: z.string().min(5, 'العنوان مطلوب'),
  city: z.string().min(2, 'المدينة مطلوبة'),
});

const driverSignupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  licenseNumber: z.string().min(5, 'رقم الرخصة مطلوب'),
  vehicleType: z.string().min(2, 'نوع المركبة مطلوب'),
  vehiclePlate: z.string().min(3, 'لوحة المركبة مطلوبة'),
});

type RegistrationType = 'company' | 'driver' | 'jobseeker' | 'consultant' | 'consulting_office' | 'iso_body' | null;
type AuthMode = 'login' | 'register';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialType = searchParams.get('type');
  
  // Map URL type param to registrationType
  const getInitialRegistrationType = (): RegistrationType => {
    if (initialMode !== 'register' || !initialType) return null;
    if (['generator', 'transporter', 'recycler', 'disposal'].includes(initialType)) return 'company';
    if (initialType === 'driver') return 'driver';
    if (initialType === 'consultant') return 'consultant';
    if (initialType === 'consulting_office') return 'consulting_office';
    if (initialType === 'iso_body') return 'iso_body';
    if (initialType === 'jobseeker') return 'jobseeker';
    return null;
  };

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationType, setRegistrationType] = useState<RegistrationType>(
    getInitialRegistrationType()
  );
  const [step, setStep] = useState(
    getInitialRegistrationType() === 'company' && ['generator', 'transporter', 'recycler', 'disposal'].includes(initialType || '') ? 2 : 1
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberEmail') ? true : false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  
  const { user, signIn, signUp, signUpDriver } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Check lockout on mount
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
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    setLoginAttempts(attempts);
  }, []);

  const getRemainingLockoutMinutes = useCallback(() => {
    if (!lockedUntil) return 0;
    return Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
  }, [lockedUntil]);

  // Company form state
  const [companyData, setCompanyData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    organizationType: (['generator', 'transporter', 'recycler', 'disposal'].includes(initialType || '') ? initialType : '') as 'generator' | 'transporter' | 'recycler',
    organizationName: '',
    organizationEmail: '',
    organizationPhone: '',
    address: '',
    city: '',
    commercialRegister: '',
    environmentalLicense: '',
    activityType: '',
    productionCapacity: '',
  });

  // Job seeker form state
  const [jobseekerData, setJobseekerData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  // Driver form state
  const [driverData, setDriverData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    licenseNumber: '',
    vehicleType: '',
    vehiclePlate: '',
    licenseExpiry: '',
  });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: localStorage.getItem('rememberEmail') || '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleJobseekerChange = (field: string, value: string) => {
    setJobseekerData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDriverChange = (field: string, value: string) => {
    setDriverData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleLoginChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateCompanyStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!companyData.organizationType) {
        newErrors.organizationType = t('auth.selectOrgType');
      }
    } else if (stepNumber === 2) {
      if (!companyData.organizationName) newErrors.organizationName = t('auth.orgNameRequired');
      if (!companyData.organizationEmail) newErrors.organizationEmail = t('auth.orgEmailRequired');
      if (!companyData.organizationPhone) newErrors.organizationPhone = t('auth.orgPhoneRequired');
      if (!companyData.address) newErrors.address = t('auth.addressRequired');
      if (!companyData.city) newErrors.city = t('auth.cityRequired');
    } else if (stepNumber === 3) {
      if (!companyData.fullName) newErrors.fullName = t('auth.nameRequired');
      if (!companyData.email) newErrors.email = t('auth.emailRequired');
      if (!companyData.phone) newErrors.phone = t('auth.phoneRequired');
      if (!companyData.password || companyData.password.length < 6) {
        newErrors.password = t('auth.passwordMinLength');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDriverStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!driverData.fullName) newErrors.fullName = t('auth.nameRequired');
      if (!driverData.email) newErrors.email = t('auth.emailRequired');
      if (!driverData.phone) newErrors.phone = t('auth.phoneRequired');
      if (!driverData.password || driverData.password.length < 6) {
        newErrors.password = t('auth.passwordMinLength');
      }
    } else if (stepNumber === 2) {
      if (!driverData.licenseNumber) newErrors.licenseNumber = t('auth.licenseRequired');
      if (!driverData.vehicleType) newErrors.vehicleType = t('auth.vehicleTypeRequired');
      if (!driverData.vehiclePlate) newErrors.vehiclePlate = t('auth.vehiclePlateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check lockout
    if (lockedUntil && lockedUntil > Date.now()) {
      toast({
        title: 'الحساب مقفل مؤقتاً',
        description: `حاول مرة أخرى بعد ${getRemainingLockoutMinutes()} دقيقة`,
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      loginSchema.parse(loginData);
      
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        // Track failed attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem('loginAttempts', String(newAttempts));
        
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockedUntil(lockTime);
          localStorage.setItem('loginLockout', String(lockTime));
          toast({
            title: 'تم قفل الحساب مؤقتاً',
            description: `عدد محاولات كثيرة. حاول بعد 15 دقيقة.`,
            variant: 'destructive',
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            title: t('auth.loginError'),
            description: `${t('auth.invalidCredentials')} (${MAX_LOGIN_ATTEMPTS - newAttempts} محاولات متبقية)`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('common.error'),
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        // Success - reset attempts and handle remember me
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginLockout');
        
        if (rememberMe) {
          localStorage.setItem('rememberEmail', loginData.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySignUp = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      // Register via backend function to avoid direct table INSERT RLS issues
      const response = await supabase.functions.invoke(
        'register-company',
        {
          body: {
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            phone: data.phone,
            organizationType: data.organizationType,
            organizationName: data.organizationName,
            organizationNameEn: data.organizationNameEn,
            organizationEmail: data.organizationEmail,
            organizationPhone: data.organizationPhone,
            secondaryPhone: data.secondaryPhone,
            address: data.address,
            city: data.city,
            region: data.region,
            commercialRegister: data.commercialRegister,
            environmentalLicense: data.environmentalLicense,
            activityType: data.activityType,
            productionCapacity: data.productionCapacity,
            representativeName: data.representativeName,
            representativePosition: data.representativePosition,
            representativePhone: data.representativePhone,
            representativeEmail: data.representativeEmail,
            representativeNationalId: data.representativeNationalId,
            delegateName: data.delegateName,
            delegatePhone: data.delegatePhone,
            delegateEmail: data.delegateEmail,
            delegateNationalId: data.delegateNationalId,
            agentName: data.agentName,
            agentPhone: data.agentPhone,
            agentEmail: data.agentEmail,
            agentNationalId: data.agentNationalId,
          },
        }
      );

      // Handle edge function error responses (e.g., 422 for duplicate email)
      if (response.error) {
        // Extract error message from response data or error object
        const errorMessage = response.data?.error || response.error?.message || 'حدث خطأ أثناء التسجيل';
        throw new Error(errorMessage);
      }
      
      if (!response.data?.success) {
        const errorMessage = response.data?.error || 'فشل إنشاء الشركة';
        throw new Error(errorMessage);
      }

      // Auto login after registration
      const { error: signInError } = await signIn(data.email, data.password);
      if (signInError) throw signInError;

      navigate('/dashboard');
      return { error: null };
    } catch (error: any) {
      console.error('Company registration error:', error);
      toast({
        title: t('auth.registerError'),
        description: error?.message || t('common.error'),
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSignUp = async () => {
    if (!validateDriverStep(2)) return;
    
    setLoading(true);

    try {
      driverSignupSchema.parse(driverData);
      
      // Use Edge Function for external driver registration to bypass RLS
      const response = await supabase.functions.invoke('register-driver-external', {
        body: {
          email: driverData.email,
          password: driverData.password,
          full_name: driverData.fullName,
          phone: driverData.phone,
          license_number: driverData.licenseNumber,
          vehicle_type: driverData.vehicleType,
          vehicle_plate: driverData.vehiclePlate,
          license_expiry: driverData.licenseExpiry || null,
        },
      });

      if (response.error) {
        const errorMessage = response.data?.error || response.error?.message || 'حدث خطأ أثناء التسجيل';
        throw new Error(errorMessage);
      }

      if (!response.data?.success) {
        const errorMessage = response.data?.error || 'فشل تسجيل السائق';
        throw new Error(errorMessage);
      }

      // Auto login after registration
      const { error: signInError } = await signIn(driverData.email, driverData.password);
      
      if (signInError) {
        // Registration succeeded but login failed - still show success
        toast({
          title: t('auth.registerSuccess'),
          description: t('auth.reviewPending'),
        });
        setAuthMode('login');
      } else {
        toast({
          title: t('auth.registerSuccess'),
          description: t('auth.reviewPending'),
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Driver registration error:', error);
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: t('auth.registerError'),
          description: error?.message || t('common.error'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJobseekerSignUp = async () => {
    setLoading(true);
    setErrors({});
    try {
      const newErrors: Record<string, string> = {};
      if (!jobseekerData.fullName) newErrors.fullName = t('auth.nameRequired');
      if (!jobseekerData.email) newErrors.email = t('auth.emailRequired');
      if (!jobseekerData.password || jobseekerData.password.length < 6) newErrors.password = t('auth.passwordMinLength');
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const response = await supabase.functions.invoke('register-jobseeker', {
        body: {
          email: jobseekerData.email,
          password: jobseekerData.password,
          full_name: jobseekerData.fullName,
          phone: jobseekerData.phone || null,
        },
      });

      if (response.error) {
        throw new Error(response.data?.error || response.error?.message || 'حدث خطأ');
      }
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'فشل التسجيل');
      }

      const { error: signInError } = await signIn(jobseekerData.email, jobseekerData.password);
      if (signInError) {
        toast({ title: t('auth.registerSuccess'), description: 'يمكنك تسجيل الدخول الآن' });
        setAuthMode('login');
      } else {
        toast({ title: t('auth.registerSuccess'), description: 'مرحباً بك! يمكنك الآن تصفح الوظائف والتقديم عليها.' });
        navigate('/dashboard/omaluna');
      }
    } catch (error: any) {
      toast({ title: t('auth.registerError'), description: error?.message || t('common.error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (registrationType === 'company' && validateCompanyStep(step)) {
      setStep(step + 1);
    } else if (registrationType === 'driver' && validateDriverStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setRegistrationType(null);
    }
  };

  const resetToLogin = () => {
    setAuthMode('login');
    setRegistrationType(null);
    setStep(1);
    setErrors({});
  };

  const resetToRegister = () => {
    setAuthMode('register');
    setRegistrationType(null);
    setStep(1);
    setErrors({});
  };

  const organizationTypes = [
    {
      value: 'generator',
      label: t('auth.generatorOrg'),
      description: t('auth.generatorOrgDesc'),
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
    },
    {
      value: 'transporter',
      label: t('auth.transporterOrg'),
      description: t('auth.transporterOrgDesc'),
      icon: Truck,
      color: 'from-amber-500 to-amber-600',
    },
    {
      value: 'recycler',
      label: t('auth.recyclerOrg'),
      description: t('auth.recyclerOrgDesc'),
      icon: Recycle,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      value: 'disposal',
      label: t('auth.disposalOrg'),
      description: t('auth.disposalOrgDesc'),
      icon: Factory,
      color: 'from-rose-500 to-red-600',
    },
  ];

  const registrationTypes = [
    {
      value: 'jobseeker',
      label: 'باحث عن عمل',
      description: 'سجل ببساطة وتصفح الوظائف وقدم عليها',
      icon: Briefcase,
      color: 'from-sky-500 to-blue-600',
    },
    {
      value: 'company',
      label: t('auth.companyRegistration'),
      description: t('auth.companyRegistrationDesc'),
      icon: Building2,
      color: 'from-primary to-primary/80',
    },
    {
      value: 'driver',
      label: t('auth.driverRegistration'),
      description: t('auth.driverRegistrationDesc'),
      icon: User,
      color: 'from-amber-500 to-amber-600',
    },
    {
      value: 'consultant',
      label: 'استشاري بيئي',
      description: 'تسجيل كاستشاري بيئي مستقل',
      icon: ClipboardCheck,
      color: 'from-teal-500 to-teal-600',
    },
    {
      value: 'consulting_office',
      label: 'مكتب استشاري',
      description: 'تسجيل مكتب استشارات بيئية',
      icon: BookOpen,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      value: 'iso_body',
      label: 'جهة مانحة للأيزو',
      description: 'جهة اعتماد ومنح شهادات ISO',
      icon: Award,
      color: 'from-emerald-600 to-green-700',
    },
  ];

  const getTotalSteps = () => {
    if (registrationType === 'company') return 3;
    if (registrationType === 'driver') return 2;
    return 1;
  };

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 overflow-y-auto auth-scroll-container">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-eco-emerald/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex flex-col items-center gap-2 mb-4"
          >
            <PlatformLogo size="xl" />
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground/70">
                Waste Management System
              </span>
            </div>
          </motion.div>
        </div>

        <Card className="glass-eco border-0 shadow-eco-lg">
          <CardHeader className="text-center pb-2">
            {/* System Branding */}
            <div className="mb-4 pb-4 border-b border-border/50">
              <h2 className="text-lg sm:text-xl font-bold text-primary tracking-wide">
                {t('landing.systemName')}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-foreground/70">
                {t('landing.systemNameAr')}
              </p>
            </div>
            
            <CardTitle className="text-xl">
              {authMode === 'login' 
                ? t('auth.login') 
                : registrationType === null 
                  ? t('auth.newAccount')
                  : registrationType === 'jobseeker'
                    ? 'تسجيل باحث عن عمل'
                    : registrationType === 'company'
                      ? t('auth.registerCompany')
                      : t('auth.driverStep').replace('{step}', String(step)).replace('{total}', String(getTotalSteps()))
              }
            </CardTitle>
            <CardDescription>
              {authMode === 'login'
                ? t('auth.enterCredentials')
                : registrationType === null
                  ? t('auth.chooseAccountType')
                  : registrationType === 'jobseeker'
                    ? 'أدخل بياناتك الأساسية فقط'
                    : registrationType === 'company'
                      ? t('auth.completeLegalData')
                      : step === 1
                        ? t('auth.personalData')
                        : t('auth.licenseVehicleData')
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {/* Login Form */}
              {authMode === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@company.com"
                      value={loginData.email}
                      onChange={(e) => handleLoginChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      dir="ltr"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => handleLoginChange('password', e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="text-left">
                    <button
                      type="button"
                      onClick={() => navigate('/reset-password')}
                      className="text-sm text-primary hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="eco"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? t('auth.loggingIn') : t('auth.loginButton')}
                  </Button>

                  {/* Social Login Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{t('auth.orLoginWith')}</span>
                    </div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await lovable.auth.signInWithOAuth('google', {
                          redirect_uri: window.location.origin,
                        });
                        if (error) {
                          toast({
                            title: t('common.error'),
                            description: t('auth.googleLoginError'),
                            variant: 'destructive',
                          });
                          setLoading(false);
                        }
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await lovable.auth.signInWithOAuth('apple', {
                          redirect_uri: window.location.origin,
                        });
                        if (error) {
                          toast({
                            title: t('auth.loginError'),
                            description: error.message,
                            variant: 'destructive',
                          });
                        }
                        setLoading(false);
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Apple
                    </Button>
                  </div>

                  <DemoQuickLogin
                    onLoginStart={() => setLoading(true)}
                    onLoginEnd={() => setLoading(false)}
                  />

                </motion.form>
              )}

              {/* Registration Type Selection */}
              {authMode === 'register' && registrationType === null && (
                <motion.div
                  key="registration-type"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      {t('auth.allRequestsReviewed')}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {registrationTypes.map((type) => (
                      <motion.button
                        key={type.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRegistrationType(type.value as RegistrationType)}
                        className="w-full p-4 rounded-xl border-2 transition-all text-right flex items-center gap-4 border-border hover:border-primary/50"
                      >
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center text-white`}
                        >
                          <type.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{type.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Company / Consultant / ISO Body Registration */}
              {authMode === 'register' && (registrationType === 'company' || registrationType === 'consultant' || registrationType === 'consulting_office' || registrationType === 'iso_body') && (
                <motion.div
                  key="company-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CompanyRegistrationForm
                    onSubmit={handleCompanySignUp}
                    onBack={() => setRegistrationType(null)}
                    defaultOrgType={initialType && ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office', 'iso_body'].includes(initialType) ? initialType : (registrationType !== 'company' ? registrationType || undefined : undefined)}
                  />
                </motion.div>
              )}

              {/* Job Seeker Registration */}
              {authMode === 'register' && registrationType === 'jobseeker' && (
                <motion.div
                  key="jobseeker-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>{t('auth.fullName')}</Label>
                    <Input
                      placeholder="أحمد محمد"
                      value={jobseekerData.fullName}
                      onChange={(e) => handleJobseekerChange('fullName', e.target.value)}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('auth.email')}</Label>
                    <Input
                      type="email"
                      placeholder="ahmed@example.com"
                      value={jobseekerData.email}
                      onChange={(e) => handleJobseekerChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      dir="ltr"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('auth.phone')} (اختياري)</Label>
                    <Input
                      placeholder="01xxxxxxxxx"
                      value={jobseekerData.phone}
                      onChange={(e) => handleJobseekerChange('phone', e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={jobseekerData.password}
                        onChange={(e) => handleJobseekerChange('password', e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {/* Social Login for Job Seekers */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">أو سجل عبر</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await lovable.auth.signInWithOAuth('google', {
                          redirect_uri: window.location.origin,
                        });
                        if (error) {
                          toast({ title: t('common.error'), description: t('auth.googleLoginError'), variant: 'destructive' });
                          setLoading(false);
                        }
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        const { error } = await lovable.auth.signInWithOAuth('apple', {
                          redirect_uri: window.location.origin,
                        });
                        if (error) {
                          toast({ title: t('auth.loginError'), description: error.message, variant: 'destructive' });
                        }
                        setLoading(false);
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Apple
                    </Button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setRegistrationType(null)} className="flex-1">
                      <ArrowRight className="ml-2" size={18} />
                      {t('common.previous')}
                    </Button>
                    <Button
                      type="button"
                      variant="eco"
                      onClick={handleJobseekerSignUp}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? t('auth.creatingAccount') : 'إنشاء حساب'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Driver Registration Steps */}
              {authMode === 'register' && registrationType === 'driver' && (
                <motion.div
                  key={`driver-${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('auth.fullName')}</Label>
                        <Input
                          placeholder="أحمد محمد"
                          value={driverData.fullName}
                          onChange={(e) => handleDriverChange('fullName', e.target.value)}
                          className={errors.fullName ? 'border-destructive' : ''}
                        />
                        {errors.fullName && (
                          <p className="text-sm text-destructive">{errors.fullName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t('auth.email')}</Label>
                        <Input
                          type="email"
                          placeholder="ahmed@example.com"
                          value={driverData.email}
                          onChange={(e) => handleDriverChange('email', e.target.value)}
                          className={errors.email ? 'border-destructive' : ''}
                          dir="ltr"
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t('auth.phone')}</Label>
                        <Input
                          placeholder="01xxxxxxxxx"
                          value={driverData.phone}
                          onChange={(e) => handleDriverChange('phone', e.target.value)}
                          className={errors.phone ? 'border-destructive' : ''}
                          dir="ltr"
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t('auth.password')}</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={driverData.password}
                            onChange={(e) => handleDriverChange('password', e.target.value)}
                            className={errors.password ? 'border-destructive' : ''}
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('auth.licenseNumber')}</Label>
                        <Input
                          placeholder="DL-123456"
                          value={driverData.licenseNumber}
                          onChange={(e) => handleDriverChange('licenseNumber', e.target.value)}
                          className={errors.licenseNumber ? 'border-destructive' : ''}
                          dir="ltr"
                        />
                        {errors.licenseNumber && (
                          <p className="text-sm text-destructive">{errors.licenseNumber}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t('auth.licenseExpiry')}</Label>
                        <Input
                          type="date"
                          value={driverData.licenseExpiry}
                          onChange={(e) => handleDriverChange('licenseExpiry', e.target.value)}
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t('auth.vehicleType')}</Label>
                        <Input
                          placeholder="شاحنة نقل"
                          value={driverData.vehicleType}
                          onChange={(e) => handleDriverChange('vehicleType', e.target.value)}
                          className={errors.vehicleType ? 'border-destructive' : ''}
                        />
                        {errors.vehicleType && (
                          <p className="text-sm text-destructive">{errors.vehicleType}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>{t('auth.vehiclePlate')}</Label>
                        <Input
                          placeholder="أ ب ج 1234"
                          value={driverData.vehiclePlate}
                          onChange={(e) => handleDriverChange('vehiclePlate', e.target.value)}
                          className={errors.vehiclePlate ? 'border-destructive' : ''}
                          dir="ltr"
                        />
                        {errors.vehiclePlate && (
                          <p className="text-sm text-destructive">{errors.vehiclePlate}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      <ArrowRight className="ml-2" size={18} />
                      {t('common.previous')}
                    </Button>
                    {step < 2 ? (
                      <Button
                        type="button"
                        variant="eco"
                        onClick={nextStep}
                        className="flex-1"
                      >
                        {t('common.next')}
                        <ArrowLeft className="mr-2" size={18} />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="eco"
                        onClick={handleDriverSignUp}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? t('auth.creatingAccount') : t('auth.submitRequest')}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle login/signup */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  if (authMode === 'login') {
                    resetToRegister();
                  } else {
                    resetToLogin();
                  }
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {authMode === 'login' ? (
                  <>
                    {t('auth.noAccount')}{' '}
                    <span className="text-primary font-medium">{t('auth.signUpNow')}</span>
                  </>
                ) : (
                  <>
                    {t('auth.hasAccount')}{' '}
                    <span className="text-primary font-medium">{t('auth.login')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Back to home */}
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-muted-foreground"
              >
                <Leaf className="ml-2" size={16} />
                {t('auth.backToHome')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
