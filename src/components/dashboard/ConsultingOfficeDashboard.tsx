import { memo, useState, lazy, Suspense } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2, Users, FileText, BarChart3, Loader2,
  ShieldCheck, ClipboardCheck, TrendingUp,
  AlertTriangle, Bot, Send,
  Sparkles, Target, UserPlus, Star, Award,
  Lightbulb, Activity, Clock, Shield, Scale,
  Stamp, Settings, Upload,
} from 'lucide-react';

// Lazy load panels
const OfficeTeamPanel = lazy(() => import('@/components/consulting-office/OfficeTeamPanel'));
const OfficeClientsPanel = lazy(() => import('@/components/consulting-office/OfficeClientsPanel'));
const ApprovalQueuePanel = lazy(() => import('@/components/consulting-office/ApprovalQueuePanel'));
const OfficeDocumentsPanel = lazy(() => import('@/components/consulting-office/OfficeDocumentsPanel'));
const OfficeLicensesPanel = lazy(() => import('@/components/consulting-office/OfficeLicensesPanel'));
const OfficeSettingsPanel = lazy(() => import('@/components/consulting-office/OfficeSettingsPanel'));
const ConsultantKPIsWidget = lazy(() => import('@/components/compliance/ConsultantKPIsWidget'));
const ConsultantAnalyticsPanel = lazy(() => import('@/components/consultant/ConsultantAnalyticsPanel'));
const ConsultantSmartAlerts = lazy(() => import('@/components/consultant/ConsultantSmartAlerts'));
const DocumentVerificationWidget = lazy(() => import('@/components/dashboard/DocumentVerificationWidget'));
const RegulatoryDocumentsCenter = lazy(() => import('@/components/regulatory/RegulatoryDocumentsCenter'));
const ConsultantQuickFAB = lazy(() => import('@/components/consultant/ConsultantQuickFAB'));

import OfficeWorkloadBalance from '@/components/consulting-office/OfficeWorkloadBalance';


const LazyLoader = () => <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

