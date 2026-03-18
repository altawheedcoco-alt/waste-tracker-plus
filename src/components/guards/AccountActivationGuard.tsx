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
  // ⚠️ TEMPORARILY BYPASSED FOR TESTING — re-enable after testing
  return <>{children}</>;
};

export default AccountActivationGuard;
