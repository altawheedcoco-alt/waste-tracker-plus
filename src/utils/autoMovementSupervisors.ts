import { supabase } from '@/integrations/supabase/client';
import type { MovementSupervisorEntry } from '@/components/shipments/MovementSupervisorSelector';

interface PartyInfo {
  role: 'generator' | 'transporter' | 'recycler' | 'disposal';
  organizationId: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  generator: 'المولدة',
  transporter: 'الناقلة',
  recycler: 'المدورة',
  disposal: 'التخلص',
};

/**
 * Generate a default AI digital-identity supervisor entry
 * when no explicit or org-default supervisor exists.
 */
function createDefaultAISupervisor(role: string): Partial<MovementSupervisorEntry> {
  return {
    supervisor_type: 'ai',
    supervisor_name: `مراقب رقمي - ${ROLE_LABELS[role] || role}`,
    supervisor_phone: null,
    supervisor_email: null,
    supervisor_position: 'مراقب حركة تلقائي',
  };
}

/**
 * Auto-assign movement supervisors after shipment creation.
 * Priority: explicit entries > org defaults > auto-generated AI digital identity.
 * Shipments are NEVER blocked by the absence of a supervisor.
 */
export async function autoAssignMovementSupervisors(
  shipmentId: string,
  parties: PartyInfo[],
  explicitEntries?: Record<string, MovementSupervisorEntry[]>,
) {
  const inserts: any[] = [];

  for (const party of parties) {
    if (!party.organizationId) continue;
    const isManual = party.organizationId.startsWith('manual:');

    const explicit = explicitEntries?.[party.role];
    if (explicit?.length) {
      // Use explicitly provided entries
      for (const entry of explicit) {
        inserts.push({
          shipment_id: shipmentId,
          organization_id: isManual ? null : party.organizationId,
          party_role: party.role,
          supervisor_type: entry.supervisor_type,
          user_id: entry.user_id || null,
          supervisor_name: entry.supervisor_name || null,
          supervisor_phone: entry.supervisor_phone || null,
          supervisor_email: entry.supervisor_email || null,
          supervisor_position: entry.supervisor_position || null,
        });
      }
    } else if (!isManual) {
      // Try org defaults
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
      } else {
        // Fallback: auto-create AI digital identity supervisor
        const ai = createDefaultAISupervisor(party.role);
        inserts.push({
          shipment_id: shipmentId,
          organization_id: party.organizationId,
          party_role: party.role,
          supervisor_type: ai.supervisor_type,
          user_id: null,
          supervisor_name: ai.supervisor_name,
          supervisor_phone: null,
          supervisor_email: null,
          supervisor_position: ai.supervisor_position,
        });
      }
    } else {
      // Manual party — still assign AI digital identity
      const ai = createDefaultAISupervisor(party.role);
      inserts.push({
        shipment_id: shipmentId,
        organization_id: null,
        party_role: party.role,
        supervisor_type: ai.supervisor_type,
        user_id: null,
        supervisor_name: ai.supervisor_name,
        supervisor_phone: null,
        supervisor_email: null,
        supervisor_position: ai.supervisor_position,
      });
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase
      .from('shipment_movement_supervisors')
      .insert(inserts);
    if (error) console.error('Auto movement supervisors error:', error);
  }
}
