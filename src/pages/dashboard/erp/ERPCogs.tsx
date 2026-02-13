import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useExcelExport } from '@/hooks/useExcelExport';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Calculator, Package, TrendingUp, TrendingDown, AlertTriangle,
  Download, Calendar, Plus, DollarSign, Boxes, BarChart3,
  ArrowRight, RefreshCw, Target, Flame
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ERPCogs = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;
  const [showCalculate, setShowCalculate] = useState(false);
  const [marginThreshold, setMarginThreshold] = useState(15);
  const { exportToExcel, isExporting } = useExcelExport({ filename: 'تكلفة-البضاعة-المباعة' });

  const [calcForm, setCalcForm] = useState({
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    valuation_method: 'weighted_average' as 'weighted_average' | 'fifo',
    purchase_freight: 0,
    direct_labor: 0,
    wastage: 0,
  });

  // Fetch COGS records
  const { data: cogsRecords = [], isLoading } = useQuery({
    queryKey: ['erp-cogs-records', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_cogs_records')
        .select('*')
        .eq('organization_id', orgId)
        .order('period_end', { ascending: false })
        .limit(24);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch inventory items for current stock value
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['erp-inventory-cogs', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_inventory_items')
        .select('id, item_name, item_code, unit_cost, selling_price, current_stock, category')
        .eq('organization_id', orgId)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch stock movements for period calculations
  const { data: movements = [] } = useQuery({
    queryKey: ['erp-movements-cogs', orgId, calcForm.period_start, calcForm.period_end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_stock_movements')
        .select('*, erp_inventory_items!inner(item_name, unit_cost, selling_price, category)')
        .eq('organization_id', orgId)
        .gte('created_at', calcForm.period_start)
        .lte('created_at', calcForm.period_end + 'T23:59:59');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch revenue from journal entries for the same period
  const { data: periodRevenue = 0 } = useQuery({
    queryKey: ['erp-revenue-cogs', orgId, calcForm.period_start, calcForm.period_end],
    queryFn: async () => {
      if (!orgId) return 0;
      const { data: entries } = await supabase
        .from('erp_journal_entries')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'posted')
        .gte('entry_date', calcForm.period_start)
        .lte('entry_date', calcForm.period_end);
      if (!entries?.length) return 0;
      const { data: lines } = await supabase
        .from('erp_journal_lines')
        .select('debit, credit, erp_chart_of_accounts!inner(account_type)')
        .in('journal_entry_id', entries.map(e => e.id));
      return (lines || []).reduce((sum: number, l: any) => {
        if (l.erp_chart_of_accounts.account_type === 'revenue')
          return sum + ((Number(l.credit) || 0) - (Number(l.debit) || 0));
        return sum;
      }, 0);
    },
    enabled: !!orgId,
  });

  // Calculate COGS
  const calculatedCogs = useMemo(() => {
    const inbound = movements.filter((m: any) => m.movement_type === 'in' || m.movement_type === 'purchase' || m.movement_type === 'return_in');
    const outbound = movements.filter((m: any) => m.movement_type === 'out' || m.movement_type === 'sale' || m.movement_type === 'return_out' || m.movement_type === 'wastage');

    // Opening inventory = sum of item costs at start (approximation from current stock)
    const currentInventoryValue = inventoryItems.reduce((s, i) => s + (i.current_stock || 0) * (i.unit_cost || 0), 0);

    // Purchases during period
    const purchases = inbound.reduce((s: number, m: any) => s + (Number(m.quantity) || 0) * (Number(m.unit_cost) || 0), 0);

    // Closing inventory = current value
    const closingInventory = currentInventoryValue;

    // COGS based on valuation method
    let cogsValue: number;
    if (calcForm.valuation_method === 'fifo') {
      // FIFO: cost the outbound based on earliest purchase prices
      let fifoTotal = 0;
      const purchaseQueue = inbound.map((m: any) => ({
        qty: Number(m.quantity) || 0,
        cost: Number(m.unit_cost) || 0,
      }));

      let remainingOut = outbound.reduce((s: number, m: any) => s + (Number(m.quantity) || 0), 0);
      for (const p of purchaseQueue) {
        if (remainingOut <= 0) break;
        const used = Math.min(p.qty, remainingOut);
        fifoTotal += used * p.cost;
        remainingOut -= used;
      }
      cogsValue = fifoTotal + calcForm.purchase_freight + calcForm.direct_labor + calcForm.wastage;
    } else {
      // Weighted Average
      const totalQty = inbound.reduce((s: number, m: any) => s + (Number(m.quantity) || 0), 0);
      const avgCost = totalQty > 0 ? purchases / totalQty : 0;
      const soldQty = outbound.reduce((s: number, m: any) => s + (Number(m.quantity) || 0), 0);
      cogsValue = (soldQty * avgCost) + calcForm.purchase_freight + calcForm.direct_labor + calcForm.wastage;
    }

    const grossProfit = periodRevenue - cogsValue;
    const grossProfitMargin = periodRevenue > 0 ? (grossProfit / periodRevenue * 100) : 0;

    // Per-item margins
    const itemMargins = inventoryItems.map(item => ({
      name: item.item_name,
      code: item.item_code,
      cost: item.unit_cost || 0,
      price: item.selling_price || 0,
      margin: (item.selling_price || 0) > 0
        ? (((item.selling_price || 0) - (item.unit_cost || 0)) / (item.selling_price || 0) * 100)
        : 0,
      stock: item.current_stock || 0,
      lowMargin: (item.selling_price || 0) > 0
        ? (((item.selling_price || 0) - (item.unit_cost || 0)) / (item.selling_price || 0) * 100) < marginThreshold
        : false,
    })).sort((a, b) => a.margin - b.margin);

    // COGS breakdown for pie chart
    const breakdown = [
      { name: 'تكلفة المشتريات', value: purchases },
      { name: 'الشحن والجمارك', value: calcForm.purchase_freight },
      { name: 'العمالة المباشرة', value: calcForm.direct_labor },
      { name: 'الفاقد والتالف', value: calcForm.wastage },
    ].filter(b => b.value > 0);

    return {
      purchases,
      closingInventory,
      openingInventory: closingInventory + cogsValue - purchases, // back-calculate
      cogs: cogsValue,
      grossProfit,
      grossProfitMargin,
      itemMargins,
      breakdown,
      lowMarginItems: itemMargins.filter(i => i.lowMargin),
    };
  }, [movements, inventoryItems, calcForm, periodRevenue, marginThreshold]);

  // Save COGS record
  const saveCogsMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_cogs_records').insert({
        organization_id: orgId,
        period_start: calcForm.period_start,
        period_end: calcForm.period_end,
        opening_inventory: calculatedCogs.openingInventory,
        purchases: calculatedCogs.purchases,
        purchase_freight: calcForm.purchase_freight,
        direct_labor: calcForm.direct_labor,
        wastage: calcForm.wastage,
        closing_inventory: calculatedCogs.closingInventory,
        cogs: calculatedCogs.cogs,
        revenue: periodRevenue,
        gross_profit: calculatedCogs.grossProfit,
        gross_profit_margin: calculatedCogs.grossProfitMargin,
        valuation_method: calcForm.valuation_method,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-cogs-records'] });
      setShowCalculate(false);
      toast.success('تم حفظ حساب تكلفة البضاعة المباعة بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const fmt = (v: number) => v.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Historical trend data
  const trendData = useMemo(() =>
    [...cogsRecords].reverse().map(r => ({
      period: new Date(r.period_end).toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
      'تكلفة البضاعة': r.cogs,
      'الإيرادات': r.revenue,
      'مجمل الربح': r.gross_profit,
    })),
  [cogsRecords]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-7 w-7 text-primary" />
              تكلفة البضاعة المباعة (COGS)
            </h1>
            <p className="text-muted-foreground">ربط المخزون بالمالية وحساب مجمل الربح</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const data = cogsRecords.map(r => ({
                period: `${r.period_start} - ${r.period_end}`,
                opening: r.opening_inventory, purchases: r.purchases,
                freight: r.purchase_freight, labor: r.direct_labor,
                wastage: r.wastage, closing: r.closing_inventory,
                cogs: r.cogs, revenue: r.revenue,
                gross: r.gross_profit, margin: `${Number(r.gross_profit_margin).toFixed(1)}%`,
              }));
              exportToExcel(data, [
                { header: 'الفترة', key: 'period', width: 25 },
                { header: 'مخزون أول المدة', key: 'opening', width: 18 },
                { header: 'المشتريات', key: 'purchases', width: 15 },
                { header: 'الشحن', key: 'freight', width: 12 },
                { header: 'عمالة مباشرة', key: 'labor', width: 15 },
                { header: 'الفاقد', key: 'wastage', width: 12 },
                { header: 'مخزون آخر المدة', key: 'closing', width: 18 },
                { header: 'COGS', key: 'cogs', width: 15 },
                { header: 'الإيرادات', key: 'revenue', width: 15 },
                { header: 'مجمل الربح', key: 'gross', width: 15 },
                { header: 'الهامش', key: 'margin', width: 10 },
              ], 'سجل-COGS');
            }} disabled={isExporting}>
              <Download className="ml-2 h-4 w-4" />Excel
            </Button>
            <Dialog open={showCalculate} onOpenChange={setShowCalculate}>
              <DialogTrigger asChild>
                <Button><Plus className="ml-2 h-4 w-4" />حساب COGS جديد</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-xl">
                <DialogHeader><DialogTitle>حساب تكلفة البضاعة المباعة</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>من تاريخ</Label><Input type="date" value={calcForm.period_start} onChange={e => setCalcForm(p => ({ ...p, period_start: e.target.value }))} /></div>
                    <div><Label>إلى تاريخ</Label><Input type="date" value={calcForm.period_end} onChange={e => setCalcForm(p => ({ ...p, period_end: e.target.value }))} /></div>
                  </div>
                  <div>
                    <Label>طريقة التقييم</Label>
                    <Select value={calcForm.valuation_method} onValueChange={v => setCalcForm(p => ({ ...p, valuation_method: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weighted_average">المتوسط المرجح (Weighted Average)</SelectItem>
                        <SelectItem value="fifo">FIFO - ما يدخل أولاً يخرج أولاً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>تكاليف الشحن</Label><Input type="number" value={calcForm.purchase_freight || ''} onChange={e => setCalcForm(p => ({ ...p, purchase_freight: parseFloat(e.target.value) || 0 }))} /></div>
                    <div><Label>العمالة المباشرة</Label><Input type="number" value={calcForm.direct_labor || ''} onChange={e => setCalcForm(p => ({ ...p, direct_labor: parseFloat(e.target.value) || 0 }))} /></div>
                    <div><Label>الفاقد والتالف</Label><Input type="number" value={calcForm.wastage || ''} onChange={e => setCalcForm(p => ({ ...p, wastage: parseFloat(e.target.value) || 0 }))} /></div>
                  </div>

                  {/* Live calculation preview */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-2 text-sm text-right">
                      <h4 className="font-bold mb-2">نتيجة الحساب التلقائي:</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span>المشتريات:</span><span className="font-mono">{fmt(calculatedCogs.purchases)} ر.س</span></div>
                        <div className="flex justify-between"><span>+ الشحن والجمارك:</span><span className="font-mono">{fmt(calcForm.purchase_freight)} ر.س</span></div>
                        <div className="flex justify-between"><span>+ العمالة المباشرة:</span><span className="font-mono">{fmt(calcForm.direct_labor)} ر.س</span></div>
                        <div className="flex justify-between"><span>+ الفاقد:</span><span className="font-mono">{fmt(calcForm.wastage)} ر.س</span></div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-bold text-base"><span>= تكلفة البضاعة المباعة (COGS):</span><span className="font-mono text-destructive">{fmt(calculatedCogs.cogs)} ر.س</span></div>
                        <hr className="my-2" />
                        <div className="flex justify-between"><span>إيرادات الفترة:</span><span className="font-mono text-green-600">{fmt(periodRevenue)} ر.س</span></div>
                        <div className="flex justify-between font-bold">
                          <span>مجمل الربح:</span>
                          <span className={`font-mono ${calculatedCogs.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {fmt(calculatedCogs.grossProfit)} ر.س ({calculatedCogs.grossProfitMargin.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button className="w-full" onClick={() => saveCogsMutation.mutate()} disabled={saveCogsMutation.isPending}>
                    حفظ النتيجة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Low Margin Alert */}
        <AnimatePresence>
          {calculatedCogs.lowMarginItems.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4 text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="font-bold text-destructive">⚠️ تنبيه هامش ربح منخفض (أقل من {marginThreshold}%)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {calculatedCogs.lowMarginItems.slice(0, 5).map((item, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {item.name}: {item.margin.toFixed(1)}%
                      </Badge>
                    ))}
                    {calculatedCogs.lowMarginItems.length > 5 && (
                      <Badge variant="outline">+{calculatedCogs.lowMarginItems.length - 5} أصناف أخرى</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'قيمة المخزون الحالي', value: `${fmt(inventoryItems.reduce((s, i) => s + (i.current_stock || 0) * (i.unit_cost || 0), 0))} ر.س`, icon: Boxes, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600' },
            { label: 'COGS (آخر فترة)', value: cogsRecords[0] ? `${fmt(cogsRecords[0].cogs)} ر.س` : '-', icon: Calculator, bg: 'bg-red-100 dark:bg-red-900/30', color: 'text-red-600' },
            { label: 'مجمل الربح', value: cogsRecords[0] ? `${fmt(cogsRecords[0].gross_profit)} ر.س` : '-', icon: TrendingUp, bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600' },
            { label: 'هامش الربح الإجمالي', value: cogsRecords[0] ? `${Number(cogsRecords[0].gross_profit_margin).toFixed(1)}%` : '-', icon: Target, bg: 'bg-purple-100 dark:bg-purple-900/30', color: 'text-purple-600' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4 text-right">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-lg font-bold">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* COGS Formula Visualization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-right text-base">معادلة COGS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 flex-wrap text-center py-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 min-w-[120px]">
                <p className="text-xs text-muted-foreground">مخزون أول المدة</p>
                <p className="text-lg font-bold">{fmt(calculatedCogs.openingInventory)}</p>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">+</span>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 min-w-[120px]">
                <p className="text-xs text-muted-foreground">المشتريات</p>
                <p className="text-lg font-bold">{fmt(calculatedCogs.purchases)}</p>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">-</span>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 min-w-[120px]">
                <p className="text-xs text-muted-foreground">مخزون آخر المدة</p>
                <p className="text-lg font-bold">{fmt(calculatedCogs.closingInventory)}</p>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">=</span>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 min-w-[120px] border-2 border-destructive/30">
                <p className="text-xs text-muted-foreground">COGS</p>
                <p className="text-lg font-bold text-destructive">{fmt(calculatedCogs.cogs)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="breakdown" dir="rtl">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="breakdown">تحليل التكلفة</TabsTrigger>
            <TabsTrigger value="items">هوامش الأصناف</TabsTrigger>
            <TabsTrigger value="trend">الاتجاه التاريخي</TabsTrigger>
            <TabsTrigger value="history">السجل</TabsTrigger>
          </TabsList>

          {/* COGS Breakdown */}
          <TabsContent value="breakdown" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-right text-base">مكونات تكلفة البضاعة المباعة</CardTitle></CardHeader>
                <CardContent>
                  {calculatedCogs.breakdown.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">لا توجد بيانات حركة مخزون</p>
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={calculatedCogs.breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                            {calculatedCogs.breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${fmt(v)} ر.س`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-right text-base">الربط مع قائمة الدخل</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-mono font-bold text-green-600">{fmt(periodRevenue)} ر.س</span>
                      <span>الإيرادات</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-mono font-bold text-destructive">- {fmt(calculatedCogs.cogs)} ر.س</span>
                      <span>تكلفة البضاعة المباعة</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center text-base font-bold">
                      <span className={`font-mono ${calculatedCogs.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        = {fmt(calculatedCogs.grossProfit)} ر.س
                      </span>
                      <span>مجمل الربح (Gross Profit)</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <Badge variant={calculatedCogs.grossProfitMargin >= 30 ? 'default' : calculatedCogs.grossProfitMargin >= 15 ? 'secondary' : 'destructive'}>
                        {calculatedCogs.grossProfitMargin.toFixed(1)}%
                      </Badge>
                      <span className="text-muted-foreground">هامش الربح الإجمالي</span>
                    </div>
                    <Progress value={Math.min(Math.max(calculatedCogs.grossProfitMargin, 0), 100)} className="h-3" />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-right">
                    <Label className="text-xs">حد التنبيه:</Label>
                    <Input type="number" className="w-20 h-7 text-xs" value={marginThreshold} onChange={e => setMarginThreshold(Number(e.target.value) || 15)} />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Item Margins */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الصنف</TableHead>
                      <TableHead className="text-right">الكود</TableHead>
                      <TableHead className="text-left">التكلفة</TableHead>
                      <TableHead className="text-left">سعر البيع</TableHead>
                      <TableHead className="text-center">الهامش</TableHead>
                      <TableHead className="text-center">المخزون</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculatedCogs.itemMargins.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا توجد أصناف</TableCell></TableRow>
                    ) : calculatedCogs.itemMargins.map((item, i) => (
                      <TableRow key={i} className={item.lowMargin ? 'bg-destructive/5' : ''}>
                        <TableCell className="text-right font-medium">{item.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{item.code}</TableCell>
                        <TableCell className="text-left">{fmt(item.cost)} ر.س</TableCell>
                        <TableCell className="text-left">{fmt(item.price)} ر.س</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.margin >= 30 ? 'default' : item.margin >= marginThreshold ? 'secondary' : 'destructive'}>
                            {item.margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{item.stock}</TableCell>
                        <TableCell className="text-center">
                          {item.lowMargin && <AlertTriangle className="h-4 w-4 text-destructive inline" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historical Trend */}
          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-right text-base">الاتجاه التاريخي لـ COGS</CardTitle></CardHeader>
              <CardContent>
                {trendData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">لا توجد بيانات تاريخية. احسب COGS لعدة فترات لعرض الاتجاه.</p>
                ) : (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => `${fmt(v)} ر.س`} />
                        <Legend />
                        <Bar dataKey="الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                        <Bar dataKey="تكلفة البضاعة" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={18} />
                        <Bar dataKey="مجمل الربح" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-left">المشتريات</TableHead>
                      <TableHead className="text-left">COGS</TableHead>
                      <TableHead className="text-left">الإيرادات</TableHead>
                      <TableHead className="text-left">مجمل الربح</TableHead>
                      <TableHead className="text-center">الهامش</TableHead>
                      <TableHead className="text-center">التقييم</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cogsRecords.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا توجد سجلات. اضغط "حساب COGS جديد"</TableCell></TableRow>
                    ) : cogsRecords.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-right text-xs">
                          {new Date(r.period_start).toLocaleDateString('ar-SA')} - {new Date(r.period_end).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell className="text-left">{fmt(r.purchases)}</TableCell>
                        <TableCell className="text-left text-destructive font-medium">{fmt(r.cogs)}</TableCell>
                        <TableCell className="text-left text-green-600">{fmt(r.revenue)}</TableCell>
                        <TableCell className={`text-left font-medium ${r.gross_profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{fmt(r.gross_profit)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={Number(r.gross_profit_margin) >= 30 ? 'default' : Number(r.gross_profit_margin) >= 15 ? 'secondary' : 'destructive'}>
                            {Number(r.gross_profit_margin).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {r.valuation_method === 'fifo' ? 'FIFO' : 'متوسط مرجح'}
                          </Badge>
                        </TableCell>
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

export default ERPCogs;
