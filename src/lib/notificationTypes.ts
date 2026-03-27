/**
 * سجل شامل لجميع أنواع الإشعارات في المنصة (~188 نوع)
 * المرجع المركزي لكل ما يتعلق بالإشعارات
 */

export interface NotificationTypeMeta {
  /** النوع البرمجي */
  type: string;
  /** الفئة */
  category: NotificationCategory;
  /** الوصف بالعربي */
  labelAr: string;
  /** المسار الافتراضي */
  defaultRoute: string | null;
  /** نوع الصوت */
  soundGroup: string;
  /** الأولوية الافتراضية */
  defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
}

export type NotificationCategory =
  | 'shipments'
  | 'custody'
  | 'fleet'
  | 'documents'
  | 'certificates'
  | 'finance'
  | 'contracts'
  | 'chat'
  | 'broadcast'
  | 'meetings'
  | 'social'
  | 'partners'
  | 'members'
  | 'hr'
  | 'compliance'
  | 'drivers'
  | 'environment'
  | 'work_orders'
  | 'security'
  | 'ai'
  | 'identity'
  | 'disputes'
  | 'marketplace'
  | 'system'
  | 'emergency';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  shipments: 'الشحنات',
  custody: 'سلسلة الحيازة',
  fleet: 'التتبع والأسطول',
  documents: 'المستندات والتوقيعات',
  certificates: 'الشهادات والإيصالات',
  finance: 'المالية والمحاسبة',
  contracts: 'العقود',
  chat: 'الدردشة والرسائل',
  broadcast: 'البث والقنوات',
  meetings: 'الاجتماعات والمكالمات',
  social: 'المنشورات والتواصل',
  partners: 'الشركاء',
  members: 'الأعضاء والفريق',
  hr: 'الموارد البشرية',
  compliance: 'الامتثال والتراخيص',
  drivers: 'السائقون',
  environment: 'البيئة والكربون',
  work_orders: 'أوامر العمل',
  security: 'الأمن والحماية',
  ai: 'الذكاء الاصطناعي',
  identity: 'الهوية والتحقق',
  disputes: 'النزاعات',
  marketplace: 'السوق والمزايدات',
  system: 'النظام والموافقات',
  emergency: 'الطوارئ',
};

/**
 * السجل الشامل — 188 نوع إشعار
 */
