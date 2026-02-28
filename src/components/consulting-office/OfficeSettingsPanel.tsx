import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useConsultingOffice } from '@/hooks/useConsultingOffice';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Settings, Building2, Save, Upload, Loader2,
  ShieldCheck, Users, Globe, Mail, Phone, MapPin,
} from 'lucide-react';

const OfficeSettingsPanel = memo(() => {
  const { office } = useConsultingOffice();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    office_name: office?.office_name || '',
    office_name_en: office?.office_name_en || '',
    license_number: office?.license_number || '',
    license_issuer: office?.license_issuer || '',
    license_expiry: office?.license_expiry || '',
    commercial_register: office?.commercial_register || '',
    tax_id: office?.tax_id || '',
    address: office?.address || '',
    phone: office?.phone || '',
    email: office?.email || '',
    website: office?.website || '',
    max_consultants: office?.max_consultants || 50,
  });

  const updateOffice = useMutation({
    mutationFn: async () => {
      if (!office?.id) throw new Error('لا يوجد مكتب');
      const { error } = await supabase
        .from('consulting_offices')
        .update(form as any)
        .eq('id', office.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting-office'] });
      toast.success('تم حفظ الإعدادات');
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!office) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />إعدادات المكتب</CardTitle>
        <CardDescription>تعديل بيانات وإعدادات المكتب الاستشاري</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2"><Building2 className="w-4 h-4" />البيانات الأساسية</h3>
            <div><Label>اسم المكتب (عربي)</Label><Input value={form.office_name} onChange={e => setForm(f => ({ ...f, office_name: e.target.value }))} /></div>
            <div><Label>اسم المكتب (إنجليزي)</Label><Input value={form.office_name_en} onChange={e => setForm(f => ({ ...f, office_name_en: e.target.value }))} /></div>
            <div><Label>العنوان</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>الموقع الإلكتروني</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} /></div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" />البيانات القانونية</h3>
            <div><Label>رقم الترخيص</Label><Input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} /></div>
            <div><Label>جهة الإصدار</Label><Input value={form.license_issuer} onChange={e => setForm(f => ({ ...f, license_issuer: e.target.value }))} /></div>
            <div><Label>تاريخ انتهاء الترخيص</Label><Input type="date" value={form.license_expiry} onChange={e => setForm(f => ({ ...f, license_expiry: e.target.value }))} /></div>
            <div><Label>السجل التجاري</Label><Input value={form.commercial_register} onChange={e => setForm(f => ({ ...f, commercial_register: e.target.value }))} /></div>
            <div><Label>الرقم الضريبي</Label><Input value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} /></div>
            <div><Label>الحد الأقصى للاستشاريين</Label><Input type="number" value={form.max_consultants} onChange={e => setForm(f => ({ ...f, max_consultants: parseInt(e.target.value) || 50 }))} /></div>
          </div>
        </div>
        <Button onClick={() => updateOffice.mutateAsync()} disabled={updateOffice.isPending} className="mt-6 gap-2">
          {updateOffice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الإعدادات
        </Button>
      </CardContent>
    </Card>
  );
});

OfficeSettingsPanel.displayName = 'OfficeSettingsPanel';
export default OfficeSettingsPanel;
