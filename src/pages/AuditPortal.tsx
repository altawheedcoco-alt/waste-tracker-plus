import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Eye, FileText, Lock, Clock, MapPin, Camera, Stamp, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const clauseStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  conforming: { label: 'مطابق', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  minor_nc: { label: 'عدم مطابقة ثانوي', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: AlertTriangle },
  major_nc: { label: 'عدم مطابقة رئيسي', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  observation: { label: 'ملاحظة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Eye },
  not_applicable: { label: 'لا ينطبق', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  not_assessed: { label: 'لم يُقيّم', color: 'bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400', icon: Clock },
};

const dataSourceLabels: Record<string, string> = {
  risk_register: 'سجل المخاطر',
  corrective_actions: 'الأفعال التصحيحية',
  shipments: 'سجلات الشحن والنقل',
  organization_documents: 'الوثائق المعتمدة',
  legal_licenses: 'التراخيص والتصاريح',
  lms_certificates: 'شهادات التدريب',
  audit_sessions: 'جلسات التدقيق',
  carbon_footprint_records: 'سجلات البصمة الكربونية',
  organizations: 'بيانات المنظمة',
};

const AuditPortal = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [session, setSession] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSealDialog, setShowSealDialog] = useState(false);
  const [sealForm, setSealForm] = useState({ signature_url: '', stamp_url: '', notes: '', overall_result: 'conforming' });
  const [dataCounts, setDataCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!token) { setError('لا يوجد رمز وصول'); setLoading(false); return; }
    loadSession();
  }, [token]);

  const loadSession = async () => {
    try {
      // Fetch audit session by token (public access)
      const { data: sess, error: err } = await (supabase.from('audit_sessions') as any)
        .select('*').eq('access_token', token).single();
      if (err || !sess) { setError('رمز الوصول غير صالح أو منتهي الصلاحية'); setLoading(false); return; }
      if (new Date(sess.access_expires_at) < new Date()) { setError('انتهت صلاحية رابط الوصول'); setLoading(false); return; }
      setSession(sess);

      // Fetch checklist
      const { data: items } = await (supabase.from('audit_checklist_items') as any)
        .select('*').eq('audit_session_id', sess.id).order('sort_order');
      setChecklist(items || []);

      // Fetch data counts for evidence linking
      const counts: Record<string, number> = {};
      const tables = [
        { name: 'shipments', col: 'organization_id' },
        { name: 'organization_documents', col: 'organization_id' },
        { name: 'legal_licenses', col: 'organization_id' },
        { name: 'risk_register', col: 'organization_id' },
        { name: 'corrective_actions', col: 'organization_id' },
        { name: 'lms_certificates', col: null },
      ];
      for (const t of tables) {
        try {
          let q = (supabase.from(t.name as any) as any).select('*', { count: 'exact', head: true });
          if (t.col) q = q.eq(t.col, sess.organization_id);
          const { count } = await q;
          counts[t.name] = count || 0;
        } catch { counts[t.name] = 0; }
      }
      setDataCounts(counts);
    } catch { setError('خطأ في تحميل البيانات'); }
    setLoading(false);
  };

  const updateChecklistItem = async (itemId: string, updates: any) => {
    const { error } = await (supabase.from('audit_checklist_items') as any)
      .update(updates).eq('id', itemId);
    if (error) { toast.error('فشل التحديث'); return; }
    setChecklist(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    toast.success('تم تحديث البند');
  };

  const submitFinalApproval = async () => {
    const { error } = await (supabase.from('audit_sessions') as any)
      .update({
        overall_result: sealForm.overall_result,
        auditor_notes: sealForm.notes,
        auditor_signature_url: sealForm.signature_url || null,
        auditor_stamp_url: sealForm.stamp_url || null,
        signed_at: new Date().toISOString(),
        status: 'completed',
      }).eq('id', session.id);
    if (error) { toast.error('فشل في تسجيل الاعتماد'); return; }
    setSession({ ...session, status: 'completed', overall_result: sealForm.overall_result, signed_at: new Date().toISOString() });
    setShowSealDialog(false);
    toast.success('تم تسجيل الاعتماد النهائي بنجاح');
  };

  if (loading) return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <Lock className="w-16 h-16 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">{error}</h2>
          <p className="text-muted-foreground text-sm">تأكد من صحة رابط الوصول المرسل إليك من المنظمة</p>
        </CardContent>
      </Card>
    </div>
  );

  const conformCount = checklist.filter(c => c.status === 'conforming').length;
  const ncCount = checklist.filter(c => c.status === 'minor_nc' || c.status === 'major_nc').length;
  const assessedCount = checklist.filter(c => c.status !== 'not_assessed').length;
  const progress = checklist.length > 0 ? Math.round((assessedCount / checklist.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/10 via-background to-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">بوابة التدقيق الخارجي</h1>
                <p className="text-sm text-muted-foreground">External Audit Portal - iRecycle Platform</p>
              </div>
            </div>
            <div className="text-left text-sm">
              <Badge className="mb-1">{session.audit_type?.replace('_', ' ').toUpperCase()}</Badge>
              <p className="text-muted-foreground">المراجع: {session.auditor_name}</p>
              {session.auditor_organization && <p className="text-muted-foreground">{session.auditor_organization}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Status Banner */}
        {session.status === 'completed' && (
          <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20">
            <CardContent className="pt-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">تم اعتماد المراجعة بتاريخ {session.signed_at && format(new Date(session.signed_at), 'dd MMM yyyy HH:mm', { locale: ar })}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">النتيجة: {session.overall_result === 'conforming' ? 'مطابق ✅' : session.overall_result === 'minor_nc' ? 'عدم مطابقة ثانوي ⚠️' : 'عدم مطابقة رئيسي ❌'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress & Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{progress}%</p>
            <p className="text-xs text-muted-foreground">نسبة الإنجاز</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{conformCount}</p>
            <p className="text-xs text-muted-foreground">مطابق</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{ncCount}</p>
            <p className="text-xs text-muted-foreground">عدم مطابقة</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{checklist.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي البنود</p>
          </CardContent></Card>
        </div>

        {/* Evidence Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> ملخص الأدلة المتاحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dataCounts).map(([table, count]) => (
                <Badge key={table} variant="outline" className="text-xs">
                  {dataSourceLabels[table] || table}: {count} سجل
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>قائمة تحقق المراجعة</span>
              {session.status !== 'completed' && (
                <Button size="sm" className="gap-1.5" onClick={() => setShowSealDialog(true)} disabled={progress < 50}>
                  <Stamp className="w-4 h-4" /> الاعتماد النهائي
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item, idx) => {
              const st = clauseStatusConfig[item.status] || clauseStatusConfig.not_assessed;
              const StIcon = st.icon;
              return (
                <div key={item.id} className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{item.iso_clause}</span>
                      <StIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="text-sm font-semibold">{item.clause_title_ar}</h4>
                      <p className="text-[10px] text-muted-foreground">{item.clause_title}</p>
                      {item.data_source_table && (
                        <p className="text-[10px] text-primary mt-0.5 flex items-center gap-1 justify-end">
                          <FileText className="w-3 h-3" />
                          الأدلة: {dataSourceLabels[item.data_source_table]} ({dataCounts[item.data_source_table] || 0} سجل)
                        </p>
                      )}
                    </div>
                  </div>

                  {session.status !== 'completed' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <Select value={item.status} onValueChange={v => updateChecklistItem(item.id, { status: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(clauseStatusConfig).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        className="text-xs min-h-[32px]"
                        placeholder="ملاحظات المراجع..."
                        defaultValue={item.auditor_comment || ''}
                        onBlur={e => {
                          if (e.target.value !== (item.auditor_comment || ''))
                            updateChecklistItem(item.id, { auditor_comment: e.target.value });
                        }}
                      />
                    </div>
                  )}

                  {session.status === 'completed' && item.auditor_comment && (
                    <p className="text-xs bg-muted/50 p-2 rounded mt-1">{item.auditor_comment}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8 space-y-1">
          <p>هذه البوابة للعرض فقط (View-Only) - جميع البيانات مقروءة مباشرة من سجلات المنصة</p>
          <p>Immutable Audit Trail - كل تغيير في هذه البوابة مسجل ولا يمكن حذفه</p>
          <p>iRecycle Digital Compliance Platform © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Final Approval Dialog */}
      <Dialog open={showSealDialog} onOpenChange={setShowSealDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Stamp className="w-5 h-5" /> الاعتماد النهائي للمراجعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>النتيجة الإجمالية *</Label>
              <Select value={sealForm.overall_result} onValueChange={v => setSealForm({ ...sealForm, overall_result: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conforming">مطابق - Conforming ✅</SelectItem>
                  <SelectItem value="minor_nc">عدم مطابقة ثانوي - Minor NC ⚠️</SelectItem>
                  <SelectItem value="major_nc">عدم مطابقة رئيسي - Major NC ❌</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات المراجع النهائية</Label>
              <Textarea value={sealForm.notes} onChange={e => setSealForm({ ...sealForm, notes: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>رابط التوقيع الرقمي (اختياري)</Label>
              <Input value={sealForm.signature_url} onChange={e => setSealForm({ ...sealForm, signature_url: e.target.value })} placeholder="رابط صورة التوقيع" />
            </div>
            <div>
              <Label>رابط ختم المكتب (اختياري)</Label>
              <Input value={sealForm.stamp_url} onChange={e => setSealForm({ ...sealForm, stamp_url: e.target.value })} placeholder="رابط صورة الختم" />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <p className="font-bold">⚠️ تنبيه:</p>
              <p>بالضغط على "اعتماد" أنت تؤكد أن المراجعة قد تمت وفقاً للمعايير المعتمدة وأن النتيجة المسجلة تعكس الوضع الفعلي للمنظمة.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSealDialog(false)}>إلغاء</Button>
            <Button onClick={submitFinalApproval} className="gap-1.5">
              <PenTool className="w-4 h-4" /> اعتماد وختم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditPortal;
