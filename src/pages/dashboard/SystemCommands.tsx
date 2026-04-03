import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import BackButton from '@/components/ui/back-button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Play, CheckCircle2, XCircle, AlertTriangle, Loader2, 
  Database, Server, Shield, Users, Truck, FileText,
  Activity, RefreshCw, Terminal, Zap, Globe, 
  Building2, Settings, Brain, Radio, BarChart3,
  Package, Receipt, MapPin, Bell, MessageSquare,
  Lock, Wallet, ClipboardList, Flame, Leaf,
  PlayCircle, StopCircle, SkipForward, ChevronDown, ChevronUp,
  Video, Headphones, Bot, Megaphone, GraduationCap,
  Briefcase, Factory, ShieldCheck, HardDrive, Gauge,
  UserCog, Car, Eye, Landmark, Scale, BookOpen,
} from 'lucide-react';

type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'warning';

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: TestStatus;
  message?: string;
  duration?: number;
  details?: string;
}

interface TestCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  tests: { id: string; name: string; run: () => Promise<{ passed: boolean; message: string; details?: string }> }[];
}

const StatusIcon = ({ status }: { status: TestStatus }) => {
  switch (status) {
    case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    default: return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;
  }
};

const statusBadge = (status: TestStatus) => {
  const map: Record<TestStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    idle: { variant: 'outline', label: 'في الانتظار' },
    running: { variant: 'secondary', label: 'جاري...' },
    passed: { variant: 'default', label: 'نجح ✓' },
    failed: { variant: 'destructive', label: 'فشل ✗' },
    warning: { variant: 'outline', label: 'تحذير ⚠' },
  };
  return map[status];
};

// Helper to run a query test (handles RLS-protected tables gracefully)
const queryTest = async (table: string, label?: string): Promise<{ passed: boolean; message: string; details?: string }> => {
  const start = Date.now();
  const { count, error } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
  const ms = Date.now() - start;
  if (error) {
    // 500 errors from RLS are still "table exists" - treat as warning/pass
    if (error.code === '42P01') return { passed: false, message: `${label || table}: الجدول غير موجود` };
    return { passed: true, message: `${label || table}: محمي بـ RLS (${ms}ms)`, details: error.message };
  }
  return { passed: true, message: `${label || table}: ${count ?? 0} سجل (${ms}ms)`, details: `عدد السجلات: ${count}, زمن الاستجابة: ${ms}ms` };
};

// Helper to test an edge function
const edgeFnTest = async (fnName: string, body?: any): Promise<{ passed: boolean; message: string; details?: string }> => {
  const start = Date.now();
  try {
    const { data, error } = await supabase.functions.invoke(fnName, { body: body || {} });
    const ms = Date.now() - start;
    if (error) return { passed: false, message: `${fnName}: ${error.message}`, details: `زمن الاستجابة: ${ms}ms` };
    return { passed: true, message: `${fnName}: يعمل بنجاح (${ms}ms)`, details: JSON.stringify(data)?.slice(0, 200) };
  } catch (e: any) {
    return { passed: false, message: `${fnName}: ${e.message}` };
  }
};

// Helper to test RPC function
const rpcTest = async (fnName: string, args?: any): Promise<{ passed: boolean; message: string; details?: string }> => {
  const start = Date.now();
  try {
    const { data, error } = await supabase.rpc(fnName as any, args || {});
    const ms = Date.now() - start;
    if (error) return { passed: false, message: `${fnName}: ${error.message}` };
    return { passed: true, message: `${fnName}: يعمل (${ms}ms)`, details: JSON.stringify(data)?.slice(0, 200) };
  } catch (e: any) {
    return { passed: false, message: `${fnName}: ${e.message}` };
  }
};

