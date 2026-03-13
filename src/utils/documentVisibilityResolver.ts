import { supabase } from '@/integrations/supabase/client';

/**
 * Document categories for visibility control
 */
export type DocCategory = 'declarations' | 'certificates' | 'tracking' | 'receipts';

/**
 * Target party types
 */
export type TargetParty = 'generator' | 'recycler' | 'disposal';

/**
 * Visibility settings structure stored in organization_auto_actions.document_visibility_settings
 */
interface VisibilitySettings {
  to_generator?: { all?: boolean; declarations?: boolean; certificates?: boolean; tracking?: boolean; receipts?: boolean };
  to_recycler?: { all?: boolean; declarations?: boolean; certificates?: boolean; tracking?: boolean; receipts?: boolean };
  to_disposal?: { all?: boolean; declarations?: boolean; certificates?: boolean; tracking?: boolean; receipts?: boolean };
}

/**
 * Per-document visibility stored in delivery_declarations.visible_to / shipment_receipts.visible_to
 */
export interface DocumentVisibleTo {
  generator?: boolean;
  recycler?: boolean;
  disposal?: boolean;
}

/**
 * Maps declaration_type to a document category for visibility lookup.
 */
export function getDocCategory(declarationType: string): DocCategory {
  switch (declarationType) {
    case 'generator_handover':
    case 'recycler_receipt':
    case 'disposal_receipt':
    case 'transporter_transport':
      return 'declarations';
    case 'recycling_certificate':
    case 'disposal_certificate':
      return 'certificates';
    case 'driver_confirmation':
      return 'tracking';
    default:
      return 'declarations';
  }
}

/**
 * Fetches the transporter's document visibility settings.
 * Returns the full settings object, cached per request.
 */
async function fetchVisibilitySettings(transporterOrgId: string): Promise<VisibilitySettings> {
  const { data } = await supabase
    .from('organization_auto_actions')
    .select('document_visibility_settings')
    .eq('organization_id', transporterOrgId)
    .maybeSingle();

  if (!data?.document_visibility_settings) {
    // Default: everything visible
    return {
      to_generator: { all: true, declarations: true, certificates: true, tracking: true, receipts: true },
      to_recycler: { all: true, declarations: true, certificates: true, tracking: true, receipts: true },
      to_disposal: { all: true, declarations: true, certificates: true, tracking: true, receipts: true },
    };
  }

  return data.document_visibility_settings as VisibilitySettings;
}

/**
 * Resolves whether a document of a given category should be visible to a target party,
 * based on the transporter's organization-level settings.
 * 
 * Logic: master "all" toggle AND category-specific toggle must both be true.
 */
export async function resolveDocVisibility(
  transporterOrgId: string,
  category: DocCategory,
  targetParty: TargetParty,
): Promise<boolean> {
  const settings = await fetchVisibilitySettings(transporterOrgId);
  const partyKey = `to_${targetParty}` as keyof VisibilitySettings;
  const partySettings = settings[partyKey];

  if (!partySettings) return true; // Default visible

  // Master switch
  if (partySettings.all === false) return false;

  // Category-specific
  return partySettings[category] !== false;
}

/**
 * Resolves visibility for ALL parties at once for a given document.
 * Returns a DocumentVisibleTo object to store on the document.
 */
export async function resolveDocVisibilityForAllParties(
  transporterOrgId: string,
  category: DocCategory,
): Promise<DocumentVisibleTo> {
  const settings = await fetchVisibilitySettings(transporterOrgId);

  const resolve = (partyKey: keyof VisibilitySettings): boolean => {
    const ps = settings[partyKey];
    if (!ps) return true;
    if (ps.all === false) return false;
    return ps[category] !== false;
  };

  return {
    generator: resolve('to_generator'),
    recycler: resolve('to_recycler'),
    disposal: resolve('to_disposal'),
  };
}

/**
 * Determines which org IDs should receive notifications for a document,
 * based on the transporter's visibility settings and existing masking rules.
 */
export async function resolveNotificationTargets(
  transporterOrgId: string,
  category: DocCategory,
  parties: {
    generator_id?: string | null;
    transporter_id?: string | null;
    recycler_id?: string | null;
    disposal_id?: string | null;
    hide_recycler_from_generator?: boolean;
    hide_generator_from_recycler?: boolean;
  },
  excludeOrgId?: string, // The org that created the document (don't notify them)
): Promise<string[]> {
  const visibility = await resolveDocVisibilityForAllParties(transporterOrgId, category);
  const targets: string[] = [];

  // Always include transporter (unless they're the creator)
  if (parties.transporter_id && parties.transporter_id !== excludeOrgId) {
    targets.push(parties.transporter_id);
  }

  // Generator — if visible AND not masked
  if (parties.generator_id && parties.generator_id !== excludeOrgId && visibility.generator) {
    targets.push(parties.generator_id);
  }

  // Recycler — if visible AND not masked from generator context
  if (parties.recycler_id && parties.recycler_id !== excludeOrgId && visibility.recycler) {
    targets.push(parties.recycler_id);
  }

  return targets;
}
