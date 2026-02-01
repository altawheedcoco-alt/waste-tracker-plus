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
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, organization, loading, roles } = useAuth();
  const navigate = useNavigate();
  const { requiresAcceptance, loading: termsLoading, markAsAccepted, organizationType } = useTermsAcceptance();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || termsLoading) {
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
    switch (organization?.organization_type) {
      case 'generator':
        return <GeneratorDashboard />;
      case 'transporter':
        return <TransporterDashboard />;
      case 'recycler':
        return <RecyclerDashboard />;
      default:
        return <GeneratorDashboard />;
    }
  };

  return (
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
        {renderDashboard()}
      </DashboardLayout>
    </>
  );
};

export default Dashboard;
