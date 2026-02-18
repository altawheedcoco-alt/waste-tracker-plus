import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

export interface EmployeeDocument {
  id: string;
  organization_id: string;
  member_id: string;
  document_type: string;
  document_name: string;
  document_name_ar: string | null;
  file_url: string | null;
  file_type: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeExternalCourse {
  id: string;
  organization_id: string;
  member_id: string;
  course_name: string;
  course_name_ar: string | null;
  provider: string | null;
  certificate_url: string | null;
  completion_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface EmployeeInsurance {
  id: string;
  organization_id: string;
  member_id: string;
  insurance_type: string;
  insurance_number: string | null;
  provider: string | null;
  start_date: string | null;
  end_date: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  national_id: 'بطاقة رقم قومي',
  driving_license: 'رخصة قيادة',
  health_cert: 'شهادة صحية',
  criminal_record: 'صحيفة جنائية',
  insurance_print: 'برنت تأمينات',
  contract: 'عقد عمل',
  other: 'أخرى',
};

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  social: 'تأمين اجتماعي',
  medical: 'تأمين طبي',
  life: 'تأمين على الحياة',
};

export { DOC_TYPE_LABELS, INSURANCE_TYPE_LABELS };

export function useEmployeeDocuments(memberId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const query = useQuery({
    queryKey: ['employee-documents', memberId],
    queryFn: async () => {
      if (!orgId || !memberId) return [];
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('organization_id', orgId)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EmployeeDocument[];
    },
    enabled: !!orgId && !!memberId,
  });

  const addDocument = useMutation({
    mutationFn: async (doc: Omit<EmployeeDocument, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'uploaded_by'>) => {
      if (!orgId) throw new Error('No org');
      const { error } = await supabase.from('employee_documents').insert({
        ...doc,
        organization_id: orgId,
        uploaded_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', memberId] });
      toast.success('تم إضافة المستند');
    },
    onError: () => toast.error('خطأ في إضافة المستند'),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', memberId] });
      toast.success('تم حذف المستند');
    },
  });

  return { documents: query.data || [], isLoading: query.isLoading, addDocument, deleteDocument };
}

export function useEmployeeCourses(memberId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const query = useQuery({
    queryKey: ['employee-courses', memberId],
    queryFn: async () => {
      if (!orgId || !memberId) return [];
      const { data, error } = await supabase
        .from('employee_external_courses')
        .select('*')
        .eq('organization_id', orgId)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EmployeeExternalCourse[];
    },
    enabled: !!orgId && !!memberId,
  });

  const addCourse = useMutation({
    mutationFn: async (course: Omit<EmployeeExternalCourse, 'id' | 'organization_id' | 'created_at'>) => {
      if (!orgId) throw new Error('No org');
      const { error } = await supabase.from('employee_external_courses').insert({
        ...course,
        organization_id: orgId,
        uploaded_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-courses', memberId] });
      toast.success('تم إضافة الدورة');
    },
    onError: () => toast.error('خطأ في إضافة الدورة'),
  });

  return { courses: query.data || [], isLoading: query.isLoading, addCourse };
}

export function useEmployeeInsurance(memberId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const query = useQuery({
    queryKey: ['employee-insurance', memberId],
    queryFn: async () => {
      if (!orgId || !memberId) return [];
      const { data, error } = await supabase
        .from('employee_insurance')
        .select('*')
        .eq('organization_id', orgId)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EmployeeInsurance[];
    },
    enabled: !!orgId && !!memberId,
  });

  const addInsurance = useMutation({
    mutationFn: async (ins: Omit<EmployeeInsurance, 'id' | 'organization_id' | 'created_at'>) => {
      if (!orgId) throw new Error('No org');
      const { error } = await supabase.from('employee_insurance').insert({
        ...ins,
        organization_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-insurance', memberId] });
      toast.success('تم إضافة بيانات التأمين');
    },
    onError: () => toast.error('خطأ في إضافة التأمين'),
  });

  return { insurance: query.data || [], isLoading: query.isLoading, addInsurance };
}

export async function uploadEmployeeFile(orgId: string, memberId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${orgId}/${memberId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('employee-files').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('employee-files').getPublicUrl(path);
  return data.publicUrl;
}
