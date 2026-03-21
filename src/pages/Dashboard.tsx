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
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import OrganizationTermsDialog from '@/components/auth/OrganizationTermsDialog';
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
const AIOperationsAssistant = lazy(() => import('@/components/ai/AIOperationsAssistant'));
const AIChatbot = lazy(() => import('@/components/ai/AIChatbot'));
const EnhancedChatWidget = lazy(() => import('@/components/chat/EnhancedChatWidget'));
const UnifiedSupportWidget = lazy(() => import('@/components/ai/UnifiedSupportWidget'));
const BetaBanner = lazy(() => import('@/components/BetaBanner'));
const AccessibilityPanel = lazy(() => import('@/components/accessibility/AccessibilityPanel').then(m => ({ default: m.AccessibilityPanel })));
const FloatingSidePanel = lazy(() => import('@/components/layout/FloatingSidePanel'));
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
  const { isManagementMember, isCompanyAdmin: effectiveCompanyAdmin } = useMyPermissions();
  
  // Security hardening — session timeout, CSP, anti-XSS
  useSecurityHardening();
  
  // PWA: reconnect realtime + invalidate cache when app resumes from background
  usePWARealtimeSync();

  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');
  // Employee is someone with 'employee' role who is NOT a company_admin, admin, or management member
  const isEmployee = roles.includes('employee') && !roles.includes('company_admin') && !isAdmin && !isManagementMember;
  const orgType = organization?.organization_type as string | undefined;
  const showAIAssistant = aiAssistantEnabled && (isAdmin || orgType === 'transporter' || orgType === 'recycler' || orgType === 'disposal' || orgType === 'transport_office');

  // Check dashboard_mode from organization_positions
  const { data: positionDashboardMode } = useQuery({
    queryKey: ['my-dashboard-mode', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('organization_positions')
        .select('dashboard_mode')
        .eq('assigned_user_id', user.id)
        .maybeSingle();
      return (data?.dashboard_mode as string) || null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  // Defer floating widgets to after main dashboard is interactive
  const [showWidgets, setShowWidgets] = useState(false);
  useEffect(() => {
    if (loading) return;
    const id = 'requestIdleCallback' in window
      ? requestIdleCallback(() => setShowWidgets(true), { timeout: 1500 })
      : setTimeout(() => setShowWidgets(true), 800) as unknown as number;
    return () => {
      if ('cancelIdleCallback' in window) cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
    // Redirect based on dashboard_mode setting from position
    // 'workspace' = personal workspace, 'management' = full org dashboard
    if (!loading && user && !isAdmin) {
      const mode = positionDashboardMode;
      if (mode === 'workspace' || (isEmployee && mode !== 'management')) {
        navigate('/dashboard/my-workspace', { replace: true });
      }
    }
  }, [user, loading, navigate, roles, isEmployee, isAdmin, positionDashboardMode]);

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
    <>
      {/* Terms acceptance gate */}
      {requiresAcceptance && organizationType && (
        <OrganizationTermsDialog
          open={true}
          onAccept={markAsAccepted}
          organizationType={organizationType}
        />
      )}
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
    </>
  );
};

export default Dashboard;
