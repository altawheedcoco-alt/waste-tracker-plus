import { useEffect, lazy, Suspense, useState } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PagePasswordGate from '@/components/security/PagePasswordGate';
import PinVerificationGate from '@/components/security/PinVerificationGate';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { usePlatformSetting } from '@/hooks/usePlatformSetting';
import { useSecurityHardening } from '@/hooks/useSecurityHardening';
import { usePWARealtimeSync } from '@/hooks/usePWARealtimeSync';
import { Loader2 } from 'lucide-react';

// Lazy load heavy dashboard components - only one renders per user role
const GeneratorDashboard = lazy(() => import('@/components/dashboard/GeneratorDashboard'));
const TransporterDashboard = lazy(() => import('@/components/dashboard/TransporterDashboard'));
const RecyclerDashboard = lazy(() => import('@/components/dashboard/RecyclerDashboard'));
const AdminDashboard = lazy(() => import('@/components/dashboard/AdminDashboard'));
const DriverDashboard = lazy(() => import('@/components/dashboard/DriverDashboard'));
const EmployeeDashboard = lazy(() => import('@/components/dashboard/EmployeeDashboard'));
const DisposalDashboard = lazy(() => import('@/components/dashboard/DisposalDashboard'));
const TransportOfficeDashboard = lazy(() => import('@/components/dashboard/TransportOfficeDashboard'));
const ConsultantDashboard = lazy(() => import('@/components/dashboard/ConsultantDashboard'));
const ConsultingOfficeDashboard = lazy(() => import('@/components/dashboard/ConsultingOfficeDashboard'));
const ISOBodyDashboard = lazy(() => import('@/components/dashboard/ISOBodyDashboard'));
const RegulatorDashboardNew = lazy(() => import('@/pages/dashboard/RegulatorDashboardNew'));

// Deferred widgets — loaded after main dashboard renders
const CallLogWidget = lazy(() => import('@/components/calls/CallLogWidget'));
const AIOperationsAssistant = lazy(() => import('@/components/ai/AIOperationsAssistant'));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));
const EnhancedChatWidget = lazy(() => import('@/components/chat/EnhancedChatWidget'));
const UnifiedSupportWidget = lazy(() => import('@/components/ai/UnifiedSupportWidget'));
const BetaBanner = lazy(() => import('@/components/BetaBanner'));
const AccessibilityPanel = lazy(() => import('@/components/accessibility/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
const UnifiedFloatingMenu = lazy(() => import('@/components/layout/UnifiedFloatingMenu'));
const TouchOptimizations = lazy(() => import('@/components/mobile/TouchOptimizations'));

const DashboardLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const Dashboard = () => {
  const { user, organization, loading, roles } = useAuth();
  const navigate = useNavigate();
  const { requiresAcceptance, loading: termsLoading, markAsAccepted, organizationType } = useTermsAcceptance();
  const { enabled: aiAssistantEnabled } = usePlatformSetting('ai_assistant_enabled');
  
  // Security hardening — session timeout, CSP, anti-XSS
  useSecurityHardening();
  
  // PWA: reconnect realtime + invalidate cache when app resumes from background
  usePWARealtimeSync();

  // Defer floating widgets to after main dashboard is interactive
  const [showWidgets, setShowWidgets] = useState(false);
  useEffect(() => {
    if (loading) return;
    const id = 'requestIdleCallback' in window
      ? requestIdleCallback(() => setShowWidgets(true), { timeout: 3000 })
      : setTimeout(() => setShowWidgets(true), 1500) as unknown as number;
    return () => {
      if ('cancelIdleCallback' in window) cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
    // Redirect regular employees/members to their personal workspace
    if (!loading && user && isEmployee && !isAdmin) {
      navigate('/dashboard/my-workspace', { replace: true });
    }
  }, [user, loading, navigate, roles, isEmployee, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');
  const isEmployee = roles.includes('employee') && !roles.includes('company_admin') && !isAdmin;
  const orgType = organization?.organization_type as string | undefined;
  const showAIAssistant = aiAssistantEnabled && (isAdmin || orgType === 'transporter' || orgType === 'recycler' || orgType === 'disposal' || orgType === 'transport_office');

  const renderDashboard = () => {
    if (isDriver) return <DriverDashboard />;
    if (isEmployee) return <EmployeeDashboard />;
    // Admin ALWAYS sees AdminDashboard regardless of active organization
    if (isAdmin) return <AdminDashboard />;
    switch (orgType) {
      case 'generator': return <GeneratorDashboard />;
      case 'transporter': return <TransporterDashboard />;
      case 'recycler': return <RecyclerDashboard />;
      case 'disposal': return <DisposalDashboard embedded />;
      case 'transport_office': return <TransportOfficeDashboard />;
      case 'consultant': return <ConsultantDashboard />;
      case 'consulting_office': return <ConsultingOfficeDashboard />;
      case 'iso_body': return <ISOBodyDashboard />;
      case 'regulator': return <RegulatorDashboardNew />;
      default: return <GeneratorDashboard />;
    }
  };

  return (
    <SubscriptionGuard>
        <PinVerificationGate>
          <>
            <ErrorBoundary fallbackTitle="حدث خطأ في لوحة التحكم">
              <DashboardLayout>
                <PagePasswordGate>
                  <Suspense fallback={<DashboardLoader />}>
                    {renderDashboard()}
                  </Suspense>
                </PagePasswordGate>
              </DashboardLayout>
            </ErrorBoundary>
            
            {showWidgets && (
              <ErrorBoundary fallbackTitle="خطأ في الأدوات المساعدة">
                <Suspense fallback={null}>
                  {/* Core widgets — all roles */}
                  <UnifiedFloatingMenu />
                  <UnifiedSupportWidget />
                  <BetaBanner />
                  
                  {/* Role-specific widgets */}
                  {(isAdmin || orgType === 'transporter' || orgType === 'recycler') && <CallLogWidget />}
                  {showAIAssistant && <AIOperationsAssistant />}
                  {!isDriver && <AIChatbot />}
                  {!isDriver && <EnhancedChatWidget />}
                  {!isDriver && <AccessibilityPanel />}
                </Suspense>
              </ErrorBoundary>
            )}
            {showWidgets && (
              <Suspense fallback={null}>
                <TouchOptimizations />
              </Suspense>
            )}
          </>
        </PinVerificationGate>
    </SubscriptionGuard>
  );
};

export default Dashboard;
