import { useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Maps notification types to sidebar section keys.
 * Each notification type is associated with the sidebar menu item it relates to.
 */
const TYPE_TO_SECTION: Record<string, string[]> = {
  // Shipment-related
  shipment_created: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops-group', 'recycler-ops-group', 'generator-ops-group', 'disposal-ops-group'],
  shipment: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops-group', 'recycler-ops-group', 'generator-ops-group', 'disposal-ops-group'],
  status_update: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops-group', 'recycler-ops-group', 'generator-ops-group', 'disposal-ops-group'],
  // Recycling reports
  recycling_report: ['transporter-certs', 'generator-certs', 'admin-certs', 'issue-certs', 'reports-group'],
  // Partner-related
  partner_post: ['partners', 'partners-timeline', 'org-group'],
  partner_note: ['partners', 'partner-accounts', 'org-group'],
  partner_message: ['chat', 'comm-group'],
  // Approvals
  approval_request: ['company-approvals', 'driver-approvals', 'my-requests', 'requests-reg-group', 'admin-group'],
  // Documents
  document_uploaded: ['org-docs', 'admin-group'],
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
