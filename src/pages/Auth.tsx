/**
 * صفحة المصادقة الرئيسية — Main Auth Page v3.0
 * تم إعادة هيكلتها لتكون نظيفة ومكونات مستقلة
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PlatformLogo from '@/components/common/PlatformLogo';
import AuthSidePanel from '@/components/auth/AuthSidePanel';
import LoginForm from '@/components/auth/LoginForm';
import RegistrationTypeSelector from '@/components/auth/RegistrationTypeSelector';
import DriverRegistrationForm from '@/components/auth/DriverRegistrationForm';
import JobSeekerRegistrationForm from '@/components/auth/JobSeekerRegistrationForm';
import CompanyRegistrationForm, { CompanyFormData } from '@/components/auth/CompanyRegistrationForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type RegistrationType = 'company' | 'driver' | 'jobseeker' | 'consultant' | 'consulting_office' | 'iso_body' | null;
type AuthMode = 'login' | 'register';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const initialType = searchParams.get('type');
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

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
  const [registrationType, setRegistrationType] = useState<RegistrationType>(getInitialRegistrationType());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleCompanySignUp = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('register-company', {
        body: {
          email: data.email || null, password: data.password, fullName: data.fullName,
          phone: data.phone, organizationType: data.organizationType,
          registrationMethod: data.email ? 'email' : 'phone',
          organizationName: data.organizationName, organizationNameEn: data.organizationNameEn,
          organizationEmail: data.organizationEmail, organizationPhone: data.organizationPhone,
          secondaryPhone: data.secondaryPhone, address: data.address, city: data.city,
          region: data.region, commercialRegister: data.commercialRegister,
          environmentalLicense: data.environmentalLicense, activityType: data.activityType,
          productionCapacity: data.productionCapacity,
          representativeName: data.representativeName, representativePosition: data.representativePosition,
          representativePhone: data.representativePhone, representativeEmail: data.representativeEmail,
          representativeNationalId: data.representativeNationalId,
          delegateName: data.delegateName, delegatePhone: data.delegatePhone,
          delegateEmail: data.delegateEmail, delegateNationalId: data.delegateNationalId,
          agentName: data.agentName, agentPhone: data.agentPhone,
          agentEmail: data.agentEmail, agentNationalId: data.agentNationalId,
        },
      });
      if (response.error) throw new Error(response.data?.error || response.error?.message || 'حدث خطأ');
      if (!response.data?.success) throw new Error(response.data?.error || 'فشل إنشاء الشركة');

      const { error: signInError } = await signIn(data.email, data.password);
      if (signInError) throw signInError;
      navigate('/dashboard');
      return { error: null };
    } catch (error: any) {
      toast({ title: t('auth.registerError'), description: error?.message || t('common.error'), variant: 'destructive' });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (authMode === 'login') return t('auth.login');
    if (!registrationType) return t('auth.newAccount');
    if (registrationType === 'jobseeker') return 'تسجيل باحث عن عمل';
    if (registrationType === 'driver') return t('auth.driverRegistration');
    return t('auth.registerCompany');
  };

  const getDescription = () => {
    if (authMode === 'login') return t('auth.enterCredentials');
    if (!registrationType) return t('auth.chooseAccountType');
    if (registrationType === 'jobseeker') return 'أدخل بياناتك الأساسية فقط';
    if (registrationType === 'driver') return 'بيانات شخصية وبيانات المركبة';
    return t('auth.completeLegalData');
  };

  const isCompanyType = registrationType === 'company' || registrationType === 'consultant' ||
    registrationType === 'consulting_office' || registrationType === 'iso_body';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Side Panel - fixed height */}
      <div className="hidden lg:block lg:w-[44%] xl:w-[46%] lg:h-screen lg:sticky lg:top-0">
        <AuthSidePanel />
      </div>

      {/* Form Panel - scrollable */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto auth-scroll-container relative min-h-screen">
        {/* v3.0 Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full opacity-50" style={{
            background: 'radial-gradient(ellipse at 80% 20%, hsl(160, 68%, 40%, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, hsl(205, 78%, 42%, 0.05) 0%, transparent 50%)',
          }} />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-muted/30 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <motion.div whileHover={{ scale: 1.05 }} className="inline-flex flex-col items-center gap-2">
              <PlatformLogo size="xl" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground/40">
                  Waste Management System
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-[9px] font-bold text-primary tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  v3.0
                </span>
              </div>
            </motion.div>
          </div>

          <Card className="border border-border/30 shadow-2xl shadow-primary/[0.04] rounded-2xl bg-card/98 backdrop-blur-sm overflow-hidden">
            {/* Top accent gradient */}
            <div className="h-1 w-full" style={{
              background: 'linear-gradient(90deg, hsl(160, 68%, 40%), hsl(178, 60%, 38%), hsl(205, 78%, 42%))',
            }} />
            
            <CardHeader className="text-center pb-3 pt-6">
              <div className="mb-3 pb-3 border-b border-border/20">
                <h2 className="text-base sm:text-lg font-bold text-primary tracking-wide">{t('landing.systemName')}</h2>
                <p className="text-xs sm:text-sm font-semibold text-foreground/50">{t('landing.systemNameAr')}</p>
              </div>
              <CardTitle className="text-xl font-bold">{getTitle()}</CardTitle>
              <CardDescription className="text-sm">{getDescription()}</CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-6">
              <AnimatePresence mode="wait">
                {authMode === 'login' && (
                  <LoginForm onSwitchToRegister={() => { setAuthMode('register'); setRegistrationType(null); }} />
                )}
                {authMode === 'register' && !registrationType && (
                  <RegistrationTypeSelector onSelect={(type) => setRegistrationType(type)} />
                )}
                {authMode === 'register' && isCompanyType && (
                  <motion.div key="company-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <CompanyRegistrationForm
                      onSubmit={handleCompanySignUp}
                      onBack={() => setRegistrationType(null)}
                      defaultOrgType={
                        initialType && ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office', 'iso_body'].includes(initialType)
                          ? initialType
                          : (registrationType !== 'company' ? registrationType || undefined : undefined)
                      }
                    />
                  </motion.div>
                )}
                {authMode === 'register' && registrationType === 'jobseeker' && (
                  <JobSeekerRegistrationForm onBack={() => setRegistrationType(null)} />
                )}
                {authMode === 'register' && registrationType === 'driver' && (
                  <DriverRegistrationForm onBack={() => setRegistrationType(null)} />
                )}
              </AnimatePresence>

              {/* Toggle login/signup */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (authMode === 'login') {
                      setAuthMode('register');
                      setRegistrationType(null);
                    } else {
                      setAuthMode('login');
                      setRegistrationType(null);
                    }
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {authMode === 'login' ? (
                    <>{t('auth.noAccount')} <span className="text-primary font-semibold">{t('auth.signUpNow')}</span></>
                  ) : (
                    <>{t('auth.hasAccount')} <span className="text-primary font-semibold">{t('auth.login')}</span></>
                  )}
                </button>
              </div>

              {/* Back to home */}
              <div className="mt-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground/50 hover:text-muted-foreground text-xs gap-1.5">
                  <Leaf size={14} />
                  {t('auth.backToHome')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile-only: mini features */}
          <div className="lg:hidden mt-4 grid grid-cols-2 gap-2">
            {[
              { icon: '♻️', text: 'إدارة ذكية' },
              { icon: '🔒', text: 'حماية شاملة' },
              { icon: '📊', text: 'تقارير متقدمة' },
              { icon: '🚛', text: 'تتبع لحظي' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/30">
                <span className="text-sm">{f.icon}</span>
                <span className="text-[11px] font-medium text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
