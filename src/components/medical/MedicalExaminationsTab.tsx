import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Stethoscope, Eye, Calendar, User } from 'lucide-react';
import { useMedicalExaminations } from '@/hooks/useMedicalProgram';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const examTypes = [
  { value: 'periodic', label: 'دوري' },
  { value: 'pre_employment', label: 'قبل التوظيف' },
  { value: 'driver_fitness', label: 'لياقة سائق' },
  { value: 'return_to_work', label: 'عودة للعمل' },
  { value: 'hazardous_exposure', label: 'تعرض لمواد خطرة' },
  { value: 'annual', label: 'سنوي' },
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const resultColors: Record<string, string> = {
  fit: 'bg-green-100 text-green-700',
  fit_with_restrictions: 'bg-amber-100 text-amber-700',
  unfit: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-700',
};

const MedicalExaminationsTab = () => {
  const { examinations, isLoading, addExam } = useMedicalExaminations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_name: '',
    examination_type: 'periodic',
    examination_date: new Date().toISOString().split('T')[0],
    examiner_name: '',
    examiner_specialty: '',
    notes: '',
    status: 'scheduled',
    overall_result: 'pending',
  });

  const handleSubmit = () => {
    if (!form.employee_name) return;
    addExam.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({
          employee_name: '', examination_type: 'periodic',
          examination_date: new Date().toISOString().split('T')[0],
          examiner_name: '', examiner_specialty: '', notes: '',
          status: 'scheduled', overall_result: 'pending',
        });
      },
    });
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">الفحوصات الطبية</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1 text-xs h-8">
              <Plus className="h-3 w-3" />
              كشف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                إضافة كشف طبي
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">اسم الموظف *</Label>
                <Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} placeholder="اسم الموظف" className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">نوع الفحص</Label>
                  <Select value={form.examination_type} onValueChange={v => setForm(f => ({ ...f, examination_type: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {examTypes.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">التاريخ</Label>
                  <Input type="date" value={form.examination_date} onChange={e => setForm(f => ({ ...f, examination_date: e.target.value }))} className="text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">اسم الطبيب</Label>
                  <Input value={form.examiner_name} onChange={e => setForm(f => ({ ...f, examiner_name: e.target.value }))} placeholder="د." className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">التخصص</Label>
                  <Input value={form.examiner_specialty} onChange={e => setForm(f => ({ ...f, examiner_specialty: e.target.value }))} placeholder="طب مهني" className="text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">الحالة</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled" className="text-xs">مجدول</SelectItem>
                      <SelectItem value="in_progress" className="text-xs">جاري</SelectItem>
                      <SelectItem value="completed" className="text-xs">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">النتيجة</Label>
                  <Select value={form.overall_result} onValueChange={v => setForm(f => ({ ...f, overall_result: v }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-xs">قيد الانتظار</SelectItem>
                      <SelectItem value="fit" className="text-xs">لائق</SelectItem>
                      <SelectItem value="fit_with_restrictions" className="text-xs">لائق بقيود</SelectItem>
                      <SelectItem value="unfit" className="text-xs">غير لائق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">ملاحظات</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-sm min-h-[60px]" />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addExam.isPending}>
                {addExam.isPending ? 'جاري الحفظ...' : 'حفظ الكشف'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : examinations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد فحوصات طبية مسجلة</p>
            <p className="text-xs">ابدأ بإضافة أول كشف طبي</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {examinations.map((exam: any) => (
            <Card key={exam.id} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{exam.employee_name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={`text-[9px] ${statusColors[exam.status] || 'bg-gray-100'}`}>
                      {exam.status === 'scheduled' ? 'مجدول' : exam.status === 'completed' ? 'مكتمل' : exam.status === 'in_progress' ? 'جاري' : exam.status}
                    </Badge>
                    <Badge className={`text-[9px] ${resultColors[exam.overall_result] || 'bg-gray-100'}`}>
                      {exam.overall_result === 'fit' ? 'لائق' : exam.overall_result === 'unfit' ? 'غير لائق' : exam.overall_result === 'fit_with_restrictions' ? 'لائق بقيود' : 'قيد الانتظار'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {exam.examination_date}
                  </span>
                  <span>{examTypes.find(t => t.value === exam.examination_type)?.label || exam.examination_type}</span>
                  {exam.examiner_name && <span>د. {exam.examiner_name}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalExaminationsTab;
