import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { type ContractFormData } from '@/hooks/useContracts';

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  onSubmit: () => void;
  isEditing: boolean;
  saving: boolean;
  onReset: () => void;
}

const ContractFormDialog = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEditing,
  saving,
  onReset,
}: ContractFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onReset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل العقد' : 'إضافة عقد جديد'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'تعديل بيانات العقد' : 'إدخال بيانات العقد الجديد'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>عنوان العقد *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="عقد خدمات نقل النفايات"
              />
            </div>

            <div>
              <Label>نوع العقد</Label>
              <Select value={formData.contract_type} onValueChange={(v) => setFormData(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">عقد خدمة</SelectItem>
                  <SelectItem value="supply">عقد توريد</SelectItem>
                  <SelectItem value="partnership">عقد شراكة</SelectItem>
                  <SelectItem value="maintenance">عقد صيانة</SelectItem>
                  <SelectItem value="transport">عقد نقل</SelectItem>
                  <SelectItem value="recycling">عقد تدوير</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>حالة العقد</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="pending">قيد العمل</SelectItem>
                  <SelectItem value="active">ساري</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>اسم الطرف الآخر</Label>
              <Input
                value={formData.partner_name}
                onChange={(e) => setFormData(p => ({ ...p, partner_name: e.target.value }))}
                placeholder="شركة التدوير الوطنية"
              />
            </div>

            <div>
              <Label>تاريخ البداية</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, 'dd/MM/yyyy') : 'اختر التاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(d) => setFormData(p => ({ ...p, start_date: d }))}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>تاريخ الانتهاء</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.end_date ? format(formData.end_date, 'dd/MM/yyyy') : 'اختر التاريخ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(d) => setFormData(p => ({ ...p, end_date: d }))}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="col-span-2">
              <Label>قيمة العقد (EGP)</Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))}
                placeholder="100000"
              />
            </div>

            <div className="col-span-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر للعقد..."
                rows={2}
              />
            </div>

            <div className="col-span-2">
              <Label>الشروط والأحكام</Label>
              <Textarea
                value={formData.terms}
                onChange={(e) => setFormData(p => ({ ...p, terms: e.target.value }))}
                placeholder="شروط وأحكام العقد..."
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>
            إلغاء
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'حفظ التغييرات' : 'إضافة العقد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractFormDialog;
