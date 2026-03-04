import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  FileText, Upload, Send, Award, Shield, Stamp, Loader2,
  CheckCircle2, ClipboardCheck, AlertTriangle, BookOpen,
  Scale, Building2, Truck, CreditCard, Eye, Printer,
  FileCheck, ShieldCheck, Gavel, Leaf, QrCode, Hash,
  Calendar, Clock, Landmark, FileBadge2, Megaphone,
} from 'lucide-react';

interface ConsultantDocumentWorkbenchProps {
  assignments: any[];
}

// ═══ Stamp Types ═══
const STAMP_TYPES = [
  { id: 'specs_compliant', label: 'مطابق للمواصفات', icon: CheckCircle2, color: 'bg-emerald-500', desc: 'يوضع على عينات المخلفات والشحنات المطابقة' },
  { id: 'final_receipt', label: 'تم التسلم نهائياً', icon: FileCheck, color: 'bg-blue-500', desc: 'يوضع على بوالص الشحن (المانيفست) بعد التسليم' },
  { id: 'technical_approved', label: 'معتمد فنياً', icon: ShieldCheck, color: 'bg-purple-500', desc: 'يوضع على دراسات تقييم الأثر البيئي وسجلات المخلفات' },
] as const;

// ═══ Issued Document Types ═══
const ISSUED_DOCUMENTS = [
  { id: 'safe_disposal_cert', label: 'شهادة التخلص الآمن', icon: Award, desc: 'تثبت وصول النفايات لمصنع تدوير معتمد' },
  { id: 'environmental_audit', label: 'تقرير التدقيق البيئي', icon: ClipboardCheck, desc: 'تقرير دوري لمدى الالتزام بالمعايير البيئية' },
  { id: 'eia_study', label: 'دراسة تقييم الأثر البيئي (EIA)', icon: Leaf, desc: 'دراسة فنية للجهات الجديدة قبل بدء النشاط' },
  { id: 'carbon_footprint_cert', label: 'شهادة البصمة الكربونية', icon: Scale, desc: 'كمية الانبعاثات التي تم توفيرها (النقاط الخضراء)' },
  { id: 'emergency_plan', label: 'خطة الطوارئ البيئية', icon: AlertTriangle, desc: 'تعليمات التصرف عند انسكاب المواد الخطرة' },
] as const;

// ═══ Endorsement Document Types ═══
const ENDORSEMENT_DOCUMENTS = [
  { id: 'waste_manifest', label: 'مانيفست نقل النفايات', icon: FileText, desc: 'التأشير بصحة بيانات التداول والشحن' },
  { id: 'waste_register', label: 'سجل المخلفات', icon: BookOpen, desc: 'مراجعة والتأشير على الكميات المسجلة شهرياً' },
  { id: 'weighbridge_receipt', label: 'إيصال ميزان البسكول', icon: Scale, desc: 'مطابقة أوزان الشاحنات مع الكمية المصرح بنقلها' },
  { id: 'transaction_invoice', label: 'فاتورة التداول', icon: CreditCard, desc: 'التأشير على الفواتير لإثبات صحة الخدمة فنياً' },
] as const;

// ═══ Government Document Types ═══
const GOVERNMENT_DOCUMENTS = [
  { id: 'license_renewal', label: 'طلب تجديد رخصة تداول', icon: FileBadge2, desc: 'تجديد تصاريح السيارات لدى وزارة البيئة' },
  { id: 'environmental_disclosure', label: 'نموذج الإفصاح البيئي', icon: Landmark, desc: 'تقارير سنوية عن كميات المخلفات المدورة' },
  { id: 'violation_response', label: 'رد على إنذار قضائي', icon: Gavel, desc: 'تقرير فني رادّ يوضح المعالجة التي تمت' },
] as const;

