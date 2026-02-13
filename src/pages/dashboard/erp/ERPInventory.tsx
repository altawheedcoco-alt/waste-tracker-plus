import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Package, Warehouse, ArrowUpDown, ClipboardList, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const ERPInventory = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newItem, setNewItem] = useState({ item_code: '', item_name: '', category: '', unit: 'piece', unit_cost: 0, selling_price: 0, minimum_stock: 0 });
  const [newWarehouse, setNewWarehouse] = useState({ name: '', code: '', location: '' });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['erp-inventory-items', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_inventory_items').select('*').eq('organization_id', orgId).order('item_code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['erp-warehouses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_warehouses').select('*').eq('organization_id', orgId).order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['erp-stock-movements', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_stock_movements').select('*, item:erp_inventory_items(item_name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_inventory_items').insert({ organization_id: orgId, ...newItem });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-inventory-items'] });
      setShowAddItem(false);
      setNewItem({ item_code: '', item_name: '', category: '', unit: 'piece', unit_cost: 0, selling_price: 0, minimum_stock: 0 });
      toast.success('تم إضافة الصنف');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addWarehouseMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_warehouses').insert({ organization_id: orgId, ...newWarehouse });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-warehouses'] });
      setShowAddWarehouse(false);
      setNewWarehouse({ name: '', code: '', location: '' });
      toast.success('تم إضافة المستودع');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const lowStockItems = items.filter(i => i.current_stock <= (i.minimum_stock || 0));
  const totalValue = items.reduce((s, i) => s + (i.current_stock * (i.unit_cost || 0)), 0);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-right">
          <h1 className="text-2xl font-bold">إدارة المخزون</h1>
          <p className="text-muted-foreground">المستودعات والأصناف وحركة المخزون</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الأصناف', value: items.length, icon: Package, color: 'text-blue-600' },
            { label: 'المستودعات', value: warehouses.length, icon: Warehouse, color: 'text-green-600' },
            { label: 'قيمة المخزون', value: `${totalValue.toLocaleString()} ج.م`, icon: ArrowUpDown, color: 'text-primary' },
            { label: 'أصناف منخفضة', value: lowStockItems.length, icon: AlertTriangle, color: 'text-red-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-right">
                <div className="flex items-center justify-between">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="items" dir="rtl">
          <TabsList>
            <TabsTrigger value="items">الأصناف</TabsTrigger>
            <TabsTrigger value="warehouses">المستودعات</TabsTrigger>
            <TabsTrigger value="movements">حركة المخزون</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />إضافة صنف</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إضافة صنف جديد</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>كود الصنف</Label><Input value={newItem.item_code} onChange={e => setNewItem(p => ({ ...p, item_code: e.target.value }))} /></div>
                    <div><Label>الفئة</Label><Input value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} /></div>
                  </div>
                  <div><Label>اسم الصنف</Label><Input value={newItem.item_name} onChange={e => setNewItem(p => ({ ...p, item_name: e.target.value }))} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>الوحدة</Label><Input value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))} /></div>
                    <div><Label>سعر التكلفة</Label><Input type="number" value={newItem.unit_cost || ''} onChange={e => setNewItem(p => ({ ...p, unit_cost: parseFloat(e.target.value) || 0 }))} /></div>
                    <div><Label>سعر البيع</Label><Input type="number" value={newItem.selling_price || ''} onChange={e => setNewItem(p => ({ ...p, selling_price: parseFloat(e.target.value) || 0 }))} /></div>
                  </div>
                  <div><Label>الحد الأدنى للمخزون</Label><Input type="number" value={newItem.minimum_stock || ''} onChange={e => setNewItem(p => ({ ...p, minimum_stock: parseFloat(e.target.value) || 0 }))} /></div>
                  <Button className="w-full" onClick={() => addItemMutation.mutate()} disabled={addItemMutation.isPending}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الكود</TableHead>
                      <TableHead className="text-right">الصنف</TableHead>
                      <TableHead className="text-right">الفئة</TableHead>
                      <TableHead className="text-right">المخزون</TableHead>
                      <TableHead className="text-right">التكلفة</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingItems ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد أصناف</TableCell></TableRow>
                    ) : items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.item_code}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.current_stock} {item.unit}</TableCell>
                        <TableCell>{(item.unit_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>{(item.selling_price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {item.current_stock <= (item.minimum_stock || 0)
                            ? <Badge variant="destructive">منخفض</Badge>
                            : <Badge variant="default">متوفر</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warehouses" className="space-y-4">
            <Dialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />إضافة مستودع</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إضافة مستودع</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>اسم المستودع</Label><Input value={newWarehouse.name} onChange={e => setNewWarehouse(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>الكود</Label><Input value={newWarehouse.code} onChange={e => setNewWarehouse(p => ({ ...p, code: e.target.value }))} /></div>
                  <div><Label>الموقع</Label><Input value={newWarehouse.location} onChange={e => setNewWarehouse(p => ({ ...p, location: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => addWarehouseMutation.mutate()} disabled={addWarehouseMutation.isPending}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouses.map(w => (
                <Card key={w.id}>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-center gap-3">
                      <Warehouse className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{w.name}</h3>
                        <p className="text-sm text-muted-foreground">{w.location || 'بدون موقع'}</p>
                        {w.code && <Badge variant="outline" className="mt-1">{w.code}</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {warehouses.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-8">لا توجد مستودعات</p>}
            </div>
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الصنف</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد حركات</TableCell></TableRow>
                    ) : movements.map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{m.item?.item_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={m.movement_type === 'in' ? 'default' : m.movement_type === 'out' ? 'destructive' : 'secondary'}>
                            {m.movement_type === 'in' ? 'وارد' : m.movement_type === 'out' ? 'صادر' : m.movement_type === 'transfer' ? 'تحويل' : 'تسوية'}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.quantity}</TableCell>
                        <TableCell>{m.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ERPInventory;
