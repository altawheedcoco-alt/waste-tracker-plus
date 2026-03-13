import { supabase } from '@/integrations/supabase/client';
import type { AutoActionKey } from '@/hooks/useAutoActions';

/**
 * Standalone (non-hook) utility to check if an auto-action is enabled.
 * Used by utility functions that run outside React component context.
 */
export async function isAutoActionEnabled(
  organizationId: string | undefined,
  actionKey: AutoActionKey
): Promise<boolean> {
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
}
