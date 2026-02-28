import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ConsultingOffice {
  id: string;
  organization_id: string;
  office_name: string;
  office_name_en?: string | null;
  license_number?: string | null;
  license_issuer?: string | null;
  license_expiry?: string | null;
  commercial_register?: string | null;
  tax_id?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  specializations: string[];
  accreditations: any;
  director_consultant_id?: string | null;
  director_user_id?: string | null;
  office_stamp_url?: string | null;
  office_signature_url?: string | null;
  max_consultants: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeMembership {
  id: string;
  office_id: string;
  consultant_id: string;
  role: string;
  role_title_ar?: string | null;
  can_sign_independently: boolean;
  requires_director_approval: boolean;
  signing_scope: string[];
  excluded_document_types: string[];
  can_view_all_clients: boolean;
  assigned_client_ids: string[];
  delegated_by?: string | null;
  delegation_scope?: string | null;
  delegation_expires_at?: string | null;
  joined_at: string;
  membership_type: string;
  is_active: boolean;
  notes?: string | null;
  consultant?: {
    id: string;
    full_name: string;
    specialization?: string | null;
    consultant_code?: string | null;
    phone?: string | null;
    email?: string | null;
    is_active: boolean;
    profile_photo_url?: string | null;
    license_number?: string | null;
    license_expiry?: string | null;
  };
}

export interface ClientAssignment {
  id: string;
  consultant_id?: string | null;
  office_id?: string | null;
  membership_id?: string | null;
  client_organization_id: string;
  service_type: string;
  contract_reference?: string | null;
  contract_start?: string | null;
  contract_end?: string | null;
  signing_authority: any;
  data_access_scope: any;
  assigned_at: string;
  is_active: boolean;
  client_organization?: {
    id: string;
    name: string;
    organization_type: string;
    city?: string | null;
    logo_url?: string | null;
    partner_code?: string | null;
  };
  consultant?: {
    id: string;
    full_name: string;
    consultant_code?: string | null;
  };
}

export interface SigningPolicy {
  id: string;
  office_id: string;
  document_type: string;
  requires_director_approval: boolean;
  min_seniority_level: string;
  requires_office_stamp: boolean;
  co_signature_required: boolean;
  co_signer_role?: string | null;
  show_consultant_name: boolean;
  show_consultant_license: boolean;
  show_office_name: boolean;
  show_office_license: boolean;
  show_solidarity_clause: boolean;
  director_notes?: string | null;
  director_modified_at?: string | null;
  is_active: boolean;
}

// ═══ Hook: useConsultingOffice ═══
export const useConsultingOffice = () => {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  // Fetch office profile for current org
  const { data: office, isLoading: loadingOffice } = useQuery({
    queryKey: ['consulting-office', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('consulting_offices')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data as ConsultingOffice | null;
    },
    enabled: !!orgId,
  });

  // Fetch office members
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['office-memberships', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];
      const { data, error } = await supabase
        .from('office_consultant_memberships')
        .select(`*, consultant:environmental_consultants(
          id, full_name, specialization, consultant_code, phone, email, 
          is_active, profile_photo_url, license_number, license_expiry
        )`)
        .eq('office_id', office.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as any as OfficeMembership[];
    },
    enabled: !!office?.id,
  });

  // Fetch client assignments for office
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['office-client-assignments', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];
      const { data, error } = await supabase
        .from('consultant_client_assignments')
        .select(`*, client_organization:organizations(id, name, organization_type, city, logo_url, partner_code),
          consultant:environmental_consultants(id, full_name, consultant_code)`)
        .eq('office_id', office.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as any as ClientAssignment[];
    },
    enabled: !!office?.id,
  });

  // Fetch signing policies
  const { data: signingPolicies = [], isLoading: loadingPolicies } = useQuery({
    queryKey: ['office-signing-policies', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];
      const { data, error } = await supabase
        .from('office_signing_policies')
        .select('*')
        .eq('office_id', office.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as any as SigningPolicy[];
    },
    enabled: !!office?.id,
  });

  // Fetch pending approvals (signatures awaiting director approval)
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['office-pending-approvals', office?.id],
    queryFn: async () => {
      if (!office?.id) return [];
      const { data, error } = await supabase
        .from('consultant_document_signatures')
        .select('*')
        .eq('office_id', office.id)
        .eq('director_approval_status', 'pending');
      if (error) throw error;
      return data || [];
    },
    enabled: !!office?.id,
  });

  // Create office
  const createOffice = useMutation({
    mutationFn: async (data: Partial<ConsultingOffice>) => {
      const { data: result, error } = await supabase
        .from('consulting_offices')
        .insert({
          organization_id: orgId!,
          office_name: data.office_name || organization?.name || '',
          office_name_en: data.office_name_en,
          license_number: data.license_number,
          license_issuer: data.license_issuer,
          license_expiry: data.license_expiry,
          director_user_id: profile?.user_id,
          specializations: data.specializations || [],
        } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-office'] });
      toast.success('تم إنشاء المكتب الاستشاري بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Add member
  const addMember = useMutation({
    mutationFn: async (data: { consultant_id: string; role?: string; membership_type?: string }) => {
      const { error } = await supabase
        .from('office_consultant_memberships')
        .insert({
          office_id: office!.id,
          consultant_id: data.consultant_id,
          role: data.role || 'consultant',
          membership_type: data.membership_type || 'linked',
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-memberships'] });
      toast.success('تم إضافة الاستشاري للمكتب');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update member permissions
  const updateMember = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<OfficeMembership> }) => {
      const { error } = await supabase
        .from('office_consultant_memberships')
        .update(data.updates as any)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-memberships'] });
      toast.success('تم تحديث صلاحيات الاستشاري');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Remove member
  const removeMember = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from('office_consultant_memberships')
        .update({ is_active: false } as any)
        .eq('id', membershipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-memberships'] });
      toast.success('تم إزالة الاستشاري من المكتب');
    },
  });

  // Assign client to office
  const assignClient = useMutation({
    mutationFn: async (data: { client_organization_id: string; consultant_id?: string; service_type?: string }) => {
      const { error } = await supabase
        .from('consultant_client_assignments')
        .insert({
          office_id: office!.id,
          consultant_id: data.consultant_id,
          client_organization_id: data.client_organization_id,
          service_type: data.service_type || 'environmental_oversight',
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-client-assignments'] });
      toast.success('تم تعيين الجهة للمكتب');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Save signing policy
  const saveSigningPolicy = useMutation({
    mutationFn: async (data: Partial<SigningPolicy>) => {
      const { error } = await supabase
        .from('office_signing_policies')
        .upsert({
          office_id: office!.id,
          document_type: data.document_type,
          requires_director_approval: data.requires_director_approval,
          min_seniority_level: data.min_seniority_level,
          requires_office_stamp: data.requires_office_stamp,
          co_signature_required: data.co_signature_required,
          show_solidarity_clause: data.show_solidarity_clause,
          director_notes: data.director_notes,
          director_modified_at: data.director_notes ? new Date().toISOString() : null,
        } as any, { onConflict: 'office_id,document_type' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-signing-policies'] });
      toast.success('تم حفظ سياسة التوقيع');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Approve/reject signature
  const reviewSignature = useMutation({
    mutationFn: async (data: { signatureId: string; status: 'approved' | 'rejected'; notes?: string }) => {
      const { error } = await supabase
        .from('consultant_document_signatures')
        .update({
          director_approval_status: data.status,
          director_approved_by: profile?.user_id,
          director_approved_at: new Date().toISOString(),
          director_notes: data.notes,
          office_stamp_applied: data.status === 'approved',
        } as any)
        .eq('id', data.signatureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-pending-approvals'] });
      toast.success('تم مراجعة التوقيع');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    office,
    members,
    clients,
    signingPolicies,
    pendingApprovals,
    loadingOffice,
    loadingMembers,
    loadingClients,
    loadingPolicies,
    createOffice,
    addMember,
    updateMember,
    removeMember,
    assignClient,
    saveSigningPolicy,
    reviewSignature,
    isDirector: office?.director_user_id === profile?.user_id,
  };
};

// ═══ Hook: useConsultantAssignments (for individual consultant) ═══
export const useConsultantAssignments = () => {
  const { profile } = useAuth();

  // Get consultant profile
  const { data: consultantProfile } = useQuery({
    queryKey: ['my-consultant-profile', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase
        .from('environmental_consultants')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Get office memberships for this consultant
  const { data: officeMemberships = [] } = useQuery({
    queryKey: ['my-office-memberships', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('office_consultant_memberships')
        .select(`*, office:consulting_offices(id, office_name, office_stamp_url, organization_id)`)
        .eq('consultant_id', consultantProfile.id)
        .eq('is_active', true);
      return (data || []) as any as (OfficeMembership & { office: any })[];
    },
    enabled: !!consultantProfile?.id,
  });

  // Get direct client assignments (individual or via office)
  const { data: clientAssignments = [] } = useQuery({
    queryKey: ['my-client-assignments', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('consultant_client_assignments')
        .select(`*, client_organization:organizations(id, name, organization_type, city, logo_url, partner_code)`)
        .eq('consultant_id', consultantProfile.id)
        .eq('is_active', true);
      return (data || []) as any as ClientAssignment[];
    },
    enabled: !!consultantProfile?.id,
  });

  return {
    consultantProfile,
    officeMemberships,
    clientAssignments,
    isInOffice: officeMemberships.length > 0,
  };
};
