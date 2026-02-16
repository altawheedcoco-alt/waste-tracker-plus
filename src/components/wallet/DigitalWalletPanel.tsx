import React, { useState } from 'react';
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
import { motion } from 'framer-motion';
import {
  Wallet, ArrowUpCircle, ArrowDownCircle, Plus, CreditCard,
  TrendingUp, Receipt, RefreshCw, DollarSign, Percent, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const TX_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  deposit: { label: 'إيداع', icon: ArrowDownCircle, color: 'text-emerald-500' },
  withdrawal: { label: 'سحب', icon: ArrowUpCircle, color: 'text-red-500' },
  payment: { label: 'دفع', icon: CreditCard, color: 'text-blue-500' },
  refund: { label: 'استرداد', icon: RefreshCw, color: 'text-purple-500' },
  earning: { label: 'أرباح', icon: TrendingUp, color: 'text-emerald-500' },
  transfer: { label: 'تحويل', icon: ArrowUpCircle, color: 'text-indigo-500' },
  early_payment_discount: { label: 'خصم دفع مبكر', icon: Percent, color: 'text-amber-500' },
};

const DigitalWalletPanel: React.FC = () => {
  const { organization, user } = useAuth();
  const queryClient = useQueryClient();
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: '', payment_method: 'bank_transfer', description: '' });

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
        .limit(50);
      return data || [];
    },
    enabled: !!organization,
  });

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

  const depositMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(depositForm.amount);
      if (!wallet) throw new Error('No wallet');
      const newBalance = (wallet.balance || 0) + amount;

      // Create transaction
      const { error: txError } = await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        organization_id: organization!.id,
        transaction_type: 'deposit',
        amount,
        balance_before: wallet.balance || 0,
        balance_after: newBalance,
        payment_method: depositForm.payment_method,
        description: depositForm.description || `إيداع ${amount} ج.م`,
        created_by: user?.id,
      } as any);
      if (txError) throw txError;

      // Update wallet balance
      const { error: wError } = await supabase.from('digital_wallets').update({
        balance: newBalance,
        total_deposited: (wallet.total_deposited || 0) + amount,
        last_transaction_at: new Date().toISOString(),
      } as any).eq('id', wallet.id);
      if (wError) throw wError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setShowDeposit(false);
      toast.success('تم الإيداع بنجاح');
      setDepositForm({ amount: '', payment_method: 'bank_transfer', description: '' });
    },
    onError: () => toast.error('فشل في الإيداع'),
  });

  if (!wallet) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-bold text-lg mb-2">المحفظة الإلكترونية</h3>
          <p className="text-muted-foreground mb-4">فعّل محفظتك الرقمية لإدارة المدفوعات والأرباح</p>
          <Button onClick={() => initWalletMutation.mutate()} disabled={initWalletMutation.isPending}>
            {initWalletMutation.isPending ? 'جاري التفعيل...' : 'تفعيل المحفظة'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const deposits = transactions.filter((t: any) => t.transaction_type === 'deposit');
  const payments = transactions.filter((t: any) => ['payment', 'withdrawal'].includes(t.transaction_type));

  return (
    <div className="space-y-4">
      {/* Wallet Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-primary" />
                <span className="font-medium">المحفظة الإلكترونية</span>
              </div>
              <Badge variant={wallet.is_active ? 'default' : 'secondary'}>
                {wallet.is_active ? 'نشطة' : 'معطلة'}
              </Badge>
            </div>
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground mb-1">الرصيد الحالي</p>
              <p className="text-4xl font-bold text-primary">{(wallet.balance || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">ج.م</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الإيداعات</p>
                <p className="font-bold text-emerald-500">{(wallet.total_deposited || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                <p className="font-bold text-red-500">{(wallet.total_spent || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
                <DialogTrigger asChild>
                  <Button className="flex-1 gap-2"><ArrowDownCircle className="w-4 h-4" />إيداع</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إيداع في المحفظة</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-3">
                    <div><Label>المبلغ (ج.م) *</Label><Input type="number" value={depositForm.amount} onChange={e => setDepositForm(p => ({ ...p, amount: e.target.value }))} /></div>
                    <div>
                      <Label>طريقة الدفع</Label>
                      <Select value={depositForm.payment_method} onValueChange={v => setDepositForm(p => ({ ...p, payment_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="card">بطاقة</SelectItem>
                          <SelectItem value="mobile_money">محفظة موبايل</SelectItem>
                          <SelectItem value="cash">نقدي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>ملاحظات</Label><Textarea value={depositForm.description} onChange={e => setDepositForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
                    <Button onClick={() => depositMutation.mutate()} disabled={!depositForm.amount || depositMutation.isPending} className="w-full">
                      {depositMutation.isPending ? 'جاري الإيداع...' : `إيداع ${Number(depositForm.amount).toLocaleString()} ج.م`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="flex-1 gap-2"><ArrowUpCircle className="w-4 h-4" />سحب</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            سجل المعاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد معاملات بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => {
                const cfg = TX_TYPE_CONFIG[tx.transaction_type] || TX_TYPE_CONFIG.payment;
                const Icon = cfg.icon;
                const isPositive = ['deposit', 'refund', 'earning', 'early_payment_discount'].includes(tx.transaction_type);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{cfg.label}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.description || ''} • {new Date(tx.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} ج.م
                      </p>
                      <p className="text-[10px] text-muted-foreground">الرصيد: {tx.balance_after?.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalWalletPanel;
