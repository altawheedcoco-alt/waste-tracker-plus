import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SignatureData } from './UniversalSignatureDialog';

interface SaveSignatureParams {
  signatureData: SignatureData;
  documentType: 'shipment' | 'contract' | 'invoice' | 'certificate' | 'award_letter' | 'other';
  documentId: string;
  organizationId: string;
  userId: string;
}

/**
 * Upload a signature image (drawn or uploaded) to storage and return the public URL.
 * If the signature is a data URL (base64), it will be converted to a blob and uploaded.
 */
async function uploadSignatureImage(dataUrl: string, userId: string, docId: string): Promise<string | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `signatures/${userId}/${docId}-${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, blob, { contentType: 'image/png', upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Signature upload failed:', err);
    return null;
  }
}

/**
 * Generate a simple SHA-256 hash for document integrity
 */
async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Save a signature to the database with full audit trail
 */
export async function saveDocumentSignature({
  signatureData,
  documentType,
  documentId,
  organizationId,
  userId,
}: SaveSignatureParams): Promise<{ success: boolean; signatureId?: string; sealNumber?: string }> {
  try {
    // Upload signature image if draw/upload method
    let signatureImageUrl = signatureData.signatureImageUrl || null;
    if (signatureData.method === 'draw' || signatureData.method === 'upload') {
      if (signatureData.signatureImageUrl) {
        const uploaded = await uploadSignatureImage(signatureData.signatureImageUrl, userId, documentId);
        if (uploaded) signatureImageUrl = uploaded;
      }
    }

    // Generate document hash
    const docContent = `${documentType}:${documentId}:${organizationId}:${userId}:${Date.now()}`;
    const documentHash = await generateHash(docContent);
    const signatureHash = await generateHash(`${documentHash}:${signatureData.method}:${signatureData.signerName}`);

    // Get user agent and IP info
    const userAgent = navigator.userAgent;
    const deviceInfo = `${navigator.platform} | ${navigator.language}`;

    // Insert signature record
    const { data: sigRecord, error: sigError } = await supabase
      .from('document_signatures')
      .insert({
        document_type: documentType,
        document_id: documentId,
        organization_id: organizationId,
        signed_by: userId,
        signer_name: signatureData.signerName,
        signer_role: signatureData.signerTitle || null,
        signer_title: signatureData.signerTitle || null,
        signer_national_id: signatureData.signerNationalId || null,
        signature_method: signatureData.method,
        signature_image_url: signatureImageUrl,
        signature_text: signatureData.signatureText || null,
        stamp_applied: signatureData.stampApplied,
        stamp_image_url: signatureData.stampApplied ? (signatureData.stampImageUrl || null) : null,
        ip_address: null, // Will be set server-side if needed
        user_agent: userAgent,
        device_info: deviceInfo,
        document_hash: documentHash,
        signature_hash: signatureHash,
        status: 'signed',
      } as any)
      .select('id, platform_seal_number')
      .single();

    if (sigError) {
      console.error('Signature save error:', sigError);
      toast.error('فشل في حفظ التوقيع');
      return { success: false };
    }

    // Insert audit log
    await supabase.from('signature_audit_log').insert({
      signature_id: sigRecord.id,
      action: 'sign',
      actor_user_id: userId,
      actor_name: signatureData.signerName,
      actor_user_agent: userAgent,
      actor_device: deviceInfo,
      document_type: documentType,
      document_id: documentId,
      organization_id: organizationId,
      details: {
        method: signatureData.method,
        stamp_applied: signatureData.stampApplied,
        national_id_provided: !!signatureData.signerNationalId,
        document_hash: documentHash,
      },
    } as any);

    toast.success('تم توقيع المستند بنجاح', {
      description: `رقم الختم: ${sigRecord.platform_seal_number || 'N/A'}`,
    });

    return {
      success: true,
      signatureId: sigRecord.id,
      sealNumber: sigRecord.platform_seal_number,
    };
  } catch (err) {
    console.error('Save signature error:', err);
    toast.error('حدث خطأ أثناء حفظ التوقيع');
    return { success: false };
  }
}

/**
 * Get all signatures for a document
 */
export async function getDocumentSignatures(documentType: string, documentId: string) {
  const { data, error } = await supabase
    .from('document_signatures')
    .select('*')
    .eq('document_type', documentType)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch signatures error:', error);
    return [];
  }
  return data || [];
}

/**
 * Check if current user is an authorized signatory
 */
export async function checkSignatoryAuth(userId: string, organizationId: string, documentType: string) {
  const permissionField = `can_sign_${documentType === 'shipment' ? 'shipments' : documentType === 'contract' ? 'contracts' : documentType === 'invoice' ? 'invoices' : 'certificates'}`;

  const { data, error } = await supabase
    .from('authorized_signatories')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  
  // Check specific permission
  if (!(data as any)[permissionField]) return null;
  
  return data;
}
