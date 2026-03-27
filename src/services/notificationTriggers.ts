/**
 * Centralized Notification Triggers — مركز إطلاق الإشعارات
 * 
 * Helper functions to fire notifications for all ~188 event types.
 * Each function determines recipients and sends via notifyAction/notifyMultiple.
 */
import { supabase } from '@/integrations/supabase/client';
import { notifyAction, notifyMultiple } from '@/utils/notifyAction';

// ══════════════════════════════════════════
// Helper: get org member user IDs
// ══════════════════════════════════════════
async function getOrgMemberIds(orgId: string, excludeUserId?: string): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('is_active', true);
  const ids = (data || []).map(p => p.user_id).filter(Boolean) as string[];
  return excludeUserId ? ids.filter(id => id !== excludeUserId) : ids;
}

async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabase
    .from('admin_sovereign_roles')
    .select('user_id')
    .eq('is_active', true);
  return (data || []).map(r => r.user_id);
}

async function getOrgName(orgId: string): Promise<string> {
  const { data } = await supabase.from('organizations').select('name').eq('id', orgId).single();
  return data?.name || 'جهة';
}

// ══════════════════════════════════════════
// 1. SHIPMENT NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyShipmentEvent(params: {
  type: string;
  shipmentId: string;
  shipmentNumber?: string;
  targetOrgIds?: string[];
  targetUserIds?: string[];
  excludeUserId?: string;
  details?: string;
  organizationId?: string;
}) {
  const { type, shipmentId, shipmentNumber, targetOrgIds, targetUserIds, excludeUserId, details, organizationId } = params;
  
  const typeLabels: Record<string, string> = {
    shipment_created: '📦 شحنة جديدة',
    shipment_approved: '✅ تمت الموافقة على الشحنة',
    shipment_rejected: '❌ تم رفض الشحنة',
    shipment_cancelled: '🚫 تم إلغاء الشحنة',
    shipment_confirmed: '✅ تم تأكيد الشحنة',
    shipment_auto_approved: '⚡ موافقة تلقائية على الشحنة',
    shipment_disputed: '⚠️ نزاع على الشحنة',
    shipment_delayed: '⏰ تأخير في الشحنة',
    shipment_delivered: '📍 تم تسليم الشحنة',
    shipment_assigned: '🚛 تم تعيين الشحنة',
    driver_assignment: '👤 تعيين سائق',
    driver_reassigned: '🔄 إعادة تعيين السائق',
    pickup_started: '🚀 بدء التحميل',
    pickup_completed: '✅ اكتمال التحميل',
    delivery_started: '🚛 بدء التسليم',
    delivery_eta_update: '⏱️ تحديث وقت الوصول',
    weight_mismatch: '⚖️ اختلاف في الوزن',
    shipment_document: '📄 مستند شحنة',
    status_update: '🔄 تحديث حالة الشحنة',
  };

  const title = typeLabels[type] || `📦 إشعار شحنة`;
  const message = details || `شحنة #${shipmentNumber || shipmentId.slice(0, 8)}`;

  // Collect all target user IDs
  let allUserIds: string[] = [...(targetUserIds || [])];
  
  if (targetOrgIds?.length) {
    const orgUserPromises = targetOrgIds.map(oid => getOrgMemberIds(oid, excludeUserId));
    const orgUsers = await Promise.all(orgUserPromises);
    orgUsers.forEach(ids => allUserIds.push(...ids));
  }

  // Deduplicate and exclude sender
  allUserIds = [...new Set(allUserIds)];
  if (excludeUserId) allUserIds = allUserIds.filter(id => id !== excludeUserId);

  if (allUserIds.length === 0) return;

  await notifyMultiple(allUserIds, {
    title,
    message,
    type,
    priority: ['weight_mismatch', 'shipment_disputed', 'shipment_delayed'].includes(type) ? 'high' : 'normal',
    shipmentId,
    organizationId,
  });
}

// ══════════════════════════════════════════
// 2. CUSTODY CHAIN NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyCustodyEvent(params: {
  type: string;
  shipmentId: string;
  shipmentNumber?: string;
  targetOrgIds: string[];
  excludeUserId?: string;
  organizationId?: string;
}) {
  const labels: Record<string, string> = {
    custody_generator_handover: '🏭 تسليم من المولّد',
    custody_transporter_pickup: '🚛 استلام الناقل',
    custody_transporter_delivery: '📍 تسليم الناقل',
    custody_recycler_receipt: '♻️ استلام المدوّر',
    custody_chain_complete: '✅ اكتمال سلسلة الحيازة',
  };

  await notifyShipmentEvent({
    ...params,
    details: `${labels[params.type] || 'تحديث سلسلة الحيازة'} — شحنة #${params.shipmentNumber || ''}`,
  });
}

