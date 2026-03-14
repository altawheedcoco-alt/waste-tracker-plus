import { useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Maps notification types to sidebar section keys.
 * Each notification type is associated with the sidebar menu item it relates to.
 */
const TYPE_TO_SECTION: Record<string, string[]> = {
  // Shipment-related — maps to item keys AND group IDs for badge rollup
  shipment_created: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops', 'recycler-ops', 'generator-ops', 'disposal-ops'],
  shipment: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops', 'recycler-ops', 'generator-ops', 'disposal-ops'],
  status_update: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops', 'recycler-ops', 'generator-ops', 'disposal-ops'],
  // Recycling reports
  recycling_report: ['transporter-certs', 'generator-certs', 'admin-certs', 'issue-certs', 'reports-analytics'],
  // Partner-related
  partner_post: ['partners', 'partners-timeline', 'org-structure'],
  partner_note: ['partners', 'partner-accounts', 'org-structure'],
  partner_message: ['chat', 'communication'],
  // Approvals
  approval_request: ['company-approvals', 'driver-approvals', 'my-requests', 'communication', 'admin-entity-management'],
  // Documents
  document_uploaded: ['org-docs', 'admin-entity-management'],
  // Receipts
  receipt_issued: ['transporter-receipts', 'generator-receipts', 'transporter-ops', 'generator-ops', 'recycler-ops'],
  receipt_confirmed: ['transporter-receipts', 'generator-receipts', 'transporter-ops', 'generator-ops'],
  // General notifications
  general: ['notifications'],
};

export interface SectionNotificationCounts {
  [sectionKey: string]: number;
}

export const useNotificationCounts = (): SectionNotificationCounts => {
  const { notifications } = useNotifications();

  return useMemo(() => {
    const counts: SectionNotificationCounts = {};

    notifications
      .filter(n => !n.is_read)
      .forEach(n => {
        const type = n.type || 'general';
        const sections = TYPE_TO_SECTION[type] || ['notifications'];
        sections.forEach(sectionKey => {
          counts[sectionKey] = (counts[sectionKey] || 0) + 1;
        });
      });

    return counts;
  }, [notifications]);
};
