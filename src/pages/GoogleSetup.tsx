import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, Truck, Recycle, Factory, ArrowLeft, ArrowRight,
  Shield, CheckCircle, AlertCircle, Globe, Phone, Mail, MapPin,
  User, Briefcase, Loader2
} from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';
import { supabase } from '@/integrations/supabase/client';

type OrganizationType = 'generator' | 'transporter' | 'recycler' | 'disposal';

const organizationTypes = [
  {
    value: 'generator' as OrganizationType,
    label: 'الجهة المولدة',
    description: 'مصانع، شركات، مستشفيات',
    icon: Building2,
    color: 'from-blue-500 to-blue-600',
  },
  {
    value: 'transporter' as OrganizationType,
    label: 'الجهة الناقلة',
    description: 'جمع ونقل المخلفات',
    icon: Truck,
    color: 'from-amber-500 to-amber-600',
  },
  {
    value: 'recycler' as OrganizationType,
    label: 'الجهة المدورة',
    description: 'مصانع إعادة التدوير',
    icon: Recycle,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    value: 'disposal' as OrganizationType,
    label: 'جهة التخلص النهائي',
    description: 'المدافن الصحية والمحارق والمعالجة',
    icon: Factory,
    color: 'from-rose-500 to-red-600',
  },
];

const GoogleSetup = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    organizationType: '' as OrganizationType | '',
    organizationName: '',
    organizationEmail: '',
    organizationPhone: '',
    address: '',
    city: '',
    region: '',
    commercialRegister: '',
    environmentalLicense: '',
    activityType: '',
  });

  useEffect(() => {
    // If no user, redirect to auth
    if (!authLoading && !user) {
      navigate('/auth?mode=login');
      return;
    }
    // If user already has profile+org, redirect to dashboard
    if (!authLoading && profile) {
      navigate('/dashboard');
      return;
    }
    // Pre-fill name from Google
    if (user?.user_metadata?.full_name) {
      setFormData(prev => ({ ...prev, fullName: user.user_metadata.full_name }));
    }
    if (user?.email) {
      setFormData(prev => ({ ...prev, organizationEmail: user.email! }));
    }
  }, [user, profile, authLoading, navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (stepNum === 1) {
      if (!formData.organizationType) newErrors.organizationType = 'يرجى اختيار نوع المنشأة';
    } else if (stepNum === 2) {
      if (!formData.organizationName) newErrors.organizationName = 'اسم المنشأة مطلوب';
      if (!formData.organizationEmail) newErrors.organizationEmail = 'بريد المنشأة مطلوب';
      if (!formData.organizationPhone) newErrors.organizationPhone = 'هاتف المنشأة مطلوب';
      if (!formData.address) newErrors.address = 'العنوان مطلوب';
      if (!formData.city) newErrors.city = 'المدينة مطلوبة';
    } else if (stepNum === 3) {
      if (!formData.fullName) newErrors.fullName = 'الاسم مطلوب';
      if (!formData.phone) newErrors.phone = 'رقم الهاتف مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('complete-google-registration', {
        body: {
          fullName: formData.fullName,
          phone: formData.phone,
          organizationType: formData.organizationType,
          organizationName: formData.organizationName,
          organizationEmail: formData.organizationEmail,
          organizationPhone: formData.organizationPhone,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          commercialRegister: formData.commercialRegister,
          environmentalLicense: formData.environmentalLicense,
          activityType: formData.activityType,
        },
      });

      if (response.error) {
        throw new Error(response.data?.error || response.error.message || 'حدث خطأ');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'فشل إنشاء الشركة');
      }

      toast({
        title: 'تم التسجيل بنجاح! 🎉',
        description: 'سيتم مراجعة طلبك من قبل الإدارة',
      });

      // Reload to pick up the new profile
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: 'خطأ في التسجيل',
        description: error?.message || 'حدث خطأ أثناء التسجيل',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
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
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <PlatformLogo size="lg" showText showSubtitle />
          </div>
        </div>

        <Card className="glass-eco border-0 shadow-eco-lg">
          <CardHeader className="text-center pb-2">
            {/* Google Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-xs font-medium text-foreground">{user?.email}</span>
              </div>
            </div>

            <CardTitle className="text-lg">
              {step === 1 ? 'اختر نوع المنشأة' : step === 2 ? 'بيانات المنشأة' : 'البيانات الشخصية'}
            </CardTitle>
            <CardDescription>
              الخطوة {step} من {totalSteps}
            </CardDescription>

            {/* Progress */}
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Organization Type */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <Alert className="bg-primary/5 border-primary/20">
                    <Shield className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      جميع الطلبات تخضع للمراجعة والموافقة وفقاً لسياسات المنصة
                    </AlertDescription>
                  </Alert>

                  {organizationTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChange('organizationType', type.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        formData.organizationType === type.value
                          ? 'border-primary bg-primary/5 shadow-eco-sm'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                        <type.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      {formData.organizationType === type.value && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </motion.button>
                  ))}
                  {errors.organizationType && (
                    <p className="text-sm text-destructive">{errors.organizationType}</p>
                  )}
                </motion.div>
              )}

              {/* Step 2: Organization Details */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label><Building2 className="w-3 h-3 inline ml-1" />اسم المنشأة *</Label>
                    <Input
                      value={formData.organizationName}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      placeholder="مثال: شركة النيل للصناعات"
                      className={errors.organizationName ? 'border-destructive' : ''}
                    />
                    {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label><Mail className="w-3 h-3 inline ml-1" />بريد المنشأة *</Label>
                      <Input
                        type="email"
                        value={formData.organizationEmail}
                        onChange={(e) => handleChange('organizationEmail', e.target.value)}
                        placeholder="info@company.com"
                        dir="ltr"
                        className={errors.organizationEmail ? 'border-destructive' : ''}
                      />
                      {errors.organizationEmail && <p className="text-xs text-destructive">{errors.organizationEmail}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label><Phone className="w-3 h-3 inline ml-1" />هاتف المنشأة *</Label>
                      <Input
                        value={formData.organizationPhone}
                        onChange={(e) => handleChange('organizationPhone', e.target.value)}
                        placeholder="01xxxxxxxxx"
                        dir="ltr"
                        className={errors.organizationPhone ? 'border-destructive' : ''}
                      />
                      {errors.organizationPhone && <p className="text-xs text-destructive">{errors.organizationPhone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label><MapPin className="w-3 h-3 inline ml-1" />العنوان *</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="العنوان التفصيلي"
                        className={errors.address ? 'border-destructive' : ''}
                      />
                      {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label><MapPin className="w-3 h-3 inline ml-1" />المدينة *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="القاهرة"
                        className={errors.city ? 'border-destructive' : ''}
                      />
                      {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>السجل التجاري</Label>
                      <Input
                        value={formData.commercialRegister}
                        onChange={(e) => handleChange('commercialRegister', e.target.value)}
                        placeholder="اختياري"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الترخيص البيئي</Label>
                      <Input
                        value={formData.environmentalLicense}
                        onChange={(e) => handleChange('environmentalLicense', e.target.value)}
                        placeholder="اختياري"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Personal Info + Terms */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label><User className="w-3 h-3 inline ml-1" />الاسم الكامل *</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="الاسم الكامل"
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label><Phone className="w-3 h-3 inline ml-1" />رقم الهاتف *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <Separator />

                  {/* Terms Summary */}
                  <Alert className="bg-primary/5 border-primary/20">
                    <Shield className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm space-y-2">
                      <p className="font-semibold">بالتسجيل أنت توافق على:</p>
                      <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                        <li>شروط وأحكام منصة آي ريسايكل لإدارة المخلفات</li>
                        <li>سياسة الخصوصية وحماية البيانات</li>
                        <li>الالتزام بمتطلبات جهاز تنظيم إدارة المخلفات المصري</li>
                        <li>خضوع الحساب للمراجعة والتحقق قبل التفعيل</li>
                        <li>إكمال خطوات التحقق من الهوية والوثائق القانونية</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 mt-6">
              {step > 1 && (
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
              )}
              {step < totalSteps ? (
                <Button variant="eco" onClick={nextStep} className="flex-1">
                  التالي
                  <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              ) : (
                <Button
                  variant="eco"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      تسجيل المنشأة والموافقة
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Back to login */}
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
                  navigate('/auth?mode=login');
                }}
                className="text-muted-foreground text-xs"
              >
                تسجيل الخروج والعودة لصفحة الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default GoogleSetup;
