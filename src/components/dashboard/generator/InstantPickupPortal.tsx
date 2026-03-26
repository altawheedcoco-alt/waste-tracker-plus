import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const InstantPickupPortal = () => {
  const { organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    waste_type: '',
    quantity: '',
    urgency: 'normal',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!organization?.id || !form.waste_type || !form.quantity) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('collection_requests').insert({
        organization_id: organization.id,
        customer_name: organization.name || 'طلب جمع فوري',
        pickup_address: (organization as any)?.address || 'عنوان المنشأة',
        waste_type: form.waste_type,
        estimated_weight_kg: parseFloat(form.quantity) * 1000,
        notes: form.notes ? `${form.notes} | استعجال: ${form.urgency}` : `استعجال: ${form.urgency}`,
        status: 'pending',
        preferred_date: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('تم إرسال طلب الجمع الفوري — سيتم إشعار الناقلين');
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ waste_type: '', quantity: '', urgency: 'normal', notes: '' });
      }, 3000);
    } catch (err) {
      toast.error('فشل في إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="py-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="font-semibold text-lg">تم إرسال طلب الجمع!</p>
          <p className="text-sm text-muted-foreground">سيتم إشعار الناقلين المتاحين فوراً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-right">
          <CardTitle className="flex items-center gap-2 justify-end">
            <Zap className="w-5 h-5 text-yellow-500" />
            طلب جمع فوري
          </CardTitle>
          <CardDescription>اطلب جمع مخلفاتك الآن — إشعار فوري للناقلين</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>الكمية (طن)</Label>
            <Input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="10" />
          </div>
          <div>
            <Label>نوع المخلفات</Label>
            <Input value={form.waste_type} onChange={e => setForm(p => ({ ...p, waste_type: e.target.value }))} placeholder="بلاستيك، خشب..." />
          </div>
        </div>
        <div>
          <Label>درجة الاستعجال</Label>
          <Select value={form.urgency} onValueChange={v => setForm(p => ({ ...p, urgency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">عادي — خلال ٧ أيام</SelectItem>
              <SelectItem value="normal">متوسط — خلال ٣ أيام</SelectItem>
              <SelectItem value="high">عاجل — خلال ٢٤ ساعة</SelectItem>
              <SelectItem value="critical">طوارئ — فوري</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>ملاحظات (اختياري)</Label>
          <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="تفاصيل إضافية..." className="min-h-[60px]" />
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.waste_type || !form.quantity} className="w-full gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          إرسال طلب جمع فوري
        </Button>
      </CardContent>
    </Card>
  );
};

export default InstantPickupPortal;
