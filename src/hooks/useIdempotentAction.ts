import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface IdempotentActionParams {
  actionType: string;
  resourceType: string;
  resourceId: string;
  actionValue?: string;
}

interface UseIdempotentActionOptions {
  /** Custom message when action is already executed */
  duplicateMessage?: string;
  /** Whether to show toast on duplicate attempt */
  showToast?: boolean;
}

/**
 * Hook that prevents the same user from executing the same action twice
 * on the same resource. Uses action_execution_log table with unique constraint.
 *
 * Usage:
 * ```tsx
 * const { executeAction, wasExecuted, isChecking } = useIdempotentAction({
 *   actionType: 'accept_shipment',
 *   resourceType: 'shipment',
 *   resourceId: shipmentId,
 * });
 *
 * // In handler:
 * const ok = await executeAction(async () => {
 *   await supabase.from('shipments').update({ status: 'approved' }).eq('id', id);
 * });
 * ```
 */
export const useIdempotentAction = (
  params: IdempotentActionParams,
  options: UseIdempotentActionOptions = {}
) => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);
  const { duplicateMessage = 'تم تنفيذ هذا الإجراء مسبقاً ولا يمكن تكراره', showToast = true } = options;

  const queryKey = [
    'action-executed',
    params.actionType,
    params.resourceType,
    params.resourceId,
    params.actionValue,
  ];

  // Check if action was already executed
  const { data: wasExecuted = false, isLoading: isChecking } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.rpc('check_action_executed', {
        p_user_id: user.id,
        p_action_type: params.actionType,
        p_resource_type: params.resourceType,
        p_resource_id: params.resourceId,
        p_action_value: params.actionValue ?? null,
      });
      return !!data;
    },
    enabled: !!user?.id && !!params.resourceId,
    staleTime: 30_000,
  });

  /**
   * Execute an action with idempotency protection.
   * Returns true if executed, false if already executed (duplicate).
   */
  const executeAction = useCallback(
    async (fn: () => Promise<void>): Promise<boolean> => {
      if (!user?.id) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      if (wasExecuted) {
        if (showToast) toast.warning(duplicateMessage);
        return false;
      }

      setIsExecuting(true);
      try {
        // Try to record the action first (atomic check via unique constraint)
        const { data: recorded } = await supabase.rpc('record_action_execution', {
          p_user_id: user.id,
          p_action_type: params.actionType,
          p_resource_type: params.resourceType,
          p_resource_id: params.resourceId,
          p_action_value: params.actionValue ?? null,
          p_organization_id: organization?.id ?? null,
          p_metadata: {},
        });

        if (!recorded) {
          if (showToast) toast.warning(duplicateMessage);
          queryClient.setQueryData(queryKey, true);
          return false;
        }

        // Execute the actual action
        await fn();

        // Update cache
        queryClient.setQueryData(queryKey, true);
        return true;
      } catch (error) {
        console.error('Idempotent action error:', error);
        // If the action itself failed, remove the lock so it can be retried
        await supabase
          .from('action_execution_log')
          .delete()
          .eq('user_id', user.id)
          .eq('action_type', params.actionType)
          .eq('resource_type', params.resourceType)
          .eq('resource_id', params.resourceId);
        queryClient.setQueryData(queryKey, false);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [user?.id, organization?.id, wasExecuted, params, queryKey, queryClient, duplicateMessage, showToast]
  );

  return {
    executeAction,
    wasExecuted,
    isChecking,
    isExecuting,
    isDisabled: wasExecuted || isExecuting,
  };
};
