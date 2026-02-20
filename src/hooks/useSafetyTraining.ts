import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSafetyTrainingCourses() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ['safety-courses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('safety_training_courses')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addCourse = useMutation({
    mutationFn: async (course: any) => {
      const { data, error } = await supabase
        .from('safety_training_courses')
        .insert({ ...course, organization_id: orgId, created_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-courses', orgId] });
      toast.success('تم إضافة الدورة بنجاح');
    },
    onError: () => toast.error('فشل في إضافة الدورة'),
  });

  return { courses: coursesQuery.data || [], isLoading: coursesQuery.isLoading, addCourse };
}

export function useSafetyTrainingRecords(courseId?: string) {
  const { profile, organization } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['safety-records', orgId, courseId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from('safety_training_records')
        .select('*, safety_training_courses(title, course_type, certificate_validity_months)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addRecord = useMutation({
    mutationFn: async (record: any) => {
      const { data, error } = await supabase
        .from('safety_training_records')
        .insert({ ...record, organization_id: orgId, issued_by: profile?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-records', orgId] });
      toast.success('تم تسجيل المتدرب بنجاح');
    },
    onError: () => toast.error('فشل في تسجيل المتدرب'),
  });

  const issueCard = useMutation({
    mutationFn: async ({ id, validityMonths }: { id: string; validityMonths: number }) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + validityMonths);
      const qrData = JSON.stringify({
        type: 'SAFETY_CARD',
        record_id: id,
        org_id: orgId,
        org_name: organization?.name,
        issued_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });
      const { error } = await supabase
        .from('safety_training_records')
        .update({
          card_issued: true,
          card_issued_at: new Date().toISOString(),
          card_expires_at: expiresAt.toISOString(),
          card_qr_data: qrData,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-records', orgId] });
      toast.success('تم إصدار كارنيه السيفتي بنجاح');
    },
    onError: () => toast.error('فشل في إصدار الكارنيه'),
  });

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    addRecord,
    issueCard,
  };
}
