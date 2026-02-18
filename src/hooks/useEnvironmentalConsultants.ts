import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface EnvironmentalConsultant {
  id: string;
  user_id: string;
  full_name: string;
  full_name_en?: string | null;
  national_id?: string | null;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  license_number?: string | null;
  license_issuer?: string | null;
  license_expiry?: string | null;
  qualification?: string | null;
  years_of_experience?: number | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
  consultant_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultantAssignment {
  id: string;
  consultant_id: string;
  organization_id: string;
  role_title: string;
  assigned_at: string;
  is_active: boolean;
  can_sign_certificates: boolean;
  can_sign_permits: boolean;
  can_sign_shipments: boolean;
  can_sign_reports: boolean;
  // Data visibility controls
  can_view_shipments: boolean;
  can_view_partners: boolean;
  can_view_vehicles: boolean;
  can_view_drivers: boolean;
  can_view_documents: boolean;
  can_view_compliance: boolean;
  can_view_waste_records: boolean;
  can_view_incidents: boolean;
  hidden_data_notes?: string | null;
  visibility_updated_at?: string | null;
  notes?: string | null;
  consultant?: EnvironmentalConsultant;
}

export interface ConsultantCredential {
  id: string;
  consultant_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  expiry_date?: string | null;
  is_verified: boolean;
  uploaded_at: string;
}

export const useEnvironmentalConsultants = () => {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  // Fetch consultants assigned to current organization
  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ['env-consultants', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('consultant_organization_assignments')
        .select(`
          *,
          consultant:environmental_consultants(*)
        `)
        .eq('organization_id', orgId)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as any as ConsultantAssignment[];
    },
    enabled: !!orgId,
  });

  // Check if current user is a consultant
  const { data: myConsultantProfile } = useQuery({
    queryKey: ['my-consultant-profile', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase
        .from('environmental_consultants')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      return data as EnvironmentalConsultant | null;
    },
    enabled: !!profile?.user_id,
  });

  // Fetch credentials for a consultant
  const fetchCredentials = useCallback(async (consultantId: string) => {
    const { data, error } = await supabase
      .from('consultant_credentials')
      .select('*')
      .eq('consultant_id', consultantId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ConsultantCredential[];
  }, []);

  // Register as consultant
  const registerConsultant = useMutation({
    mutationFn: async (data: Partial<EnvironmentalConsultant>) => {
      const { data: result, error } = await supabase
        .from('environmental_consultants')
        .insert({
          user_id: profile!.user_id,
          full_name: data.full_name || profile!.full_name,
          full_name_en: data.full_name_en,
          phone: data.phone || profile?.phone,
          email: data.email || profile?.email,
          specialization: data.specialization,
          license_number: data.license_number,
          license_issuer: data.license_issuer,
          license_expiry: data.license_expiry,
          qualification: data.qualification,
          years_of_experience: data.years_of_experience,
          bio: data.bio,
          national_id: data.national_id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-consultant-profile'] });
      toast.success('تم تسجيلك كاستشاري بيئي بنجاح');
    },
    onError: (e: any) => toast.error(e.message || 'حدث خطأ'),
  });

  // Assign consultant to organization
  const assignConsultant = useMutation({
    mutationFn: async (data: { consultant_id: string; role_title?: string }) => {
      const { error } = await supabase
        .from('consultant_organization_assignments')
        .insert({
          consultant_id: data.consultant_id,
          organization_id: orgId!,
          role_title: data.role_title || 'استشاري بيئي',
          assigned_by: profile!.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['env-consultants'] });
      toast.success('تم تعيين الاستشاري بنجاح');
    },
    onError: (e: any) => toast.error(e.message || 'حدث خطأ'),
  });

  // Remove assignment
  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('consultant_organization_assignments')
        .update({ is_active: false } as any)
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['env-consultants'] });
      toast.success('تم إلغاء تعيين الاستشاري');
    },
  });

  // Upload credential
  const uploadCredential = useMutation({
    mutationFn: async (data: { consultant_id: string; document_type: string; document_name: string; file: File }) => {
      const path = `consultant-credentials/${data.consultant_id}/${Date.now()}-${data.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, data.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

      const { error } = await supabase
        .from('consultant_credentials')
        .insert({
          consultant_id: data.consultant_id,
          document_type: data.document_type,
          document_name: data.document_name,
          document_url: urlData.publicUrl,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success('تم رفع المستند بنجاح'),
    onError: (e: any) => toast.error(e.message || 'فشل في الرفع'),
  });

  // Sign a document as consultant
  const signDocument = useMutation({
    mutationFn: async (data: {
      consultant_id: string;
      document_type: string;
      document_id: string;
      signature_data?: string;
      stamp_applied?: boolean;
      notes?: string;
    }) => {
      const signatureHash = await generateHash(JSON.stringify({
        consultant_id: data.consultant_id,
        document_id: data.document_id,
        timestamp: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('consultant_document_signatures')
        .insert({
          consultant_id: data.consultant_id,
          organization_id: orgId!,
          document_type: data.document_type,
          document_id: data.document_id,
          signature_data: data.signature_data,
          stamp_applied: data.stamp_applied || false,
          signature_hash: signatureHash,
          device_info: navigator.userAgent,
          notes: data.notes,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success('تم التوقيع بنجاح'),
    onError: (e: any) => toast.error(e.message || 'فشل التوقيع'),
  });

  return {
    consultants,
    isLoading,
    myConsultantProfile,
    fetchCredentials,
    registerConsultant,
    assignConsultant,
    removeAssignment,
    uploadCredential,
    signDocument,
  };
};

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
