/**
 * useSmartPriorities - محرك الأولويات الذكي
 * يحسب ترتيب الودجات ديناميكياً بناءً على: الجهة + الدور + البيانات الحية
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getPriorityProfile, getRolePriorities } from '@/config/dashboardPriorities';
import type { PriorityWeight, LiveBoostCondition } from '@/config/dashboardPriorities';

interface SmartPriorityResult {
  /** الودجات مرتبة حسب الأولوية الذكية */
  sortedWidgetIds: string[];
  /** أوزان الأولوية المحسوبة */
  computedWeights: Record<string, number>;
  /** التنبيهات النشطة التي أثرت على الترتيب */
  activeBoosts: Array<{ widgetId: string; conditionId: string; labelAr: string; boostAmount: number }>;
  /** نسبة "الحرارة" — كم في بيانات تستدعي الانتباه */
  heatLevel: 'cool' | 'warm' | 'hot';
  isLoading: boolean;
}

export function useSmartPriorities(orgType?: string, userRole?: string): SmartPriorityResult {
  const { user, organization, roles } = useAuth();
  const effectiveOrgType = orgType || organization?.organization_type || 'generator';
  
  // Determine role: driver > employee > company_admin
  const effectiveRole = userRole || (
    roles.includes('driver') ? 'driver' :
    roles.includes('employee') ? 'employee' :
    roles.includes('company_admin') ? 'company_admin' :
    roles.includes('admin') ? 'admin' : 'default'
  );

  const profile = useMemo(() => getPriorityProfile(effectiveOrgType), [effectiveOrgType]);
  const rolePriorities = useMemo(() => getRolePriorities(effectiveOrgType, effectiveRole), [effectiveOrgType, effectiveRole]);

  // Merge role overrides with base priorities
  const basePriorities = useMemo((): PriorityWeight[] => {
    if (!profile) return [];
    if (rolePriorities && rolePriorities.length > 0) {
      // Role overrides replace matching widgets, keep others
      const roleMap = new Map(rolePriorities.map(p => [p.widgetId, p]));
      const merged: PriorityWeight[] = [];

      for (const p of profile.priorities) {
        merged.push(roleMap.get(p.widgetId) || p);
        roleMap.delete(p.widgetId);
      }
      // Add any role-only widgets
      for (const p of roleMap.values()) {
        merged.push(p);
      }
      return merged;
    }
    return profile.priorities;
  }, [profile, rolePriorities]);

  // Collect all boost conditions to check
  const allConditions = useMemo(() => {
    const conditions: Array<{ widgetId: string; condition: LiveBoostCondition }> = [];
    for (const p of basePriorities) {
      if (p.liveBoostConditions) {
        for (const c of p.liveBoostConditions) {
          conditions.push({ widgetId: p.widgetId, condition: c });
        }
      }
    }
    return conditions;
  }, [basePriorities]);

  // Check live data for boosts
  const { data: boostResults = [], isLoading } = useQuery({
    queryKey: ['smart-priorities-boost', effectiveOrgType, effectiveRole, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id || allConditions.length === 0) return [];

      const results: Array<{ widgetId: string; conditionId: string; labelAr: string; boostAmount: number }> = [];

      // Batch check — run in parallel
      const checks = allConditions.map(async ({ widgetId, condition }) => {
        try {
          let query = supabase
            .from(condition.table as any)
            .select('id', { count: 'exact', head: true });

          // Apply organization filter if table supports it
          query = query.eq('organization_id', organization.id);

          // Apply custom filters
          for (const [key, val] of Object.entries(condition.filter)) {
            query = query.eq(key, val);
          }

          const { count } = await query;
          const c = count || 0;

          let triggered = false;
          if (condition.checkType === 'count_above' && c > (condition.threshold || 0)) {
            triggered = true;
          } else if (condition.checkType === 'exists' && c > 0) {
            triggered = true;
          } else if (condition.checkType === 'overdue' && c > 0) {
            triggered = true;
          }

          if (triggered) {
            results.push({
              widgetId,
              conditionId: condition.id,
              labelAr: condition.labelAr,
              boostAmount: condition.boostAmount,
            });
          }
        } catch {
          // Silent fail — don't block dashboard
        }
      });

      await Promise.all(checks);
      return results;
    },
    enabled: !!user?.id && !!organization?.id && allConditions.length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000, // Refresh every 2 minutes
  });

  // Compute final weights
  const { sortedWidgetIds, computedWeights } = useMemo(() => {
    const weights: Record<string, number> = {};

    // Base weights
    for (const p of basePriorities) {
      weights[p.widgetId] = p.baseWeight;
    }

    // Apply boosts
    for (const boost of boostResults) {
      if (weights[boost.widgetId] !== undefined) {
        weights[boost.widgetId] += boost.boostAmount;
      }
    }

    // Sort descending
    const sorted = Object.entries(weights)
      .sort(([, a], [, b]) => b - a)
      .map(([id]) => id);

    return { sortedWidgetIds: sorted, computedWeights: weights };
  }, [basePriorities, boostResults]);

  // Calculate heat level
  const heatLevel = useMemo((): 'cool' | 'warm' | 'hot' => {
    const totalBoost = boostResults.reduce((sum, b) => sum + b.boostAmount, 0);
    if (totalBoost >= 50) return 'hot';
    if (totalBoost >= 20) return 'warm';
    return 'cool';
  }, [boostResults]);

  return {
    sortedWidgetIds,
    computedWeights,
    activeBoosts: boostResults,
    heatLevel,
    isLoading,
  };
}
