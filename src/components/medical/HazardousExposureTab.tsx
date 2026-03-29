import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Biohazard, Calendar, User } from 'lucide-react';
import { useHazardousExposure } from '@/hooks/useMedicalProgram';

const exposureLevelColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const exposureLevelLabels: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'عالي', critical: 'حرج',
};

const HazardousExposureTab = () => {
  const { exposures, isLoading, addExposure } = useHazardousExposure();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_name: '', hazardous_material: '', exposure_type: 'chemical',
    exposure_level: 'low', exposure_date: new Date().toISOString().split('T')[0],
    duration_minutes: 0, ppe_used: '', symptoms: '', medical_action: '', monitoring_result: '',
  });

  const handleSubmit = () => {
    if (!form.employee_name || !form.hazardous_material) return;
    addExposure.mutate(form, { onSuccess: () => { setOpen(false); setForm({ employee_name: '', hazardous_material: '', exposure_type: 'chemical', exposure_level: 'low', exposure_date: new Date().toISOString().split('T')[0], duration_minutes: 0, ppe_used: '', symptoms: '', medical_action: '', monitoring_result: '' }); } });
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">سجل التعرض للمواد الخطرة</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1 text-xs h-8"><Plus className="h-3 w-3" />تسجيل تعرض</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Biohazard className="h-5 w-5 text-amber-600" />تسجيل تعرض لمواد خطرة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">اسم الموظف *</Label><Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} className="text-sm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">المادة الخطرة *</Label><Input value={form.hazardous_material} onChange={e => setForm(f => ({ ...f, hazardous_material: e.target.value }))} className="text-sm" placeholder="أسبستوس، رصاص..." /></div>
                <div>
                  <Label className="text-xs">نوع التعرض</Label>
                  <Select value={form.exposure_type} onValueChange={v => setForm(f => ({ ...f, exposure_type: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chemical" className="text-xs">كيميائي</SelectItem>
                      <SelectItem value="biological" className="text-xs">بيولوجي</SelectItem>
                      <SelectItem value="radiation" className="text-xs">إشعاعي</SelectItem>
                      <SelectItem value="physical" className="text-xs">فيزيائي</SelectItem>
                      <SelectItem value="noise" className="text-xs">ضوضاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">مستوى التعرض</Label>
                  <Select value={form.exposure_level} onValueChange={v => setForm(f => ({ ...f, exposure_level: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">منخفض</SelectItem>
                      <SelectItem value="medium" className="text-xs">متوسط</SelectItem>
                      <SelectItem value="high" className="text-xs">عالي</SelectItem>
                      <SelectItem value="critical" className="text-xs">حرج</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">المدة (دقيقة)</Label><Input type="number" min={0} value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} className="text-sm" /></div>
              </div>
              <div><Label className="text-xs">تاريخ التعرض</Label><Input type="date" value={form.exposure_date} onChange={e => setForm(f => ({ ...f, exposure_date: e.target.value }))} className="text-xs" /></div>
              <div><Label className="text-xs">معدات الوقاية المستخدمة</Label><Input value={form.ppe_used} onChange={e => setForm(f => ({ ...f, ppe_used: e.target.value }))} className="text-sm" placeholder="كمامة، قفازات..." /></div>
              <div><Label className="text-xs">الأعراض</Label><Textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} className="text-sm min-h-[50px]" /></div>
              <div><Label className="text-xs">الإجراء الطبي</Label><Input value={form.medical_action} onChange={e => setForm(f => ({ ...f, medical_action: e.target.value }))} className="text-sm" /></div>
              <Button onClick={handleSubmit} className="w-full" disabled={addExposure.isPending}>{addExposure.isPending ? 'جاري الحفظ...' : 'تسجيل التعرض'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : exposures.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground"><Biohazard className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد سجلات تعرض</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {exposures.map((exp: any) => (
            <Card key={exp.id} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{exp.employee_name}</span></div>
                  <Badge className={`text-[9px] ${exposureLevelColors[exp.exposure_level] || 'bg-gray-100'}`}>{exposureLevelLabels[exp.exposure_level] || exp.exposure_level}</Badge>
                </div>
                <p className="text-xs mb-1 font-medium">{exp.hazardous_material}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{exp.exposure_date}</span>
                  {exp.duration_minutes > 0 && <span>{exp.duration_minutes} دقيقة</span>}
                  <span>{exp.exposure_type === 'chemical' ? 'كيميائي' : exp.exposure_type === 'biological' ? 'بيولوجي' : exp.exposure_type === 'radiation' ? 'إشعاعي' : exp.exposure_type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HazardousExposureTab;
