/**
 * Smart Notification Routing — التوجيه الذكي للإشعارات
 * Maps notification type + metadata to a direct navigation path.
 */

export interface NotificationRouteInput {
  type: string | null;
  shipment_id?: string | null;
  request_id?: string | null;
  pdf_url?: string | null;
  metadata?: Record<string, any> | null | string | number | boolean;
}

/**
 * Returns the direct route path for a notification, or null if no specific route exists (fallback to dialog).
 */
export function getNotificationRoute(notification: NotificationRouteInput): string | null {
  const { type, shipment_id, request_id, pdf_url, metadata: rawMeta } = notification;
  const metadata = (typeof rawMeta === 'object' && rawMeta !== null && !Array.isArray(rawMeta)) ? rawMeta as Record<string, any> : {};
  const convId = metadata?.conversation_id;
  const postId = metadata?.post_id;
  const documentId = metadata?.document_id;

  switch (type) {
    // ═══ Shipments ═══
    case 'shipment_created':
    case 'shipment_status':
    case 'status_update':
    case 'shipment_assigned':
    case 'shipment_delivered':
    case 'shipment_approved':
    case 'shipment':
    case 'driver_assignment':
      return shipment_id ? `/dashboard/shipments/${shipment_id}` : '/dashboard/shipments';

    // ═══ Documents & Signing ═══
    case 'signing_request':
    case 'signature_request':
      return '/dashboard/signing-inbox';
    case 'document_uploaded':
    case 'document_issued':
    case 'document_signed':
    case 'stamp_applied':
      return '/dashboard/document-center';

    // ═══ Approvals ═══
    case 'approval_request':
      return request_id ? `/dashboard/my-requests` : '/dashboard/my-requests';

    // ═══ Chat & Messages ═══
    case 'chat_message':
    case 'message':
    case 'mention':
      return convId ? `/dashboard/chat?conv=${convId}` : '/dashboard/chat';
    case 'partner_message':
      return convId ? `/dashboard/chat?conv=${convId}` : '/dashboard/chat';
    case 'broadcast':
      return '/dashboard/broadcast-channels';

    // ═══ Partners ═══
    case 'partner_post':
      return '/dashboard/partners';
    case 'partner_note':
      return '/dashboard/notes';
    case 'partner_linked':
      return '/dashboard/partners';

    // ═══ Finance ═══
    case 'invoice':
    case 'payment':
    case 'deposit':
    case 'financial':
      return '/dashboard/erp/accounting';

    // ═══ Recycling & Reports ═══
    case 'recycling_report':
      if (pdf_url) return null; // Will open PDF in dialog
      return shipment_id ? `/dashboard/shipments/${shipment_id}` : '/dashboard/reports';
    case 'report':
    case 'certificate':
      return '/dashboard/reports';

    // ═══ Compliance & Licenses ═══
    case 'license_expiry':
    case 'license_warning':
      return '/dashboard/organization-profile';
    case 'compliance_alert':
    case 'compliance_update':
    case 'inspection':
    case 'violation':
      return '/dashboard/compliance';

    // ═══ Fleet & Tracking ═══
    case 'fleet_alert':
    case 'maintenance':
      return '/dashboard/fleet';
    case 'geofence_alert':
    case 'gps_alert':
      return '/dashboard/fleet-tracking';

    // ═══ Work Orders ═══
    case 'work_order':
    case 'work_order_update':
      return '/dashboard/work-orders';

    // ═══ Environmental ═══
    case 'carbon_report':
    case 'environmental':
      return '/dashboard/carbon-footprint';

    // ═══ AI ═══
    case 'ai_alert':
    case 'ai_insight':
      return '/dashboard/ai-tools';

    // ═══ Identity ═══
    case 'identity_verified':
    case 'kyc_update':
      return '/dashboard/organization-profile';

    // ═══ Announcements ═══
    case 'announcement':
      return '/dashboard/news-feed';

    // ═══ Warnings / System ═══
    case 'warning':
    case 'signal_lost':
      return shipment_id ? `/dashboard/shipments/${shipment_id}` : null;

    default:
      return null;
  }
}
