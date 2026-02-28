import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  ShieldCheck, Building2, FileText, Users, ClipboardCheck,
  BarChart3, Eye, Loader2, AlertTriangle,
  CheckCircle2, Briefcase, MapPin,
  Bot, Send, Sparkles, Calendar, Clock, TrendingUp,
  Target, Award, Star, Lightbulb, Zap, UserCheck,
} from 'lucide-react';
import ConsultantKPIsWidget from '@/components/compliance/ConsultantKPIsWidget';

// ═══ AI Compliance Assistant (Individual) ═══
const AIComplianceAssistant = memo(({ consultantProfile, assignments }: { consultantProfile: any; assignments: any[] }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const clientNames = assignments.map((a: any) => a.organization?.name).filter(Boolean).join('، ');
      const resp = await supabase.functions.invoke('ai-consultant-assistant', {
        body: {
          question: question.trim(),
          context: {
            consultantName: consultantProfile?.full_name,
            specialization: consultantProfile?.specialization,
            clientCount: assignments.length,
            clientNames,
            mode: 'individual',
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
    'ما هي متطلبات الامتثال البيئي للمنشآت الصناعية؟',
    'كيف أعد تقرير بيئي لجهة مولدة؟',
    'ما هي المخالفات الشائعة في إدارة المخلفات؟',
    'اقترح خطة تدقيق بيئي شاملة',
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          المساعد الذكي للامتثال البيئي
        </CardTitle>
        <CardDescription>استشر الذكاء الاصطناعي في أي مسألة بيئية أو تنظيمية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestion(q)}
              className="text-[11px] px-2.5 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Lightbulb className="w-3 h-3 inline ml-1 text-amber-500" />
              {q.slice(0, 40)}...
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="min-h-[60px] text-sm resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askAI(); } }}
          />
          <Button onClick={askAI} disabled={loading || !question.trim()} size="sm" className="self-end gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-card border border-border text-sm leading-relaxed whitespace-pre-wrap"
            >
              <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                <Sparkles className="w-4 h-4" />
                إجابة المساعد الذكي
              </div>
              {answer}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
});
AIComplianceAssistant.displayName = 'AIComplianceAssistant';

// ═══ Personal Schedule Widget ═══
const PersonalSchedule = memo(({ assignments }: { assignments: any[] }) => {
  const upcomingTasks = [
    { title: 'مراجعة ملف الامتثال', client: assignments[0]?.organization?.name || 'عميل', date: 'اليوم', priority: 'high' },
    { title: 'تقرير بيئي شهري', client: assignments[1]?.organization?.name || 'عميل', date: 'غداً', priority: 'medium' },
    { title: 'زيارة تفتيشية', client: assignments[0]?.organization?.name || 'عميل', date: 'الخميس', priority: 'low' },
  ];

  const priorityColors = { high: 'text-red-600 bg-red-50', medium: 'text-amber-600 bg-amber-50', low: 'text-emerald-600 bg-emerald-50' };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          جدول المهام القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {upcomingTasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-[11px] text-muted-foreground">{task.client}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                <Clock className="w-2.5 h-2.5 ml-1" />
                {task.date}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
PersonalSchedule.displayName = 'PersonalSchedule';

// ═══ Main Dashboard ═══
const ConsultantDashboard = memo(() => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: consultantProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-consultant-profile-dash', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase
        .from('environmental_consultants')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['consultant-assignments', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('consultant_organization_assignments')
        .select(`*, organization:organizations(id, name, organization_type, city, logo_url, partner_code)`)
        .eq('consultant_id', consultantProfile.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!consultantProfile?.id,
  });

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const orgTypeLabels: Record<string, string> = {
    generator: 'مولد مخلفات', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص نهائي',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            لوحة تحكم الاستشاري البيئي
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مرحباً {profile?.full_name} — استشاري بيئي مستقل
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/environmental-consultants')} className="gap-1.5">
            <Briefcase className="w-4 h-4" />
            ملفي المهني
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/consultant-portal')} className="gap-1.5">
            <FileText className="w-4 h-4" />
            بوابة التسجيل
          </Button>
        </div>
      </div>

      {/* Consultant Info Card */}
      {consultantProfile && (
        <Card className="border-emerald-200 bg-gradient-to-l from-emerald-50/80 to-transparent dark:from-emerald-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                {(consultantProfile as any).full_name?.charAt(0) || 'C'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{(consultantProfile as any).full_name}</p>
                <p className="text-sm text-muted-foreground">{(consultantProfile as any).specialization || 'استشاري بيئي مستقل'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    <UserCheck className="w-3 h-3 ml-1" />
                    فرد مستقل
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <Badge variant="outline" className="font-mono text-emerald-700 text-sm">
                  {(consultantProfile as any).consultant_code || 'EC-XXXX'}
                </Badge>
                <Badge variant={(consultantProfile as any).is_active ? 'default' : 'secondary'}>
                  {(consultantProfile as any).is_active ? '✅ نشط' : 'غير نشط'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!consultantProfile && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="font-bold mb-1">لم يتم تسجيلك كاستشاري بيئي بعد</p>
            <p className="text-sm text-muted-foreground mb-4">سجل في بوابة الاستشاريين لتفعيل جميع الأدوات</p>
            <Button onClick={() => navigate('/consultant-portal')} className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              سجل الآن
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-4 h-4" />نظرة عامة</TabsTrigger>
          <TabsTrigger value="organizations" className="gap-1.5"><Building2 className="w-4 h-4" />الجهات ({assignments.length})</TabsTrigger>
          <TabsTrigger value="ai-assistant" className="gap-1.5"><Bot className="w-4 h-4" />المساعد الذكي</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5"><ClipboardCheck className="w-4 h-4" />الامتثال</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="الجهات المرتبطة" value={assignments.length} color="text-blue-600" />
            <StatCard icon={Target} label="المهام النشطة" value={assignments.length > 0 ? 3 : 0} color="text-amber-600" />
            <StatCard icon={CheckCircle2} label="المراجعات المكتملة" value={0} color="text-emerald-600" />
            <StatCard icon={Star} label="التقييم" value="4.8" color="text-purple-600" isText />
          </div>

          {/* Quick Actions for Individual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: 'إعداد تقرير', color: 'bg-blue-500', path: '/dashboard/reports' },
              { icon: Eye, label: 'مراجعة جهة', color: 'bg-emerald-500', path: '/dashboard/partners' },
              { icon: ClipboardCheck, label: 'تدقيق بيئي', color: 'bg-purple-500', path: '/dashboard/environmental-consultants' },
              { icon: Award, label: 'شهاداتي', color: 'bg-amber-500', path: '/dashboard/pride-certificates' },
            ].map((action, i) => (
              <motion.button
                key={i}
                onClick={() => navigate(action.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-sm`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PersonalSchedule assignments={assignments} />
            <ConsultantKPIsWidget />
          </div>
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />الجهات المرتبطة بك</CardTitle>
              <CardDescription>الجهات التي عيّنتك كاستشاري بيئي معتمد — أنت تعمل كفرد مستقل</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا توجد جهات مرتبطة بعد</p>
                  <p className="text-sm mt-1">شارك كود الاستشاري الخاص بك مع الجهات ليتم تعيينك</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((a: any) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
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
                          <div className="flex flex-wrap gap-1 mt-3">
                            {a.can_view_shipments && <Badge variant="secondary" className="text-[9px]">الشحنات</Badge>}
                            {a.can_view_documents && <Badge variant="secondary" className="text-[9px]">المستندات</Badge>}
                            {a.can_view_compliance && <Badge variant="secondary" className="text-[9px]">الامتثال</Badge>}
                            {a.can_view_partners && <Badge variant="secondary" className="text-[9px]">الشركاء</Badge>}
                            {a.can_view_vehicles && <Badge variant="secondary" className="text-[9px]">المركبات</Badge>}
                            {a.can_view_drivers && <Badge variant="secondary" className="text-[9px]">السائقين</Badge>}
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5"
                            onClick={() => navigate(`/dashboard/organization/${a.organization?.id}`)}>
                            <Eye className="w-3.5 h-3.5" />عرض بيانات الجهة
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
          <AIComplianceAssistant consultantProfile={consultantProfile} assignments={assignments} />
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

ConsultantDashboard.displayName = 'ConsultantDashboard';
export default ConsultantDashboard;
