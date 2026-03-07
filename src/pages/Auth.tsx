/**
 * صفحة المصادقة الرئيسية — Main Auth Page
 * تم إعادة هيكلتها لتكون نظيفة ومكونات مستقلة
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf } from 'lucide-react';
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
          email: data.email, password: data.password, fullName: data.fullName,
          phone: data.phone, organizationType: data.organizationType,
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

  // Get card title/description based on state
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
    <div className="min-h-screen-safe flex flex-col lg:flex-row overflow-hidden">
      {/* Side Panel */}
      <div className="hidden lg:block lg:w-[45%] xl:w-[48%]">
        <AuthSidePanel />
      </div>

      {/* Form Panel */}
      <div className="flex-1 bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 sm:p-6 overflow-y-auto auth-scroll-container relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/[0.06] rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-eco-emerald/[0.06] rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-5">
            <motion.div whileHover={{ scale: 1.05 }} className="inline-flex flex-col items-center gap-1.5">
              <PlatformLogo size="xl" />
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-muted-foreground/50">
                Waste Management System v2.0
              </span>
            </motion.div>
          </div>

          <Card className="border border-border/40 shadow-xl shadow-primary/[0.03] rounded-2xl bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-3 pt-6">
              <div className="mb-3 pb-3 border-b border-border/30">
                <h2 className="text-base sm:text-lg font-bold text-primary tracking-wide">{t('landing.systemName')}</h2>
                <p className="text-xs sm:text-sm font-semibold text-foreground/60">{t('landing.systemNameAr')}</p>
              </div>
              <CardTitle className="text-xl">{getTitle()}</CardTitle>
              <CardDescription className="text-sm">{getDescription()}</CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-6">
              <AnimatePresence mode="wait">
                {/* Login */}
                {authMode === 'login' && (
                  <LoginForm onSwitchToRegister={() => { setAuthMode('register'); setRegistrationType(null); }} />
                )}

                {/* Registration Type Selection */}
                {authMode === 'register' && !registrationType && (
                  <RegistrationTypeSelector onSelect={(type) => setRegistrationType(type)} />
                )}

                {/* Company / Consultant / ISO Registration */}
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

                {/* Job Seeker */}
                {authMode === 'register' && registrationType === 'jobseeker' && (
                  <JobSeekerRegistrationForm onBack={() => setRegistrationType(null)} />
                )}

                {/* Driver */}
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
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground/60 hover:text-muted-foreground text-xs">
                  <Leaf className="ml-1.5" size={14} />
                  {t('auth.backToHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
