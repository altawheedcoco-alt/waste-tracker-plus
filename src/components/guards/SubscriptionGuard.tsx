import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CreditCard, Crown, Loader2, Users, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const EXEMPT_ROUTES = ['/dashboard/subscription', '/dashboard/settings'];

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  // Subscription enforcement is currently disabled
  return <>{children}</>;
};

export default SubscriptionGuard;
