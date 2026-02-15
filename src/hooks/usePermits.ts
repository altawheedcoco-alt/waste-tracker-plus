import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Permit {
  id: string;
  permit_number: string;
  permit_type: string;
  status: string;
  issuer_organization_id: string;
  shipment_id: string | null;
  person_name: string | null;
  person_id_number: string | null;
  person_role: string | null;
  driver_id: string | null;
  vehicle_plate: string | null;
  waste_type: string | null;
  waste_description: string | null;
  estimated_quantity: number | null;
  quantity_unit: string | null;
  valid_from: string | null;
  valid_until: string | null;
  purpose: string | null;
  notes: string | null;
  special_instructions: string | null;
  verification_code: string | null;
  created_by: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
  signatures?: PermitSignature[];
}

export interface PermitSignature {
  id: string;
  permit_id: string;
  role_title: string;
  signer_name: string;
  organization_id: string;
  signed_at: string;
  status: string;
}

export interface PermitSignatoryRole {
  id: string;
  organization_id: string;
  role_title: string;
  role_key: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface CreatePermitData {
  permit_type: string;
  shipment_id?: string;
  person_name?: string;
  person_id_number?: string;
  person_role?: string;
  driver_id?: string;
  vehicle_plate?: string;
  waste_type?: string;
  waste_description?: string;
  estimated_quantity?: number;
  quantity_unit?: string;
  valid_from?: string;
  valid_until?: string;
  purpose?: string;
  notes?: string;
  special_instructions?: string;
}

export function usePermits() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const { data: permits, isLoading } = useQuery({
    queryKey: ['permits', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('permits')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Permit[];
    },
    enabled: !!orgId,
  });

  const { data: signatoryRoles } = useQuery({
    queryKey: ['permit-signatory-roles', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('permit_signatory_roles')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as PermitSignatoryRole[];
    },
    enabled: !!orgId,
  });

  const createPermit = useMutation({
    mutationFn: async (data: CreatePermitData) => {
      if (!orgId || !profile?.id) throw new Error('غير مصرح');
      const { data: result, error } = await supabase
        .from('permits')
        .insert({
          permit_type: data.permit_type,
          shipment_id: data.shipment_id || null,
          person_name: data.person_name || null,
          person_id_number: data.person_id_number || null,
          person_role: data.person_role || null,
          driver_id: data.driver_id || null,
          vehicle_plate: data.vehicle_plate || null,
          waste_type: data.waste_type || null,
          waste_description: data.waste_description || null,
          estimated_quantity: data.estimated_quantity || null,
          quantity_unit: data.quantity_unit || 'ton',
          valid_from: data.valid_from || null,
          valid_until: data.valid_until || null,
          purpose: data.purpose || null,
          notes: data.notes || null,
          special_instructions: data.special_instructions || null,
          permit_number: '',
          organization_id: orgId,
          issuer_organization_id: orgId,
          created_by: profile.id,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('تم إنشاء التصريح بنجاح');
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const signPermit = useMutation({
    mutationFn: async ({ permitId, roleTitle, signerName }: { permitId: string; roleTitle: string; signerName: string }) => {
      if (!orgId || !profile?.id) throw new Error('غير مصرح');
      const { error } = await supabase
        .from('permit_signatures')
        .insert({
          permit_id: permitId,
          role_title: roleTitle,
          signer_profile_id: profile.id,
          signer_name: signerName,
          organization_id: orgId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم التوقيع بنجاح');
      queryClient.invalidateQueries({ queryKey: ['permits'] });
      queryClient.invalidateQueries({ queryKey: ['permit-signatures'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addSignatoryRole = useMutation({
    mutationFn: async ({ roleTitle, roleKey }: { roleTitle: string; roleKey: string }) => {
      if (!orgId) throw new Error('غير مصرح');
      const { error } = await supabase
        .from('permit_signatory_roles')
        .insert({
          organization_id: orgId,
          role_title: roleTitle,
          role_key: roleKey,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة الدور');
      queryClient.invalidateQueries({ queryKey: ['permit-signatory-roles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const seedDefaultRoles = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('غير مصرح');
      const { error } = await supabase.rpc('seed_default_permit_roles', { org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحميل الأدوار الافتراضية');
      queryClient.invalidateQueries({ queryKey: ['permit-signatory-roles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return {
    permits: permits || [],
    signatoryRoles: signatoryRoles || [],
    isLoading,
    createPermit,
    signPermit,
    addSignatoryRole,
    seedDefaultRoles,
  };
}

export function usePermitSignatures(permitId: string | null) {
  return useQuery({
    queryKey: ['permit-signatures', permitId],
    queryFn: async () => {
      if (!permitId) return [];
      const { data, error } = await supabase
        .from('permit_signatures')
        .select('*')
        .eq('permit_id', permitId)
        .order('signed_at');
      if (error) throw error;
      return data as PermitSignature[];
    },
    enabled: !!permitId,
  });
}
