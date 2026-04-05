/**
 * جدولة الشحنات المتكررة - أتمتة طلبات الشحن الدورية
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Plus, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const RecurringShipmentScheduler = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ wasteType: '', frequency: 'weekly', quantity: '', unit: 'kg' });

  const { data: schedules = [] } = useQuery({
    queryKey: ['recurring-schedules', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('scheduled_collections')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const handleCreate = async () => {
    if (!organization?.id || !form.wasteType || !form.quantity) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('scheduled_collections').insert([{
        waste_type: form.wasteType,
        frequency: form.frequency,
        estimated_quantity: parseFloat(form.quantity),
        quantity_unit: form.unit,
        is_active: true,
        next_collection_date: new Date(Date.now() + (form.frequency === 'daily' ? 86400000 : form.frequency === 'weekly' ? 604800000 : 2592000000)).toISOString().split('T')[0],
      }]);
      if (error) throw error;
      toast.success('✅ تم إنشاء جدولة شحنة متكررة');
      setShowForm(false);
      setForm({ wasteType: '', frequency: 'weekly', quantity: '', unit: 'kg' });
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    } catch (err: any) {
      toast.error(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const freqLabel: Record<string, string> = { daily: 'يومياً', weekly: 'أسبوعياً', biweekly: 'كل أسبوعين', monthly: 'شهرياً' };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3 w-3 ml-1" />
            إضافة
          </Button>
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            شحنات متكررة
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent dir="rtl" className="space-y-2">
        {showForm && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">نوع المخلف</Label>
                <Input className="h-8 text-xs" value={form.wasteType} onChange={e => setForm(f => ({ ...f, wasteType: e.target.value }))} placeholder="بلاستيك، ورق..." />
              </div>
              <div>
                <Label className="text-xs">التكرار</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">يومياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="biweekly">كل أسبوعين</SelectItem>
                    <SelectItem value="monthly">شهرياً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Input type="number" className="h-8 text-xs" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="الكمية" />
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">كجم</SelectItem>
                  <SelectItem value="ton">طن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleCreate} disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الجدولة'}
            </Button>
          </div>
        )}

        {schedules.length === 0 && !showForm ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد شحنات متكررة مجدولة</p>
        ) : (
          schedules.slice(0, 5).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
              <div className="flex items-center gap-1">
                <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {s.status === 'active' ? 'نشط' : 'متوقف'}
                </Badge>
                <span className="text-xs text-muted-foreground">{freqLabel[s.frequency] || s.frequency}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium">{s.waste_type}</span>
                <span className="text-[10px] text-muted-foreground mr-1">({s.estimated_quantity} {s.quantity_unit})</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringShipmentScheduler;