// ═══ AI Office Assistant ═══
const OfficeAIAssistant = memo(({ organization, consultantCount, clientCount }: { organization: any; consultantCount: number; clientCount: number }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const resp = await supabase.functions.invoke('ai-consultant-assistant', {
        body: {
          question: question.trim(),
          context: { officeName: organization?.name, consultantCount, clientCount, mode: 'office' },
        },
      });
      if (resp.error) throw resp.error;
      setAnswer(resp.data?.answer || 'لم أتمكن من الإجابة.');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'كيف أوزع المهام على فريق الاستشاريين بكفاءة؟',
    'اقترح خطة عمل شهرية للمكتب',
    'ما أفضل ممارسات إدارة ملفات العملاء؟',
    'تحليل أداء المكتب وتوصيات التحسين',
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />المساعد الذكي لإدارة المكتب
        </CardTitle>
        <CardDescription>أدوات ذكية لتحسين أداء المكتب وإدارة الفريق</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => setQuestion(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Lightbulb className="w-3 h-3 inline ml-1 text-amber-500" />{q.slice(0, 35)}...
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="اسأل عن إدارة المكتب أو الامتثال البيئي..." className="min-h-[60px] text-sm resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(); } }} />
          <Button onClick={askAI} disabled={loading || !question.trim()} size="sm" className="self-end gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <AnimatePresence>
          {answer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border text-sm leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                <Sparkles className="w-4 h-4" />إجابة المساعد الذكي
              </div>
              {answer}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
});
OfficeAIAssistant.displayName = 'OfficeAIAssistant';

// ═══ Team Performance Widget ═══
const TeamPerformance = memo(({ members, clients }: { members: any[]; clients: any[] }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Activity className="w-5 h-5 text-purple-600" />أداء فريق المكتب
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا يوجد استشاريون مسجلون بعد</p>
      ) : (
        members.map((m: any) => {
          const clientsCount = clients.filter((c: any) => c.consultant_id === m.consultant_id).length;
          const performance = Math.min(100, clientsCount * 25 + 40);
          return (
            <div key={m.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {m.consultant?.full_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{m.consultant?.full_name}</span>
                  <Badge variant="outline" className="text-[9px]">{m.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{clientsCount} عملاء</Badge>
                  <span className="text-xs font-mono text-muted-foreground">{performance}%</span>
                </div>
              </div>
              <Progress value={performance} className="h-1.5" />
            </div>
          );
        })
      )}
    </CardContent>
  </Card>
));
TeamPerformance.displayName = 'TeamPerformance';

// ═══ Office Task Board ═══
const OfficeTaskBoard = memo(({ members }: { members: any[] }) => {
  const tasks = [
    { title: 'مراجعة امتثال ربع سنوي', assignee: members[0]?.consultant?.full_name || '-', status: 'pending', priority: 'high' },
    { title: 'تحديث تراخيص العملاء', assignee: members[1]?.consultant?.full_name || members[0]?.consultant?.full_name || '-', status: 'in_progress', priority: 'medium' },
    { title: 'إعداد تقارير ESG', assignee: members[0]?.consultant?.full_name || '-', status: 'done', priority: 'low' },
    { title: 'زيارة تفتيشية ميدانية', assignee: members[1]?.consultant?.full_name || '-', status: 'pending', priority: 'high' },
  ];
  const statusLabels: Record<string, string> = { pending: 'قيد الانتظار', in_progress: 'جاري التنفيذ', done: 'مكتمل' };
  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', in_progress: 'bg-primary/10 text-primary', done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-amber-600" />لوحة مهام المكتب
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-[11px] text-muted-foreground">المسؤول: {task.assignee}</p>
              </div>
              <Badge className={`text-[10px] ${statusColors[task.status]}`}>{statusLabels[task.status]}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
OfficeTaskBoard.displayName = 'OfficeTaskBoard';

// ═══ Main Dashboard ═══
const ConsultingOfficeDashboard = memo(() => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const {
    office, members, clients, pendingApprovals,
    loadingOffice, loadingMembers, isDirector, createOffice,
  } = useConsultingOffice();

  if (loadingOffice) {
    return (
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}
        </div>
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            لوحة تحكم المكتب الاستشاري
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {organization?.name} — إدارة الفريق والعملاء والامتثال
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/environmental-consultants')} className="gap-1.5">
            <Users className="w-4 h-4" />إدارة الاستشاريين
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/employee-management')} className="gap-1.5">
            <UserPlus className="w-4 h-4" />إدارة الموظفين
          </Button>
        </div>
      </div>


      {/* Office Identity Card */}
      {office ? (
        <Card className="border-primary/30 bg-gradient-to-l from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                {office.office_name?.charAt(0) || 'M'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{office.office_name}</p>
                <p className="text-sm text-muted-foreground">مكتب استشارات بيئية — كيان مؤسسي</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    <Building2 className="w-3 h-3 ml-1" />مكتب مؤسسي
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <Users className="w-3 h-3 ml-1" />{members.length} استشاري
                  </Badge>
                  {office.license_number && (
                    <Badge variant="outline" className="text-[10px]">
                      <Shield className="w-3 h-3 ml-1" />ترخيص: {office.license_number}
                    </Badge>
                  )}
                  {isDirector && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Star className="w-3 h-3 ml-1" />أنت المدير
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <Badge variant="outline" className="font-mono text-primary text-sm">
                  {(organization as any)?.partner_code || 'COF-XXXX'}
                </Badge>
                <Badge variant="default">✅ مكتب نشط</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="font-bold mb-1">لم يتم إنشاء ملف المكتب الاستشاري بعد</p>
            <p className="text-sm text-muted-foreground mb-4">أنشئ ملف المكتب لتفعيل جميع الأدوات</p>
            <Button onClick={() => createOffice.mutateAsync({ office_name: organization?.name || '' })} 
              disabled={createOffice.isPending} className="gap-2">
              <Building2 className="w-4 h-4" />إنشاء ملف المكتب
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Users} label="الاستشاريون" value={members.length} color="text-primary" />
        <StatCard icon={Building2} label="العملاء" value={clients.length} color="text-emerald-600" />
        <StatCard icon={Clock} label="طلبات اعتماد" value={pendingApprovals.length} color="text-amber-600" />
        <StatCard icon={FileText} label="التقارير" value={0} color="text-purple-600" />
        <StatCard icon={Star} label="تقييم المكتب" value="4.6" color="text-orange-600" isText />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: UserPlus, label: 'إضافة استشاري', desc: 'ربط أو إنشاء', tab: 'team' },
          { icon: Building2, label: 'تعيين جهة', desc: 'ربط عميل جديد', tab: 'clients' },
          { icon: Stamp, label: 'اعتماد مستند', desc: `${pendingApprovals.length} معلق`, tab: 'approvals' },
          { icon: Upload, label: 'تفويضات وتوكيلات', desc: 'رفع مستندات رسمية', tab: 'documents' },
          { icon: Award, label: 'التراخيص', desc: 'تراخيص المكتب والفريق', tab: 'licenses' },
        ].map((action, i) => (
          <motion.button key={i} onClick={() => setActiveTab(action.tab)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
              <action.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
            <span className="text-[9px] text-muted-foreground">{action.desc}</span>
          </motion.button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-4 h-4" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="w-4 h-4" />الفريق ({members.length})</TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5"><Building2 className="w-4 h-4" />العملاء ({clients.length})</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5 relative">
            <Stamp className="w-4 h-4" />التوقيع والاعتماد
            {pendingApprovals.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5"><FileText className="w-4 h-4" />المستندات والتفويضات</TabsTrigger>
          <TabsTrigger value="licenses" className="gap-1.5"><ShieldCheck className="w-4 h-4" />التراخيص</TabsTrigger>
          <TabsTrigger value="regulatory" className="gap-1.5"><Scale className="w-4 h-4" />المستندات التنظيمية</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><TrendingUp className="w-4 h-4" />التحليلات</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="gap-1.5"><Bot className="w-4 h-4" />المساعد الذكي</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Smart Alerts */}
          <Suspense fallback={<LazyLoader />}>
            <ConsultantSmartAlerts
              officeId={office?.id}
              mode="office"
              onNavigate={setActiveTab}
            />
          </Suspense>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamPerformance members={members} clients={clients} />
            <OfficeTaskBoard members={members} />
          </div>
          <Suspense fallback={<LazyLoader />}>
            <ConsultantKPIsWidget />
          </Suspense>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <ErrorBoundary fallbackTitle="خطأ في بيانات الفريق">
            <Suspense fallback={<LazyLoader />}>
              <OfficeTeamPanel />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <ErrorBoundary fallbackTitle="خطأ في بيانات العملاء">
            <Suspense fallback={<LazyLoader />}>
              <OfficeClientsPanel />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <ErrorBoundary fallbackTitle="خطأ في طلبات الموافقة">
            <Suspense fallback={<LazyLoader />}>
              <ApprovalQueuePanel />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-6">
          {/* Delegations & Authorizations Notice */}
          <Card className="border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">التفويضات والتوكيلات الرسمية</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    يعمل المكتب وموظفوه مع الجهات بموجب مستندات قانونية رسمية (توكيلات، تفويضات، عقود). 
                    يجب رفع هذه المستندات هنا لتوثيقها وربطها بالجهات المعنية.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Suspense fallback={<LazyLoader />}>
            <OfficeDocumentsPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="licenses" className="mt-4">
          <Suspense fallback={<LazyLoader />}>
            <OfficeLicensesPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="regulatory" className="mt-4">
          <Suspense fallback={<LazyLoader />}>
            <RegulatoryDocumentsCenter />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Suspense fallback={<LazyLoader />}>
            <ConsultantAnalyticsPanel officeId={office?.id} mode="office" />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Suspense fallback={<LazyLoader />}>
            <OfficeSettingsPanel />
          </Suspense>
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-4 space-y-6">
          <OfficeAIAssistant organization={organization} consultantCount={members.length} clientCount={clients.length} />
        </TabsContent>
      </Tabs>
      <Suspense fallback={null}>
        <DocumentVerificationWidget open={showDocumentVerification} onOpenChange={setShowDocumentVerification} />
      </Suspense>
    </div>
  );
});

const StatCard = ({ icon: Icon, label, value, color, isText }: { icon: any; label: string; value: number | string; color: string; isText?: boolean }) => (
  <Card>
    <CardContent className="p-4 text-right">
      <div className="flex items-center justify-between">
        <Icon className={`w-8 h-8 ${color} opacity-60`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

ConsultingOfficeDashboard.displayName = 'ConsultingOfficeDashboard';
export default ConsultingOfficeDashboard;
