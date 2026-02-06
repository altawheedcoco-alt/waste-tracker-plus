import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BiometricSignatureData } from '@/components/signature/BiometricSignaturePad';

interface SignDocumentParams {
  documentType: string;
  documentId: string;
  organizationId: string;
  signerId: string;
  signerName: string;
  signerRole?: string;
  signatureData: BiometricSignatureData;
  stampApplied?: boolean;
  stampVerifiedBiometrically?: boolean;
}

interface DocumentSignature {
  id: string;
  document_type: string;
  document_id: string;
  organization_id: string;
  signed_by: string;
  signer_name: string;
  signer_role: string | null;
  signature_method: string;
  signature_image_url: string | null;
  biometric_verified: boolean;
  biometric_type: string | null;
  biometric_verification_id: string | null;
  stamp_applied: boolean;
  stamp_verified_biometrically: boolean;
  ip_address: string | null;
  device_info: string | null;
  timestamp_signed: string;
  created_at: string;
}

export const useDocumentSignature = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Get IP address (best effort)
  const getIpAddress = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  // Upload drawn signature to storage
  const uploadSignatureImage = async (
    dataUrl: string,
    organizationId: string,
    documentId: string
  ): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const fileName = `signatures/${organizationId}/${documentId}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('organization-stamps')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-stamps')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading signature:', error);
      return null;
    }
  };

  // Sign a document
  const signDocument = useCallback(async (params: SignDocumentParams): Promise<DocumentSignature | null> => {
    setIsLoading(true);

    try {
      let signatureImageUrl: string | null = null;

      // Upload drawn signature if exists
      if (params.signatureData.signatureDataUrl) {
        signatureImageUrl = await uploadSignatureImage(
          params.signatureData.signatureDataUrl,
          params.organizationId,
          params.documentId
        );
      }

      // Determine signature method
      let signatureMethod = 'drawn';
      if (params.signatureData.biometricVerified && params.signatureData.signatureDataUrl) {
        signatureMethod = 'drawn_biometric';
      } else if (params.signatureData.biometricVerified) {
        signatureMethod = 'biometric';
      } else if (!params.signatureData.signatureDataUrl) {
        signatureMethod = 'uploaded';
      }

      // Get IP address
      const ipAddress = await getIpAddress();

      // Insert signature record
      const { data, error } = await supabase
        .from('document_signatures')
        .insert({
          document_type: params.documentType,
          document_id: params.documentId,
          organization_id: params.organizationId,
          signed_by: params.signerId,
          signer_name: params.signerName,
          signer_role: params.signerRole || null,
          signature_method: signatureMethod,
          signature_image_url: signatureImageUrl,
          biometric_verified: params.signatureData.biometricVerified,
          biometric_type: params.signatureData.biometricType || null,
          biometric_verification_id: params.signatureData.verificationId || null,
          stamp_applied: params.stampApplied || false,
          stamp_verified_biometrically: params.stampVerifiedBiometrically || false,
          ip_address: ipAddress,
          device_info: params.signatureData.deviceInfo || navigator.userAgent,
          timestamp_signed: params.signatureData.timestamp,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('تم توقيع المستند بنجاح');
      return data as DocumentSignature;
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('فشل في توقيع المستند');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get signatures for a document
  const getDocumentSignatures = useCallback(async (
    documentType: string,
    documentId: string
  ): Promise<DocumentSignature[]> => {
    try {
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('timestamp_signed', { ascending: true });

      if (error) throw error;
      return (data || []) as DocumentSignature[];
    } catch (error) {
      console.error('Error fetching signatures:', error);
      return [];
    }
  }, []);

  // Check if user has signed
  const hasUserSigned = useCallback(async (
    documentType: string,
    documentId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('document_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .eq('signed_by', userId);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking signature:', error);
      return false;
    }
  }, []);

  return {
    isLoading,
    signDocument,
    getDocumentSignatures,
    hasUserSigned,
  };
};

export default useDocumentSignature;
