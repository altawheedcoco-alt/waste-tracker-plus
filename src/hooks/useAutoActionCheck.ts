import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AutoActionKey } from '@/hooks/useAutoActions';

/**
 * Lightweight hook to check if a specific auto-action is enabled for an organization.
 * Used by business logic components to gate automated behavior.
 * 
 * Usage:
 *   const { checkAction } = useAutoActionCheck();
 *   const enabled = await checkAction(orgId, 'auto_whatsapp_notifications');
 */
export const useAutoActionCheck = () => {
  const checkAction = useCallback(async (
    organizationId: string | undefined,
    actionKey: AutoActionKey
  ): Promise<boolean> => {
    if (!organizationId) return true; // Default enabled if no org

    try {
      const { data } = await (supabase
        .from('organization_auto_actions' as any)
        .select(`all_actions_enabled, ${actionKey}`)
        .eq('organization_id', organizationId)
        .maybeSingle() as any);

      if (!data) return true; // Default enabled if no settings row
      if (!data.all_actions_enabled) return false; // Master toggle off
      return data[actionKey] ?? true;
    } catch {
      return true; // Default enabled on error
    }
  }, []);

  const checkMultipleActions = useCallback(async (
    organizationId: string | undefined,
    actionKeys: AutoActionKey[]
  ): Promise<Record<AutoActionKey, boolean>> => {
    const result = {} as Record<AutoActionKey, boolean>;
    actionKeys.forEach(k => { result[k] = true; });

    if (!organizationId) return result;

    try {
      const cols = ['all_actions_enabled', ...actionKeys].join(', ');
      const { data } = await (supabase
        .from('organization_auto_actions' as any)
        .select(cols)
        .eq('organization_id', organizationId)
        .maybeSingle() as any);

      if (!data) return result;
      
      actionKeys.forEach(k => {
        result[k] = data.all_actions_enabled ? (data[k] ?? true) : false;
      });
      return result;
    } catch {
      return result;
    }
  }, []);

  return { checkAction, checkMultipleActions };
};
