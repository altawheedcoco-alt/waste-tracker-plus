import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { UserCheck, Plus, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface DriverDoc {
  id: string;
  driver_id: string;
  doc_type: string;
  doc_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const DOC_TYPES: Record<string, string> = {
  professional_license: 'رخصة قيادة مهنية',
  hazmat_training_cert: 'شهادة تدريب مواد خطرة',
  criminal_record: 'صحيفة جنائية (فيش وتشبيه)',
  medical_fitness: 'شهادة لياقة طبية',
  hazmat_handling_permit: 'تصريح تداول مواد خطرة',
  defensive_driving_cert: 'شهادة قيادة دفاعية',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  valid: { label: 'ساري', color: 'bg-green-100 text-green-800' },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
  expiring_soon: { label: 'ينتهي قريباً', color: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'قيد المراجعة', color: 'bg-gray-100 text-gray-800' },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800' },
};

const DriverComplianceManager = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    driver_id: '',
    doc_type: '',
    doc_number: '',
    issue_date: '',
    expiry_date: '',
    issuing_authority: '',
    notes: '',
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, license_number, vehicle_plate, profiles(full_name)')
        .eq('organization_id', organization!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['driver-compliance-docs', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_compliance_docs')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DriverDoc[];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('driver_compliance_docs').insert({
        driver_id: data.driver_id,
        organization_id: organization!.id,
        doc_type: data.doc_type,
        doc_number: data.doc_number || null,
        issue_date: data.issue_date || null,
        expiry_date: data.expiry_date || null,
        issuing_authority: data.issuing_authority || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-compliance-docs'] });
      toast.success('تم إضافة المستند بنجاح');
      setShowDialog(false);
      setFormData({ driver_id: '', doc_type: '', doc_number: '', issue_date: '', expiry_date: '', issuing_authority: '', notes: '' });
    },
    onError: () => toast.error('خطأ في إضافة المستند'),
  });

  // Group by driver
  const byDriver = docs.reduce<Record<string, DriverDoc[]>>((acc, d) => {
    (acc[d.driver_id] = acc[d.driver_id] || []).push(d);
    return acc;
  }, {});

  const getDriverName = (driverId: string) => {
    const d = drivers.find((dr: any) => dr.id === driverId);
    return (d as any)?.profiles?.full_name || (d as any)?.license_number || driverId.slice(0, 8);
  };

  const getDriverComplianceScore = (driverDocs: DriverDoc[]) => {
    const required = ['professional_license', 'hazmat_training_cert', 'criminal_record'];
    const valid = required.filter(r => driverDocs.some(d => d.doc_type === r && d.status === 'valid'));
    return { valid: valid.length, total: required.length, isCompliant: valid.length === required.length };
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCheck className="h-5 w-5" /> الملف الامتثالي للسائقين
        </h3>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 ml-1" /> إضافة مستند
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
      ) : Object.keys(byDriver).length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>لم يتم إضافة مستندات امتثال بعد</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byDriver).map(([driverId, dDocs]) => {
            const score = getDriverComplianceScore(dDocs);
            return (
              <Card key={driverId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold">{getDriverName(driverId)}</p>
                    <Badge className={score.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {score.isCompliant ? <CheckCircle className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
                      {score.valid}/{score.total} إلزامي
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {dDocs.map(doc => {
                      const st = STATUS_MAP[doc.status] || STATUS_MAP.pending;
                      return (
                        <div key={doc.id} className="flex items-center justify-between text-sm border rounded p-2">
                          <div>
                            <p className="font-medium">{DOC_TYPES[doc.doc_type] || doc.doc_type}</p>
                            {doc.doc_number && <p className="text-xs text-muted-foreground">رقم: {doc.doc_number}</p>}
                          </div>
                          <Badge className={st.color}>{st.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستند امتثال سائق</DialogTitle>
            <DialogDescription>تسجيل الشهادات والتراخيص المطلوبة قانوناً</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>السائق *</Label>
              <Select value={formData.driver_id} onValueChange={v => setFormData(p => ({ ...p, driver_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر السائق" /></SelectTrigger>
                <SelectContent>
                  {drivers.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.profiles?.full_name || d.license_number} - {d.vehicle_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>نوع المستند *</Label>
              <Select value={formData.doc_type} onValueChange={v => setFormData(p => ({ ...p, doc_type: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر نوع المستند" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>رقم المستند</Label>
                <Input value={formData.doc_number} onChange={e => setFormData(p => ({ ...p, doc_number: e.target.value }))} />
              </div>
              <div>
                <Label>جهة الإصدار</Label>
                <Input value={formData.issuing_authority} onChange={e => setFormData(p => ({ ...p, issuing_authority: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>تاريخ الإصدار</Label>
                <Input type="date" value={formData.issue_date} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input type="date" value={formData.expiry_date} onChange={e => setFormData(p => ({ ...p, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={() => addMutation.mutate(formData)}
              disabled={!formData.driver_id || !formData.doc_type || addMutation.isPending}>
              {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ المستند'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverComplianceManager;
