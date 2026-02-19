import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowUpCircle, ArrowDownCircle, CreditCard,
  TrendingUp, Receipt, RefreshCw, Percent, Clock,
  Send, Download, Filter, Calendar, BarChart3, 
  Building2, ArrowLeftRight, Settings, Shield, Eye, EyeOff,
  FileText, Banknote, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/numberFormat';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TX_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  deposit: { label: 'إيداع', icon: ArrowDownCircle, color: 'text-emerald-500' },
  withdrawal: { label: 'سحب', icon: ArrowUpCircle, color: 'text-red-500' },
  payment: { label: 'دفع', icon: CreditCard, color: 'text-blue-500' },
  refund: { label: 'استرداد', icon: RefreshCw, color: 'text-purple-500' },
  earning: { label: 'أرباح', icon: TrendingUp, color: 'text-emerald-500' },
  transfer_out: { label: 'تحويل صادر', icon: Send, color: 'text-orange-500' },
  transfer_in: { label: 'تحويل وارد', icon: ArrowDownCircle, color: 'text-indigo-500' },
  auto_payment: { label: 'دفع تلقائي', icon: Settings, color: 'text-blue-500' },
  escrow_hold: { label: 'حجز ضمان', icon: Shield, color: 'text-amber-500' },
  escrow_release: { label: 'تحرير ضمان', icon: CheckCircle2, color: 'text-emerald-500' },
  early_payment_discount: { label: 'خصم دفع مبكر', icon: Percent, color: 'text-amber-500' },
};

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'تحويل بنكي', icon: Building2 },
  { value: 'instapay', label: 'انستا باي', icon: Banknote },
  { value: 'mobile_money', label: 'محفظة موبايل', icon: CreditCard },
  { value: 'cash', label: 'نقدي', icon: Banknote },
  { value: 'check', label: 'شيك', icon: FileText },
];

