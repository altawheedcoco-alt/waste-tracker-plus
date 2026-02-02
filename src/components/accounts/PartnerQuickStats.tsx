import { Package, FileText, CreditCard, TrendingUp, TrendingDown, Scale, Banknote, Wallet } from 'lucide-react';
import AccountSummaryCard from './AccountSummaryCard';

interface PartnerQuickStatsProps {
  totalShipments: number;
  totalShipmentValue: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  totalQuantity: number;
  isGenerator?: boolean;
  totalDeposits?: number;
  totalPaidInvoices?: number;
  cancelledShipmentsCount?: number;
  cancelledShipmentsValue?: number;
  activeShipmentsCount?: number;
}

export default function PartnerQuickStats({
  totalShipments,
  totalShipmentValue,
  totalInvoiced,
  totalPaid,
  balance,
  totalQuantity,
  isGenerator = false,
  totalDeposits = 0,
  totalPaidInvoices = 0,
  cancelledShipmentsCount = 0,
  cancelledShipmentsValue = 0,
  activeShipmentsCount = 0,
}: PartnerQuickStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // صافي الحساب: المدفوع - قيمة الشحنات
  // إذا المدفوع أكبر من قيمة الشحنات = لنا (فائض)
  // إذا قيمة الشحنات أكبر من المدفوع = علينا (باقي)
  const netBalance = totalPaid - totalShipmentValue;
  
  // تحديد اتجاه الرصيد بناءً على نوع الجهة
  const getBalanceLabel = () => {
    if (balance === 0) return 'الرصيد';
    if (isGenerator) {
      return balance > 0 ? 'لنا (مستحق)' : 'علينا';
    } else {
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

  // تحديد اتجاه صافي الحساب
  const getNetBalanceLabel = () => {
    if (netBalance === 0) return 'مسدد بالكامل';
    if (isGenerator) {
      // للمولد: إذا دفع أكثر من قيمة الشحنات = لنا (فائض لصالحنا)
      return netBalance > 0 ? 'لنا (فائض)' : 'علينا (باقي)';
    } else {
      // للناقل: إذا دفع أكثر = لنا، إذا دفع أقل = علينا
      return netBalance > 0 ? 'لنا (فائض)' : 'علينا (باقي)';
    }
  };

  const getNetBalanceVariant = () => {
    if (netBalance === 0) return 'default';
    // الفائض (لنا) = أخضر، الباقي (علينا) = أحمر
    return netBalance > 0 ? 'success' : 'danger';
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <AccountSummaryCard
        title="الشحنات"
        value={activeShipmentsCount || totalShipments}
        subtitle={`${formatCurrency(totalQuantity)} وحدة`}
        icon={Package}
        variant="info"
        formatValue={(v) => String(v)}
        detailsTitle="تفاصيل الشحنات"
        details={[
          { label: 'إجمالي الشحنات', value: totalShipments },
          { label: 'الشحنات النشطة', value: activeShipmentsCount || totalShipments, isHighlighted: true },
          { label: 'الشحنات الملغاة', value: cancelledShipmentsCount },
          { label: 'إجمالي الكميات', value: `${formatCurrency(totalQuantity)} وحدة` },
        ]}
      />
      
      <AccountSummaryCard
        title={isGenerator ? 'قيمة المستحق' : 'قيمة الشحنات'}
        value={totalShipmentValue}
        subtitle={isGenerator ? 'المبلغ المستحق من الناقل' : 'حسب الأسعار المحددة'}
        icon={Scale}
        variant={isGenerator ? 'success' : 'default'}
        detailsTitle="تفاصيل القيمة"
        details={[
          { label: 'قيمة الشحنات النشطة', value: totalShipmentValue, isHighlighted: true },
          { label: 'قيمة الشحنات الملغاة', value: cancelledShipmentsValue },
          { label: 'إجمالي قبل الإلغاء', value: totalShipmentValue + cancelledShipmentsValue },
        ]}
      />
      
      <AccountSummaryCard
        title="إجمالي الفواتير"
        value={totalInvoiced}
        icon={FileText}
        variant="warning"
        detailsTitle="تفاصيل الفواتير"
        details={[
          { label: 'إجمالي قيمة الفواتير', value: totalInvoiced, isHighlighted: true },
          { label: 'المدفوع من الفواتير', value: totalPaidInvoices },
          { label: 'المتبقي من الفواتير', value: totalInvoiced - totalPaidInvoices },
        ]}
      />
      
      <AccountSummaryCard
        title={isGenerator ? 'المستلم (إيداعات)' : 'المدفوع'}
        value={totalPaid}
        subtitle={isGenerator ? 'ما تم استلامه' : 'ما تم دفعه للشريك'}
        icon={isGenerator ? Banknote : CreditCard}
        variant={isGenerator ? 'info' : 'success'}
        detailsTitle="تفاصيل المدفوعات"
        details={[
          { label: 'إجمالي الإيداعات', value: totalDeposits },
          { label: 'المدفوع من الفواتير', value: totalPaidInvoices },
          { label: 'إجمالي المدفوع', value: totalPaid, isHighlighted: true },
        ]}
      />
      
      <AccountSummaryCard
        title={getBalanceLabel()}
        value={Math.abs(balance)}
        icon={balance >= 0 ? TrendingUp : TrendingDown}
        variant={getBalanceVariant()}
        subtitle={balance === 0 ? 'مسدد بالكامل' : undefined}
        detailsTitle="تفاصيل الرصيد"
        details={[
          { label: 'إجمالي الفواتير', value: totalInvoiced },
          { label: 'إجمالي المدفوع', value: totalPaid },
          { label: 'الرصيد', value: Math.abs(balance), isHighlighted: true },
          { label: 'الحالة', value: balance === 0 ? 'مسدد' : (balance > 0 ? 'مستحق' : 'فائض') },
        ]}
      />
      
      <AccountSummaryCard
        title="صافي الحساب"
        value={Math.abs(netBalance)}
        icon={Wallet}
        variant={getNetBalanceVariant()}
        subtitle={getNetBalanceLabel()}
        detailsTitle="تفاصيل صافي الحساب"
        details={[
          { label: 'قيمة الشحنات', value: totalShipmentValue },
          { label: 'إجمالي المدفوع', value: totalPaid },
          { label: 'الفرق', value: Math.abs(netBalance), isHighlighted: true },
          { label: 'الحالة', value: getNetBalanceLabel() },
        ]}
      />
    </div>
  );
}
