import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { FileText, Settings, Upload, CheckCircle2, AlertCircle, Clock, Send, Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/ui/back-button';

const EInvoiceSettings: React.FC = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['e-invoice-settings', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('e_invoice_settings')
        .select('*')
        .eq('organization_id', organization!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!organization,
  });

  const { data: submissions } = useQuery({
    queryKey: ['e-invoice-submissions', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('e_invoice_submissions')
        .select('*, invoices(invoice_number, total_amount)')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organization,
  });

  const [form, setForm] = useState({
    tax_registration_number: settings?.tax_registration_number || '',
    branch_id: settings?.branch_id || '',
    activity_code: settings?.activity_code || '',
    client_id: settings?.client_id || '',
    client_secret_encrypted: '',
    environment: settings?.environment || 'preprod',
  });

  React.useEffect(() => {
    if (settings) {
      setForm({
        tax_registration_number: settings.tax_registration_number || '',
        branch_id: settings.branch_id || '',
        activity_code: settings.activity_code || '',
        client_id: settings.client_id || '',
        client_secret_encrypted: '',
        environment: settings.environment || 'preprod',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        organization_id: organization!.id,
        tax_registration_number: form.tax_registration_number,
        branch_id: form.branch_id,
        activity_code: form.activity_code,
        client_id: form.client_id,
        environment: form.environment,
        ...(form.client_secret_encrypted ? { client_secret_encrypted: form.client_secret_encrypted } : {}),
      };

      if (settings) {
        const { error } = await supabase.from('e_invoice_settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('e_invoice_settings').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e-invoice-settings'] });
      toast.success('تم حفظ إعدادات الفاتورة الإلكترونية');
    },
    onError: () => toast.error('فشل في حفظ الإعدادات'),
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    submitted: 'تم الإرسال',
    accepted: 'مقبولة',
    rejected: 'مرفوضة',
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            الفاتورة الإلكترونية المصرية
          </h1>
          <p className="text-muted-foreground">التوافق مع منظومة الفاتورة الإلكترونية - مصلحة الضرائب المصرية (ETA)</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: 'حالة الربط', value: settings?.is_active ? 'مفعّل' : 'غير مفعّل', color: settings?.is_active ? 'text-green-500' : 'text-gray-400' },
          { icon: Building2, label: 'البيئة', value: settings?.environment === 'production' ? 'إنتاج' : 'تجريبي', color: 'text-blue-500' },
          { icon: Send, label: 'فواتير مرسلة', value: submissions?.filter(s => s.status === 'accepted').length || 0, color: 'text-purple-500' },
          { icon: AlertCircle, label: 'فواتير مرفوضة', value: submissions?.filter(s => s.status === 'rejected').length || 0, color: 'text-red-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" />الإعدادات</TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2"><Upload className="w-4 h-4" />الفواتير المرسلة</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>بيانات التسجيل في منظومة ETA</CardTitle>
              <CardDescription>أدخل بيانات التسجيل الخاصة بمنظومة الفاتورة الإلكترونية المصرية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>رقم التسجيل الضريبي</Label>
                  <Input fieldContext="tax_registration_number" value={form.tax_registration_number} onChange={e => setForm(p => ({ ...p, tax_registration_number: e.target.value }))} placeholder="مثال: 123-456-789" dir="ltr" />
                </div>
                <div>
                  <Label>رقم الفرع (Branch ID)</Label>
                  <Input fieldContext="branch_id" value={form.branch_id} onChange={e => setForm(p => ({ ...p, branch_id: e.target.value }))} placeholder="0 للمقر الرئيسي" dir="ltr" />
                </div>
                <div>
                  <Label>كود النشاط</Label>
                  <Input fieldContext="activity_code" value={form.activity_code} onChange={e => setForm(p => ({ ...p, activity_code: e.target.value }))} placeholder="كود النشاط من ETA" dir="ltr" />
                </div>
                <div>
                  <Label>Client ID</Label>
                  <Input value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} placeholder="معرف التطبيق" dir="ltr" />
                </div>
                <div>
                  <Label>Client Secret</Label>
                  <Input type="password" value={form.client_secret_encrypted} onChange={e => setForm(p => ({ ...p, client_secret_encrypted: e.target.value }))} placeholder="سر التطبيق (اتركه فارغاً لعدم التغيير)" dir="ltr" />
                </div>
                <div>
                  <Label>البيئة</Label>
                  <Select value={form.environment} onValueChange={v => setForm(p => ({ ...p, environment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preprod">تجريبي (Pre-production)</SelectItem>
                      <SelectItem value="production">إنتاج (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">ملاحظة هامة</p>
                    <p>يجب الحصول على بيانات التسجيل من بوابة مصلحة الضرائب المصرية. تأكد من استخدام البيئة التجريبية أولاً قبل الانتقال للإنتاج.</p>
                  </div>
                </div>
              </div>

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full md:w-auto">
                {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardContent className="p-4">
              {submissions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد فواتير مرسلة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions?.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {sub.status === 'accepted' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                         sub.status === 'rejected' ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                         <Clock className="w-5 h-5 text-yellow-500" />}
                        <div>
                          <p className="font-medium text-sm">{(sub as any).invoices?.invoice_number || sub.internal_id || 'بدون رقم'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(sub as any).invoices?.total_amount && (
                          <span className="text-sm font-bold">{(sub as any).invoices.total_amount} ج.م</span>
                        )}
                        <Badge className={statusColors[sub.status] || 'bg-gray-100'}>
                          {statusLabels[sub.status] || sub.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EInvoiceSettings;