// ══════════════════════════════════════════
// 3. CONTRACT NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyContractEvent(params: {
  type: string;
  contractId: string;
  contractTitle: string;
  orgId: string;
  partnerOrgId?: string | null;
  excludeUserId?: string;
}) {
  const { type, contractId, contractTitle, orgId, partnerOrgId, excludeUserId } = params;

  const labels: Record<string, string> = {
    contract_created: '📝 عقد جديد',
    contract_signed: '✍️ تم توقيع العقد',
    contract_renewed: '🔄 تم تجديد العقد',
    contract_terminated: '🚫 تم إنهاء العقد',
    contract_pending_signature: '⏳ عقد بانتظار التوقيع',
    contract_expiry: '⚠️ عقد على وشك الانتهاء',
  };

  const targetOrgIds = [orgId];
  if (partnerOrgId) targetOrgIds.push(partnerOrgId);

  let allUserIds: string[] = [];
  for (const oid of targetOrgIds) {
    const ids = await getOrgMemberIds(oid, excludeUserId);
    allUserIds.push(...ids);
  }
  allUserIds = [...new Set(allUserIds)];

  if (allUserIds.length === 0) return;

  await notifyMultiple(allUserIds, {
    title: labels[type] || '📝 إشعار عقد',
    message: contractTitle,
    type,
    metadata: { contract_id: contractId },
    organizationId: orgId,
  });
}

// ══════════════════════════════════════════
// 4. EMPLOYEE / MEMBER NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyMemberEvent(params: {
  type: string;
  targetUserId: string;
  memberName: string;
  orgId: string;
  excludeUserId?: string;
}) {
  const { type, targetUserId, memberName, orgId, excludeUserId } = params;

  const labels: Record<string, string> = {
    employee_invitation: '📩 دعوة للانضمام',
    employee_activated: '✅ تم تفعيل حسابك',
    employee_deactivated: '🚫 تم تعطيل حسابك',
    member_joined: '👋 عضو جديد انضم',
    member_left: '👤 عضو غادر',
    member_role_changed: '🔄 تم تغيير الدور',
    credentials_updated: '🔑 تم تحديث بيانات الدخول',
    password_changed: '🔒 تم تغيير كلمة المرور',
    delegation_created: '📋 تفويض جديد',
    delegation_expired: '⏰ انتهاء التفويض',
  };

  // Notify the target user directly
  await notifyAction({
    title: labels[type] || '👤 إشعار عضوية',
    message: memberName,
    type,
    targetUserId,
    organizationId: orgId,
  });

  // For member_joined/left, also notify org admins
  if (['member_joined', 'member_left'].includes(type)) {
    const orgName = await getOrgName(orgId);
    const adminIds = await getOrgMemberIds(orgId, targetUserId);
    if (adminIds.length > 0) {
      await notifyMultiple(adminIds.filter(id => id !== excludeUserId), {
        title: labels[type] || '👤 إشعار عضوية',
        message: `${memberName} — ${orgName}`,
        type,
        organizationId: orgId,
      });
    }
  }
}

// ══════════════════════════════════════════
// 5. SOCIAL NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifySocialEvent(params: {
  type: string;
  actorName: string;
  actorUserId: string;
  targetUserId?: string;
  targetOrgId?: string;
  entityTitle?: string;
  entityId?: string;
  organizationId?: string;
}) {
  const { type, actorName, actorUserId, targetUserId, targetOrgId, entityTitle, entityId, organizationId } = params;

  const labels: Record<string, string> = {
    new_post: '📝 منشور جديد',
    post_liked: '❤️ إعجاب بمنشورك',
    post_commented: '💬 تعليق على منشورك',
    post_shared: '🔄 مشاركة منشورك',
    story_posted: '📷 قصة جديدة',
    story_reaction: '😊 تفاعل مع قصتك',
    profile_photo_updated: '📸 تحديث صورة شخصية',
    cover_photo_updated: '🖼️ تحديث صورة الغلاف',
    broadcast_new_post: '📢 منشور بث جديد',
    new_follower: '👤 متابع جديد',
    announcement: '📣 إعلان جديد',
    news_published: '📰 خبر جديد',
  };

  const title = labels[type] || '📱 إشعار اجتماعي';
  const message = entityTitle ? `${actorName}: ${entityTitle}` : actorName;

  if (targetUserId && targetUserId !== actorUserId) {
    await notifyAction({
      title,
      message,
      type,
      targetUserId,
      metadata: { entity_id: entityId, actor_id: actorUserId },
      organizationId,
    });
  } else if (targetOrgId) {
    const memberIds = await getOrgMemberIds(targetOrgId, actorUserId);
    if (memberIds.length > 0) {
      await notifyMultiple(memberIds, {
        title,
        message,
        type,
        metadata: { entity_id: entityId, actor_id: actorUserId },
        organizationId,
      });
    }
  }
}

