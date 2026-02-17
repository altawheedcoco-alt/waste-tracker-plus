import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Plus, Copy, ExternalLink, Shield, Calendar, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const auditTypeLabels: Record<string, string> = {
  iso_14001: 'ISO 14001 - نظام الإدارة البيئية',
  iso_45001: 'ISO 45001 - السلامة والصحة المهنية',
  iso_9001: 'ISO 9001 - إدارة الجودة',
  internal: 'تدقيق داخلي',
  regulatory: 'تدقيق تنظيمي',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'مجدول', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'جاري', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

const resultLabels: Record<string, { label: string; color: string }> = {
  conforming: { label: 'مطابق', color: 'text-emerald-600' },
  minor_nc: { label: 'عدم مطابقة ثانوي', color: 'text-amber-600' },
  major_nc: { label: 'عدم مطابقة رئيسي', color: 'text-red-600' },
  not_assessed: { label: 'لم يُقيّم', color: 'text-muted-foreground' },
};

const AuditPortalWidget = () => {
  const { organization, user } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    audit_type: 'iso_14001', auditor_name: '', auditor_organization: '',
    auditor_email: '', audit_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    scope_description: '', access_days: '7',
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['audit-sessions', orgId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('audit_sessions') as any)
        .select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const token = crypto.randomUUID().replace(/-/g, '');
      const expiresAt = addDays(new Date(), parseInt(values.access_days));

      // Create audit session
      const { data: session, error } = await (supabase.from('audit_sessions') as any)
        .insert({
          organization_id: orgId,
          audit_type: values.audit_type,
          auditor_name: values.auditor_name,
          auditor_organization: values.auditor_organization || null,
          auditor_email: values.auditor_email || null,
          access_token: token,
          access_expires_at: expiresAt.toISOString(),
          audit_date: values.audit_date,
          scope_description: values.scope_description || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default ISO 14001 checklist
      if (values.audit_type === 'iso_14001') {
        const checklistItems = getISO14001Checklist(session.id);
        await (supabase.from('audit_checklist_items') as any).insert(checklistItems);
      }

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-sessions'] });
      toast.success('تم إنشاء جلسة المراجعة وتوليد رابط الوصول');
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/audit-portal?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('تم نسخ رابط بوابة المراجع');
  };

  if (isLoading) return <Card><CardHeader><CardTitle>بوابة المراجع الخارجي</CardTitle></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="w-3.5 h-3.5" /> جلسة مراجعة جديدة
            </Button>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Eye className="w-5 h-5 text-indigo-600" /> بوابة المراجع الخارجي
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.map((session: any) => {
            const st = statusLabels[session.status] || statusLabels.scheduled;
            const isExpired = new Date(session.access_expires_at) < new Date();
            return (
              <div key={session.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => copyLink(session.access_token)} disabled={isExpired}>
                      <Copy className="w-3 h-3" /> نسخ الرابط
                    </Button>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-1.5 justify-end flex-wrap">
                      <Badge className={`${st.color} text-[10px]`}>{st.label}</Badge>
                      {isExpired && <Badge variant="destructive" className="text-[9px]">منتهي</Badge>}
                      <span className="text-xs font-medium">{auditTypeLabels[session.audit_type]}</span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5">{session.auditor_name} {session.auditor_organization ? `- ${session.auditor_organization}` : ''}</p>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-1 justify-end flex-wrap">
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {format(new Date(session.audit_date), 'dd MMM yyyy', { locale: ar })}</span>
                      <span>صلاحية الوصول: {format(new Date(session.access_expires_at), 'dd/MM/yyyy')}</span>
                    </div>
                    {session.overall_result && (
                      <p className={`text-xs font-semibold mt-1 ${resultLabels[session.overall_result]?.color}`}>
                        النتيجة: {resultLabels[session.overall_result]?.label}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">لم يتم إنشاء جلسات مراجعة بعد</p>}
        </CardContent>
      </Card>

      {/* Create Session Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء جلسة مراجعة خارجية</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>نوع المراجعة</Label>
              <Select value={form.audit_type} onValueChange={v => setForm({ ...form, audit_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(auditTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>اسم المراجع *</Label><Input value={form.auditor_name} onChange={e => setForm({ ...form, auditor_name: e.target.value })} /></div>
            <div><Label>المكتب الاستشاري</Label><Input value={form.auditor_organization} onChange={e => setForm({ ...form, auditor_organization: e.target.value })} /></div>
            <div><Label>البريد الإلكتروني</Label><Input type="email" value={form.auditor_email} onChange={e => setForm({ ...form, auditor_email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ المراجعة</Label><Input type="date" value={form.audit_date} onChange={e => setForm({ ...form, audit_date: e.target.value })} /></div>
              <div>
                <Label>مدة الوصول (أيام)</Label>
                <Select value={form.access_days} onValueChange={v => setForm({ ...form, access_days: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 أيام</SelectItem>
                    <SelectItem value="7">7 أيام</SelectItem>
                    <SelectItem value="14">14 يوم</SelectItem>
                    <SelectItem value="30">30 يوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>نطاق المراجعة</Label><Textarea value={form.scope_description} onChange={e => setForm({ ...form, scope_description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.auditor_name || createMutation.isPending}>
              إنشاء وتوليد الرابط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Default ISO 14001 checklist template
function getISO14001Checklist(sessionId: string) {
  return [
    { audit_session_id: sessionId, iso_clause: '4.1', clause_title: 'Understanding the Organization and its Context', clause_title_ar: 'فهم المنظمة وسياقها', sort_order: 1, data_source_table: 'organizations' },
    { audit_session_id: sessionId, iso_clause: '4.2', clause_title: 'Understanding Needs and Expectations', clause_title_ar: 'احتياجات وتوقعات الأطراف المعنية', sort_order: 2 },
    { audit_session_id: sessionId, iso_clause: '5.1', clause_title: 'Leadership and Commitment', clause_title_ar: 'القيادة والالتزام', sort_order: 3 },
    { audit_session_id: sessionId, iso_clause: '5.2', clause_title: 'Environmental Policy', clause_title_ar: 'السياسة البيئية', sort_order: 4, data_source_table: 'organization_documents' },
    { audit_session_id: sessionId, iso_clause: '6.1.1', clause_title: 'Actions to Address Risks and Opportunities', clause_title_ar: 'إجراءات معالجة المخاطر والفرص', sort_order: 5, data_source_table: 'risk_register' },
    { audit_session_id: sessionId, iso_clause: '6.1.2', clause_title: 'Environmental Aspects', clause_title_ar: 'الجوانب البيئية', sort_order: 6, data_source_table: 'shipments' },
    { audit_session_id: sessionId, iso_clause: '6.1.3', clause_title: 'Compliance Obligations', clause_title_ar: 'التزامات الامتثال', sort_order: 7, data_source_table: 'legal_licenses' },
    { audit_session_id: sessionId, iso_clause: '7.2', clause_title: 'Competence', clause_title_ar: 'الكفاءة', sort_order: 8, data_source_table: 'lms_certificates' },
    { audit_session_id: sessionId, iso_clause: '7.5', clause_title: 'Documented Information', clause_title_ar: 'المعلومات الموثقة', sort_order: 9, data_source_table: 'organization_documents' },
    { audit_session_id: sessionId, iso_clause: '8.1', clause_title: 'Operational Planning and Control', clause_title_ar: 'التخطيط والضبط التشغيلي', sort_order: 10, data_source_table: 'shipments' },
    { audit_session_id: sessionId, iso_clause: '8.2', clause_title: 'Emergency Preparedness', clause_title_ar: 'الاستعداد للطوارئ', sort_order: 11 },
    { audit_session_id: sessionId, iso_clause: '9.1', clause_title: 'Monitoring, Measurement, Analysis', clause_title_ar: 'الرصد والقياس والتحليل', sort_order: 12, data_source_table: 'carbon_footprint_records' },
    { audit_session_id: sessionId, iso_clause: '9.1.2', clause_title: 'Evaluation of Compliance', clause_title_ar: 'تقييم الامتثال', sort_order: 13, data_source_table: 'legal_licenses' },
    { audit_session_id: sessionId, iso_clause: '9.2', clause_title: 'Internal Audit', clause_title_ar: 'التدقيق الداخلي', sort_order: 14, data_source_table: 'audit_sessions' },
    { audit_session_id: sessionId, iso_clause: '9.3', clause_title: 'Management Review', clause_title_ar: 'مراجعة الإدارة', sort_order: 15 },
    { audit_session_id: sessionId, iso_clause: '10.2', clause_title: 'Nonconformity and Corrective Action', clause_title_ar: 'عدم المطابقة والإجراء التصحيحي', sort_order: 16, data_source_table: 'corrective_actions' },
    { audit_session_id: sessionId, iso_clause: '10.3', clause_title: 'Continual Improvement', clause_title_ar: 'التحسين المستمر', sort_order: 17 },
  ];
}

export default AuditPortalWidget;
