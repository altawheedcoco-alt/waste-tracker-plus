import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLMSCategories = () => {
  return useQuery({
    queryKey: ['lms-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};

export const useLMSCourses = (categoryId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lms-courses', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('lms_courses')
        .select('*, lms_categories(name, name_ar, icon, color)')
        .eq('is_published', true)
        .order('sort_order');
      if (categoryId) query = query.eq('category_id', categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useLMSCourseDetail = (courseId: string) => {
  return useQuery({
    queryKey: ['lms-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_courses')
        .select('*, lms_categories(name, name_ar, icon, color)')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

export const useLMSLessons = (courseId: string) => {
  return useQuery({
    queryKey: ['lms-lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

export const useLMSQuizQuestions = (courseId: string) => {
  return useQuery({
    queryKey: ['lms-quiz', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_quiz_questions')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
};

export const useLMSEnrollment = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lms-enrollment', courseId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('lms_enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user,
  });
};

export const useLMSMyEnrollments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lms-my-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lms_enrollments')
        .select('*, lms_courses(id, title, title_ar, cover_image_url, estimated_duration_minutes, difficulty_level, lms_categories(name_ar, icon, color))')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useLMSLessonProgress = (courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lms-lesson-progress', courseId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lms_lesson_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user,
  });
};

export const useLMSMyCertificates = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lms-my-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lms_certificates')
        .select('*, lms_courses(title, title_ar, lms_categories(name_ar, icon))')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useEnrollInCourse = () => {
  const { user, organization } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('lms_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          organization_id: organization?.id,
          status: 'enrolled',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, courseId) => {
      qc.invalidateQueries({ queryKey: ['lms-enrollment', courseId] });
      qc.invalidateQueries({ queryKey: ['lms-my-enrollments'] });
      toast.success('تم التسجيل في الدورة بنجاح');
    },
    onError: () => toast.error('فشل التسجيل في الدورة'),
  });
};

export const useMarkLessonComplete = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, courseId }: { lessonId: string; courseId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('lms_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['lms-lesson-progress', courseId] });
      toast.success('تم إكمال الدورة');
    },
  });
};

export const useSubmitQuiz = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, answers, score, totalPoints }: {
      courseId: string;
      answers: any[];
      score: number;
      totalPoints: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      const { data, error } = await supabase
        .from('lms_quiz_attempts')
        .insert({
          user_id: user.id,
          course_id: courseId,
          score,
          total_points: totalPoints,
          percentage,
          passed: percentage >= 70,
          answers,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['lms-my-certificates'] });
      qc.invalidateQueries({ queryKey: ['lms-enrollment', courseId] });
      qc.invalidateQueries({ queryKey: ['lms-my-enrollments'] });
      if (data.passed) {
        toast.success('🎉 مبروك! اجتزت الاختبار بنجاح');
      } else {
        toast.error('لم تجتز الاختبار. حاول مرة أخرى');
      }
    },
    onError: () => toast.error('فشل إرسال الاختبار'),
  });
};