const DigitalWalletPanel: React.FC = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [depositForm, setDepositForm] = useState({ amount: '', payment_method: 'bank_transfer', description: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', payment_method: 'bank_transfer', description: '', bank_account: '' });
  const [transferForm, setTransferForm] = useState({ amount: '', target_org_id: '', description: '' });

  const { data: wallet } = useQuery({
    queryKey: ['digital-wallet', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('digital_wallets')
        .select('*')
        .eq('organization_id', organization!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!organization,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['wallet-transactions', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!organization,
  });

  // Fetch partner organizations for transfers
  const { data: partners = [] } = useQuery({
    queryKey: ['wallet-partners', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('id', organization!.id)
        .limit(100);
      return data || [];
    },
    enabled: !!organization,
  });

  // Financial summary
  const summary = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((t: any) => {
      const d = new Date(t.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = transactions.filter((t: any) => {
      const d = new Date(t.created_at);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const calcTotals = (txs: any[]) => ({
      income: txs.filter((t: any) => ['deposit', 'earning', 'transfer_in', 'refund', 'escrow_release', 'early_payment_discount'].includes(t.transaction_type)).reduce((s: number, t: any) => s + Math.abs(t.amount), 0),
      expenses: txs.filter((t: any) => ['withdrawal', 'payment', 'transfer_out', 'auto_payment', 'escrow_hold'].includes(t.transaction_type)).reduce((s: number, t: any) => s + Math.abs(t.amount), 0),
      count: txs.length,
    });

    return { thisMonth: calcTotals(thisMonth), lastMonth: calcTotals(lastMonth), total: calcTotals(transactions) };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      if (filterType !== 'all' && t.transaction_type !== filterType) return false;
      if (filterMonth !== 'all') {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== filterMonth) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterMonth]);

  // Available months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t: any) => {
      const d = new Date(t.created_at);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const initWalletMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('digital_wallets').insert({
        organization_id: organization!.id,
        balance: 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallet'] });
      toast.success('تم تفعيل المحفظة');
    },
  });

  const createTransaction = async (type: string, amount: number, extra: Record<string, any> = {}) => {
    if (!wallet) throw new Error('No wallet');
    const isPositive = ['deposit', 'earning', 'transfer_in', 'refund', 'escrow_release', 'early_payment_discount'].includes(type);
    const newBalance = (wallet.balance || 0) + (isPositive ? amount : -amount);

    if (!isPositive && newBalance < 0) {
      throw new Error('رصيد غير كافٍ');
    }

    const { error: txError } = await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      organization_id: organization!.id,
      transaction_type: type,
      amount: isPositive ? amount : -amount,
      balance_before: wallet.balance || 0,
      balance_after: newBalance,
      created_by: user?.id,
      ...extra,
    } as any);
    if (txError) throw txError;

    const updates: Record<string, any> = {
      balance: newBalance,
      last_transaction_at: new Date().toISOString(),
    };
    if (type === 'deposit') updates.total_deposited = (wallet.total_deposited || 0) + amount;
    if (type === 'withdrawal') updates.total_withdrawn = (wallet.total_withdrawn || 0) + amount;
    if (isPositive && type !== 'deposit') updates.total_earned = (wallet.total_earned || 0) + amount;
    if (!isPositive && type !== 'withdrawal') updates.total_spent = (wallet.total_spent || 0) + amount;

    const { error: wError } = await supabase.from('digital_wallets').update(updates as any).eq('id', wallet.id);
    if (wError) throw wError;
  };

  const depositMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(depositForm.amount);
      if (amount <= 0) throw new Error('مبلغ غير صحيح');
      await createTransaction('deposit', amount, {
        payment_method: depositForm.payment_method,
        description: depositForm.description || `إيداع ${amount.toLocaleString()} ج.م`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setShowDeposit(false);
      toast.success('تم الإيداع بنجاح');
      setDepositForm({ amount: '', payment_method: 'bank_transfer', description: '' });
    },
    onError: (e: any) => toast.error(e.message || 'فشل في الإيداع'),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(withdrawForm.amount);
      if (amount <= 0) throw new Error('مبلغ غير صحيح');
      await createTransaction('withdrawal', amount, {
        payment_method: withdrawForm.payment_method,
        description: withdrawForm.description || `سحب ${amount.toLocaleString()} ج.م إلى ${withdrawForm.bank_account || 'حساب بنكي'}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setShowWithdraw(false);
      toast.success('تم تقديم طلب السحب');
      setWithdrawForm({ amount: '', payment_method: 'bank_transfer', description: '', bank_account: '' });
    },
    onError: (e: any) => toast.error(e.message || 'فشل في السحب'),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(transferForm.amount);
      if (amount <= 0) throw new Error('مبلغ غير صحيح');
      const targetOrg = partners.find((p: any) => p.id === transferForm.target_org_id);
      if (!targetOrg) throw new Error('اختر الجهة المستقبلة');

      // Deduct from sender
      await createTransaction('transfer_out', amount, {
        counterparty_org_id: targetOrg.id,
        counterparty_name: targetOrg.name,
        description: transferForm.description || `تحويل إلى ${targetOrg.name}`,
      });

      // Credit to receiver wallet
      const { data: targetWallet } = await supabase
        .from('digital_wallets')
        .select('*')
        .eq('organization_id', targetOrg.id)
        .maybeSingle();

      if (targetWallet) {
        const newTargetBalance = (targetWallet.balance || 0) + amount;
        await supabase.from('wallet_transactions').insert({
          wallet_id: targetWallet.id,
          organization_id: targetOrg.id,
          transaction_type: 'transfer_in',
          amount,
          balance_before: targetWallet.balance || 0,
          balance_after: newTargetBalance,
          counterparty_org_id: organization!.id,
          counterparty_name: organization!.name,
          description: `تحويل وارد من ${organization!.name}`,
          created_by: user?.id,
        } as any);
        await supabase.from('digital_wallets').update({
          balance: newTargetBalance,
          total_earned: (targetWallet.total_earned || 0) + amount,
          last_transaction_at: new Date().toISOString(),
        } as any).eq('id', targetWallet.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setShowTransfer(false);
      toast.success('تم التحويل بنجاح');
      setTransferForm({ amount: '', target_org_id: '', description: '' });
    },
    onError: (e: any) => toast.error(e.message || 'فشل في التحويل'),
  });

  const toggleAutoPayMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase.from('digital_wallets').update({
        auto_pay_enabled: enabled,
      } as any).eq('id', wallet!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallet'] });
      toast.success('تم تحديث إعدادات الدفع التلقائي');
    },
  });

  if (!wallet) {
    return (
      <Card className="border-dashed border-2 border-primary/20">
        <CardContent className="p-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Wallet className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-bold text-xl mb-2">المحفظة الإلكترونية</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              فعّل محفظتك الرقمية لإدارة المدفوعات والتحويلات والأرباح بين الجهات الشريكة
            </p>
            <Button size="lg" onClick={() => initWalletMutation.mutate()} disabled={initWalletMutation.isPending} className="gap-2">
              <Wallet className="w-5 h-5" />
              {initWalletMutation.isPending ? 'جاري التفعيل...' : 'تفعيل المحفظة'}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const monthChange = summary.lastMonth.income > 0
    ? Math.round(((summary.thisMonth.income - summary.lastMonth.income) / summary.lastMonth.income) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* ===== Wallet Hero Card ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-primary/15 via-primary/5 to-background border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 translate-y-8" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-bold text-base">المحفظة الإلكترونية</span>
                  <p className="text-[10px] text-muted-foreground">{organization?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBalance(!showBalance)}>
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Badge variant={wallet.is_active ? 'default' : 'secondary'} className="text-xs">
                  {wallet.is_active ? 'نشطة' : 'معطلة'}
                </Badge>
              </div>
            </div>

            {/* Balance */}
            <div className="text-center mb-5">
              <p className="text-xs text-muted-foreground mb-1">الرصيد الحالي</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={showBalance ? 'show' : 'hide'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-4xl font-bold text-primary"
                >
                  {showBalance ? formatCurrency(wallet.balance || 0) : '••••••'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="text-center p-2 rounded-lg bg-background/60">
                <p className="text-[10px] text-muted-foreground">إيداعات</p>
                <p className="font-bold text-sm text-emerald-500">{showBalance ? formatCurrency(wallet.total_deposited || 0, false) : '•••'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/60">
                <p className="text-[10px] text-muted-foreground">مسحوبات</p>
                <p className="font-bold text-sm text-red-500">{showBalance ? formatCurrency(wallet.total_withdrawn || 0, false) : '•••'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/60">
                <p className="text-[10px] text-muted-foreground">أرباح</p>
                <p className="font-bold text-sm text-primary">{showBalance ? formatCurrency(wallet.total_earned || 0, false) : '•••'}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/60">
                <p className="text-[10px] text-muted-foreground">مصروفات</p>
                <p className="font-bold text-sm text-orange-500">{showBalance ? formatCurrency(wallet.total_spent || 0, false) : '•••'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
                <DialogTrigger asChild>
                  <Button className="flex-col h-auto py-3 gap-1.5 text-xs">
                    <ArrowDownCircle className="w-5 h-5" />
                    إيداع
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownCircle className="w-5 h-5 text-emerald-500" />إيداع في المحفظة</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-3">
                    <div>
                      <Label>المبلغ (ج.م) *</Label>
                      <Input type="number" min="1" value={depositForm.amount} onChange={e => setDepositForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="text-lg font-bold" />
                    </div>
                    <div>
                      <Label>طريقة الدفع</Label>
                      <Select value={depositForm.payment_method} onValueChange={v => setDepositForm(p => ({ ...p, payment_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>ملاحظات</Label><Textarea value={depositForm.description} onChange={e => setDepositForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="وصف اختياري للمعاملة" /></div>
                    <Button onClick={() => depositMutation.mutate()} disabled={!depositForm.amount || Number(depositForm.amount) <= 0 || depositMutation.isPending} className="w-full gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {depositMutation.isPending ? 'جاري الإيداع...' : `إيداع ${Number(depositForm.amount || 0).toLocaleString()} ج.م`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-col h-auto py-3 gap-1.5 text-xs">
                    <ArrowUpCircle className="w-5 h-5" />
                    سحب
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpCircle className="w-5 h-5 text-red-500" />سحب من المحفظة</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">الرصيد المتاح</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.balance || 0)}</p>
                    </div>
                    <div>
                      <Label>المبلغ (ج.م) *</Label>
                      <Input type="number" min="1" max={wallet.balance || 0} value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="text-lg font-bold" />
                      {Number(withdrawForm.amount) > (wallet.balance || 0) && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />المبلغ أكبر من الرصيد المتاح</p>
                      )}
                    </div>
                    <div>
                      <Label>طريقة السحب</Label>
                      <Select value={withdrawForm.payment_method} onValueChange={v => setWithdrawForm(p => ({ ...p, payment_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>رقم الحساب البنكي / المحفظة</Label><Input value={withdrawForm.bank_account} onChange={e => setWithdrawForm(p => ({ ...p, bank_account: e.target.value }))} placeholder="رقم الحساب أو المحفظة" /></div>
                    <div><Label>ملاحظات</Label><Textarea value={withdrawForm.description} onChange={e => setWithdrawForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                    <Button variant="destructive" onClick={() => withdrawMutation.mutate()} disabled={!withdrawForm.amount || Number(withdrawForm.amount) <= 0 || Number(withdrawForm.amount) > (wallet.balance || 0) || withdrawMutation.isPending} className="w-full gap-2">
                      <ArrowUpCircle className="w-4 h-4" />
                      {withdrawMutation.isPending ? 'جاري السحب...' : `سحب ${Number(withdrawForm.amount || 0).toLocaleString()} ج.م`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-col h-auto py-3 gap-1.5 text-xs">
                    <Send className="w-5 h-5" />
                    تحويل
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-indigo-500" />تحويل إلى جهة شريكة</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">الرصيد المتاح</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(wallet.balance || 0)}</p>
                    </div>
                    <div>
                      <Label>الجهة المستقبلة *</Label>
                      <Select value={transferForm.target_org_id} onValueChange={v => setTransferForm(p => ({ ...p, target_org_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الجهة الشريكة" /></SelectTrigger>
                        <SelectContent>
                          {partners.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>المبلغ (ج.م) *</Label>
                      <Input type="number" min="1" max={wallet.balance || 0} value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="text-lg font-bold" />
                    </div>
                    <div><Label>ملاحظات</Label><Textarea value={transferForm.description} onChange={e => setTransferForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="سبب التحويل" /></div>
                    <Button onClick={() => transferMutation.mutate()} disabled={!transferForm.amount || !transferForm.target_org_id || Number(transferForm.amount) <= 0 || Number(transferForm.amount) > (wallet.balance || 0) || transferMutation.isPending} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                      <Send className="w-4 h-4" />
                      {transferMutation.isPending ? 'جاري التحويل...' : `تحويل ${Number(transferForm.amount || 0).toLocaleString()} ج.م`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="flex-col h-auto py-3 gap-1.5 text-xs">
                    <Settings className="w-5 h-5" />
                    إعدادات
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />إعدادات المحفظة</DialogTitle></DialogHeader>
                  <div className="space-y-5 mt-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">الدفع التلقائي للشحنات</p>
                        <p className="text-xs text-muted-foreground mt-0.5">خصم تلقائي من المحفظة عند تأكيد التسليم</p>
                      </div>
                      <Switch
                        checked={wallet.auto_pay_enabled || false}
                        onCheckedChange={(v) => toggleAutoPayMutation.mutate(v)}
                      />
                    </div>
                    {wallet.auto_pay_enabled && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">الدفع التلقائي مفعّل</p>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          سيتم خصم قيمة الشحنة تلقائياً من المحفظة فور تأكيد التسليم النهائي. تأكد من توفر رصيد كافٍ.
                        </p>
                      </div>
                    )}
                    <Separator />
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">معرّف المحفظة</p>
                      <p className="text-xs font-mono">{wallet.id}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Tabs: Transactions & Reports ===== */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="transactions" className="gap-1.5 text-xs">
            <Receipt className="w-4 h-4" />سجل المعاملات
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 text-xs">
            <BarChart3 className="w-4 h-4" />تقارير مالية
          </TabsTrigger>
          <TabsTrigger value="statement" className="gap-1.5 text-xs">
            <FileText className="w-4 h-4" />كشف حساب
          </TabsTrigger>
        </TabsList>

        {/* --- Transactions Tab --- */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  المعاملات ({filteredTransactions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32 h-8 text-xs"><Filter className="w-3 h-3 ml-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {Object.entries(TX_TYPE_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-32 h-8 text-xs"><Calendar className="w-3 h-3 ml-1" /><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الشهور</SelectItem>
                      {availableMonths.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">لا توجد معاملات</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {filteredTransactions.map((tx: any) => {
                    const cfg = TX_TYPE_CONFIG[tx.transaction_type] || TX_TYPE_CONFIG.payment;
                    const Icon = cfg.icon;
                    const isPositive = tx.amount >= 0;
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium">{cfg.label}</p>
                              {tx.counterparty_name && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{tx.counterparty_name}</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                              {tx.description || ''} • {format(new Date(tx.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <p className={`font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{Math.abs(tx.amount).toLocaleString()} ج.م
                          </p>
                          <p className="text-[10px] text-muted-foreground">الرصيد: {tx.balance_after?.toLocaleString()} ج.م</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Reports Tab --- */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ملخص الشهر الحالي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm">الإيرادات</span>
                  </div>
                  <span className="font-bold text-emerald-600">{formatCurrency(summary.thisMonth.income)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">المصروفات</span>
                  </div>
                  <span className="font-bold text-red-600">{formatCurrency(summary.thisMonth.expenses)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                  <span className="text-sm font-medium">صافي الحركة</span>
                  <span className={`font-bold ${summary.thisMonth.income - summary.thisMonth.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.thisMonth.income - summary.thisMonth.expenses)}
                  </span>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <span>{summary.thisMonth.count} معاملة هذا الشهر</span>
                  {monthChange !== 0 && (
                    <span className={`mr-2 ${monthChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      ({monthChange > 0 ? '+' : ''}{monthChange}% عن الشهر السابق)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">إحصائيات عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{summary.total.count}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المعاملات</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-emerald-500">{formatCurrency(summary.total.income, false)}</p>
                    <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.total.expenses, false)}</p>
                    <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={`text-2xl font-bold ${(summary.total.income - summary.total.expenses) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(summary.total.income - summary.total.expenses, false)}
                    </p>
                    <p className="text-xs text-muted-foreground">صافي الحركة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Statement Tab --- */}
        <TabsContent value="statement">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />كشف حساب المحفظة
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                  // Simple CSV export
                  const headers = 'التاريخ,النوع,الوصف,المبلغ,الرصيد بعد\n';
                  const rows = filteredTransactions.map((tx: any) =>
                    `${format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')},${TX_TYPE_CONFIG[tx.transaction_type]?.label || tx.transaction_type},"${tx.description || ''}",${tx.amount},${tx.balance_after}`
                  ).join('\n');
                  const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `كشف-حساب-محفظة-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                  link.click();
                  toast.success('تم تحميل كشف الحساب');
                }}>
                  <Download className="w-3.5 h-3.5" />تصدير CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-right py-2 px-2 font-medium text-xs">التاريخ</th>
                      <th className="text-right py-2 px-2 font-medium text-xs">النوع</th>
                      <th className="text-right py-2 px-2 font-medium text-xs">الوصف</th>
                      <th className="text-right py-2 px-2 font-medium text-xs">مدين</th>
                      <th className="text-right py-2 px-2 font-medium text-xs">دائن</th>
                      <th className="text-right py-2 px-2 font-medium text-xs">الرصيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 100).map((tx: any) => {
                      const cfg = TX_TYPE_CONFIG[tx.transaction_type] || TX_TYPE_CONFIG.payment;
                      const isPositive = tx.amount >= 0;
                      return (
                        <tr key={tx.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-2 px-2 text-xs whitespace-nowrap">{format(new Date(tx.created_at), 'dd/MM/yyyy')}</td>
                          <td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{cfg.label}</Badge></td>
                          <td className="py-2 px-2 text-xs truncate max-w-[200px]">{tx.description || '-'}</td>
                          <td className="py-2 px-2 text-xs font-medium text-red-500">{!isPositive ? Math.abs(tx.amount).toLocaleString() : '-'}</td>
                          <td className="py-2 px-2 text-xs font-medium text-emerald-500">{isPositive ? Math.abs(tx.amount).toLocaleString() : '-'}</td>
                          <td className="py-2 px-2 text-xs font-bold">{tx.balance_after?.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات لعرضها</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DigitalWalletPanel;
