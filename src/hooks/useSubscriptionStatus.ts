import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ArrearsInfo {
  months_overdue: number;
  monthly_rate: number;
  seats: number;
  subtotal: number;
  penalty_rate: number;
  penalty_amount: number;
  total_due: number;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isSystemAdmin: boolean;
  isExempt: boolean;
  subscription: any | null;
  isLoading: boolean;
  requiredSeats: number;
  linkedOrgsCount: number;
  totalCost: number;
  planPrice: number;
  needsUpgrade: boolean;
  hasArrears: boolean;
  arrears: ArrearsInfo | null;
}

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user, organization } = useAuth();

  const { data: isSystemAdmin = false, isLoading: adminLoading } = useQuery({
    queryKey: ['is-system-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('has_role' as any, {
        _user_id: user.id,
        _role: 'admin',
      });
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subscription = null, isLoading: subLoading } = useQuery({
    queryKey: ['active-subscription', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('organization_id', organization.id)
        .in('status', ['active', 'grace_period'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!organization?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: requiredSeats = 1, isLoading: seatsLoading } = useQuery({
    queryKey: ['required-seats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 1;
      const { data } = await supabase.rpc('calculate_org_required_seats' as any, {
        org_id: organization.id,
      });
      return (data as number) || 1;
    },
    enabled: !!organization?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Calculate arrears if no active subscription
  const { data: arrears = null, isLoading: arrearsLoading } = useQuery({
    queryKey: ['org-arrears', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase.rpc('calculate_org_arrears' as any, {
        org_id: organization.id,
      });
      return data as ArrearsInfo | null;
    },
    enabled: !!organization?.id && !subscription,
    staleTime: 5 * 60 * 1000,
  });

  const hasActiveSubscription = !!subscription;
  const linkedOrgsCount = requiredSeats - 1;
  const planPrice = subscription?.plan?.price_egp || 0;
  const totalCost = planPrice * requiredSeats;
  const paidSeats = subscription?.total_seats || 0;
  const needsUpgrade = hasActiveSubscription && paidSeats < requiredSeats;
  const hasArrears = !!arrears && (arrears.months_overdue || 0) > 0;

  const isPreviewMode = window.location.hostname.includes('lovableproject.com') || 
                        window.location.hostname.includes('lovable.app') ||
                        window.location.hostname === 'localhost';
  const isExempt = isSystemAdmin || isPreviewMode;

  return {
    hasActiveSubscription: hasActiveSubscription && !needsUpgrade,
    isSystemAdmin,
    isExempt,
    subscription,
    isLoading: adminLoading || subLoading || seatsLoading || arrearsLoading,
    requiredSeats,
    linkedOrgsCount,
    totalCost,
    planPrice,
    needsUpgrade,
    hasArrears,
    arrears,
  };
};
