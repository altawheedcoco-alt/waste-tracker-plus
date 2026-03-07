import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface CyberThreat {
  id: string;
  organization_id?: string;
  threat_type: string;
  severity: string;
  status: string;
  source_ip?: string;
  source_user_id?: string;
  target_resource?: string;
  description: string;
  attack_vector?: string;
  evidence?: any;
  ai_analysis?: string;
  ai_confidence?: number;
  auto_response_taken?: string;
  auto_response_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  detected_at: string;
  created_at: string;
}

export interface DefenseRule {
  id: string;
  rule_name: string;
  rule_name_en?: string;
  description?: string;
  threat_type: string;
  severity_trigger: string;
  action_type: string;
  action_config?: any;
  is_enabled: boolean;
  cooldown_minutes: number;
  last_triggered_at?: string;
  trigger_count: number;
}

export interface ThreatPattern {
  id: string;
  pattern_name: string;
  pattern_type: string;
  pattern_signature: any;
  risk_score: number;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  is_whitelisted: boolean;
}

export function useCyberThreats() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['cyber-threats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cyber_threats')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as CyberThreat[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('cyber-threats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cyber_threats' }, (payload) => {
        const threat = payload.new as CyberThreat;
        if (threat.severity === 'critical') {
          toast.error(`🔴 تهديد حرج: ${threat.description}`, { duration: 10000 });
        } else if (threat.severity === 'high') {
          toast.warning(`⚠️ تهديد عالي: ${threat.description}`, { duration: 8000 });
        }
        qc.invalidateQueries({ queryKey: ['cyber-threats'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

export function useDefenseRules() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['defense-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cyber_defense_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as DefenseRule[];
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from('cyber_defense_rules').update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['defense-rules'] });
      toast.success('تم تحديث القاعدة');
    },
  });

  return { ...query, toggleRule };
}

export function useThreatPatterns() {
  return useQuery({
    queryKey: ['threat-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threat_patterns')
        .select('*')
        .order('risk_score', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as unknown as ThreatPattern[];
    },
  });
}

export function useRunThreatScan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cyber-threat-analyzer', {
        body: { action: 'scan' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.threats_found > 0) {
        toast.warning(`تم اكتشاف ${data.threats_found} تهديد — تم التعامل مع ${data.threats_mitigated} تلقائياً`);
      } else {
        toast.success('✅ لم يتم اكتشاف أي تهديدات — النظام آمن');
      }
      qc.invalidateQueries({ queryKey: ['cyber-threats'] });
      qc.invalidateQueries({ queryKey: ['threat-patterns'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'فشل في الفحص الأمني');
    },
  });
}

export function useResolveThreat() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes, status }: { id: string; notes?: string; status: string }) => {
      const { error } = await supabase.from('cyber_threats').update({
        status,
        resolution_notes: notes,
        resolved_at: new Date().toISOString(),
      } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث حالة التهديد');
      qc.invalidateQueries({ queryKey: ['cyber-threats'] });
    },
  });
}

export function useCyberStats() {
  return useQuery({
    queryKey: ['cyber-stats'],
    queryFn: async () => {
      const [totalRes, critRes, mitigatedRes, activeRes] = await Promise.all([
        supabase.from('cyber_threats').select('id', { count: 'exact', head: true }),
        supabase.from('cyber_threats').select('id', { count: 'exact', head: true }).eq('severity', 'critical'),
        supabase.from('cyber_threats').select('id', { count: 'exact', head: true }).eq('status', 'mitigated'),
        supabase.from('cyber_threats').select('id', { count: 'exact', head: true }).in('status', ['detected', 'analyzing']),
      ]);
      return {
        total: totalRes.count || 0,
        critical: critRes.count || 0,
        mitigated: mitigatedRes.count || 0,
        active: activeRes.count || 0,
      };
    },
  });
}
