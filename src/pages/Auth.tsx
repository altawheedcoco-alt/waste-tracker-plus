import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Building2, Truck, Recycle, ArrowLeft, ArrowRight, Eye, EyeOff, User, AlertCircle, Shield, Car, Factory } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/logo.png';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CompanyRegistrationForm, { CompanyFormData } from '@/components/auth/CompanyRegistrationForm';
import { supabase } from '@/integrations/supabase/client';

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
  organizationType: z.enum(['generator', 'transporter', 'recycler']),
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

type RegistrationType = 'company' | 'driver' | null;
type AuthMode = 'login' | 'register';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [registrationType, setRegistrationType] = useState<RegistrationType>(
    initialMode === 'register' ? null : null
  );
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user, signIn, signUp, signUpDriver } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Company form state
  const [companyData, setCompanyData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    organizationType: '' as 'generator' | 'transporter' | 'recycler',
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
    email: '',
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
        newErrors.organizationType = 'يرجى اختيار نوع المنشأة';
      }
    } else if (stepNumber === 2) {
      if (!companyData.organizationName) newErrors.organizationName = 'اسم المنشأة مطلوب';
      if (!companyData.organizationEmail) newErrors.organizationEmail = 'بريد المنشأة مطلوب';
      if (!companyData.organizationPhone) newErrors.organizationPhone = 'هاتف المنشأة مطلوب';
      if (!companyData.address) newErrors.address = 'العنوان مطلوب';
      if (!companyData.city) newErrors.city = 'المدينة مطلوبة';
    } else if (stepNumber === 3) {
      if (!companyData.fullName) newErrors.fullName = 'الاسم مطلوب';
      if (!companyData.email) newErrors.email = 'البريد الإلكتروني مطلوب';
      if (!companyData.phone) newErrors.phone = 'رقم الهاتف مطلوب';
      if (!companyData.password || companyData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDriverStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!driverData.fullName) newErrors.fullName = 'الاسم مطلوب';
      if (!driverData.email) newErrors.email = 'البريد الإلكتروني مطلوب';
      if (!driverData.phone) newErrors.phone = 'رقم الهاتف مطلوب';
      if (!driverData.password || driverData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }
    } else if (stepNumber === 2) {
      if (!driverData.licenseNumber) newErrors.licenseNumber = 'رقم الرخصة مطلوب';
      if (!driverData.vehicleType) newErrors.vehicleType = 'نوع المركبة مطلوب';
      if (!driverData.vehiclePlate) newErrors.vehiclePlate = 'لوحة المركبة مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      loginSchema.parse(loginData);
      
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'خطأ في تسجيل الدخول',
            description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'خطأ',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك في آي ريسايكل',
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
        title: 'خطأ في التسجيل',
        description: error?.message || 'حدث خطأ أثناء التسجيل',
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
          title: 'تم التسجيل بنجاح',
          description: 'سيتم مراجعة طلبك من قبل الإدارة. يمكنك تسجيل الدخول الآن.',
        });
        setAuthMode('login');
      } else {
        toast({
          title: 'تم التسجيل بنجاح',
          description: 'سيتم مراجعة طلبك من قبل الإدارة',
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
          title: 'خطأ في التسجيل',
          description: error?.message || 'حدث خطأ أثناء التسجيل',
          variant: 'destructive',
        });
      }
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
      label: 'الجهة المولدة',
      description: 'مصانع، شركات، مستشفيات',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
    },
    {
      value: 'transporter',
      label: 'الجهة الناقلة',
      description: 'جمع ونقل المخلفات',
      icon: Truck,
      color: 'from-amber-500 to-amber-600',
    },
    {
      value: 'recycler',
      label: 'الجهة المدورة',
      description: 'مصانع إعادة التدوير',
      icon: Recycle,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  const registrationTypes = [
    {
      value: 'company',
      label: 'تسجيل شركة / منشأة',
      description: 'مولدة، ناقلة، أو مدورة للمخلفات',
      icon: Building2,
      color: 'from-primary to-primary/80',
    },
    {
      value: 'driver',
      label: 'تسجيل سائق',
      description: 'سائق لنقل المخلفات',
      icon: User,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  const getTotalSteps = () => {
    if (registrationType === 'company') return 3;
    if (registrationType === 'driver') return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
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
            className="inline-flex items-center gap-3 mb-4"
          >
            <img src={logo} alt="آي ريسايكل" className="h-16 w-16 object-contain" />
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gradient-eco">آي ريسايكل</h1>
              <p className="text-sm text-muted-foreground">نظام إدارة المخلفات الذكي</p>
            </div>
          </motion.div>
        </div>

        <Card className="glass-eco border-0 shadow-eco-lg">
          <CardHeader className="text-center pb-2">
            {/* System Branding */}
            <div className="mb-4 pb-4 border-b border-border/50">
              <h2 className="text-lg sm:text-xl font-bold text-primary tracking-wide">
                iRecycle Waste Management System
              </h2>
              <p className="text-sm sm:text-base font-semibold text-foreground/70">
                نظام آي ريسايكل لإدارة المخلفات
              </p>
            </div>
            
            <CardTitle className="text-xl">
              {authMode === 'login' 
                ? 'تسجيل الدخول' 
                : registrationType === null 
                  ? 'إنشاء حساب جديد'
                  : registrationType === 'company'
                    ? 'تسجيل شركة جديدة'
                    : `تسجيل سائق - الخطوة ${step} من ${getTotalSteps()}`
              }
            </CardTitle>
            <CardDescription>
              {authMode === 'login'
                ? 'أدخل بيانات حسابك للمتابعة'
                : registrationType === null
                  ? 'اختر نوع الحساب'
                  : registrationType === 'company'
                    ? 'أكمل البيانات القانونية للتسجيل'
                    : step === 1
                      ? 'البيانات الشخصية'
                      : 'بيانات الرخصة والمركبة'
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
                    <Label htmlFor="email">البريد الإلكتروني</Label>
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
                    <Label htmlFor="password">كلمة المرور</Label>
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

                  <Button
                    type="submit"
                    variant="eco"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Button>

                  {/* Quick Demo Login Buttons */}
                  <div className="pt-4">
                    <div className="relative">
                      <Separator className="my-4" />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                        دخول سريع (تجريبي)
                      </span>
                    </div>
                    
                    {/* الحسابات الأساسية */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                      {[
                        { email: 'admin@demo.com', password: 'admin123456', icon: Shield, label: 'المدير', color: 'bg-red-500 hover:bg-red-600' },
                        { email: 'generator@demo.com', password: 'generator123456', icon: Building2, label: 'المولدة', color: 'bg-blue-500 hover:bg-blue-600' },
                        { email: 'transporter@demo.com', password: 'transporter123456', icon: Truck, label: 'الناقلة', color: 'bg-amber-500 hover:bg-amber-600' },
                        { email: 'recycler@demo.com', password: 'recycler123456', icon: Recycle, label: 'المدورة', color: 'bg-emerald-500 hover:bg-emerald-600' },
                        { email: 'disposal@demo.com', password: 'disposal123456', icon: Factory, label: 'التخلص', color: 'bg-rose-600 hover:bg-rose-700' },
                        { email: 'driver@demo.com', password: 'driver123456', icon: Car, label: 'السائق', color: 'bg-purple-500 hover:bg-purple-600' },
                      ].map((demo) => (
                        <motion.button
                          key={demo.email}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const { error } = await signIn(demo.email, demo.password);
                              if (error) {
                                toast({
                                  title: 'خطأ',
                                  description: 'فشل تسجيل الدخول',
                                  variant: 'destructive',
                                });
                              } else {
                                navigate('/dashboard');
                              }
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg text-white transition-all ${demo.color} disabled:opacity-50`}
                        >
                          <demo.icon className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-medium">{demo.label}</span>
                        </motion.button>
                      ))}
                    </div>

                  </div>
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
                      جميع الطلبات تخضع للمراجعة والموافقة من قبل الإدارة
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

              {/* Company Registration - Use New Form Component */}
              {authMode === 'register' && registrationType === 'company' && (
                <motion.div
                  key="company-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CompanyRegistrationForm
                    onSubmit={handleCompanySignUp}
                    onBack={() => setRegistrationType(null)}
                  />
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
                        <Label>الاسم الكامل</Label>
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
                        <Label>البريد الإلكتروني</Label>
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
                        <Label>رقم الهاتف</Label>
                        <Input
                          placeholder="01234567890"
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
                        <Label>كلمة المرور</Label>
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
                        <Label>رقم رخصة القيادة</Label>
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
                        <Label>تاريخ انتهاء الرخصة (اختياري)</Label>
                        <Input
                          type="date"
                          value={driverData.licenseExpiry}
                          onChange={(e) => handleDriverChange('licenseExpiry', e.target.value)}
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>نوع المركبة</Label>
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
                        <Label>لوحة المركبة</Label>
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
                      السابق
                    </Button>
                    {step < 2 ? (
                      <Button
                        type="button"
                        variant="eco"
                        onClick={nextStep}
                        className="flex-1"
                      >
                        التالي
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
                        {loading ? 'جاري إنشاء الحساب...' : 'إرسال الطلب'}
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
                    ليس لديك حساب؟{' '}
                    <span className="text-primary font-medium">سجل الآن</span>
                  </>
                ) : (
                  <>
                    لديك حساب بالفعل؟{' '}
                    <span className="text-primary font-medium">تسجيل الدخول</span>
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
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
