import { supabase } from '@/integrations/supabase/client';
import { saveDocumentSignature } from '@/components/signatures/signatureService';

interface AutoSignConfig {
  id: string;
  organization_id: string;
  document_type: string;
  is_enabled: boolean;
  auto_sign: boolean;
  auto_stamp: boolean;
  default_signatory_id: string | null;
  default_signature_id: string | null;
  default_stamp_id: string | null;
  trigger_on: string;
  trigger_status: string | null;
}

/**
 * Check if auto-signature is enabled for a given org + document type + trigger
 */
export async function getAutoSignConfig(
  organizationId: string,
  documentType: string
): Promise<AutoSignConfig | null> {
  const { data, error } = await (supabase
    .from('auto_signature_settings') as any)
    .select('*')
    .eq('organization_id', organizationId)
    .eq('document_type', documentType)
    .eq('is_enabled', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as AutoSignConfig;
}

/**
 * Attempt to auto-sign a document based on org settings.
 * Returns true if auto-sign was applied, false otherwise.
 */
export async function attemptAutoSign(params: {
  organizationId: string;
  documentType: 'shipment' | 'contract' | 'invoice' | 'certificate' | 'award_letter' | 'other';
  documentId: string;
  triggerEvent: 'creation' | 'approval' | 'status_change';
  triggerStatus?: string;
  userId: string;
}): Promise<{ applied: boolean; signatureId?: string; sealNumber?: string }> {
  try {
    const config = await getAutoSignConfig(params.organizationId, params.documentType);
    if (!config) return { applied: false };

    // Check trigger match
    if (config.trigger_on !== params.triggerEvent) return { applied: false };
    if (config.trigger_status && config.trigger_status !== params.triggerStatus) return { applied: false };

    // Get signatory info
    let signerName = '';
    let signerTitle = '';
    let signerNationalId = '';
    let signatureImageUrl = '';

    if (config.default_signatory_id) {
      const { data: signatory } = await supabase
        .from('authorized_signatories')
        .select('full_name, job_title, national_id, signature_image_url')
        .eq('id', config.default_signatory_id)
        .eq('is_active', true)
        .single();

      if (!signatory) {
        console.warn('Auto-sign: default signatory not found or inactive');
        return { applied: false };
      }

      signerName = signatory.full_name;
      signerTitle = signatory.job_title || '';
      signerNationalId = signatory.national_id || '';
      signatureImageUrl = signatory.signature_image_url || '';
    }

    // Get org signature image if configured
    if (config.default_signature_id) {
      const { data: sig } = await (supabase
        .from('organization_signatures') as any)
        .select('signature_image_url, signer_name, signer_position')
        .eq('id', config.default_signature_id)
        .single();

      if (sig) {
        signatureImageUrl = sig.signature_image_url || signatureImageUrl;
        signerName = signerName || sig.signer_name || '';
        signerTitle = signerTitle || sig.signer_position || '';
      }
    }

    // Get stamp if configured
    let stampImageUrl: string | null = null;
    if (config.auto_stamp && config.default_stamp_id) {
      const { data: stamp } = await (supabase
        .from('organization_stamps') as any)
        .select('stamp_image_url')
        .eq('id', config.default_stamp_id)
        .single();

      if (stamp) {
        stampImageUrl = stamp.stamp_image_url;
      }
    }

    if (!config.auto_sign && !config.auto_stamp) return { applied: false };

    // Apply auto-signature
    const result = await saveDocumentSignature({
      signatureData: {
        method: 'click' as const,
        signerName: signerName || 'توقيع تلقائي',
        signerTitle: signerTitle,
        signerNationalId: signerNationalId,
        signatureImageUrl: signatureImageUrl || undefined,
        signatureText: `توقيع تلقائي — ${signerName}`,
        stampApplied: config.auto_stamp && !!stampImageUrl,
        stampImageUrl: stampImageUrl || undefined,
      },
      documentType: params.documentType,
      documentId: params.documentId,
      organizationId: params.organizationId,
      userId: params.userId,
    });

    if (result.success) {
      // Log auto-sign event
      await supabase.from('activity_logs').insert({
        action: 'auto_signature_applied',
        action_type: 'auto_sign',
        user_id: params.userId,
        organization_id: params.organizationId,
        resource_type: params.documentType,
        resource_id: params.documentId,
        details: {
          signatory_id: config.default_signatory_id,
          signature_id: config.default_signature_id,
          stamp_id: config.default_stamp_id,
          trigger: params.triggerEvent,
          auto_sign: config.auto_sign,
          auto_stamp: config.auto_stamp,
        },
      });

      console.log(`Auto-sign applied: ${params.documentType}/${params.documentId}`);
      return { applied: true, signatureId: result.signatureId, sealNumber: result.sealNumber };
    }

    return { applied: false };
  } catch (err) {
    console.error('Auto-sign error:', err);
    return { applied: false };
  }
}

/**
 * Fetch all auto-sign settings for an organization
 */
export async function getOrgAutoSignSettings(organizationId: string): Promise<AutoSignConfig[]> {
  const { data, error } = await (supabase
    .from('auto_signature_settings') as any)
    .select('*')
    .eq('organization_id', organizationId)
    .order('document_type');

  if (error) {
    console.error('Fetch auto-sign settings error:', error);
    return [];
  }
  return (data || []) as AutoSignConfig[];
}

/**
 * Save/update auto-sign setting for a specific document type
 */
export async function saveAutoSignSetting(setting: Partial<AutoSignConfig> & { organization_id: string; document_type: string }): Promise<boolean> {
  const { data: existing } = await (supabase
    .from('auto_signature_settings') as any)
    .select('id')
    .eq('organization_id', setting.organization_id)
    .eq('document_type', setting.document_type)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await (supabase
      .from('auto_signature_settings') as any)
      .update(setting)
      .eq('id', existing.id));
  } else {
    ({ error } = await (supabase
      .from('auto_signature_settings') as any)
      .insert(setting));
  }

  if (error) {
    console.error('Save auto-sign setting error:', error);
    return false;
  }
  return true;
}
