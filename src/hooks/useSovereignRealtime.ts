import { useRealtimeSync } from './useRealtimeSync';

/**
 * Realtime sync for all sovereign governance tables.
 * Auto-invalidates related query caches on any change.
 */
export const useSovereignRealtime = () => {
  useRealtimeSync([
    { table: 'early_warning_alerts', queryKeys: ['early-warnings'] },
    { table: 'crisis_incidents', queryKeys: ['crisis-incidents'] },
    { table: 'sla_violations', queryKeys: ['sla-violations'] },
    { table: 'sla_definitions', queryKeys: ['sla-definitions'] },
    { table: 'sovereign_reports', queryKeys: ['sovereign-reports'] },
    { table: 'ai_sovereign_decisions', queryKeys: ['ai-decisions'] },
    { table: 'admin_sovereign_roles', queryKeys: ['sovereign-roles'] },
    { table: 'sovereign_delegations', queryKeys: ['sovereign-delegations'] },
    { table: 'security_audits', queryKeys: ['security-audits', 'security-audit-latest'] },
  ]);
};
