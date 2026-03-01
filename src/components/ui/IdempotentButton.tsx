import { useState, useCallback, ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ban, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IdempotentButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Unique action identifier e.g. 'accept_shipment' */
  actionType: string;
  /** Resource type e.g. 'shipment', 'invoice', 'document' */
  resourceType: string;
  /** The specific resource ID */
  resourceId: string;
  /** Optional action value e.g. 'approved' for status changes */
  actionValue?: string;
  /** The actual click handler */
  onExecute: () => Promise<void>;
  /** Custom duplicate message */
  duplicateMessage?: string;
  /** Content to show when already executed */
  executedLabel?: ReactNode;
  children: ReactNode;
}

/**
 * Drop-in replacement for Button that prevents the same user
 * from executing the same action twice on the same resource.
 * 
 * Usage:
 * ```tsx
 * <IdempotentButton
 *   actionType="accept_shipment"
 *   resourceType="shipment"
 *   resourceId={shipment.id}
 *   onExecute={async () => { ... }}
 * >
 *   قبول
 * </IdempotentButton>
 * ```
 */
const IdempotentButton = ({
  actionType,
  resourceType,
  resourceId,
  actionValue,
  onExecute,
  duplicateMessage = 'تم تنفيذ هذا الإجراء مسبقاً',
  executedLabel,
  children,
  disabled,
  ...buttonProps
}: IdempotentButtonProps) => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState(false);

  const queryKey = ['action-executed', actionType, resourceType, resourceId, actionValue];

  const { data: wasExecuted = false } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id || !resourceId) return false;
      const { data } = await supabase.rpc('check_action_executed', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_action_value: actionValue ?? null,
      });
      return !!data;
    },
    enabled: !!user?.id && !!resourceId,
    staleTime: 60_000,
  });

  const handleClick = useCallback(async () => {
    if (!user?.id || wasExecuted || isExecuting) {
      if (wasExecuted) toast.warning(duplicateMessage);
      return;
    }

    setIsExecuting(true);
    try {
      // Record execution atomically
      const { data: recorded } = await supabase.rpc('record_action_execution', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_action_value: actionValue ?? null,
        p_organization_id: organization?.id ?? null,
        p_metadata: {},
      });

      if (!recorded) {
        toast.warning(duplicateMessage);
        queryClient.setQueryData(queryKey, true);
        return;
      }

      await onExecute();
      queryClient.setQueryData(queryKey, true);
    } catch (error) {
      // Rollback the lock on failure
      await supabase
        .from('action_execution_log')
        .delete()
        .eq('user_id', user.id)
        .eq('action_type', actionType)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId);
      queryClient.setQueryData(queryKey, false);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [user?.id, organization?.id, wasExecuted, isExecuting, actionType, resourceType, resourceId, actionValue, onExecute, queryClient, queryKey, duplicateMessage]);

  if (wasExecuted) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button {...buttonProps} disabled className="opacity-50 gap-1">
              <Ban className="w-3 h-3" />
              {executedLabel || children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{duplicateMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      {...buttonProps}
      disabled={disabled || isExecuting}
      onClick={handleClick}
    >
      {isExecuting && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
      {children}
    </Button>
  );
};

export default IdempotentButton;
