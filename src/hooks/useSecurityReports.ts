import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface SecurityReport {
  id: string;
  organization_id: string | null;
  report_type: string;
  report_period: string;
  status: string;
  summary: string;
  total_threats: number;
  critical_threats: number;
  high_threats: number;
  medium_threats: number;
  low_threats: number;
  threats_mitigated: number;
  threats_pending: number;
  security_score: number;
  findings: any[];
  recommendations: string[];
  period_start: string;
  period_end: string;
  generated_at: string;
  created_at: string;
}

export function useSecurityReports(limit = 20) {
  const { profile } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['security-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as SecurityReport[];
    },
    enabled: !!profile,
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('security-reports-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_reports' }, () => {
        qc.invalidateQueries({ queryKey: ['security-reports'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useGenerateSecurityReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { period?: string; type?: string } = {}) => {
      const { data, error } = await supabase.functions.invoke('generate-security-report', {
        body: { period: params.period || 'daily', type: params.type || 'on_demand' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const status = data?.report?.status;
      if (status === 'critical') {
        toast.error('🔴 تقرير أمني حرج — يرجى المراجعة فوراً');
      } else if (status === 'warning') {
        toast.warning('⚠️ تم إصدار تقرير أمني — يوجد تحذيرات');
      } else {
        toast.success('✅ تم إصدار التقرير الأمني — النظام آمن');
      }
      qc.invalidateQueries({ queryKey: ['security-reports'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'فشل في إصدار التقرير');
    },
  });
}
