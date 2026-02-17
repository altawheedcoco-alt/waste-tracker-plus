/**
 * أداة مركزية لإخفاء بيانات المدوّر عن المولّد
 * تُستخدم في جميع المكونات التي تعرض بيانات الشحنة (بطاقات، إقرارات، شهادات، طباعة)
 */

/**
 * يحذف بيانات المدوّر من كائن الشحنة إذا كانت الرؤية محظورة
 */
export function sanitizeShipmentForGenerator(
  shipment: Record<string, any>,
  canViewRecyclerInfo: boolean
): Record<string, any> {
  if (canViewRecyclerInfo) return shipment;

  const sanitized = { ...shipment };

  // إخفاء بيانات المدوّر
  const keysToNull = [
    'recycler', 'recycler_id', 'recycler_notes',
    'recycler_approval_status', 'recycler_approval_at',
    'recycler_rejection_reason', 'recycler_auto_approve_deadline',
    'recycler_receipt_qr', 'manual_recycler_name',
    'delivery_location', 'delivery_lat', 'delivery_lng',
  ];
  keysToNull.forEach(k => { sanitized[k] = null; });
  sanitized['delivery_address'] = 'محجوب';

  return sanitized;
}

/**
 * يتحقق مما إذا كان يجب إخفاء قسم المدوّر في المستندات المطبوعة
 */
export function shouldHideRecyclerSection(
  canViewRecyclerInfo: boolean,
  isOwner: boolean
): boolean {
  return !canViewRecyclerInfo && !isOwner;
}