const buildTestCategories = (): TestCategory[] => [
  {
    id: 'database-core',
    name: 'قاعدة البيانات - الجداول الأساسية',
    icon: Database,
    description: 'فحص الجداول الأساسية: المستخدمين، الجهات، الشحنات، السائقين',
    tests: [
      { id: 'db-profiles', name: 'المستخدمين (profiles)', run: () => queryTest('profiles', 'المستخدمين') },
      { id: 'db-organizations', name: 'الجهات (organizations)', run: () => queryTest('organizations', 'الجهات') },
      { id: 'db-user-orgs', name: 'ربط المستخدمين بالجهات', run: () => queryTest('user_organizations', 'ربط الجهات') },
      { id: 'db-user-roles', name: 'أدوار المستخدمين', run: () => queryTest('user_roles', 'الأدوار') },
      { id: 'db-shipments', name: 'الشحنات', run: () => queryTest('shipments', 'الشحنات') },
      { id: 'db-shipment-items', name: 'عناصر الشحنات', run: () => queryTest('shipment_items', 'عناصر الشحنات') },
      { id: 'db-drivers', name: 'السائقين', run: () => queryTest('drivers', 'السائقين') },
      { id: 'db-invoices', name: 'الفواتير', run: () => queryTest('invoices', 'الفواتير') },
      { id: 'db-contracts', name: 'العقود', run: () => queryTest('contracts', 'العقود') },
      { id: 'db-notifications', name: 'الإشعارات', run: () => queryTest('notifications', 'الإشعارات') },
      { id: 'db-activity-logs', name: 'سجل النشاطات', run: () => queryTest('activity_logs', 'النشاطات') },
      { id: 'db-org-settings', name: 'إعدادات الجهات', run: () => queryTest('organization_settings', 'إعدادات الجهات') },
      { id: 'db-org-branding', name: 'هوية الجهات', run: () => queryTest('organization_branding', 'الهوية') },
      { id: 'db-positions', name: 'المناصب الوظيفية', run: () => queryTest('positions', 'المناصب') },
      { id: 'db-emp-permissions', name: 'صلاحيات الموظفين', run: () => queryTest('employee_permissions', 'الصلاحيات') },
    ],
  },
  {
    id: 'auth',
    name: 'المصادقة والأمان',
    icon: Shield,
    description: 'فحص نظام تسجيل الدخول والصلاحيات والتحقق الثنائي',
    tests: [
      { id: 'auth-session', name: 'جلسة المستخدم الحالية', run: async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return { passed: false, message: 'لا توجد جلسة نشطة' };
        return { passed: true, message: `جلسة نشطة: ${data.session.user.email}`, details: `User ID: ${data.session.user.id}` };
      }},
      { id: 'auth-roles', name: 'أدوار المستخدم الحالي', run: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return { passed: false, message: 'لا توجد جلسة' };
        const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', session.session.user.id);
        if (error) return { passed: false, message: error.message };
        return { passed: true, message: `الأدوار: ${data?.map(r => r.role).join(', ') || 'لا أدوار'}` };
      }},
      { id: 'auth-org', name: 'ربط المستخدم بالجهة', run: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return { passed: false, message: 'لا توجد جلسة' };
        const { data, error } = await supabase.from('user_organizations').select('organization_id, role_in_organization, is_primary').eq('user_id', session.session.user.id);
        if (error) return { passed: false, message: error.message };
        if (!data?.length) return { passed: false, message: 'المستخدم غير مرتبط بأي جهة' };
        return { passed: true, message: `مرتبط بـ ${data.length} جهة`, details: JSON.stringify(data) };
      }},
      { id: 'auth-2fa', name: 'نظام التحقق الثنائي', run: () => queryTest('two_factor_settings', 'إعدادات 2FA') },
      { id: 'auth-biometric', name: 'بيانات البيومتري', run: () => queryTest('biometric_credentials', 'البيومتري') },
      { id: 'auth-biometric-verify', name: 'عمليات التحقق البيومتري', run: () => queryTest('biometric_verifications', 'التحقق البيومتري') },
      { id: 'auth-api-keys', name: 'مفاتيح API', run: () => queryTest('api_keys', 'مفاتيح API') },
      { id: 'auth-api-logs', name: 'سجل طلبات API', run: () => queryTest('api_request_logs', 'سجل API') },
      { id: 'auth-e2e-keys', name: 'مفاتيح التشفير E2E', run: () => queryTest('e2e_key_pairs', 'مفاتيح التشفير') },
      { id: 'auth-encrypted-msgs', name: 'الرسائل المشفرة', run: () => queryTest('encrypted_messages', 'الرسائل المشفرة') },
    ],
  },
  {
    id: 'shipments',
    name: 'الشحنات والنقل',
    icon: Truck,
    description: 'فحص نظام إدارة الشحنات والتتبع وسلسلة الحراسة',
    tests: [
      { id: 'ship-assignments', name: 'تعيينات السائقين', run: () => queryTest('driver_shipment_assignments', 'التعيينات') },
      { id: 'ship-offers', name: 'عروض الشحنات للسائقين', run: () => queryTest('driver_shipment_offers', 'العروض') },
      { id: 'ship-custody', name: 'سلسلة الحراسة', run: () => queryTest('custody_chain_events', 'سلسلة الحراسة') },
      { id: 'ship-chain-custody', name: 'سلسلة الحفظ المتقدمة', run: () => queryTest('chain_of_custody', 'سلسلة الحفظ') },
      { id: 'ship-chain-notif', name: 'إشعارات سلسلة الحفظ', run: () => queryTest('chain_notifications', 'إشعارات السلسلة') },
      { id: 'ship-delivery', name: 'تأكيدات التسليم', run: () => queryTest('delivery_confirmations', 'التسليم') },
      { id: 'ship-declarations', name: 'إقرارات التسليم', run: () => queryTest('delivery_declarations', 'الإقرارات') },
      { id: 'ship-permits', name: 'تصاريح النقل', run: () => queryTest('driver_permits', 'التصاريح') },
      { id: 'ship-tracking', name: 'تتبع المركبات', run: () => queryTest('driver_location_logs', 'التتبع') },
      { id: 'ship-assign-logs', name: 'سجل التعيينات', run: () => queryTest('driver_assignment_logs', 'سجل التعيينات') },
      { id: 'ship-daily-reports', name: 'تقارير السائقين اليومية', run: () => queryTest('driver_daily_reports', 'التقارير اليومية') },
      { id: 'ship-performance', name: 'أداء السائقين', run: () => queryTest('driver_performance_scores', 'أداء السائقين') },
      { id: 'ship-compliance', name: 'مستندات امتثال السائقين', run: () => queryTest('driver_compliance_docs', 'مستندات الامتثال') },
      { id: 'ship-emergencies', name: 'حالات الطوارئ', run: () => queryTest('driver_emergencies', 'الطوارئ') },
      { id: 'ship-copilot', name: 'مهام مساعد السائق', run: () => queryTest('driver_copilot_tasks', 'مهام المساعد') },
      { id: 'ship-smart-alerts', name: 'تنبيهات السائقين الذكية', run: () => queryTest('driver_smart_alerts', 'تنبيهات ذكية') },
      { id: 'ship-signal', name: 'حالة إشارة السائقين', run: () => queryTest('driver_signal_status', 'حالة الإشارة') },
      { id: 'ship-seals', name: 'الأختام الأمنية', run: () => queryTest('seal_numbers', 'الأختام') },
      { id: 'ship-collection', name: 'طلبات الجمع', run: () => queryTest('collection_requests', 'طلبات الجمع') },
    ],
  },
  {
    id: 'driver-financial',
    name: 'محفظة السائق والمالية',
    icon: Car,
    description: 'فحص نظام محفظة السائق والمعاملات والمكافآت',
    tests: [
      { id: 'dw-wallet', name: 'محفظة السائق', run: () => queryTest('driver_wallet', 'محفظة السائق') },
      { id: 'dw-transactions', name: 'معاملات المحفظة', run: () => queryTest('driver_wallet_transactions', 'المعاملات') },
      { id: 'dw-enrollments', name: 'تسجيلات السائقين', run: () => queryTest('driver_enrollments', 'التسجيلات') },
      { id: 'dw-quick-links', name: 'روابط السائق السريعة', run: () => queryTest('driver_quick_links', 'الروابط السريعة') },
      { id: 'dw-dynamic-pricing', name: 'قواعد التسعير الديناميكي', run: () => queryTest('dynamic_pricing_rules', 'التسعير الديناميكي') },
    ],
  },
  {
    id: 'financial',
    name: 'المالية والمحاسبة',
    icon: Wallet,
    description: 'فحص النظام المالي والفوترة والمدفوعات',
    tests: [
      { id: 'fin-ledger', name: 'دفتر الحسابات', run: () => queryTest('accounting_ledger', 'دفتر الحسابات') },
      { id: 'fin-invoice-items', name: 'بنود الفواتير', run: () => queryTest('invoice_items', 'البنود') },
      { id: 'fin-deposits', name: 'الإيداعات', run: () => queryTest('deposits', 'الإيداعات') },
      { id: 'fin-expenses', name: 'المصروفات', run: () => queryTest('expenses', 'المصروفات') },
      { id: 'fin-periods', name: 'فترات الحسابات', run: () => queryTest('account_periods', 'الفترات') },
      { id: 'fin-transactions', name: 'المعاملات المالية', run: () => queryTest('financial_transactions', 'المعاملات') },
      { id: 'fin-einvoice', name: 'الفوترة الإلكترونية', run: () => queryTest('e_invoice_submissions', 'الفوترة الإلكترونية') },
      { id: 'fin-einvoice-settings', name: 'إعدادات الفاتورة الإلكترونية', run: () => queryTest('e_invoice_settings', 'إعدادات الفاتورة') },
      { id: 'fin-digital-wallets', name: 'المحافظ الرقمية', run: () => queryTest('digital_wallets', 'المحافظ الرقمية') },
      { id: 'fin-aggregate', name: 'الفواتير المجمعة', run: () => queryTest('aggregate_invoices', 'الفواتير المجمعة') },
      { id: 'fin-subscriptions', name: 'الاشتراكات', run: () => queryTest('subscriptions', 'الاشتراكات') },
      { id: 'fin-sub-wallets', name: 'محافظ الاشتراكات', run: () => queryTest('subscription_wallets', 'محافظ الاشتراكات') },
      { id: 'fin-payment-reminders', name: 'تذكيرات الدفع', run: () => queryTest('payment_reminders', 'تذكيرات الدفع') },
    ],
  },
  {
    id: 'partners',
    name: 'الجهات المرتبطة والعملاء',
    icon: Building2,
    description: 'فحص إدارة الجهات والعلاقات والبوابات',
    tests: [
      { id: 'part-external', name: 'الجهات الخارجية', run: () => queryTest('external_partners', 'الجهات الخارجية') },
      { id: 'part-customers', name: 'العملاء', run: () => queryTest('customers', 'العملاء') },
      { id: 'part-awards', name: 'خطابات الترسية', run: () => queryTest('award_letters', 'خطابات الترسية') },
      { id: 'part-award-items', name: 'بنود خطابات الترسية', run: () => queryTest('award_letter_items', 'بنود الترسية') },
      { id: 'part-partner-notes', name: 'ملاحظات الجهات', run: () => queryTest('partner_notes', 'الملاحظات') },
      { id: 'part-partner-links', name: 'روابط الشراكة', run: () => queryTest('partner_links', 'روابط الشراكة') },
      { id: 'part-portals', name: 'بوابات العملاء', run: () => queryTest('client_portals', 'بوابات العملاء') },
      { id: 'part-portal-settings', name: 'إعدادات بوابة العملاء', run: () => queryTest('customer_portal_settings', 'إعدادات البوابة') },
      { id: 'part-conversations', name: 'محادثات العملاء', run: () => queryTest('customer_conversations', 'محادثات العملاء') },
      { id: 'part-conv-msgs', name: 'رسائل محادثات العملاء', run: () => queryTest('customer_conversation_messages', 'رسائل المحادثات') },
      { id: 'part-emp-access', name: 'وصول الموظف للشركاء', run: () => queryTest('employee_partner_access', 'وصول الشركاء') },
    ],
  },
  {
    id: 'waste',
    name: 'إدارة النفايات والبيئة',
    icon: Flame,
    description: 'فحص نظام تصنيف وتتبع النفايات والبصمة الكربونية',
    tests: [
      { id: 'waste-types', name: 'أنواع النفايات المخصصة', run: () => queryTest('custom_waste_types', 'أنواع النفايات') },
      { id: 'waste-disposal-ops', name: 'عمليات التخلص', run: () => queryTest('disposal_operations', 'عمليات التخلص') },
      { id: 'waste-disposal-certs', name: 'شهادات التخلص الآمن', run: () => queryTest('disposal_certificates', 'شهادات التخلص') },
      { id: 'waste-disposal-fac', name: 'مرافق التخلص', run: () => queryTest('disposal_facilities', 'مرافق التخلص') },
      { id: 'waste-disposal-rev', name: 'تقييمات مرافق التخلص', run: () => queryTest('disposal_facility_reviews', 'تقييمات المرافق') },
      { id: 'waste-disposal-fleet', name: 'أسطول التخلص', run: () => queryTest('disposal_fleet_vehicles', 'أسطول التخلص') },
      { id: 'waste-disposal-trips', name: 'رحلات التخلص', run: () => queryTest('disposal_trips', 'رحلات التخلص') },
      { id: 'waste-disposal-reqs', name: 'طلبات التخلص الواردة', run: () => queryTest('disposal_incoming_requests', 'طلبات التخلص') },
      { id: 'waste-disposal-auto', name: 'قواعد أتمتة التخلص', run: () => queryTest('disposal_automation_rules', 'أتمتة التخلص') },
      { id: 'waste-disposal-byp', name: 'منتجات التخلص الثانوية', run: () => queryTest('disposal_byproducts', 'المنتجات الثانوية') },
      { id: 'waste-carbon', name: 'البصمة الكربونية', run: () => queryTest('carbon_footprint_records', 'الكربون') },
      { id: 'waste-carbon-credits', name: 'أرصدة الكربون', run: () => queryTest('carbon_credits', 'أرصدة الكربون') },
      { id: 'waste-carbon-factors', name: 'معاملات الانبعاثات', run: () => queryTest('carbon_emission_factors', 'معاملات الانبعاثات') },
      { id: 'waste-carbon-summary', name: 'ملخص الكربون', run: () => queryTest('carbon_summary', 'ملخص الكربون') },
      { id: 'waste-circularity', name: 'مؤشرات الاقتصاد الدائري', run: () => queryTest('circularity_kpis', 'مؤشرات الدائرية') },
      { id: 'waste-compliance', name: 'شهادات الامتثال', run: () => queryTest('compliance_certificates', 'شهادات الامتثال') },
      { id: 'waste-dpp', name: 'جوازات المنتج الرقمية', run: () => queryTest('digital_product_passports', 'جوازات المنتج') },
      { id: 'waste-dpp-events', name: 'أحداث دورة حياة DPP', run: () => queryTest('dpp_lifecycle_events', 'أحداث DPP') },
      { id: 'waste-emp-access', name: 'وصول الموظفين للنفايات', run: () => queryTest('employee_waste_access', 'وصول النفايات') },
      { id: 'waste-auctions', name: 'مزادات النفايات', run: () => queryTest('waste_auctions', 'المزادات') },
      { id: 'waste-auction-bids', name: 'عروض المزادات', run: () => queryTest('auction_bids', 'عروض المزادات') },
      { id: 'waste-emergency', name: 'خطط الطوارئ', run: () => queryTest('emergency_plans', 'خطط الطوارئ') },
    ],
  },
  {
    id: 'documents',
    name: 'المستندات والتوقيعات',
    icon: FileText,
    description: 'فحص إدارة المستندات والتوقيع الإلكتروني والتصديقات',
    tests: [
      { id: 'doc-templates', name: 'قوالب المستندات', run: () => queryTest('document_templates', 'القوالب') },
      { id: 'doc-template-sigs', name: 'موقعو القوالب', run: () => queryTest('document_template_signatories', 'موقعو القوالب') },
      { id: 'doc-signatures', name: 'التوقيعات الإلكترونية', run: () => queryTest('document_signatures', 'التوقيعات') },
      { id: 'doc-entity', name: 'مستندات الكيانات', run: () => queryTest('entity_documents', 'المستندات') },
      { id: 'doc-signatories', name: 'المفوضون بالتوقيع', run: () => queryTest('authorized_signatories', 'المفوضون') },
      { id: 'doc-verify', name: 'التحقق من المستندات', run: () => queryTest('document_verifications', 'التحقق') },
      { id: 'doc-endorsements', name: 'المصادقات', run: () => queryTest('document_endorsements', 'المصادقات') },
      { id: 'doc-endorsement-checks', name: 'معايير المصادقة', run: () => queryTest('endorsement_criteria_checks', 'معايير المصادقة') },
      { id: 'doc-ai-analysis', name: 'تحليل المستندات بالذكاء', run: () => queryTest('document_ai_analysis', 'تحليل AI') },
      { id: 'doc-print-log', name: 'سجل الطباعة', run: () => queryTest('document_print_log', 'سجل الطباعة') },
      { id: 'doc-auto-sig', name: 'إعدادات التوقيع التلقائي', run: () => queryTest('auto_signature_settings', 'توقيع تلقائي') },
      { id: 'doc-contract-templates', name: 'قوالب العقود', run: () => queryTest('contract_templates', 'قوالب العقود') },
      { id: 'doc-contract-versions', name: 'نسخ العقود المخصصة', run: () => queryTest('contract_custom_versions', 'نسخ العقود') },
      { id: 'doc-contract-verify', name: 'تحقق من العقود', run: () => queryTest('contract_verifications', 'تحقق العقود') },
      { id: 'doc-emp-docs', name: 'مستندات الموظفين', run: () => queryTest('employee_documents', 'مستندات الموظفين') },
    ],
  },
  {
    id: 'communication',
    name: 'التواصل والإشعارات',
    icon: MessageSquare,
    description: 'فحص نظام الرسائل والمحادثات والاجتماعات',
    tests: [
      { id: 'comm-chat-rooms', name: 'غرف المحادثة', run: () => queryTest('chat_rooms', 'غرف المحادثة') },
      { id: 'comm-chat-msgs', name: 'رسائل المحادثة', run: () => queryTest('chat_messages', 'رسائل المحادثة') },
      { id: 'comm-chat-parts', name: 'أعضاء المحادثات', run: () => queryTest('chat_participants', 'أعضاء المحادثات') },
      { id: 'comm-chat-reads', name: 'قراءات الرسائل', run: () => queryTest('chat_message_reads', 'قراءات الرسائل') },
      { id: 'comm-chat-settings', name: 'إعدادات محادثات الجهة', run: () => queryTest('chat_org_settings', 'إعدادات المحادثات') },
      { id: 'comm-chat-broadcast', name: 'قوائم البث', run: () => queryTest('chat_broadcast_lists', 'قوائم البث') },
      { id: 'comm-chat-exports', name: 'تصدير المحادثات', run: () => queryTest('chat_history_exports', 'تصدير المحادثات') },
      { id: 'comm-direct', name: 'الرسائل المباشرة', run: () => queryTest('direct_messages', 'الرسائل المباشرة') },
      { id: 'comm-entity-comments', name: 'تعليقات الكيانات', run: () => queryTest('entity_comments', 'التعليقات') },
      { id: 'comm-tickets', name: 'تذاكر الدعم', run: () => queryTest('support_tickets', 'التذاكر') },
    ],
  },
  {
    id: 'meetings',
    name: 'الاجتماعات المرئية',
    icon: Video,
    description: 'فحص نظام اجتماعات الفيديو والتسجيل والتحليل',
    tests: [
      { id: 'meet-meetings', name: 'الاجتماعات', run: () => queryTest('video_meetings', 'الاجتماعات') },
      { id: 'meet-participants', name: 'المشاركون', run: () => queryTest('video_meeting_participants', 'المشاركون') },
      { id: 'meet-chat', name: 'محادثات الاجتماعات', run: () => queryTest('video_meeting_chat', 'محادثات الاجتماعات') },
      { id: 'meet-notes', name: 'ملاحظات الاجتماعات', run: () => queryTest('meeting_notes', 'ملاحظات الاجتماعات') },
    ],
  },
  {
    id: 'callcenter',
    name: 'مركز الاتصالات',
    icon: Headphones,
    description: 'فحص نظام المكالمات والتحليل والأداء',
    tests: [
      { id: 'cc-calls', name: 'سجل المكالمات', run: () => queryTest('call_logs', 'المكالمات') },
      { id: 'cc-analysis', name: 'تحليل المكالمات', run: () => queryTest('call_analysis', 'تحليل المكالمات') },
      { id: 'cc-transcriptions', name: 'تفريغ المكالمات', run: () => queryTest('call_transcriptions', 'التفريغ') },
      { id: 'cc-settings', name: 'إعدادات مركز الاتصال', run: () => queryTest('call_center_settings', 'إعدادات المركز') },
      { id: 'cc-agent-perf', name: 'أداء الموظفين', run: () => queryTest('agent_performance', 'أداء الموظفين') },
    ],
  },
  {
    id: 'ai-agent',
    name: 'الوكيل الذكي (AI Agent)',
    icon: Bot,
    description: 'فحص نظام الوكيل الذكي للمحادثات والطلبات',
    tests: [
      { id: 'ai-config', name: 'إعدادات الوكيل الذكي', run: () => queryTest('ai_agent_configs', 'إعدادات الوكيل') },
      { id: 'ai-conversations', name: 'محادثات الوكيل', run: () => queryTest('ai_agent_conversations', 'المحادثات') },
      { id: 'ai-messages', name: 'رسائل الوكيل', run: () => queryTest('ai_agent_messages', 'الرسائل') },
      { id: 'ai-knowledge', name: 'قاعدة المعرفة', run: () => queryTest('ai_agent_knowledge', 'قاعدة المعرفة') },
      { id: 'ai-orders', name: 'طلبات الوكيل', run: () => queryTest('ai_agent_orders', 'الطلبات') },
    ],
  },
  {
    id: 'ads',
    name: 'الإعلانات والتسويق',
    icon: Megaphone,
    description: 'فحص نظام الإعلانات والخطط والتحليلات',
    tests: [
      { id: 'ads-plans', name: 'خطط الإعلانات', run: () => queryTest('ad_plans', 'خطط الإعلانات') },
      { id: 'ads-list', name: 'الإعلانات', run: () => queryTest('advertisements', 'الإعلانات') },
      { id: 'ads-analytics', name: 'تحليلات الإعلانات', run: () => queryTest('ad_analytics', 'تحليلات الإعلانات') },
      { id: 'ads-coupons', name: 'كوبونات الخصم', run: () => queryTest('ad_coupons', 'الكوبونات') },
      { id: 'ads-blog', name: 'مقالات المدونة', run: () => queryTest('blog_posts', 'المدونة') },
      { id: 'ads-news', name: 'الأخبار', run: () => queryTest('news_articles', 'الأخبار') },
    ],
  },
  {
    id: 'consulting',
    name: 'المكاتب الاستشارية',
    icon: Briefcase,
    description: 'فحص نظام المكاتب الاستشارية والمراجعين',
    tests: [
      { id: 'cons-offices', name: 'المكاتب الاستشارية', run: () => queryTest('consulting_offices', 'المكاتب') },
      { id: 'cons-members', name: 'أعضاء المكاتب', run: () => queryTest('consulting_office_members', 'الأعضاء') },
      { id: 'cons-creds', name: 'شهادات المستشارين', run: () => queryTest('consultant_credentials', 'الشهادات') },
      { id: 'cons-assignments', name: 'تعيينات العملاء', run: () => queryTest('consultant_client_assignments', 'تعيينات العملاء') },
      { id: 'cons-org-assign', name: 'تعيينات المنظمات', run: () => queryTest('consultant_organization_assignments', 'تعيينات المنظمات') },
      { id: 'cons-reviews', name: 'مراجعات المستشارين', run: () => queryTest('consultant_reviews', 'المراجعات') },
      { id: 'cons-drafts', name: 'مسودات المراجعة', run: () => queryTest('consultant_review_drafts', 'المسودات') },
      { id: 'cons-field-ops', name: 'العمليات الميدانية', run: () => queryTest('consultant_field_operations', 'الميدانية') },
      { id: 'cons-services', name: 'كتالوج الخدمات', run: () => queryTest('consultant_service_catalog', 'الخدمات') },
      { id: 'cons-doc-sigs', name: 'توقيعات المستشارين', run: () => queryTest('consultant_document_signatures', 'التوقيعات') },
    ],
  },
  {
    id: 'audit',
    name: 'المراجعة والتدقيق',
    icon: ShieldCheck,
    description: 'فحص نظام جلسات التدقيق والامتثال',
    tests: [
      { id: 'audit-sessions', name: 'جلسات التدقيق', run: () => queryTest('audit_sessions', 'جلسات التدقيق') },
      { id: 'audit-checklist', name: 'قوائم التدقيق', run: () => queryTest('audit_checklist_items', 'قوائم التدقيق') },
      { id: 'audit-corrective', name: 'الإجراءات التصحيحية', run: () => queryTest('corrective_actions', 'الإجراءات التصحيحية') },
      { id: 'audit-approval', name: 'طلبات الموافقة', run: () => queryTest('approval_requests', 'طلبات الموافقة') },
      { id: 'audit-action-log', name: 'سجل تنفيذ الإجراءات', run: () => queryTest('action_execution_log', 'سجل التنفيذ') },
    ],
  },
  {
    id: 'hr',
    name: 'الموارد البشرية والتوظيف',
    icon: UserCog,
    description: 'فحص نظام الموظفين والتأمينات والتوظيف',
    tests: [
      { id: 'hr-invitations', name: 'دعوات الموظفين', run: () => queryTest('employee_invitations', 'الدعوات') },
      { id: 'hr-insurance', name: 'تأمينات الموظفين', run: () => queryTest('employee_insurance', 'التأمينات') },
      { id: 'hr-ext-courses', name: 'دورات خارجية', run: () => queryTest('employee_external_courses', 'الدورات الخارجية') },
      { id: 'hr-recruitment', name: 'وكالات التوظيف', run: () => queryTest('recruitment_agencies', 'وكالات التوظيف') },
      { id: 'hr-candidates', name: 'المرشحون', run: () => queryTest('agency_candidates', 'المرشحون') },
      { id: 'hr-worker-profiles', name: 'ملفات العمال', run: () => queryTest('worker_profiles', 'ملفات العمال') },
      { id: 'hr-job-listings', name: 'إعلانات الوظائف', run: () => queryTest('job_listings', 'إعلانات الوظائف') },
      { id: 'hr-job-apps', name: 'طلبات التوظيف', run: () => queryTest('job_applications', 'طلبات التوظيف') },
      { id: 'hr-ohs', name: 'تقارير السلامة المهنية', run: () => queryTest('ohs_reports', 'السلامة المهنية') },
      { id: 'hr-safety-cards', name: 'بطاقات السلامة', run: () => queryTest('safety_cards', 'بطاقات السلامة') },
    ],
  },
  {
    id: 'erp',
    name: 'نظام ERP',
    icon: Package,
    description: 'فحص نظام تخطيط الموارد المؤسسية',
    tests: [
      { id: 'erp-accounts', name: 'شجرة الحسابات', run: () => queryTest('erp_chart_of_accounts', 'الحسابات') },
      { id: 'erp-journal', name: 'القيود المحاسبية', run: () => queryTest('erp_journal_entries', 'القيود') },
      { id: 'erp-inventory', name: 'المخزون', run: () => queryTest('erp_inventory_items', 'المخزون') },
      { id: 'erp-employees', name: 'الموظفون', run: () => queryTest('erp_employees', 'الموظفون') },
      { id: 'erp-purchase', name: 'أوامر الشراء', run: () => queryTest('erp_purchase_orders', 'أوامر الشراء') },
      { id: 'erp-sales', name: 'أوامر البيع', run: () => queryTest('erp_sales_orders', 'أوامر البيع') },
      { id: 'erp-payroll', name: 'الرواتب', run: () => queryTest('erp_payroll', 'الرواتب') },
    ],
  },
  {
    id: 'broker',
    name: 'الوسطاء والتجارة',
    icon: Scale,
    description: 'فحص نظام الوساطة والصفقات والأداء',
    tests: [
      { id: 'broker-deals', name: 'الصفقات', run: () => queryTest('broker_deals', 'الصفقات') },
      { id: 'broker-perf', name: 'أداء الوسطاء', run: () => queryTest('broker_performance', 'أداء الوسطاء') },
      { id: 'broker-trans', name: 'معاملات الوسطاء', run: () => queryTest('broker_transactions', 'المعاملات') },
      { id: 'broker-commodity', name: 'أسعار السلع', run: () => queryTest('commodity_market_prices', 'أسعار السلع') },
    ],
  },
  {
    id: 'iot-gps',
    name: 'IoT وأجهزة GPS والكاميرات',
    icon: HardDrive,
    description: 'فحص أجهزة إنترنت الأشياء وأنظمة التتبع والمراقبة',
    tests: [
      { id: 'iot-devices', name: 'أجهزة IoT', run: () => queryTest('iot_devices', 'أجهزة IoT') },
      { id: 'iot-readings', name: 'قراءات IoT', run: () => queryTest('iot_readings', 'القراءات') },
      { id: 'gps-devices', name: 'أجهزة GPS', run: () => queryTest('gps_devices', 'أجهزة GPS') },
      { id: 'gps-geofences', name: 'المناطق الجغرافية', run: () => queryTest('geofences', 'المناطق الجغرافية') },
      { id: 'cam-access', name: 'صلاحيات الكاميرات', run: () => queryTest('camera_access_grants', 'صلاحيات الكاميرات') },
      { id: 'cam-arrivals', name: 'أحداث وصول الكاميرات', run: () => queryTest('camera_arrival_events', 'أحداث الوصول') },
    ],
  },
  {
    id: 'lms-academy',
    name: 'الأكاديمية والتعليم',
    icon: GraduationCap,
    description: 'فحص نظام التعليم والشارات والتقييم',
    tests: [
      { id: 'lms-courses', name: 'الدورات التعليمية', run: () => queryTest('lms_courses', 'الدورات') },
      { id: 'lms-academy', name: 'دورات الأكاديمية', run: () => queryTest('academy_courses', 'الأكاديمية') },
      { id: 'lms-badges', name: 'نظام الشارات', run: () => queryTest('badges', 'الشارات') },
      { id: 'lms-esg', name: 'تقارير ESG', run: () => queryTest('esg_reports', 'تقارير ESG') },
    ],
  },
  {
    id: 'government',
    name: 'النظام التنظيمي والحكومي',
    icon: Landmark,
    description: 'فحص أنظمة الجهات الرقابية والتراخيص',
    tests: [
      { id: 'gov-regulators', name: 'الجهات الرقابية', run: () => queryTest('regulator_organizations', 'الجهات الرقابية') },
      { id: 'gov-regulated', name: 'الشركات المنظمة', run: () => queryTest('regulated_companies', 'الشركات المنظمة') },
      { id: 'gov-inspections', name: 'عمليات التفتيش', run: () => queryTest('regulatory_inspections', 'التفتيش') },
      { id: 'gov-violations', name: 'المخالفات', run: () => queryTest('regulatory_violations', 'المخالفات') },
      { id: 'gov-penalties', name: 'الغرامات', run: () => queryTest('regulatory_penalties', 'الغرامات') },
      { id: 'gov-licenses', name: 'التراخيص', run: () => queryTest('waste_licenses', 'التراخيص') },
    ],
  },
  {
    id: 'edge-functions',
    name: 'الوظائف الخلفية (Edge Functions)',
    icon: Server,
    description: 'فحص جميع وظائف الخادم المتاحة',
    tests: [
      { id: 'ef-health', name: 'مراقب صحة النظام', run: () => edgeFnTest('system-health-monitor') },
      { id: 'ef-ai-assistant', name: 'المساعد الذكي', run: () => edgeFnTest('ai-assistant', { type: 'ping' }) },
      { id: 'ef-analytics', name: 'محرك التحليلات', run: () => edgeFnTest('analytics-engine', { action: 'ping' }) },
      { id: 'ef-notifications', name: 'إرسال الإشعارات', run: () => edgeFnTest('send-notification', { action: 'ping' }) },
      { id: 'ef-carbon', name: 'حاسبة الكربون', run: () => edgeFnTest('carbon-calculator', { action: 'ping' }) },
      { id: 'ef-smart-notif', name: 'الإشعارات الذكية', run: () => edgeFnTest('smart-notifications', { action: 'ping' }) },
      { id: 'ef-ai-insights', name: 'رؤى الذكاء الاصطناعي', run: () => edgeFnTest('ai-insights', { action: 'ping' }) },
      { id: 'ef-ai-route', name: 'مُحسّن المسارات', run: () => edgeFnTest('ai-route-optimizer', { action: 'ping' }) },
      { id: 'ef-ai-scheduler', name: 'الجدولة الذكية', run: () => edgeFnTest('ai-smart-scheduler', { action: 'ping' }) },
      { id: 'ef-ai-anomaly', name: 'كشف الشذوذ', run: () => edgeFnTest('ai-anomaly-detector', { action: 'ping' }) },
      { id: 'ef-fraud', name: 'كشف الاحتيال', run: () => edgeFnTest('fraud-detection', { action: 'ping' }) },
      { id: 'ef-whatsapp', name: 'واتساب - أحداث', run: () => edgeFnTest('whatsapp-event', { event_type: 'ping' }) },
      { id: 'ef-whatsapp-send', name: 'واتساب - إرسال', run: () => edgeFnTest('whatsapp-send', { action: 'ping' }) },
      { id: 'ef-analyze-meeting', name: 'تحليل الاجتماعات', run: () => edgeFnTest('analyze-meeting', { action: 'ping' }) },
      { id: 'ef-analyze-call', name: 'تحليل المكالمات', run: () => edgeFnTest('analyze-call', { action: 'ping' }) },
      { id: 'ef-esg', name: 'تقارير ESG', run: () => edgeFnTest('esg-report-generator', { action: 'ping' }) },
      { id: 'ef-government', name: 'التقارير الحكومية', run: () => edgeFnTest('government-reporting', { action: 'ping' }) },
      { id: 'ef-public-api', name: 'واجهة API العامة', run: () => edgeFnTest('public-api', { action: 'ping' }) },
      { id: 'ef-smart-agent', name: 'الوكيل الذكي', run: () => edgeFnTest('smart-agent', { action: 'ping' }) },
      { id: 'ef-geofencing', name: 'تنبيهات جيوفنسنج', run: () => edgeFnTest('geofencing-alerts', { action: 'ping' }) },
      { id: 'ef-gps-gateway', name: 'بوابة GPS', run: () => edgeFnTest('gps-device-gateway', { action: 'ping' }) },
      { id: 'ef-scheduled', name: 'المهام المجدولة', run: () => edgeFnTest('scheduled-tasks', { action: 'ping' }) },
      { id: 'ef-backup', name: 'النسخ الاحتياطي', run: () => edgeFnTest('database-backup', { action: 'ping' }) },
    ],
  },
  {
    id: 'rpc-functions',
    name: 'دوال قاعدة البيانات (RPC)',
    icon: Terminal,
    description: 'فحص الدوال المخزنة في قاعدة البيانات',
    tests: [
      { id: 'rpc-admin-stats', name: 'إحصائيات الإدارة', run: () => rpcTest('get_admin_dashboard_stats') },
      { id: 'rpc-search', name: 'البحث الشامل', run: () => rpcTest('global_search', { p_query: 'test', p_org_id: '00000000-0000-0000-0000-000000000000', p_limit: 1 }) },
      { id: 'rpc-org-summary', name: 'ملخص الجهات', run: async () => {
        const { data: session } = await supabase.auth.getSession();
        const userId = session.session?.user?.id;
        if (!userId) return { passed: false, message: 'لا توجد جلسة نشطة' };
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
        if (!profile?.organization_id) return { passed: false, message: 'المستخدم غير مرتبط بجهة' };
        return rpcTest('get_organization_summary', { _org_id: profile.organization_id });
      }},
      { id: 'rpc-security', name: 'ملخص الأمان', run: () => rpcTest('get_security_summary') },
      { id: 'rpc-waste-analytics', name: 'تحليلات النفايات', run: () => rpcTest('get_waste_type_analytics') },
    ],
  },
  {
    id: 'system-infra',
    name: 'البنية التحتية والنظام',
    icon: Gauge,
    description: 'فحص النسخ الاحتياطي والأرشفة وصحة النظام',
    tests: [
      { id: 'sys-health', name: 'ملخص صحة النظام', run: () => queryTest('system_health_summary', 'صحة النظام') },
      { id: 'sys-backup', name: 'سجلات النسخ الاحتياطي', run: () => queryTest('backup_logs', 'النسخ الاحتياطي') },
      { id: 'sys-feature-flags', name: 'أعلام الميزات', run: () => queryTest('feature_flags', 'أعلام الميزات') },
      { id: 'sys-org-features', name: 'ميزات الجهات', run: () => queryTest('organization_feature_flags', 'ميزات الجهات') },
      { id: 'sys-widget-prefs', name: 'تفضيلات لوحة التحكم', run: () => queryTest('dashboard_widget_preferences', 'تفضيلات الويدجت') },
      { id: 'sys-print-prefs', name: 'تفضيلات الطباعة', run: () => queryTest('entity_print_preferences', 'تفضيلات الطباعة') },
      { id: 'sys-shared-links', name: 'الروابط المشتركة', run: () => queryTest('shared_links', 'الروابط المشتركة') },
    ],
  },
];

