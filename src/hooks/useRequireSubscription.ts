import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { toast } from 'sonner';

/**
 * Hook to enforce subscription payment before any operation.
 * If org hasn't paid, shows error toast and redirects to subscription page.
 * 
 * Usage:
 * const { requireSubscription } = useRequireSubscription();
 * 
 * const handleCreateShipment = () => {
 *   if (!requireSubscription()) return; // blocks if not paid
 *   // ... proceed with shipment creation
 * };
 */
export const useRequireSubscription = () => {
  const navigate = useNavigate();
  const { hasActiveSubscription, isExempt, needsUpgrade, isLoading } = useSubscriptionStatus();

  // Subscription enforcement is currently disabled — always allow
  const requireSubscription = useCallback((): boolean => {
    return true;
  }, []);

  return { requireSubscription, isSubscriptionLoading: isLoading };
};
