import { useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { usePlatformCounts } from '@/hooks/usePlatformCounts';

/**
 * Maps notification types to sidebar section keys.
 */
const TYPE_TO_SECTION: Record<string, string[]> = {
  shipment_created: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops', 'recycler-ops', 'generator-ops', 'disposal-ops', 'communication'],
  shipment: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops', 'recycler-ops', 'generator-ops', 'disposal-ops', 'communication'],
  status_update: ['transporter-shipments', 'recycler-shipments', 'generator-shipments', 'driver-shipments', 'transporter-ops', 'recycler-ops', 'generator-ops', 'disposal-ops', 'communication'],
  recycling_report: ['transporter-certs', 'generator-certs', 'admin-certs', 'issue-certs', 'reports-analytics'],
  partner_post: ['partners', 'partners-timeline', 'org-structure', 'communication'],
  partner_note: ['partners', 'partner-accounts', 'org-structure', 'communication', 'notes'],
  partner_message: ['chat', 'communication', 'messages'],
  partner_update: ['partners', 'partner-accounts', 'org-structure'],
  approval_request: ['company-approvals', 'driver-approvals', 'my-requests', 'communication', 'admin-entity-management'],
  document_uploaded: ['org-docs', 'admin-entity-management'],
  receipt_issued: ['transporter-receipts', 'generator-receipts', 'transporter-ops', 'generator-ops', 'recycler-ops'],
  receipt_confirmed: ['transporter-receipts', 'generator-receipts', 'transporter-ops', 'generator-ops'],
  general: ['notifications', 'communication'],
};

export interface SectionNotificationCounts {
  [sectionKey: string]: number;
}

export const useNotificationCounts = (): SectionNotificationCounts => {
  const { notifications } = useNotifications();
  const { data: platformCounts } = usePlatformCounts();

  return useMemo(() => {
    const counts: SectionNotificationCounts = {};

    // From notification types → sidebar sections
    notifications
      .filter(n => !n.is_read)
      .forEach(n => {
        const type = n.type || 'general';
        const sections = TYPE_TO_SECTION[type] || ['notifications'];
        sections.forEach(sectionKey => {
          counts[sectionKey] = (counts[sectionKey] || 0) + 1;
        });
      });

    // Inject platform-wide counts for sections not covered by notification types
    if (platformCounts) {
      // Messages badge on chat sidebar item
      if (platformCounts.unreadMessages > 0) {
        counts['chat'] = (counts['chat'] || 0) + platformCounts.unreadMessages;
        counts['messages'] = (counts['messages'] || 0) + platformCounts.unreadMessages;
      }
      // Signatures badge
      if (platformCounts.pendingSignatures > 0) {
        counts['signing'] = (counts['signing'] || 0) + platformCounts.pendingSignatures;
      }
      // Work orders / requests
      if (platformCounts.pendingRequests > 0) {
        counts['my-requests'] = (counts['my-requests'] || 0) + platformCounts.pendingRequests;
      }
      // Notes
      if (platformCounts.unreadNotes > 0) {
        counts['notes'] = (counts['notes'] || 0) + platformCounts.unreadNotes;
      }
      // Pending approvals
      if (platformCounts.pendingApprovals > 0) {
        counts['company-approvals'] = (counts['company-approvals'] || 0) + platformCounts.pendingApprovals;
        counts['driver-approvals'] = (counts['driver-approvals'] || 0) + platformCounts.pendingApprovals;
      }
      // Pending receipts
      if (platformCounts.pendingReceipts > 0) {
        counts['transporter-receipts'] = (counts['transporter-receipts'] || 0) + platformCounts.pendingReceipts;
      }
    }

    return counts;
  }, [notifications, platformCounts]);
};
