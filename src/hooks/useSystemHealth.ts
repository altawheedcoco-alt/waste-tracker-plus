import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useEffect, useState } from 'react';

export interface ModuleHealth {
  name: string;
  health: number;
  status: 'healthy' | 'warning' | 'critical';
  lastActivity: string | null;
  issues: string[];
}

export interface SystemHealthSummary {
  id: string;
  overall_health_score: number;
  total_checks: number;
  passed_checks: number;
  warning_checks: number;
  critical_checks: number;
  modules_status: Record<string, ModuleHealth>;
  edge_functions_status: {
    total: number;
    deployed: number;
    status: string;
  };
  database_status: {
    connectivity: string;
    latency_ms: number;
    tables_checked: number;
  };
  last_check_at: string;
  created_at: string;
  updated_at: string;
}

export interface HealthMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  details: Record<string, unknown>;
  recorded_at: string;
}

export const useSystemHealth = () => {
  const [realtimeSummary, setRealtimeSummary] = useState<SystemHealthSummary | null>(null);

  // Fetch initial summary
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['system-health-summary'],
    queryFn: async (): Promise<SystemHealthSummary | null> => {
      const { data, error } = await supabase
        .from('system_health_summary')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching health summary:', error);
        return null;
      }

      return data as unknown as SystemHealthSummary;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch recent metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-health-metrics'],
    queryFn: async (): Promise<HealthMetric[]> => {
      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching health metrics:', error);
        return [];
      }

      return data as unknown as HealthMetric[];
    },
    refetchInterval: 60000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(getTabChannelName('system-health-updates'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_health_summary',
        },
        (payload) => {
          console.log('Health summary updated:', payload);
          if (payload.new) {
            setRealtimeSummary(payload.new as unknown as SystemHealthSummary);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Trigger a health check
  const triggerHealthCheck = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('system-health-monitor');
      if (error) throw error;
      await refetchSummary();
      return data;
    } catch (error) {
      console.error('Error triggering health check:', error);
      throw error;
    }
  };

  // Use realtime data if available, otherwise use query data
  const currentSummary = realtimeSummary || summary;

  return {
    summary: currentSummary,
    metrics,
    isLoading: summaryLoading || metricsLoading,
    triggerHealthCheck,
    refetch: refetchSummary,
  };
};

// Hook to get health history for charts
export const useHealthHistory = (days: number = 7) => {
  return useQuery({
    queryKey: ['health-history', days],
    queryFn: async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .gte('recorded_at', startDate)
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error fetching health history:', error);
        return [];
      }

      return data as unknown as HealthMetric[];
    },
  });
};