const ConsultantDocumentWorkbench = memo(({ assignments }: ConsultantDocumentWorkbenchProps) => {
  const { profile } = useAuth();
  const orgIds = assignments.map((a: any) => a.organization_id);
  const [activeSection, setActiveSection] = useState('issued');

  // ═══ Issue Document Form State ═══
  const [issueDocType, setIssueDocType] = useState('');
  const [issueOrg, setIssueOrg] = useState('');
  const [issueRef, setIssueRef] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  // ═══ Endorsement Form State ═══
  const [endorseDocType, setEndorseDocType] = useState('');
  const [endorseOrg, setEndorseOrg] = useState('');
  const [endorseRef, setEndorseRef] = useState('');
  const [endorseStamp, setEndorseStamp] = useState('');
  const [endorseNotes, setEndorseNotes] = useState('');

  // ═══ Government Form State ═══
  const [govDocType, setGovDocType] = useState('');
  const [govOrg, setGovOrg] = useState('');
  const [govNotes, setGovNotes] = useState('');

  // Fetch existing consultant signatures/endorsements
  const { data: existingDocs = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['consultant-doc-signatures', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('consultant_document_signatures')
        .select('*')
        .eq('consultant_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const getOrgName = (orgId: string) => {
    const a = assignments.find((x: any) => x.organization_id === orgId);
    return a?.organization?.name || 'جهة';
  };

  // ═══ Issue Document Mutation ═══
  const issueDocument = useMutation({
    mutationFn: async () => {
      if (!issueOrg || !issueDocType) throw new Error('اختر الجهة ونوع المستند');
      const { error } = await supabase.from('consultant_document_signatures').insert({
        consultant_id: profile?.id,
        organization_id: issueOrg,
        document_type: issueDocType,
        document_id: issueRef || `issued-${Date.now()}`,
        notes: issueNotes,
        stamp_applied: true,
        signature_hash: crypto.randomUUID(),
        device_info: navigator.userAgent,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      const docLabel = ISSUED_DOCUMENTS.find(d => d.id === issueDocType)?.label || issueDocType;
      toast.success(`تم إصدار "${docLabel}" بنجاح`);
      setIssueDocType(''); setIssueOrg(''); setIssueRef(''); setIssueNotes('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ═══ Endorse Document Mutation ═══
  const endorseDocument = useMutation({
    mutationFn: async () => {
      if (!endorseOrg || !endorseDocType) throw new Error('اختر الجهة ونوع المستند');
      const { error } = await supabase.from('consultant_document_signatures').insert({
        consultant_id: profile?.id,
        organization_id: endorseOrg,
        document_type: `endorsement_${endorseDocType}`,
        document_id: endorseRef || `endorse-${Date.now()}`,
        notes: `${endorseStamp ? `ختم: ${STAMP_TYPES.find(s => s.id === endorseStamp)?.label || endorseStamp} | ` : ''}${endorseNotes}`,
        stamp_applied: !!endorseStamp,
        signature_hash: crypto.randomUUID(),
        device_info: navigator.userAgent,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      const docLabel = ENDORSEMENT_DOCUMENTS.find(d => d.id === endorseDocType)?.label || endorseDocType;
      toast.success(`تم التأشير على "${docLabel}" بنجاح`);
      setEndorseDocType(''); setEndorseOrg(''); setEndorseRef(''); setEndorseStamp(''); setEndorseNotes('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ═══ Government Document Mutation ═══
  const submitGovDocument = useMutation({
    mutationFn: async () => {
      if (!govOrg || !govDocType) throw new Error('اختر الجهة ونوع المستند');
      const { error } = await supabase.from('consultant_document_signatures').insert({
        consultant_id: profile?.id,
        organization_id: govOrg,
        document_type: `gov_${govDocType}`,
        document_id: `gov-${Date.now()}`,
        notes: `[مستند حكومي] ${govNotes}`,
        stamp_applied: true,
        signature_hash: crypto.randomUUID(),
        device_info: navigator.userAgent,
      } as any);
      if (error) throw error;

      // Notify the organization
      const { data: orgProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', govOrg)
        .limit(10);
      if (orgProfiles?.length) {
        const docLabel = GOVERNMENT_DOCUMENTS.find(d => d.id === govDocType)?.label || govDocType;
        await sendBulkDualNotification({
          user_ids: orgProfiles.map(p => p.id),
          title: `مستند حكومي: ${docLabel}`,
          message: `تم إعداد ${docLabel} من الاستشاري البيئي نيابة عن جهتكم`,
          type: 'document_issued',
        });
      }
    },
    onSuccess: () => {
      const docLabel = GOVERNMENT_DOCUMENTS.find(d => d.id === govDocType)?.label || govDocType;
      toast.success(`تم إعداد "${docLabel}" وإخطار الجهة`);
      setGovDocType(''); setGovOrg(''); setGovNotes('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const recentIssuedDocs = existingDocs.filter((d: any) => !d.document_type?.startsWith('endorsement_') && !d.document_type?.startsWith('gov_'));
  const recentEndorsedDocs = existingDocs.filter((d: any) => d.document_type?.startsWith('endorsement_'));
  const recentGovDocs = existingDocs.filter((d: any) => d.document_type?.startsWith('gov_'));

  return (
    <div className="space-y-4">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="issued" className="gap-1.5">
            <FileText className="w-4 h-4" />المستندات الصادرة
            {recentIssuedDocs.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{recentIssuedDocs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="endorsements" className="gap-1.5">
            <Stamp className="w-4 h-4" />التأشيرات والاعتمادات
            {recentEndorsedDocs.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{recentEndorsedDocs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="government" className="gap-1.5">
            <Landmark className="w-4 h-4" />المراسلات الحكومية
            {recentGovDocs.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{recentGovDocs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="stamps" className="gap-1.5">
            <ShieldCheck className="w-4 h-4" />الأختام الرسمية
          </TabsTrigger>
        </TabsList>

        {/* ═══ 1. Issued Documents ═══ */}
        <TabsContent value="issued" className="mt-4 space-y-4">
          {/* Document Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ISSUED_DOCUMENTS.map((doc) => (
              <motion.button
                key={doc.id}
                onClick={() => setIssueDocType(doc.id)}
                whileHover={{ scale: 1.01 }}
                className={`flex items-start gap-3 p-4 rounded-xl border text-right transition-all ${
                  issueDocType === doc.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <doc.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{doc.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{doc.desc}</p>
                </div>
                {issueDocType === doc.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
              </motion.button>
            ))}
          </div>

          {issueDocType && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  إصدار: {ISSUED_DOCUMENTS.find(d => d.id === issueDocType)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={issueOrg} onValueChange={setIssueOrg}>
                  <SelectTrigger><SelectValue placeholder="اختر الجهة المستفيدة" /></SelectTrigger>
                  <SelectContent>
                    {assignments.map((a: any) => (
                      <SelectItem key={a.organization_id} value={a.organization_id}>{a.organization?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={issueRef} onChange={e => setIssueRef(e.target.value)} placeholder="مرجع الشحنة أو العملية (اختياري)" />
                <Textarea value={issueNotes} onChange={e => setIssueNotes(e.target.value)} placeholder="تفاصيل المستند: النتائج، التوصيات، الملاحظات الفنية..." className="min-h-[100px]" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIssueDocType('')}>إلغاء</Button>
                  <Button onClick={() => issueDocument.mutate()} disabled={issueDocument.isPending} className="gap-1.5">
                    {issueDocument.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    إصدار المستند
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent issued docs */}
          <RecentDocsList docs={recentIssuedDocs} getOrgName={getOrgName} title="المستندات المُصدرة مؤخراً" />
        </TabsContent>

        {/* ═══ 2. Endorsements ═══ */}
        <TabsContent value="endorsements" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENDORSEMENT_DOCUMENTS.map((doc) => (
              <motion.button
                key={doc.id}
                onClick={() => setEndorseDocType(doc.id)}
                whileHover={{ scale: 1.01 }}
                className={`flex items-start gap-3 p-4 rounded-xl border text-right transition-all ${
                  endorseDocType === doc.id ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-300/30' : 'border-border hover:border-amber-300/50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                  <doc.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{doc.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{doc.desc}</p>
                </div>
                {endorseDocType === doc.id && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
              </motion.button>
            ))}
          </div>

          {endorseDocType && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stamp className="w-5 h-5 text-amber-600" />
                  تأشير: {ENDORSEMENT_DOCUMENTS.find(d => d.id === endorseDocType)?.label}
                </CardTitle>
                <CardDescription>اختر الختم المناسب ثم أكمل بيانات التأشير</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={endorseOrg} onValueChange={setEndorseOrg}>
                  <SelectTrigger><SelectValue placeholder="اختر الجهة صاحبة المستند" /></SelectTrigger>
                  <SelectContent>
                    {assignments.map((a: any) => (
                      <SelectItem key={a.organization_id} value={a.organization_id}>{a.organization?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={endorseRef} onChange={e => setEndorseRef(e.target.value)} placeholder="رقم المانيفست / الفاتورة / السجل" className="font-mono" />

                {/* Stamp Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">نوع الختم:</label>
                  <div className="flex flex-wrap gap-2">
                    {STAMP_TYPES.map((stamp) => (
                      <button
                        key={stamp.id}
                        onClick={() => setEndorseStamp(endorseStamp === stamp.id ? '' : stamp.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          endorseStamp === stamp.id
                            ? 'border-primary bg-primary/10 font-medium'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md ${stamp.color} flex items-center justify-center`}>
                          <stamp.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        {stamp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea value={endorseNotes} onChange={e => setEndorseNotes(e.target.value)} placeholder="ملاحظات التأشير: نتيجة المراجعة، ملاحظات على البيانات..." className="min-h-[80px]" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEndorseDocType('')}>إلغاء</Button>
                  <Button onClick={() => endorseDocument.mutate()} disabled={endorseDocument.isPending} className="gap-1.5 bg-amber-600 hover:bg-amber-700">
                    {endorseDocument.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />}
                    تأشير واعتماد
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <RecentDocsList docs={recentEndorsedDocs} getOrgName={getOrgName} title="التأشيرات الأخيرة" />
        </TabsContent>

        {/* ═══ 3. Government Documents ═══ */}
        <TabsContent value="government" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GOVERNMENT_DOCUMENTS.map((doc) => (
              <motion.button
                key={doc.id}
                onClick={() => setGovDocType(doc.id)}
                whileHover={{ scale: 1.01 }}
                className={`flex items-start gap-3 p-4 rounded-xl border text-right transition-all ${
                  govDocType === doc.id ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-300/30' : 'border-border hover:border-indigo-300/50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                  <doc.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{doc.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{doc.desc}</p>
                </div>
                {govDocType === doc.id && <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />}
              </motion.button>
            ))}
          </div>

          {govDocType && (
            <Card className="border-indigo-200 dark:border-indigo-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                  إعداد: {GOVERNMENT_DOCUMENTS.find(d => d.id === govDocType)?.label}
                </CardTitle>
                <CardDescription>سيتم إخطار الجهة المستفيدة بإعداد المستند</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={govOrg} onValueChange={setGovOrg}>
                  <SelectTrigger><SelectValue placeholder="الجهة التي يُعد المستند نيابة عنها" /></SelectTrigger>
                  <SelectContent>
                    {assignments.map((a: any) => (
                      <SelectItem key={a.organization_id} value={a.organization_id}>{a.organization?.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea value={govNotes} onChange={e => setGovNotes(e.target.value)}
                  placeholder={govDocType === 'violation_response' ? 'التقرير الفني الرادّ: بيان المعالجة التي تمت والإجراءات التصحيحية...'
                    : govDocType === 'license_renewal' ? 'بيانات الترخيص المطلوب تجديده: رقم الرخصة، نوعها، تاريخ الانتهاء...'
                    : 'بيانات الإفصاح: كميات المخلفات المدورة، الفترة الزمنية، الأنواع...'
                  }
                  className="min-h-[120px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setGovDocType('')}>إلغاء</Button>
                  <Button onClick={() => submitGovDocument.mutate()} disabled={submitGovDocument.isPending} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                    {submitGovDocument.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    إعداد وإرسال
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <RecentDocsList docs={recentGovDocs} getOrgName={getOrgName} title="المراسلات الحكومية الأخيرة" />
        </TabsContent>

        {/* ═══ 4. Official Stamps ═══ */}
        <TabsContent value="stamps" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
                الأختام الرسمية للاستشاري
              </CardTitle>
              <CardDescription>الأختام القانونية التي يمتلكها الاستشاري البيئي لتوثيق المستندات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STAMP_TYPES.map((stamp) => {
                  const usageCount = existingDocs.filter((d: any) => d.notes?.includes(stamp.label)).length;
                  return (
                    <motion.div key={stamp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-border p-5 text-center hover:shadow-md transition-shadow">
                      <div className={`w-16 h-16 rounded-2xl ${stamp.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <stamp.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-base mb-1">{stamp.label}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{stamp.desc}</p>
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Hash className="w-3 h-3 ml-1" />{usageCount} استخدام
                        </Badge>
                      </div>
                      <Button
                        variant="outline" size="sm" className="w-full mt-3 gap-1.5"
                        onClick={() => { setActiveSection('endorsements'); setEndorseStamp(stamp.id); }}
                      >
                        <Stamp className="w-4 h-4" />استخدام الختم
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Usage Stats */}
              <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  إحصائيات الأختام
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{existingDocs.length}</p>
                    <p className="text-[11px] text-muted-foreground">إجمالي المستندات</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{existingDocs.filter((d: any) => d.stamp_applied).length}</p>
                    <p className="text-[11px] text-muted-foreground">مستندات مختومة</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{new Set(existingDocs.map((d: any) => d.organization_id)).size}</p>
                    <p className="text-[11px] text-muted-foreground">جهات مخدومة</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

// ═══ Recent Documents List Component ═══
const RecentDocsList = memo(({ docs, getOrgName, title }: { docs: any[]; getOrgName: (id: string) => string; title: string }) => {
  if (docs.length === 0) return null;

  const getDocLabel = (type: string) => {
    const clean = type.replace('endorsement_', '').replace('gov_', '');
    const all = [...ISSUED_DOCUMENTS, ...ENDORSEMENT_DOCUMENTS, ...GOVERNMENT_DOCUMENTS];
    return all.find(d => d.id === clean)?.label || type;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />{title} ({docs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {docs.slice(0, 10).map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm">
              <div className={`w-2 h-2 rounded-full ${doc.stamp_applied ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{getDocLabel(doc.document_type)}</p>
                <p className="text-[10px] text-muted-foreground">{getOrgName(doc.organization_id)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {doc.stamp_applied && <Badge variant="outline" className="text-[9px]">مختوم</Badge>}
                <span className="text-[10px] text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
RecentDocsList.displayName = 'RecentDocsList';

ConsultantDocumentWorkbench.displayName = 'ConsultantDocumentWorkbench';
export default ConsultantDocumentWorkbench;
