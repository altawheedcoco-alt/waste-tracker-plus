import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EndorsementRequest {
  document_type: 'certificate' | 'report' | 'contract' | 'receipt' | 'aggregate';
  document_id: string;
  document_number: string;
  signature_id?: string;
  stamp_id?: string;
  endorsement_type?: 'signed' | 'stamped' | 'signed_and_stamped';
  biometric_verified?: boolean;
  notes?: string;
}

export interface EndorsementResult {
  endorsement_id: string;
  verification_code: string;
  system_seal_number: string;
  verification_url: string;
  qr_code_data: string;
}

export const useDocumentEndorsement = () => {
  const { organization, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate verification code locally (fallback if DB function fails)
  const generateVerificationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }
    return segments.join('-');
  };

  // Generate system seal number
  const generateSystemSealNumber = () => {
    const now = new Date();
    const yearMonth = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `IRS-${yearMonth}-${random}`;
  };

  // Generate SHA-256 hash of content
  const generateContentHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Create document endorsement with security validation
  const createEndorsement = useCallback(async (
    request: EndorsementRequest
  ): Promise<EndorsementResult | null> => {
    if (!organization?.id || !profile?.user_id) {
      toast.error('يجب تسجيل الدخول لإنشاء اعتماد');
      return null;
    }

    // Verify user has signing authority
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('can_sign_documents, signature_authority_level')
      .eq('user_id', profile.user_id)
      .single();

    if (profileError || !profileData?.can_sign_documents) {
      toast.error('ليس لديك صلاحية توقيع المستندات');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const verificationCode = generateVerificationCode();
      const systemSealNumber = generateSystemSealNumber();
      
      // Create content hash based on document info
      const contentToHash = `${request.document_type}|${request.document_id}|${request.document_number}|${organization.id}|${new Date().toISOString()}`;
      const contentHash = await generateContentHash(contentToHash);

      // Get user's IP and user agent
      const userAgent = navigator.userAgent;

      // Insert document endorsement
      const { data: endorsement, error: endorseError } = await supabase
        .from('document_endorsements')
        .insert({
          document_type: request.document_type,
          document_id: request.document_id,
          document_number: request.document_number,
          organization_id: organization.id,
          signature_id: request.signature_id || null,
          stamp_id: request.stamp_id || null,
          endorsement_type: request.endorsement_type || 'signed_and_stamped',
          endorsed_by: profile.user_id,
          biometric_verified: request.biometric_verified || false,
          verification_code: verificationCode,
          user_agent: userAgent,
          notes: request.notes || null,
        })
        .select()
        .single();

      if (endorseError) throw endorseError;

      // Create verification URL
      const verificationUrl = `${window.location.origin}/verify?code=${verificationCode}`;

      // Insert system endorsement
      const { error: sysError } = await supabase
        .from('system_endorsements')
        .insert({
          document_endorsement_id: endorsement.id,
          system_seal_number: systemSealNumber,
          system_seal_hash: contentHash,
          verification_url: verificationUrl,
          legal_disclaimer: 'هذا المستند صادر إلكترونياً من منصة آي ريسايكل لإدارة المخلفات. المنصة غير مسؤولة عن صحة البيانات المدخلة من قبل الأطراف المشاركة. يمكن التحقق من صحة المستند عبر رمز QR أو صفحة التحقق الرسمية.',
        });

      if (sysError) throw sysError;

      // Generate QR code data
      const qrCodeData = JSON.stringify({
        code: verificationCode,
        seal: systemSealNumber,
        url: verificationUrl,
        doc: request.document_number,
        type: request.document_type,
      });

      toast.success('تم اعتماد المستند بنجاح');

      return {
        endorsement_id: endorsement.id,
        verification_code: verificationCode,
        system_seal_number: systemSealNumber,
        verification_url: verificationUrl,
        qr_code_data: qrCodeData,
      };
    } catch (err: any) {
      console.error('Error creating endorsement:', err);
      setError(err.message);
      toast.error('فشل في اعتماد المستند');
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id, profile?.user_id]);

  // Verify endorsement by code
  const verifyEndorsement = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get document endorsement
      const { data: endorsement, error: fetchError } = await supabase
        .from('document_endorsements')
        .select(`
          *,
          organization:organization_id(name, logo_url),
          signature:signature_id(signer_name, signer_position, signature_image_url),
          stamp:stamp_id(stamp_name, stamp_image_url)
        `)
        .eq('verification_code', code)
        .single();

      if (fetchError) throw fetchError;

      // Get system endorsement
      const { data: systemEndorsement, error: sysError } = await supabase
        .from('system_endorsements')
        .select('*')
        .eq('document_endorsement_id', endorsement.id)
        .single();

      if (sysError) throw sysError;

      return {
        valid: systemEndorsement.is_valid && !systemEndorsement.revoked_at,
        endorsement,
        systemEndorsement,
      };
    } catch (err: any) {
      console.error('Error verifying endorsement:', err);
      setError(err.message);
      return { valid: false, endorsement: null, systemEndorsement: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get endorsements for a document
  const getDocumentEndorsements = useCallback(async (
    documentType: string,
    documentId: string
  ) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('document_endorsements')
        .select(`
          *,
          signature:signature_id(signer_name, signature_image_url),
          stamp:stamp_id(stamp_name, stamp_image_url),
          system_endorsement:system_endorsements(system_seal_number, is_valid)
        `)
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('endorsed_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching endorsements:', err);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    createEndorsement,
    verifyEndorsement,
    getDocumentEndorsements,
  };
};

export default useDocumentEndorsement;
