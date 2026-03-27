/**
 * ويدجت ملخص الإيرادات المصغر
 */
import { useTransporterFinancials } from '@/hooks/useTransporterExtended';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RevenueSnapshotMini = () => {
  const { data: financials, isLoading } = useTransporterFinancials();
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  const revenue = financials?.totalRevenue || 0;
  const pending = financials?.pendingPayments || 0;
  const deposits = financials?.totalDeposits || 0;
  const net = revenue - pending;
  const currency = financials?.currency || 'ج.م';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="border border-border/50 bg-card overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => navigate('/dashboard/erp/accounting')}}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              الملخص المالي
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/8 rounded-lg p-2.5 text-right border border-emerald-500/10">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground">الإيرادات</span>
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              </div>
              <p className="text-base sm:text-lg font-black text-emerald-500 tabular-nums">
                {revenue.toLocaleString('ar-EG')}
              </p>
              <p className="text-[9px] text-muted-foreground">{currency}</p>
            </div>
            <div className="bg-amber-500/8 rounded-lg p-2.5 text-right border border-amber-500/10">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground">معلّقة</span>
                <Wallet className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-base sm:text-lg font-black text-amber-500 tabular-nums">
                {pending.toLocaleString('ar-EG')}
              </p>
              <p className="text-[9px] text-muted-foreground">{currency}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">صافي المحصّل</p>
              <p className="text-sm font-black text-primary tabular-nums">{net.toLocaleString('ar-EG')} {currency}</p>
            </div>
            {deposits > 0 && (
              <div className="text-left flex items-center gap-1">
                <PiggyBank className="w-3.5 h-3.5 text-violet-500" />
                <div>
                  <p className="text-[9px] text-muted-foreground">الإيداعات</p>
                  <p className="text-xs font-bold text-violet-500 tabular-nums">{deposits.toLocaleString('ar-EG')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RevenueSnapshotMini;
