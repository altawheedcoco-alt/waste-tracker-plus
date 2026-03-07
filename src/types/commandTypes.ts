/**
 * Command Registry Types
 * سجل مركزي لكل أمر في النظام يحدد النطاق والصلاحية والارتباطات
 */
import type { BindingType } from './bindingTypes';
import type { EmployeePermission } from '@/hooks/useMyPermissions';

/** حالة تنفيذ الأمر */
export type CommandStatus = 'ready' | 'blocked' | 'executing' | 'completed' | 'failed';

/** نوع التأثير المتقاطع */
export type ImpactType = 
  | 'update_ledger'      // تحديث دفتر الحسابات
  | 'send_notification'  // إرسال إشعار
  | 'update_kpi'         // تحديث مؤشرات الأداء
  | 'log_audit'          // تسجيل في سجل التدقيق
  | 'update_inventory'   // تحديث المخزون
  | 'trigger_chain'      // تشغيل سلسلة أخرى
  | 'update_compliance'  // تحديث الامتثال
  | 'recalculate_esg'    // إعادة حساب ESG
  | 'custom';            // مخصص

/** تعريف تأثير متقاطع */
export interface CrossImpact {
  id: string;
  type: ImpactType;
  /** وصف عربي */
  labelAr: string;
  labelEn: string;
  /** الجدول المستهدف */
  targetTable?: string;
  /** المسار المرتبط */
  targetPath?: string;
  /** هل التنفيذ تلقائي أم يحتاج موافقة */
  autoExecute: boolean;
  /** أولوية التنفيذ (1 = الأعلى) */
  priority: number;
}

/** شرط التبعية */
export interface DependencyCondition {
  /** معرف الأمر المطلوب اكتماله أولاً */
  commandId: string;
  /** نوع التحقق */
  checkType: 'completed' | 'exists' | 'value_matches';
  /** القيمة المطلوبة (لـ value_matches) */
  expectedValue?: string;
  /** رسالة الحجب بالعربي */
  blockMessageAr: string;
  blockMessageEn: string;
  /** هل يسمح بالتجاوز مع تسجيل السبب */
  allowBypass: boolean;
}

/** تعريف أمر واحد في السجل */
export interface CommandDefinition {
  /** معرف فريد */
  id: string;
  /** اسم الأمر */
  labelAr: string;
  labelEn: string;
  /** وصف مختصر */
  descriptionAr?: string;
  descriptionEn?: string;
  /** أيقونة (من lucide) */
  icon: string;
  /** نوع الارتباط الوظيفي */
  bindingType: BindingType;

  // ── النطاق (Scope) ──
  /** نوع الجهة */
  orgTypes: string[];
  /** السلسلة المرتبطة */
  chainId: string;
  /** معرف العقدة في السلسلة */
  nodeId: string;
  /** المسار في التطبيق */
  path?: string;
  /** التبويب المرتبط */
  tab?: string;

  // ── الصلاحية (Permission) ──
  /** الصلاحيات المطلوبة */
  requiredPermissions: EmployeePermission[];
  /** هل يحتاج كل الصلاحيات أم واحدة تكفي */
  requireAllPermissions: boolean;

  // ── التبعية (Dependency) ──
  /** الأوامر المطلوب اكتمالها قبل التنفيذ */
  dependencies: DependencyCondition[];

  // ── الآثار (Impact) ──
  /** الآثار المتقاطعة التي تتأتج عن التنفيذ */
  impacts: CrossImpact[];

  // ── نوع المورد ──
  /** نوع المورد (شحنة، فاتورة، سائق...) */
  resourceType: string;
}

/** سجل أوامر جهة كاملة */
export interface OrgCommandRegistry {
  orgType: string;
  commands: CommandDefinition[];
}

/** نتيجة فحص التبعيات */
export interface DependencyCheckResult {
  canExecute: boolean;
  blockedBy: Array<{
    condition: DependencyCondition;
    currentStatus: CommandStatus;
  }>;
  bypassable: boolean;
}

/** سجل تنفيذ أمر */
export interface CommandExecutionRecord {
  commandId: string;
  resourceId: string;
  resourceType: string;
  executedBy: string;
  executedAt: string;
  status: CommandStatus;
  impacts: Array<{
    impactId: string;
    status: 'pending' | 'completed' | 'failed';
    executedAt?: string;
    error?: string;
  }>;
  bypassReason?: string;
  metadata?: Record<string, unknown>;
}
