import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Universal Dashboard Realtime Hook
 * يشترك تلقائياً في كافة الجداول الحيوية بناءً على نوع الجهة
 * ويقوم بتحديث الكاش فوراً عند أي تغيير
 */

interface TableSubscription {
  table: string;
  queryKeys: string[];
  filter?: string;
}

// Core tables every org type needs
const CORE_TABLES: TableSubscription[] = [
  { table: 'notifications', queryKeys: ['notifications', 'notification-counts', 'unread-count'] },
  { table: 'shipments', queryKeys: ['shipments', 'shipment-stats', 'system-stats', 'transporter-shipments', 'transporter-stats', 'partner-shipments', 'daily-operations', 'transporter-daily-pulse', 'live-operations-board', 'org-radar-compliance', 'smart-brief', 'operational-alerts', 'platform-counts'] },
  { table: 'invoices', queryKeys: ['invoices', 'invoice-stats', 'platform-counts'] },
  { table: 'deposits', queryKeys: ['deposits', 'deposit-stats', 'platform-counts'] },
  { table: 'organizations', queryKeys: ['organization', 'partners-count', 'system-stats'] },
  { table: 'profiles', queryKeys: ['profile', 'profiles'] },
  { table: 'organization_members', queryKeys: ['org-members', 'organization-members', 'employees', 'platform-counts'] },
  { table: 'chat_messages', queryKeys: ['chat-messages', 'comm-hub-counts'] },
  { table: 'direct_messages', queryKeys: ['direct-messages', 'comm-hub-counts', 'platform-counts'] },
  { table: 'notes', queryKeys: ['notes', 'platform-counts'] },
  { table: 'activity_logs', queryKeys: ['activity-logs', 'operational-alerts'] },
  { table: 'approval_requests', queryKeys: ['approval-requests', 'platform-counts'] },
  { table: 'support_tickets', queryKeys: ['support-tickets', 'platform-counts'] },
  { table: 'entity_documents', queryKeys: ['entity-documents'] },
  { table: 'document_registry', queryKeys: ['document-registry'] },
  { table: 'signing_requests', queryKeys: ['signing-requests', 'signing-inbox', 'platform-counts'] },
  { table: 'accounting_ledger', queryKeys: ['accounting-ledger', 'ledger-entries', 'ledger', 'smart-brief'] },
  { table: 'account_periods', queryKeys: ['account-periods'] },
  { table: 'contracts', queryKeys: ['contracts', 'operational-alerts', 'platform-counts'] },
  { table: 'collection_requests', queryKeys: ['collection-requests', 'platform-counts'] },
  { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
  { table: 'verified_partnerships', queryKeys: ['verified-partnerships', 'partners', 'linked-partners', 'platform-counts'] },
  { table: 'work_orders', queryKeys: ['work-orders', 'platform-counts'] },
  { table: 'employee_permissions', queryKeys: ['employee-permissions', 'my-permissions'] },
  { table: 'award_letters', queryKeys: ['award-letters'] },
  { table: 'organization_documents', queryKeys: ['organization-documents', 'operational-alerts'] },
  { table: 'broadcast_channels', queryKeys: ['broadcast-channels'] },
  { table: 'broadcast_posts', queryKeys: ['broadcast-posts'] },
];

// Role-specific additional tables
const ROLE_TABLES: Record<string, TableSubscription[]> = {
  transporter: [
    { table: 'drivers', queryKeys: ['drivers', 'transporter-drivers-summary'] },
    { table: 'fleet_vehicles', queryKeys: ['fleet-vehicles'] },
    { table: 'vehicle_maintenance', queryKeys: ['vehicle-maintenance'] },
    { table: 'driver_shipment_assignments', queryKeys: ['driver-assignments'] },
    { table: 'driver_shipment_offers', queryKeys: ['driver-offers'] },
    { table: 'driver_location_logs', queryKeys: ['transporter-drivers-summary', 'driver-locations'] },
    { table: 'shipment_logs', queryKeys: ['shipment-logs'] },
    { table: 'partner_ratings', queryKeys: ['partner-ratings'] },
    { table: 'delivery_confirmations', queryKeys: ['delivery-confirmations'] },
    { table: 'digital_wallets', queryKeys: ['digital-wallets'] },
  ],
  generator: [
    { table: 'collection_requests', queryKeys: ['collection-requests', 'generator-requests'] },
    { table: 'waste_exchange_listings', queryKeys: ['waste-listings'] },
    { table: 'waste_exchange_bids', queryKeys: ['waste-bids'] },
    { table: 'carbon_footprint_records', queryKeys: ['carbon-footprint'] },
    { table: 'recycling_reports', queryKeys: ['recycling-reports'] },
    { table: 'camera_arrival_events', queryKeys: ['camera-events'] },
  ],
  recycler: [
    { table: 'waste_exchange_listings', queryKeys: ['waste-listings'] },
    { table: 'waste_exchange_bids', queryKeys: ['waste-bids'] },
    { table: 'recycling_reports', queryKeys: ['recycling-reports'] },
    { table: 'carbon_footprint_records', queryKeys: ['carbon-footprint'] },
    { table: 'digital_wallets', queryKeys: ['digital-wallets'] },
    { table: 'partner_ratings', queryKeys: ['partner-ratings'] },
  ],
  disposal: [
    { table: 'disposal_operations', queryKeys: ['disposal-operations'] },
    { table: 'disposal_incoming_requests', queryKeys: ['disposal-requests'] },
    { table: 'fleet_vehicles', queryKeys: ['fleet-vehicles'] },
    { table: 'carbon_footprint_records', queryKeys: ['carbon-footprint'] },
    { table: 'delivery_confirmations', queryKeys: ['delivery-confirmations'] },
  ],
  admin: [
    { table: 'organizations', queryKeys: ['organizations', 'admin-orgs', 'system-stats', 'admin-dashboard-stats'] },
    { table: 'profiles', queryKeys: ['admin-users', 'profiles', 'admin-dashboard-stats'] },
    { table: 'organization_members', queryKeys: ['org-members', 'organization-members', 'admin-dashboard-stats'] },
    { table: 'cyber_threats', queryKeys: ['cyber-threats'] },
    { table: 'approval_requests', queryKeys: ['admin-approvals'] },
    { table: 'shipments', queryKeys: ['shipments', 'admin-dashboard-stats', 'system-stats'] },
    { table: 'drivers', queryKeys: ['drivers', 'admin-dashboard-stats'] },
    { table: 'verified_partnerships', queryKeys: ['verified-partnerships', 'admin-dashboard-stats'] },
    { table: 'invoices', queryKeys: ['invoices', 'admin-dashboard-stats'] },
    { table: 'deposits', queryKeys: ['deposits', 'admin-dashboard-stats'] },
    { table: 'collection_requests', queryKeys: ['collection-requests', 'admin-dashboard-stats'] },
    { table: 'fleet_vehicles', queryKeys: ['fleet-vehicles', 'admin-dashboard-stats'] },
    { table: 'work_orders', queryKeys: ['work-orders', 'admin-dashboard-stats'] },
    { table: 'advertisements', queryKeys: ['advertisements'] },
    { table: 'ai_agent_conversations', queryKeys: ['ai-conversations'] },
    { table: 'ai_agent_orders', queryKeys: ['ai-orders'] },
    { table: 'backup_logs', queryKeys: ['backup-logs'] },
    { table: 'api_keys', queryKeys: ['api-keys'] },
  ],
  driver: [
    { table: 'driver_shipment_assignments', queryKeys: ['driver-assignments', 'my-assignments'] },
    { table: 'driver_shipment_offers', queryKeys: ['driver-offers', 'my-offers'] },
    { table: 'driver_location_logs', queryKeys: ['driver-locations'] },
    { table: 'shipment_logs', queryKeys: ['shipment-logs'] },
  ],
  employee: [
    { table: 'employee_permissions', queryKeys: ['employee-permissions', 'my-permissions'] },
    { table: 'work_orders', queryKeys: ['work-orders'] },
  ],
  consultant: [
    { table: 'corrective_actions', queryKeys: ['corrective-actions'] },
    { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
    { table: 'audit_sessions', queryKeys: ['audit-sessions'] },
  ],
  consulting_office: [
    { table: 'corrective_actions', queryKeys: ['corrective-actions'] },
    { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
    { table: 'audit_sessions', queryKeys: ['audit-sessions'] },
  ],
  transport_office: [
    { table: 'drivers', queryKeys: ['drivers'] },
    { table: 'fleet_vehicles', queryKeys: ['fleet-vehicles'] },
    { table: 'driver_shipment_assignments', queryKeys: ['driver-assignments'] },
    { table: 'vehicle_maintenance', queryKeys: ['vehicle-maintenance'] },
  ],
  iso_body: [
    { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
    { table: 'audit_sessions', queryKeys: ['audit-sessions'] },
  ],
  regulator: [
    { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
    { table: 'corrective_actions', queryKeys: ['corrective-actions'] },
    { table: 'audit_sessions', queryKeys: ['audit-sessions'] },
  ],
};

export const useDashboardRealtime = () => {
  const queryClient = useQueryClient();
  const { organization, profile, roles } = useAuth();
  const orgId = organization?.id;
  const orgType = organization?.organization_type as string | undefined;
  const userId = profile?.id;
  const isAdmin = roles?.includes('admin');
  const isEmployee = roles?.includes('employee');
  const isDriver = roles?.includes('driver');

  // Build subscription list based on role
  const subscriptions = useMemo(() => {
    const subs = [...CORE_TABLES];
    
    if (isAdmin) {
      subs.push(...(ROLE_TABLES.admin || []));
    }
    
    if (isDriver) {
      subs.push(...(ROLE_TABLES.driver || []));
    }
    
    if (isEmployee) {
      subs.push(...(ROLE_TABLES.employee || []));
    }
    
    if (orgType && ROLE_TABLES[orgType]) {
      subs.push(...ROLE_TABLES[orgType]);
    }
    
    // Deduplicate by table name, merge queryKeys
    const map = new Map<string, Set<string>>();
    subs.forEach(s => {
      const existing = map.get(s.table);
      if (existing) {
        s.queryKeys.forEach(k => existing.add(k));
      } else {
        map.set(s.table, new Set(s.queryKeys));
      }
    });
    
    return Array.from(map.entries()).map(([table, keys]) => ({
      table,
      queryKeys: Array.from(keys),
    }));
  }, [orgType, isAdmin, isDriver, isEmployee]);

  useEffect(() => {
    if (!orgId && !isAdmin) return;

    const channelName = `dashboard-rt-${orgId || 'admin'}-${Date.now()}`;
    let channel = supabase.channel(channelName);

    subscriptions.forEach(({ table, queryKeys }) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          queryKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, isAdmin, subscriptions, queryClient]);
};
