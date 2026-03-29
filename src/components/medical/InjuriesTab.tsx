import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle, Calendar, User, Upload } from 'lucide-react';
import { useMedicalInjuries } from '@/hooks/useMedicalProgram';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const severityColors: Record<string, string> = {
  minor: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-700',
  severe: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const severityLabels: Record<string, string> = {
  minor: 'بسيطة', moderate: 'متوسطة', severe: 'خطيرة', critical: 'حرجة',
};

const InjuriesTab = () => {
  const { injuries, isLoading, addInjury } = useMedicalInjuries();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    employee_name: '', injury_type: '', body_part: '', severity: 'minor',
    description: '', treatment: '', days_lost: 0, is_work_related: true, attachment_url: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `medical-injuries/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('documents').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
      setForm(f => ({ ...f, attachment_url: publicUrl }));
      toast.success('تم رفع الملف');
    } catch { toast.error('فشل رفع الملف'); } finally { setUploading(false); }
  };

  const handleSubmit = () => {
    if (!form.employee_name || !form.injury_type) return;
    addInjury.mutate(form, { onSuccess: () => { setOpen(false); setForm({ employee_name: '', injury_type: '', body_part: '', severity: 'minor', description: '', treatment: '', days_lost: 0, is_work_related: true, attachment_url: '' }); } });
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">سجل الإصابات</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1 text-xs h-8"><Plus className="h-3 w-3" />تسجيل إصابة</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />تسجيل إصابة عمل</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">اسم الموظف *</Label><Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} className="text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">نوع الإصابة *</Label><Input value={form.injury_type} onChange={e => setForm(f => ({ ...f, injury_type: e.target.value }))} className="text-sm" placeholder="كسر، جرح، حرق..." /></div>
                <div><Label className="text-xs">العضو المصاب</Label><Input value={form.body_part} onChange={e => setForm(f => ({ ...f, body_part: e.target.value }))} className="text-sm" placeholder="اليد، الظهر..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">الخطورة</Label>
                  <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor" className="text-xs">بسيطة</SelectItem>
                      <SelectItem value="moderate" className="text-xs">متوسطة</SelectItem>
                      <SelectItem value="severe" className="text-xs">خطيرة</SelectItem>
                      <SelectItem value="critical" className="text-xs">حرجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">أيام الغياب</Label><Input type="number" min={0} value={form.days_lost} onChange={e => setForm(f => ({ ...f, days_lost: parseInt(e.target.value) || 0 }))} className="text-sm" /></div>
              </div>
              <div><Label className="text-xs">وصف الإصابة</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm min-h-[60px]" /></div>
              <div><Label className="text-xs">العلاج المقدم</Label><Input value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))} className="text-sm" /></div>
              <div>
                <Label className="text-xs">رفع تقرير طبي</Label>
                <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 mt-1">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{uploading ? 'جاري الرفع...' : form.attachment_url ? 'تم ✓' : 'اختر ملف'}</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addInjury.isPending}>{addInjury.isPending ? 'جاري الحفظ...' : 'تسجيل الإصابة'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : injuries.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد إصابات مسجلة</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {injuries.map((inj: any) => (
            <Card key={inj.id} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{inj.employee_name}</span></div>
                  <Badge className={`text-[9px] ${severityColors[inj.severity] || 'bg-gray-100'}`}>{severityLabels[inj.severity] || inj.severity}</Badge>
                </div>
                <p className="text-xs mb-1">{inj.injury_type} {inj.body_part && `- ${inj.body_part}`}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{inj.injury_date?.split('T')[0]}</span>
                  {inj.days_lost > 0 && <span>{inj.days_lost} يوم غياب</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InjuriesTab;