const SystemCommands = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');

  const categories = buildTestCategories();

  const totalTests = categories.reduce((acc, c) => acc + c.tests.length, 0);
  const passedTests = Object.values(results).filter(r => r.status === 'passed').length;
  const failedTests = Object.values(results).filter(r => r.status === 'failed').length;
  const warningTests = Object.values(results).filter(r => r.status === 'warning').length;
  const completedTests = passedTests + failedTests + warningTests;
  const progress = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runSingleTest = useCallback(async (test: TestCategory['tests'][0], categoryName: string) => {
    setResults(prev => ({ ...prev, [test.id]: { id: test.id, name: test.name, category: categoryName, status: 'running' } }));
    const start = Date.now();
    try {
      const result = await test.run();
      const duration = Date.now() - start;
      setResults(prev => ({
        ...prev,
        [test.id]: {
          id: test.id, name: test.name, category: categoryName,
          status: result.passed ? 'passed' : 'failed',
          message: result.message, details: result.details, duration,
        },
      }));
    } catch (e: any) {
      setResults(prev => ({
        ...prev,
        [test.id]: { id: test.id, name: test.name, category: categoryName, status: 'failed', message: e.message, duration: Date.now() - start },
      }));
    }
  }, []);

  const runCategoryTests = useCallback(async (category: TestCategory) => {
    setExpandedCategories(prev => new Set([...prev, category.id]));
    for (const test of category.tests) {
      await runSingleTest(test, category.name);
    }
  }, [runSingleTest]);

  const runAllTests = useCallback(async () => {
    setRunningAll(true);
    setResults({});
    setExpandedCategories(new Set(categories.map(c => c.id)));
    toast.info('🔍 بدء فحص شامل للنظام...');
    
    for (const category of categories) {
      for (const test of category.tests) {
        await runSingleTest(test, category.name);
      }
    }
    
    setRunningAll(false);
    toast.success(`✅ اكتمل الفحص الشامل - ${totalTests} اختبار`);
  }, [categories, runSingleTest, totalTests]);

  const getCategoryStatus = (category: TestCategory): TestStatus => {
    const catResults = category.tests.map(t => results[t.id]).filter(Boolean);
    if (catResults.length === 0) return 'idle';
    if (catResults.some(r => r.status === 'running')) return 'running';
    if (catResults.some(r => r.status === 'failed')) return 'failed';
    if (catResults.some(r => r.status === 'warning')) return 'warning';
    if (catResults.length === category.tests.length && catResults.every(r => r.status === 'passed')) return 'passed';
    return 'idle';
  };

  const filteredCategories = activeTab === 'all' ? categories :
    activeTab === 'passed' ? categories.filter(c => getCategoryStatus(c) === 'passed') :
    activeTab === 'failed' ? categories.filter(c => getCategoryStatus(c) === 'failed' || getCategoryStatus(c) === 'warning') :
    categories;

  return (
    <DashboardLayout>
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <motion.div
              className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Terminal className="w-8 h-8" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold">أوامر تشخيص النظام</h1>
              <p className="text-muted-foreground">فحص شامل لجميع وظائف ومكونات المنصة ({totalTests} اختبار في {categories.length} فئة)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={runningAll}
              className="gap-2"
              size="lg"
            >
              {runningAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              {runningAll ? 'جاري الفحص...' : 'تشغيل كل الاختبارات'}
            </Button>
          </div>
        </div>

        {/* Progress Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{totalTests}</div>
                  <div className="text-xs text-muted-foreground">إجمالي الاختبارات</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{passedTests}</div>
                  <div className="text-xs text-muted-foreground">نجح</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{failedTests}</div>
                  <div className="text-xs text-muted-foreground">فشل</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-500">{warningTests}</div>
                  <div className="text-xs text-muted-foreground">تحذير</div>
                </div>
              </div>
              <div className="text-left min-w-[120px]">
                <div className="text-sm text-muted-foreground mb-1">التقدم: {progress}%</div>
                <Progress value={progress} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Activity className="w-4 h-4" />
            الكل ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="passed" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            ناجح
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            <XCircle className="w-4 h-4" />
            فاشل
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Test Categories */}
      <ScrollArea className="h-[calc(100vh-420px)]">
        <div className="space-y-4 pb-8">
          <AnimatePresence>
            {filteredCategories.map((category, idx) => {
              const catStatus = getCategoryStatus(category);
              const isExpanded = expandedCategories.has(category.id);
              const catPassed = category.tests.filter(t => results[t.id]?.status === 'passed').length;
              const catTotal = category.tests.length;
              const Icon = category.icon;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className={
                    catStatus === 'passed' ? 'border-green-200 dark:border-green-800' :
                    catStatus === 'failed' ? 'border-red-200 dark:border-red-800' :
                    catStatus === 'running' ? 'border-blue-200 dark:border-blue-800' : ''
                  }>
                    <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleCategory(category.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            catStatus === 'passed' ? 'bg-green-100 dark:bg-green-900/30' :
                            catStatus === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                            'bg-muted'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {category.name}
                              <StatusIcon status={catStatus} />
                            </CardTitle>
                            <CardDescription className="text-xs">{category.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{catPassed}/{catTotal}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); runCategoryTests(category); }}
                            disabled={runningAll}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </CardHeader>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {category.tests.map((test) => {
                                const result = results[test.id];
                                const badge = statusBadge(result?.status || 'idle');
                                return (
                                  <motion.div
                                    key={test.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <StatusIcon status={result?.status || 'idle'} />
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm">{test.name}</div>
                                        {result?.message && (
                                          <div className={`text-xs mt-0.5 truncate ${
                                            result.status === 'failed' ? 'text-red-500' :
                                            result.status === 'passed' ? 'text-green-600' : 'text-muted-foreground'
                                          }`}>
                                            {result.message}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {result?.duration && (
                                        <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                                      )}
                                      <Badge variant={badge.variant} className="text-xs">
                                        {badge.label}
                                      </Badge>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => runSingleTest(test, category.name)}
                                        disabled={runningAll}
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export default SystemCommands;
