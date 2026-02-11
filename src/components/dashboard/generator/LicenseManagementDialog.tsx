import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const categories = [
  { value: 'ida', label: 'رخصة التنمية الصناعية (IDA)' },
  { value: 'wmra', label: 'ترخيص WMRA - إدارة المخلفات' },
  { value: 'eeaa', label: 'موافقة تقييم الأثر البيئي (EIA)' },
  { value: 'civil_protection', label: 'تصريح الحماية المدنية' },
  { value: 'atomic_energy', label: 'تصريح هيئة الطاقة الذرية' },
  { value: 'commercial_register', label: 'السجل التجاري' },
  { value: 'industrial_register', label: 'السجل الصناعي' },
  { value: 'activity_specific', label: 'ترخيص نشاط نوعي' },
  { value: 'other', label: 'أخرى' },
];

const LicenseManagementDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const { organization, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    license_category: '',
    license_name: '',
    issuing_authority: '',
    license_number: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
  });

  const handleCategoryChange = (value: string) => {
    const cat = categories.find(c => c.value === value);
    setForm(prev => ({
      ...prev,
      license_category: value,
      license_name: cat?.label || '',
      issuing_authority: cat?.label || '',
    }));
  };

  const handleSave = async () => {
    if (!organization?.id || !form.license_category || !form.license_name) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('legal_licenses').insert({
        organization_id: organization.id,
        license_category: form.license_category,
        license_name: form.license_name,
        issuing_authority: form.issuing_authority,
        license_number: form.license_number || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        notes: form.notes || null,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success('تم إضافة الترخيص بنجاح');
      setForm({ license_category: '', license_name: '', issuing_authority: '', license_number: '', issue_date: '', expiry_date: '', notes: '' });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('خطأ في حفظ الترخيص: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة ترخيص قانوني</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>نوع الترخيص *</Label>
            <Select value={form.license_category} onValueChange={handleCategoryChange}>
              <SelectTrigger><SelectValue placeholder="اختر نوع الترخيص" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>اسم الترخيص *</Label>
            <Input value={form.license_name} onChange={e => setForm(p => ({ ...p, license_name: e.target.value }))} placeholder="مثال: رخصة تشغيل منشأة صناعية" />
          </div>

          <div>
            <Label>الجهة المصدرة *</Label>
            <Input value={form.issuing_authority} onChange={e => setForm(p => ({ ...p, issuing_authority: e.target.value }))} placeholder="مثال: الهيئة العامة للتنمية الصناعية" />
          </div>

          <div>
            <Label>رقم الترخيص</Label>
            <Input value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} placeholder="رقم الترخيص" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تاريخ الإصدار</Label>
              <Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
            </div>
            <div>
              <Label>تاريخ الانتهاء</Label>
              <Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات إضافية..." rows={2} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة الترخيص
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseManagementDialog;
