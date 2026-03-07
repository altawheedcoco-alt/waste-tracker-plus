/**
 * نظام سلاسل الإجراءات (Action Chains)
 * يربط الأزرار → الوظائف → النتائج → التأثيرات المتبادلة داخل كل جهة
 */
import type { BindingType } from './bindingTypes';

/** نوع العقدة في السلسلة */
export type ChainNodeType = 'trigger' | 'function' | 'result' | 'effect';

/** عقدة واحدة في سلسلة الإجراءات */
export interface ActionChainNode {
  id: string;
  /** نوع العقدة */
  nodeType: ChainNodeType;
  /** اسم عربي */
  labelAr: string;
  /** اسم إنجليزي */
  labelEn: string;
  /** نوع الارتباط الوظيفي */
  bindingType: BindingType;
  /** أيقونة (اسم من lucide) */
  icon?: string;
  /** العقد المرتبطة مباشرة (downstream) */
  leadsTo?: string[];
  /** العقد التي تتأثر بشكل غير مباشر */
  affects?: string[];
  /** التبويب أو المسار المرتبط */
  linkedTab?: string;
  linkedPath?: string;
}

/** سلسلة إجراءات كاملة */
export interface ActionChain {
  id: string;
  labelAr: string;
  labelEn: string;
  /** وصف مختصر */
  descriptionAr: string;
  descriptionEn: string;
  nodes: ActionChainNode[];
}

/** خريطة سلاسل الإجراءات لجهة معينة */
export interface OrgActionChains {
  orgType: string;
  labelAr: string;
  labelEn: string;
  chains: ActionChain[];
}

/** ألوان وأيقونات أنواع العقد */
export const CHAIN_NODE_DISPLAY: Record<ChainNodeType, {
  labelAr: string;
  labelEn: string;
  colorClass: string;
  bgClass: string;
  emoji: string;
}> = {
  trigger: {
    labelAr: 'مشغّل',
    labelEn: 'Trigger',
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-500/10',
    emoji: '⚡',
  },
  function: {
    labelAr: 'وظيفة',
    labelEn: 'Function',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    emoji: '⚙️',
  },
  result: {
    labelAr: 'نتيجة',
    labelEn: 'Result',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    emoji: '✅',
  },
  effect: {
    labelAr: 'تأثير',
    labelEn: 'Effect',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/10',
    emoji: '🔄',
  },
};
