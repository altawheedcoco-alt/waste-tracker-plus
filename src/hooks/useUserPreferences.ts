import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useMemo } from 'react';

interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: any;
}

const QUERY_KEY = 'user-preferences';

/**
 * Persistent user preferences — saved to DB, restored across sessions/devices.
 * 
 * Usage:
 *   const { getPref, setPref, togglePref } = useUserPreferences();
 *   const isHidden = getPref('notifications_hidden', false);
 *   togglePref('notifications_hidden');
 */
export const useUserPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []) as unknown as UserPreference[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Fast lookup map
  const prefMap = useMemo(() => {
    const map = new Map<string, any>();
    preferences.forEach(p => map.set(p.preference_key, p.preference_value));
    return map;
  }, [preferences]);

  // Get a preference value with fallback
  const getPref = useCallback(<T = any>(key: string, defaultValue: T): T => {
    return prefMap.has(key) ? prefMap.get(key) : defaultValue;
  }, [prefMap]);

  // Upsert mutation
  const upsertMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_preferences' as any)
        .upsert(
          { user_id: user.id, preference_key: key, preference_value: value, updated_at: new Date().toISOString() } as any,
          { onConflict: 'user_id,preference_key' }
        );
      if (error) throw error;
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const previous = queryClient.getQueryData([QUERY_KEY, user?.id]);
      queryClient.setQueryData([QUERY_KEY, user?.id], (old: UserPreference[] | undefined) => {
        const list = old || [];
        const idx = list.findIndex(p => p.preference_key === key);
        if (idx >= 0) {
          const updated = [...list];
          updated[idx] = { ...updated[idx], preference_value: value };
          return updated;
        }
        return [...list, { id: 'temp', user_id: user?.id || '', preference_key: key, preference_value: value }];
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] });
    },
  });

  const setPref = useCallback((key: string, value: any) => {
    upsertMutation.mutate({ key, value });
  }, [upsertMutation]);

  const togglePref = useCallback((key: string, defaultValue = false) => {
    const current = getPref(key, defaultValue);
    setPref(key, !current);
  }, [getPref, setPref]);

  return {
    getPref,
    setPref,
    togglePref,
    isLoading,
    preferences,
  };
};
