import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OrganizationSignature {
  id: string;
  organization_id: string;
  signature_name: string;
  signature_name_en: string | null;
  signer_name: string;
  signer_position: string | null;
  signer_national_id: string | null;
  signer_phone: string | null;
  signer_email: string | null;
  signature_image_url: string;
  is_primary: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  authorization_document_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationStamp {
  id: string;
  organization_id: string;
  stamp_name: string;
  stamp_name_en: string | null;
  stamp_type: string;
  stamp_image_url: string;
  is_primary: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  department: string | null;
  branch: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentEndorsement {
  id: string;
  document_type: string;
  document_id: string;
  document_number: string;
  organization_id: string;
  signature_id: string | null;
  stamp_id: string | null;
  endorsement_type: string;
  endorsed_by: string | null;
  endorsed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  biometric_verified: boolean;
  verification_code: string;
  qr_code_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface SystemEndorsement {
  id: string;
  document_endorsement_id: string;
  system_seal_number: string;
  system_seal_hash: string;
  endorsed_at: string;
  platform_version: string;
  legal_disclaimer: string;
  verification_url: string | null;
  is_valid: boolean;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
}

export const useOrganizationSignatures = () => {
  const { organization } = useAuth();
  const [signatures, setSignatures] = useState<OrganizationSignature[]>([]);
  const [stamps, setStamps] = useState<OrganizationStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchSignatures = useCallback(async (signal?: AbortSignal) => {
    if (!organization?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_signatures')
        .select('*')
        .eq('organization_id', organization.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })
        .abortSignal(signal!);

      if (fetchError) throw fetchError;
      setSignatures((data || []) as OrganizationSignature[]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching signatures:', err);
      setError(err.message);
    }
  }, [organization?.id]);

  const fetchStamps = useCallback(async (signal?: AbortSignal) => {
    if (!organization?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_stamps')
        .select('*')
        .eq('organization_id', organization.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })
        .abortSignal(signal!);

      if (fetchError) throw fetchError;
      setStamps((data || []) as OrganizationStamp[]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching stamps:', err);
      setError(err.message);
    }
  }, [organization?.id]);

  const fetchAll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    await Promise.all([fetchSignatures(controller.signal), fetchStamps(controller.signal)]);
    if (!controller.signal.aborted) setLoading(false);
  }, [fetchSignatures, fetchStamps]);

  useEffect(() => {
    fetchAll();
    return () => { abortRef.current?.abort(); };
  }, [fetchAll]);

  // Add signature
  const addSignature = async (data: Partial<OrganizationSignature>) => {
    if (!organization?.id) return null;

    try {
      const insertData = {
        organization_id: organization.id,
        signature_name: data.signature_name || '',
        signer_name: data.signer_name || '',
        signature_image_url: data.signature_image_url || '',
        signature_name_en: data.signature_name_en,
        signer_position: data.signer_position,
        signer_national_id: data.signer_national_id,
        signer_phone: data.signer_phone,
        signer_email: data.signer_email,
        is_primary: data.is_primary ?? false,
        is_active: data.is_active ?? true,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        authorization_document_url: data.authorization_document_url,
      };

      const { data: newSignature, error: insertError } = await supabase
        .from('organization_signatures')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      
      toast.success('تم إضافة التوقيع بنجاح');
      await fetchSignatures();
      return newSignature;
    } catch (err: any) {
      console.error('Error adding signature:', err);
      toast.error('فشل في إضافة التوقيع');
      return null;
    }
  };

  // Update signature
  const updateSignature = async (id: string, data: Partial<OrganizationSignature>) => {
    try {
      const { error: updateError } = await supabase
        .from('organization_signatures')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('تم تحديث التوقيع بنجاح');
      await fetchSignatures();
      return true;
    } catch (err: any) {
      console.error('Error updating signature:', err);
      toast.error('فشل في تحديث التوقيع');
      return false;
    }
  };

  // Delete signature
  const deleteSignature = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('organization_signatures')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      toast.success('تم حذف التوقيع بنجاح');
      await fetchSignatures();
      return true;
    } catch (err: any) {
      console.error('Error deleting signature:', err);
      toast.error('فشل في حذف التوقيع');
      return false;
    }
  };

  // Set primary signature
  const setPrimarySignature = async (id: string) => {
    if (!organization?.id) return false;

    try {
      // First, unset all primary
      await supabase
        .from('organization_signatures')
        .update({ is_primary: false })
        .eq('organization_id', organization.id);

      // Then set the selected as primary
      const { error: updateError } = await supabase
        .from('organization_signatures')
        .update({ is_primary: true })
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('تم تعيين التوقيع كأساسي');
      await fetchSignatures();
      return true;
    } catch (err: any) {
      console.error('Error setting primary signature:', err);
      toast.error('فشل في تعيين التوقيع كأساسي');
      return false;
    }
  };

  // Add stamp
  const addStamp = async (data: Partial<OrganizationStamp>) => {
    if (!organization?.id) return null;

    try {
      const insertData = {
        organization_id: organization.id,
        stamp_name: data.stamp_name || '',
        stamp_image_url: data.stamp_image_url || '',
        stamp_name_en: data.stamp_name_en,
        stamp_type: data.stamp_type || 'official',
        is_primary: data.is_primary ?? false,
        is_active: data.is_active ?? true,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        department: data.department,
        branch: data.branch,
      };

      const { data: newStamp, error: insertError } = await supabase
        .from('organization_stamps')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;
      
      toast.success('تم إضافة الختم بنجاح');
      await fetchStamps();
      return newStamp;
    } catch (err: any) {
      console.error('Error adding stamp:', err);
      toast.error('فشل في إضافة الختم');
      return null;
    }
  };

  // Update stamp
  const updateStamp = async (id: string, data: Partial<OrganizationStamp>) => {
    try {
      const { error: updateError } = await supabase
        .from('organization_stamps')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('تم تحديث الختم بنجاح');
      await fetchStamps();
      return true;
    } catch (err: any) {
      console.error('Error updating stamp:', err);
      toast.error('فشل في تحديث الختم');
      return false;
    }
  };

  // Delete stamp
  const deleteStamp = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('organization_stamps')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      toast.success('تم حذف الختم بنجاح');
      await fetchStamps();
      return true;
    } catch (err: any) {
      console.error('Error deleting stamp:', err);
      toast.error('فشل في حذف الختم');
      return false;
    }
  };

  // Set primary stamp
  const setPrimaryStamp = async (id: string) => {
    if (!organization?.id) return false;

    try {
      // First, unset all primary
      await supabase
        .from('organization_stamps')
        .update({ is_primary: false })
        .eq('organization_id', organization.id);

      // Then set the selected as primary
      const { error: updateError } = await supabase
        .from('organization_stamps')
        .update({ is_primary: true })
        .eq('id', id);

      if (updateError) throw updateError;
      
      toast.success('تم تعيين الختم كأساسي');
      await fetchStamps();
      return true;
    } catch (err: any) {
      console.error('Error setting primary stamp:', err);
      toast.error('فشل في تعيين الختم كأساسي');
      return false;
    }
  };

  // Get primary signature
  const getPrimarySignature = () => signatures.find(s => s.is_primary && s.is_active);
  
  // Get primary stamp
  const getPrimaryStamp = () => stamps.find(s => s.is_primary && s.is_active);

  // Get active signatures
  const getActiveSignatures = () => signatures.filter(s => s.is_active);
  
  // Get active stamps
  const getActiveStamps = () => stamps.filter(s => s.is_active);

  return {
    signatures,
    stamps,
    loading,
    error,
    refetch: fetchAll,
    addSignature,
    updateSignature,
    deleteSignature,
    setPrimarySignature,
    addStamp,
    updateStamp,
    deleteStamp,
    setPrimaryStamp,
    getPrimarySignature,
    getPrimaryStamp,
    getActiveSignatures,
    getActiveStamps,
  };
};

export default useOrganizationSignatures;
