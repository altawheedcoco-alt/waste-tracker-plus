import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSafetyQuizQuestions(courseId?: string) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const questionsQuery = useQuery({
    queryKey: ['safety-quiz-questions', orgId, courseId],
    queryFn: async () => {
      if (!orgId || !courseId) return [];
      const { data, error } = await supabase
        .from('safety_quiz_questions')
        .select('*')
        .eq('organization_id', orgId)
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!courseId,
  });

  const addQuestion = useMutation({
    mutationFn: async (question: { course_id: string; question_ar: string; options: any[]; points?: number }) => {
      const { data, error } = await supabase
        .from('safety_quiz_questions')
        .insert({ ...question, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-quiz-questions', orgId, courseId] });
      toast.success('تم إضافة السؤال بنجاح');
    },
    onError: () => toast.error('فشل في إضافة السؤال'),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('safety_quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-quiz-questions', orgId, courseId] });
      toast.success('تم حذف السؤال');
    },
  });

  return {
    questions: questionsQuery.data || [],
    isLoading: questionsQuery.isLoading,
    addQuestion,
    deleteQuestion,
  };
}

export function useSafetyQuizAttempts(courseId?: string) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const queryClient = useQueryClient();

  const attemptsQuery = useQuery({
    queryKey: ['safety-quiz-attempts', orgId, courseId],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from('safety_quiz_attempts')
        .select('*, safety_training_records(trainee_name), safety_training_courses(title, passing_score)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const submitAttempt = useMutation({
    mutationFn: async (attempt: {
      record_id: string;
      course_id: string;
      answers: any[];
      score: number;
      total_points: number;
      percentage: number;
      passed: boolean;
    }) => {
      const { data, error } = await supabase
        .from('safety_quiz_attempts')
        .insert({ ...attempt, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      // Update training record score & pass status if passed
      if (attempt.passed) {
        await supabase
          .from('safety_training_records')
          .update({ score: attempt.percentage, passed: true, attendance_status: 'attended' })
          .eq('id', attempt.record_id);
        queryClient.invalidateQueries({ queryKey: ['safety-records'] });
      }
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['safety-quiz-attempts', orgId] });
      if (vars.passed) {
        toast.success('🎉 مبروك! تم اجتياز الامتحان بنجاح');
      } else {
        toast.error('لم يتم اجتياز الامتحان، يمكن المحاولة مرة أخرى');
      }
    },
    onError: () => toast.error('فشل في حفظ نتيجة الامتحان'),
  });

  return {
    attempts: attemptsQuery.data || [],
    isLoading: attemptsQuery.isLoading,
    submitAttempt,
  };
}