// ══════════════════════════════════════════
// 6. CHAT & COMMUNICATION NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyChatEvent(params: {
  type: string;
  actorName: string;
  actorUserId: string;
  targetUserIds: string[];
  conversationId?: string;
  messagePreview?: string;
  organizationId?: string;
}) {
  const { type, actorName, actorUserId, targetUserIds, conversationId, messagePreview, organizationId } = params;

  const labels: Record<string, string> = {
    group_message: '💬 رسالة مجموعة',
    channel_message: '📢 رسالة قناة',
    thread_reply: '↩️ رد في المحادثة',
    reaction_added: '😊 تفاعل جديد',
    pinned_message: '📌 رسالة مثبتة',
    scheduled_message_sent: '⏰ رسالة مجدولة',
    poll_created: '📊 استطلاع جديد',
    poll_ended: '📊 انتهى الاستطلاع',
    channel_created: '📢 قناة جديدة',
    channel_invitation: '📩 دعوة لقناة',
    call_missed: '📞 مكالمة فائتة',
    meeting_starting: '🎥 اجتماع يبدأ الآن',
    meeting_cancelled: '❌ تم إلغاء الاجتماع',
  };

  const title = labels[type] || '💬 إشعار دردشة';
  const message = messagePreview ? `${actorName}: ${messagePreview}` : actorName;

  const recipients = targetUserIds.filter(id => id !== actorUserId);
  if (recipients.length === 0) return;

  await notifyMultiple(recipients, {
    title,
    message,
    type,
    metadata: { conversation_id: conversationId },
    organizationId,
  });
}

// ══════════════════════════════════════════
// 7. FINANCIAL NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyFinancialEvent(params: {
  type: string;
  title?: string;
  details: string;
  targetOrgId: string;
  amount?: number;
  currency?: string;
  referenceId?: string;
  excludeUserId?: string;
  organizationId?: string;
}) {
  const { type, details, targetOrgId, amount, currency, referenceId, excludeUserId, organizationId } = params;

  const labels: Record<string, string> = {
    invoice_created: '🧾 فاتورة جديدة',
    invoice_paid: '✅ تم دفع الفاتورة',
    invoice_overdue: '⚠️ فاتورة متأخرة',
    payment_received: '💰 دفعة مستلمة',
    wallet_deposit: '💳 إيداع في المحفظة',
    escrow_released: '🔓 تم تحرير الضمان',
    escrow_held: '🔒 تم حجز الضمان',
    subscription_reminder: '🔔 تذكير بالاشتراك',
    subscription_expired: '⚠️ انتهى الاشتراك',
    low_margin_alert: '📉 تنبيه هامش منخفض',
    financial_report: '📊 تقرير مالي',
  };

  const memberIds = await getOrgMemberIds(targetOrgId, excludeUserId);
  if (memberIds.length === 0) return;

  const amountStr = amount ? ` — ${amount} ${currency || 'ر.س'}` : '';

  await notifyMultiple(memberIds, {
    title: params.title || labels[type] || '💰 إشعار مالي',
    message: `${details}${amountStr}`,
    type,
    metadata: { reference_id: referenceId, amount },
    organizationId: organizationId || targetOrgId,
  });
}

// ══════════════════════════════════════════
// 8. PARTNER / PARTNERSHIP NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyPartnerEvent(params: {
  type: string;
  partnerOrgName: string;
  targetOrgId: string;
  partnerOrgId?: string;
  excludeUserId?: string;
  organizationId?: string;
}) {
  const { type, partnerOrgName, targetOrgId, partnerOrgId, excludeUserId, organizationId } = params;

  const labels: Record<string, string> = {
    partnership_request: '🤝 طلب شراكة',
    partnership_accepted: '✅ تم قبول الشراكة',
    partnership_rejected: '❌ تم رفض الشراكة',
    partnership_suspended: '⏸️ تم تعليق الشراكة',
    partner_linked: '🔗 ربط شريك جديد',
    partner_rated: '⭐ تقييم جديد',
    partner_review: '📝 مراجعة شريك',
    partner_verified: '✅ تم التحقق من الشريك',
  };

  const memberIds = await getOrgMemberIds(targetOrgId, excludeUserId);
  if (memberIds.length === 0) return;

  await notifyMultiple(memberIds, {
    title: labels[type] || '🤝 إشعار شراكة',
    message: partnerOrgName,
    type,
    metadata: { partner_org_id: partnerOrgId },
    organizationId: organizationId || targetOrgId,
  });
}

