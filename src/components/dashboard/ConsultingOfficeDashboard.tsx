import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Users, FileText, BarChart3, Eye, Loader2,
  Briefcase, MapPin, ShieldCheck, ClipboardCheck, TrendingUp,
  AlertTriangle, CheckCircle2, GraduationCap, Bot, Send,
  Sparkles, Target, UserPlus, Calendar, Star, Award,
  Lightbulb, PieChart, Activity, Zap, Clock,
} from 'lucide-react';
import ConsultantKPIsWidget from '@/components/compliance/ConsultantKPIsWidget';

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
          context: {
            officeName: organization?.name,
            consultantCount,
            clientCount,
            mode: 'office',
          },
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
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-blue-600" />
          المساعد الذكي لإدارة المكتب
        </CardTitle>
        <CardDescription>أدوات ذكية لتحسين أداء المكتب وإدارة الفريق</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, i) => (
            <button key={i} onClick={() => setQuestion(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-full border border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
              <Lightbulb className="w-3 h-3 inline ml-1 text-amber-500" />{q.slice(0, 35)}...
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="اسأل عن إدارة المكتب أو الامتثال البيئي..."
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(); } }}
          />
          <Button onClick={askAI} disabled={loading || !question.trim()} size="sm" className="self-end gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <AnimatePresence>
          {answer && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border text-sm leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
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
const TeamPerformance = memo(({ consultants, clientOrgs }: { consultants: any[]; clientOrgs: any[] }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-purple-600" />
          أداء فريق المكتب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {consultants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا يوجد استشاريون مسجلون بعد</p>
        ) : (
          consultants.map((c: any) => {
            const clientsCount = clientOrgs.filter((co: any) => co.consultant?.id === c.id).length;
            const performance = Math.min(100, clientsCount * 25 + 40);
            return (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold">
                      {c.full_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{c.full_name}</span>
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
  );
});
TeamPerformance.displayName = 'TeamPerformance';

// ═══ Office Task Board ═══
const OfficeTaskBoard = memo(({ consultants, clientOrgs }: { consultants: any[]; clientOrgs: any[] }) => {
  const tasks = [
    { title: 'مراجعة امتثال ربع سنوي', assignee: consultants[0]?.full_name || '-', status: 'pending', priority: 'high' },
    { title: 'تحديث تراخيص العملاء', assignee: consultants[1]?.full_name || consultants[0]?.full_name || '-', status: 'in_progress', priority: 'medium' },
    { title: 'إعداد تقارير ESG', assignee: consultants[0]?.full_name || '-', status: 'done', priority: 'low' },
    { title: 'زيارة تفتيشية ميدانية', assignee: consultants[1]?.full_name || '-', status: 'pending', priority: 'high' },
  ];

  const statusLabels = { pending: 'قيد الانتظار', in_progress: 'جاري التنفيذ', done: 'مكتمل' };
  const statusColors = { pending: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', done: 'bg-emerald-100 text-emerald-700' };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-amber-600" />
          لوحة مهام المكتب
        </CardTitle>
        <CardDescription>المهام الموزعة على فريق الاستشاريين</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-[11px] text-muted-foreground">المسؤول: {task.assignee}</p>
              </div>
              <Badge className={`text-[10px] ${statusColors[task.status as keyof typeof statusColors]}`}>
                {statusLabels[task.status as keyof typeof statusLabels]}
              </Badge>
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
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: officeConsultants = [], isLoading: loadingConsultants } = useQuery({
    queryKey: ['office-consultants', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data: members } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, email')
        .eq('organization_id', organization.id);
      if (!members?.length) return [];
      const userIds = members.map(m => m.user_id);
      const { data: consultants } = await supabase
        .from('environmental_consultants')
        .select('*')
        .in('user_id', userIds);
      return (consultants || []).map((c: any) => ({
        ...c,
        memberProfile: members.find(m => m.user_id === c.user_id),
      }));
    },
    enabled: !!organization?.id,
  });

  const { data: clientOrgs = [], isLoading: loadingClients } = useQuery({
    queryKey: ['office-clients', officeConsultants.map((c: any) => c.id)],
    queryFn: async () => {
      const consultantIds = officeConsultants.map((c: any) => c.id).filter(Boolean);
      if (!consultantIds.length) return [];
      const { data } = await supabase
        .from('consultant_organization_assignments')
        .select(`*, organization:organizations(id, name, organization_type, city, logo_url),
          consultant:environmental_consultants(id, full_name, consultant_code)`)
        .in('consultant_id', consultantIds)
        .eq('is_active', true);
      return data || [];
    },
    enabled: officeConsultants.length > 0,
  });

  const orgTypeLabels: Record<string, string> = {
    generator: 'مولد مخلفات', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص نهائي',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            لوحة تحكم المكتب الاستشاري
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {organization?.name} — إدارة الفريق والعملاء والامتثال
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/environmental-consultants')} className="gap-1.5">
            <Users className="w-4 h-4" />
            إدارة الاستشاريين
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/employee-management')} className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            إدارة الموظفين
          </Button>
        </div>
      </div>

      {/* Office Identity Card */}
      <Card className="border-blue-200 bg-gradient-to-l from-blue-50/80 to-transparent dark:from-blue-950/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
              {organization?.name?.charAt(0) || 'M'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{organization?.name}</p>
              <p className="text-sm text-muted-foreground">مكتب استشارات بيئية — كيان مؤسسي</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">
                  <Building2 className="w-3 h-3 ml-1" />
                  مكتب مؤسسي
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Users className="w-3 h-3 ml-1" />
                  {officeConsultants.length} استشاري
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              <Badge variant="outline" className="font-mono text-blue-700 text-sm">
                {(organization as any)?.partner_code || 'COF-XXXX'}
              </Badge>
              <Badge variant="default">✅ مكتب نشط</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Users} label="الاستشاريون" value={officeConsultants.length} color="text-blue-600" />
        <StatCard icon={Building2} label="العملاء" value={clientOrgs.length} color="text-emerald-600" />
        <StatCard icon={FileText} label="التقارير" value={0} color="text-amber-600" />
        <StatCard icon={CheckCircle2} label="المراجعات" value={0} color="text-purple-600" />
        <StatCard icon={Star} label="تقييم المكتب" value="4.6" color="text-orange-600" isText />
      </div>

      {/* Quick Actions for Office */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: UserPlus, label: 'إضافة استشاري', color: 'bg-blue-500', path: '/consultant-portal' },
          { icon: FileText, label: 'تقرير شامل', color: 'bg-emerald-500', path: '/dashboard/reports' },
          { icon: Target, label: 'توزيع المهام', color: 'bg-purple-500', path: '/dashboard/employee-management' },
          { icon: Eye, label: 'مراجعة عملاء', color: 'bg-amber-500', path: '/dashboard/partners' },
          { icon: Award, label: 'شهادات المكتب', color: 'bg-rose-500', path: '/dashboard/pride-certificates' },
        ].map((action, i) => (
          <motion.button key={i} onClick={() => navigate(action.path)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all">
            <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-sm`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-4 h-4" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="w-4 h-4" />فريق الاستشاريين ({officeConsultants.length})</TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5"><Building2 className="w-4 h-4" />العملاء ({clientOrgs.length})</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="gap-1.5"><Bot className="w-4 h-4" />المساعد الذكي</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5"><ClipboardCheck className="w-4 h-4" />الامتثال</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamPerformance consultants={officeConsultants} clientOrgs={clientOrgs} />
            <OfficeTaskBoard consultants={officeConsultants} clientOrgs={clientOrgs} />
          </div>
          <ConsultantKPIsWidget />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />فريق الاستشاريين</CardTitle>
                  <CardDescription>الاستشاريون المسجلون تحت هذا المكتب — يمكنك إدارتهم وتوزيع العملاء عليهم</CardDescription>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => navigate('/consultant-portal')}>
                  <UserPlus className="w-4 h-4" />إضافة استشاري
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingConsultants ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : officeConsultants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا يوجد استشاريون مسجلون</p>
                  <p className="text-sm mt-1">يمكن لأعضاء المكتب التسجيل عبر بوابة الاستشاريين</p>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/consultant-portal')}>
                    <GraduationCap className="w-4 h-4" />بوابة التسجيل
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {officeConsultants.map((c: any) => {
                    const assignedClients = clientOrgs.filter((co: any) => co.consultant?.id === c.id).length;
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                {c.full_name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">{c.full_name}</p>
                                <p className="text-xs text-muted-foreground">{c.specialization || 'استشاري عام'}</p>
                              </div>
                              <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">
                                {c.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{assignedClients} عملاء</span>
                              <Badge variant="outline" className="text-[10px] font-mono">{c.consultant_code}</Badge>
                            </div>
                            {c.license_number && (
                              <p className="text-[11px] text-muted-foreground">ترخيص: {c.license_number}</p>
                            )}
                            {c.memberProfile?.phone && (
                              <p className="text-[11px] text-muted-foreground">📱 {c.memberProfile.phone}</p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />عملاء المكتب</CardTitle>
              <CardDescription>جميع الجهات التي يشرف عليها استشاريو المكتب — إدارة مركزية</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : clientOrgs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا توجد جهات عميلة بعد</p>
                  <p className="text-sm mt-1">سيتم عرض الجهات التي تعيّن أحد استشاريي المكتب</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientOrgs.map((a: any) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {a.organization?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{a.organization?.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px]">
                                  {orgTypeLabels[a.organization?.organization_type] || a.organization?.organization_type}
                                </Badge>
                                {a.organization?.city && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />{a.organization.city}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-2">
                            المسؤول: {a.consultant?.full_name} ({a.consultant?.consultant_code})
                          </p>
                          <Button variant="outline" size="sm" className="w-full gap-1.5"
                            onClick={() => navigate(`/dashboard/organization/${a.organization?.id}`)}>
                            <Eye className="w-3.5 h-3.5" />عرض ملف العميل
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-4 space-y-6">
          <OfficeAIAssistant organization={organization} consultantCount={officeConsultants.length} clientCount={clientOrgs.length} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ConsultantKPIsWidget />
        </TabsContent>
      </Tabs>
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
