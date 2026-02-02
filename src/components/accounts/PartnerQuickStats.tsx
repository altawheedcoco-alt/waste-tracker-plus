import { Package, FileText, CreditCard, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import AccountSummaryCard from './AccountSummaryCard';

interface PartnerQuickStatsProps {
  totalShipments: number;
  totalShipmentValue: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  totalQuantity: number;
}

export default function PartnerQuickStats({
  totalShipments,
  totalShipmentValue,
  totalInvoiced,
  totalPaid,
  balance,
  totalQuantity,
}: PartnerQuickStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
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
        title="قيمة الشحنات"
        value={totalShipmentValue}
        subtitle="حسب الأسعار المحددة"
        icon={Scale}
        variant="default"
      />
      
      <AccountSummaryCard
        title="إجمالي الفواتير"
        value={totalInvoiced}
        icon={FileText}
        variant="warning"
      />
      
      <AccountSummaryCard
        title="المدفوع"
        value={totalPaid}
        icon={CreditCard}
        variant="success"
      />
      
      <AccountSummaryCard
        title={balance > 0 ? 'لنا (مستحق)' : balance < 0 ? 'علينا (مطلوب)' : 'الرصيد'}
        value={Math.abs(balance)}
        icon={balance >= 0 ? TrendingUp : TrendingDown}
        variant={balance > 0 ? 'success' : balance < 0 ? 'danger' : 'default'}
        subtitle={balance === 0 ? 'مسدد بالكامل' : undefined}
      />
      
      <AccountSummaryCard
        title="الصافي"
        value={totalShipmentValue - totalPaid}
        icon={balance >= 0 ? TrendingUp : TrendingDown}
        variant={totalShipmentValue - totalPaid > 0 ? 'warning' : 'success'}
        subtitle="القيمة - المدفوع"
      />
    </div>
  );
}
