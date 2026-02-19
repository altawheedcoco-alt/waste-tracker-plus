import { useEffect, lazy, Suspense } from 'react';
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
import { Loader2 } from 'lucide-react';
import { LazyGoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';


// Lazy load heavy dashboard components - only one renders per user role
const GeneratorDashboard = lazy(() => import('@/components/dashboard/GeneratorDashboard'));
const TransporterDashboard = lazy(() => import('@/components/dashboard/TransporterDashboard'));
const RecyclerDashboard = lazy(() => import('@/components/dashboard/RecyclerDashboard'));
const AdminDashboard = lazy(() => import('@/components/dashboard/AdminDashboard'));
const DriverDashboard = lazy(() => import('@/components/dashboard/DriverDashboard'));
const DisposalDashboard = lazy(() => import('@/components/dashboard/DisposalDashboard'));
const CallLogWidget = lazy(() => import('@/components/calls/CallLogWidget'));
const AIOperationsAssistant = lazy(() => import('@/components/ai/AIOperationsAssistant'));

// Global widgets - only loaded in dashboard context
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));
const EnhancedChatWidget = lazy(() => import('@/components/chat/EnhancedChatWidget'));
const UnifiedSupportWidget = lazy(() => import('@/components/ai/UnifiedSupportWidget'));
const BetaBanner = lazy(() => import('@/components/BetaBanner'));
const AccessibilityPanel = lazy(() => import('@/components/accessibility/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
const UnifiedFloatingMenu = lazy(() => import('@/components/layout/UnifiedFloatingMenu'));
const MobileOptimizations = lazy(() => import('@/components/mobile/MobileOptimizations'));
const PWAShortcuts = lazy(() => import('@/components/mobile/PWAShortcuts'));
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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

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
  const orgType = organization?.organization_type as string | undefined;
  const showAIAssistant = aiAssistantEnabled && (isAdmin || orgType === 'transporter' || orgType === 'recycler' || orgType === 'disposal');

  const renderDashboard = () => {
    if (isDriver) return <DriverDashboard />;
    // Admin sees the target org's dashboard when impersonating, otherwise AdminDashboard
    if (isAdmin) {
      switch (orgType) {
        case 'generator': return <GeneratorDashboard />;
        case 'transporter': return <TransporterDashboard />;
        case 'recycler': return <RecyclerDashboard />;
        case 'disposal': return <DisposalDashboard embedded />;
        default: return <AdminDashboard />;
      }
    }
    switch (orgType) {
      case 'generator': return <GeneratorDashboard />;
      case 'transporter': return <TransporterDashboard />;
      case 'recycler': return <RecyclerDashboard />;
      case 'disposal': return <DisposalDashboard embedded />;
      default: return <GeneratorDashboard />;
    }
  };

  return (
    <SubscriptionGuard>
    <LazyGoogleMapsProvider>
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
            
            <ErrorBoundary fallbackTitle="خطأ في الأدوات المساعدة">
              <Suspense fallback={null}>
                <CallLogWidget />
                {showAIAssistant && <AIOperationsAssistant />}
                <AIChatbot />
                <EnhancedChatWidget />
                <UnifiedSupportWidget />
                <UnifiedFloatingMenu />
                <BetaBanner />
                <AccessibilityPanel />
              </Suspense>
            </ErrorBoundary>
            <Suspense fallback={null}>
              <MobileOptimizations>{null}</MobileOptimizations>
              <PWAShortcuts />
              <TouchOptimizations />
            </Suspense>
          </>
        </PinVerificationGate>
    </LazyGoogleMapsProvider>
    </SubscriptionGuard>
  );
};

export default Dashboard;
