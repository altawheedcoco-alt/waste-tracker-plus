import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransporterRealtime } from '@/hooks/useTransporterRealtime';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickActions } from '@/hooks/useQuickActions';
import {
  useTransporterShipments,
  useTransporterStats,
  useTransporterNotifications,
} from '@/hooks/useTransporterDashboard';
import {
  useTransporterFinancials,
  useTransporterKPIs,
  useDriversSummary,
} from '@/hooks/useTransporterExtended';
import TransporterHeader from './transporter/TransporterHeader';
import TransporterStatsGrid from './transporter/TransporterStatsGrid';
import TransporterKPICards from './transporter/TransporterKPICards';
import TransporterNotifications from './transporter/TransporterNotifications';
import TransporterSLAAlerts from './transporter/TransporterSLAAlerts';
import TransporterIncomingRequests from './transporter/TransporterIncomingRequests';
import TransporterPartnerSummary from './transporter/TransporterPartnerSummary';
import TransporterShipmentsList from './transporter/TransporterShipmentsList';
import TransporterAggregateReport from './transporter/TransporterAggregateReport';
import TransporterDriverTracking from './transporter/TransporterDriverTracking';
import ShipmentCalendarWidget from './transporter/ShipmentCalendarWidget';
import PartnerProfitabilityPanel from './transporter/PartnerProfitabilityPanel';
import QuickActionsGrid from './QuickActionsGrid';
import PartnersView from './PartnersView';
import DocumentVerificationWidget from './DocumentVerificationWidget';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentStatusDialog from '@/components/shipments/ShipmentStatusDialog';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import RouteOptimizerPanel from '@/components/ai/RouteOptimizerPanel';
import SmartSchedulerPanel from '@/components/ai/SmartSchedulerPanel';
import PartnerRatingsWidget from '@/components/partners/PartnerRatingsWidget';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import OperationalAlertsWidget from './operations/OperationalAlertsWidget';
import FleetUtilizationWidget from './operations/FleetUtilizationWidget';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';

const TransporterDashboard = () => {
  const { organization } = useAuth();
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<TransporterShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusShipment, setStatusShipment] = useState<TransporterShipment | null>(null);
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<string | undefined>();

  // Data fetching with react-query
  const { data: shipments = [], isLoading: shipmentsLoading, refetch: refetchShipments } = useTransporterShipments();
  const { data: stats, isLoading: statsLoading } = useTransporterStats(shipments);
  const { data: notifications = [] } = useTransporterNotifications();
  const { data: financials, isLoading: financialsLoading } = useTransporterFinancials();
  const { data: kpis, isLoading: kpisLoading } = useTransporterKPIs();
  const { data: driversSummary = [], isLoading: driversLoading } = useDriversSummary();

  // Quick actions
  const quickActions = useQuickActions({
    type: 'transporter',
    handlers: {
      openDepositDialog: () => setShowDepositDialog(true),
    },
  });

  // Realtime subscriptions
  useTransporterRealtime();

  const handleRefresh = () => {
    refetchShipments();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <TransporterHeader organizationName={organization?.name || ''} />

      {/* Daily Operations Summary */}
      <DailyOperationsSummary />

      {/* Operational Alerts */}
      <OperationalAlertsWidget />

      {/* SLA Alerts - highest priority */}
      <TransporterSLAAlerts shipments={shipments} />

      {/* Incoming Requests */}
      <TransporterIncomingRequests />

      <TransporterNotifications notifications={notifications} />

      <DocumentVerificationWidget />

      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">نظرة عامة</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm whitespace-nowrap">التقويم</TabsTrigger>
          <TabsTrigger value="intelligence" className="text-xs sm:text-sm whitespace-nowrap">الذكاء والأتمتة</TabsTrigger>
          <TabsTrigger value="partners" className="text-xs sm:text-sm whitespace-nowrap">الشركاء</TabsTrigger>
          <TabsTrigger value="tracking" className="text-xs sm:text-sm whitespace-nowrap">تتبع السائقين</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Fleet Utilization */}
          <FleetUtilizationWidget />

          <TransporterStatsGrid stats={stats} isLoading={statsLoading} onStatClick={(f) => setShipmentStatusFilter(f === 'active' ? 'in_transit' : f)} />

          <TransporterKPICards
            financials={financials}
            kpis={kpis}
            financialsLoading={financialsLoading}
            kpisLoading={kpisLoading}
          />

          {/* Partner Financial Summary */}
          <TransporterPartnerSummary />

          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="إدارة الشحنات والسائقين والتقارير"
          />

          <TransporterShipmentsList
            shipments={shipments}
            isLoading={shipmentsLoading}
            onRefresh={handleRefresh}
            statusFilter={shipmentStatusFilter}
          />

          <TransporterAggregateReport shipments={shipments} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4 mt-6">
          <ShipmentCalendarWidget />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4 mt-6">
          <SmartSchedulerPanel />
          <RouteOptimizerPanel
            driverId=""
            destinations={[]}
          />
          <PartnerProfitabilityPanel />
        </TabsContent>

        <TabsContent value="partners" className="space-y-4 mt-6">
          <PartnerRatingsWidget />
          <PartnersView />
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <TransporterDriverTracking drivers={driversSummary} isLoading={driversLoading} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EnhancedShipmentPrintView
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        shipment={selectedShipment as any}
      />

      {statusShipment && (
        <ShipmentStatusDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setStatusShipment(null);
          }}
          shipment={statusShipment}
          onStatusChanged={handleRefresh}
        />
      )}

      <AddDepositDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
      />
    </div>
  );
};

export default TransporterDashboard;
