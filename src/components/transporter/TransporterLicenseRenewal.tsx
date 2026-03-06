import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Send, Clock, CheckCircle, AlertTriangle, Stamp, Printer, Plus } from 'lucide-react';
import { useLicenseRenewalRequests, useRegulatoryAttestations, useCreateRenewalRequest } from '@/hooks/useLicenseRenewal';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationLicenses } from '@/hooks/useRegulatorData';
import AttestationPrintView from '@/components/regulator/AttestationPrintView';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-700' },
  under_review: { label: 'قيد المراجعة', color: 'bg-blue-500/10 text-blue-700' },
  documents_required: { label: 'مستندات مطلوبة', color: 'bg-orange-500/10 text-orange-700' },
  fees_pending: { label: 'في انتظار الرسوم', color: 'bg-amber-500/10 text-amber-700' },
  fees_paid: { label: 'تم دفع الرسوم', color: 'bg-emerald-500/10 text-emerald-700' },
  processing: { label: 'جاري الإصدار', color: 'bg-indigo-500/10 text-indigo-700' },
  approved: { label: 'تمت الموافقة', color: 'bg-green-500/10 text-green-700' },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-700' },
};

interface TransporterLicenseRenewalProps {
  regulatorOrgId?: string;
  regulatorLevelCode?: string;
}

const TransporterLicenseRenewal = ({ regulatorOrgId, regulatorLevelCode }: TransporterLicenseRenewalProps) => {
  const { organization } = useAuth();
  const { data: requests = [], isLoading: reqLoading } = useLicenseRenewalRequests(false);
  const { data: attestations = [] } = useRegulatoryAttestations(false);
  const { data: licenses = [] } = useOrganizationLicenses(organization?.id);
  const createRequest = useCreateRenewalRequest();

  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showPrintView, setShowPrintView] = useState<any>(null);
  const [formData, setFormData] = useState({
    request_type: 'renewal',
    license_type: 'waste_transport_permit',
    current_license_number: '',
    current_license_expiry: '',
    notes: '',
    regulator_level_code: regulatorLevelCode || 'WMRA',
  });

  // Find the appropriate regulator org for the selected level
  const handleSubmit = async () => {
    if (!organization || !regulatorOrgId) return;
    await createRequest.mutateAsync({
      organization_id: organization.id,
      regulator_organization_id: regulatorOrgId,
      regulator_level_code: formData.regulator_level_code,
      request_type: formData.request_type,
      license_type: formData.license_type,
      current_license_number: formData.current_license_number || null,
      current_license_expiry: formData.current_license_expiry || null,
      notes: formData.notes || null,
    });
    setShowNewRequest(false);
    setFormData({ request_type: 'renewal', license_type: 'waste_transport_permit', current_license_number: '', current_license_expiry: '', notes: '', regulator_level_code: regulatorLevelCode || 'WMRA' });
  };

  // Check for licenses expiring within 3 months
  const expiringLicenses = (licenses as any[]).filter((l: any) => {
    if (!l.expiry_date) return false;
    const expiry = new Date(l.expiry_date);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiry <= threeMonths && expiry > new Date();
  });

  const activeAttestations = (attestations as any[]).filter((a: any) => a.status === 'active' && new Date(a.valid_until) > new Date());

  return (
    <div className="space-y-6">
      {/* Expiring Licenses Warning */}
      {expiringLicenses.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-amber-700">تراخيص تنتهي خلال 3 أشهر</h3>
            </div>
            {expiringLicenses.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between p-2 rounded bg-background mb-1">
                <span className="text-sm">{l.license_type || 'ترخيص'} - {l.license_number}</span>
                <span className="text-xs text-muted-foreground">ينتهي: {new Date(l.expiry_date).toLocaleDateString('ar-EG')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">طلبات التراخيص والإفادات</h3>
        <Button onClick={() => setShowNewRequest(true)}>
          <Plus className="w-4 h-4 ml-1" /> طلب تجديد/إصدار
        </Button>
      </div>

      {/* Active Attestations */}
      {activeAttestations.length > 0 && (
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stamp className="w-4 h-4 text-emerald-600" /> إفادات سارية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAttestations.map((att: any) => (
              <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/5">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      {att.attestation_type === 'fee_payment_processing' ? 'إفادة دفع رسوم' : 'إفادة تسجيل'}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{att.attestation_number}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    سارية حتى: {new Date(att.valid_until).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowPrintView(att)}>
                  <Printer className="w-3.5 h-3.5 ml-1" /> طباعة
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        {(requests as any[]).length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد طلبات تجديد. اضغط على "طلب تجديد/إصدار" لبدء طلب جديد.</CardContent></Card>
        ) : (
          (requests as any[]).map((req: any) => {
            const st = STATUS_MAP[req.status] || STATUS_MAP.pending;
            return (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {req.request_type === 'renewal' ? 'تجديد' : req.request_type === 'new_license' ? 'ترخيص جديد' : 'تسجيل'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {req.current_license_number && <span>🔢 {req.current_license_number}</span>}
                        {req.fee_amount && <span>💰 {req.fee_amount} ج.م</span>}
                        <span>🕐 {new Date(req.requested_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      {req.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">❌ سبب الرفض: {req.rejection_reason}</p>
                      )}
                      {req.notes && <p className="text-xs text-muted-foreground mt-1">📝 {req.notes}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>طلب تجديد / إصدار ترخيص</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">نوع الطلب</label>
              <Select value={formData.request_type} onValueChange={v => setFormData(d => ({ ...d, request_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal">تجديد ترخيص قائم</SelectItem>
                  <SelectItem value="new_license">ترخيص جديد</SelectItem>
                  <SelectItem value="registration">تسجيل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الجهة المُصدرة</label>
              <Select value={formData.regulator_level_code} onValueChange={v => setFormData(d => ({ ...d, regulator_level_code: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WMRA">جهاز تنظيم إدارة المخلفات (WMRA)</SelectItem>
                  <SelectItem value="LTRA">جهاز تنظيم النقل البري (LTRA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.request_type === 'renewal' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم الترخيص الحالي</label>
                  <Input value={formData.current_license_number} onChange={e => setFormData(d => ({ ...d, current_license_number: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">تاريخ انتهاء الترخيص</label>
                  <Input type="date" value={formData.current_license_expiry} onChange={e => setFormData(d => ({ ...d, current_license_expiry: e.target.value }))} />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Textarea value={formData.notes} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} placeholder="أضف أي تفاصيل إضافية..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={createRequest.isPending}>
              <Send className="w-4 h-4 ml-1" /> إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print View */}
      {showPrintView && (
        <AttestationPrintView attestation={showPrintView} onClose={() => setShowPrintView(null)} />
      )}
    </div>
  );
};

export default TransporterLicenseRenewal;
