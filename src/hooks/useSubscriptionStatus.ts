import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isSystemAdmin: boolean;
  isExempt: boolean; // system admin = exempt
  subscription: any | null;
  isLoading: boolean;
}

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user } = useAuth();

  // Check if system admin
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

  // Check active subscription
  const { data: subscription = null, isLoading: subLoading } = useQuery({
    queryKey: ['active-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(*)')
        .eq('user_id', user.id)
        .in('status', ['active', 'grace_period'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const hasActiveSubscription = !!subscription;
  const isExempt = isSystemAdmin;

  return {
    hasActiveSubscription,
    isSystemAdmin,
    isExempt,
    subscription,
    isLoading: adminLoading || subLoading,
  };
};
