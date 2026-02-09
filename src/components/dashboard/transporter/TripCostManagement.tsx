import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Plus, TrendingUp, TrendingDown, Fuel, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TripCostManagement = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    shipment_id: '',
    fuel_cost: '',
    toll_fees: '',
    maintenance_cost: '',
    labor_cost: '',
    other_costs: '',
    revenue: '',
    distance_km: '',
    notes: '',
    trip_date: new Date().toISOString().split('T')[0],
  });

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ['trip-costs', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_costs')
        .select('*, shipment:shipments(shipment_number)')
        .eq('organization_id', organization!.id)
        .order('trip_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addCost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('trip_costs').insert({
        organization_id: organization!.id,
        shipment_id: form.shipment_id || null,
        fuel_cost: Number(form.fuel_cost) || 0,
        toll_fees: Number(form.toll_fees) || 0,
        maintenance_cost: Number(form.maintenance_cost) || 0,
        labor_cost: Number(form.labor_cost) || 0,
        other_costs: Number(form.other_costs) || 0,
        revenue: Number(form.revenue) || 0,
        distance_km: Number(form.distance_km) || 0,
        notes: form.notes || null,
        trip_date: form.trip_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-costs'] });
      toast.success('تم إضافة تكلفة الرحلة');
      setOpen(false);
      setForm({ shipment_id: '', fuel_cost: '', toll_fees: '', maintenance_cost: '', labor_cost: '', other_costs: '', revenue: '', distance_km: '', notes: '', trip_date: new Date().toISOString().split('T')[0] });
    },
    onError: () => toast.error('حدث خطأ'),
  });

  // Summary stats
  const totalRevenue = costs.reduce((s, c) => s + Number(c.revenue || 0), 0);
  const totalCost = costs.reduce((s, c) => s + Number(c.total_cost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> إضافة تكلفة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader><DialogTitle>إضافة تكلفة رحلة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الوقود</Label><Input type="number" value={form.fuel_cost} onChange={e => setForm(f => ({ ...f, fuel_cost: e.target.value }))} placeholder="0" /></div>
                  <div><Label>الرسوم</Label><Input type="number" value={form.toll_fees} onChange={e => setForm(f => ({ ...f, toll_fees: e.target.value }))} placeholder="0" /></div>
                  <div><Label>الصيانة</Label><Input type="number" value={form.maintenance_cost} onChange={e => setForm(f => ({ ...f, maintenance_cost: e.target.value }))} placeholder="0" /></div>
                  <div><Label>العمالة</Label><Input type="number" value={form.labor_cost} onChange={e => setForm(f => ({ ...f, labor_cost: e.target.value }))} placeholder="0" /></div>
                  <div><Label>أخرى</Label><Input type="number" value={form.other_costs} onChange={e => setForm(f => ({ ...f, other_costs: e.target.value }))} placeholder="0" /></div>
                  <div><Label>الإيراد</Label><Input type="number" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>المسافة (كم)</Label><Input type="number" value={form.distance_km} onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} placeholder="0" /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.trip_date} onChange={e => setForm(f => ({ ...f, trip_date: e.target.value }))} /></div>
                </div>
                <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="اختياري" /></div>
                <Button className="w-full" onClick={() => addCost.mutate()} disabled={addCost.isPending}>
                  {addCost.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-primary" />
            إدارة تكاليف الرحلات
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg border">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold">{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">الإيرادات</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <Fuel className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold">{totalCost.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">التكاليف</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            {totalProfit >= 0 ? <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" /> : <TrendingDown className="w-5 h-5 mx-auto mb-1 text-red-600" />}
            <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{totalProfit.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">صافي الربح</p>
          </div>
          <div className="text-center p-3 rounded-lg border">
            <Wrench className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{profitMargin}%</p>
            <p className="text-xs text-muted-foreground">هامش الربح</p>
          </div>
        </div>

        {/* Recent entries */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">جاري التحميل...</div>
        ) : costs.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">لا توجد بيانات بعد</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {costs.map(cost => (
              <div key={cost.id} className="flex items-center justify-between p-2.5 rounded-lg border text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={Number(cost.profit) >= 0 ? 'default' : 'destructive'} className="text-xs">
                    {Number(cost.profit) >= 0 ? '+' : ''}{Number(cost.profit).toLocaleString()}
                  </Badge>
                  <span className="text-muted-foreground">{Number(cost.distance_km)} كم</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{(cost as any).shipment?.shipment_number || 'رحلة عامة'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(cost.trip_date), 'd MMM yyyy', { locale: ar })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripCostManagement;
