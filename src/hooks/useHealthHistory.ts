import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HealthMeasurement {
  id: string;
  user_id: string;
  organization_id?: string;
  measurement_type: string;
  heart_rate?: number;
  hrv?: number;
  stress?: number;
  energy?: number;
  productivity?: number;
  spo2?: number;
  breathing_rate?: number;
  voice_stress?: number;
  voice_fatigue?: number;
  voice_energy?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  measured_at: string;
}

export function useHealthHistory() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const measurements = useQuery({
    queryKey: ['health-measurements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_measurements')
        .select('*')
        .eq('user_id', user!.id)
        .order('measured_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as HealthMeasurement[];
    },
    enabled: !!user,
  });

  const saveMeasurement = useMutation({
    mutationFn: async (m: Omit<HealthMeasurement, 'id' | 'user_id' | 'measured_at'>) => {
      const { error } = await supabase.from('health_measurements').insert({
        ...m,
        user_id: user!.id,
        organization_id: organization?.id || m.organization_id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-measurements'] }),
  });

  // Team stats (anonymized)
  const teamStats = useQuery({
    queryKey: ['team-health-stats', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_measurements')
        .select('stress, energy, productivity, heart_rate, measurement_type, measured_at')
        .eq('organization_id', organization!.id)
        .gte('measured_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('measured_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Partial<HealthMeasurement>[];
    },
    enabled: !!organization?.id,
  });

  return { measurements, saveMeasurement, teamStats };
}
