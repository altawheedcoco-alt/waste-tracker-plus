import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that provides mandatory verification data (QR, barcode, verification code)
 * for any document issued by the current organization.
 * 
 * QR/Barcode/Verification Code = MANDATORY & AUTOMATIC (always on every document)
 * Signature/Stamp = OPTIONAL (controlled via auto_signature_settings / auto_actions)
 */
export const useDocumentVerification = () => {
  const { organization, profile } = useAuth();

  const orgData = useMemo(() => {
    if (!organization) return null;
    const org = organization as any;
    const declNumber = org.digital_declaration_number || org.partner_code || org.id?.slice(0, 8)?.toUpperCase();
    const orgName = org.name || '';
    const orgType = org.organization_type || '';
    const partnerCode = org.partner_code || '';

    return {
      declNumber,
      orgName,
      orgType,
      partnerCode,
      signatureUrl: org.signature_url || null,
      stampUrl: org.stamp_url || null,
      logoUrl: org.logo_url || null,
    };
  }, [organization]);

  /**
   * Generate verification identity for a specific document.
   * @param documentType e.g. 'shipment', 'invoice', 'certificate', 'attestation', 'contract'
   * @param documentId unique document identifier
   * @param documentNumber human-readable document number (optional)
   */
  const generateVerification = (documentType: string, documentId: string, documentNumber?: string) => {
    if (!orgData) return null;

    const verificationCode = `${orgData.declNumber}-${documentType.substring(0, 3).toUpperCase()}-${documentId.slice(0, 6).toUpperCase()}`;
    
    const qrData = JSON.stringify({
      platform: 'iRecycle',
      type: documentType,
      org: orgData.orgName,
      org_code: orgData.declNumber,
      doc_id: documentId,
      doc_num: documentNumber || documentId,
      verification: verificationCode,
      url: `${window.location.origin}/qr-verify?type=${documentType}&code=${verificationCode}`,
    });

    const barcodeData = documentNumber || verificationCode;

    return {
      verificationCode,
      qrData,
      barcodeData,
      declNumber: orgData.declNumber,
      orgName: orgData.orgName,
      signatureUrl: orgData.signatureUrl,
      stampUrl: orgData.stampUrl,
      logoUrl: orgData.logoUrl,
    };
  };

  return {
    orgData,
    generateVerification,
    isReady: !!orgData,
  };
};