// ══════════════════════════════════════════
// 9. DRIVER NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyDriverEvent(params: {
  type: string;
  driverUserId: string;
  driverName: string;
  details?: string;
  shipmentId?: string;
  organizationId?: string;
}) {
  const { type, driverUserId, driverName, details, shipmentId, organizationId } = params;

  const labels: Record<string, string> = {
    driver_registered: '👤 سائق جديد',
    driver_approved: '✅ تم اعتماد السائق',
    driver_rejected: '❌ تم رفض السائق',
    driver_offer_received: '📋 عرض مهمة جديد',
    driver_offer_expired: '⏰ انتهى عرض المهمة',
    driver_notification: '🚛 إشعار سائق',
    driver_sos: '🆘 استغاثة سائق',
    driver_license_expiry: '⚠️ رخصة السائق على وشك الانتهاء',
  };

  await notifyAction({
    title: labels[type] || '🚛 إشعار سائق',
    message: details || driverName,
    type,
    targetUserId: driverUserId,
    shipmentId,
    organizationId,
  });
}

// ══════════════════════════════════════════
// 10. FLEET & TRACKING NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyFleetEvent(params: {
  type: string;
  details: string;
  targetOrgId: string;
  shipmentId?: string;
  vehicleId?: string;
  organizationId?: string;
}) {
  const { type, details, targetOrgId, shipmentId, vehicleId, organizationId } = params;

  const labels: Record<string, string> = {
    route_deviation: '🛤️ انحراف عن المسار',
    speed_alert: '⚡ تنبيه سرعة',
    eta_alert: '⏱️ تحديث وقت الوصول',
    geofence_alert: '📍 تنبيه سياج جغرافي',
    vehicle_inspection_due: '🔧 موعد فحص المركبة',
    fuel_alert: '⛽ تنبيه وقود',
    driver_rest_violation: '😴 مخالفة راحة السائق',
    signal_lost: '📡 فقدان الإشارة',
    maintenance: '🔧 صيانة مطلوبة',
    gps_alert: '📍 تنبيه GPS',
    fleet_alert: '🚛 تنبيه أسطول',
  };

  const memberIds = await getOrgMemberIds(targetOrgId);
  if (memberIds.length === 0) return;

  await notifyMultiple(memberIds, {
    title: labels[type] || '🚛 تنبيه أسطول',
    message: details,
    type,
    priority: ['route_deviation', 'speed_alert', 'signal_lost', 'driver_rest_violation'].includes(type) ? 'high' : 'normal',
    shipmentId,
    metadata: { vehicle_id: vehicleId },
    organizationId: organizationId || targetOrgId,
  });
}

// ══════════════════════════════════════════
// 11. DOCUMENT & COMPLIANCE NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyDocumentEvent(params: {
  type: string;
  documentTitle: string;
  targetUserId?: string;
  targetOrgId?: string;
  excludeUserId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}) {
  const { type, documentTitle, targetUserId, targetOrgId, excludeUserId, organizationId, metadata } = params;

  const labels: Record<string, string> = {
    document_expired: '⚠️ مستند منتهي الصلاحية',
    document_rejected: '❌ تم رفض المستند',
    document_uploaded: '📤 مستند مرفوع',
    document_signed: '✍️ تم توقيع المستند',
    document_shared: '🔗 مستند مشارك',
    document_download: '📥 تم تحميل المستند',
    endorsement_complete: '✅ اكتمال الاعتماد',
    government_doc_issued: '🏛️ مستند حكومي',
    stamp_applied: '🔏 تم الختم',
    signing_request: '📝 طلب توقيع',
    license_expiry: '⚠️ رخصة على وشك الانتهاء',
    compliance_alert: '📋 تنبيه امتثال',
    penalty_issued: '⚠️ غرامة',
    suspension_notice: '🚫 إشعار تعليق',
    regulatory_update: '📋 تحديث تنظيمي',
    audit_scheduled: '📅 موعد تدقيق',
    recycling_certificate_issued: '♻️ شهادة تدوير',
  };

  const title = labels[type] || '📄 إشعار مستند';

  if (targetUserId) {
    await notifyAction({
      title,
      message: documentTitle,
      type,
      targetUserId,
      organizationId,
      metadata,
    });
  } else if (targetOrgId) {
    const memberIds = await getOrgMemberIds(targetOrgId, excludeUserId);
    if (memberIds.length > 0) {
      await notifyMultiple(memberIds, {
        title,
        message: documentTitle,
        type,
        organizationId: organizationId || targetOrgId,
        metadata,
      });
    }
  }
}

