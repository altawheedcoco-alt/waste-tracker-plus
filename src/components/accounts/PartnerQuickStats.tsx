import { Package, FileText, CreditCard, TrendingUp, TrendingDown, Scale, Banknote } from 'lucide-react';
import AccountSummaryCard from './AccountSummaryCard';

interface PartnerQuickStatsProps {
  totalShipments: number;
  totalShipmentValue: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  totalQuantity: number;
  isGenerator?: boolean; // إذا كانت الجهة الحالية مولد
}

export default function PartnerQuickStats({
  totalShipments,
  totalShipmentValue,
  totalInvoiced,
  totalPaid,
  balance,
  totalQuantity,
  isGenerator = false,
}: PartnerQuickStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // للمولد: الشحنة = لنا (ننتظر الدفع)، الإيداع = علينا (تم استلامه)
  // للناقل/المدور: الشحنة = علينا (مستحق للشريك)، الإيداع = لنا (تم الدفع)
  
  const netBalance = totalShipmentValue - totalPaid;
  
  // تحديد اتجاه الرصيد بناءً على نوع الجهة
  const getBalanceLabel = () => {
    if (balance === 0) return 'الرصيد';
    if (isGenerator) {
      // للمولد: الباقي = لنا (مستحق من الناقل)
      return balance > 0 ? 'لنا (مستحق)' : 'علينا';
    } else {
      // للناقل/المدور: الباقي = علينا (مستحق للشريك) أو لنا (دفعنا أكثر)
      return balance > 0 ? 'علينا (مطلوب)' : 'لنا (فائض)';
    }
  };

  const getBalanceVariant = () => {
    if (balance === 0) return 'default';
    if (isGenerator) {
      return balance > 0 ? 'success' : 'danger';
    } else {
      return balance > 0 ? 'danger' : 'success';
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <AccountSummaryCard
        title="الشحنات"
        value={totalShipments}
        subtitle={`${formatCurrency(totalQuantity)} وحدة`}
        icon={Package}
        variant="info"
        formatValue={(v) => String(v)}
      />
      
      <AccountSummaryCard
        title={isGenerator ? 'قيمة المستحق' : 'قيمة الشحنات'}
        value={totalShipmentValue}
        subtitle={isGenerator ? 'المبلغ المستحق من الناقل' : 'حسب الأسعار المحددة'}
        icon={Scale}
        variant={isGenerator ? 'success' : 'default'}
      />
      
      <AccountSummaryCard
        title="إجمالي الفواتير"
        value={totalInvoiced}
        icon={FileText}
        variant="warning"
      />
      
      <AccountSummaryCard
        title={isGenerator ? 'المستلم (إيداعات)' : 'المدفوع'}
        value={totalPaid}
        subtitle={isGenerator ? 'ما تم استلامه' : 'ما تم دفعه للشريك'}
        icon={isGenerator ? Banknote : CreditCard}
        variant={isGenerator ? 'info' : 'success'}
      />
      
      <AccountSummaryCard
        title={getBalanceLabel()}
        value={Math.abs(balance)}
        icon={balance >= 0 ? TrendingUp : TrendingDown}
        variant={getBalanceVariant()}
        subtitle={balance === 0 ? 'مسدد بالكامل' : undefined}
      />
      
      <AccountSummaryCard
        title="صافي الحساب"
        value={Math.abs(netBalance)}
        icon={netBalance >= 0 ? TrendingUp : TrendingDown}
        variant={
          isGenerator 
            ? (netBalance > 0 ? 'success' : 'danger')
            : (netBalance > 0 ? 'warning' : 'success')
        }
        subtitle={
          isGenerator 
            ? (netBalance > 0 ? 'باقي لنا' : netBalance < 0 ? 'فائض مدفوع' : 'مسدد')
            : (netBalance > 0 ? 'باقي علينا' : netBalance < 0 ? 'فائض لنا' : 'مسدد')
        }
      />
    </div>
  );
}
