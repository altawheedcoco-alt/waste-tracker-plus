import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useEmergencyPlans() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['emergency-plans', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('emergency_plans')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addPlan = useMutation({
    mutationFn: async (plan: any) => {
      const { data, error } = await supabase
        .from('emergency_plans')
        .insert({ ...plan, organization_id: orgId, created_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-plans', orgId] });
      toast.success('تم إضافة خطة الطوارئ بنجاح');
    },
    onError: () => toast.error('فشل في إضافة خطة الطوارئ'),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('emergency_plans').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-plans', orgId] });
      toast.success('تم تحديث الخطة');
    },
  });

  return { plans: plansQuery.data || [], isLoading: plansQuery.isLoading, addPlan, updatePlan };
}

export function useEvacuationDrills() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const drillsQuery = useQuery({
    queryKey: ['evacuation-drills', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('evacuation_drills')
        .select('*')
        .eq('organization_id', orgId)
        .order('drill_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addDrill = useMutation({
    mutationFn: async (drill: any) => {
      const { data, error } = await supabase
        .from('evacuation_drills')
        .insert({ ...drill, organization_id: orgId, conducted_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evacuation-drills', orgId] });
      toast.success('تم تسجيل التدريب بنجاح');
    },
    onError: () => toast.error('فشل في تسجيل التدريب'),
  });

  const updateDrill = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('evacuation_drills').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evacuation-drills', orgId] });
      toast.success('تم تحديث التدريب');
    },
  });

  return { drills: drillsQuery.data || [], isLoading: drillsQuery.isLoading, addDrill, updateDrill };
}

export function useWorkPermits() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const permitsQuery = useQuery({
    queryKey: ['work-permits', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('work_permits')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addPermit = useMutation({
    mutationFn: async (permit: any) => {
      const { data, error } = await supabase
        .from('work_permits')
        .insert({ ...permit, organization_id: orgId, requested_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-permits', orgId] });
      toast.success('تم إنشاء تصريح العمل بنجاح');
    },
    onError: () => toast.error('فشل في إنشاء التصريح'),
  });

  const updatePermit = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('work_permits').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-permits', orgId] });
      toast.success('تم تحديث التصريح');
    },
  });

  return { permits: permitsQuery.data || [], isLoading: permitsQuery.isLoading, addPermit, updatePermit };
}

export function useSafetyStats() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['safety-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [plansRes, drillsRes, permitsRes, incidentsRes, ohsRes] = await Promise.all([
        supabase.from('emergency_plans').select('id, status', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('evacuation_drills').select('id, status, score', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('work_permits').select('id, status', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('incident_reports' as any).select('id, severity', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('ohs_reports' as any).select('id, compliance_percentage', { count: 'exact' }).eq('organization_id', orgId),
      ]);

      const activePlans = (plansRes.data || []).filter(p => p.status === 'active').length;
      const completedDrills = (drillsRes.data || []).filter(d => d.status === 'completed');
      const avgDrillScore = completedDrills.length > 0
        ? Math.round(completedDrills.reduce((s, d) => s + (d.score || 0), 0) / completedDrills.length)
        : 0;
      const activePermits = (permitsRes.data || []).filter(p => ['approved', 'active'].includes(p.status)).length;
      const pendingPermits = (permitsRes.data || []).filter(p => p.status === 'pending').length;
      const criticalIncidents = (incidentsRes.data || []).filter((i: any) => i.severity === 'critical').length;
      const ohsReports = ohsRes.data || [];
      const avgCompliance = ohsReports.length > 0
        ? Math.round(ohsReports.reduce((s, r: any) => s + (r.compliance_percentage || 0), 0) / ohsReports.length)
        : 0;

      return {
        totalPlans: plansRes.count || 0,
        activePlans,
        totalDrills: drillsRes.count || 0,
        completedDrills: completedDrills.length,
        avgDrillScore,
        totalPermits: permitsRes.count || 0,
        activePermits,
        pendingPermits,
        totalIncidents: incidentsRes.count || 0,
        criticalIncidents,
        totalOHSReports: ohsRes.count || 0,
        avgCompliance,
      };
    },
    enabled: !!orgId,
  });
}
