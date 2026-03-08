/**
 * AccountActivationGuard — يتحقق من حالة تفعيل الحساب على مستوى التطبيق
 * يعيد توجيه المستخدمين غير المفعلين إلى صفحة الانتظار عند محاولة الوصول للداشبورد
 */
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const AccountActivationGuard = ({ children }: Props) => {
  const { user, loading, profile, organization, roles } = useAuth();
  const location = useLocation();

  // Only guard dashboard routes
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  if (!isDashboardRoute) {
    return <>{children}</>;
  }

  // Still loading auth
  if (loading) {
    return <>{children}</>;
  }

  // Not logged in — let ProtectedRoute handle redirect
  if (!user) {
    return <>{children}</>;
  }

  // Admin always bypasses
  if (roles.includes('admin')) {
    return <>{children}</>;
  }

  // Profile not loaded yet — wait
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Check activation status
  const profileActive = profile.is_active;
  const orgActive = organization ? (organization.is_active && organization.is_verified) : true;

  if (!profileActive || !orgActive) {
    return <Navigate to="/account-pending" replace />;
  }

  return <>{children}</>;
};

export default AccountActivationGuard;