export const NOTIFICATION_TYPES_REGISTRY: NotificationTypeMeta[] = [
  // ═══════════════════════════════════════
  // 1. الشحنات (20)
  // ═══════════════════════════════════════
  { type: 'shipment_created', category: 'shipments', labelAr: 'شحنة جديدة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_created', defaultPriority: 'normal' },
  { type: 'shipment_status', category: 'shipments', labelAr: 'تحديث حالة الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'status_update', category: 'shipments', labelAr: 'تحديث الحالة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'shipment_approved', category: 'shipments', labelAr: 'تمت الموافقة على الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'shipment_assigned', category: 'shipments', labelAr: 'إسناد شحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_assigned', defaultPriority: 'high' },
  { type: 'shipment_delivered', category: 'shipments', labelAr: 'تم التسليم', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_delivered', defaultPriority: 'normal' },
  { type: 'shipment_delayed', category: 'shipments', labelAr: 'تأخر الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'shipment_approval_request', category: 'shipments', labelAr: 'طلب موافقة شحنة', defaultRoute: '/dashboard/my-requests', soundGroup: 'approval_request', defaultPriority: 'high' },
  { type: 'shipment_auto_approved', category: 'shipments', labelAr: 'موافقة تلقائية على الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'shipment_rejected', category: 'shipments', labelAr: 'رفض الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'shipment_cancelled', category: 'shipments', labelAr: 'إلغاء الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'shipment_disputed', category: 'shipments', labelAr: 'نزاع على الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'shipment_confirmed', category: 'shipments', labelAr: 'تأكيد استلام الشحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'shipment', category: 'shipments', labelAr: 'شحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'driver_assignment', category: 'shipments', labelAr: 'تعيين سائق', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_assigned', defaultPriority: 'high' },
  { type: 'driver_reassigned', category: 'shipments', labelAr: 'إعادة تعيين سائق', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_assigned', defaultPriority: 'high' },
  { type: 'pickup_started', category: 'shipments', labelAr: 'بدأ التحميل', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'pickup_completed', category: 'shipments', labelAr: 'اكتمل التحميل', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'delivery_started', category: 'shipments', labelAr: 'بدأ التوصيل', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'delivery_eta_update', category: 'shipments', labelAr: 'تحديث وقت الوصول', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'low' },
  { type: 'weight_mismatch', category: 'shipments', labelAr: 'اختلاف الوزن', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'shipment_document', category: 'shipments', labelAr: 'مستند شحنة', defaultRoute: '/dashboard/shipments', soundGroup: 'document_uploaded', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 2. سلسلة الحيازة (5)
  // ═══════════════════════════════════════
  { type: 'custody_generator_handover', category: 'custody', labelAr: 'تسليم من المولد', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'high' },
  { type: 'custody_transporter_pickup', category: 'custody', labelAr: 'استلام الناقل', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'high' },
  { type: 'custody_transporter_delivery', category: 'custody', labelAr: 'تسليم الناقل', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_status', defaultPriority: 'high' },
  { type: 'custody_recycler_receipt', category: 'custody', labelAr: 'استلام المدوّر', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_delivered', defaultPriority: 'high' },
  { type: 'custody_chain_complete', category: 'custody', labelAr: 'اكتمال سلسلة الحيازة', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_approved', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 3. التتبع والأسطول (12)
  // ═══════════════════════════════════════
  { type: 'signal_lost', category: 'fleet', labelAr: 'فقدان الإشارة', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'fleet_alert', category: 'fleet', labelAr: 'تنبيه أسطول', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'maintenance', category: 'fleet', labelAr: 'صيانة', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'geofence_alert', category: 'fleet', labelAr: 'تنبيه نطاق جغرافي', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'gps_alert', category: 'fleet', labelAr: 'تنبيه GPS', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'route_deviation', category: 'fleet', labelAr: 'انحراف عن المسار', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'speed_alert', category: 'fleet', labelAr: 'تجاوز السرعة', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'eta_alert', category: 'fleet', labelAr: 'تنبيه وقت الوصول', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'fake_gps', category: 'fleet', labelAr: 'كشف GPS مزيف', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'vehicle_inspection_due', category: 'fleet', labelAr: 'موعد فحص المركبة', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'fuel_alert', category: 'fleet', labelAr: 'تنبيه وقود', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'driver_rest_violation', category: 'fleet', labelAr: 'انتهاك وقت الراحة', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 4. المستندات والتوقيعات (12)
  // ═══════════════════════════════════════
  { type: 'signing_request', category: 'documents', labelAr: 'طلب توقيع', defaultRoute: '/dashboard/signing-inbox', soundGroup: 'document_uploaded', defaultPriority: 'high' },
  { type: 'signature_request', category: 'documents', labelAr: 'طلب توقيع', defaultRoute: '/dashboard/signing-inbox', soundGroup: 'document_uploaded', defaultPriority: 'high' },
  { type: 'document_uploaded', category: 'documents', labelAr: 'رفع مستند', defaultRoute: '/dashboard/document-center', soundGroup: 'document_uploaded', defaultPriority: 'normal' },
  { type: 'document_issued', category: 'documents', labelAr: 'إصدار مستند', defaultRoute: '/dashboard/document-center', soundGroup: 'document_uploaded', defaultPriority: 'normal' },
  { type: 'document_signed', category: 'documents', labelAr: 'تم التوقيع', defaultRoute: '/dashboard/document-center', soundGroup: 'document_signed', defaultPriority: 'normal' },
  { type: 'document_shared', category: 'documents', labelAr: 'مستند مشترك', defaultRoute: '/dashboard/document-center', soundGroup: 'document_uploaded', defaultPriority: 'normal' },
  { type: 'stamp_applied', category: 'documents', labelAr: 'ختم مطبق', defaultRoute: '/dashboard/document-center', soundGroup: 'document_signed', defaultPriority: 'normal' },
  { type: 'document_expired', category: 'documents', labelAr: 'مستند منتهي الصلاحية', defaultRoute: '/dashboard/document-center', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'document_rejected', category: 'documents', labelAr: 'رفض المستند', defaultRoute: '/dashboard/document-center', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'document_download', category: 'documents', labelAr: 'تحميل مستند', defaultRoute: '/dashboard/document-center', soundGroup: 'document_uploaded', defaultPriority: 'low' },
  { type: 'endorsement_complete', category: 'documents', labelAr: 'اكتمال المصادقة', defaultRoute: '/dashboard/document-center', soundGroup: 'document_signed', defaultPriority: 'normal' },
  { type: 'endorsement_notes', category: 'documents', labelAr: 'ملاحظات المصادقة', defaultRoute: '/dashboard/document-center', soundGroup: 'document_uploaded', defaultPriority: 'normal' },
  { type: 'government_doc_issued', category: 'documents', labelAr: 'مستند حكومي', defaultRoute: '/dashboard/document-center', soundGroup: 'document_signed', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 5. الشهادات والإيصالات (6)
  // ═══════════════════════════════════════
  { type: 'receipt_issued', category: 'certificates', labelAr: 'إصدار إيصال', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'receipt_confirmed', category: 'certificates', labelAr: 'تأكيد إيصال', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'certificate', category: 'certificates', labelAr: 'شهادة', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'recycling_report', category: 'certificates', labelAr: 'تقرير تدوير', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'report', category: 'certificates', labelAr: 'تقرير', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'recycling_certificate_issued', category: 'certificates', labelAr: 'شهادة تدوير', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'aggregate_report_shared', category: 'certificates', labelAr: 'تقرير مجمع', defaultRoute: '/dashboard/reports', soundGroup: 'recycling_report', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 6. المالية والمحاسبة (15)
  // ═══════════════════════════════════════
  { type: 'invoice', category: 'finance', labelAr: 'فاتورة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'invoice_overdue', category: 'finance', labelAr: 'فاتورة متأخرة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'invoice_created', category: 'finance', labelAr: 'فاتورة جديدة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'invoice_paid', category: 'finance', labelAr: 'تم السداد', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'invoice_draft', category: 'finance', labelAr: 'مسودة فاتورة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'low' },
  { type: 'payment', category: 'finance', labelAr: 'دفعة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'payment_received', category: 'finance', labelAr: 'استلام دفعة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'deposit', category: 'finance', labelAr: 'إيداع', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'wallet_deposit', category: 'finance', labelAr: 'إيداع محفظة', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'financial', category: 'finance', labelAr: 'مالي', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'financial_report', category: 'finance', labelAr: 'تقرير مالي', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'low_margin_alert', category: 'finance', labelAr: 'تنبيه هامش ربح منخفض', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'escrow_released', category: 'finance', labelAr: 'إفراج عن الضمان', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'escrow_held', category: 'finance', labelAr: 'تجميد ضمان', defaultRoute: '/dashboard/erp/accounting', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'subscription_reminder', category: 'finance', labelAr: 'تذكير اشتراك', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'subscription_expired', category: 'finance', labelAr: 'انتهاء الاشتراك', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'urgent' },

  // ═══════════════════════════════════════
  // 7. العقود (6)
  // ═══════════════════════════════════════
  { type: 'contract_expiry', category: 'contracts', labelAr: 'انتهاء العقد', defaultRoute: '/dashboard/contracts', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'contract_created', category: 'contracts', labelAr: 'عقد جديد', defaultRoute: '/dashboard/contracts', soundGroup: 'document_uploaded', defaultPriority: 'normal' },
  { type: 'contract_signed', category: 'contracts', labelAr: 'توقيع العقد', defaultRoute: '/dashboard/contracts', soundGroup: 'document_signed', defaultPriority: 'normal' },
  { type: 'contract_renewed', category: 'contracts', labelAr: 'تجديد العقد', defaultRoute: '/dashboard/contracts', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'contract_terminated', category: 'contracts', labelAr: 'إنهاء العقد', defaultRoute: '/dashboard/contracts', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'contract_pending_signature', category: 'contracts', labelAr: 'عقد بانتظار التوقيع', defaultRoute: '/dashboard/contracts', soundGroup: 'approval_request', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 8. الدردشة والرسائل (10)
  // ═══════════════════════════════════════
  { type: 'chat_message', category: 'chat', labelAr: 'رسالة دردشة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'partner_message', category: 'chat', labelAr: 'رسالة شريك', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'mention', category: 'chat', labelAr: 'إشارة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'high' },
  { type: 'message', category: 'chat', labelAr: 'رسالة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'group_message', category: 'chat', labelAr: 'رسالة جماعية', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'channel_message', category: 'chat', labelAr: 'رسالة قناة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'thread_reply', category: 'chat', labelAr: 'رد في محادثة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'reaction_added', category: 'chat', labelAr: 'تفاعل جديد', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'pinned_message', category: 'chat', labelAr: 'رسالة مثبتة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'scheduled_message_sent', category: 'chat', labelAr: 'رسالة مجدولة أُرسلت', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'low' },

  // ═══════════════════════════════════════
  // 9. البث والقنوات (6)
  // ═══════════════════════════════════════
  { type: 'broadcast', category: 'broadcast', labelAr: 'بث', defaultRoute: '/dashboard/broadcast-channels', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'broadcast_new_post', category: 'broadcast', labelAr: 'منشور بث جديد', defaultRoute: '/dashboard/broadcast-channels', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'channel_created', category: 'broadcast', labelAr: 'قناة جديدة', defaultRoute: '/dashboard/broadcast-channels', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'channel_invitation', category: 'broadcast', labelAr: 'دعوة قناة', defaultRoute: '/dashboard/broadcast-channels', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'poll_created', category: 'broadcast', labelAr: 'استطلاع جديد', defaultRoute: '/dashboard/broadcast-channels', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'poll_ended', category: 'broadcast', labelAr: 'انتهاء استطلاع', defaultRoute: '/dashboard/broadcast-channels', soundGroup: 'broadcast', defaultPriority: 'low' },

  // ═══════════════════════════════════════
  // 10. الاجتماعات والمكالمات (5)
  // ═══════════════════════════════════════
  { type: 'meeting_invitation', category: 'meetings', labelAr: 'دعوة اجتماع', defaultRoute: '/dashboard/chat', soundGroup: 'approval_request', defaultPriority: 'high' },
  { type: 'meeting_starting', category: 'meetings', labelAr: 'بدء الاجتماع', defaultRoute: '/dashboard/chat', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'meeting_cancelled', category: 'meetings', labelAr: 'إلغاء الاجتماع', defaultRoute: '/dashboard/chat', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'video_call_incoming', category: 'meetings', labelAr: 'مكالمة فيديو واردة', defaultRoute: '/dashboard/chat', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'call_missed', category: 'meetings', labelAr: 'مكالمة فائتة', defaultRoute: '/dashboard/chat', soundGroup: 'chat_message', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 11. المنشورات والتواصل الاجتماعي (12)
  // ═══════════════════════════════════════
  { type: 'partner_post', category: 'social', labelAr: 'منشور شريك', defaultRoute: '/dashboard/partners', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'new_post', category: 'social', labelAr: 'منشور جديد', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'post_liked', category: 'social', labelAr: 'إعجاب بمنشور', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'post_commented', category: 'social', labelAr: 'تعليق على منشور', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'normal' },
  { type: 'post_shared', category: 'social', labelAr: 'مشاركة منشور', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'story_posted', category: 'social', labelAr: 'قصة جديدة', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'story_reaction', category: 'social', labelAr: 'تفاعل على قصة', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'profile_photo_updated', category: 'social', labelAr: 'تحديث صورة الملف الشخصي', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'cover_photo_updated', category: 'social', labelAr: 'تحديث صورة الغلاف', defaultRoute: '/dashboard/news-feed', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'announcement', category: 'social', labelAr: 'إعلان', defaultRoute: '/dashboard/news-feed', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'news_published', category: 'social', labelAr: 'خبر منشور', defaultRoute: '/dashboard/news-feed', soundGroup: 'broadcast', defaultPriority: 'normal' },
  { type: 'partner_note', category: 'social', labelAr: 'ملاحظة شريك', defaultRoute: '/dashboard/notes', soundGroup: 'chat_message', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 12. الشركاء والجهات (8)
  // ═══════════════════════════════════════
  { type: 'partner_linked', category: 'partners', labelAr: 'ربط شريك', defaultRoute: '/dashboard/partners', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'partnership_request', category: 'partners', labelAr: 'طلب شراكة', defaultRoute: '/dashboard/partners', soundGroup: 'approval_request', defaultPriority: 'high' },
  { type: 'partnership_accepted', category: 'partners', labelAr: 'قبول الشراكة', defaultRoute: '/dashboard/partners', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'partnership_rejected', category: 'partners', labelAr: 'رفض الشراكة', defaultRoute: '/dashboard/partners', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'partnership_suspended', category: 'partners', labelAr: 'تعليق الشراكة', defaultRoute: '/dashboard/partners', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'partner_rated', category: 'partners', labelAr: 'تقييم شريك', defaultRoute: '/dashboard/partners', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'partner_review', category: 'partners', labelAr: 'مراجعة شريك', defaultRoute: '/dashboard/partners', soundGroup: 'chat_message', defaultPriority: 'low' },
  { type: 'partner_verified', category: 'partners', labelAr: 'توثيق شريك', defaultRoute: '/dashboard/partners', soundGroup: 'partner_linked', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 13. الأعضاء والفريق (10)
  // ═══════════════════════════════════════
  { type: 'member_joined', category: 'members', labelAr: 'انضمام عضو', defaultRoute: '/dashboard/members', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'member_left', category: 'members', labelAr: 'مغادرة عضو', defaultRoute: '/dashboard/members', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'member_role_changed', category: 'members', labelAr: 'تغيير صلاحية عضو', defaultRoute: '/dashboard/members', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'employee_invitation', category: 'members', labelAr: 'دعوة موظف', defaultRoute: '/dashboard/members', soundGroup: 'approval_request', defaultPriority: 'normal' },
  { type: 'employee_activated', category: 'members', labelAr: 'تفعيل موظف', defaultRoute: '/dashboard/members', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'employee_deactivated', category: 'members', labelAr: 'تعطيل موظف', defaultRoute: '/dashboard/members', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'delegation_created', category: 'members', labelAr: 'إنشاء تفويض', defaultRoute: '/dashboard/members', soundGroup: 'approval_request', defaultPriority: 'normal' },
  { type: 'delegation_expired', category: 'members', labelAr: 'انتهاء تفويض', defaultRoute: '/dashboard/members', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'credentials_updated', category: 'members', labelAr: 'تحديث بيانات الدخول', defaultRoute: '/dashboard/organization-profile', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'password_changed', category: 'members', labelAr: 'تغيير كلمة المرور', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 14. الموارد البشرية (8)
  // ═══════════════════════════════════════
  { type: 'leave_request', category: 'hr', labelAr: 'طلب إجازة', defaultRoute: '/dashboard/erp/hr', soundGroup: 'approval_request', defaultPriority: 'normal' },
  { type: 'leave_approved', category: 'hr', labelAr: 'قبول الإجازة', defaultRoute: '/dashboard/erp/hr', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'leave_rejected', category: 'hr', labelAr: 'رفض الإجازة', defaultRoute: '/dashboard/erp/hr', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'salary_processed', category: 'hr', labelAr: 'صرف الراتب', defaultRoute: '/dashboard/erp/hr', soundGroup: 'financial', defaultPriority: 'normal' },
  { type: 'attendance_alert', category: 'hr', labelAr: 'تنبيه حضور', defaultRoute: '/dashboard/erp/hr', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'shift_assigned', category: 'hr', labelAr: 'تعيين وردية', defaultRoute: '/dashboard/erp/hr', soundGroup: 'shipment_assigned', defaultPriority: 'normal' },
  { type: 'performance_review', category: 'hr', labelAr: 'تقييم أداء', defaultRoute: '/dashboard/erp/hr', soundGroup: 'approval_request', defaultPriority: 'normal' },
  { type: 'training_assigned', category: 'hr', labelAr: 'تدريب مخصص', defaultRoute: '/dashboard/erp/hr', soundGroup: 'shipment_assigned', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 15. الامتثال والتراخيص (10)
  // ═══════════════════════════════════════
  { type: 'license_expiry', category: 'compliance', labelAr: 'انتهاء ترخيص', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'license_warning', category: 'compliance', labelAr: 'تحذير ترخيص', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'compliance_alert', category: 'compliance', labelAr: 'تنبيه امتثال', defaultRoute: '/dashboard/compliance', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'compliance_update', category: 'compliance', labelAr: 'تحديث امتثال', defaultRoute: '/dashboard/compliance', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'inspection', category: 'compliance', labelAr: 'فحص', defaultRoute: '/dashboard/compliance', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'violation', category: 'compliance', labelAr: 'مخالفة', defaultRoute: '/dashboard/compliance', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'penalty_issued', category: 'compliance', labelAr: 'إصدار غرامة', defaultRoute: '/dashboard/compliance', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'suspension_notice', category: 'compliance', labelAr: 'إشعار تعليق', defaultRoute: '/dashboard/compliance', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'regulatory_update', category: 'compliance', labelAr: 'تحديث تنظيمي', defaultRoute: '/dashboard/compliance', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'audit_scheduled', category: 'compliance', labelAr: 'مراجعة مجدولة', defaultRoute: '/dashboard/compliance', soundGroup: 'approval_request', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 16. السائقون (8)
  // ═══════════════════════════════════════
  { type: 'driver_notification', category: 'drivers', labelAr: 'إشعار سائق', defaultRoute: '/dashboard/fleet', soundGroup: 'shipment_assigned', defaultPriority: 'normal' },
  { type: 'driver_sos', category: 'drivers', labelAr: 'نداء طوارئ سائق', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'driver_license_expiry', category: 'drivers', labelAr: 'انتهاء رخصة سائق', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'driver_registered', category: 'drivers', labelAr: 'تسجيل سائق جديد', defaultRoute: '/dashboard/fleet', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'driver_approved', category: 'drivers', labelAr: 'قبول سائق', defaultRoute: '/dashboard/fleet', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'driver_rejected', category: 'drivers', labelAr: 'رفض سائق', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'driver_offer_received', category: 'drivers', labelAr: 'عرض وارد للسائق', defaultRoute: '/dashboard/fleet', soundGroup: 'approval_request', defaultPriority: 'high' },
  { type: 'driver_offer_expired', category: 'drivers', labelAr: 'انتهاء عرض السائق', defaultRoute: '/dashboard/fleet', soundGroup: 'warning', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 17. البيئة والكربون (5)
  // ═══════════════════════════════════════
  { type: 'carbon_report', category: 'environment', labelAr: 'تقرير كربون', defaultRoute: '/dashboard/carbon-footprint', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'environmental', category: 'environment', labelAr: 'بيئي', defaultRoute: '/dashboard/carbon-footprint', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'emission_threshold', category: 'environment', labelAr: 'تجاوز حد الانبعاثات', defaultRoute: '/dashboard/carbon-footprint', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'esg_report_ready', category: 'environment', labelAr: 'تقرير ESG جاهز', defaultRoute: '/dashboard/carbon-footprint', soundGroup: 'recycling_report', defaultPriority: 'normal' },
  { type: 'sustainability_milestone', category: 'environment', labelAr: 'إنجاز بيئي', defaultRoute: '/dashboard/carbon-footprint', soundGroup: 'shipment_approved', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 18. أوامر العمل (4)
  // ═══════════════════════════════════════
  { type: 'work_order', category: 'work_orders', labelAr: 'أمر عمل', defaultRoute: '/dashboard/work-orders', soundGroup: 'approval_request', defaultPriority: 'normal' },
  { type: 'work_order_update', category: 'work_orders', labelAr: 'تحديث أمر عمل', defaultRoute: '/dashboard/work-orders', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'work_order_completed', category: 'work_orders', labelAr: 'اكتمال أمر عمل', defaultRoute: '/dashboard/work-orders', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'work_order_assigned', category: 'work_orders', labelAr: 'تعيين أمر عمل', defaultRoute: '/dashboard/work-orders', soundGroup: 'shipment_assigned', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 19. الأمن والحماية (5)
  // ═══════════════════════════════════════
  { type: 'security_alert', category: 'security', labelAr: 'تنبيه أمني', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'fake_gps_detected', category: 'security', labelAr: 'كشف GPS مزيف', defaultRoute: '/dashboard/fleet-tracking', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'suspicious_login', category: 'security', labelAr: 'دخول مشبوه', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'account_locked', category: 'security', labelAr: 'قفل الحساب', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'data_breach_alert', category: 'security', labelAr: 'تنبيه اختراق بيانات', defaultRoute: '/dashboard/organization-profile', soundGroup: 'warning', defaultPriority: 'urgent' },

  // ═══════════════════════════════════════
  // 20. الذكاء الاصطناعي (4)
  // ═══════════════════════════════════════
  { type: 'ai_alert', category: 'ai', labelAr: 'تنبيه ذكاء اصطناعي', defaultRoute: '/dashboard/ai-tools', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'ai_insight', category: 'ai', labelAr: 'رؤية ذكاء اصطناعي', defaultRoute: '/dashboard/ai-tools', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'ai_analysis_complete', category: 'ai', labelAr: 'اكتمال تحليل AI', defaultRoute: '/dashboard/ai-tools', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'smart_dispatch', category: 'ai', labelAr: 'توزيع ذكي', defaultRoute: '/dashboard/ai-tools', soundGroup: 'shipment_assigned', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 21. الهوية والتحقق (4)
  // ═══════════════════════════════════════
  { type: 'identity_verified', category: 'identity', labelAr: 'تحقق من الهوية', defaultRoute: '/dashboard/organization-profile', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'kyc_update', category: 'identity', labelAr: 'تحديث KYC', defaultRoute: '/dashboard/organization-profile', soundGroup: 'shipment_status', defaultPriority: 'normal' },
  { type: 'org_verified', category: 'identity', labelAr: 'توثيق المنظمة', defaultRoute: '/dashboard/organization-profile', soundGroup: 'partner_linked', defaultPriority: 'normal' },
  { type: 'account_approved', category: 'identity', labelAr: 'قبول الحساب', defaultRoute: '/dashboard/organization-profile', soundGroup: 'shipment_approved', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 22. النزاعات (4)
  // ═══════════════════════════════════════
  { type: 'weight_dispute', category: 'disputes', labelAr: 'نزاع وزن', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'dispute_resolved', category: 'disputes', labelAr: 'حل النزاع', defaultRoute: '/dashboard/shipments', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'dispute_escalated', category: 'disputes', labelAr: 'تصعيد النزاع', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'dispute_created', category: 'disputes', labelAr: 'إنشاء نزاع', defaultRoute: '/dashboard/shipments', soundGroup: 'warning', defaultPriority: 'high' },

  // ═══════════════════════════════════════
  // 23. السوق والمزايدات (4)
  // ═══════════════════════════════════════
  { type: 'bid_received', category: 'marketplace', labelAr: 'عرض سعر وارد', defaultRoute: '/dashboard/marketplace', soundGroup: 'financial', defaultPriority: 'high' },
  { type: 'bid_accepted', category: 'marketplace', labelAr: 'قبول عرض السعر', defaultRoute: '/dashboard/marketplace', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'auction_ending', category: 'marketplace', labelAr: 'انتهاء المزاد', defaultRoute: '/dashboard/marketplace', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'marketplace_listing', category: 'marketplace', labelAr: 'عرض في السوق', defaultRoute: '/dashboard/marketplace', soundGroup: 'broadcast', defaultPriority: 'normal' },

  // ═══════════════════════════════════════
  // 24. النظام والموافقات (5)
  // ═══════════════════════════════════════
  { type: 'approval_request', category: 'system', labelAr: 'طلب موافقة', defaultRoute: '/dashboard/my-requests', soundGroup: 'approval_request', defaultPriority: 'high' },
  { type: 'approval_granted', category: 'system', labelAr: 'تمت الموافقة', defaultRoute: '/dashboard/my-requests', soundGroup: 'shipment_approved', defaultPriority: 'normal' },
  { type: 'approval_denied', category: 'system', labelAr: 'رفض الطلب', defaultRoute: '/dashboard/my-requests', soundGroup: 'warning', defaultPriority: 'normal' },
  { type: 'system_maintenance', category: 'system', labelAr: 'صيانة النظام', defaultRoute: '/dashboard', soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'emergency', category: 'emergency', labelAr: 'طوارئ', defaultRoute: '/dashboard', soundGroup: 'warning', defaultPriority: 'urgent' },
  { type: 'warning', category: 'system', labelAr: 'تحذير', defaultRoute: null, soundGroup: 'warning', defaultPriority: 'high' },
  { type: 'action', category: 'system', labelAr: 'إجراء', defaultRoute: null, soundGroup: 'default', defaultPriority: 'normal' },
  { type: 'system', category: 'system', labelAr: 'نظام', defaultRoute: '/dashboard', soundGroup: 'default', defaultPriority: 'normal' },
];

/** خريطة سريعة للبحث بالنوع */
const _typeMap = new Map<string, NotificationTypeMeta>();
NOTIFICATION_TYPES_REGISTRY.forEach(t => _typeMap.set(t.type, t));

/** الحصول على بيانات نوع إشعار */
export function getNotificationTypeMeta(type: string | null): NotificationTypeMeta | undefined {
  if (!type) return undefined;
  return _typeMap.get(type);
}

/** الحصول على الوصف العربي لنوع الإشعار */
export function getNotificationLabel(type: string | null): string {
  return getNotificationTypeMeta(type)?.labelAr || type || 'إشعار';
}

/** الحصول على جميع أنواع فئة معينة */
export function getTypesByCategory(category: NotificationCategory): NotificationTypeMeta[] {
  return NOTIFICATION_TYPES_REGISTRY.filter(t => t.category === category);
}

/** العدد الإجمالي */
export const TOTAL_NOTIFICATION_TYPES = NOTIFICATION_TYPES_REGISTRY.length;
