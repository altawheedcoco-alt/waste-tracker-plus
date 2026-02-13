import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, FileText, Truck } from 'lucide-react';
import { TransporterFinancials, TransporterKPIs } from '@/hooks/useTransporterExtended';
import InteractiveStatCard from '../shared/InteractiveStatCard';
import { DetailSection } from '../shared/InteractiveDetailDrawer';

interface TransporterKPICardsProps {
  financials: TransporterFinancials | undefined;
  kpis: TransporterKPIs | undefined;
  financialsLoading: boolean;
  kpisLoading: boolean;
}

const TransporterKPICards = ({ financials, kpis, financialsLoading, kpisLoading }: TransporterKPICardsProps) => {
  const isLoading = financialsLoading || kpisLoading;

  const revenueDetails: DetailSection[] = [
    {
      id: 'revenue-breakdown',
      title: 'تفاصيل الإيرادات',
      icon: DollarSign,
      defaultOpen: true,
      content: (
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <span className="font-bold text-emerald-600">
              {(financials?.totalRevenue || 0).toLocaleString('ar-SA')} {financials?.currency || 'SAR'}
            </span>
            <span className="text-sm">إجمالي الإيرادات</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <span className="font-bold text-amber-600">
              {(financials?.pendingPayments || 0).toLocaleString('ar-SA')} {financials?.currency || 'SAR'}
            </span>
            <span className="text-sm">مدفوعات معلقة</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
            <span className="font-bold text-primary">
              {((financials?.totalRevenue || 0) - (financials?.pendingPayments || 0)).toLocaleString('ar-SA')} {financials?.currency || 'SAR'}
            </span>
            <span className="text-sm font-medium">صافي المحصّل</span>
          </div>
        </div>
      ),
      link: '/dashboard/accounting',
    },
  ];

  const pendingDetails: DetailSection[] = [
    {
      id: 'pending-info',
      title: 'المدفوعات المعلقة',
      icon: Clock,
      defaultOpen: true,
      content: (
        <div className="space-y-2 text-right text-sm text-muted-foreground">
          <p>المبلغ المعلق: <span className="font-bold text-foreground">{(financials?.pendingPayments || 0).toLocaleString('ar-SA')} {financials?.currency || 'SAR'}</span></p>
          <p>هذه المدفوعات تحتاج متابعة وتحصيل من الشركاء.</p>
        </div>
      ),
      link: '/dashboard/accounting',
    },
  ];

  const onTimeDetails: DetailSection[] = [
    {
      id: 'performance-breakdown',
      title: 'تفاصيل الأداء',
      icon: TrendingUp,
      defaultOpen: true,
      content: (
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant={((kpis?.onTimeRate || 0) >= 80) ? 'default' : 'destructive'}>
              {kpis?.onTimeRate || 0}%
            </Badge>
            <span className="text-sm">الالتزام بالمواعيد</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant="secondary">{kpis?.completionRate || 0}%</Badge>
            <span className="text-sm">معدل الإنجاز</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant="outline">{kpis?.avgDeliveryDays || 0} يوم</Badge>
            <span className="text-sm">متوسط وقت التسليم</span>
          </div>
        </div>
      ),
    },
  ];

  const overdueDetails: DetailSection[] = [
    {
      id: 'overdue-info',
      title: 'الشحنات المتأخرة',
      icon: AlertTriangle,
      defaultOpen: true,
      content: (
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant={(kpis?.overdueShipments || 0) > 0 ? 'destructive' : 'default'}>
              {kpis?.overdueShipments || 0}
            </Badge>
            <span className="text-sm">شحنات متأخرة</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant="outline">{kpis?.avgDeliveryDays || 0} يوم</Badge>
            <span className="text-sm">متوسط التسليم</span>
          </div>
          {(kpis?.overdueShipments || 0) > 0 && (
            <p className="text-sm text-destructive">⚠️ يوجد شحنات تحتاج اهتمام فوري</p>
          )}
        </div>
      ),
      link: '/dashboard/shipments',
    },
  ];

  const cards = [
    {
      title: 'الإيرادات',
      value: `${(financials?.totalRevenue || 0).toLocaleString('ar-SA')}`,
      suffix: financials?.currency || 'SAR',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      detailSections: revenueDetails,
    },
    {
      title: 'مدفوعات معلقة',
      value: `${(financials?.pendingPayments || 0).toLocaleString('ar-SA')}`,
      suffix: financials?.currency || 'SAR',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      badge: financials?.pendingPayments && financials.pendingPayments > 0 ? 'تحتاج متابعة' : undefined,
      detailSections: pendingDetails,
    },
    {
      title: 'نسبة الالتزام بالمواعيد',
      value: `${kpis?.onTimeRate || 0}%`,
      subtitle: `معدل الإنجاز: ${kpis?.completionRate || 0}%`,
      icon: TrendingUp,
      color: (kpis?.onTimeRate || 0) >= 80 ? 'text-emerald-600' : 'text-red-600',
      bgColor: (kpis?.onTimeRate || 0) >= 80 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      detailSections: onTimeDetails,
    },
    {
      title: 'شحنات متأخرة',
      value: `${kpis?.overdueShipments || 0}`,
      subtitle: `متوسط التسليم: ${kpis?.avgDeliveryDays || 0} يوم`,
      icon: AlertTriangle,
      color: (kpis?.overdueShipments || 0) > 0 ? 'text-red-600' : 'text-emerald-600',
      bgColor: (kpis?.overdueShipments || 0) > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      badge: (kpis?.overdueShipments || 0) > 0 ? 'تحتاج اهتمام' : undefined,
      detailSections: overdueDetails,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {cards.map((card, index) => (
        <InteractiveStatCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          subtitle={card.subtitle}
          suffix={card.suffix}
          badge={card.badge}
          badgeVariant="destructive"
          delay={index * 0.1}
          detailSections={card.detailSections}
          detailTitle={card.title}
          detailDescription={`تفاصيل ${card.title}`}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default TransporterKPICards;
