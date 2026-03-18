import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useMemo } from 'react';

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
      qc.invalidateQueries({ queryKey: ['cyber-stats'] });
      qc.invalidateQueries({ queryKey: ['cyber-advanced-stats'] });
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
      qc.invalidateQueries({ queryKey: ['cyber-stats'] });
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

// Advanced analytics hook
export function useCyberAdvancedStats(threats: CyberThreat[]) {
  return useMemo(() => {
    if (!threats.length) return null;

    // Distribution by type
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byHour: Record<number, number> = {};
    const byDay: Record<string, number> = {};
    const autoVsManual = { auto: 0, manual: 0, pending: 0 };
    let totalResponseTimeMs = 0;
    let responseCount = 0;

    for (const t of threats) {
      byType[t.threat_type] = (byType[t.threat_type] || 0) + 1;
      bySeverity[t.severity] = (bySeverity[t.severity] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;

      const dt = new Date(t.detected_at);
      byHour[dt.getHours()] = (byHour[dt.getHours()] || 0) + 1;
      const dayKey = dt.toISOString().split('T')[0];
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;

      if (t.auto_response_taken) {
        autoVsManual.auto++;
      } else if (t.status === 'resolved' || t.status === 'mitigated') {
        autoVsManual.manual++;
      } else {
        autoVsManual.pending++;
      }

      if (t.auto_response_at && t.detected_at) {
        const diff = new Date(t.auto_response_at).getTime() - new Date(t.detected_at).getTime();
        if (diff > 0) { totalResponseTimeMs += diff; responseCount++; }
      }
    }

    const avgResponseTimeSec = responseCount > 0 ? Math.round(totalResponseTimeMs / responseCount / 1000) : 0;

    // Top attack sources (IPs)
    const ipCounts: Record<string, number> = {};
    for (const t of threats) {
      if (t.source_ip) ipCounts[t.source_ip] = (ipCounts[t.source_ip] || 0) + 1;
    }
    const topIPs = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Trend: last 30 days
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      last30.push({ date: key, count: byDay[key] || 0 });
    }

    // Peak attack hours
    const peakHours = Object.entries(byHour).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Security score (0-100)
    const criticalRatio = (bySeverity['critical'] || 0) / Math.max(threats.length, 1);
    const activeRatio = ((byStatus['detected'] || 0) + (byStatus['analyzing'] || 0)) / Math.max(threats.length, 1);
    const autoRatio = autoVsManual.auto / Math.max(autoVsManual.auto + autoVsManual.manual + autoVsManual.pending, 1);
    const securityScore = Math.round(
      Math.max(0, Math.min(100, 100 - (criticalRatio * 40) - (activeRatio * 30) + (autoRatio * 20)))
    );

    return {
      byType,
      bySeverity,
      byStatus,
      autoVsManual,
      avgResponseTimeSec,
      topIPs,
      last30,
      peakHours,
      securityScore,
    };
  }, [threats]);
}
