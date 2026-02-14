import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

export interface OrgMember {
  id: string;
  organization_id: string;
  user_id: string;
  profile_id: string | null;
  position_id: string | null;
  department_id: string | null;
  employee_number: string | null;
  job_title: string | null;
  job_title_ar: string | null;
  status: string;
  joined_at: string | null;
  invitation_email: string | null;
  notes: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    national_id: string | null;
  } | null;
  position?: {
    title_ar: string;
    title: string;
    level: number;
  } | null;
  department?: {
    name_ar: string;
    name: string;
  } | null;
}

export interface PositionPermissions {
  id: string;
  position_id: string;
  can_create_shipments: boolean;
  can_edit_shipments: boolean;
  can_delete_shipments: boolean;
  can_approve_shipments: boolean;
  can_change_status: boolean;
  can_view_financials: boolean;
  can_create_invoices: boolean;
  can_approve_payments: boolean;
  can_manage_deposits: boolean;
  can_manage_drivers: boolean;
  can_assign_drivers: boolean;
  can_track_vehicles: boolean;
  can_manage_users: boolean;
  can_manage_settings: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
  can_manage_contracts: boolean;
  can_manage_partners: boolean;
  can_view_partner_data: boolean;
  can_sign_documents: boolean;
  can_issue_certificates: boolean;
  can_manage_templates: boolean;
}

export function useOrgMembers() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const membersQuery = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('organization_members' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Enrich with profile, position, department data
      const members = data as any[];
      const enriched = await Promise.all(members.map(async (m: any) => {
        const [profileRes, posRes, deptRes] = await Promise.all([
          m.profile_id ? supabase.from('profiles').select('full_name, email, phone, avatar_url, national_id').eq('id', m.profile_id).single() : { data: null },
          m.position_id ? supabase.from('organization_positions' as any).select('title_ar, title, level').eq('id', m.position_id).single() : { data: null },
          m.department_id ? supabase.from('organization_departments' as any).select('name_ar, name').eq('id', m.department_id).single() : { data: null },
        ]);
        return {
          ...m,
          profile: profileRes.data,
          position: posRes.data,
          department: deptRes.data,
        };
      }));
      return enriched as OrgMember[];
    },
    enabled: !!orgId,
  });

  const addMember = useMutation({
    mutationFn: async (member: {
      email: string;
      full_name: string;
      phone?: string;
      position_id?: string;
      department_id?: string;
      job_title_ar?: string;
      employee_number?: string;
    }) => {
      if (!orgId) throw new Error('No organization');

      // Check if user already exists by email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('email', member.email)
        .single();

      if (existingProfile) {
        // Link existing user
        const { error } = await supabase.from('organization_members' as any).insert({
          organization_id: orgId,
          user_id: existingProfile.user_id,
          profile_id: existingProfile.id,
          position_id: member.position_id || null,
          department_id: member.department_id || null,
          job_title_ar: member.job_title_ar || null,
          employee_number: member.employee_number || null,
          status: 'active',
        });
        if (error) throw error;
      } else {
        // Create invitation record (pending)
        const { error } = await supabase.from('organization_members' as any).insert({
          organization_id: orgId,
          user_id: profile!.user_id, // temporary, will be updated on accept
          profile_id: null,
          position_id: member.position_id || null,
          department_id: member.department_id || null,
          job_title_ar: member.job_title_ar || null,
          employee_number: member.employee_number || null,
          invitation_email: member.email,
          invited_by: profile!.id,
          status: 'pending_invitation',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      toast.success('تم إضافة العضو بنجاح');
    },
    onError: (err: any) => {
      if (err.message?.includes('duplicate')) {
        toast.error('هذا العضو مسجل بالفعل في المنظمة');
      } else {
        toast.error(err.message || 'خطأ في إضافة العضو');
      }
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('organization_members' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      toast.success('تم تحديث بيانات العضو');
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('organization_members' as any).update({ status: 'terminated', left_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      toast.success('تم إنهاء عضوية الموظف');
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    addMember,
    updateMember,
    removeMember,
    refetch: membersQuery.refetch,
  };
}

export function usePositionPermissions(positionId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const permissionsQuery = useQuery({
    queryKey: ['position-permissions', positionId],
    queryFn: async () => {
      if (!positionId) return null;
      const { data, error } = await supabase
        .from('position_permissions' as any)
        .select('*')
        .eq('position_id', positionId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as unknown) as PositionPermissions | null;
    },
    enabled: !!positionId,
  });

  const updatePermissions = useMutation({
    mutationFn: async (perms: Partial<PositionPermissions>) => {
      if (!positionId || !orgId) throw new Error('Missing data');
      const { error } = await supabase.from('position_permissions' as any).upsert({
        position_id: positionId,
        organization_id: orgId,
        ...perms,
      }, { onConflict: 'position_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['position-permissions', positionId] });
      toast.success('تم تحديث الصلاحيات');
    },
  });

  return {
    permissions: permissionsQuery.data,
    isLoading: permissionsQuery.isLoading,
    updatePermissions,
  };
}
