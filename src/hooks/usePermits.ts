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
  // Enhanced fields
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  license_front_url: string | null;
  license_back_url: string | null;
  person_photo_url: string | null;
  person_phone: string | null;
  person_email: string | null;
  person_address: string | null;
  license_number: string | null;
  license_expiry: string | null;
  vehicle_type: string | null;
  image_source: string | null;
  linked_profile_id: string | null;
  linked_driver_id: string | null;
  parent_permit_id: string | null;
  revision_number: number;
  revision_reason: string | null;
  share_token: string | null;
  share_token_expires_at: string | null;
  auto_sent: boolean;
  sent_at: string | null;
  sent_method: string | null;
  ocr_data: any | null;
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
  // Enhanced fields
  id_card_front_url?: string;
  id_card_back_url?: string;
  license_front_url?: string;
  license_back_url?: string;
  person_photo_url?: string;
  person_phone?: string;
  person_email?: string;
  person_address?: string;
  license_number?: string;
  license_expiry?: string;
  vehicle_type?: string;
  image_source?: string;
  linked_profile_id?: string;
  linked_driver_id?: string;
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
          // Enhanced fields
          id_card_front_url: data.id_card_front_url || null,
          id_card_back_url: data.id_card_back_url || null,
          license_front_url: data.license_front_url || null,
          license_back_url: data.license_back_url || null,
          person_photo_url: data.person_photo_url || null,
          person_phone: data.person_phone || null,
          person_email: data.person_email || null,
          person_address: data.person_address || null,
          license_number: data.license_number || null,
          license_expiry: data.license_expiry || null,
          vehicle_type: data.vehicle_type || null,
          image_source: data.image_source || 'manual',
          linked_profile_id: data.linked_profile_id || null,
          linked_driver_id: data.linked_driver_id || null,
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

  const autoGeneratePermits = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('auto_generate_permits_for_shipments');
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      const result = Array.isArray(data) ? data[0] : data;
      toast.success(`تم إنشاء ${result?.permits_created || 0} تصريح لـ ${result?.shipments_processed || 0} شحنة`);
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createRevision = useMutation({
    mutationFn: async ({ permitId, reason }: { permitId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('create_permit_revision', {
        original_permit_id: permitId,
        p_revision_reason: reason || 'تعديل بيانات',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء نسخة معدّلة من التصريح');
      queryClient.invalidateQueries({ queryKey: ['permits'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const generateShareToken = useMutation({
    mutationFn: async (permitId: string) => {
      const { data, error } = await supabase.rpc('generate_permit_share_token', {
        permit_id: permitId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (token: string) => {
      const url = `${window.location.origin}/permit-view/${token}`;
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط المشاركة');
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
    autoGeneratePermits,
    createRevision,
    generateShareToken,
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
