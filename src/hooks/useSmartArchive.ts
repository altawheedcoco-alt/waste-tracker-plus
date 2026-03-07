import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DocumentAnalysis {
  id: string;
  organization_id: string;
  file_name: string;
  file_url?: string;
  document_type?: string;
  summary?: string;
  key_entities?: any[];
  keywords?: string[];
  sentiment?: string;
  risk_level?: string;
  risk_details?: string;
  category?: string;
  subcategory?: string;
  auto_tags?: string[];
  suggested_expiry_date?: string;
  requires_action?: boolean;
  action_description?: string;
  action_deadline?: string;
  related_parties?: any[];
  referenced_laws?: string[];
  financial_amounts?: any[];
  dates_mentioned?: any[];
  confidence_score?: number;
  analysis_status: string;
  analyzed_at?: string;
  created_at: string;
}

export interface SmartCollection {
  id: string;
  organization_id: string;
  collection_name: string;
  collection_name_en?: string;
  description?: string;
  icon: string;
  color: string;
  document_count: number;
  created_at: string;
}

export function useDocumentAnalyses() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['document-analyses', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_analysis')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as DocumentAnalysis[];
    },
    enabled: !!orgId,
  });
}

export function useAnalyzeDocument() {
  const { organization, profile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, fileName, fileUrl }: { text: string; fileName: string; fileUrl?: string }) => {
      // First create a pending record
      const { data: record, error: insertErr } = await supabase
        .from('document_analysis')
        .insert([{
          organization_id: organization!.id,
          file_name: fileName,
          file_url: fileUrl,
          analysis_status: 'pending',
          created_by: profile?.id,
        } as any])
        .select('id')
        .single();
      
      if (insertErr) throw insertErr;

      // Call AI analysis
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: {
          document_text: text,
          file_name: fileName,
          organization_id: organization!.id,
          analysis_id: record.id,
          document_url: fileUrl,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('تم تحليل الوثيقة بنجاح');
      qc.invalidateQueries({ queryKey: ['document-analyses'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'فشل في تحليل الوثيقة');
    },
  });
}

export function useSmartCollections() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['smart-collections', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_archive_collections')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as SmartCollection[];
    },
    enabled: !!orgId,
  });

  const createCollection = useMutation({
    mutationFn: async (coll: Partial<SmartCollection>) => {
      const { error } = await supabase.from('smart_archive_collections').insert([{ ...coll, organization_id: orgId! } as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء المجموعة');
      qc.invalidateQueries({ queryKey: ['smart-collections'] });
    },
    onError: () => toast.error('فشل في إنشاء المجموعة'),
  });

  return { collections, isLoading, createCollection };
}

export function useDocumentStats() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['document-stats', orgId],
    queryFn: async () => {
      const [totalRes, analyzedRes, riskRes, actionRes] = await Promise.all([
        supabase.from('document_analysis').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
        supabase.from('document_analysis').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('analysis_status', 'completed'),
        supabase.from('document_analysis').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).in('risk_level', ['high', 'critical']),
        supabase.from('document_analysis').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('requires_action', true),
      ]);
      return {
        total: totalRes.count || 0,
        analyzed: analyzedRes.count || 0,
        highRisk: riskRes.count || 0,
        requiresAction: actionRes.count || 0,
      };
    },
    enabled: !!orgId,
  });
}
