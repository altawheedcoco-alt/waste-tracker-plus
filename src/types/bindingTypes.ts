/**
 * نظام أنواع الارتباط الوظيفي (Binding Types)
 * يصنّف كل وظيفة/تبويب/عنصر حسب نوع ارتباطه في المنظومة
 * 
 * @example
 * - internal: إدارة الأسطول، بيانات السائقين
 * - partner: طلبات الجمع من المولدين، تسليم للمدور
 * - admin: الامتثال الرقابي، المخالفات
 * - hybrid: الشحنات (داخلي + خارجي + رقابي)
 */

/** أنواع الارتباط الأربعة */
export type BindingType = 'internal' | 'partner' | 'admin' | 'hybrid';

/** تفاصيل وصفية لكل نوع ارتباط */
export interface BindingMeta {
  type: BindingType;
  /** الأطراف المعنية - مفيد للعرض والتوثيق */
  involvedParties?: Array<'self' | 'generator' | 'recycler' | 'disposal' | 'admin' | 'driver' | 'regulator'>;
  /** هل يُنتج بيانات مرئية لمدير النظام */
  adminVisible?: boolean;
  /** هل يتطلب شريك مرتبط لتفعيله */
  requiresPartner?: boolean;
  /** وصف مختصر للسياق الترابطي */
  contextHint?: string;
}

/** خريطة الألوان والأيقونات لكل نوع ارتباط */
export const BINDING_DISPLAY: Record<BindingType, {
  labelAr: string;
  labelEn: string;
  colorClass: string;
  dotClass: string;
  bgClass: string;
  emoji: string;
}> = {
  internal: {
    labelAr: 'داخلي',
    labelEn: 'Internal',
    colorClass: 'text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-500/10',
    emoji: '🔒',
  },
  partner: {
    labelAr: 'شركاء',
    labelEn: 'Partners',
    colorClass: 'text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-500/10',
    emoji: '🤝',
  },
  admin: {
    labelAr: 'رقابي',
    labelEn: 'Regulatory',
    colorClass: 'text-purple-600 dark:text-purple-400',
    dotClass: 'bg-purple-500',
    bgClass: 'bg-purple-500/10',
    emoji: '👁️',
  },
  hybrid: {
    labelAr: 'متكامل',
    labelEn: 'Integrated',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-500/10',
    emoji: '🔗',
  },
};
