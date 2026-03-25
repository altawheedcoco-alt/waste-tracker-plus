/**
 * شعارات منصة iRecycle — تُستخدم في الإشعارات والمستندات والتذييلات
 */
export const IRECYCLE_TAGLINES = [
  'الإنتاج عليك.. والدائرة المقفولة علينا. خليك iRecycle.',
  'إدارة مخلفات بمواصفات عالمية.. iRecycle سيستم مبيغلطش.',
  'إحنا مش بنلم مخلفات، إحنا بنقفل دايرة الإنتاج صح. iRecycle.',
  'من المصنع للمستقبل.. سكة واحدة مع iRecycle.',
] as const;

/** HTML tagline with logo for print templates */
export const IRECYCLE_LOGO_URL = '/irecycle-logo.webp';

export function getDailyTaglineHTML(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % IRECYCLE_TAGLINES.length;
  const tagline = IRECYCLE_TAGLINES[dayIndex];
  return tagline.replace('iRecycle', `<img src="${IRECYCLE_LOGO_URL}" alt="iRecycle" style="height:14px;vertical-align:middle;display:inline-block;margin:0 2px;border-radius:3px;" />`);
}

/**
 * يعيد شعار اليوم — يتغير يومياً بشكل دوري
 */
export function getDailyTagline(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % IRECYCLE_TAGLINES.length;
  return IRECYCLE_TAGLINES[dayIndex];
}

/**
 * يعيد شعار عشوائي
 */
export function getRandomTagline(): string {
  return IRECYCLE_TAGLINES[Math.floor(Math.random() * IRECYCLE_TAGLINES.length)];
}

/**
 * يُرفق شعار المنصة بنهاية رسالة الإشعار
 */
export function withTagline(message: string): string {
  return `${message}\n\n♻️ ${getDailyTagline()}`;
}

/**
 * Status labels بالعربي لحالات الشحنة
 */
export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: '⏳ قيد الانتظار',
  approved: '✅ تم الموافقة',
  registered: '📋 تم التسجيل',
  in_transit: '🚛 قيد النقل',
  delivered: '📦 تم التسليم',
  confirmed: '✔️ تم التأكيد',
  completed: '🏁 مكتملة',
  cancelled: '❌ ملغاة',
  rejected: '🚫 مرفوضة',
};
