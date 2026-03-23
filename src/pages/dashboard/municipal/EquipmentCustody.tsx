import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Package, ArrowDownToLine, ArrowUpFromLine, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';

const itemCategories = [
  { value: 'tools', label: 'أدوات (مقشات، جاروفات)' },
  { value: 'bags', label: 'أكياس قمامة' },
  { value: 'ppe', label: 'معدات وقاية (قفازات، كمامات)' },
  { value: 'uniform', label: 'زي موحد' },
  { value: 'carts', label: 'عربات يد' },
  { value: 'containers', label: 'صناديق وحاويات' },
  { value: 'cleaning', label: 'مواد تنظيف' },
  { value: 'other', label: 'أخرى' },
];

const EquipmentCustody = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: '', item_category: 'tools', quantity_issued: '1',
    unit_cost: '', issued_to_name: '', issue_date: format(new Date(), 'yyyy-MM-dd'), notes: '',
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['equipment-custody', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('equipment_custody')
        .select('*').eq('organization_id', organization!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('equipment_custody').insert({
        organization_id: organization!.id,
        item_name: form.item_name,
        item_category: form.item_category,
        quantity_issued: Number(form.quantity_issued) || 1,
        unit_cost: Number(form.unit_cost) || 0,
        issued_to_name: form.issued_to_name,
        issue_date: form.issue_date,
        notes: form.notes,
        issued_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-custody'] });
      toast.success('تم تسجيل الصرف');
      setOpen(false);
    },
    onError: () => toast.error('فشل في تسجيل الصرف'),
  });

  const totalIssued = records.reduce((s: number, r: any) => s + (r.quantity_issued || 0), 0);
  const totalReturned = records.reduce((s: number, r: any) => s + (r.quantity_returned || 0), 0);
  const totalCost = records.reduce((s: number, r: any) => s + ((r.quantity_issued || 0) * (r.unit_cost || 0)), 0);

  // Group by category
  const categorySummary = records.reduce((acc: any, r: any) => {
    const cat = r.item_category || 'other';
    if (!acc[cat]) acc[cat] = { issued: 0, returned: 0, cost: 0 };
    acc[cat].issued += r.quantity_issued || 0;
    acc[cat].returned += r.quantity_returned || 0;
    acc[cat].cost += (r.quantity_issued || 0) * (r.unit_cost || 0);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">العُهد والمستلزمات</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 ml-1" />صرف جديد</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>صرف مستلزمات</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>الصنف</Label><Input value={form.item_name} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="مثال: مقشة خوص، قفازات جلد" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الفئة</Label>
                    <Select value={form.item_category} onValueChange={v => setForm(p => ({ ...p, item_category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{itemCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>الكمية</Label><Input type="number" value={form.quantity_issued} onChange={e => setForm(p => ({ ...p, quantity_issued: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>سعر الوحدة (ج.م)</Label><Input type="number" value={form.unit_cost} onChange={e => setForm(p => ({ ...p, unit_cost: e.target.value }))} /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} /></div>
                </div>
                <div><Label>المستلم</Label><Input value={form.issued_to_name} onChange={e => setForm(p => ({ ...p, issued_to_name: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.item_name}>
                  {addMutation.isPending ? 'جاري الحفظ...' : 'تسجيل الصرف'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center">
            <ArrowDownToLine className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalIssued}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي المنصرف</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <ArrowUpFromLine className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold">{totalReturned}</p>
            <p className="text-[10px] text-muted-foreground">المرتجع</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Wrench className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">{totalCost.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">التكلفة (ج.م)</p>
          </CardContent></Card>
        </div>

        {/* Category Summary */}
        {Object.keys(categorySummary).length > 0 && (
          <Card>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm mb-2">ملخص حسب الفئة</h3>
              <div className="space-y-1">
                {Object.entries(categorySummary).map(([cat, data]: [string, any]) => {
                  const catLabel = itemCategories.find(c => c.value === cat)?.label || cat;
                  return (
                    <div key={cat} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span>{catLabel}</span>
                      <div className="flex gap-3 text-xs">
                        <span>صرف: {data.issued}</span>
                        <span>مرتجع: {data.returned}</span>
                        <span className="font-medium">{data.cost.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : records.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد سجلات صرف</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 50).map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.issued_to_name} — {format(new Date(r.issue_date), 'yyyy/MM/dd')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{r.quantity_issued} وحدة</p>
                    <p className="text-xs text-muted-foreground">{((r.quantity_issued || 0) * (r.unit_cost || 0)).toLocaleString()} ج.م</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EquipmentCustody;
