import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Syringe, Calendar, User, Upload } from 'lucide-react';
import { useVaccinationRecords } from '@/hooks/useMedicalProgram';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VaccinationsTab = () => {
  const { vaccinations, isLoading, addVaccination } = useVaccinationRecords();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    employee_name: '', vaccine_name: '', vaccine_type: '', dose_number: 1,
    vaccination_date: new Date().toISOString().split('T')[0], next_dose_date: '',
    batch_number: '', administered_by: '', side_effects: '', attachment_url: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `vaccinations/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('documents').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
      setForm(f => ({ ...f, attachment_url: publicUrl }));
      toast.success('تم رفع الملف');
    } catch { toast.error('فشل رفع الملف'); } finally { setUploading(false); }
  };

  const handleSubmit = () => {
    if (!form.employee_name || !form.vaccine_name) return;
    addVaccination.mutate(form, { onSuccess: () => { setOpen(false); setForm({ employee_name: '', vaccine_name: '', vaccine_type: '', dose_number: 1, vaccination_date: new Date().toISOString().split('T')[0], next_dose_date: '', batch_number: '', administered_by: '', side_effects: '', attachment_url: '' }); } });
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">سجل التطعيمات</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1 text-xs h-8"><Plus className="h-3 w-3" />تطعيم جديد</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Syringe className="h-5 w-5 text-primary" />تسجيل تطعيم</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">اسم الموظف *</Label><Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} className="text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">اسم التطعيم *</Label><Input value={form.vaccine_name} onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))} className="text-sm" placeholder="مثال: التيتانوس" /></div>
                <div><Label className="text-xs">نوع اللقاح</Label><Input value={form.vaccine_type} onChange={e => setForm(f => ({ ...f, vaccine_type: e.target.value }))} className="text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">رقم الجرعة</Label><Input type="number" min={1} value={form.dose_number} onChange={e => setForm(f => ({ ...f, dose_number: parseInt(e.target.value) || 1 }))} className="text-sm" /></div>
                <div><Label className="text-xs">رقم التشغيلة</Label><Input value={form.batch_number} onChange={e => setForm(f => ({ ...f, batch_number: e.target.value }))} className="text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">تاريخ التطعيم</Label><Input type="date" value={form.vaccination_date} onChange={e => setForm(f => ({ ...f, vaccination_date: e.target.value }))} className="text-xs" /></div>
                <div><Label className="text-xs">موعد الجرعة القادمة</Label><Input type="date" value={form.next_dose_date} onChange={e => setForm(f => ({ ...f, next_dose_date: e.target.value }))} className="text-xs" /></div>
              </div>
              <div><Label className="text-xs">الطبيب/المركز</Label><Input value={form.administered_by} onChange={e => setForm(f => ({ ...f, administered_by: e.target.value }))} className="text-sm" /></div>
              <div><Label className="text-xs">آثار جانبية</Label><Input value={form.side_effects} onChange={e => setForm(f => ({ ...f, side_effects: e.target.value }))} className="text-sm" placeholder="إن وجدت" /></div>
              <div>
                <Label className="text-xs">رفع إثبات التطعيم</Label>
                <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 mt-1">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{uploading ? 'جاري الرفع...' : form.attachment_url ? 'تم ✓' : 'اختر ملف'}</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addVaccination.isPending}>{addVaccination.isPending ? 'جاري الحفظ...' : 'تسجيل التطعيم'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : vaccinations.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><Syringe className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد تطعيمات مسجلة</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {vaccinations.map((vac: any) => (
            <Card key={vac.id} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{vac.employee_name}</span></div>
                  <Badge className="text-[9px] bg-purple-100 text-purple-700">{vac.vaccine_name}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>جرعة {vac.dose_number}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{vac.vaccination_date}</span>
                  {vac.next_dose_date && <span>القادمة: {vac.next_dose_date}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VaccinationsTab;
