import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Send, FileText, Clock, CheckCircle, XCircle, DollarSign, Printer, Loader2 } from "lucide-react";
import BackButton from '@/components/ui/back-button';
import {
  generateSalaryCertificate,
  generateExperienceCertificate,
  generateLeaveRequest,
  generateEmploymentLetter,
  generateWorkConfirmation,
  generateLeaveBalance,
  type HRDocData,
} from "@/components/dashboard/shared/printTemplates/hrDocTemplates";

const REQUEST_TYPES = [
  { value: 'leave', label: 'طلب إجازة', icon: '🏖️' },
  { value: 'salary_cert', label: 'شهادة راتب', icon: '📄' },
  { value: 'experience_cert', label: 'شهادة خبرة', icon: '📜' },
  { value: 'loan', label: 'طلب سلفة', icon: '💰' },
  { value: 'overtime', label: 'طلب عمل إضافي', icon: '⏰' },
  { value: 'transfer', label: 'طلب نقل', icon: '🔄' },
  { value: 'training', label: 'طلب تدريب', icon: '📚' },
  { value: 'complaint', label: 'شكوى', icon: '⚠️' },
  { value: 'suggestion', label: 'اقتراح', icon: '💡' },
  { value: 'other', label: 'أخرى', icon: '📋' },
];

const PRIORITY_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'منخفضة', variant: 'secondary' },
  normal: { label: 'عادية', variant: 'outline' },
  high: { label: 'عالية', variant: 'default' },
  urgent: { label: 'عاجلة', variant: 'destructive' },
};

const DOCUMENT_TEMPLATES = [
  { key: 'salary_cert', title: 'شهادة راتب', desc: 'شهادة بالراتب الحالي للجهات الخارجية', icon: '💰' },
  { key: 'experience_cert', title: 'شهادة خبرة', desc: 'شهادة بمدة العمل والمسمى الوظيفي', icon: '📜' },
  { key: 'leave_request', title: 'طلب إجازة', desc: 'نموذج طلب إجازة رسمي جاهز للطباعة', icon: '🏖️' },
  { key: 'employment_letter', title: 'خطاب تعريف بالعمل', desc: 'خطاب رسمي لجهة خارجية (بنك، سفارة...)', icon: '📋' },
  { key: 'work_confirmation', title: 'إفادة عمل', desc: 'إثبات أنك على رأس العمل', icon: '✅' },
  { key: 'leave_balance', title: 'كشف حساب إجازات', desc: 'تفاصيل رصيد الإجازات والمستهلك', icon: '📊' },
];

