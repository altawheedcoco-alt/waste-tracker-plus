import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformSetting(settingId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['platform-setting', settingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('id', settingId)
        .maybeSingle();
      if (error) throw error;
      return (data?.value as any)?.enabled ?? true;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ id: settingId, value: { enabled }, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', settingId] });
    },
  });

  return {
    enabled: data ?? true,
    isLoading,
    toggle: toggleMutation.mutate,
  };
}
