import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ═══ Safety Team ═══
export function useSafetyTeam() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['safety-team', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('safety_team_members' as any).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (member: any) => {
      const { error } = await supabase.from('safety_team_members' as any).insert({ ...member, organization_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safety-team', orgId] }); toast.success('تم إضافة العضو بنجاح'); },
    onError: () => toast.error('فشل في الإضافة'),
  });

  return { members: query.data || [], isLoading: query.isLoading, add };
}

// ═══ Hazard Register ═══
export function useHazardRegister() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['hazards', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('hazard_registers' as any).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (hazard: any) => {
      const riskScore = (hazard.likelihood || 1) * (hazard.severity || 1);
      const riskLevel = riskScore <= 4 ? 'low' : riskScore <= 9 ? 'medium' : riskScore <= 16 ? 'high' : 'critical';
      const { error } = await supabase.from('hazard_registers' as any).insert({
        ...hazard, organization_id: orgId, reported_by: profile?.id, risk_level: riskLevel,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hazards', orgId] }); toast.success('تم تسجيل الخطر'); },
    onError: () => toast.error('فشل في التسجيل'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('hazard_registers' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hazards', orgId] }); toast.success('تم التحديث'); },
  });

  return { hazards: query.data || [], isLoading: query.isLoading, add, update };
}

// ═══ PPE Assignments ═══
export function usePPEAssignments() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['ppe', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('ppe_assignments' as any).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (ppe: any) => {
      const { error } = await supabase.from('ppe_assignments' as any).insert({ ...ppe, organization_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ppe', orgId] }); toast.success('تم تسليم المعدة'); },
    onError: () => toast.error('فشل في التسجيل'),
  });

  return { assignments: query.data || [], isLoading: query.isLoading, add };
}

// ═══ JSA ═══
export function useJSAAnalyses() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['jsa', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('jsa_analyses' as any).select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (jsa: any) => {
      const { error } = await supabase.from('jsa_analyses' as any).insert({ ...jsa, organization_id: orgId, created_by: profile?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jsa', orgId] }); toast.success('تم إنشاء التحليل'); },
    onError: () => toast.error('فشل في الإنشاء'),
  });

  return { analyses: query.data || [], isLoading: query.isLoading, add };
}

// ═══ Toolbox Talks ═══
export function useToolboxTalks() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['toolbox-talks', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('toolbox_talks' as any).select('*').eq('organization_id', orgId).order('talk_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (talk: any) => {
      const { error } = await supabase.from('toolbox_talks' as any).insert({ ...talk, organization_id: orgId, conducted_by: profile?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['toolbox-talks', orgId] }); toast.success('تم تسجيل الاجتماع'); },
    onError: () => toast.error('فشل في التسجيل'),
  });

  return { talks: query.data || [], isLoading: query.isLoading, add };
}

// ═══ Safety Inspections ═══
export function useSafetyInspections() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['safety-inspections', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('safety_inspections' as any).select('*').eq('organization_id', orgId).order('inspection_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const add = useMutation({
    mutationFn: async (inspection: any) => {
      const { error } = await supabase.from('safety_inspections' as any).insert({ ...inspection, organization_id: orgId, inspector_id: profile?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safety-inspections', orgId] }); toast.success('تم تسجيل التفتيش'); },
    onError: () => toast.error('فشل في التسجيل'),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('safety_inspections' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safety-inspections', orgId] }); toast.success('تم التحديث'); },
  });

  return { inspections: query.data || [], isLoading: query.isLoading, add, update };
}

// ═══ Safety Certificates ═══
export function useSafetyCertificates() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['safety-certificates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('safety_certificates' as any).select('*')
        .or(`organization_id.eq.${orgId},recipient_org_id.eq.${orgId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const issue = useMutation({
    mutationFn: async (cert: any) => {
      const certNumber = `SC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const verificationCode = `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const qrData = JSON.stringify({ type: 'SAFETY_CERT', cert_number: certNumber, org_id: orgId, issued_at: new Date().toISOString() });
      
      const { error } = await supabase.from('safety_certificates' as any).insert({
        ...cert,
        organization_id: orgId,
        issued_by: profile?.id,
        certificate_number: certNumber,
        verification_code: verificationCode,
        qr_data: qrData,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['safety-certificates', orgId] }); toast.success('تم إصدار الشهادة بنجاح'); },
    onError: () => toast.error('فشل في الإصدار'),
  });

  return { certificates: query.data || [], isLoading: query.isLoading, issue };
}
