import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Scale, BookOpen, Award, Loader2, Upload,
  FileText, ExternalLink, Calendar, CheckCircle2,
  Shield, Gavel, AlertCircle, Plus,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LegalDashboardPanelProps {
  assignments: any[];
}

const LegalDashboardPanel = memo(({ assignments }: LegalDashboardPanelProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgIds = assignments.map((a: any) => a.organization_id);

  // Safe disposal certificate form state
  const [certOrg, setCertOrg] = useState('');
  const [certShipmentRef, setCertShipmentRef] = useState('');
  const [certNotes, setCertNotes] = useState('');

  // Regulations update form
  const [regTitle, setRegTitle] = useState('');
  const [regContent, setRegContent] = useState('');

  // Fetch organization licenses for monitoring
  const { data: orgLicenses = [], isLoading: loadingLicenses } = useQuery({
    queryKey: ['consultant-org-licenses', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const results: any[] = [];
      for (const orgId of orgIds) {
        // @ts-ignore - deep type instantiation workaround
        const result = await supabase
          .from('organization_documents')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: true });
        const data = result.data;
        if (data) results.push(...data.map(d => ({ ...d, _orgId: orgId })));
      }
      return results;
    },
    enabled: orgIds.length > 0,
  });

  // Fetch corrective actions / violations
  const { data: violations = [] } = useQuery({
    queryKey: ['consultant-violations', orgIds],
    queryFn: async () => {
      if (!orgIds.length) return [];
      const results: any[] = [];
      for (const orgId of orgIds) {
        const { data } = await supabase
          .from('corrective_actions')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) results.push(...data.map(d => ({ ...d, _orgId: orgId })));
      }
      return results;
    },
    enabled: orgIds.length > 0,
  });

  // Issue safe disposal certificate
  const issueCertificate = useMutation({
    mutationFn: async () => {
      if (!certOrg) throw new Error('اختر الجهة');
      const { error } = await supabase.from('consultant_document_signatures').insert({
        consultant_id: profile?.id,
        organization_id: certOrg,
        document_type: 'safe_disposal_certificate',
        document_id: certShipmentRef || 'general',
        notes: `شهادة تخلص آمن: ${certNotes}`,
        stamp_applied: true,
        signature_hash: crypto.randomUUID(),
        device_info: navigator.userAgent,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إصدار شهادة التخلص الآمن بنجاح');
      setCertOrg('');
      setCertShipmentRef('');
      setCertNotes('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Post regulation update
  const postRegulation = async () => {
    if (!regTitle.trim() || !regContent.trim()) {
      toast.error('أدخل عنوان ومحتوى التحديث');
      return;
    }
    try {
      // Post as a notification to all linked organizations
      for (const orgId of orgIds) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', orgId)
          .limit(50);

        if (profiles) {
          const notifications = profiles.map(p => ({
            user_id: p.id,
            title: `تحديث قانوني: ${regTitle}`,
            message: regContent,
            type: 'legal_update',
            action_url: '/dashboard/compliance',
          }));
          await supabase.from('notifications').insert(notifications as any);
        }
      }
      toast.success('تم إرسال التحديث القانوني لجميع الجهات المرتبطة');
      setRegTitle('');
      setRegContent('');
    } catch (e: any) {
      toast.error(e.message || 'فشل الإرسال');
    }
  };

  const getOrgName = (orgId: string) => {
    const a = assignments.find((x: any) => x.organization_id === orgId);
    return a?.organization?.name || 'جهة';
  };

  const getLicenseStatus = (expiryDate: string) => {
    if (!expiryDate) return { label: 'غير محدد', variant: 'secondary' as const };
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: 'منتهية', variant: 'destructive' as const };
    if (days < 30) return { label: `${days} يوم`, variant: 'destructive' as const };
    if (days < 90) return { label: `${days} يوم`, variant: 'secondary' as const };
    return { label: 'سارية', variant: 'default' as const };
  };

  return (
    <Tabs defaultValue="licenses">
      <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="licenses" className="gap-1.5"><Shield className="w-4 h-4" />التراخيص</TabsTrigger>
        <TabsTrigger value="regulations" className="gap-1.5"><BookOpen className="w-4 h-4" />تحديث القوانين</TabsTrigger>
        <TabsTrigger value="certificate" className="gap-1.5"><Award className="w-4 h-4" />شهادة التخلص الآمن</TabsTrigger>
        <TabsTrigger value="violations" className="gap-1.5">
          <Gavel className="w-4 h-4" />المخالفات
          {violations.length > 0 && <Badge variant="destructive" className="text-[10px] px-1.5">{violations.length}</Badge>}
        </TabsTrigger>
      </TabsList>

      {/* Licenses monitoring */}
      <TabsContent value="licenses" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              متابعة التراخيص والتصاريح
            </CardTitle>
            <CardDescription>مراقبة صلاحية تراخيص جميع الجهات المرتبطة</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLicenses ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : orgLicenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد تراخيص مسجلة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orgLicenses.map((lic: any) => {
                  const status = getLicenseStatus(lic.expiry_date);
                  return (
                    <div key={lic.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${status.variant === 'destructive' ? 'bg-destructive' : status.variant === 'secondary' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lic.license_type || lic.document_type || 'ترخيص'}</p>
                        <p className="text-[11px] text-muted-foreground">{getOrgName(lic._orgId)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {lic.expiry_date && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(lic.expiry_date).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                        <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Regulations updates */}
      <TabsContent value="regulations" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              تحديث القوانين واللوائح
            </CardTitle>
            <CardDescription>رفع آخر اللوائح التنفيذية لتطلع عليها الجهات ومكاتب النقل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={regTitle}
              onChange={(e) => setRegTitle(e.target.value)}
              placeholder="عنوان التحديث القانوني (مثال: تعديل المادة 15 من قانون 202/2020)"
            />
            <Textarea
              value={regContent}
              onChange={(e) => setRegContent(e.target.value)}
              placeholder="نص التحديث والتوصيات للجهات المرتبطة..."
              className="min-h-[150px]"
            />
            <div className="flex justify-between items-center">
              <p className="text-[11px] text-muted-foreground">
                سيتم إرسال التحديث لـ {orgIds.length} جهة مرتبطة
              </p>
              <Button onClick={postRegulation} className="gap-1.5">
                <BookOpen className="w-4 h-4" />نشر التحديث
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Safe disposal certificate */}
      <TabsContent value="certificate" className="mt-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-emerald-600" />
              إصدار شهادة التخلص الآمن
            </CardTitle>
            <CardDescription>إصدار الشهادة النهائية للجهة بعد إتمام عملية التدوير بنجاح</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={certOrg} onValueChange={setCertOrg}>
              <SelectTrigger><SelectValue placeholder="اختر الجهة المستفيدة" /></SelectTrigger>
              <SelectContent>
                {assignments.map((a: any) => (
                  <SelectItem key={a.organization_id} value={a.organization_id}>
                    {a.organization?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={certShipmentRef}
              onChange={(e) => setCertShipmentRef(e.target.value)}
              placeholder="مرجع الشحنة أو العملية (اختياري)"
            />
            <Textarea
              value={certNotes}
              onChange={(e) => setCertNotes(e.target.value)}
              placeholder="تفاصيل الشهادة: نوع المخلفات، طريقة التخلص، الجهة المعالجة..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button onClick={() => issueCertificate.mutate()} disabled={issueCertificate.isPending}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                {issueCertificate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                إصدار الشهادة
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Violations */}
      <TabsContent value="violations" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="w-5 h-5 text-red-600" />
              المخالفات والإجراءات التصحيحية
            </CardTitle>
            <CardDescription>متابعة المخالفات البيئية وخطط الإصحاح للجهات المرتبطة</CardDescription>
          </CardHeader>
          <CardContent>
            {violations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">لا توجد مخالفات نشطة</p>
                <p className="text-sm mt-1">جميع الجهات ملتزمة بالمعايير البيئية</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((v: any) => (
                  <div key={v.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className={`w-4 h-4 ${v.severity === 'critical' ? 'text-red-600' : v.severity === 'major' ? 'text-amber-600' : 'text-blue-600'}`} />
                          <p className="text-sm font-medium">{v.title}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{getOrgName(v._orgId)}</p>
                        {v.description && <p className="text-sm mt-2 text-muted-foreground">{v.description}</p>}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={v.status === 'open' ? 'destructive' : v.status === 'in_progress' ? 'secondary' : 'default'} className="text-[10px]">
                          {v.status === 'open' ? 'مفتوحة' : v.status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة'}
                        </Badge>
                        {v.deadline && (
                          <span className="text-[10px] text-muted-foreground">
                            الموعد: {new Date(v.deadline).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
});

LegalDashboardPanel.displayName = 'LegalDashboardPanel';
export default LegalDashboardPanel;
