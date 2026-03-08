import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from './useRealtimeSync';

export const usePartnersCount = () => {
  useRealtimeTable('organizations', ['partners-count']);

  const { data: count = 0, isLoading: loading } = useQuery({
    queryKey: ['partners-count'],
    queryFn: async () => {
      const { count: partnersCount, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .in('organization_type', ['generator', 'recycler'])
        .eq('is_verified', true)
        .eq('is_active', true);

      if (error) throw error;
      return partnersCount || 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  return { count, loading };
};
