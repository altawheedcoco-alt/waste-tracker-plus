/**
 * محفظة السائق المالية — الرصيد والمعاملات
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownCircle,
  ArrowUpCircle, Clock, Loader2, Banknote,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface DriverFinancialWalletProps {
  driverId: string;
}

const TX_ICONS: Record<string, typeof ArrowDownCircle> = {
  earning: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  bonus: TrendingUp,
  deduction: TrendingDown,
};

const TX_LABELS: Record<string, string> = {
  earning: 'أرباح',
  withdrawal: 'سحب',
  bonus: 'مكافأة',
  deduction: 'خصم',
};

const TX_COLORS: Record<string, string> = {
  earning: 'text-emerald-600',
  withdrawal: 'text-destructive',
  bonus: 'text-primary',
  deduction: 'text-amber-600',
};

const DriverFinancialWallet = ({ driverId }: DriverFinancialWalletProps) => {
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['driver-financial-wallet', driverId],
    enabled: !!driverId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_financial_wallet')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['driver-financial-tx', driverId],
    enabled: !!driverId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_financial_transactions')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  if (walletLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const pending = wallet?.pending_balance ?? 0;
  const totalEarned = wallet?.total_earned ?? 0;

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold">محفظتي</h3>
            </div>

            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{balance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ج.م</span></p>
              <p className="text-xs text-muted-foreground mt-1">الرصيد المتاح</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-card/80 border border-border/30">
                <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                <p className="text-sm font-bold">{pending.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">معلّق</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-card/80 border border-border/30">
                <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                <p className="text-sm font-bold">{totalEarned.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">إجمالي الأرباح</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Banknote className="w-4 h-4 text-muted-foreground" />
            سجل المعاملات
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {txLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto my-6 text-muted-foreground" />
          ) : transactions.length === 0 ? (
            <div className="text-center py-6">
              <Banknote className="w-10 h-10 mx-auto mb-2 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">لا توجد معاملات بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => {
                const Icon = TX_ICONS[tx.transaction_type] || Banknote;
                const isPositive = tx.transaction_type === 'earning' || tx.transaction_type === 'bonus';
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-full ${isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <Icon className={`w-3.5 h-3.5 ${TX_COLORS[tx.transaction_type] || 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{tx.description || TX_LABELS[tx.transaction_type] || tx.transaction_type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-destructive'}`}>
                      {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} ج.م
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverFinancialWallet;
