import { supabase } from '@/integrations/supabase/client';
import type { MovementSupervisorEntry } from '@/components/shipments/MovementSupervisorSelector';

interface PartyInfo {
  role: 'generator' | 'transporter' | 'recycler' | 'disposal';
  organizationId: string | null;
}

/**
 * Auto-assign movement supervisors after shipment creation.
 * First checks if explicit entries were provided, then falls back to org defaults.
 */
export async function autoAssignMovementSupervisors(
  shipmentId: string,
  parties: PartyInfo[],
  explicitEntries?: Record<string, MovementSupervisorEntry[]>,
) {
  const inserts: any[] = [];

  for (const party of parties) {
    if (!party.organizationId || party.organizationId.startsWith('manual:')) continue;

    const explicit = explicitEntries?.[party.role];
    if (explicit?.length) {
      // Use explicitly provided entries
      for (const entry of explicit) {
        inserts.push({
          shipment_id: shipmentId,
          organization_id: party.organizationId,
          party_role: party.role,
          supervisor_type: entry.supervisor_type,
          user_id: entry.user_id || null,
          supervisor_name: entry.supervisor_name || null,
          supervisor_phone: entry.supervisor_phone || null,
          supervisor_email: entry.supervisor_email || null,
          supervisor_position: entry.supervisor_position || null,
        });
      }
    } else {
      // Fall back to org defaults
      const { data: defaults } = await supabase
        .from('organization_movement_supervisors')
        .select('*')
        .eq('organization_id', party.organizationId)
        .eq('is_active', true);

      if (defaults?.length) {
        for (const d of defaults) {
          inserts.push({
            shipment_id: shipmentId,
            organization_id: party.organizationId,
            party_role: party.role,
            supervisor_type: d.supervisor_type,
            user_id: d.user_id || null,
            supervisor_name: d.supervisor_name || null,
            supervisor_phone: d.supervisor_phone || null,
            supervisor_email: d.supervisor_email || null,
            supervisor_position: d.supervisor_position || null,
          });
        }
      }
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase
      .from('shipment_movement_supervisors')
      .insert(inserts);
    if (error) console.error('Auto movement supervisors error:', error);
  }
}
