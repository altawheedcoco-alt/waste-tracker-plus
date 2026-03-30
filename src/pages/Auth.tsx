/**
 * صفحة المصادقة الرئيسية — Main Auth Page v5.1
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Sparkles, Shield, Zap, Globe, ArrowLeft } from 'lucide-react';
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

      const authEmail = response.data.auth_email || data.email;
      const { error: signInError } = await signIn(authEmail, data.password);
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
      {/* Side Panel */}
      <div className="hidden lg:block lg:w-[44%] xl:w-[46%] lg:h-screen lg:sticky lg:top-0">
        <AuthSidePanel />
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto auth-scroll-container relative min-h-screen">
        {/* v5.1 Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-40" style={{
            background: 'radial-gradient(ellipse at 80% 10%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, hsl(160 68% 40% / 0.05) 0%, transparent 50%)',
          }} />
          <div className="absolute top-0 left-0 w-full h-1" style={{
            background: 'linear-gradient(90deg, hsl(160 68% 40%), hsl(178 60% 38%), hsl(205 78% 42%))',
          }} />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg relative z-10"
        >
          {/* Logo Header */}
          <div className="text-center mb-5">
            <motion.div whileHover={{ scale: 1.03 }} className="inline-flex flex-col items-center gap-2">
              <PlatformLogo size="xl" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground/50">
                  Waste Management Solution Platform
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 border-primary/30 text-primary font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  v5.1
                </Badge>
              </div>
            </motion.div>
          </div>

          <Card className="border border-border/40 shadow-2xl shadow-primary/[0.06] rounded-2xl bg-card/98 backdrop-blur-sm overflow-hidden">
            {/* Top gradient accent */}
            <div className="h-1.5 w-full" style={{
              background: 'linear-gradient(90deg, hsl(160 68% 40%), hsl(178 60% 38%), hsl(205 78% 42%), hsl(160 68% 40%))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite',
            }} />
            
            <CardHeader className="text-center pb-2 pt-5">
              <div className="mb-3 pb-3 border-b border-border/20">
                <h2 className="text-base sm:text-lg font-bold text-primary tracking-wide">{t('landing.systemName')}</h2>
                <p className="text-xs sm:text-sm font-semibold text-foreground/50">{t('landing.systemNameAr')}</p>
              </div>
              <CardTitle className="text-xl font-bold">{getTitle()}</CardTitle>
              <CardDescription className="text-sm">{getDescription()}</CardDescription>
            </CardHeader>

            <CardContent className="pt-1 pb-6">
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
              <div className="mt-5 text-center">
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
                  <ArrowLeft size={14} />
                  {t('auth.backToHome')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile features grid */}
          <div className="lg:hidden mt-4 grid grid-cols-2 gap-2">
            {[
              { icon: <Zap className="w-3.5 h-3.5 text-primary" />, text: 'ذكاء اصطناعي', desc: 'تحليل فوري' },
              { icon: <Shield className="w-3.5 h-3.5 text-primary" />, text: 'حماية شاملة', desc: 'تشفير متقدم' },
              { icon: <Globe className="w-3.5 h-3.5 text-primary" />, text: 'تتبع لحظي', desc: 'GPS مباشر' },
              { icon: <Leaf className="w-3.5 h-3.5 text-primary" />, text: 'امتثال بيئي', desc: 'قانون 202' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card/80 border border-border/40 shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-foreground block">{f.text}</span>
                  <span className="text-[9px] text-muted-foreground">{f.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/40">
              © 2024-2026 iRecycle Platform · متوافق مع القانون 202/2020
            </p>
          </div>
        </motion.div>
      </div>

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default Auth;
