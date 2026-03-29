import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileCheck, Calendar, User, Upload } from 'lucide-react';
import { useMedicalCertificates } from '@/hooks/useMedicalProgram';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const certTypes = [
  { value: 'fitness', label: 'لياقة طبية' },
  { value: 'driver_fitness', label: 'لياقة سائق' },
  { value: 'hazardous_work', label: 'عمل مع مواد خطرة' },
  { value: 'food_handler', label: 'حامل أغذية' },
  { value: 'disability', label: 'تقرير إعاقة' },
];

const MedicalCertificatesTab = () => {
  const { certificates, isLoading, addCertificate } = useMedicalCertificates();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    employee_name: '',
    certificate_type: 'fitness',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    issued_by: '',
    restrictions: '',
    file_url: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `medical-certificates/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('documents').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
      setForm(f => ({ ...f, file_url: publicUrl }));
      toast.success('تم رفع الملف');
    } catch {
      toast.error('فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.employee_name) return;
    addCertificate.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({ employee_name: '', certificate_type: 'fitness', issue_date: new Date().toISOString().split('T')[0], expiry_date: '', issued_by: '', restrictions: '', file_url: '' });
      },
    });
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">الشهادات الطبية</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 text-xs h-8"><Plus className="h-3 w-3" />شهادة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" />إصدار شهادة طبية</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">اسم الموظف *</Label><Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} className="text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">نوع الشهادة</Label>
                  <Select value={form.certificate_type} onValueChange={v => setForm(f => ({ ...f, certificate_type: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{certTypes.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">صادرة من</Label><Input value={form.issued_by} onChange={e => setForm(f => ({ ...f, issued_by: e.target.value }))} className="text-sm" placeholder="المستشفى/الطبيب" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">تاريخ الإصدار</Label><Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className="text-xs" /></div>
                <div><Label className="text-xs">تاريخ الانتهاء</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} className="text-xs" /></div>
              </div>
              <div><Label className="text-xs">قيود (إن وجدت)</Label><Input value={form.restrictions} onChange={e => setForm(f => ({ ...f, restrictions: e.target.value }))} className="text-sm" placeholder="مثال: لا يعمل في أماكن مرتفعة" /></div>
              <div>
                <Label className="text-xs">رفع الشهادة (PDF/صورة)</Label>
                <div className="mt-1">
                  <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{uploading ? 'جاري الرفع...' : form.file_url ? 'تم الرفع ✓' : 'اختر ملف'}</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addCertificate.isPending}>{addCertificate.isPending ? 'جاري الحفظ...' : 'إصدار الشهادة'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : certificates.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><FileCheck className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد شهادات طبية</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {certificates.map((cert: any) => (
            <Card key={cert.id} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{cert.employee_name}</span></div>
                  <Badge className={`text-[9px] ${cert.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cert.status === 'active' ? 'فعالة' : 'منتهية'}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>{certTypes.find(t => t.value === cert.certificate_type)?.label}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{cert.issue_date}</span>
                  {cert.expiry_date && <span>→ {cert.expiry_date}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalCertificatesTab;
