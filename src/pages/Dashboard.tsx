import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import GeneratorDashboard from '@/components/dashboard/GeneratorDashboard';
import TransporterDashboard from '@/components/dashboard/TransporterDashboard';
import RecyclerDashboard from '@/components/dashboard/RecyclerDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import DriverDashboard from '@/components/dashboard/DriverDashboard';
import OrganizationTermsDialog from '@/components/auth/OrganizationTermsDialog';
import PagePasswordGate from '@/components/security/PagePasswordGate';
import PinVerificationGate from '@/components/security/PinVerificationGate';
import CallLogWidget from '@/components/calls/CallLogWidget';
import AIOperationsAssistant from '@/components/ai/AIOperationsAssistant';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, organization, loading, roles } = useAuth();
  const navigate = useNavigate();
  const { requiresAcceptance, loading: termsLoading, markAsAccepted, organizationType } = useTermsAcceptance();

  useEffect(() => {
    // Only redirect if we're sure the user is not logged in
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading only during initial auth check
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

  // If no user after loading, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');
  const orgType = organization?.organization_type as string | undefined;
  const showAIAssistant = isAdmin || orgType === 'transporter' || orgType === 'recycler' || orgType === 'disposal';

  const renderDashboard = () => {
    // Show admin dashboard for admin users
    if (isAdmin) {
      return <AdminDashboard />;
    }

    // Show driver dashboard for drivers
    if (isDriver) {
      return <DriverDashboard />;
    }

    // Show role-specific dashboard for other users
    switch (orgType) {
      case 'generator':
        return <GeneratorDashboard />;
      case 'transporter':
        return <TransporterDashboard />;
      case 'recycler':
        return <RecyclerDashboard />;
      case 'disposal':
        // Disposal uses a dedicated page at /dashboard/disposal
        // but also show recycler-like view here for consistency
        return <RecyclerDashboard />;
      default:
        return <GeneratorDashboard />;
    }
  };

  return (
    <PinVerificationGate>
      <>
        {/* Terms acceptance dialog for all organization types */}
        {requiresAcceptance && organizationType && (
          <OrganizationTermsDialog 
            open={requiresAcceptance} 
            onAccept={markAsAccepted}
            organizationType={organizationType}
          />
        )}
        
        <DashboardLayout>
          <PagePasswordGate>
            {renderDashboard()}
          </PagePasswordGate>
        </DashboardLayout>
        
        {/* Call Log Widget */}
        <CallLogWidget />
        
        {/* AI Operations Assistant - for transporter, recycler, admin */}
        {showAIAssistant && <AIOperationsAssistant />}
      </>
    </PinVerificationGate>
  );
};

export default Dashboard;