export default function HRSelfService() {
  const { profile, organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [newReq, setNewReq] = useState({ type: 'leave', title: '', details: '', priority: 'normal' });
  const [printingDoc, setPrintingDoc] = useState<string | null>(null);
  const [targetEntity, setTargetEntity] = useState('');
  const [docDialog, setDocDialog] = useState<{ open: boolean; key: string; title: string } | null>(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['hr-requests', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_employee_requests').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_employee_requests').insert({
        organization_id: orgId!,
        employee_id: profile?.id || crypto.randomUUID(),
        employee_name: profile?.full_name || 'موظف',
        request_type: newReq.type,
        request_title: newReq.title,
        request_details: newReq.details,
        priority: newReq.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-requests'] });
      setShowNew(false);
      setNewReq({ type: 'leave', title: '', details: '', priority: 'normal' });
      toast.success('تم إرسال الطلب بنجاح');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default"><CheckCircle className="w-3 h-3 ml-1" />موافق</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      case 'in_review': return <Badge variant="outline"><Clock className="w-3 h-3 ml-1" />قيد المراجعة</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 ml-1" />معلق</Badge>;
    }
  };

  const buildDocData = (): HRDocData => ({
    orgName: organization?.name || 'الشركة',
    orgAddress: (organization as any)?.address || '',
    orgPhone: (organization as any)?.phone || '',
    employeeName: profile?.full_name || 'الموظف',
    employeeTitle: (profile as any)?.job_title || 'موظف',
    employeeDepartment: (profile as any)?.department || '',
    employeeId: profile?.id?.slice(0, 8) || '',
    joinDate: '',
    targetEntity,
  });

  const handlePrintDocument = (key: string) => {
    setPrintingDoc(key);
    const d = buildDocData();
    let html = '';

    switch (key) {
      case 'salary_cert': html = generateSalaryCertificate(d); break;
      case 'experience_cert': html = generateExperienceCertificate(d); break;
      case 'leave_request': html = generateLeaveRequest(d); break;
      case 'employment_letter': html = generateEmploymentLetter(d); break;
      case 'work_confirmation': html = generateWorkConfirmation(d); break;
      case 'leave_balance': html = generateLeaveBalance(d); break;
      default: return;
    }

    import('@/services/documentService').then(({ PrintService }) => {
      PrintService.printHTML(html, { title: key });
      setPrintingDoc(null);
    }).catch(() => setPrintingDoc(null));

    setDocDialog(null);
    setTargetEntity('');
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الخدمة الذاتية للموظف</h1>
          <p className="text-muted-foreground">تقديم الطلبات ومتابعة الحالة</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />طلب جديد</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>تقديم طلب جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>نوع الطلب</Label>
                <Select value={newReq.type} onValueChange={v => setNewReq(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REQUEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>عنوان الطلب</Label><Input value={newReq.title} onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} placeholder="وصف مختصر للطلب" /></div>
              <div><Label>التفاصيل</Label><Textarea value={newReq.details} onChange={e => setNewReq(p => ({ ...p, details: e.target.value }))} rows={4} /></div>
              <div><Label>الأولوية</Label>
                <Select value={newReq.priority} onValueChange={v => setNewReq(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="normal">عادية</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => createRequestMutation.mutate()} disabled={!newReq.title}><Send className="w-4 h-4 ml-2" />إرسال الطلب</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileText className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">إجمالي الطلبات</p><p className="text-xl font-bold">{requests.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-yellow-500" /><div><p className="text-sm text-muted-foreground">قيد الانتظار</p><p className="text-xl font-bold">{requests.filter(r => r.status === 'pending').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-green-500" /><div><p className="text-sm text-muted-foreground">موافق عليها</p><p className="text-xl font-bold">{requests.filter(r => r.status === 'approved').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="w-8 h-8 text-destructive" /><div><p className="text-sm text-muted-foreground">مرفوضة</p><p className="text-xl font-bold">{requests.filter(r => r.status === 'rejected').length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">طلباتي</TabsTrigger>
          <TabsTrigger value="quick">إجراءات سريعة</TabsTrigger>
          <TabsTrigger value="documents">مستنداتي</TabsTrigger>
          <TabsTrigger value="payslips">كشوف الراتب</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-6">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Send className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>لا توجد طلبات</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>النوع</TableHead><TableHead>العنوان</TableHead><TableHead>الأولوية</TableHead><TableHead>الحالة</TableHead><TableHead>التاريخ</TableHead><TableHead>ملاحظات المراجع</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {requests.map(r => {
                      const reqType = REQUEST_TYPES.find(t => t.value === r.request_type);
                      return (
                        <TableRow key={r.id}>
                          <TableCell><span className="flex items-center gap-2">{reqType?.icon} {reqType?.label || r.request_type}</span></TableCell>
                          <TableCell className="font-medium">{r.request_title}</TableCell>
                          <TableCell><Badge variant={PRIORITY_MAP[r.priority || 'normal']?.variant || 'secondary'}>{PRIORITY_MAP[r.priority || 'normal']?.label || r.priority}</Badge></TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ar-EG')}</TableCell>
                          <TableCell className="text-sm">{r.reviewer_notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {REQUEST_TYPES.map(t => (
              <Card key={t.value} className="border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setNewReq(p => ({ ...p, type: t.value })); setShowNew(true); }}>
                <CardContent className="pt-6 text-center">
                  <span className="text-4xl">{t.icon}</span>
                  <h4 className="font-semibold mt-3">{t.label}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                قوالب المستندات الجاهزة
              </CardTitle>
              <p className="text-sm text-muted-foreground">اضغط على أي مستند لتوليده تلقائياً ببياناتك وطباعته</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOCUMENT_TEMPLATES.map((doc) => (
                  <Card key={doc.key} className="border hover:border-primary/40 hover:shadow-md cursor-pointer transition-all group">
                    <CardContent className="pt-6 text-center space-y-3">
                      <span className="text-5xl block">{doc.icon}</span>
                      <h4 className="font-bold text-base">{doc.title}</h4>
                      <p className="text-xs text-muted-foreground">{doc.desc}</p>
                      <div className="flex gap-2 pt-2">
                        {['employment_letter', 'salary_cert', 'work_confirmation'].includes(doc.key) ? (
                          <Button
                            size="sm"
                            variant="eco"
                            className="w-full"
                            onClick={() => setDocDialog({ open: true, key: doc.key, title: doc.title })}
                          >
                            <Printer className="h-4 w-4 ml-1" />
                            إنشاء وطباعة
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="eco"
                            className="w-full"
                            disabled={printingDoc === doc.key}
                            onClick={() => handlePrintDocument(doc.key)}
                          >
                            {printingDoc === doc.key ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Printer className="h-4 w-4 ml-1" />}
                            إنشاء وطباعة
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payslips">
          <Card><CardContent className="pt-6 text-center py-12 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لم يتم إصدار كشوف رواتب بعد</p>
            <p className="text-sm mt-1">ستظهر هنا كشوف الرواتب الشهرية بعد تشغيل مسيّر الرواتب</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for documents that need target entity */}
      <Dialog open={!!docDialog?.open} onOpenChange={(open) => { if (!open) { setDocDialog(null); setTargetEntity(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{docDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>الجهة الموجه إليها (اختياري)</Label>
              <Input
                value={targetEntity}
                onChange={(e) => setTargetEntity(e.target.value)}
                placeholder="مثال: البنك الأهلي، السفارة..."
              />
              <p className="text-xs text-muted-foreground mt-1">اتركه فارغاً ليكون "إلى من يهمه الأمر"</p>
            </div>
            <Button className="w-full" variant="eco" onClick={() => docDialog && handlePrintDocument(docDialog.key)}>
              <Printer className="h-4 w-4 ml-2" />
              إنشاء وطباعة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
