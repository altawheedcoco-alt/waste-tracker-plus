import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, ShoppingCart, TrendingUp, FileText, Receipt } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const poStatusLabels: Record<string, string> = {
  draft: 'مسودة', sent: 'مرسل', confirmed: 'مؤكد', received: 'مستلم', cancelled: 'ملغي',
};
const soStatusLabels: Record<string, string> = {
  draft: 'مسودة', confirmed: 'مؤكد', shipped: 'تم الشحن', delivered: 'مسلم', cancelled: 'ملغي',
};
const quotStatusLabels: Record<string, string> = {
  draft: 'مسودة', sent: 'مرسل', accepted: 'مقبول', rejected: 'مرفوض', expired: 'منتهي',
};

const ERPPurchasingAndSales = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const [showAddPO, setShowAddPO] = useState(false);
  const [showAddSO, setShowAddSO] = useState(false);
  const [showAddQuotation, setShowAddQuotation] = useState(false);
  const [newPO, setNewPO] = useState({ supplier_name: '', supplier_contact: '', notes: '' });
  const [newSO, setNewSO] = useState({ customer_name: '', customer_contact: '', notes: '' });
  const [newQuot, setNewQuot] = useState({ customer_name: '', customer_contact: '', valid_until: '', notes: '' });

  const { data: purchaseOrders = [], isLoading: loadingPO } = useQuery({
    queryKey: ['erp-purchase-orders', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_purchase_orders').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: salesOrders = [] } = useQuery({
    queryKey: ['erp-sales-orders', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_sales_orders').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ['erp-quotations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_quotations').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addPOMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('erp_purchase_orders').insert({ organization_id: orgId, po_number: poNumber, ...newPO });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-purchase-orders'] });
      setShowAddPO(false);
      setNewPO({ supplier_name: '', supplier_contact: '', notes: '' });
      toast.success('تم إنشاء أمر الشراء');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addSOMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const soNumber = `SO-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('erp_sales_orders').insert({ organization_id: orgId, so_number: soNumber, ...newSO });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-sales-orders'] });
      setShowAddSO(false);
      setNewSO({ customer_name: '', customer_contact: '', notes: '' });
      toast.success('تم إنشاء أمر البيع');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addQuotMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const qNumber = `QT-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from('erp_quotations').insert({ organization_id: orgId, quotation_number: qNumber, ...newQuot });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-quotations'] });
      setShowAddQuotation(false);
      setNewQuot({ customer_name: '', customer_contact: '', valid_until: '', notes: '' });
      toast.success('تم إنشاء عرض السعر');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPurchases = purchaseOrders.reduce((s, po) => s + (po.total_amount || 0), 0);
  const totalSales = salesOrders.reduce((s, so) => s + (so.total_amount || 0), 0);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-right">
          <h1 className="text-2xl font-bold">المشتريات والمبيعات</h1>
          <p className="text-muted-foreground">أوامر الشراء والبيع وعروض الأسعار</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'أوامر الشراء', value: purchaseOrders.length, icon: ShoppingCart, color: 'text-blue-600' },
            { label: 'أوامر البيع', value: salesOrders.length, icon: TrendingUp, color: 'text-green-600' },
            { label: 'إجمالي المشتريات', value: `${totalPurchases.toLocaleString()} ج.م`, icon: Receipt, color: 'text-red-600' },
            { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ج.م`, icon: FileText, color: 'text-primary' },
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

        <Tabs defaultValue="purchase-orders" dir="rtl">
          <TabsList>
            <TabsTrigger value="purchase-orders">أوامر الشراء</TabsTrigger>
            <TabsTrigger value="sales-orders">أوامر البيع</TabsTrigger>
            <TabsTrigger value="quotations">عروض الأسعار</TabsTrigger>
          </TabsList>

          {/* Purchase Orders */}
          <TabsContent value="purchase-orders" className="space-y-4">
            <Dialog open={showAddPO} onOpenChange={setShowAddPO}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />أمر شراء جديد</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إنشاء أمر شراء</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>اسم المورد</Label><Input value={newPO.supplier_name} onChange={e => setNewPO(p => ({ ...p, supplier_name: e.target.value }))} /></div>
                  <div><Label>تواصل المورد</Label><Input value={newPO.supplier_contact} onChange={e => setNewPO(p => ({ ...p, supplier_contact: e.target.value }))} /></div>
                  <div><Label>ملاحظات</Label><Input value={newPO.notes} onChange={e => setNewPO(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => addPOMutation.mutate()} disabled={addPOMutation.isPending}>إنشاء</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الأمر</TableHead>
                      <TableHead className="text-right">المورد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPO ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                    ) : purchaseOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد أوامر شراء</TableCell></TableRow>
                    ) : purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono">{po.po_number}</TableCell>
                        <TableCell>{po.supplier_name}</TableCell>
                        <TableCell>{new Date(po.order_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{(po.total_amount || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell><Badge variant="outline">{poStatusLabels[po.status || ''] || po.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Orders */}
          <TabsContent value="sales-orders" className="space-y-4">
            <Dialog open={showAddSO} onOpenChange={setShowAddSO}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />أمر بيع جديد</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إنشاء أمر بيع</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>اسم العميل</Label><Input value={newSO.customer_name} onChange={e => setNewSO(p => ({ ...p, customer_name: e.target.value }))} /></div>
                  <div><Label>تواصل العميل</Label><Input value={newSO.customer_contact} onChange={e => setNewSO(p => ({ ...p, customer_contact: e.target.value }))} /></div>
                  <div><Label>ملاحظات</Label><Input value={newSO.notes} onChange={e => setNewSO(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => addSOMutation.mutate()} disabled={addSOMutation.isPending}>إنشاء</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الأمر</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد أوامر بيع</TableCell></TableRow>
                    ) : salesOrders.map(so => (
                      <TableRow key={so.id}>
                        <TableCell className="font-mono">{so.so_number}</TableCell>
                        <TableCell>{so.customer_name}</TableCell>
                        <TableCell>{new Date(so.order_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{(so.total_amount || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell><Badge variant="outline">{soStatusLabels[so.status || ''] || so.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotations */}
          <TabsContent value="quotations" className="space-y-4">
            <Dialog open={showAddQuotation} onOpenChange={setShowAddQuotation}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />عرض سعر جديد</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إنشاء عرض سعر</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>اسم العميل</Label><Input value={newQuot.customer_name} onChange={e => setNewQuot(p => ({ ...p, customer_name: e.target.value }))} /></div>
                  <div><Label>تواصل العميل</Label><Input value={newQuot.customer_contact} onChange={e => setNewQuot(p => ({ ...p, customer_contact: e.target.value }))} /></div>
                  <div><Label>صالح حتى</Label><Input type="date" value={newQuot.valid_until} onChange={e => setNewQuot(p => ({ ...p, valid_until: e.target.value }))} /></div>
                  <div><Label>ملاحظات</Label><Input value={newQuot.notes} onChange={e => setNewQuot(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => addQuotMutation.mutate()} disabled={addQuotMutation.isPending}>إنشاء</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم العرض</TableHead>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">صالح حتى</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد عروض أسعار</TableCell></TableRow>
                    ) : quotations.map(q => (
                      <TableRow key={q.id}>
                        <TableCell className="font-mono">{q.quotation_number}</TableCell>
                        <TableCell>{q.customer_name}</TableCell>
                        <TableCell>{new Date(q.quote_date).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell>{q.valid_until ? new Date(q.valid_until).toLocaleDateString('ar-EG') : '-'}</TableCell>
                        <TableCell>{(q.total_amount || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell><Badge variant="outline">{quotStatusLabels[q.status || ''] || q.status}</Badge></TableCell>
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

export default ERPPurchasingAndSales;