// ══════════════════════════════════════════
// 12. ENVIRONMENT & CARBON NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyEnvironmentEvent(params: {
  type: string;
  details: string;
  targetOrgId: string;
  organizationId?: string;
}) {
  const { type, details, targetOrgId, organizationId } = params;

  const labels: Record<string, string> = {
    emission_threshold: '🌡️ تجاوز حد الانبعاثات',
    esg_report_ready: '📊 تقرير ESG جاهز',
    sustainability_milestone: '🌿 إنجاز استدامة',
    carbon_report: '🌍 تقرير كربون',
    environmental: '🌱 إشعار بيئي',
  };

  const memberIds = await getOrgMemberIds(targetOrgId);
  if (memberIds.length === 0) return;

  await notifyMultiple(memberIds, {
    title: labels[type] || '🌱 إشعار بيئي',
    message: details,
    type,
    organizationId: organizationId || targetOrgId,
  });
}

// ══════════════════════════════════════════
// 13. HR NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyHREvent(params: {
  type: string;
  targetUserId: string;
  employeeName: string;
  details?: string;
  organizationId?: string;
}) {
  const { type, targetUserId, employeeName, details, organizationId } = params;

  const labels: Record<string, string> = {
    leave_request: '📝 طلب إجازة',
    leave_approved: '✅ تمت الموافقة على الإجازة',
    leave_rejected: '❌ تم رفض الإجازة',
    salary_processed: '💰 تم صرف الراتب',
    attendance_alert: '⏰ تنبيه حضور',
    shift_assigned: '📅 مناوبة جديدة',
    performance_review: '📊 تقييم أداء',
    training_assigned: '📚 تدريب مطلوب',
  };

  await notifyAction({
    title: labels[type] || '👤 إشعار موارد بشرية',
    message: details || employeeName,
    type,
    targetUserId,
    organizationId,
  });
}

// ══════════════════════════════════════════
// 14. WORK ORDER NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifyWorkOrderEvent(params: {
  type: string;
  workOrderTitle: string;
  targetOrgId: string;
  targetUserId?: string;
  excludeUserId?: string;
  organizationId?: string;
}) {
  const { type, workOrderTitle, targetOrgId, targetUserId, excludeUserId, organizationId } = params;

  const labels: Record<string, string> = {
    work_order: '📋 أمر عمل',
    work_order_update: '🔄 تحديث أمر عمل',
    work_order_completed: '✅ اكتمال أمر العمل',
    work_order_cancelled: '❌ إلغاء أمر العمل',
  };

  if (targetUserId) {
    await notifyAction({
      title: labels[type] || '📋 أمر عمل',
      message: workOrderTitle,
      type,
      targetUserId,
      organizationId: organizationId || targetOrgId,
    });
  } else {
    const memberIds = await getOrgMemberIds(targetOrgId, excludeUserId);
    if (memberIds.length > 0) {
      await notifyMultiple(memberIds, {
        title: labels[type] || '📋 أمر عمل',
        message: workOrderTitle,
        type,
        organizationId: organizationId || targetOrgId,
      });
    }
  }
}

// ══════════════════════════════════════════
// 15. SYSTEM / ADMIN NOTIFICATIONS
// ══════════════════════════════════════════
export async function notifySystemEvent(params: {
  type: string;
  title: string;
  message: string;
  targetUserIds?: string[];
  targetOrgId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) {
  const { type, title, message, targetUserIds, targetOrgId, priority } = params;

  let recipients = targetUserIds || [];
  if (targetOrgId) {
    const orgMembers = await getOrgMemberIds(targetOrgId);
    recipients = [...new Set([...recipients, ...orgMembers])];
  }
  if (recipients.length === 0) {
    recipients = await getAdminUserIds();
  }

  if (recipients.length > 0) {
    await notifyMultiple(recipients, { title, message, type, priority });
  }
}
