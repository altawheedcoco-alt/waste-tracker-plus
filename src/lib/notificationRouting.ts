/**
 * Smart Notification Routing — التوجيه الذكي للإشعارات
 * Maps notification type + metadata to a direct navigation path.
 * Supports all ~188 notification types.
 */

import { getNotificationTypeMeta } from './notificationTypes';

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
  const contractId = metadata?.contract_id;
  const partnerId = metadata?.partner_org_id;
  const employeeId = metadata?.employee_id;
  const entityId = metadata?.entity_id;

  // ═══ Special cases that need dynamic routing ═══
  switch (type) {
    // Shipments with ID → detail page
    case 'shipment_created':
    case 'shipment_status':
    case 'status_update':
    case 'shipment_assigned':
    case 'shipment_delivered':
    case 'shipment_approved':
    case 'shipment':
    case 'shipment_auto_approved':
    case 'shipment_rejected':
    case 'shipment_cancelled':
    case 'shipment_disputed':
    case 'shipment_confirmed':
    case 'shipment_delayed':
    case 'shipment_approval_request':
    case 'shipment_document':
    case 'driver_assignment':
    case 'driver_reassigned':
    case 'pickup_started':
    case 'pickup_completed':
    case 'delivery_started':
    case 'delivery_eta_update':
    case 'weight_mismatch':
    case 'custody_generator_handover':
    case 'custody_transporter_pickup':
    case 'custody_transporter_delivery':
    case 'custody_recycler_receipt':
    case 'custody_chain_complete':
    case 'weight_dispute':
    case 'dispute_resolved':
    case 'dispute_escalated':
    case 'dispute_created':
      return shipment_id ? `/dashboard/shipments/${shipment_id}` : '/dashboard/shipments';

    // Chat with conversation ID
    case 'chat_message':
    case 'message':
    case 'mention':
    case 'partner_message':
    case 'group_message':
    case 'channel_message':
    case 'thread_reply':
    case 'reaction_added':
    case 'pinned_message':
    case 'scheduled_message_sent':
    case 'meeting_invitation':
    case 'meeting_starting':
    case 'meeting_cancelled':
    case 'video_call_incoming':
    case 'call_missed':
      return convId ? `/dashboard/chat?conv=${convId}` : '/dashboard/chat';

    // Polls
    case 'poll_created':
    case 'poll_ended':
      return '/dashboard/chat?tab=polls';

    // Channels
    case 'channel_created':
    case 'channel_invitation':
      return '/dashboard/chat?tab=channels';

    // Contracts with ID
    case 'contract_created':
    case 'contract_signed':
    case 'contract_renewed':
    case 'contract_terminated':
    case 'contract_pending_signature':
    case 'contract_expiry':
      return '/dashboard/contracts';

    // Partnerships
    case 'partnership_request':
    case 'partnership_accepted':
    case 'partnership_rejected':
    case 'partnership_suspended':
    case 'partner_linked':
    case 'partner_rated':
    case 'partner_review':
    case 'partner_verified':
      return '/dashboard/partners';

    // Employee / Member
    case 'employee_invitation':
    case 'employee_activated':
    case 'employee_deactivated':
    case 'member_joined':
    case 'member_left':
    case 'member_role_changed':
    case 'delegation_created':
    case 'delegation_expired':
      return '/dashboard/employee-management';

    // Financial
    case 'invoice_created':
    case 'invoice_paid':
    case 'invoice_overdue':
    case 'invoice_draft':
      return '/dashboard/erp/accounting';

    // Social
    case 'new_post':
    case 'post_liked':
    case 'post_commented':
    case 'post_shared':
    case 'story_posted':
    case 'story_reaction':
    case 'profile_photo_updated':
    case 'cover_photo_updated':
    case 'announcement':
    case 'news_published':
      return '/dashboard/news-feed';

    // Broadcast
    case 'broadcast_new_post':
      return '/dashboard/broadcast-channels';

    // Driver
    case 'driver_registered':
    case 'driver_approved':
    case 'driver_rejected':
    case 'driver_offer_received':
    case 'driver_offer_expired':
    case 'driver_notification':
    case 'driver_sos':
    case 'driver_license_expiry':
      return '/dashboard/transporter-drivers';

    // Work orders
    case 'work_order':
    case 'work_order_update':
    case 'work_order_completed':
    case 'work_order_cancelled':
      return '/dashboard/work-orders';

    // Recycling reports may open PDF
    case 'recycling_report':
      if (pdf_url) return null; // Will open PDF in dialog
      return shipment_id ? `/dashboard/shipments/${shipment_id}` : '/dashboard/reports';

    // Signal lost with shipment
    case 'signal_lost':
    case 'warning':
      return shipment_id ? `/dashboard/shipments/${shipment_id}` : '/dashboard/fleet-tracking';

    default:
      break;
  }

  // ═══ Fallback: use registry default route ═══
  if (type) {
    const meta = getNotificationTypeMeta(type);
    if (meta?.defaultRoute) return meta.defaultRoute;
  }

  return null;
}
