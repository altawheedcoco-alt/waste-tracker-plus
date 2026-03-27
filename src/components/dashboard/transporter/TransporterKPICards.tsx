import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, FileText, Truck } from 'lucide-react';
import { TransporterFinancials, TransporterKPIs } from '@/hooks/useTransporterExtended';
import InteractiveStatCard from '../shared/InteractiveStatCard';
import { DetailSection } from '../shared/InteractiveDetailDrawer';
import { useLanguage } from '@/contexts/LanguageContext';

interface TransporterKPICardsProps {
  financials: TransporterFinancials | undefined;
  kpis: TransporterKPIs | undefined;
  financialsLoading: boolean;
  kpisLoading: boolean;
}

const TransporterKPICards = ({ financials, kpis, financialsLoading, kpisLoading }: TransporterKPICardsProps) => {
  const { t } = useLanguage();
  const isLoading = financialsLoading || kpisLoading;

  const revenueDetails: DetailSection[] = [
    {
      id: 'revenue-breakdown',
      title: t('transporterKPI.revenueDetails'),
      icon: DollarSign,
      defaultOpen: true,
      content: (
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <span className="font-bold text-emerald-600">
              {(financials?.totalRevenue || 0).toLocaleString('ar-EG')} {financials?.currency || t('transportOffice.currency')}
            </span>
            <span className="text-sm">{t('transporterKPI.totalRevenue')}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <span className="font-bold text-amber-600">
              {(financials?.pendingPayments || 0).toLocaleString('ar-EG')} {financials?.currency || t('transportOffice.currency')}
            </span>
            <span className="text-sm">{t('transporterKPI.pendingPayments')}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
            <span className="font-bold text-primary">
              {((financials?.totalRevenue || 0) - (financials?.pendingPayments || 0)).toLocaleString('ar-EG')} {financials?.currency || t('transportOffice.currency')}
            </span>
            <span className="text-sm font-medium">{t('transporterKPI.netCollected')}</span>
          </div>
        </div>
      ),
      link: '/dashboard/erp/accounting',
    },
  ];

  const pendingDetails: DetailSection[] = [
    {
      id: 'pending-info',
      title: t('transporterKPI.pendingPaymentsTitle'),
      icon: Clock,
      defaultOpen: true,
      content: (
        <div className="space-y-2 text-right text-sm text-muted-foreground">
          <p>{t('transporterKPI.pendingAmount')} <span className="font-bold text-foreground">{(financials?.pendingPayments || 0).toLocaleString('ar-EG')} {financials?.currency || t('transportOffice.currency')}</span></p>
          <p>{t('transporterKPI.pendingFollowUp')}</p>
        </div>
      ),
      link: '/dashboard/accounting',
    },
  ];

  const onTimeDetails: DetailSection[] = [
    {
      id: 'performance-breakdown',
      title: t('transporterKPI.performanceDetails'),
      icon: TrendingUp,
      defaultOpen: true,
      content: (
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant={((kpis?.onTimeRate || 0) >= 80) ? 'default' : 'destructive'}>
              {kpis?.onTimeRate || 0}%
            </Badge>
            <span className="text-sm">{t('transporterKPI.onTimeCompliance')}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant="secondary">{kpis?.completionRate || 0}%</Badge>
            <span className="text-sm">{t('transporterKPI.completionRate')}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant="outline">{kpis?.avgDeliveryDays || 0} {t('transporterKPI.days')}</Badge>
            <span className="text-sm">{t('transporterKPI.avgDeliveryTime')}</span>
          </div>
        </div>
      ),
    },
  ];

  const overdueDetails: DetailSection[] = [
    {
      id: 'overdue-info',
      title: t('transporterKPI.overdueShipments'),
      icon: AlertTriangle,
      defaultOpen: true,
      content: (
        <div className="space-y-3 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant={(kpis?.overdueShipments || 0) > 0 ? 'destructive' : 'default'}>
              {kpis?.overdueShipments || 0}
            </Badge>
            <span className="text-sm">{t('transporterKPI.overdueCount')}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <Badge variant="outline">{kpis?.avgDeliveryDays || 0} {t('transporterKPI.days')}</Badge>
            <span className="text-sm">{t('transporterKPI.avgDelivery')}</span>
          </div>
          {(kpis?.overdueShipments || 0) > 0 && (
            <p className="text-sm text-destructive">{t('transporterKPI.needsImmediateAttention')}</p>
          )}
        </div>
      ),
      link: '/dashboard/shipments',
    },
  ];

  const cards = [
    {
      title: t('transporterKPI.revenueTitle'),
      value: `${(financials?.totalRevenue || 0).toLocaleString('ar-EG')}`,
      suffix: financials?.currency || t('transportOffice.currency'),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      detailSections: revenueDetails,
    },
    {
      title: t('transporterKPI.pendingPaymentsCard'),
      value: `${(financials?.pendingPayments || 0).toLocaleString('ar-EG')}`,
      suffix: financials?.currency || t('transportOffice.currency'),
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      badge: financials?.pendingPayments && financials.pendingPayments > 0 ? t('shipmentsAccount.needsFollowUp') : undefined,
      detailSections: pendingDetails,
    },
    {
      title: t('transporterKPI.onTimeRate'),
      value: `${kpis?.onTimeRate || 0}%`,
      subtitle: `${t('transporterKPI.completionRateLabel')} ${kpis?.completionRate || 0}%`,
      icon: TrendingUp,
      color: (kpis?.onTimeRate || 0) >= 80 ? 'text-emerald-600' : 'text-red-600',
      bgColor: (kpis?.onTimeRate || 0) >= 80 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      detailSections: onTimeDetails,
    },
    {
      title: t('transporterKPI.overdueShipmentsCard'),
      value: `${kpis?.overdueShipments || 0}`,
      subtitle: `${t('transporterKPI.avgDeliveryLabel')} ${kpis?.avgDeliveryDays || 0} ${t('transporterKPI.days')}`,
      icon: AlertTriangle,
      color: (kpis?.overdueShipments || 0) > 0 ? 'text-red-600' : 'text-emerald-600',
      bgColor: (kpis?.overdueShipments || 0) > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      badge: (kpis?.overdueShipments || 0) > 0 ? t('transporterKPI.needsAttention') : undefined,
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
          detailDescription={`${t('transporterKPI.detailsOf')} ${card.title}`}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default TransporterKPICards;
