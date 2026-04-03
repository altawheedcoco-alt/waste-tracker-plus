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
  const { organization, loading, user } = useAuth();
  const location = useLocation();

  // Don't guard non-dashboard routes
  if (!location.pathname.startsWith('/dashboard')) {
    return <>{children}</>;
  }

  // Still loading auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in — let auth guard handle
  if (!user) {
    return <>{children}</>;
  }

  // Allow access to pending page, settings, profile
  const allowedPaths = ['/dashboard/pending-activation', '/dashboard/settings', '/dashboard/profile'];
  if (allowedPaths.some(p => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // Check if organization is active
  if (organization && organization.status !== 'active' && organization.status !== 'approved') {
    return <Navigate to="/dashboard/pending-activation" replace />;
  }

  return <>{children}</>;
};

export default AccountActivationGuard;
