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

// Helper to run a query test
const queryTest = async (table: string, label?: string): Promise<{ passed: boolean; message: string; details?: string }> => {
  const start = Date.now();
  const { count, error } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
  const ms = Date.now() - start;
  if (error) return { passed: false, message: `خطأ في الوصول لـ ${label || table}: ${error.message}` };
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
    id: 'database',
    name: 'قاعدة البيانات',
    icon: Database,
    description: 'فحص الجداول الأساسية والوصول للبيانات',
    tests: [
      { id: 'db-profiles', name: 'جدول المستخدمين (profiles)', run: () => queryTest('profiles', 'المستخدمين') },
      { id: 'db-organizations', name: 'جدول الجهات (organizations)', run: () => queryTest('organizations', 'الجهات') },
      { id: 'db-shipments', name: 'جدول الشحنات (shipments)', run: () => queryTest('shipments', 'الشحنات') },
      { id: 'db-drivers', name: 'جدول السائقين (drivers)', run: () => queryTest('drivers', 'السائقين') },
      { id: 'db-invoices', name: 'جدول الفواتير (invoices)', run: () => queryTest('invoices', 'الفواتير') },
      { id: 'db-contracts', name: 'جدول العقود (contracts)', run: () => queryTest('contracts', 'العقود') },
      { id: 'db-deposits', name: 'جدول الإيداعات (deposits)', run: () => queryTest('deposits', 'الإيداعات') },
      { id: 'db-notifications', name: 'جدول الإشعارات (notifications)', run: () => queryTest('notifications', 'الإشعارات') },
      { id: 'db-activity-logs', name: 'سجل النشاطات (activity_logs)', run: () => queryTest('activity_logs', 'النشاطات') },
      { id: 'db-user-roles', name: 'أدوار المستخدمين (user_roles)', run: () => queryTest('user_roles', 'الأدوار') },
    ],
  },
  {
    id: 'auth',
    name: 'المصادقة والأمان',
    icon: Shield,
    description: 'فحص نظام تسجيل الدخول والصلاحيات',
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
    ],
  },
  {
    id: 'shipments',
    name: 'الشحنات والنقل',
    icon: Truck,
    description: 'فحص نظام إدارة الشحنات والتتبع',
    tests: [
      { id: 'ship-list', name: 'قائمة الشحنات', run: () => queryTest('shipments', 'الشحنات') },
      { id: 'ship-items', name: 'عناصر الشحنات', run: () => queryTest('shipment_items', 'عناصر الشحنات') },
      { id: 'ship-assignments', name: 'تعيينات السائقين', run: () => queryTest('driver_shipment_assignments', 'التعيينات') },
      { id: 'ship-custody', name: 'سلسلة الحراسة', run: () => queryTest('custody_chain_events', 'سلسلة الحراسة') },
      { id: 'ship-delivery', name: 'تأكيدات التسليم', run: () => queryTest('delivery_confirmations', 'التسليم') },
      { id: 'ship-declarations', name: 'إقرارات التسليم', run: () => queryTest('delivery_declarations', 'الإقرارات') },
      { id: 'ship-permits', name: 'تصاريح الشحنات', run: () => queryTest('driver_permits', 'التصاريح') },
      { id: 'ship-tracking', name: 'تتبع المركبات', run: () => queryTest('driver_location_logs', 'التتبع') },
    ],
  },
  {
    id: 'financial',
    name: 'المالية والمحاسبة',
    icon: Wallet,
    description: 'فحص النظام المالي والفوترة',
    tests: [
      { id: 'fin-ledger', name: 'دفتر الحسابات', run: () => queryTest('accounting_ledger', 'دفتر الحسابات') },
      { id: 'fin-invoices', name: 'الفواتير', run: () => queryTest('invoices', 'الفواتير') },
      { id: 'fin-invoice-items', name: 'بنود الفواتير', run: () => queryTest('invoice_items', 'البنود') },
      { id: 'fin-deposits', name: 'الإيداعات', run: () => queryTest('deposits', 'الإيداعات') },
      { id: 'fin-expenses', name: 'المصروفات', run: () => queryTest('expenses', 'المصروفات') },
      { id: 'fin-periods', name: 'فترات الحسابات', run: () => queryTest('account_periods', 'الفترات') },
      { id: 'fin-transactions', name: 'المعاملات المالية', run: () => queryTest('financial_transactions', 'المعاملات') },
      { id: 'fin-einvoice', name: 'الفوترة الإلكترونية', run: () => queryTest('e_invoice_submissions', 'الفوترة الإلكترونية') },
    ],
  },
  {
    id: 'partners',
    name: 'الشركاء والعملاء',
    icon: Building2,
    description: 'فحص إدارة الشركاء والعلاقات',
    tests: [
      { id: 'part-orgs', name: 'المنظمات', run: () => queryTest('organizations', 'المنظمات') },
      { id: 'part-external', name: 'الشركاء الخارجيين', run: () => queryTest('external_partners', 'الشركاء') },
      { id: 'part-customers', name: 'العملاء', run: () => queryTest('customers', 'العملاء') },
      { id: 'part-contracts', name: 'العقود', run: () => queryTest('contracts', 'العقود') },
      { id: 'part-awards', name: 'خطابات الترسية', run: () => queryTest('award_letters', 'خطابات الترسية') },
      { id: 'part-partner-notes', name: 'ملاحظات الشركاء', run: () => queryTest('partner_notes', 'الملاحظات') },
    ],
  },
  {
    id: 'waste',
    name: 'إدارة النفايات',
    icon: Flame,
    description: 'فحص نظام تصنيف وتتبع النفايات',
    tests: [
      { id: 'waste-types', name: 'أنواع النفايات المخصصة', run: () => queryTest('custom_waste_types', 'أنواع النفايات') },
      { id: 'waste-register-haz', name: 'سجل النفايات الخطرة', run: () => queryTest('waste_register', 'سجل النفايات') },
      { id: 'waste-recycling', name: 'شهادات إعادة التدوير', run: () => queryTest('recycling_certificates', 'شهادات التدوير') },
      { id: 'waste-disposal-ops', name: 'عمليات التخلص', run: () => queryTest('disposal_operations', 'عمليات التخلص') },
      { id: 'waste-disposal-certs', name: 'شهادات التخلص الآمن', run: () => queryTest('disposal_certificates', 'شهادات التخلص') },
      { id: 'waste-carbon', name: 'البصمة الكربونية', run: () => queryTest('carbon_footprint_records', 'الكربون') },
    ],
  },
  {
    id: 'documents',
    name: 'المستندات والتوقيعات',
    icon: FileText,
    description: 'فحص إدارة المستندات والتوقيع الإلكتروني',
    tests: [
      { id: 'doc-templates', name: 'قوالب المستندات', run: () => queryTest('document_templates', 'القوالب') },
      { id: 'doc-signatures', name: 'التوقيعات الإلكترونية', run: () => queryTest('document_signatures', 'التوقيعات') },
      { id: 'doc-entity', name: 'مستندات الكيانات', run: () => queryTest('entity_documents', 'المستندات') },
      { id: 'doc-signatories', name: 'المفوضون بالتوقيع', run: () => queryTest('authorized_signatories', 'المفوضون') },
      { id: 'doc-verify', name: 'التحقق من المستندات', run: () => queryTest('document_verifications', 'التحقق') },
      { id: 'doc-endorsements', name: 'المصادقات', run: () => queryTest('document_endorsements', 'المصادقات') },
    ],
  },
  {
    id: 'communication',
    name: 'التواصل والإشعارات',
    icon: MessageSquare,
    description: 'فحص نظام الرسائل والإشعارات',
    tests: [
      { id: 'comm-notifications', name: 'الإشعارات', run: () => queryTest('notifications', 'الإشعارات') },
      { id: 'comm-chat-rooms', name: 'غرف المحادثة', run: () => queryTest('chat_rooms', 'الغرف') },
      { id: 'comm-chat-msgs', name: 'رسائل المحادثة', run: () => queryTest('chat_messages', 'الرسائل') },
      { id: 'comm-direct', name: 'الرسائل المباشرة', run: () => queryTest('direct_messages', 'الرسائل المباشرة') },
      { id: 'comm-calls', name: 'سجل المكالمات', run: () => queryTest('call_logs', 'المكالمات') },
      { id: 'comm-tickets', name: 'تذاكر الدعم', run: () => queryTest('support_tickets', 'التذاكر') },
    ],
  },
  {
    id: 'erp',
    name: 'نظام ERP',
    icon: Package,
    description: 'فحص نظام تخطيط الموارد',
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
    id: 'edge-functions',
    name: 'الوظائف الخلفية',
    icon: Server,
    description: 'فحص وظائف الخادم (Edge Functions)',
    tests: [
      { id: 'ef-health', name: 'مراقب صحة النظام', run: () => edgeFnTest('system-health-monitor') },
      { id: 'ef-ai-assistant', name: 'المساعد الذكي', run: () => edgeFnTest('ai-assistant', { message: 'test ping', conversation_history: [] }) },
      { id: 'ef-analytics', name: 'محرك التحليلات', run: () => edgeFnTest('analytics-engine', { action: 'ping' }) },
      { id: 'ef-notifications', name: 'إرسال الإشعارات', run: () => edgeFnTest('send-notification', { action: 'ping' }) },
      { id: 'ef-carbon', name: 'حاسبة الكربون', run: () => edgeFnTest('carbon-calculator', { action: 'ping' }) },
      { id: 'ef-smart-notif', name: 'الإشعارات الذكية', run: () => edgeFnTest('smart-notifications', { action: 'ping' }) },
    ],
  },
  {
    id: 'rpc-functions',
    name: 'دوال قاعدة البيانات',
    icon: Terminal,
    description: 'فحص الدوال المخزنة في قاعدة البيانات',
    tests: [
      { id: 'rpc-admin-stats', name: 'إحصائيات الإدارة', run: () => rpcTest('get_admin_dashboard_stats') },
      { id: 'rpc-search', name: 'البحث الشامل', run: () => rpcTest('global_search', { search_query: 'test', result_limit: 1 }) },
      { id: 'rpc-org-summary', name: 'ملخص الجهات', run: () => rpcTest('get_organization_summary') },
      { id: 'rpc-security', name: 'ملخص الأمان', run: () => rpcTest('get_security_summary') },
      { id: 'rpc-waste-analytics', name: 'تحليلات النفايات', run: () => rpcTest('get_waste_type_analytics') },
    ],
  },
  {
    id: 'advanced',
    name: 'ميزات متقدمة',
    icon: Brain,
    description: 'فحص الأنظمة المتقدمة والذكاء الاصطناعي',
    tests: [
      { id: 'adv-iot', name: 'أجهزة IoT', run: () => queryTest('iot_devices', 'أجهزة IoT') },
      { id: 'adv-iot-readings', name: 'قراءات IoT', run: () => queryTest('iot_readings', 'القراءات') },
      { id: 'adv-gps', name: 'أجهزة GPS', run: () => queryTest('gps_devices', 'أجهزة GPS') },
      { id: 'adv-badges', name: 'نظام الشارات', run: () => queryTest('badges', 'الشارات') },
      { id: 'adv-lms', name: 'الدورات التعليمية', run: () => queryTest('lms_courses', 'الدورات') },
      { id: 'adv-esg', name: 'تقارير ESG', run: () => queryTest('esg_reports', 'تقارير ESG') },
      { id: 'adv-commodity', name: 'أسعار السلع', run: () => queryTest('commodity_market_prices', 'أسعار السلع') },
      { id: 'adv-approval', name: 'طلبات الموافقة', run: () => queryTest('approval_requests', 'طلبات الموافقة') },
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
    const finalResults = Object.values(results);
    toast.success(`✅ اكتمل الفحص - ${passedTests} نجح، ${failedTests} فشل`);
  }, [categories, runSingleTest, results, passedTests, failedTests]);

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
              <p className="text-muted-foreground">فحص شامل لجميع وظائف ومكونات المنصة</p>
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
                  transition={{ delay: idx * 0.05 }}
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
