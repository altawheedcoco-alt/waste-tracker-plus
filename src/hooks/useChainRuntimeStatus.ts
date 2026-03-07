/**
 * Hook: useChainRuntimeStatus
 * يربط عقد سلاسل الإجراءات بحالتها الفعلية من قاعدة البيانات
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChainNodeStatus {
  nodeId: string;
  /** حالة العقدة: active = تعمل, inactive = لم تُفعّل, warning = بها مشكلة */
  status: 'active' | 'inactive' | 'warning' | 'loading';
  /** عدد العمليات المرتبطة */
  count?: number;
  /** آخر نشاط */
  lastActivity?: string;
  /** تفاصيل إضافية */
  hint?: string;
}

/** خريطة العقد → استعلامات DB */
interface NodeQuery {
  table: string;
  countFilter?: Record<string, any>;
  statusField?: string;
}

// خريطة العقد القابلة للاستعلام حسب نوع الجهة
const TRANSPORTER_NODE_QUERIES: Record<string, NodeQuery> = {
  'btn-create-shipment': { table: 'shipments' },
  'fn-assign-driver': { table: 'shipments', statusField: 'driver_id' },
  'res-receipt': { table: 'receipts' },
  'eff-ledger': { table: 'accounting_ledger' },
  'btn-accept-request': { table: 'collection_requests' },
  'btn-add-driver': { table: 'drivers' },
  'res-certified': { table: 'academy_enrollments' },
  'eff-rewards': { table: 'driver_rewards' },
};

const GENERATOR_NODE_QUERIES: Record<string, NodeQuery> = {
  'btn-new-shipment': { table: 'shipments' },
  'eff-receipt': { table: 'receipts' },
  'eff-recycling-cert': { table: 'recycling_certificates' },
  'btn-create-wo': { table: 'work_orders' },
};

const RECYCLER_NODE_QUERIES: Record<string, NodeQuery> = {
  'btn-receive': { table: 'shipments' },
  'res-rejected': { table: 'shipments' },
  'res-output': { table: 'production_batches' },
  'eff-cert': { table: 'recycling_certificates' },
};

const DISPOSAL_NODE_QUERIES: Record<string, NodeQuery> = {
  'btn-incoming': { table: 'shipments' },
  'fn-process': { table: 'shipments' },
  'eff-cert': { table: 'disposal_certificates' },
};

const ORG_NODE_QUERIES: Record<string, Record<string, NodeQuery>> = {
  transporter: TRANSPORTER_NODE_QUERIES,
  generator: GENERATOR_NODE_QUERIES,
  recycler: RECYCLER_NODE_QUERIES,
  disposal: DISPOSAL_NODE_QUERIES,
};

export function useChainRuntimeStatus(orgType: string) {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const nodeQueries = useMemo(() => ORG_NODE_QUERIES[orgType] || {}, [orgType]);

  const { data: statusMap = {}, isLoading } = useQuery({
    queryKey: ['chain-runtime-status', orgType, orgId],
    queryFn: async () => {
      if (!orgId) return {};
      const results: Record<string, ChainNodeStatus> = {};

      // Run count queries in parallel
      const entries = Object.entries(nodeQueries);
      const promises = entries.map(async ([nodeId, query]) => {
        try {
          // Use type assertion since these are dynamic table references
          const { count, error } = await (supabase as any)
            .from(query.table)
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);

          if (error) {
            results[nodeId] = { nodeId, status: 'warning', hint: error.message };
          } else {
            results[nodeId] = {
              nodeId,
              status: (count || 0) > 0 ? 'active' : 'inactive',
              count: count || 0,
            };
          }
        } catch {
          results[nodeId] = { nodeId, status: 'inactive', count: 0 };
        }
      });

      await Promise.all(promises);
      return results;
    },
    enabled: !!orgId && Object.keys(nodeQueries).length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return { statusMap, isLoading };
}
