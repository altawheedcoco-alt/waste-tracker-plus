import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useMedicalExaminations() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['medical-examinations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('medical_examinations' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('examination_date', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const addExam = useMutation({
    mutationFn: async (exam: any) => {
      const { data, error } = await supabase
        .from('medical_examinations' as any)
        .insert({ ...exam, organization_id: orgId, created_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-examinations', orgId] });
      toast.success('تم إضافة الكشف الطبي بنجاح');
    },
    onError: () => toast.error('فشل في إضافة الكشف الطبي'),
  });

  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('medical_examinations' as any).update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-examinations', orgId] });
      toast.success('تم تحديث الكشف الطبي');
    },
  });

  return { examinations: query.data || [], isLoading: query.isLoading, addExam, updateExam };
}

export function useMedicalExamResults(examinationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['medical-exam-results', examinationId],
    queryFn: async () => {
      if (!examinationId) return [];
      const { data, error } = await supabase
        .from('medical_exam_results' as any)
        .select('*')
        .eq('examination_id', examinationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!examinationId,
  });

  const addResult = useMutation({
    mutationFn: async (result: any) => {
      const { data, error } = await supabase
        .from('medical_exam_results' as any)
        .insert(result)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-exam-results', examinationId] });
      toast.success('تم إضافة نتيجة الفحص');
    },
  });

  return { results: query.data || [], isLoading: query.isLoading, addResult };
}

export function useMedicalCertificates() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['medical-certificates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('medical_certificates' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const addCertificate = useMutation({
    mutationFn: async (cert: any) => {
      const { data, error } = await supabase
        .from('medical_certificates' as any)
        .insert({ ...cert, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-certificates', orgId] });
      toast.success('تم إصدار الشهادة الطبية');
    },
  });

  return { certificates: query.data || [], isLoading: query.isLoading, addCertificate };
}

export function useVaccinationRecords() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['vaccination-records', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('vaccination_records' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('vaccination_date', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const addVaccination = useMutation({
    mutationFn: async (vac: any) => {
      const { data, error } = await supabase
        .from('vaccination_records' as any)
        .insert({ ...vac, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccination-records', orgId] });
      toast.success('تم تسجيل التطعيم بنجاح');
    },
  });

  return { vaccinations: query.data || [], isLoading: query.isLoading, addVaccination };
}

export function useMedicalInjuries() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['medical-injuries', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('medical_injuries' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('injury_date', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const addInjury = useMutation({
    mutationFn: async (injury: any) => {
      const { data, error } = await supabase
        .from('medical_injuries' as any)
        .insert({ ...injury, organization_id: orgId, created_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-injuries', orgId] });
      toast.success('تم تسجيل الإصابة');
    },
  });

  return { injuries: query.data || [], isLoading: query.isLoading, addInjury };
}

export function useHazardousExposure() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hazardous-exposure', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('hazardous_exposure_records' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('exposure_date', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  const addExposure = useMutation({
    mutationFn: async (exp: any) => {
      const { data, error } = await supabase
        .from('hazardous_exposure_records' as any)
        .insert({ ...exp, organization_id: orgId, created_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazardous-exposure', orgId] });
      toast.success('تم تسجيل التعرض');
    },
  });

  return { exposures: query.data || [], isLoading: query.isLoading, addExposure };
}

export function useMedicalStats() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return useQuery({
    queryKey: ['medical-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [examsRes, certsRes, vacsRes, injuriesRes, exposureRes] = await Promise.all([
        supabase.from('medical_examinations' as any).select('id, status, overall_result', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('medical_certificates' as any).select('id, status', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('vaccination_records' as any).select('id', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('medical_injuries' as any).select('id, severity', { count: 'exact' }).eq('organization_id', orgId),
        supabase.from('hazardous_exposure_records' as any).select('id, exposure_level', { count: 'exact' }).eq('organization_id', orgId),
      ]);

      const exams = (examsRes.data || []) as any[];
      const completedExams = exams.filter(e => e.status === 'completed').length;
      const fitEmployees = exams.filter(e => e.overall_result === 'fit').length;
      const certs = (certsRes.data || []) as any[];
      const activeCerts = certs.filter(c => c.status === 'active').length;
      const injuries = (injuriesRes.data || []) as any[];
      const severeInjuries = injuries.filter((i: any) => ['severe', 'critical'].includes(i.severity)).length;
      const exposures = (exposureRes.data || []) as any[];
      const highExposures = exposures.filter((e: any) => ['high', 'critical'].includes(e.exposure_level)).length;

      return {
        totalExams: examsRes.count || 0,
        completedExams,
        fitEmployees,
        totalCertificates: certsRes.count || 0,
        activeCerts,
        totalVaccinations: vacsRes.count || 0,
        totalInjuries: injuriesRes.count || 0,
        severeInjuries,
        totalExposures: exposureRes.count || 0,
        highExposures,
      };
    },
    enabled: !!orgId,
  });
}
