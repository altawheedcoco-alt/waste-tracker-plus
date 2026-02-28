import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ShieldCheck, Plus, Calendar, AlertTriangle, CheckCircle2,
  Clock, Upload, FileText, Loader2, XCircle,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const licenseTypes = [
  { value: 'environmental_license', label: 'ترخيص استشاري بيئي' },
  { value: 'wmra_accreditation', label: 'اعتماد WMRA' },
  { value: 'eeaa_registration', label: 'تسجيل جهاز شؤون البيئة' },
  { value: 'iso_14001_auditor', label: 'مراجع ISO 14001' },
  { value: 'iso_45001_auditor', label: 'مراجع ISO 45001' },
  { value: 'hazmat_specialist', label: 'متخصص مواد خطرة' },
  { value: 'eia_practitioner', label: 'ممارس تقييم أثر بيئي' },
  { value: 'other', label: 'أخرى' },
];

const ConsultantLicensesPanel = memo(() => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ document_type: '', document_name: '', expiry_date: '' });

  const { data: consultantProfile } = useQuery({
    queryKey: ['my-consultant-profile', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase.from('environmental_consultants').select('*')
        .eq('user_id', profile.user_id).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['consultant-credentials', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase.from('consultant_credentials').select('*')
        .eq('consultant_id', consultantProfile.id)
        .order('uploaded_at', { ascending: false });
      return data || [];
    },
    enabled: !!consultantProfile?.id,
  });

  const uploadCredential = useMutation({
    mutationFn: async (file: File) => {
      if (!consultantProfile?.id) throw new Error('لم يتم تسجيلك كاستشاري');
      const path = `consultant-credentials/${consultantProfile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      const { error } = await supabase.from('consultant_credentials').insert({
        consultant_id: consultantProfile.id,
        document_type: form.document_type,
        document_name: form.document_name || file.name,
        document_url: urlData.publicUrl,
        expiry_date: form.expiry_date || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant-credentials'] });
      toast.success('تم رفع المستند بنجاح');
      setAddOpen(false);
      setForm({ document_type: '', document_name: '', expiry_date: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: 'بدون تاريخ', variant: 'secondary' as const, icon: Clock };
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { label: 'منتهي', variant: 'destructive' as const, icon: XCircle };
    if (days < 30) return { label: `${days} يوم`, variant: 'destructive' as const, icon: AlertTriangle };
    if (days < 90) return { label: `${days} يوم`, variant: 'secondary' as const, icon: Clock };
    return { label: 'ساري', variant: 'default' as const, icon: CheckCircle2 };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" />التراخيص والمؤهلات</CardTitle>
            <CardDescription>إدارة تراخيصك المهنية وشهاداتك ومؤهلاتك</CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />إضافة ترخيص</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة ترخيص أو مؤهل</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>نوع المستند</Label>
                  <Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                    <SelectContent>
                      {licenseTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>اسم المستند</Label>
                  <Input value={form.document_name} onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} placeholder="مثال: ترخيص استشاري بيئي رقم 123" />
                </div>
                <div>
                  <Label>تاريخ الانتهاء (اختياري)</Label>
                  <Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
                <div>
                  <Label>رفع الملف</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && form.document_type) uploadCredential.mutateAsync(file);
                    else if (!form.document_type) toast.error('اختر نوع المستند أولاً');
                  }} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main consultant license info */}
        {consultantProfile && (
          <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 flex-wrap">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="font-bold">الترخيص الرئيسي</p>
                <p className="text-sm text-muted-foreground">
                  {(consultantProfile as any).license_number || 'لم يُحدد'} — {(consultantProfile as any).license_issuer || 'جهة الإصدار غير محددة'}
                </p>
              </div>
              {(consultantProfile as any).license_expiry && (
                <Badge variant={getExpiryStatus((consultantProfile as any).license_expiry).variant} className="gap-1">
                  <Calendar className="w-3 h-3" />
                  ينتهي: {format(parseISO((consultantProfile as any).license_expiry), 'dd MMM yyyy', { locale: ar })}
                </Badge>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا توجد مستندات إضافية</p>
            <p className="text-sm mt-1">أضف تراخيصك وشهاداتك المهنية</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((cred: any) => {
              const status = getExpiryStatus(cred.expiry_date);
              const StatusIcon = status.icon;
              return (
                <div key={cred.id} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cred.document_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {licenseTypes.find(t => t.value === cred.document_type)?.label || cred.document_type}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={status.variant} className="text-[9px] gap-0.5">
                        <StatusIcon className="w-2.5 h-2.5" />{status.label}
                      </Badge>
                      {cred.is_verified && <Badge variant="default" className="text-[9px]">✓ موثق</Badge>}
                      {cred.expiry_date && (
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(cred.expiry_date), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  {cred.document_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={cred.document_url} target="_blank" rel="noreferrer"><Upload className="w-3.5 h-3.5" /></a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConsultantLicensesPanel.displayName = 'ConsultantLicensesPanel';
export default ConsultantLicensesPanel;
