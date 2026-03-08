import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Universal realtime sync hook.
 * Subscribes to postgres_changes on specified tables and auto-invalidates
 * the related react-query cache keys.
 *
 * Usage:
 *   useRealtimeSync([
 *     { table: 'shipments', queryKeys: ['shipments', 'shipment-stats'] },
 *     { table: 'notifications', queryKeys: ['notifications'], filter: `user_id=eq.${userId}` },
 *   ]);
 */

interface RealtimeTable {
  table: string;
  queryKeys: string[];
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

export const useRealtimeSync = (tables: RealtimeTable[], enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const channelName = `rt-sync-${tables.map(t => t.table).join('-')}-${Date.now()}`;
    let channel = supabase.channel(channelName);

    tables.forEach(({ table, queryKeys, filter, event = '*', schema = 'public' }) => {
      const config: any = { event, schema, table };
      if (filter) config.filter = filter;

      channel = channel.on('postgres_changes', config, () => {
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      });
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, tables.map(t => `${t.table}:${t.filter || ''}`).join(',')]);
};

/**
 * Simplified version: subscribe to a single table
 */
export const useRealtimeTable = (
  table: string,
  queryKeys: string[],
  options?: { filter?: string; enabled?: boolean }
) => {
  useRealtimeSync(
    [{ table, queryKeys, filter: options?.filter }],
    options?.enabled ?? true
  );
};
