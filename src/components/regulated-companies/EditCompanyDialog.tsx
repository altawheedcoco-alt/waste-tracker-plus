import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const LICENSE_TYPES = [
  { value: 'medical', label: 'نفايات طبية' },
  { value: 'solid', label: 'نفايات صلبة' },
  { value: 'electronic', label: 'نفايات إلكترونية' },
  { value: 'hazardous', label: 'نفايات خطرة' },
  { value: 'construction', label: 'مخلفات بناء' },
  { value: 'other', label: 'أخرى' },
];

const GOVERNORATES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'المنوفية', 'القليوبية', 'الغربية', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان'];

interface Props {
  company: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const EditCompanyDialog = ({ company, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    company_name: '', company_name_ar: '', license_type: 'solid', license_number: '',
    license_expiry_date: '', governorate: 'القاهرة', city: '', address: '',
    contact_person: '', contact_phone: '', contact_email: '', activity_description: '',
  });

  useEffect(() => {
    if (company) {
      setForm({
        company_name: company.company_name || '',
        company_name_ar: company.company_name_ar || '',
        license_type: company.license_type || 'solid',
        license_number: company.license_number || '',
        license_expiry_date: company.license_expiry_date || '',
        governorate: company.governorate || 'القاهرة',
        city: company.city || '',
        address: company.address || '',
        contact_person: company.contact_person || '',
        contact_phone: company.contact_phone || '',
        contact_email: company.contact_email || '',
        activity_description: company.activity_description || '',
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('regulated_companies').update(form as any).eq('id', company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تحديث بيانات الشركة');
      queryClient.invalidateQueries({ queryKey: ['regulated-companies'] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>تعديل بيانات الشركة</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>اسم الشركة (إنجليزي)</Label><Input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} /></div>
          <div><Label>اسم الشركة (عربي)</Label><Input value={form.company_name_ar} onChange={e => setForm(p => ({ ...p, company_name_ar: e.target.value }))} /></div>
          <div><Label>نوع الترخيص</Label>
            <Select value={form.license_type} onValueChange={v => setForm(p => ({ ...p, license_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LICENSE_TYPES.map(lt => <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>رقم الترخيص</Label><Input value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} /></div>
          <div><Label>تاريخ انتهاء الترخيص</Label><Input type="date" value={form.license_expiry_date} onChange={e => setForm(p => ({ ...p, license_expiry_date: e.target.value }))} /></div>
          <div><Label>المحافظة</Label>
            <Select value={form.governorate} onValueChange={v => setForm(p => ({ ...p, governorate: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>المدينة</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
          <div><Label>جهة الاتصال</Label><Input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} /></div>
          <div><Label>الهاتف</Label><Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
          <div><Label>البريد الإلكتروني</Label><Input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
          <Button onClick={() => updateMutation.mutate()} disabled={!form.company_name || updateMutation.isPending}>
            {updateMutation.isPending ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyDialog;
