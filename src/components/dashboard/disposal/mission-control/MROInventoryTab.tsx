import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Plus, AlertTriangle, Package, Minus, DollarSign, Beaker, Filter, Fuel } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MROInventoryTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
}

const MROInventoryTab = ({ facilityId, organizationId }: MROInventoryTabProps) => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showConsume, setShowConsume] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [consumeQty, setConsumeQty] = useState('');
  const [form, setForm] = useState({ item_name: '', category: 'chemical', sku: '', current_stock: '', minimum_stock: '', unit: 'unit', unit_cost: '', supplier: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['mro-inventory', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase.from('mro_inventory').select('*').eq('organization_id', organizationId).order('item_name', { ascending: true });
      return data || [];
    },
    enabled: !!organizationId,
  });

  const addMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from('mro_inventory').insert({
        organization_id: organizationId!, disposal_facility_id: facilityId,
        item_name: f.item_name, category: f.category, sku: f.sku,
        current_stock: Number(f.current_stock) || 0, minimum_stock: Number(f.minimum_stock) || 0,
        unit: f.unit, unit_cost: Number(f.unit_cost) || 0, supplier: f.supplier,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة الصنف بنجاح');
      setShowAdd(false);
      setForm({ item_name: '', category: 'chemical', sku: '', current_stock: '', minimum_stock: '', unit: 'unit', unit_cost: '', supplier: '' });
      queryClient.invalidateQueries({ queryKey: ['mro-inventory'] });
    },
  });

  const consumeMutation = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
      const item = items.find((i: any) => i.id === itemId);
      if (!item) throw new Error('Item not found');
      const newStock = Math.max(0, (item.current_stock || 0) - qty);
      
      // Update stock
      const { error: updateErr } = await supabase.from('mro_inventory').update({
        current_stock: newStock, updated_at: new Date().toISOString(),
      }).eq('id', itemId);
      if (updateErr) throw updateErr;

      // Log usage
      const { error: logErr } = await supabase.from('mro_usage_log').insert({
        organization_id: organizationId!, mro_item_id: itemId, quantity_used: qty,
      });
      if (logErr) throw logErr;

      return { newStock, minimum: item.minimum_stock };
    },
    onSuccess: (result) => {
      toast.success(`تم خصم الكمية — المخزون الحالي: ${result.newStock}`);
      if (result.newStock <= result.minimum) {
        toast.warning('⚠️ تنبيه: المخزون وصل الحد الأدنى — يرجى إعادة التوريد!');
      }
      setShowConsume(false);
      setConsumeQty('');
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ['mro-inventory'] });
    },
  });

  const lowStockItems = items.filter((i: any) => i.current_stock <= i.minimum_stock && i.minimum_stock > 0);
  const totalValue = items.reduce((s: number, i: any) => s + ((i.current_stock || 0) * (i.unit_cost || 0)), 0);

  const categoryIcons: Record<string, { label: string; icon: any }> = {
    chemical: { label: 'مواد كيميائية', icon: Beaker },
    filter: { label: 'فلاتر', icon: Filter },
    fuel: { label: 'وقود', icon: Fuel },
    spare_part: { label: 'قطع غيار', icon: Wrench },
    consumable: { label: 'مستهلكات', icon: Package },
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 bg-blue-100 dark:bg-blue-900/30"><Package className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-muted-foreground">أصناف مسجلة</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 bg-red-100 dark:bg-red-900/30"><AlertTriangle className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{lowStockItems.length}</p>
              <p className="text-xs text-muted-foreground">أصناف تحت الحد الأدنى</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-purple-600 bg-purple-100 dark:bg-purple-900/30"><DollarSign className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">قيمة المخزون (ج.م)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 dark:border-red-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" /> تنبيهات المخزون</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 dark:bg-red-950/10 border border-red-200">
                <Badge variant="destructive" className="text-xs">⚠️ تحت الحد الأدنى</Badge>
                <div className="text-right flex-1 mx-3">
                  <p className="font-medium text-sm">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">الحالي: {item.current_stock} {item.unit} • الحد الأدنى: {item.minimum_stock}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAdd(true)}>
              <Plus className="w-3 h-3" /> إضافة صنف
            </Button>
            <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /> المخزن الفني (MRO)</CardTitle>
          </div>
          <CardDescription className="text-right">فلاتر، مواد كيميائية، وقود، قطع غيار — خصم آلي عند المعالجة</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لم يتم تسجيل أصناف بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item: any) => {
                const cat = categoryIcons[item.category] || categoryIcons.consumable;
                const isLow = item.current_stock <= item.minimum_stock && item.minimum_stock > 0;
                return (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border bg-card ${isLow ? 'border-red-200' : ''}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => { setSelectedItem(item); setShowConsume(true); }}>
                      <Minus className="w-3 h-3" /> استهلاك
                    </Button>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.current_stock} {item.unit}</Badge>
                      {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="text-right flex-1 mx-3">
                      <p className="font-medium text-sm flex items-center gap-2 justify-end">
                        <span>{item.item_name}</span>
                        <cat.icon className="w-4 h-4 text-muted-foreground" />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.label} • {item.unit_cost > 0 ? `${item.unit_cost} ج.م/${item.unit}` : ''} {item.supplier ? `• ${item.supplier}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> إضافة صنف جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم الصنف *</Label>
                <Input placeholder="مثال: كلور التعقيم" value={form.item_name} onChange={(e) => setForm(p => ({ ...p, item_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chemical">مواد كيميائية</SelectItem>
                    <SelectItem value="filter">فلاتر</SelectItem>
                    <SelectItem value="fuel">وقود</SelectItem>
                    <SelectItem value="spare_part">قطع غيار</SelectItem>
                    <SelectItem value="consumable">مستهلكات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>المخزون الحالي</Label>
                <Input type="number" placeholder="0" value={form.current_stock} onChange={(e) => setForm(p => ({ ...p, current_stock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى</Label>
                <Input type="number" placeholder="0" value={form.minimum_stock} onChange={(e) => setForm(p => ({ ...p, minimum_stock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">وحدة</SelectItem>
                    <SelectItem value="kg">كجم</SelectItem>
                    <SelectItem value="liter">لتر</SelectItem>
                    <SelectItem value="piece">قطعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>سعر الوحدة (ج.م)</Label>
                <Input type="number" placeholder="0" value={form.unit_cost} onChange={(e) => setForm(p => ({ ...p, unit_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>المورد</Label>
                <Input placeholder="اسم المورد" value={form.supplier} onChange={(e) => setForm(p => ({ ...p, supplier: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full gap-2" onClick={() => addMutation.mutate(form)} disabled={!form.item_name || addMutation.isPending}>
              <Plus className="w-4 h-4" /> {addMutation.isPending ? 'جاري الإضافة...' : 'إضافة الصنف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consume Dialog */}
      <Dialog open={showConsume} onOpenChange={setShowConsume}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Minus className="w-5 h-5" /> استهلاك — {selectedItem?.item_name}</DialogTitle>
            <DialogDescription>خصم كمية مستخدمة من المخزون</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-right">
                <p className="text-sm">المخزون الحالي: <span className="font-bold">{selectedItem.current_stock} {selectedItem.unit}</span></p>
                <p className="text-sm">الحد الأدنى: <span className="font-bold">{selectedItem.minimum_stock} {selectedItem.unit}</span></p>
              </div>
              <div className="space-y-2">
                <Label>الكمية المستهلكة *</Label>
                <Input type="number" placeholder="0" value={consumeQty} onChange={(e) => setConsumeQty(e.target.value)} />
              </div>
              {Number(consumeQty) > 0 && selectedItem.unit_cost > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">تكلفة الاستهلاك</p>
                  <p className="text-2xl font-bold text-primary">{(Number(consumeQty) * selectedItem.unit_cost).toLocaleString()} ج.م</p>
                </div>
              )}
              <Button className="w-full gap-2" onClick={() => consumeMutation.mutate({ itemId: selectedItem.id, qty: Number(consumeQty) })}
                disabled={!consumeQty || Number(consumeQty) <= 0 || consumeMutation.isPending}>
                <Minus className="w-4 h-4" /> {consumeMutation.isPending ? 'جاري الخصم...' : 'خصم الكمية'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MROInventoryTab;
