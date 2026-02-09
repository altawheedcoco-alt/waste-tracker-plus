import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { TransporterFinancials, TransporterKPIs } from '@/hooks/useTransporterExtended';

interface TransporterKPICardsProps {
  financials: TransporterFinancials | undefined;
  kpis: TransporterKPIs | undefined;
  financialsLoading: boolean;
  kpisLoading: boolean;
}

const TransporterKPICards = ({ financials, kpis, financialsLoading, kpisLoading }: TransporterKPICardsProps) => {
  const isLoading = financialsLoading || kpisLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-3 sm:p-6"><Skeleton className="h-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'الإيرادات',
      value: `${(financials?.totalRevenue || 0).toLocaleString('ar-SA')}`,
      suffix: financials?.currency || 'SAR',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'مدفوعات معلقة',
      value: `${(financials?.pendingPayments || 0).toLocaleString('ar-SA')}`,
      suffix: financials?.currency || 'SAR',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      badge: financials?.pendingPayments && financials.pendingPayments > 0 ? 'تحتاج متابعة' : undefined,
    },
    {
      title: 'نسبة الالتزام بالمواعيد',
      value: `${kpis?.onTimeRate || 0}%`,
      subtitle: `معدل الإنجاز: ${kpis?.completionRate || 0}%`,
      icon: TrendingUp,
      color: (kpis?.onTimeRate || 0) >= 80 ? 'text-emerald-600' : 'text-red-600',
      bgColor: (kpis?.onTimeRate || 0) >= 80 ? 'bg-emerald-500/10' : 'bg-red-500/10',
    },
    {
      title: 'شحنات متأخرة',
      value: `${kpis?.overdueShipments || 0}`,
      subtitle: `متوسط التسليم: ${kpis?.avgDeliveryDays || 0} يوم`,
      icon: AlertTriangle,
      color: (kpis?.overdueShipments || 0) > 0 ? 'text-red-600' : 'text-emerald-600',
      bgColor: (kpis?.overdueShipments || 0) > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      badge: (kpis?.overdueShipments || 0) > 0 ? 'تحتاج اهتمام' : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                </div>
                {card.badge && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-muted-foreground">{card.title}</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <p className="text-lg sm:text-2xl font-bold">{card.value}</p>
                  {card.suffix && <span className="text-xs text-muted-foreground">{card.suffix}</span>}
                </div>
                {card.subtitle && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{card.subtitle}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransporterKPICards;
