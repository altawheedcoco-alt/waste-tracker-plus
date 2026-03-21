import { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ShieldAlert, Scan, Activity, Shield, Zap, AlertTriangle, CheckCircle2,
  Clock, Eye, Loader2, Brain, Ban, Lock, Bell, Key, Database, Fingerprint,
  TrendingUp, XCircle, Target, BarChart3, Swords, FlaskConical, FileWarning,
  Globe, Server, Users, Timer, ArrowUpRight, ArrowDownRight, Gauge, MapPin,
  Wifi, WifiOff, Crosshair, Bug, Flame, ShieldCheck, TriangleAlert,
  Radio, HeartPulse, FileText, Download, RefreshCw, MonitorCheck, Satellite,
} from 'lucide-react';
import {
  useCyberThreats, useDefenseRules, useThreatPatterns, useRunThreatScan,
  useResolveThreat, useCyberStats, useCyberAdvancedStats, useZeroTrustCheck,
  useSystemHeartbeat, CyberThreat,
} from '@/hooks/useCyberSecurity';
import { useSecurityReports, useGenerateSecurityReport, SecurityReport } from '@/hooks/useSecurityReports';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

const THREAT_ICONS: Record<string, any> = {
  brute_force: Ban, sql_injection: Database, xss: AlertTriangle,
  data_exfiltration: Key, privilege_escalation: Lock, anomalous_access: Eye,
  rate_abuse: Zap, suspicious_login: Fingerprint, api_abuse: Activity,
};

