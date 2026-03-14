import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, ShieldCheck, ShieldAlert, Search, User, Bot, Building2,
  ChevronDown, ChevronUp, Crown, Lock, Unlock, CheckCircle2, XCircle,
  Copy, LayoutDashboard, UserCircle, Loader2, Save, RotateCcw, Filter, Eye,
} from 'lucide-react';
import { useOrgStructure, type Position } from '@/hooks/useOrgStructure';
import { usePositionPermissions } from '@/hooks/useOrgMembers';
import { useOrgMembers, type OrgMember } from '@/hooks/useOrgMembers';
import { MEMBER_ROLE_LABELS, type MemberRole, ALL_MEMBER_PERMISSIONS, PERMISSION_LABELS, PERMISSION_CATEGORIES } from '@/types/memberRoles';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// ===== تصنيف مستوى الأهمية =====
type PermTier = 'essential' | 'important' | 'optional';

const PERM_TIER_META: Record<PermTier, { label: string; icon: string; color: string; bgClass: string; borderClass: string }> = {
  essential: { label: 'أساسية', icon: '🔴', color: 'text-red-600', bgClass: 'bg-red-500/10', borderClass: 'border-red-300' },
  important: { label: 'مهمة', icon: '🟡', color: 'text-amber-600', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-300' },
  optional: { label: 'اختيارية', icon: '🟢', color: 'text-green-600', bgClass: 'bg-green-500/10', borderClass: 'border-green-300' },
};

interface PermDef {
  key: string;
  label: string;
  tier: PermTier;
  description?: string;
}

// ===== صلاحيات المناصب التفصيلية =====
const permissionGroups: { title: string; icon: string; color: string; bg: string; permissions: PermDef[] }[] = [
  {
    title: 'الشحنات',
    icon: '📦',
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    permissions: [
      { key: 'can_create_shipments', label: 'إنشاء شحنات', tier: 'essential', description: 'إنشاء طلبات شحن جديدة' },
      { key: 'can_view_shipments', label: 'عرض الشحنات', tier: 'essential', description: 'الاطلاع على قائمة الشحنات' },
      { key: 'can_edit_shipments', label: 'تعديل الشحنات', tier: 'important', description: 'تعديل بيانات شحنة قائمة' },
      { key: 'can_delete_shipments', label: 'حذف الشحنات', tier: 'optional', description: 'حذف شحنات نهائياً' },
      { key: 'can_approve_shipments', label: 'اعتماد الشحنات', tier: 'essential', description: 'الموافقة على الشحنات' },
      { key: 'can_reject_shipments', label: 'رفض الشحنات', tier: 'essential', description: 'رفض شحنات مع ذكر السبب' },
      { key: 'can_cancel_shipments', label: 'إلغاء الشحنات', tier: 'important', description: 'إلغاء شحنة قائمة' },
      { key: 'can_reassign_shipments', label: 'إعادة تعيين الشحنات', tier: 'important', description: 'نقل الشحنة لسائق/مركبة أخرى' },
      { key: 'can_change_shipment_status', label: 'تغيير حالة الشحنة', tier: 'important', description: 'تحديث حالة الشحنة يدوياً' },
      { key: 'can_view_shipment_history', label: 'عرض سجل الشحنة', tier: 'optional', description: 'الاطلاع على تاريخ التغييرات' },
      { key: 'can_add_shipment_notes', label: 'إضافة ملاحظات', tier: 'optional', description: 'كتابة ملاحظات على الشحنة' },
      { key: 'can_upload_shipment_attachments', label: 'رفع مرفقات', tier: 'optional', description: 'رفع صور ومستندات للشحنة' },
      { key: 'can_print_shipment_manifest', label: 'طباعة البوليصة', tier: 'important', description: 'طباعة بوليصة الشحن' },
      { key: 'can_view_shipment_tracking', label: 'تتبع الشحنات', tier: 'essential', description: 'تتبع الشحنات على الخريطة' },
      { key: 'can_manage_recurring', label: 'إدارة الشحنات المتكررة', tier: 'important', description: 'إنشاء وتعديل جداول التكرار' },
      { key: 'can_bulk_operations', label: 'عمليات جماعية', tier: 'optional', description: 'تنفيذ عمليات على شحنات متعددة' },
      { key: 'can_manage_collection_requests', label: 'إدارة طلبات الجمع', tier: 'important', description: 'إدارة طلبات جمع النفايات' },
      { key: 'can_create_manual_shipments', label: 'شحنات يدوية', tier: 'important', description: 'إنشاء شحنات يدوية خارج النظام' },
      { key: 'can_view_manual_drafts', label: 'عرض المسودات', tier: 'optional', description: 'الاطلاع على مسودات الشحنات اليدوية' },
      { key: 'can_manage_routes', label: 'إدارة المسارات', tier: 'optional', description: 'تحديد وتعديل مسارات الشحنات' },
    ],
  },
  {
    title: 'الإيداعات',
    icon: '🏦',
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10',
    permissions: [
      { key: 'can_create_deposits', label: 'إنشاء إيداعات', tier: 'essential', description: 'تسجيل إيداعات مالية جديدة' },
      { key: 'can_view_deposits', label: 'عرض الإيداعات', tier: 'essential', description: 'الاطلاع على قائمة الإيداعات' },
      { key: 'can_edit_deposits', label: 'تعديل الإيداعات', tier: 'important', description: 'تعديل بيانات إيداع' },
      { key: 'can_delete_deposits', label: 'حذف الإيداعات', tier: 'optional', description: 'حذف إيداع نهائياً' },
      { key: 'can_approve_deposits', label: 'اعتماد الإيداعات', tier: 'essential', description: 'الموافقة على الإيداعات' },
      { key: 'can_reject_deposits', label: 'رفض الإيداعات', tier: 'important', description: 'رفض إيداع مع السبب' },
      { key: 'can_verify_deposits', label: 'التحقق من الإيداعات', tier: 'important', description: 'التحقق المالي من الإيداعات' },
    ],
  },
  {
    title: 'المالية والمحاسبة',
    icon: '💰',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    permissions: [
      { key: 'can_view_financials', label: 'عرض البيانات المالية', tier: 'essential', description: 'الاطلاع على الوضع المالي' },
      { key: 'can_view_account_details', label: 'تفاصيل الحسابات', tier: 'essential', description: 'عرض تفاصيل حسابات العملاء' },
      { key: 'can_create_invoices', label: 'إنشاء فواتير', tier: 'important', description: 'إصدار فواتير جديدة' },
      { key: 'can_edit_invoices', label: 'تعديل الفواتير', tier: 'important', description: 'تعديل فواتير قائمة' },
      { key: 'can_delete_invoices', label: 'حذف الفواتير', tier: 'optional', description: 'حذف فاتورة' },
      { key: 'can_approve_payments', label: 'اعتماد المدفوعات', tier: 'essential', description: 'الموافقة على صرف مبالغ' },
      { key: 'can_reject_payments', label: 'رفض المدفوعات', tier: 'essential', description: 'رفض طلبات الصرف' },
      { key: 'can_view_ledger', label: 'عرض دفتر الأستاذ', tier: 'important', description: 'الاطلاع على القيود المحاسبية' },
      { key: 'can_create_ledger_entries', label: 'إنشاء قيود محاسبية', tier: 'important', description: 'إضافة قيود يومية' },
      { key: 'can_verify_ledger', label: 'تدقيق القيود', tier: 'essential', description: 'التحقق من القيود المحاسبية' },
      { key: 'can_view_periods', label: 'عرض الفترات المحاسبية', tier: 'optional', description: 'عرض فترات الحسابات' },
      { key: 'can_close_periods', label: 'إغلاق الفترات', tier: 'essential', description: 'إغلاق فترة محاسبية' },
      { key: 'can_manage_cogs', label: 'إدارة تكلفة البضاعة', tier: 'optional', description: 'حساب وإدارة COGS' },
      { key: 'can_view_revenue_expenses', label: 'الإيرادات والمصروفات', tier: 'important', description: 'عرض تقرير الإيرادات والمصروفات' },
      { key: 'can_financial_reports', label: 'التقارير المالية', tier: 'important', description: 'إنشاء تقارير مالية' },
      { key: 'can_financial_comparisons', label: 'المقارنات المالية', tier: 'optional', description: 'مقارنة البيانات المالية' },
      { key: 'can_manage_purchasing', label: 'إدارة المشتريات', tier: 'important', description: 'إدارة طلبات الشراء' },
      { key: 'can_manage_sales', label: 'إدارة المبيعات', tier: 'important', description: 'إدارة عمليات البيع' },
      { key: 'can_manage_wallet', label: 'المحفظة الرقمية', tier: 'optional', description: 'إدارة المحفظة الإلكترونية' },
      { key: 'can_export_financial', label: 'تصدير البيانات المالية', tier: 'optional', description: 'تصدير تقارير مالية' },
    ],
  },
  {
    title: 'السائقين والأسطول',
    icon: '🚛',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    permissions: [
      { key: 'can_view_drivers', label: 'عرض السائقين', tier: 'essential', description: 'الاطلاع على قائمة السائقين' },
      { key: 'can_add_drivers', label: 'إضافة سائقين', tier: 'important', description: 'تسجيل سائقين جدد' },
      { key: 'can_edit_drivers', label: 'تعديل بيانات السائقين', tier: 'important', description: 'تحديث معلومات السائق' },
      { key: 'can_deactivate_drivers', label: 'تعطيل السائقين', tier: 'essential', description: 'إيقاف حسابات السائقين' },
      { key: 'can_assign_drivers', label: 'تعيين السائقين', tier: 'essential', description: 'تخصيص سائق لشحنة' },
      { key: 'can_unassign_drivers', label: 'إلغاء التعيين', tier: 'important', description: 'إزالة سائق من الشحنة' },
      { key: 'can_track_drivers', label: 'تتبع السائقين', tier: 'important', description: 'تتبع مباشر للسائقين' },
      { key: 'can_track_vehicles', label: 'تتبع المركبات', tier: 'important', description: 'تتبع مواقع المركبات' },
      { key: 'can_manage_vehicles', label: 'إدارة المركبات', tier: 'important', description: 'إضافة وتعديل المركبات' },
      { key: 'can_manage_containers', label: 'إدارة الحاويات', tier: 'optional', description: 'إدارة الحاويات والصناديق' },
      { key: 'can_reassign_vehicles', label: 'إعادة تعيين المركبات', tier: 'optional', description: 'نقل مركبة بين السائقين' },
      { key: 'can_manage_permits', label: 'تصاريح السائقين', tier: 'essential', description: 'إدارة تصاريح ورخص السائقين' },
      { key: 'can_manage_academy', label: 'أكاديمية السائقين', tier: 'optional', description: 'إدارة تدريب السائقين' },
      { key: 'can_manage_rewards', label: 'مكافآت السائقين', tier: 'optional', description: 'منح وإدارة المكافآت' },
      { key: 'can_view_driver_perf', label: 'أداء السائقين', tier: 'important', description: 'عرض تقارير أداء السائقين' },
      { key: 'can_manage_maintenance', label: 'الصيانة الوقائية', tier: 'important', description: 'جدولة وإدارة الصيانة' },
      { key: 'can_manage_shifts', label: 'جدولة الورديات', tier: 'optional', description: 'إنشاء جداول ورديات السائقين' },
      { key: 'can_manage_fuel', label: 'سجلات الوقود', tier: 'optional', description: 'تسجيل وإدارة استهلاك الوقود' },
    ],
  },
  {
    title: 'الشركاء والجهات',
    icon: '🤝',
    color: 'text-teal-600',
    bg: 'bg-teal-500/10',
    permissions: [
      { key: 'can_view_partners', label: 'عرض الشركاء', tier: 'essential', description: 'الاطلاع على قائمة الشركاء' },
      { key: 'can_add_partners', label: 'إضافة شركاء', tier: 'important', description: 'إضافة جهات شريكة جديدة' },
      { key: 'can_edit_partners', label: 'تعديل بيانات الشركاء', tier: 'important', description: 'تحديث معلومات الشركاء' },
      { key: 'can_delete_partners', label: 'حذف شركاء', tier: 'optional', description: 'حذف جهة شريكة' },
      { key: 'can_view_partner_data', label: 'عرض بيانات الشركاء', tier: 'essential', description: 'الاطلاع على تفاصيل الشركاء' },
      { key: 'can_create_external', label: 'إنشاء جهات خارجية', tier: 'important', description: 'إضافة جهات خارجية' },
      { key: 'can_approve_partnerships', label: 'اعتماد الشراكات', tier: 'essential', description: 'الموافقة على طلبات الشراكة' },
      { key: 'can_view_partner_accounts', label: 'حسابات الشركاء', tier: 'important', description: 'عرض الحسابات المالية للشركاء' },
      { key: 'can_view_partner_timeline', label: 'أخبار الشركاء', tier: 'optional', description: 'متابعة آخر أخبار الشركاء' },
      { key: 'can_manage_partner_contracts', label: 'عقود الشركاء', tier: 'important', description: 'إدارة عقود الشراكة' },
    ],
  },
  {
    title: 'الأعضاء والموظفين',
    icon: '👥',
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    permissions: [
      { key: 'can_view_members', label: 'عرض الأعضاء', tier: 'essential', description: 'الاطلاع على قائمة الأعضاء' },
      { key: 'can_add_members', label: 'إضافة أعضاء', tier: 'essential', description: 'دعوة أعضاء جدد للجهة' },
      { key: 'can_edit_members', label: 'تعديل بيانات الأعضاء', tier: 'important', description: 'تحديث معلومات الأعضاء' },
      { key: 'can_remove_members', label: 'إزالة أعضاء', tier: 'essential', description: 'إنهاء عضوية أعضاء' },
      { key: 'can_manage_permissions', label: 'إدارة الصلاحيات', tier: 'essential', description: 'تعديل صلاحيات الأعضاء' },
      { key: 'can_manage_roles', label: 'إدارة الأدوار', tier: 'essential', description: 'تغيير أدوار الأعضاء' },
      { key: 'can_view_activity', label: 'سجل النشاط', tier: 'important', description: 'عرض سجل نشاط الأعضاء' },
      { key: 'can_manage_employees', label: 'إدارة الموظفين', tier: 'important', description: 'إدارة حسابات الموظفين' },
      { key: 'can_manage_credentials', label: 'بيانات الدخول', tier: 'essential', description: 'إدارة كلمات مرور الفريق' },
      { key: 'can_invite_members', label: 'دعوة أعضاء', tier: 'important', description: 'إرسال دعوات انضمام' },
      { key: 'can_approve_requests', label: 'اعتماد طلبات الانضمام', tier: 'important', description: 'الموافقة على طلبات العضوية' },
    ],
  },
  {
    title: 'الإعدادات والنظام',
    icon: '⚙️',
    color: 'text-slate-600',
    bg: 'bg-slate-500/10',
    permissions: [
      { key: 'can_view_settings', label: 'عرض الإعدادات', tier: 'essential', description: 'الاطلاع على إعدادات الجهة' },
      { key: 'can_manage_settings', label: 'تعديل الإعدادات', tier: 'essential', description: 'تعديل إعدادات النظام' },
      { key: 'can_manage_org_profile', label: 'ملف المنظمة', tier: 'important', description: 'تعديل بيانات المنظمة' },
      { key: 'can_manage_auto_actions', label: 'الإجراءات التلقائية', tier: 'important', description: 'ضبط القواعد التلقائية' },
      { key: 'can_manage_subscription', label: 'إدارة الاشتراك', tier: 'essential', description: 'إدارة خطة الاشتراك' },
      { key: 'can_manage_api_keys', label: 'مفاتيح API', tier: 'optional', description: 'إدارة مفاتيح الوصول البرمجي' },
      { key: 'can_manage_notifications_settings', label: 'إعدادات الإشعارات', tier: 'optional', description: 'ضبط إعدادات الإشعارات' },
      { key: 'can_manage_branding', label: 'الهوية البصرية', tier: 'optional', description: 'تخصيص العلامة التجارية' },
      { key: 'can_manage_templates', label: 'إدارة القوالب', tier: 'optional', description: 'تعديل قوالب المستندات' },
      { key: 'can_manage_integrations', label: 'التكاملات', tier: 'optional', description: 'إدارة التكاملات الخارجية' },
      { key: 'can_view_logs', label: 'سجل النشاطات', tier: 'important', description: 'عرض سجل العمليات' },
      { key: 'can_manage_security', label: 'إعدادات الأمان', tier: 'essential', description: 'إدارة إعدادات الأمان' },
    ],
  },
  {
    title: 'التقارير والتحليلات',
    icon: '📊',
    color: 'text-indigo-600',
    bg: 'bg-indigo-500/10',
    permissions: [
      { key: 'can_view_reports', label: 'عرض التقارير', tier: 'essential', description: 'الاطلاع على التقارير' },
      { key: 'can_create_reports', label: 'إنشاء تقارير', tier: 'important', description: 'إنشاء تقارير جديدة' },
      { key: 'can_export_reports', label: 'تصدير التقارير', tier: 'important', description: 'تصدير التقارير بصيغ مختلفة' },
      { key: 'can_view_shipment_reports', label: 'تقارير الشحنات', tier: 'important', description: 'عرض تقارير الشحنات' },
      { key: 'can_view_aggregate', label: 'التقرير التجميعي', tier: 'optional', description: 'عرض التقرير التجميعي' },
      { key: 'can_view_waste_register', label: 'سجل غير خطرة', tier: 'important', description: 'سجل النفايات غير الخطرة' },
      { key: 'can_view_hazardous', label: 'سجل خطرة', tier: 'important', description: 'سجل النفايات الخطرة' },
      { key: 'can_view_carbon', label: 'البصمة الكربونية', tier: 'optional', description: 'عرض تقارير البصمة الكربونية' },
      { key: 'can_view_esg', label: 'تقارير ESG', tier: 'optional', description: 'عرض تقارير الحوكمة البيئية' },
      { key: 'can_view_ohs', label: 'تقارير السلامة', tier: 'optional', description: 'عرض تقارير السلامة المهنية' },
      { key: 'can_view_waste_analysis', label: 'تحليل النفايات', tier: 'optional', description: 'التحليل التفصيلي للنفايات' },
      { key: 'can_view_waste_flow', label: 'تدفق النفايات', tier: 'optional', description: 'خريطة تدفق النفايات' },
      { key: 'can_view_sustainability', label: 'الاستدامة البيئية', tier: 'optional', description: 'تقارير الاستدامة' },
      { key: 'can_export_data', label: 'تصدير البيانات', tier: 'important', description: 'تصدير بيانات النظام' },
      { key: 'can_view_analytics', label: 'التحليلات التفصيلية', tier: 'optional', description: 'عرض تحليلات متقدمة' },
      { key: 'can_custom_reports', label: 'تقارير مخصصة', tier: 'optional', description: 'إنشاء تقارير مخصصة' },
    ],
  },
  {
    title: 'المستندات والشهادات',
    icon: '📄',
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    permissions: [
      { key: 'can_view_documents', label: 'عرض المستندات', tier: 'essential', description: 'الاطلاع على المستندات' },
      { key: 'can_upload_documents', label: 'رفع المستندات', tier: 'important', description: 'رفع ملفات ومستندات' },
      { key: 'can_delete_documents', label: 'حذف المستندات', tier: 'optional', description: 'حذف مستندات' },
      { key: 'can_sign_documents', label: 'توقيع المستندات', tier: 'essential', description: 'التوقيع الإلكتروني' },
      { key: 'can_issue_certificates', label: 'إصدار شهادات', tier: 'important', description: 'إصدار شهادات رسمية' },
      { key: 'can_view_certificates', label: 'عرض الشهادات', tier: 'essential', description: 'الاطلاع على الشهادات' },
      { key: 'can_revoke_certificates', label: 'إلغاء شهادات', tier: 'optional', description: 'إلغاء شهادات صادرة' },
      { key: 'can_manage_contracts', label: 'إدارة العقود', tier: 'important', description: 'إنشاء وتعديل العقود' },
      { key: 'can_view_contracts', label: 'عرض العقود', tier: 'essential', description: 'الاطلاع على العقود' },
      { key: 'can_sign_contracts', label: 'توقيع العقود', tier: 'essential', description: 'التوقيع على العقود' },
      { key: 'can_manage_doc_templates', label: 'قوالب المستندات', tier: 'optional', description: 'إدارة قوالب المستندات' },
      { key: 'can_manage_attestation', label: 'الإفادة الرقمية', tier: 'important', description: 'إدارة الإفادة الرقمية' },
      { key: 'can_print_documents', label: 'طباعة المستندات', tier: 'optional', description: 'طباعة المستندات' },
      { key: 'can_share_documents', label: 'مشاركة المستندات', tier: 'optional', description: 'مشاركة المستندات مع أطراف' },
    ],
  },
  {
    title: 'الهيكل التنظيمي',
    icon: '🏛️',
    color: 'text-violet-600',
    bg: 'bg-violet-500/10',
    permissions: [
      { key: 'can_view_org_structure', label: 'عرض الهيكل', tier: 'essential', description: 'عرض الهيكل التنظيمي' },
      { key: 'can_manage_org_structure', label: 'إدارة الهيكل', tier: 'essential', description: 'تعديل الهيكل التنظيمي' },
      { key: 'can_manage_departments', label: 'إدارة الأقسام', tier: 'important', description: 'إنشاء وتعديل الأقسام' },
      { key: 'can_manage_positions', label: 'إدارة المناصب', tier: 'important', description: 'إنشاء وتعديل المناصب' },
      { key: 'can_assign_holders', label: 'تعيين شاغلي المناصب', tier: 'essential', description: 'تعيين موظفين في مناصب' },
    ],
  },
  {
    title: 'الموارد البشرية',
    icon: '🏢',
    color: 'text-pink-600',
    bg: 'bg-pink-500/10',
    permissions: [
      { key: 'can_manage_hr', label: 'إدارة الموارد البشرية', tier: 'essential', description: 'إدارة شاملة للـ HR' },
      { key: 'can_view_hr', label: 'عرض الموارد البشرية', tier: 'essential', description: 'الاطلاع على بيانات HR' },
      { key: 'can_manage_payroll', label: 'إدارة الرواتب', tier: 'essential', description: 'إعداد وصرف الرواتب' },
      { key: 'can_view_payroll', label: 'عرض الرواتب', tier: 'important', description: 'الاطلاع على كشوف الرواتب' },
      { key: 'can_manage_perf_reviews', label: 'إدارة تقييم الأداء', tier: 'important', description: 'إنشاء وإدارة التقييمات' },
      { key: 'can_view_perf_reviews', label: 'عرض تقييم الأداء', tier: 'optional', description: 'الاطلاع على التقييمات' },
      { key: 'can_manage_hr_shifts', label: 'إدارة الورديات', tier: 'important', description: 'جدولة ورديات الموظفين' },
      { key: 'can_view_hr_shifts', label: 'عرض الورديات', tier: 'optional', description: 'الاطلاع على جدول الورديات' },
      { key: 'can_manage_eos', label: 'نهاية الخدمة', tier: 'essential', description: 'إدارة مستحقات نهاية الخدمة' },
      { key: 'can_manage_org_chart', label: 'الهيكل التنظيمي HR', tier: 'optional', description: 'إدارة هيكل HR' },
    ],
  },
  {
    title: 'المخزون',
    icon: '📦',
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
    permissions: [
      { key: 'can_view_inventory', label: 'عرض المخزون', tier: 'essential', description: 'الاطلاع على المخزون' },
      { key: 'can_manage_inventory', label: 'إدارة المخزون', tier: 'essential', description: 'إدارة شاملة للمخزون' },
      { key: 'can_add_items', label: 'إضافة أصناف', tier: 'important', description: 'إضافة أصناف جديدة' },
      { key: 'can_edit_items', label: 'تعديل الأصناف', tier: 'important', description: 'تعديل بيانات الأصناف' },
      { key: 'can_delete_items', label: 'حذف أصناف', tier: 'optional', description: 'حذف أصناف من المخزون' },
      { key: 'can_transfer_inventory', label: 'نقل المخزون', tier: 'important', description: 'نقل بين المستودعات' },
    ],
  },
  {
    title: 'الدعم والتواصل',
    icon: '🎧',
    color: 'text-sky-600',
    bg: 'bg-sky-500/10',
    permissions: [
      { key: 'can_view_tickets', label: 'عرض تذاكر الدعم', tier: 'essential', description: 'الاطلاع على التذاكر' },
      { key: 'can_create_tickets', label: 'إنشاء تذاكر', tier: 'essential', description: 'فتح تذاكر دعم فني' },
      { key: 'can_manage_tickets', label: 'إدارة التذاكر', tier: 'important', description: 'إدارة تذاكر الدعم' },
      { key: 'can_view_notifications', label: 'عرض الإشعارات', tier: 'essential', description: 'الاطلاع على الإشعارات' },
      { key: 'can_manage_notifications', label: 'إدارة الإشعارات', tier: 'optional', description: 'إدارة إعدادات الإشعارات' },
      { key: 'can_send_bulk_notifications', label: 'إشعارات جماعية', tier: 'optional', description: 'إرسال إشعارات جماعية' },
    ],
  },
  {
    title: 'الذكاء الاصطناعي',
    icon: '🤖',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-500/10',
    permissions: [
      { key: 'can_manage_ai_config', label: 'إعدادات AI', tier: 'essential', description: 'ضبط إعدادات الذكاء الاصطناعي' },
      { key: 'can_view_ai_analytics', label: 'تحليلات AI', tier: 'important', description: 'عرض تقارير AI' },
      { key: 'can_manage_ai_agent', label: 'وكيل AI', tier: 'important', description: 'إدارة وكيل الذكاء الاصطناعي' },
      { key: 'can_manage_ai_knowledge', label: 'قاعدة المعرفة', tier: 'optional', description: 'إدارة قاعدة معرفة AI' },
      { key: 'can_view_ai_conversations', label: 'محادثات AI', tier: 'optional', description: 'عرض محادثات AI' },
    ],
  },
  {
    title: 'الإعلانات',
    icon: '📢',
    color: 'text-yellow-600',
    bg: 'bg-yellow-500/10',
    permissions: [
      { key: 'can_create_ads', label: 'إنشاء إعلانات', tier: 'important', description: 'إنشاء إعلانات جديدة' },
      { key: 'can_manage_ads', label: 'إدارة الإعلانات', tier: 'important', description: 'إدارة الإعلانات القائمة' },
      { key: 'can_view_ad_analytics', label: 'تحليلات الإعلانات', tier: 'optional', description: 'عرض أداء الإعلانات' },
    ],
  },
  {
    title: 'متقدم',
    icon: '⚡',
    color: 'text-gray-600',
    bg: 'bg-gray-500/10',
    permissions: [
      { key: 'can_manage_insurance', label: 'إدارة التأمين', tier: 'optional', description: 'إدارة وثائق التأمين' },
      { key: 'can_view_insurance', label: 'عرض التأمين', tier: 'optional', description: 'الاطلاع على التأمين' },
      { key: 'can_manage_futures', label: 'العقود الآجلة', tier: 'optional', description: 'إدارة العقود الآجلة' },
      { key: 'can_view_system_status', label: 'حالة النظام', tier: 'optional', description: 'مراقبة حالة النظام' },
      { key: 'can_manage_waste_types', label: 'أنواع النفايات', tier: 'important', description: 'إدارة تصنيفات النفايات' },
      { key: 'can_manage_guilloche', label: 'أنماط الجيلوش', tier: 'optional', description: 'تخصيص أنماط الأمان' },
    ],
  },
];

const allPermKeys = permissionGroups.flatMap(g => g.permissions.map(p => p.key));

// فلتر حسب التصنيف
type TierFilter = 'all' | PermTier;

// ===== تصنيف صلاحيات الأعضاء (organization_members.granted_permissions) =====
const MEMBER_PERM_TIERS: Record<string, PermTier> = {};
// Auto-populate from ALL_MEMBER_PERMISSIONS using PERMISSION_LABELS categories
ALL_MEMBER_PERMISSIONS.forEach(perm => {
  const cat = PERMISSION_LABELS[perm]?.category;
  // Essential: core view/create/approve permissions
  if (perm.startsWith('view_') || perm.startsWith('create_') || perm.startsWith('approve_') || perm.startsWith('manage_members') || perm.startsWith('manage_settings') || perm === 'sign_documents' || perm === 'sign_contracts') {
    MEMBER_PERM_TIERS[perm] = 'essential';
  } else if (perm.startsWith('manage_') || perm.startsWith('edit_') || perm.startsWith('assign_') || perm.startsWith('reject_') || perm.startsWith('issue_') || perm.startsWith('cancel_')) {
    MEMBER_PERM_TIERS[perm] = 'important';
  } else {
    MEMBER_PERM_TIERS[perm] = 'optional';
  }
});

// ===== Individual Position Permission Editor =====
function PositionPermEditor({ position }: { position: Position }) {
  const { permissions, isLoading, updatePermissions } = usePositionPermissions(position.id);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const initPerms = () => {
    const perms: Record<string, boolean> = {};
    allPermKeys.forEach(key => {
      perms[key] = (permissions as any)?.[key] || false;
    });
    setLocalPerms(perms);
    setHasChanges(false);
  };

  const [initialized, setInitialized] = useState(false);
  if (permissions && !initialized) {
    initPerms();
    setInitialized(true);
  }

  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [groupSearch, setGroupSearch] = useState('');

  const togglePerm = (key: string) => {
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const toggleGroup = (group: typeof permissionGroups[0], value: boolean) => {
    const updates: Record<string, boolean> = {};
    group.permissions.forEach(p => { updates[p.key] = value; });
    setLocalPerms(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const enabledCount = Object.values(localPerms).filter(Boolean).length;
  const totalCount = allPermKeys.length;

  const handleSave = () => {
    updatePermissions.mutate(localPerms as any, {
      onSuccess: () => {
        setHasChanges(false);
        toast.success(`تم حفظ صلاحيات "${position.title_ar}"`);
      },
    });
  };

  const grantAll = () => {
    const all: Record<string, boolean> = {};
    allPermKeys.forEach(k => { all[k] = true; });
    setLocalPerms(all);
    setHasChanges(true);
  };

  const revokeAll = () => {
    const none: Record<string, boolean> = {};
    allPermKeys.forEach(k => { none[k] = false; });
    setLocalPerms(none);
    setHasChanges(true);
  };

  const grantTier = (tier: PermTier) => {
    const updates: Record<string, boolean> = {};
    permissionGroups.forEach(g => g.permissions.forEach(p => {
      if (p.tier === tier) updates[p.key] = true;
    }));
    setLocalPerms(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const isAI = position.operator_type === 'ai';
  const dashboardLabel = position.dashboard_mode === 'management' ? 'إدارة' : 'عضو';

  // Filter groups by search and tier
  const filteredGroups = useMemo(() => {
    return permissionGroups.map(group => {
      let perms = group.permissions;
      if (tierFilter !== 'all') perms = perms.filter(p => p.tier === tierFilter);
      if (groupSearch) {
        const q = groupSearch.toLowerCase();
        perms = perms.filter(p => p.label.includes(q) || p.description?.includes(q));
      }
      return { ...group, permissions: perms };
    }).filter(g => g.permissions.length > 0);
  }, [tierFilter, groupSearch]);

  return (
    <Card className={`transition-all ${expanded ? 'ring-1 ring-primary/30 shadow-md' : 'hover:shadow-sm'}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <div className="flex gap-1.5 items-center flex-wrap">
            <Badge variant={position.dashboard_mode === 'management' ? 'default' : 'secondary'} className="text-[10px]">
              {position.dashboard_mode === 'management' ? <LayoutDashboard className="w-3 h-3 ml-0.5" /> : <UserCircle className="w-3 h-3 ml-0.5" />}
              {dashboardLabel}
            </Badge>
            {isAI && <Badge className="bg-primary/20 text-primary text-[10px]">🤖 AI</Badge>}
            <Badge variant="outline" className={`text-[10px] ${enabledCount > 0 ? 'text-green-600 border-green-300' : 'text-muted-foreground'}`}>
              {enabledCount}/{totalCount} صلاحية
            </Badge>
            {hasChanges && <Badge className="bg-amber-500/20 text-amber-600 text-[10px] animate-pulse">تغييرات غير محفوظة</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{position.title_ar}</p>
            <p className="text-[10px] text-muted-foreground">{position.holder_name || 'شاغر'}</p>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAI ? 'bg-primary/10' : 'bg-muted'}`}>
            {isAI ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="border-t pt-4 pb-3 space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : (
                <>
                  {/* Quick actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={grantAll} className="text-xs h-7">
                      <Unlock className="w-3 h-3 ml-1" /> منح الكل
                    </Button>
                    <Button size="sm" variant="outline" onClick={revokeAll} className="text-xs h-7">
                      <Lock className="w-3 h-3 ml-1" /> سحب الكل
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => grantTier('essential')} className="text-xs h-7 text-red-600 border-red-200">
                      🔴 منح الأساسية
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => grantTier('important')} className="text-xs h-7 text-amber-600 border-amber-200">
                      🟡 منح المهمة
                    </Button>
                    {hasChanges && (
                      <>
                        <Button size="sm" variant="outline" onClick={initPerms} className="text-xs h-7">
                          <RotateCcw className="w-3 h-3 ml-1" /> تراجع
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={updatePermissions.isPending} className="text-xs h-7">
                          {updatePermissions.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                          حفظ
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Search + Tier filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[140px]">
                      <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="بحث في الصلاحيات..."
                        value={groupSearch}
                        onChange={e => setGroupSearch(e.target.value)}
                        className="pr-7 h-7 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant={tierFilter === 'all' ? 'default' : 'outline'} onClick={() => setTierFilter('all')} className="text-[10px] h-6 px-2">
                        الكل
                      </Button>
                      {(['essential', 'important', 'optional'] as PermTier[]).map(t => (
                        <Button
                          key={t}
                          size="sm"
                          variant={tierFilter === t ? 'default' : 'outline'}
                          onClick={() => setTierFilter(t)}
                          className="text-[10px] h-6 px-2"
                        >
                          {PERM_TIER_META[t].icon} {PERM_TIER_META[t].label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Permission groups */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {filteredGroups.map(group => {
                      const allOn = group.permissions.every(p => localPerms[p.key]);
                      const groupCount = group.permissions.filter(p => localPerms[p.key]).length;

                      return (
                        <div key={group.title} className={`rounded-lg border p-3 ${group.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => toggleGroup(group, !allOn)}
                              >
                                {allOn ? <XCircle className="w-3 h-3 ml-1" /> : <CheckCircle2 className="w-3 h-3 ml-1" />}
                                {allOn ? 'إلغاء' : 'تحديد الكل'}
                              </Button>
                              <Badge variant="outline" className="text-[10px]">{groupCount}/{group.permissions.length}</Badge>
                            </div>
                            <h4 className={`font-semibold text-sm flex items-center gap-1.5 ${group.color}`}>
                              <span>{group.icon}</span>
                              {group.title}
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {group.permissions.map(perm => {
                              const tierMeta = PERM_TIER_META[perm.tier];
                              return (
                                <div
                                  key={perm.key}
                                  className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer border ${
                                    localPerms[perm.key]
                                      ? `bg-background/80 shadow-sm ${tierMeta.borderClass}`
                                      : 'border-transparent hover:bg-background/50'
                                  }`}
                                  onClick={() => togglePerm(perm.key)}
                                  title={perm.description}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Switch
                                      checked={localPerms[perm.key] || false}
                                      onCheckedChange={() => togglePerm(perm.key)}
                                      className="scale-75"
                                    />
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tierMeta.bgClass} ${tierMeta.color}`}>
                                      {tierMeta.label}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-medium block">{perm.label}</span>
                                    {perm.description && (
                                      <span className="text-[9px] text-muted-foreground block">{perm.description}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ===== Member Permission Editor =====
function MemberPermEditor({ member, onUpdate }: { member: OrgMember; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [localPerms, setLocalPerms] = useState<string[]>(member.granted_permissions || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<'management' | 'workspace'>('workspace');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [permSearch, setPermSearch] = useState('');
  const queryClient = useQueryClient();

  const roleLabel = MEMBER_ROLE_LABELS[member.member_role as MemberRole] || MEMBER_ROLE_LABELS.member;

  const togglePerm = (perm: string) => {
    setLocalPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
    setHasChanges(true);
  };

  const grantAllCategory = (catKey: string) => {
    const catPerms = ALL_MEMBER_PERMISSIONS.filter(p => PERMISSION_LABELS[p]?.category === catKey);
    setLocalPerms(prev => [...new Set([...prev, ...catPerms])]);
    setHasChanges(true);
  };

  const revokeAllCategory = (catKey: string) => {
    const catPerms = ALL_MEMBER_PERMISSIONS.filter(p => PERMISSION_LABELS[p]?.category === catKey);
    setLocalPerms(prev => prev.filter(p => !catPerms.includes(p as any)));
    setHasChanges(true);
  };

  const grantAllPerms = () => {
    setLocalPerms([...ALL_MEMBER_PERMISSIONS]);
    setHasChanges(true);
  };

  const revokeAllPerms = () => {
    setLocalPerms([]);
    setHasChanges(true);
  };

  const grantByTier = (tier: PermTier) => {
    const tierPerms = ALL_MEMBER_PERMISSIONS.filter(p => (MEMBER_PERM_TIERS[p] || 'optional') === tier);
    setLocalPerms(prev => [...new Set([...prev, ...tierPerms])]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_members' as any)
        .update({ granted_permissions: localPerms } as any)
        .eq('id', member.id);
      if (error) throw error;

      if (member.position_id) {
        await supabase
          .from('organization_positions')
          .update({ dashboard_mode: dashboardMode } as any)
          .eq('id', member.position_id);
      }

      toast.success('تم تحديث صلاحيات العضو');
      setHasChanges(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'خطأ في التحديث');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`transition-all ${expanded ? 'ring-1 ring-primary/30 shadow-md' : 'hover:shadow-sm'}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <Badge className={`text-[10px] ${
            member.member_role === 'entity_head' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'
          }`}>
            {roleLabel.icon} {roleLabel.ar}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {localPerms.length}/{ALL_MEMBER_PERMISSIONS.length} صلاحية
          </Badge>
          {hasChanges && <Badge className="bg-amber-500/20 text-amber-600 text-[10px] animate-pulse">غير محفوظ</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{member.profile?.full_name || member.invitation_email}</p>
            <p className="text-[10px] text-muted-foreground">{member.job_title_ar || member.position?.title_ar || '—'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {member.member_role === 'entity_head' ? <Crown className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="border-t pt-4 pb-3 space-y-4">
              {/* Dashboard mode toggle */}
              {member.position_id && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={dashboardMode === 'management' ? 'default' : 'outline'}
                      onClick={() => { setDashboardMode('management'); setHasChanges(true); }}
                      className="text-xs h-7"
                    >
                      <LayoutDashboard className="w-3 h-3 ml-1" /> إدارة
                    </Button>
                    <Button
                      size="sm"
                      variant={dashboardMode === 'workspace' ? 'default' : 'outline'}
                      onClick={() => { setDashboardMode('workspace'); setHasChanges(true); }}
                      className="text-xs h-7"
                    >
                      <UserCircle className="w-3 h-3 ml-1" /> عضو
                    </Button>
                  </div>
                  <span className="text-xs font-medium">نوع الحساب</span>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={grantAllPerms} className="text-xs h-7">
                  <Unlock className="w-3 h-3 ml-1" /> منح الكل
                </Button>
                <Button size="sm" variant="outline" onClick={revokeAllPerms} className="text-xs h-7">
                  <Lock className="w-3 h-3 ml-1" /> سحب الكل
                </Button>
                <Button size="sm" variant="outline" onClick={() => grantByTier('essential')} className="text-xs h-7 text-red-600 border-red-200">
                  🔴 منح الأساسية
                </Button>
                <Button size="sm" variant="outline" onClick={() => grantByTier('important')} className="text-xs h-7 text-amber-600 border-amber-200">
                  🟡 منح المهمة
                </Button>
              </div>

              {/* Search + Tier filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="بحث في الصلاحيات..."
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                    className="pr-7 h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={tierFilter === 'all' ? 'default' : 'outline'} onClick={() => setTierFilter('all')} className="text-[10px] h-6 px-2">
                    الكل
                  </Button>
                  {(['essential', 'important', 'optional'] as PermTier[]).map(t => (
                    <Button
                      key={t}
                      size="sm"
                      variant={tierFilter === t ? 'default' : 'outline'}
                      onClick={() => setTierFilter(t)}
                      className="text-[10px] h-6 px-2"
                    >
                      {PERM_TIER_META[t].icon} {PERM_TIER_META[t].label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Member permissions by category */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {Object.entries(PERMISSION_CATEGORIES).map(([catKey, catLabel]) => {
                  let catPerms = ALL_MEMBER_PERMISSIONS.filter(p => PERMISSION_LABELS[p]?.category === catKey);
                  if (tierFilter !== 'all') {
                    catPerms = catPerms.filter(p => (MEMBER_PERM_TIERS[p] || 'optional') === tierFilter);
                  }
                  if (permSearch) {
                    const q = permSearch.toLowerCase();
                    catPerms = catPerms.filter(p => PERMISSION_LABELS[p]?.ar.includes(q));
                  }
                  if (catPerms.length === 0) return null;

                  const allOn = catPerms.every(p => localPerms.includes(p));
                  const catCount = catPerms.filter(p => localPerms.includes(p)).length;

                  return (
                    <div key={catKey} className="rounded-lg border p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => allOn ? revokeAllCategory(catKey) : grantAllCategory(catKey)}
                          >
                            {allOn ? <XCircle className="w-3 h-3 ml-1" /> : <CheckCircle2 className="w-3 h-3 ml-1" />}
                            {allOn ? 'إلغاء' : 'تحديد الكل'}
                          </Button>
                          <Badge variant="outline" className="text-[10px]">{catCount}/{catPerms.length}</Badge>
                        </div>
                        <h4 className="text-xs font-semibold">{catLabel}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {catPerms.map(perm => {
                          const tier = MEMBER_PERM_TIERS[perm] || 'optional';
                          const tierMeta = PERM_TIER_META[tier];
                          return (
                            <div
                              key={perm}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border ${
                                localPerms.includes(perm) ? `bg-primary/5 shadow-sm ${tierMeta.borderClass}` : 'border-transparent hover:bg-muted/50'
                              }`}
                              onClick={() => togglePerm(perm)}
                            >
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={localPerms.includes(perm)}
                                  onCheckedChange={() => togglePerm(perm)}
                                  className="scale-75"
                                />
                                <span className={`text-[8px] px-1 py-0.5 rounded-full ${tierMeta.bgClass} ${tierMeta.color}`}>
                                  {tierMeta.label}
                                </span>
                              </div>
                              <span className="text-xs">{PERMISSION_LABELS[perm].ar}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasChanges && (
                <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setLocalPerms(member.granted_permissions || []); setHasChanges(false); }}
                    className="flex-1"
                  >
                    <RotateCcw className="w-3 h-3 ml-1" /> تراجع
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                    حفظ الصلاحيات
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ===== Main Panel =====
export default function OrgPermissionsPanel() {
  const { positions, departments } = useOrgStructure();
  const { members, refetch } = useOrgMembers();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'positions' | 'members'>('positions');

  const activePositions = positions.filter(p => {
    if (deptFilter !== 'all' && p.department_id !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title_ar.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.holder_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const activeMembers = members.filter(m => {
    if (m.status !== 'active') return false;
    if (deptFilter !== 'all' && m.department_id !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.profile?.full_name?.toLowerCase().includes(q) ||
        m.profile?.email?.toLowerCase().includes(q) ||
        m.job_title_ar?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const managementCount = positions.filter(p => p.dashboard_mode === 'management').length;
  const workspaceCount = positions.filter(p => p.dashboard_mode === 'workspace').length;
  const totalPermTypes = ALL_MEMBER_PERMISSIONS.length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Shield className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{positions.length}</p>
            <p className="text-[10px] text-muted-foreground">منصب وظيفي</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <LayoutDashboard className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{managementCount}</p>
            <p className="text-[10px] text-muted-foreground">حساب إدارة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <UserCircle className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold">{workspaceCount}</p>
            <p className="text-[10px] text-muted-foreground">حساب عضو</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ShieldCheck className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold">{activeMembers.length}</p>
            <p className="text-[10px] text-muted-foreground">عضو نشط</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <ShieldAlert className="w-5 h-5 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold">{totalPermTypes}</p>
            <p className="text-[10px] text-muted-foreground">نوع صلاحية</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالمنصب أو الاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 text-right"
          />
        </div>
        {departments.length > 0 && (
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <Building2 className="w-3 h-3 ml-1" />
              <SelectValue placeholder="القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs: By Position / By Member */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} dir="rtl">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="positions" className="text-xs gap-1">
            <Shield className="w-3.5 h-3.5" /> حسب المنصب ({activePositions.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs gap-1">
            <User className="w-3.5 h-3.5" /> حسب العضو ({activeMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-3 space-y-2">
          {activePositions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا يوجد مناصب {search ? 'مطابقة' : 'بعد'}</p>
              </CardContent>
            </Card>
          ) : (
            activePositions
              .sort((a, b) => b.level - a.level || a.sort_order - b.sort_order)
              .map(pos => <PositionPermEditor key={pos.id} position={pos} />)
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-3 space-y-2">
          {activeMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">لا يوجد أعضاء {search ? 'مطابقون' : 'بعد'}</p>
              </CardContent>
            </Card>
          ) : (
            activeMembers.map(m => <MemberPermEditor key={m.id} member={m} onUpdate={refetch} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
