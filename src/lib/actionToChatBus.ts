/**
 * Action-to-Chat Bus — التكامل العكسي
 * عند تنفيذ أي إجراء في المنصة، يتم إرسال رسالة تلقائية في المحادثة المرتبطة
 */

export type ActionType = 
  | 'shipment_status_changed'
  | 'invoice_issued'
  | 'invoice_approved'
  | 'invoice_rejected'
  | 'document_signed'
  | 'document_rejected'
  | 'contract_accepted'
  | 'contract_rejected'
  | 'shipment_created'
  | 'delivery_confirmed'
  | 'payment_received'
  | 'signature_requested'
  | 'signature_completed'
  | 'stamp_applied'
  | 'work_order_created'
  | 'quality_inspection';

interface ActionToChatEvent {
  type: ActionType;
  resourceId: string;
  resourceType: string;
  resourceLabel: string;
  targetOrgId?: string;
  metadata?: Record<string, any>;
}

type ActionHandler = (event: ActionToChatEvent) => void;

const handlers = new Set<ActionHandler>();

export function onActionToChat(handler: ActionHandler): () => void {
  handlers.add(handler);
  return () => { handlers.delete(handler); };
}

export function emitActionToChat(event: ActionToChatEvent): void {
  handlers.forEach(fn => fn(event));
}

// Helper to generate system message content from action
export function actionToMessage(event: ActionToChatEvent): string {
  const messages: Record<ActionType, string> = {
    shipment_status_changed: `🚛 تم تحديث حالة الشحنة ${event.resourceLabel} — ${event.metadata?.newStatus || ''}`,
    invoice_issued: `🧾 تم إصدار فاتورة جديدة ${event.resourceLabel}`,
    invoice_approved: `✅ تم اعتماد الفاتورة ${event.resourceLabel}`,
    invoice_rejected: `❌ تم رفض الفاتورة ${event.resourceLabel} — ${event.metadata?.reason || ''}`,
    document_signed: `✍️ تم توقيع المستند ${event.resourceLabel}`,
    document_rejected: `❌ تم رفض المستند ${event.resourceLabel} — ${event.metadata?.reason || ''}`,
    contract_accepted: `🤝 تم قبول العقد ${event.resourceLabel}`,
    contract_rejected: `❌ تم رفض العقد ${event.resourceLabel}`,
    shipment_created: `📦 تم إنشاء شحنة جديدة ${event.resourceLabel}`,
    delivery_confirmed: `✅ تم تأكيد التسليم للشحنة ${event.resourceLabel}`,
    payment_received: `💰 تم استلام دفعة مالية ${event.resourceLabel}`,
    signature_requested: `📝 طلب توقيع جديد على ${event.resourceLabel}`,
    signature_completed: `✅ تم إكمال جميع التوقيعات على ${event.resourceLabel}`,
    stamp_applied: `🔏 تم تطبيق الختم الرسمي على ${event.resourceLabel}`,
    work_order_created: `📋 تم إنشاء أمر عمل ${event.resourceLabel}`,
    quality_inspection: `🔍 تم إتمام فحص الجودة للشحنة ${event.resourceLabel}`,
  };

  return messages[event.type] || `📌 إجراء جديد على ${event.resourceLabel}`;
}
