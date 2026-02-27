import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AttestationData {
  id: string;
  organization_id: string;
  attestation_number: string;
  verification_code: string;
  system_seal_number: string;
  organization_name: string;
  organization_type: string;
  organization_logo_url: string | null;
  digital_declaration_number: string | null;
  commercial_register: string | null;
  tax_number: string | null;
  delegate_name: string | null;
  delegate_position: string | null;
  delegate_national_id: string | null;
  delegate_phone: string | null;
  organization_address: string | null;
  organization_phone: string | null;
  organization_email: string | null;
  terms_accepted: boolean;
  terms_version: string | null;
  identity_verified: boolean;
  licenses_valid: boolean;
  kyc_complete: boolean;
  signer_signature_url: string | null;
  signer_stamp_url: string | null;
  signer_barcode_data: string | null;
  signer_qr_data: string | null;
  platform_endorsed: boolean;
  status: string;
  issued_at: string;
}

const generateAttestationNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ATT-${y}${m}-${rand}`;
};

const generateVerificationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let seg = '';
    for (let j = 0; j < 4; j++) seg += chars[Math.floor(Math.random() * chars.length)];
    segments.push(seg);
  }
  return segments.join('-');
};

const generateSealNumber = () => {
  const now = new Date();
  const ym = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7);
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IRS-ATT-${ym}-${rand}`;
};

export const useOrganizationAttestation = () => {
  const { user, organization, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const requestAttestation = useCallback(async (): Promise<AttestationData | null> => {
    if (!user || !organization || !profile) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    setLoading(true);
    try {
      // Fetch full org data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();

      if (orgError || !orgData) throw new Error('فشل في جلب بيانات المنظمة');

      // Check terms acceptance
      const { data: termsData } = await supabase
        .from('terms_acceptances')
        .select('terms_version')
        .eq('organization_id', organization.id)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check KYC
      const { data: profileData } = await supabase
        .from('profiles')
        .select('can_sign_documents, full_name')
        .eq('user_id', user.id)
        .single();

      // Get primary signature & stamp
      const { data: sigData } = await (supabase.from('organization_signatures') as any)
        .select('signature_image_url')
        .eq('organization_id', organization.id)
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle();

      const { data: stampData } = await (supabase.from('organization_stamps') as any)
        .select('stamp_image_url')
        .eq('organization_id', organization.id)
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle();

      // Check licenses
      const hasValidLicenses = !!(
        (orgData.environmental_license && (!orgData.eeaa_license_expiry_date || new Date(orgData.eeaa_license_expiry_date) > new Date())) ||
        (orgData.wmra_license && (!orgData.wmra_license_expiry_date || new Date(orgData.wmra_license_expiry_date) > new Date()))
      );

      const attestationNumber = generateAttestationNumber();
      const verificationCode = generateVerificationCode();
      const sealNumber = generateSealNumber();

      const verificationUrl = `${window.location.origin}/qr-verify?type=attestation&code=${verificationCode}`;
      const barcodeData = attestationNumber;
      const qrData = JSON.stringify({
        type: 'attestation',
        code: verificationCode,
        seal: sealNumber,
        org: orgData.name,
        url: verificationUrl,
      });

      const insertData = {
        organization_id: organization.id,
        requested_by: user.id,
        attestation_number: attestationNumber,
        verification_code: verificationCode,
        system_seal_number: sealNumber,
        organization_name: orgData.name || '',
        organization_type: orgData.organization_type || '',
        organization_logo_url: orgData.logo_url,
        digital_declaration_number: orgData.digital_declaration_number,
        commercial_register: orgData.commercial_register,
        tax_number: orgData.tax_card || null,
        delegate_name: orgData.delegate_name,
        delegate_position: null,
        delegate_national_id: orgData.delegate_national_id,
        delegate_phone: orgData.delegate_phone,
        organization_address: orgData.address,
        organization_phone: orgData.phone,
        organization_email: orgData.email,
        terms_accepted: !!termsData,
        terms_version: termsData?.terms_version || null,
        identity_verified: !!profileData?.can_sign_documents,
        licenses_valid: hasValidLicenses,
        kyc_complete: !!termsData,
        signer_signature_url: sigData?.signature_image_url || null,
        signer_stamp_url: stampData?.stamp_image_url || null,
        signer_barcode_data: barcodeData,
        signer_qr_data: qrData,
      };

      const { data: attestation, error: insertError } = await supabase
        .from('organization_attestations')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('تم إصدار الإفادة بنجاح');
      return attestation as unknown as AttestationData;
    } catch (err: any) {
      console.error('Error creating attestation:', err);
      toast.error('فشل في إصدار الإفادة: ' + (err.message || ''));
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, organization, profile]);

  const fetchAttestations = useCallback(async () => {
    if (!organization) return [];
    const { data, error } = await supabase
      .from('organization_attestations')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attestations:', error);
      return [];
    }
    return (data || []) as unknown as AttestationData[];
  }, [organization]);

  return { loading, requestAttestation, fetchAttestations };
};
