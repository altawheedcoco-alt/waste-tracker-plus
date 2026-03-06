import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLicenseRenewalRequests = (asRegulator = false) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['license-renewal-requests', organization?.id, asRegulator],
    queryFn: async () => {
      if (!organization?.id) return [];
      const field = asRegulator ? 'regulator_organization_id' : 'organization_id';
      const { data } = await supabase
        .from('license_renewal_requests')
        .select('*, org:organizations!license_renewal_requests_organization_id_fkey(id, name, name_en, organization_type, email, phone)')
        .eq(field, organization.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });
};

export const useRegulatoryAttestations = (asRegulator = false) => {
  const { organization } = useAuth();
  return useQuery({
    queryKey: ['regulatory-attestations', organization?.id, asRegulator],
    queryFn: async () => {
      if (!organization?.id) return [];
      const field = asRegulator ? 'regulator_organization_id' : 'organization_id';
      const { data } = await supabase
        .from('regulatory_attestations')
        .select('*, org:organizations!regulatory_attestations_organization_id_fkey(id, name, name_en, organization_type, email, phone)')
        .eq(field, organization.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });
};

export const useUpdateRenewalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('license_renewal_requests')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-renewal-requests'] });
      toast.success('تم تحديث الطلب بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء التحديث'),
  });
};

export const useCreateRenewalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: Record<string, any>) => {
      const { data, error } = await supabase
        .from('license_renewal_requests')
        .insert(request as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-renewal-requests'] });
      toast.success('تم تقديم طلب التجديد بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء تقديم الطلب'),
  });
};

export const useIssueAttestation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (attestation: Record<string, any>) => {
      // Generate attestation number
      const { data: numData } = await supabase.rpc('generate_attestation_number');
      const attestationNumber = numData || `ATT-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('regulatory_attestations')
        .insert({
          ...attestation,
          attestation_number: attestationNumber,
          issued_by: user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulatory-attestations'] });
      queryClient.invalidateQueries({ queryKey: ['license-renewal-requests'] });
      toast.success('تم إصدار الإفادة بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء إصدار الإفادة'),
  });
};
