import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart,
  ArrowRightLeft, Plus, BarChart3, Target, Truck, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBroker, BrokerTransaction } from '@/hooks/useBroker';

interface BrokerDashboardProps {
  isRTL: boolean;
}

const WASTE_TYPES = [
  { value: 'plastics', label: 'بلاستيك', labelEn: 'Plastics' },
  { value: 'metals', label: 'معادن', labelEn: 'Metals' },
  { value: 'paper', label: 'ورق وكرتون', labelEn: 'Paper' },
  { value: 'glass', label: 'زجاج', labelEn: 'Glass' },
  { value: 'wood', label: 'خشب', labelEn: 'Wood' },
  { value: 'organic', label: 'عضوي', labelEn: 'Organic' },
  { value: 'rdf', label: 'وقود بديل RDF', labelEn: 'RDF' },
  { value: 'textiles', label: 'منسوجات', labelEn: 'Textiles' },
  { value: 'electronics', label: 'إلكترونيات', labelEn: 'E-Waste' },
  { value: 'rubber', label: 'مطاط', labelEn: 'Rubber' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكدة',
  in_transit: 'قيد النقل',
  delivered: 'تم التسليم',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

export function BrokerDashboard({ isRTL }: BrokerDashboardProps) {
  const { transactions, deals, stats, loading, createTransaction, createDeal } = useBroker();
  const [activeTab, setActiveTab] = useState('overview');
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [txType, setTxType] = useState<'purchase' | 'sale'>('purchase');

  // New transaction form
  const [txForm, setTxForm] = useState({
    waste_type: '', quantity_tons: '', price_per_ton: '',
    counterparty_name: '', quality_grade: '', notes: '',
    location_governorate: '',
  });

  // New deal form
  const [dealForm, setDealForm] = useState({
    deal_name: '', waste_type: '',
    purchase_price_per_ton: '', purchase_quantity_tons: '',
    sale_price_per_ton: '', sale_quantity_tons: '',
    transport_cost: '', other_costs: '', notes: '',
  });

  const handleCreateTransaction = async () => {
    if (!txForm.waste_type || !txForm.quantity_tons || !txForm.price_per_ton) {
      return;
    }
    await createTransaction({
      transaction_type: txType,
      waste_type: txForm.waste_type,
      quantity_tons: parseFloat(txForm.quantity_tons),
      price_per_ton: parseFloat(txForm.price_per_ton),
      counterparty_name: txForm.counterparty_name || undefined,
      quality_grade: txForm.quality_grade || undefined,
      location_governorate: txForm.location_governorate || undefined,
      notes: txForm.notes || undefined,
    });
    setTxForm({ waste_type: '', quantity_tons: '', price_per_ton: '', counterparty_name: '', quality_grade: '', notes: '', location_governorate: '' });
    setTxDialogOpen(false);
  };

  const handleCreateDeal = async () => {
    if (!dealForm.waste_type || !dealForm.purchase_price_per_ton || !dealForm.sale_price_per_ton) return;
    await createDeal({
      deal_name: dealForm.deal_name || undefined,
      waste_type: dealForm.waste_type,
      purchase_price_per_ton: parseFloat(dealForm.purchase_price_per_ton),
      purchase_quantity_tons: parseFloat(dealForm.purchase_quantity_tons || '0'),
      sale_price_per_ton: parseFloat(dealForm.sale_price_per_ton),
      sale_quantity_tons: parseFloat(dealForm.sale_quantity_tons || '0'),
      transport_cost: parseFloat(dealForm.transport_cost || '0'),
      other_costs: parseFloat(dealForm.other_costs || '0'),
      notes: dealForm.notes || undefined,
    });
    setDealForm({ deal_name: '', waste_type: '', purchase_price_per_ton: '', purchase_quantity_tons: '', sale_price_per_ton: '', sale_quantity_tons: '', transport_cost: '', other_costs: '', notes: '' });
    setDealDialogOpen(false);
  };

  const purchases = transactions.filter(t => t.transaction_type === 'purchase');
  const sales = transactions.filter(t => t.transaction_type === 'sale');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isRTL ? 'إجمالي المشتريات' : 'Total Purchases', value: `${stats.totalPurchases.toLocaleString()} ج.م`, icon: ShoppingCart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
          { label: isRTL ? 'إجمالي المبيعات' : 'Total Sales', value: `${stats.totalSales.toLocaleString()} ج.م`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: isRTL ? 'صافي الربح' : 'Net Profit', value: `${stats.totalProfit.toLocaleString()} ج.م`, icon: stats.totalProfit >= 0 ? TrendingUp : TrendingDown, color: stats.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500', bg: stats.totalProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20' },
          { label: isRTL ? 'هامش الربح' : 'Profit Margin', value: `${stats.avgMargin}%`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={s.bg}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <div className="text-xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Volume & Deals Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{stats.totalVolume.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{isRTL ? 'طن تم تداولها' : 'Tons Traded'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowRightLeft className="w-6 h-6 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold">{stats.dealCount}</div>
            <div className="text-xs text-muted-foreground">{isRTL ? 'صفقات' : 'Deals'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-6 h-6 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{stats.pendingDeals}</div>
            <div className="text-xs text-muted-foreground">{isRTL ? 'صفقات مفتوحة' : 'Open Deals'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setTxType('purchase'); setTxDialogOpen(true); }} variant="outline" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              {isRTL ? 'شراء مخلفات' : 'Buy Waste'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>
                {txType === 'purchase'
                  ? (isRTL ? '🛒 شراء مخلفات من مولّد' : '🛒 Buy Waste from Generator')
                  : (isRTL ? '💰 بيع مخلفات لمدوّر' : '💰 Sell Waste to Recycler')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{isRTL ? 'نوع المخلف' : 'Waste Type'}</Label>
                <Select value={txForm.waste_type} onValueChange={v => setTxForm(p => ({ ...p, waste_type: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر النوع' : 'Select type'} /></SelectTrigger>
                  <SelectContent>
                    {WASTE_TYPES.map(w => (
                      <SelectItem key={w.value} value={w.value}>{isRTL ? w.label : w.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{isRTL ? 'الكمية (طن)' : 'Quantity (tons)'}</Label>
                  <Input type="number" value={txForm.quantity_tons} onChange={e => setTxForm(p => ({ ...p, quantity_tons: e.target.value }))} />
                </div>
                <div>
                  <Label>{isRTL ? 'السعر/طن (ج.م)' : 'Price/ton (EGP)'}</Label>
                  <Input type="number" value={txForm.price_per_ton} onChange={e => setTxForm(p => ({ ...p, price_per_ton: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>{isRTL ? 'اسم الطرف الآخر' : 'Counterparty Name'}</Label>
                <Input value={txForm.counterparty_name} onChange={e => setTxForm(p => ({ ...p, counterparty_name: e.target.value }))} />
              </div>
              <div>
                <Label>{isRTL ? 'درجة الجودة' : 'Quality Grade'}</Label>
                <Select value={txForm.quality_grade} onValueChange={v => setTxForm(p => ({ ...p, quality_grade: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'mixed'].map(g => (
                      <SelectItem key={g} value={g}>{g === 'mixed' ? (isRTL ? 'مختلط' : 'Mixed') : g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                <Textarea value={txForm.notes} onChange={e => setTxForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
              {txForm.quantity_tons && txForm.price_per_ton && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-sm text-muted-foreground">{isRTL ? 'الإجمالي' : 'Total'}</div>
                    <div className="text-2xl font-bold text-primary">
                      {(parseFloat(txForm.quantity_tons) * parseFloat(txForm.price_per_ton)).toLocaleString()} ج.م
                    </div>
                  </CardContent>
                </Card>
              )}
              <Button className="w-full" onClick={handleCreateTransaction}>
                {txType === 'purchase' ? (isRTL ? 'تسجيل الشراء' : 'Record Purchase') : (isRTL ? 'تسجيل البيع' : 'Record Sale')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={() => { setTxType('sale'); setTxDialogOpen(true); }} variant="outline" className="gap-2">
          <DollarSign className="w-4 h-4" />
          {isRTL ? 'بيع مخلفات' : 'Sell Waste'}
        </Button>

        <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'إنشاء صفقة' : 'Create Deal'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{isRTL ? '🤝 صفقة جديدة (شراء → بيع)' : '🤝 New Deal (Buy → Sell)'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{isRTL ? 'اسم الصفقة' : 'Deal Name'}</Label>
                  <Input value={dealForm.deal_name} onChange={e => setDealForm(p => ({ ...p, deal_name: e.target.value }))} placeholder={isRTL ? 'مثال: بلاستيك فبراير' : 'e.g. Feb Plastics'} />
                </div>
                <div>
                  <Label>{isRTL ? 'نوع المخلف' : 'Waste Type'}</Label>
                  <Select value={dealForm.waste_type} onValueChange={v => setDealForm(p => ({ ...p, waste_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WASTE_TYPES.map(w => (
                        <SelectItem key={w.value} value={w.value}>{isRTL ? w.label : w.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="border-red-200 dark:border-red-900/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm text-red-600 flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" />
                    {isRTL ? 'جانب الشراء (من المولّد)' : 'Purchase Side (from Generator)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{isRTL ? 'الكمية (طن)' : 'Qty (tons)'}</Label>
                    <Input type="number" value={dealForm.purchase_quantity_tons} onChange={e => setDealForm(p => ({ ...p, purchase_quantity_tons: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{isRTL ? 'سعر الشراء/طن' : 'Buy Price/ton'}</Label>
                    <Input type="number" value={dealForm.purchase_price_per_ton} onChange={e => setDealForm(p => ({ ...p, purchase_price_per_ton: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-900/50">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {isRTL ? 'جانب البيع (للمدوّر)' : 'Sale Side (to Recycler)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{isRTL ? 'الكمية (طن)' : 'Qty (tons)'}</Label>
                    <Input type="number" value={dealForm.sale_quantity_tons} onChange={e => setDealForm(p => ({ ...p, sale_quantity_tons: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{isRTL ? 'سعر البيع/طن' : 'Sell Price/ton'}</Label>
                    <Input type="number" value={dealForm.sale_price_per_ton} onChange={e => setDealForm(p => ({ ...p, sale_price_per_ton: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{isRTL ? 'تكلفة النقل' : 'Transport Cost'}</Label>
                  <Input type="number" value={dealForm.transport_cost} onChange={e => setDealForm(p => ({ ...p, transport_cost: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{isRTL ? 'تكاليف أخرى' : 'Other Costs'}</Label>
                  <Input type="number" value={dealForm.other_costs} onChange={e => setDealForm(p => ({ ...p, other_costs: e.target.value }))} />
                </div>
              </div>

              {/* Profit Preview */}
              {dealForm.purchase_price_per_ton && dealForm.sale_price_per_ton && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex justify-between text-sm">
                      <span>{isRTL ? 'إجمالي الشراء:' : 'Purchase Total:'}</span>
                      <span className="text-red-500 font-medium">
                        {((parseFloat(dealForm.purchase_quantity_tons || '0') * parseFloat(dealForm.purchase_price_per_ton))).toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{isRTL ? 'إجمالي البيع:' : 'Sale Total:'}</span>
                      <span className="text-green-500 font-medium">
                        {((parseFloat(dealForm.sale_quantity_tons || '0') * parseFloat(dealForm.sale_price_per_ton))).toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{isRTL ? 'التكاليف:' : 'Costs:'}</span>
                      <span className="text-muted-foreground">
                        {((parseFloat(dealForm.transport_cost || '0') + parseFloat(dealForm.other_costs || '0'))).toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                      <span>{isRTL ? '💰 صافي الربح:' : '💰 Net Profit:'}</span>
                      <span className={(() => {
                        const profit = (parseFloat(dealForm.sale_quantity_tons || '0') * parseFloat(dealForm.sale_price_per_ton))
                          - (parseFloat(dealForm.purchase_quantity_tons || '0') * parseFloat(dealForm.purchase_price_per_ton))
                          - parseFloat(dealForm.transport_cost || '0')
                          - parseFloat(dealForm.other_costs || '0');
                        return profit >= 0 ? 'text-green-600' : 'text-red-600';
                      })()}>
                        {(() => {
                          const profit = (parseFloat(dealForm.sale_quantity_tons || '0') * parseFloat(dealForm.sale_price_per_ton))
                            - (parseFloat(dealForm.purchase_quantity_tons || '0') * parseFloat(dealForm.purchase_price_per_ton))
                            - parseFloat(dealForm.transport_cost || '0')
                            - parseFloat(dealForm.other_costs || '0');
                          return profit.toLocaleString();
                        })()} ج.م
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button className="w-full" onClick={handleCreateDeal}>
                {isRTL ? 'إنشاء الصفقة' : 'Create Deal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions & Deals Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="transactions">{isRTL ? 'العمليات' : 'Transactions'}</TabsTrigger>
          <TabsTrigger value="deals">{isRTL ? 'الصفقات' : 'Deals'}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Purchases */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-red-500" />
                  {isRTL ? 'آخر المشتريات' : 'Recent Purchases'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {purchases.slice(0, 5).map(tx => (
                  <TransactionRow key={tx.id} tx={tx} isRTL={isRTL} />
                ))}
                {purchases.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRTL ? 'لا توجد عمليات شراء بعد' : 'No purchases yet'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  {isRTL ? 'آخر المبيعات' : 'Recent Sales'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sales.slice(0, 5).map(tx => (
                  <TransactionRow key={tx.id} tx={tx} isRTL={isRTL} />
                ))}
                {sales.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRTL ? 'لا توجد مبيعات بعد' : 'No sales yet'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Transactions */}
        <TabsContent value="transactions" className="space-y-2">
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{isRTL ? 'لا توجد عمليات بعد. ابدأ بشراء أو بيع مخلفات!' : 'No transactions yet. Start buying or selling waste!'}</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map(tx => (
              <TransactionRow key={tx.id} tx={tx} isRTL={isRTL} expanded />
            ))
          )}
        </TabsContent>

        {/* Deals */}
        <TabsContent value="deals" className="space-y-2">
          {deals.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{isRTL ? 'لا توجد صفقات بعد. أنشئ صفقة لتتبع ربحك!' : 'No deals yet. Create a deal to track your profit!'}</p>
              </CardContent>
            </Card>
          ) : (
            deals.map(deal => (
              <Card key={deal.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{deal.deal_name || deal.waste_type}</span>
                    <Badge className={STATUS_COLORS[deal.status] || ''}>{STATUS_LABELS[deal.status] || deal.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{isRTL ? 'شراء:' : 'Buy:'}</span>
                      <span className="text-red-500 font-medium ms-1">{(deal.purchase_total || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{isRTL ? 'بيع:' : 'Sell:'}</span>
                      <span className="text-green-500 font-medium ms-1">{(deal.sale_total || 0).toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{isRTL ? 'ربح:' : 'Profit:'}</span>
                      <span className="font-bold ms-1">
                        {((deal.sale_total || 0) - (deal.purchase_total || 0) - (deal.transport_cost || 0) - (deal.other_costs || 0)).toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransactionRow({ tx, isRTL, expanded }: { tx: BrokerTransaction; isRTL: boolean; expanded?: boolean }) {
  const wasteLabel = WASTE_TYPES.find(w => w.value === tx.waste_type);
  const total = tx.total_amount || (tx.quantity_tons * tx.price_per_ton);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {tx.transaction_type === 'purchase' ? (
            <ShoppingCart className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {isRTL ? (wasteLabel?.label || tx.waste_type) : (wasteLabel?.labelEn || tx.waste_type)}
              {tx.counterparty_name && <span className="text-muted-foreground ms-1">- {tx.counterparty_name}</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {tx.quantity_tons} {isRTL ? 'طن' : 'tons'} × {tx.price_per_ton.toLocaleString()} ج.م
            </div>
          </div>
        </div>
        <div className="text-end shrink-0">
          <div className={`text-sm font-bold ${tx.transaction_type === 'purchase' ? 'text-red-500' : 'text-green-500'}`}>
            {tx.transaction_type === 'purchase' ? '-' : '+'}{total.toLocaleString()} ج.م
          </div>
          <Badge className={`text-[10px] ${STATUS_COLORS[tx.status] || ''}`}>
            {STATUS_LABELS[tx.status] || tx.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
