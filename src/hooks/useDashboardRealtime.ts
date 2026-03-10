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
  { table: 'notifications', queryKeys: ['notifications', 'notification-counts'] },
  { table: 'shipments', queryKeys: ['shipments', 'shipment-stats', 'system-stats', 'transporter-shipments', 'transporter-stats'] },
  { table: 'invoices', queryKeys: ['invoices', 'invoice-stats'] },
  { table: 'deposits', queryKeys: ['deposits', 'deposit-stats'] },
  { table: 'organizations', queryKeys: ['organization', 'partners-count', 'system-stats'] },
  { table: 'profiles', queryKeys: ['profile', 'profiles'] },
  { table: 'organization_members', queryKeys: ['org-members', 'organization-members'] },
  { table: 'chat_messages', queryKeys: ['chat-messages'] },
  { table: 'direct_messages', queryKeys: ['direct-messages'] },
  { table: 'notes', queryKeys: ['notes'] },
  { table: 'activity_logs', queryKeys: ['activity-logs'] },
  { table: 'approval_requests', queryKeys: ['approval-requests'] },
  { table: 'support_tickets', queryKeys: ['support-tickets'] },
  { table: 'entity_documents', queryKeys: ['entity-documents'] },
  { table: 'document_registry', queryKeys: ['document-registry'] },
  { table: 'signing_requests', queryKeys: ['signing-requests', 'signing-inbox'] },
  { table: 'accounting_ledger', queryKeys: ['accounting-ledger', 'ledger-entries'] },
  { table: 'account_periods', queryKeys: ['account-periods'] },
  { table: 'contracts', queryKeys: ['contracts'] },
  { table: 'collection_requests', queryKeys: ['collection-requests'] },
  { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
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
  ],
  disposal: [
    { table: 'disposal_operations', queryKeys: ['disposal-operations'] },
    { table: 'disposal_incoming_requests', queryKeys: ['disposal-requests'] },
    { table: 'fleet_vehicles', queryKeys: ['fleet-vehicles'] },
    { table: 'carbon_footprint_records', queryKeys: ['carbon-footprint'] },
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
  ],
  driver: [
    { table: 'driver_shipment_assignments', queryKeys: ['driver-assignments', 'my-assignments'] },
    { table: 'driver_shipment_offers', queryKeys: ['driver-offers', 'my-offers'] },
    { table: 'driver_location_logs', queryKeys: ['driver-locations'] },
  ],
  consultant: [
    { table: 'corrective_actions', queryKeys: ['corrective-actions'] },
    { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
  ],
  consulting_office: [
    { table: 'corrective_actions', queryKeys: ['corrective-actions'] },
    { table: 'compliance_certificates', queryKeys: ['compliance-certificates'] },
  ],
  transport_office: [
    { table: 'drivers', queryKeys: ['drivers'] },
    { table: 'fleet_vehicles', queryKeys: ['fleet-vehicles'] },
    { table: 'driver_shipment_assignments', queryKeys: ['driver-assignments'] },
  ],
};

export const useDashboardRealtime = () => {
  const queryClient = useQueryClient();
  const { organization, profile, roles } = useAuth();
  const orgId = organization?.id;
  const orgType = organization?.organization_type as string | undefined;
  const userId = profile?.id;
  const isAdmin = roles?.includes('admin');

  // Build subscription list based on role
  const subscriptions = useMemo(() => {
    const subs = [...CORE_TABLES];
    
    if (isAdmin) {
      subs.push(...(ROLE_TABLES.admin || []));
    }
    
    if (orgType && ROLE_TABLES[orgType]) {
      subs.push(...ROLE_TABLES[orgType]);
    }
    
    // Deduplicate by table name
    const seen = new Set<string>();
    return subs.filter(s => {
      if (seen.has(s.table)) return false;
      seen.add(s.table);
      return true;
    });
  }, [orgType, isAdmin]);

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
