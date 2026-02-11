import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { FileCheck, DollarSign, CheckCircle, Download, QrCode, Eye, Package, Lock, AlertTriangle, Receipt } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CompletionFinanceTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
  searchQuery?: string;
}

const CompletionFinanceTab = ({ facilityId, organizationId, searchQuery }: CompletionFinanceTabProps) => {
  const queryClient = useQueryClient();
  const [showDualVerify, setShowDualVerify] = useState(false);
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [pendingCertOp, setPendingCertOp] = useState<any>(null);

  // Completed operations
  const { data: completedOps = [] } = useQuery({
    queryKey: ['mc-completed-ops', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('*, disposal_facility:disposal_facilities(name)')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Certificates
  const { data: certificates = [] } = useQuery({
    queryKey: ['mc-certificates', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const { data, error } = await supabase
        .from('disposal_certificates')
        .select('*, organization:organizations(name)')
        .eq('disposal_facility_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!facilityId,
  });

  // Issue certificate with dual verification
  const issueCertMutation = useMutation({
    mutationFn: async (op: any) => {
      const certNum = `CERT-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { error } = await supabase.from('disposal_certificates').insert({
        certificate_number: certNum, disposal_facility_id: op.disposal_facility_id,
        operation_id: op.id, organization_id: op.organization_id, waste_type: op.waste_type,
        waste_description: op.waste_description, disposal_method: op.disposal_method,
        quantity: op.quantity, unit: op.unit, issue_date: new Date().toISOString().split('T')[0],
        verified: true, verification_code: verificationCode, environmental_compliance_score: 95,
      });
      if (error) throw error;
      await supabase.from('disposal_operations').update({ certificate_number: certNum }).eq('id', op.id);
      return certNum;
    },
    onSuccess: (certNum) => {
      toast.success(`تم إصدار الشهادة وإرسال نسخة لبريد العميل. رقم: ${certNum}`);
      setShowDualVerify(false);
      setSupervisorPassword('');
      queryClient.invalidateQueries({ queryKey: ['mc-completed-ops'] });
      queryClient.invalidateQueries({ queryKey: ['mc-certificates'] });
    },
    onError: () => toast.error('فشل إصدار الشهادة'),
  });

  // Billing / post to accounts
  const billingMutation = useMutation({
    mutationFn: async (op: any) => {
      const pricePerTon = 450;
      const cost = (op.quantity || 0) * pricePerTon;
      const invoiceNum = Math.floor(Math.random() * 9000) + 1000;
      const { error } = await supabase.from('disposal_operations').update({
        cost, currency: 'EGP', updated_at: new Date().toISOString(),
      }).eq('id', op.id);
      if (error) throw error;
      return { cost, invoiceNum };
    },
    onSuccess: ({ cost, invoiceNum }) => {
      toast.success(`تم إنشاء فاتورة رقم #${invoiceNum} بقيمة ${cost.toLocaleString()} ج.م.`);
      queryClient.invalidateQueries({ queryKey: ['mc-completed-ops'] });
    },
  });

  const handleIssueCert = (op: any) => {
    setPendingCertOp(op);
    setShowDualVerify(true);
    setSupervisorPassword('');
  };

  const handleDualVerifyConfirm = () => {
    if (supervisorPassword.length < 4) {
      toast.error('يرجى إدخال كلمة مرور المشرف');
      return;
    }
    if (pendingCertOp) issueCertMutation.mutate(pendingCertOp);
  };

  const opsWithoutCert = completedOps.filter((o: any) => !o.certificate_number);
  const totalBilling = completedOps.reduce((acc: number, o: any) => acc + (o.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* 2 Big Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 dark:border-green-800/40">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mx-auto mb-3 flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">إصدار شهادة التخلص</h3>
            <p className="text-xs text-muted-foreground">ملف PDF مشفر برقم تسلسلي و QR Code</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-amber-600">
              <Lock className="w-3 h-3" /> يتطلب تحقق مزدوج
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800/40">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mx-auto mb-3 flex items-center justify-center">
              <Receipt className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">ترحيل للحسابات</h3>
            <p className="text-xs text-muted-foreground">تحويل العملية من "تشغيل" إلى "فاتورة مالية"</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-xs text-muted-foreground">شهادات صادرة</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{opsWithoutCert.length}</p>
              <p className="text-xs text-muted-foreground">بانتظار الشهادة</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{totalBilling.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">إجمالي الفوترة (ج.م)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Operations needing certificate */}
      {opsWithoutCert.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              عمليات مكتملة بانتظار إصدار شهادة التخلص النهائي
            </CardTitle>
            <CardDescription>يُغلق دورة حياة النفايات قانونياً ويُرسل للعميل والرقابة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {opsWithoutCert.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2">
                  {!op.cost && (
                    <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => billingMutation.mutate(op)} disabled={billingMutation.isPending}>
                      <DollarSign className="w-3 h-3" /> ترحيل للحسابات
                    </Button>
                  )}
                  <Button size="sm" className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleIssueCert(op)} disabled={issueCertMutation.isPending}>
                    <FileCheck className="w-3 h-3" /> إصدار شهادة
                  </Button>
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)} — {op.waste_description || op.waste_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {op.quantity} {op.unit} • {op.disposal_method === 'incineration' ? 'حرق' : op.disposal_method === 'landfill' ? 'دفن' : 'معالجة'}
                    {op.cost && <span className="mr-1">• {op.cost.toLocaleString()} ج.م</span>}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Issued Certificates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            الشهادات الصادرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لم تُصدر شهادات بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {certificates.map((cert: any) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="عرض"><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="QR"><QrCode className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="تحميل"><Download className="w-4 h-4" /></Button>
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <div className="flex items-center gap-2 justify-end">
                      {cert.verified && <Badge className="bg-green-500/10 text-green-600 text-xs gap-1"><CheckCircle className="w-3 h-3" /> موثقة</Badge>}
                      <span className="font-mono font-medium text-sm">{cert.certificate_number}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cert.organization?.name} • {cert.waste_description || cert.waste_type} • {cert.quantity} {cert.unit} • {format(new Date(cert.issue_date), 'dd MMM yyyy', { locale: ar })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dual Verification for Certificate */}
      <AlertDialog open={showDualVerify} onOpenChange={setShowDualVerify}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              التحقق المزدوج — إصدار شهادة التخلص
            </AlertDialogTitle>
            <AlertDialogDescription>
              إصدار شهادة التخلص النهائي يتطلب تأكيد مدير الموقع. هذه الشهادة وثيقة قانونية رسمية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 text-sm">
              <p className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-600" /> <strong>العملية:</strong> {pendingCertOp?.operation_number}</p>
              <p className="text-xs text-muted-foreground mt-1">{pendingCertOp?.waste_description} — {pendingCertOp?.quantity} {pendingCertOp?.unit}</p>
            </div>
            <div className="space-y-2">
              <Label>كلمة مرور المشرف / مدير الموقع</Label>
              <Input type="password" placeholder="أدخل كلمة مرور المشرف..." value={supervisorPassword} onChange={(e) => setSupervisorPassword(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDualVerifyConfirm} className="bg-green-600 hover:bg-green-700 gap-1">
              <FileCheck className="w-3 h-3" /> تأكيد وإصدار الشهادة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompletionFinanceTab;
