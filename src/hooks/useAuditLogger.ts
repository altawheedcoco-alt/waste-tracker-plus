/**
 * useAuditLogger — Centralized audit logging utility
 * Ensures all critical operations are logged to activity_logs
 */

import { supabase } from '@/integrations/supabase/client';

type AuditAction =
  | 'shipment_created' | 'shipment_status_changed' | 'shipment_deleted'
  | 'fuel_record_added' | 'fuel_record_deleted'
  | 'license_updated' | 'license_expired'
  | 'partnership_created' | 'partnership_accepted' | 'partnership_rejected'
  | 'document_uploaded' | 'document_deleted'
  | 'member_added' | 'member_removed' | 'member_role_changed'
  | 'compliance_report_generated' | 'ai_analysis_requested'
  | 'invoice_created' | 'deposit_added'
  | 'driver_assigned' | 'driver_unassigned'
  | 'vehicle_added' | 'vehicle_updated'
  | 'settings_changed' | 'profile_updated';

interface AuditLogEntry {
  action: AuditAction;
  actionType: 'create' | 'update' | 'delete' | 'read' | 'export';
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  organizationId?: string;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: entry.action,
      action_type: entry.actionType,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId || null,
      details: entry.details || null,
      organization_id: entry.organizationId || null,
      ip_address: null,
      user_agent: navigator.userAgent,
    });
  } catch (err) {
    // Silent fail — audit logging should never break the main flow
    console.warn('Audit log failed:', err);
  }
}

/**
 * Hook wrapper for components
 */
export function useAuditLogger() {
  return { logAudit };
}
