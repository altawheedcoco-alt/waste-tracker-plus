/**
 * بوابة المزايدة العكسية - الناقلون يتنافسون على أفضل سعر
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, Clock, Users, TrendingDown, Plus, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuctionForm {
  wasteType: string;
  quantity: string;
  unit: string;
  pickupAddress: string;
  maxBudget: string;
  deadline: string;
}

const WASTE_TYPES = ['بلاستيك', 'ورق وكرتون', 'حديد وخردة', 'زجاج', 'مخلفات عضوية', 'مخلفات بناء', 'مخلفات طبية', 'إلكترونيات', 'زيوت مستعملة', 'أخرى'];

const ReverseAuctionPortal = () => {
  const { organization } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AuctionForm>({ wasteType: '', quantity: '', unit: 'kg', pickupAddress: '', maxBudget: '', deadline: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!organization?.id || !form.wasteType || !form.quantity) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsSubmitting(true);
    try {
      // Create a work order as a reverse auction request
      const { error } = await supabase.from('work_orders').insert({
        organization_id: organization.id,
        title: `مزايدة عكسية: ${form.wasteType} - ${form.quantity} ${form.unit}`,
        description: `طلب مزايدة عكسية\nنوع المخلف: ${form.wasteType}\nالكمية: ${form.quantity} ${form.unit}\nعنوان الاستلام: ${form.pickupAddress}\nالميزانية القصوى: ${form.maxBudget} ج.م\nآخر موعد: ${form.deadline}`,
        order_type: 'reverse_auction',
        status: 'open',
        waste_type: form.wasteType,
        estimated_quantity: parseFloat(form.quantity) || 0,
        quantity_unit: form.unit,
      });
      if (error) throw error;
      toast.success('✅ تم نشر طلب المزايدة العكسية بنجاح');
      setShowForm(false);
      setForm({ wasteType: '', quantity: '', unit: 'kg', pickupAddress: '', maxBudget: '', deadline: '' });
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-amber-200/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-3 w-3" />
            مزايدة جديدة
          </Button>
          <CardTitle className="text-sm flex items-center gap-2">
            <Gavel className="h-4 w-4 text-amber-600" />
            المزايدة العكسية
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent dir="rtl">
        {!showForm ? (
          <div className="text-center py-6 space-y-3">
            <div className="flex justify-center gap-4 text-muted-foreground">
              <div className="text-center">
                <TrendingDown className="h-8 w-8 mx-auto text-green-500 mb-1" />
                <span className="text-xs">أسعار أقل</span>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-1" />
                <span className="text-xs">تنافس مفتوح</span>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto text-amber-500 mb-1" />
                <span className="text-xs">عروض فورية</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">أنشئ طلب مزايدة عكسية ودع الناقلين يتنافسون ليقدموا لك أفضل سعر</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">نوع المخلف *</Label>
                <Select value={form.wasteType} onValueChange={v => setForm(f => ({ ...f, wasteType: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {WASTE_TYPES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">الكمية *</Label>
                <div className="flex gap-1">
                  <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                    <SelectTrigger className="h-9 w-20 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">كجم</SelectItem>
                      <SelectItem value="ton">طن</SelectItem>
                      <SelectItem value="m3">م³</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" className="h-9 text-xs" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">عنوان الاستلام</Label>
              <Input className="h-9 text-xs" value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} placeholder="المدينة - الحي - الشارع" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">الميزانية القصوى (ج.م)</Label>
                <Input type="number" className="h-9 text-xs" value={form.maxBudget} onChange={e => setForm(f => ({ ...f, maxBudget: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">آخر موعد للعروض</Label>
                <Input type="date" className="h-9 text-xs" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {isSubmitting ? 'جاري النشر...' : 'نشر طلب المزايدة'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReverseAuctionPortal;