const THREAT_LABELS: Record<string, string> = {
  brute_force: 'قوة غاشمة', sql_injection: 'حقن SQL', xss: 'XSS',
  data_exfiltration: 'تسريب بيانات', privilege_escalation: 'تصعيد صلاحيات',
  anomalous_access: 'وصول شاذ', rate_abuse: 'إساءة استخدام', suspicious_login: 'دخول مشبوه',
  api_abuse: 'إساءة API',
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'منخفض' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', label: 'متوسط' },
  high: { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', label: 'عالي' },
  critical: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', label: 'حرج' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  detected: { label: 'مكتشف', color: 'bg-red-500' },
  analyzing: { label: 'قيد التحليل', color: 'bg-amber-500' },
  mitigated: { label: 'تم التخفيف', color: 'bg-blue-500' },
  resolved: { label: 'تم الحل', color: 'bg-emerald-500' },
  false_positive: { label: 'إنذار كاذب', color: 'bg-gray-400' },
};

const ACTION_LABELS: Record<string, string> = {
  block_ip: 'حظر IP', lock_account: 'قفل الحساب', rate_limit: 'تقييد المعدل',
  notify_admin: 'إخطار المشرف', revoke_token: 'إلغاء الرمز', quarantine_data: 'عزل البيانات',
};

const CHART_COLORS = ['hsl(0, 80%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(45, 90%, 55%)', 'hsl(145, 60%, 45%)', 'hsl(210, 70%, 55%)', 'hsl(280, 60%, 55%)'];
const SEVERITY_COLORS: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

// Attack simulation scenarios
const ATTACK_SCENARIOS = [
  {
    id: 'ransomware', name: 'هجوم الفدية (Ransomware)', icon: Flame, risk: 'critical',
    description: 'محاكاة هجوم تشفير بيانات مع طلب فدية عبر ثغرة في ملفات مرفقة',
    methodology: 'يبدأ المهاجم بإرسال ملف مصاب عبر البريد → يتم تشغيله بواسطة الضحية → تشفير الملفات → عرض رسالة الفدية',
    indicators: ['زيادة مفاجئة في عمليات تشفير الملفات', 'محاولات اتصال بخوادم C2 خارجية', 'تغيير امتدادات ملفات بشكل جماعي'],
    countermeasures: ['نسخ احتياطي معزول (Air-gapped)', 'تدريب الموظفين على الهندسة الاجتماعية', 'فحص المرفقات بالذكاء الاصطناعي', 'تفعيل MFA على كافة الحسابات'],
    readinessChecks: ['هل يوجد نسخ احتياطي يومي؟', 'هل تم تدريب الفريق؟', 'هل يوجد خطة استجابة موثقة؟', 'هل تم اختبار استعادة النسخ الاحتياطي؟'],
  },
  {
    id: 'sql_injection', name: 'حقن SQL المتقدم', icon: Database, risk: 'high',
    description: 'محاكاة حقن استعلامات خبيثة لاستخراج بيانات حساسة من قاعدة البيانات',
    methodology: 'اكتشاف نقاط الإدخال → اختبار أنماط الحقن → استخراج هيكل DB → تسريب البيانات → محو الأثر',
    indicators: ['استعلامات UNION SELECT غير عادية', 'أخطاء SQL مكشوفة في الاستجابات', 'محاولات الوصول لجدول information_schema'],
    countermeasures: ['استخدام Parameterized Queries حصراً', 'تفعيل RLS على كافة الجداول', 'فلترة المدخلات (Input Sanitization)', 'حد أقصى لحجم الاستجابة'],
    readinessChecks: ['هل كل الاستعلامات مُعامَلة (Parameterized)؟', 'هل RLS مفعل على كل الجداول؟', 'هل يتم فحص المدخلات؟'],
  },
  {
    id: 'phishing', name: 'التصيد الاحتيالي (Phishing)', icon: Crosshair, risk: 'high',
    description: 'محاكاة هجوم تصيد موجه يستهدف بيانات دخول المستخدمين والمسؤولين',
    methodology: 'إنشاء صفحة مزيفة مطابقة → إرسال رسائل مقنعة → جمع بيانات الدخول → الوصول غير المصرح → تصعيد الصلاحيات',
    indicators: ['تسجيلات دخول من مواقع جغرافية غير معتادة', 'تغيير كلمات مرور جماعي', 'روابط مشبوهة في الرسائل'],
    countermeasures: ['المصادقة الثنائية (2FA) إلزامية', 'تدريب مستمر على كشف التصيد', 'فلترة البريد المتقدمة', 'مراقبة أنماط الدخول الجغرافية'],
    readinessChecks: ['هل MFA مفعل للمسؤولين؟', 'هل يوجد تدريب دوري؟', 'هل يتم مراقبة الدخول الجغرافي؟'],
  },
  {
    id: 'ddos', name: 'هجوم حجب الخدمة (DDoS)', icon: Wifi, risk: 'high',
    description: 'محاكاة هجوم إغراق النظام بطلبات هائلة لتعطيل الخدمة',
    methodology: 'استطلاع البنية التحتية → تحديد نقاط الضعف → إطلاق الهجوم من مصادر متعددة → إغراق الخوادم → تعطل الخدمة',
    indicators: ['زيادة مفاجئة في حركة المرور (+500%)', 'استهلاك كامل للموارد', 'تأخر استجابة API'],
    countermeasures: ['تفعيل Rate Limiting ذكي', 'استخدام CDN وحماية Cloudflare', 'تحديد حدود الطلبات لكل IP', 'خطة تدرج الموارد (Auto-scaling)'],
    readinessChecks: ['هل Rate Limiting مفعل؟', 'هل يوجد CDN؟', 'هل يوجد Auto-scaling؟'],
  },
  {
    id: 'insider_threat', name: 'التهديد الداخلي (Insider)', icon: Users, risk: 'critical',
    description: 'محاكاة سيناريو موظف يسيء استخدام صلاحياته لتسريب بيانات حساسة',
    methodology: 'تصعيد صلاحيات تدريجي → الوصول لبيانات خارج النطاق → تصدير كميات كبيرة → نقل البيانات خارجياً → محو السجلات',
    indicators: ['تصدير بيانات بكميات غير عادية', 'وصول لجداول خارج نطاق العمل', 'محاولات حذف سجلات التدقيق'],
    countermeasures: ['فصل المهام (Segregation of Duties)', 'مراقبة حجم التصدير', 'سجلات تدقيق غير قابلة للحذف', 'مراجعة الصلاحيات الدورية'],
    readinessChecks: ['هل يتم مراجعة الصلاحيات دورياً؟', 'هل سجلات التدقيق محمية؟', 'هل يوجد تنبيه للتصدير الكبير؟'],
  },
  {
    id: 'api_exploitation', name: 'استغلال API (API Exploitation)', icon: Server, risk: 'medium',
    description: 'محاكاة استغلال ثغرات في واجهات برمجة التطبيقات للوصول غير المصرح',
    methodology: 'اكتشاف Endpoints → تجاوز المصادقة → استغلال IDOR → تعديل/استخراج بيانات → إساءة استخدام الصلاحيات',
    indicators: ['طلبات API بدون مصادقة صحيحة', 'محاولات IDOR (تغيير المعرفات)', 'استدعاء endpoints غير موثقة'],
    countermeasures: ['JWT Verification إلزامي', 'التحقق من ملكية الموارد (Resource Ownership)', 'Rate Limiting لكل مفتاح', 'تسجيل كافة طلبات API'],
    readinessChecks: ['هل كل Endpoints محمية بـ JWT؟', 'هل يتم التحقق من الملكية؟', 'هل يوجد Rate Limiting؟'],
  },
];

const RESPONSE_PLAYBOOKS = [
  { phase: 'الاكتشاف', steps: ['رصد الإنذار التلقائي', 'تأكيد عدم كونه إنذار كاذب', 'تصنيف مستوى الخطورة', 'إخطار الفريق المسؤول'], icon: Eye, color: 'text-amber-500' },
  { phase: 'الاحتواء', steps: ['عزل النظام المتأثر', 'حظر مصدر الهجوم', 'تجميد الحسابات المشبوهة', 'حفظ الأدلة الرقمية'], icon: Shield, color: 'text-red-500' },
  { phase: 'الاستئصال', steps: ['تحديد نطاق الاختراق', 'إزالة البرمجيات الخبيثة', 'سد الثغرة المستغلة', 'تحديث كافة كلمات المرور'], icon: Bug, color: 'text-orange-500' },
  { phase: 'الاستعادة', steps: ['استعادة من النسخ الاحتياطي', 'إعادة تشغيل الخدمات تدريجياً', 'مراقبة مكثفة لـ 48 ساعة', 'التحقق من سلامة البيانات'], icon: ArrowUpRight, color: 'text-blue-500' },
  { phase: 'الدروس المستفادة', steps: ['توثيق الحادثة بالكامل', 'تحديث قواعد الكشف', 'تحسين خطة الاستجابة', 'تدريب الفريق على السيناريو'], icon: Brain, color: 'text-emerald-500' },
];

// Live monitoring config
const MONITOR_CHANNELS = [
  { id: 'rls', name: 'سياسات RLS', icon: Lock, desc: 'مراقبة تطبيق سياسات أمان الصفوف' },
  { id: 'auth', name: 'المصادقة', icon: Fingerprint, desc: 'مراقبة محاولات تسجيل الدخول والخروج' },
  { id: 'api', name: 'طلبات API', icon: Server, desc: 'مراقبة استدعاءات الواجهات البرمجية' },
  { id: 'db', name: 'قاعدة البيانات', icon: Database, desc: 'مراقبة عمليات القراءة والكتابة' },
  { id: 'network', name: 'الشبكة', icon: Globe, desc: 'مراقبة حركة المرور الشبكية' },
  { id: 'files', name: 'التخزين', icon: FileWarning, desc: 'مراقبة عمليات رفع وتحميل الملفات' },
];

const CyberSecurityCenter = () => {
  const [tab, setTab] = useState('monitor');
  const [selectedThreat, setSelectedThreat] = useState<CyberThreat | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('resolved');
  const [selectedScenario, setSelectedScenario] = useState<typeof ATTACK_SCENARIOS[0] | null>(null);
  const [reportPeriod, setReportPeriod] = useState('daily');

  const { data: threats = [], isLoading: threatsLoading } = useCyberThreats();
  const { data: rules = [], toggleRule } = useDefenseRules();
  const { data: patterns = [] } = useThreatPatterns();
  const { data: stats } = useCyberStats();
  const advancedStats = useCyberAdvancedStats(threats);
  const scanMutation = useRunThreatScan();
  const resolveMutation = useResolveThreat();
  const { data: reports = [], isLoading: reportsLoading } = useSecurityReports();
  const generateReport = useGenerateSecurityReport();
  const { data: zeroTrustData, isLoading: ztLoading, refresh: ztRefresh } = useZeroTrustCheck();

  // Live monitoring state
  const [monitorPulse, setMonitorPulse] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<Date>(new Date());
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState(true);
  const [monitorInterval, setMonitorInterval] = useState(30); // seconds

  // Real system heartbeat
  const { data: heartbeat } = useSystemHeartbeat(autoMonitorEnabled, monitorInterval);

  // Auto-monitoring: continuous scan
  useEffect(() => {
    if (!autoMonitorEnabled) return;
    const interval = setInterval(() => {
      setMonitorPulse(p => p + 1);
      setLastScanTime(new Date());
    }, monitorInterval * 1000);
    return () => clearInterval(interval);
  }, [autoMonitorEnabled, monitorInterval]);

  // Active threats count for live indicator
  const activeThreats = useMemo(() => threats.filter(t => t.status === 'detected' || t.status === 'analyzing'), [threats]);
  const recentThreats = useMemo(() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    return threats.filter(t => new Date(t.detected_at) > fiveMinAgo);
  }, [threats, monitorPulse]);

  const systemStatus = useMemo(() => {
    if (activeThreats.some(t => t.severity === 'critical')) return { label: 'حالة حرجة', color: 'text-red-500', bg: 'bg-red-500', pulse: 'animate-pulse' };
    if (activeThreats.some(t => t.severity === 'high')) return { label: 'تحت المراقبة', color: 'text-orange-500', bg: 'bg-orange-500', pulse: 'animate-pulse' };
    if (activeThreats.length > 0) return { label: 'تنبيه', color: 'text-amber-500', bg: 'bg-amber-500', pulse: '' };
    return { label: 'آمن ومستقر', color: 'text-emerald-500', bg: 'bg-emerald-500', pulse: '' };
  }, [activeThreats]);

  const kpis = [
    { label: 'إجمالي التهديدات', value: stats?.total || 0, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
    { label: 'تهديدات حرجة', value: stats?.critical || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20' },
    { label: 'تم التخفيف تلقائياً', value: stats?.mitigated || 0, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'تهديدات نشطة', value: stats?.active || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'درجة الأمان', value: advancedStats?.securityScore ?? '—', icon: Gauge, color: advancedStats && advancedStats.securityScore >= 70 ? 'text-emerald-500' : 'text-red-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'متوسط الاستجابة', value: advancedStats?.avgResponseTimeSec ? `${advancedStats.avgResponseTimeSec}ث` : '—', icon: Timer, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  ];

  const handleResolve = () => {
    if (!selectedThreat) return;
    resolveMutation.mutate({ id: selectedThreat.id, notes: resolveNotes, status: resolveStatus });
    setSelectedThreat(null);
    setResolveNotes('');
  };

  const typeChartData = useMemo(() => {
    if (!advancedStats) return [];
    return Object.entries(advancedStats.byType).map(([k, v]) => ({ name: THREAT_LABELS[k] || k, value: v }));
  }, [advancedStats]);

  const severityChartData = useMemo(() => {
    if (!advancedStats) return [];
    return Object.entries(advancedStats.bySeverity).map(([k, v]) => ({ name: SEVERITY_STYLES[k]?.label || k, value: v, fill: SEVERITY_COLORS[k] || '#666' }));
  }, [advancedStats]);

  const reportStatusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    clean: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20', label: 'آمن' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'تحذير' },
    critical: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', label: 'حرج' },
  };

  return (
    <DashboardLayout>
      <div dir="rtl" className="p-4 md:p-6 space-y-6">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/30 shadow-lg shadow-red-500/10 relative">
              <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
              {autoMonitorEnabled && (
                <span className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${systemStatus.bg} ${systemStatus.pulse}`} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">مركز الأمن السيبراني المتقدم</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${systemStatus.bg}`} />
                <span className={systemStatus.color}>{systemStatus.label}</span>
                <span className="mx-1">·</span>
                <span>آخر فحص: {format(lastScanTime, 'HH:mm:ss', { locale: ar })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending} variant="destructive" size="lg">
              {scanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Scan className="w-4 h-4 ml-2" />}
              {scanMutation.isPending ? 'جاري الفحص...' : 'فحص أمني شامل'}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map(k => (
            <Card key={k.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${k.bg}`}><k.icon className={`w-6 h-6 ${k.color}`} /></div>
                <div>
                  <p className="text-xl font-bold">{k.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full">
            <TabsTrigger value="monitor" className="text-xs gap-1"><Radio className="w-3.5 h-3.5" /> المراقبة الحية</TabsTrigger>
            <TabsTrigger value="zerotrust" className="text-xs gap-1"><Lock className="w-3.5 h-3.5" /> الثقة المعدومة</TabsTrigger>
            <TabsTrigger value="overview" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" /> الإحصائيات</TabsTrigger>
            <TabsTrigger value="threats" className="text-xs gap-1"><ShieldAlert className="w-3.5 h-3.5" /> التهديدات</TabsTrigger>
            <TabsTrigger value="rules" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" /> قواعد الدفاع</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs gap-1"><Brain className="w-3.5 h-3.5" /> أنماط الهجمات</TabsTrigger>
            <TabsTrigger value="simulation" className="text-xs gap-1"><Swords className="w-3.5 h-3.5" /> محاكاة الهجمات</TabsTrigger>
            <TabsTrigger value="playbook" className="text-xs gap-1"><FlaskConical className="w-3.5 h-3.5" /> خطط الاستجابة</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" /> التقارير</TabsTrigger>
          </TabsList>

          {/* ===================== LIVE MONITORING ===================== */}
          <TabsContent value="monitor" className="mt-4 space-y-4">
            {/* Live Status Banner */}
            <Card className={`border-2 ${
              systemStatus.color === 'text-red-500' ? 'border-red-300 dark:border-red-800' :
              systemStatus.color === 'text-orange-500' ? 'border-orange-300 dark:border-orange-800' :
              systemStatus.color === 'text-amber-500' ? 'border-amber-300 dark:border-amber-800' :
              'border-emerald-300 dark:border-emerald-800'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                        systemStatus.color === 'text-emerald-500' ? 'border-emerald-500' :
                        systemStatus.color === 'text-red-500' ? 'border-red-500' :
                        systemStatus.color === 'text-orange-500' ? 'border-orange-500' : 'border-amber-500'
                      }`}>
                        <HeartPulse className={`w-8 h-8 ${systemStatus.color} ${activeThreats.length > 0 ? 'animate-pulse' : ''}`} />
                      </div>
                      {autoMonitorEnabled && (
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${systemStatus.bg} border-2 border-background ${systemStatus.pulse}`} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        حالة النظام: <span className={systemStatus.color}>{systemStatus.label}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {activeThreats.length === 0
                          ? 'جميع الأنظمة تعمل بشكل طبيعي — لا توجد تهديدات نشطة'
                          : `${activeThreats.length} تهديد نشط يتطلب انتباه فوري`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        نبضة #{monitorPulse} · المراقبة {autoMonitorEnabled ? 'نشطة' : 'متوقفة'} · كل {monitorInterval} ثانية
                        {heartbeat && ` · مستخدمون نشطون: ${heartbeat.active_users_5m} · أحداث الساعة: ${heartbeat.security_events_1h}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">المراقبة التلقائية</span>
                      <Switch checked={autoMonitorEnabled} onCheckedChange={setAutoMonitorEnabled} />
                    </div>
                    <Select value={String(monitorInterval)} onValueChange={v => setMonitorInterval(Number(v))}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">كل 10 ثوانٍ</SelectItem>
                        <SelectItem value="30">كل 30 ثانية</SelectItem>
                        <SelectItem value="60">كل دقيقة</SelectItem>
                        <SelectItem value="300">كل 5 دقائق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Heartbeat KPIs */}
            {heartbeat && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'مستخدمون نشطون', value: heartbeat.active_users_5m, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
                  { label: 'أحداث أمنية (ساعة)', value: heartbeat.security_events_1h, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
                  { label: 'تسجيلات دخول (ساعة)', value: heartbeat.logins_1h, icon: Fingerprint, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                  { label: 'تهديدات حديثة (5 دقائق)', value: heartbeat.recent_threats, icon: ShieldAlert, color: heartbeat.recent_threats > 0 ? 'text-red-500' : 'text-emerald-500', bg: heartbeat.recent_threats > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20' },
                ].map(k => (
                  <Card key={k.label} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${k.bg}`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
                      <div>
                        <p className="text-lg font-bold">{k.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Monitor Channels Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MONITOR_CHANNELS.map(ch => {
                const isActive = autoMonitorEnabled;
                return (
                  <Card key={ch.id} className={`transition-all ${isActive ? 'border-emerald-200 dark:border-emerald-800/50' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted'}`}>
                            <ch.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="font-semibold text-sm">{ch.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                          <span className="text-[10px] text-muted-foreground">{isActive ? 'نشط' : 'متوقف'}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{ch.desc}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={isActive ? 100 : 0} className="h-1 flex-1" />
                        <MonitorCheck className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Threats (last 5 min) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-red-500" />
                  تهديدات مكتشفة حديثاً (آخر 5 دقائق)
                  {recentThreats.length > 0 && (
                    <Badge variant="destructive" className="text-xs animate-pulse">{recentThreats.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentThreats.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <ShieldCheck className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">لا توجد تهديدات حديثة</p>
                    <p className="text-xs">النظام تحت المراقبة المستمرة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentThreats.slice(0, 10).map(t => {
                      const Icon = THREAT_ICONS[t.threat_type] || ShieldAlert;
                      const sev = SEVERITY_STYLES[t.severity] || SEVERITY_STYLES.medium;
                      return (
                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedThreat(t)}>
                          <div className={`p-1.5 rounded-lg ${sev.bg}`}>
                            <Icon className={`w-4 h-4 ${sev.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{t.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className={`${sev.bg} ${sev.text} border-0 text-[10px]`}>{sev.label}</Badge>
                              {t.source_ip && <span className="font-mono">{t.source_ip}</span>}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(t.detected_at), { locale: ar, addSuffix: true })}
                          </span>
                          {t.auto_response_taken && <Zap className="w-4 h-4 text-blue-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Threats requiring attention */}
            {activeThreats.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    تهديدات نشطة تتطلب تدخل فوري ({activeThreats.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeThreats.map(t => {
                      const Icon = THREAT_ICONS[t.threat_type] || ShieldAlert;
                      const sev = SEVERITY_STYLES[t.severity] || SEVERITY_STYLES.medium;
                      const st = STATUS_LABELS[t.status] || STATUS_LABELS.detected;
                      return (
                        <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-red-200/50 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10 cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedThreat(t)}>
                          <div className={`p-2 rounded-lg ${sev.bg}`}>
                            <Icon className={`w-5 h-5 ${sev.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge className={`${sev.bg} ${sev.text} border-0 text-[10px]`}>{sev.label}</Badge>
                              <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${st.color}`} /><span className="text-[10px]">{st.label}</span></span>
                            </div>
                            <p className="text-sm">{t.description}</p>
                          </div>
                          <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); setSelectedThreat(t); }}>
                            معالجة
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== OVERVIEW / STATS ===================== */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {!advancedStats ? (
              <Card><CardContent className="py-16 text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد بيانات كافية بعد</p>
                <p className="text-sm">قم بتشغيل فحص أمني لتوليد بيانات التحليل</p>
              </CardContent></Card>
            ) : (
              <>
                {/* Security Score Banner */}
                <Card className={`border-2 ${advancedStats.securityScore >= 70 ? 'border-emerald-300 dark:border-emerald-800' : advancedStats.securityScore >= 40 ? 'border-amber-300 dark:border-amber-800' : 'border-red-300 dark:border-red-800'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${advancedStats.securityScore >= 70 ? 'border-emerald-500 text-emerald-600' : advancedStats.securityScore >= 40 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600'}`}>
                          <span className="text-2xl font-black">{advancedStats.securityScore}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">درجة الأمان الشاملة</h3>
                          <p className="text-sm text-muted-foreground">
                            {advancedStats.securityScore >= 70 ? '✅ النظام في حالة أمنية جيدة' : advancedStats.securityScore >= 40 ? '⚠️ يحتاج تحسينات أمنية' : '🔴 حالة أمنية حرجة — تحرك فوراً'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div><p className="text-2xl font-bold text-blue-600">{advancedStats.autoVsManual.auto}</p><p className="text-[11px] text-muted-foreground">تخفيف تلقائي</p></div>
                        <div><p className="text-2xl font-bold text-emerald-600">{advancedStats.autoVsManual.manual}</p><p className="text-[11px] text-muted-foreground">حل يدوي</p></div>
                        <div><p className="text-2xl font-bold text-red-600">{advancedStats.autoVsManual.pending}</p><p className="text-[11px] text-muted-foreground">قيد الانتظار</p></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> اتجاه التهديدات (آخر 30 يوم)</CardTitle></CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={advancedStats.last30}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="date" tickFormatter={d => d.split('-').slice(1).join('/')} tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip labelFormatter={d => `التاريخ: ${d}`} formatter={(v: number) => [`${v} تهديد`, 'العدد']} />
                          <Area type="monotone" dataKey="count" stroke="hsl(0, 80%, 55%)" fill="hsl(0, 80%, 55%)" fillOpacity={0.15} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> توزيع حسب الخطورة</CardTitle></CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={severityChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {severityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> توزيع أنواع الهجمات</CardTitle></CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={typeChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(0, 70%, 50%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> أكثر عناوين IP هجوماً</CardTitle></CardHeader>
                    <CardContent>
                      {advancedStats.topIPs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">لا توجد عناوين IP مسجلة</p>
                      ) : (
                        <div className="space-y-2">
                          {advancedStats.topIPs.map(([ip, count], i) => (
                            <div key={ip} className="flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                              <span className="font-mono text-sm flex-1">{ip}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={Math.min((count / (advancedStats.topIPs[0]?.[1] || 1)) * 100, 100)} className="w-20 h-2" />
                                <Badge variant="destructive" className="text-xs">{count}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><FileWarning className="w-5 h-5 text-amber-500" /> كيف تتم الاختراقات — تحليل المنهجيات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { title: 'الهندسة الاجتماعية', pct: 43, desc: 'استغلال العامل البشري: رسائل تصيد، مكالمات مزيفة، انتحال هوية', icon: Users, color: 'text-red-500' },
                        { title: 'ثغرات البرمجيات', pct: 26, desc: 'استغلال أخطاء في الكود أو مكتبات غير محدثة', icon: Bug, color: 'text-orange-500' },
                        { title: 'بيانات مسربة', pct: 15, desc: 'استخدام كلمات مرور مسربة من اختراقات أخرى', icon: Key, color: 'text-amber-500' },
                        { title: 'تصعيد الصلاحيات', pct: 8, desc: 'استغلال أخطاء في نظام الأدوار للوصول لصلاحيات أعلى', icon: Lock, color: 'text-purple-500' },
                        { title: 'هجمات API', pct: 5, desc: 'استغلال endpoints غير محمية أو ضعيفة المصادقة', icon: Server, color: 'text-blue-500' },
                        { title: 'هجمات داخلية', pct: 3, desc: 'موظفون أو متعاقدون يسيئون استخدام صلاحياتهم', icon: Eye, color: 'text-slate-500' },
                      ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><item.icon className={`w-4 h-4 ${item.color}`} /><span className="font-semibold text-sm">{item.title}</span></div>
                            <span className="text-lg font-black text-foreground">{item.pct}%</span>
                          </div>
                          <Progress value={item.pct} className="h-1.5 mb-2" />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ===================== THREATS ===================== */}
          <TabsContent value="threats" className="mt-4 space-y-2">
            {threatsLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            {!threatsLoading && threats.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لم يتم اكتشاف أي تهديدات</p>
                <p className="text-sm">قم بتشغيل فحص أمني شامل لتحليل النظام</p>
              </CardContent></Card>
            )}
            {threats.map(threat => {
              const Icon = THREAT_ICONS[threat.threat_type] || ShieldAlert;
              const sev = SEVERITY_STYLES[threat.severity] || SEVERITY_STYLES.medium;
              const st = STATUS_LABELS[threat.status] || STATUS_LABELS.detected;
              return (
                <Card key={threat.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedThreat(threat)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${sev.bg}`}><Icon className={`w-5 h-5 ${sev.text}`} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`${sev.bg} ${sev.text} border-0`}>{sev.label}</Badge>
                            <Badge variant="outline">{THREAT_LABELS[threat.threat_type] || threat.threat_type}</Badge>
                            <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${st.color}`} /><span className="text-xs text-muted-foreground">{st.label}</span></div>
                            {threat.auto_response_taken && <Badge variant="secondary" className="text-xs"><Zap className="w-3 h-3 ml-0.5" /> استجابة تلقائية</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{threat.description}</p>
                          {threat.source_ip && <p className="text-xs font-mono mt-1 text-muted-foreground">IP: {threat.source_ip}</p>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(threat.detected_at), 'dd/MM HH:mm', { locale: ar })}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ===================== DEFENSE RULES ===================== */}
          <TabsContent value="rules" className="mt-4 space-y-3">
            {rules.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">لا توجد قواعد دفاع — سيتم إنشاؤها عند أول فحص</CardContent></Card>
            )}
            {rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{rule.rule_name}</span>
                      <Badge variant="outline">{THREAT_LABELS[rule.threat_type] || rule.threat_type}</Badge>
                      <Badge variant="outline" className={SEVERITY_STYLES[rule.severity_trigger]?.bg + ' ' + SEVERITY_STYLES[rule.severity_trigger]?.text + ' border-0'}>≥ {SEVERITY_STYLES[rule.severity_trigger]?.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {ACTION_LABELS[rule.action_type] || rule.action_type}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> تهدئة: {rule.cooldown_minutes} دقيقة</span>
                      {rule.trigger_count > 0 && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> تفعيل: {rule.trigger_count} مرة</span>}
                    </div>
                  </div>
                  <Switch checked={rule.is_enabled} onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, enabled: v })} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ===================== PATTERNS ===================== */}
          <TabsContent value="patterns" className="mt-4 space-y-2">
            {patterns.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">لم يتم اكتشاف أنماط بعد — قم بتشغيل الفحص أولاً</CardContent></Card>
            )}
            {patterns.map(pattern => (
              <Card key={pattern.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm font-mono">{pattern.pattern_name}</span>
                        <Badge variant="outline">{pattern.pattern_type}</Badge>
                        {pattern.is_whitelisted && <Badge variant="secondary">مستثنى</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>ظهور: {pattern.occurrence_count} مرة</span>
                        <span>أول رصد: {format(new Date(pattern.first_seen_at), 'dd/MM/yyyy', { locale: ar })}</span>
                        <span>آخر رصد: {format(new Date(pattern.last_seen_at), 'dd/MM/yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`text-lg font-bold ${pattern.risk_score >= 70 ? 'text-red-600' : pattern.risk_score >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{pattern.risk_score}%</div>
                      <span className="text-[10px] text-muted-foreground">خطورة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ===================== ATTACK SIMULATION ===================== */}
          <TabsContent value="simulation" className="mt-4 space-y-4">
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
              <CardContent className="p-4 flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">مركز محاكاة الهجمات والاستعداد</p>
                  <p className="text-xs text-muted-foreground">دراسة سيناريوهات الهجمات المحتملة وتقييم جاهزية النظام للتصدي لها.</p>
                </div>
              </CardContent>
            </Card>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ATTACK_SCENARIOS.map(scenario => {
                const ScIcon = scenario.icon;
                const riskStyle = SEVERITY_STYLES[scenario.risk] || SEVERITY_STYLES.medium;
                return (
                  <Card key={scenario.id} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5" onClick={() => setSelectedScenario(scenario)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${riskStyle.bg}`}><ScIcon className={`w-6 h-6 ${riskStyle.text}`} /></div>
                        <Badge className={`${riskStyle.bg} ${riskStyle.text} border-0`}>{riskStyle.label}</Badge>
                      </div>
                      <h3 className="font-bold text-sm mb-1">{scenario.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{scenario.description}</p>
                      <div className="flex items-center gap-1 text-xs text-primary"><Eye className="w-3 h-3" /><span>عرض التفاصيل والاستعداد</span></div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ===================== PLAYBOOK ===================== */}
          <TabsContent value="playbook" className="mt-4 space-y-4">
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10">
              <CardContent className="p-4">
                <h3 className="font-bold flex items-center gap-2 mb-1"><FlaskConical className="w-5 h-5 text-blue-500" /> دليل الاستجابة للحوادث (Incident Response)</h3>
                <p className="text-xs text-muted-foreground">خطة منهجية من 5 مراحل للتعامل مع أي حادث أمني</p>
              </CardContent>
            </Card>
            <div className="relative">
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              <div className="space-y-4">
                {RESPONSE_PLAYBOOKS.map((phase, idx) => (
                  <Card key={phase.phase} className="md:mr-10 relative">
                    <div className={`absolute -right-[2.85rem] top-6 w-4 h-4 rounded-full border-2 border-background hidden md:block ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-red-500' : idx === 2 ? 'bg-orange-500' : idx === 3 ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-muted/50"><phase.icon className={`w-5 h-5 ${phase.color}`} /></div>
                        <div><Badge variant="outline" className="mb-0.5">المرحلة {idx + 1}</Badge><h4 className="font-bold text-sm">{phase.phase}</h4></div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {phase.steps.map((step, si) => (
                          <div key={si} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px] font-bold">{si + 1}</span></div>
                            <span className="text-xs">{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> قائمة فحص الاستعداد الأمني</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { q: 'المصادقة الثنائية (MFA) مفعلة للمسؤولين', critical: true },
                    { q: 'سياسات RLS مفعلة على كافة الجداول', critical: true },
                    { q: 'النسخ الاحتياطي يعمل يومياً', critical: true },
                    { q: 'JWT Verification مفعل على Edge Functions', critical: true },
                    { q: 'Rate Limiting مفعل على API', critical: false },
                    { q: 'سجلات التدقيق غير قابلة للحذف', critical: false },
                    { q: 'تدريب الفريق على الهندسة الاجتماعية', critical: false },
                    { q: 'خطة استجابة للحوادث موثقة', critical: false },
                    { q: 'فحص أمني دوري (أسبوعي)', critical: false },
                    { q: 'مراجعة الصلاحيات شهرياً', critical: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${item.critical ? 'bg-red-500' : 'bg-amber-400'}`} />
                      <span className="text-xs flex-1">{item.q}</span>
                      {item.critical && <Badge variant="destructive" className="text-[9px]">حرج</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== REPORTS ===================== */}
          <TabsContent value="reports" className="mt-4 space-y-4">
            {/* Generate Report */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm">إصدار تقرير أمني</p>
                      <p className="text-xs text-muted-foreground">يصدر تقرير شامل عن حالة الأمن سواء وُجدت تهديدات أو لم تُوجد</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={reportPeriod} onValueChange={setReportPeriod}>
                      <SelectTrigger className="w-32 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">ساعة</SelectItem>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => generateReport.mutate({ period: reportPeriod })} disabled={generateReport.isPending}>
                      {generateReport.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <FileText className="w-4 h-4 ml-2" />}
                      إصدار تقرير
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            {reportsLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            {!reportsLoading && reports.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد تقارير بعد</p>
                <p className="text-sm">قم بإصدار أول تقرير أمني دوري</p>
              </CardContent></Card>
            )}
            {reports.map((report: SecurityReport) => {
              const cfg = reportStatusConfig[report.status] || reportStatusConfig.clean;
              const StatusIcon = cfg.icon;
              const periodLabels: Record<string, string> = { hourly: 'ساعي', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري' };
              const typeLabels: Record<string, string> = { periodic: 'دوري', incident: 'حادثة', on_demand: 'عند الطلب' };
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                          <Badge variant="outline">{periodLabels[report.report_period] || report.report_period}</Badge>
                          <Badge variant="secondary">{typeLabels[report.report_type] || report.report_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{report.summary}</p>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-3 text-xs mb-2">
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5 text-primary" />
                            <span className="font-bold">{report.security_score}/100</span>
                          </div>
                          {report.total_threats > 0 && (
                            <>
                              <span className="text-muted-foreground">|</span>
                              <span>إجمالي: {report.total_threats}</span>
                              {report.critical_threats > 0 && <span className="text-red-600">حرج: {report.critical_threats}</span>}
                              {report.high_threats > 0 && <span className="text-orange-600">عالي: {report.high_threats}</span>}
                              <span className="text-emerald-600">تم المعالجة: {report.threats_mitigated}</span>
                              {report.threats_pending > 0 && <span className="text-amber-600">معلق: {report.threats_pending}</span>}
                            </>
                          )}
                        </div>

                        {/* Recommendations */}
                        {report.recommendations && (report.recommendations as string[]).length > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-muted/50 border">
                            <p className="text-[11px] font-semibold mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> التوصيات:</p>
                            <ul className="space-y-0.5">
                              {(report.recommendations as string[]).map((rec, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                                  <span className="mt-0.5">•</span> {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* ===================== THREAT DETAIL DIALOG ===================== */}
        <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
          <DialogContent dir="rtl" className="max-w-xl max-h-[80vh] overflow-y-auto">
            {selectedThreat && (() => {
              const Icon = THREAT_ICONS[selectedThreat.threat_type] || ShieldAlert;
              const sev = SEVERITY_STYLES[selectedThreat.severity];
              const st = STATUS_LABELS[selectedThreat.status];
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Icon className={`w-5 h-5 ${sev.text}`} />{THREAT_LABELS[selectedThreat.threat_type]} — {sev.label}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`${sev.bg} ${sev.text} border-0`}>{sev.label}</Badge>
                      <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${st.color}`} /><span className="text-xs">{st.label}</span></div>
                    </div>
                    <p className="text-sm">{selectedThreat.description}</p>
                    {selectedThreat.source_ip && <div className="text-sm"><span className="font-medium">IP المصدر:</span> <span className="font-mono">{selectedThreat.source_ip}</span></div>}
                    {selectedThreat.auto_response_taken && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium flex items-center gap-1"><Zap className="w-4 h-4 text-blue-500" /> استجابة تلقائية</p>
                        <p className="text-sm mt-1">{ACTION_LABELS[selectedThreat.auto_response_taken] || selectedThreat.auto_response_taken}</p>
                        {selectedThreat.auto_response_at && <p className="text-xs text-muted-foreground mt-1">{format(new Date(selectedThreat.auto_response_at), 'dd/MM/yyyy HH:mm')}</p>}
                      </div>
                    )}
                    {selectedThreat.ai_analysis && (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-medium flex items-center gap-1 mb-1"><Brain className="w-4 h-4 text-primary" /> تحليل الذكاء الاصطناعي</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedThreat.ai_analysis}</p>
                        {selectedThreat.ai_confidence && <Badge variant="secondary" className="mt-2 text-xs">ثقة: {selectedThreat.ai_confidence}%</Badge>}
                      </div>
                    )}
                    {selectedThreat.evidence && Object.keys(selectedThreat.evidence).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">الأدلة</p>
                        <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto" dir="ltr">{JSON.stringify(selectedThreat.evidence, null, 2)}</pre>
                      </div>
                    )}
                    {selectedThreat.status !== 'resolved' && selectedThreat.status !== 'false_positive' && (
                      <div className="space-y-3 border-t pt-3">
                        <Select value={resolveStatus} onValueChange={setResolveStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resolved">تم الحل</SelectItem>
                            <SelectItem value="false_positive">إنذار كاذب</SelectItem>
                            <SelectItem value="mitigated">تم التخفيف</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} placeholder="ملاحظات الحل..." rows={2} />
                        <Button onClick={handleResolve} className="w-full" disabled={resolveMutation.isPending}>
                          {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}
                          تحديث الحالة
                        </Button>
                      </div>
                    )}
                    {selectedThreat.resolution_notes && (
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                        <p className="text-sm font-medium">ملاحظات الحل</p>
                        <p className="text-sm mt-1">{selectedThreat.resolution_notes}</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ===================== SCENARIO DETAIL DIALOG ===================== */}
        <Dialog open={!!selectedScenario} onOpenChange={() => setSelectedScenario(null)}>
          <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedScenario && (() => {
              const ScIcon = selectedScenario.icon;
              const riskStyle = SEVERITY_STYLES[selectedScenario.risk] || SEVERITY_STYLES.medium;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><ScIcon className={`w-5 h-5 ${riskStyle.text}`} />{selectedScenario.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5">
                    <Badge className={`${riskStyle.bg} ${riskStyle.text} border-0`}>مستوى الخطورة: {riskStyle.label}</Badge>
                    <p className="text-sm">{selectedScenario.description}</p>
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800">
                      <h4 className="font-bold text-sm flex items-center gap-2 mb-2"><Swords className="w-4 h-4 text-red-500" /> منهجية الهجوم</h4>
                      <p className="text-sm text-muted-foreground">{selectedScenario.methodology}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-amber-500" /> مؤشرات الاكتشاف (IoC)</h4>
                      <div className="space-y-2">
                        {selectedScenario.indicators.map((ind, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/50">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /><span className="text-xs">{ind}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-blue-500" /> إجراءات الحماية والتصدي</h4>
                      <div className="space-y-2">
                        {selectedScenario.countermeasures.map((cm, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/10 border border-blue-200/50 dark:border-blue-800/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" /><span className="text-xs">{cm}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> قائمة فحص الاستعداد</h4>
                      <div className="space-y-2">
                        {selectedScenario.readinessChecks.map((check, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/50">
                            <div className="w-5 h-5 rounded border-2 border-emerald-400 shrink-0" /><span className="text-xs">{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CyberSecurityCenter;
