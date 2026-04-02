import { memo, useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, Building2, FileText, Eye, Loader2, BarChart3,
  ClipboardCheck, ShieldCheck, CheckCircle2, AlertTriangle,
  Calendar, MapPin, Search, FileCheck2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const DocumentVerificationWidget = lazy(() => import('@/components/dashboard/DocumentVerificationWidget'));

import ISOMonthlyActivity from '@/components/iso/ISOMonthlyActivity';


const ISOBodyDashboard = memo(() => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);

  // Fetch audit sessions created by this ISO body
  const { data: auditSessions = [], isLoading: loadingAudits } = useQuery({
    queryKey: ['iso-audits', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('audit_sessions')
        .select(`
          *,
          organization:organizations!audit_sessions_organization_id_fkey(id, name, organization_type, city, logo_url)
        `)
        .eq('created_by', profile?.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id && !!profile?.id,
  });

  // Also fetch audits where auditor org matches
  const { data: orgAudits = [], isLoading: loadingOrgAudits } = useQuery({
    queryKey: ['iso-org-audits', organization?.name],
    queryFn: async () => {
      if (!organization?.name) return [];
      const { data } = await supabase
        .from('audit_sessions')
        .select(`
          *,
          organization:organizations!audit_sessions_organization_id_fkey(id, name, organization_type, city, logo_url)
        `)
        .eq('auditor_organization', organization.name)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.name,
  });

  const allAudits = [...auditSessions, ...orgAudits].filter(
    (a, i, arr) => arr.findIndex(b => b.id === a.id) === i
  );

  const completedAudits = allAudits.filter(a => a.status === 'completed');
  const pendingAudits = allAudits.filter(a => a.status === 'in_progress' || a.status === 'pending');
  const uniqueOrgs = new Set(allAudits.map(a => a.organization_id)).size;

  const filteredAudits = allAudits.filter(a =>
    !searchTerm ||
    (a.organization as any)?.name?.includes(searchTerm) ||
    a.auditor_name?.includes(searchTerm) ||
    a.audit_type?.includes(searchTerm)
  );

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'في الانتظار', variant: 'secondary' },
    in_progress: { label: 'جارية', variant: 'outline' },
    completed: { label: 'مكتملة', variant: 'default' },
    cancelled: { label: 'ملغاة', variant: 'destructive' },
  };

  const resultLabels: Record<string, { label: string; color: string }> = {
    pass: { label: 'ناجح', color: 'text-emerald-600' },
    fail: { label: 'غير مطابق', color: 'text-red-600' },
    conditional: { label: 'مشروط', color: 'text-amber-600' },
  };

  const orgTypeLabels: Record<string, string> = {
    generator: 'مولد مخلفات',
    transporter: 'ناقل',
    recycler: 'مدوّر',
    disposal: 'تخلص نهائي',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-600" />
            لوحة تحكم جهة الأيزو
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {organization?.name} — التدقيق الخارجي ومنح شهادات الاعتماد
          </p>
        </div>
      </div>


      {/* Info Banner */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{organization?.name}</p>
              <p className="text-sm text-muted-foreground">جهة تدقيق خارجية — صلاحية عرض فقط (View Only) للسجلات والوثائق</p>
            </div>
            <Badge variant="outline" className="text-amber-700 border-amber-300">
              ISO Certification Body
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} label="إجمالي المراجعات" value={allAudits.length} color="text-blue-600" />
        <StatCard icon={CheckCircle2} label="مراجعات مكتملة" value={completedAudits.length} color="text-emerald-600" />
        <StatCard icon={AlertTriangle} label="مراجعات جارية" value={pendingAudits.length} color="text-amber-600" />
        <StatCard icon={Building2} label="جهات تم تدقيقها" value={uniqueOrgs} color="text-purple-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="audits" className="gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            جلسات التدقيق ({allAudits.length})
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-1.5">
            <Award className="w-4 h-4" />
            الشهادات الصادرة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Completion Rate */}
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">معدل إتمام المراجعات</p>
              <div className="text-4xl font-bold text-primary mb-2">
                {allAudits.length > 0 ? Math.round((completedAudits.length / allAudits.length) * 100) : 0}%
              </div>
              <Progress 
                value={allAudits.length > 0 ? (completedAudits.length / allAudits.length) * 100 : 0} 
                className="h-3 max-w-sm mx-auto" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {completedAudits.length} من {allAudits.length} مراجعة مكتملة
              </p>
            </CardContent>
          </Card>

          {/* Recent Audits */}
          {allAudits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">أحدث المراجعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allAudits.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {(a.organization as any)?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{(a.organization as any)?.name}</p>
                          <p className="text-[10px] text-muted-foreground">{a.audit_type} — {a.audit_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.overall_result && (
                          <span className={`text-xs font-bold ${resultLabels[a.overall_result]?.color || ''}`}>
                            {resultLabels[a.overall_result]?.label || a.overall_result}
                          </span>
                        )}
                        <Badge variant={statusLabels[a.status]?.variant || 'secondary'} className="text-[10px]">
                          {statusLabels[a.status]?.label || a.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audits" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5" />
                  جلسات التدقيق
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pr-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(loadingAudits || loadingOrgAudits) ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : filteredAudits.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا توجد جلسات تدقيق</p>
                  <p className="text-sm mt-1">ستظهر هنا جلسات المراجعة عند إنشائها من قبل الجهات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAudits.map(a => (
                    <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600">
                                <FileCheck2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold">{(a.organization as any)?.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <Badge variant="outline" className="text-[10px]">
                                    {orgTypeLabels[(a.organization as any)?.organization_type] || (a.organization as any)?.organization_type}
                                  </Badge>
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" /> {a.audit_date}
                                  </span>
                                  <span>{a.audit_type}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {a.overall_result && (
                                <Badge variant={a.overall_result === 'pass' ? 'default' : a.overall_result === 'fail' ? 'destructive' : 'secondary'} className="text-[10px]">
                                  {resultLabels[a.overall_result]?.label || a.overall_result}
                                </Badge>
                              )}
                              <Badge variant={statusLabels[a.status]?.variant || 'secondary'}>
                                {statusLabels[a.status]?.label || a.status}
                              </Badge>
                            </div>
                          </div>
                          {a.scope_description && (
                            <p className="text-xs text-muted-foreground mt-2 mr-13">{a.scope_description}</p>
                          )}
                          <div className="flex gap-2 mt-3 mr-13">
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              عرض التفاصيل
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">إدارة الشهادات الصادرة</p>
              <p className="text-sm mt-1">ستظهر هنا الشهادات المُصدرة بعد إتمام المراجعات بنجاح</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Suspense fallback={null}>
        <DocumentVerificationWidget open={showDocumentVerification} onOpenChange={setShowDocumentVerification} />
      </Suspense>
    </div>
  );
});

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
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

ISOBodyDashboard.displayName = 'ISOBodyDashboard';

export default ISOBodyDashboard;
