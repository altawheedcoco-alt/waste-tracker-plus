import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, profile, organization, roles } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin always bypasses activation check
  const isAdmin = roles.includes('admin');
  if (isAdmin) {
    return <>{children}</>;
  }

  // Skip check if we're already on the pending page
  if (location.pathname === '/account-pending') {
    return <>{children}</>;
  }

  // Check if account is active
  // For org users: both profile and org must be active
  // For non-org users (jobseeker): profile must be active
  if (profile) {
    const profileActive = profile.is_active;
    const orgActive = organization ? (organization.is_active && organization.is_verified) : true;
    
    if (!profileActive || !orgActive) {
      return <Navigate to="/account-pending" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
