import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { useCallback } from 'react';

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  parent_department_id: string | null;
  head_user_id: string | null;
  sort_order: number;
  is_active: boolean;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  positions?: Position[];
  head_user?: { full_name: string } | null;
}

export interface Position {
  id: string;
  organization_id: string;
  department_id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  level: number;
  assigned_user_id: string | null;
  reports_to_position_id: string | null;
  is_active: boolean;
  permissions: any;
  max_holders: number;
  sort_order: number;
  operator_type: 'human' | 'ai';
  auto_email: string | null;
  holder_name: string | null;
  holder_phone: string | null;
  holder_national_id: string | null;
  dashboard_mode: 'management' | 'workspace';
  created_at: string;
  updated_at: string;
  assigned_user?: { full_name: string; avatar_url: string | null } | null;
}

export function useOrgStructure(organizationId?: string) {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organizationId || profile?.organization_id;
  const orgType = organization?.organization_type || 'generator';

  const departmentsQuery = useQuery({
    queryKey: ['org-departments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('organization_departments')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Department[];
    },
    enabled: !!orgId,
  });

  const positionsQuery = useQuery({
    queryKey: ['org-positions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('organization_positions')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('level', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Position[];
    },
    enabled: !!orgId,
  });

  // Combine departments with their positions
  const structure = (departmentsQuery.data || []).map(dept => ({
    ...dept,
    positions: (positionsQuery.data || []).filter(p => p.department_id === dept.id),
  }));

  const addDepartment = useMutation({
    mutationFn: async (dept: Partial<Department>) => {
      const { data, error } = await supabase
        .from('organization_departments')
        .insert({ ...dept, organization_id: orgId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-departments', orgId] });
      toast.success('تم إضافة القسم بنجاح');
    },
  });

  const addPosition = useMutation({
    mutationFn: async (pos: Partial<Position>) => {
      const { data, error } = await supabase
        .from('organization_positions')
        .insert({ ...pos, organization_id: orgId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-positions', orgId] });
      toast.success('تم إضافة المنصب بنجاح');
    },
  });

  const assignUser = useMutation({
    mutationFn: async ({ positionId, userId }: { positionId: string; userId: string | null }) => {
      const { error } = await supabase
        .from('organization_positions')
        .update({ assigned_user_id: userId } as any)
        .eq('id', positionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-positions', orgId] });
      toast.success('تم تعيين الموظف بنجاح');
    },
  });

  const seedStructure = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization ID');
      const { error } = await supabase.rpc('seed_org_structure', {
        p_org_id: orgId,
        p_org_type: orgType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-departments', orgId] });
      queryClient.invalidateQueries({ queryKey: ['org-positions', orgId] });
      toast.success('تم إنشاء الهيكل التنظيمي الافتراضي بنجاح');
    },
    onError: (err: any) => {
      console.error('Seed error:', err);
      toast.error('حدث خطأ أثناء إنشاء الهيكل التنظيمي');
    },
  });

  return {
    structure,
    departments: departmentsQuery.data || [],
    positions: positionsQuery.data || [],
    isLoading: departmentsQuery.isLoading || positionsQuery.isLoading,
    addDepartment,
    addPosition,
    assignUser,
    seedStructure,
    refetch: () => {
      departmentsQuery.refetch();
      positionsQuery.refetch();
    },
  };
}
