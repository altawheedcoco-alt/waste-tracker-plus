import { useEffect, useState, lazy, Suspense } from 'react';
import StoryCircles from '@/components/stories/StoryCircles';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Eye, FileCheck, Sparkles, ClipboardList, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import InteractiveStatCard from './shared/InteractiveStatCard';
import { DetailSection } from './shared/InteractiveDetailDrawer';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import GeneratorCommandCenter from './generator/GeneratorCommandCenter';
import SmartDailyBrief from './shared/SmartDailyBrief';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import OperationalAlertsWidget from './operations/OperationalAlertsWidget';
import DocumentVerificationWidget from './DocumentVerificationWidget';
import SmartRequestDialog from './SmartRequestDialog';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy tab content
const GeneratorTrackingWidget = lazy(() => import('./generator/GeneratorTrackingWidget'));
const DisposalRadarWidget = lazy(() => import('./generator/DisposalRadarWidget'));
const ESGReportWidget = lazy(() => import('./generator/ESGReportWidget'));
const LegalArchiveWidget = lazy(() => import('./generator/LegalArchiveWidget'));
const LegalComplianceWidget = lazy(() => import('./generator/LegalComplianceWidget'));
const DashboardBrief = lazy(() => import('./generator/DashboardBrief'));
const WeeklyShipmentChart = lazy(() => import('./generator/WeeklyShipmentChart'));
const FinancialSummaryWidget = lazy(() => import('./generator/FinancialSummaryWidget'));
const ComplianceGauge = lazy(() => import('./generator/ComplianceGauge'));
const DriverCodeLookup = lazy(() => import('@/components/drivers/DriverCodeLookup'));
const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const BulkCertificateButton = lazy(() => import('@/components/bulk/BulkCertificateButton'));
const WorkOrderInbox = lazy(() => import('@/components/work-orders/WorkOrderInbox'));
const CreateWorkOrderDialog = lazy(() => import('@/components/work-orders/CreateWorkOrderDialog'));
const ComplianceCertificateWidget = lazy(() => import('@/components/compliance/ComplianceCertificateWidget'));
const ConsultantKPIsWidget = lazy(() => import('@/components/compliance/ConsultantKPIsWidget'));
const ComplianceAlertsWidget = lazy(() => import('@/components/compliance/ComplianceAlertsWidget'));
const RiskMatrixWidget = lazy(() => import('@/components/compliance/RiskMatrixWidget'));
const CorrectiveActionsWidget = lazy(() => import('@/components/compliance/CorrectiveActionsWidget'));
const AuditPortalWidget = lazy(() => import('@/components/compliance/AuditPortalWidget'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

interface RecentShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  driver_id: string | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
  has_receipt?: boolean;
  has_delivery_certificate?: boolean;
}

const GeneratorDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isMobile } = useDisplayMode();
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id]);

  const fetchDashboardData = async () => {
    try {
      const { data: shipmentsRaw, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, waste_type, quantity, unit, status, created_at,
          pickup_address, delivery_address, pickup_date, expected_delivery_date,
          notes, generator_notes, recycler_notes, waste_description, hazard_level,
          packaging_method, disposal_method, approved_at, collection_started_at,
          in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate,
          driver_id, generator_id, transporter_id, recycler_id
        `)
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (shipmentsRaw) {
        const orgIds = [...new Set([
          ...shipmentsRaw.map(s => s.transporter_id).filter(Boolean),
          ...shipmentsRaw.map(s => s.recycler_id).filter(Boolean),
          ...shipmentsRaw.map(s => s.generator_id).filter(Boolean),
        ])] as string[];
        
        const orgsMap: Record<string, any> = {};
        if (orgIds.length > 0) {
          const { data: orgsData } = await supabase.from('organizations').select('*').in('id', orgIds);
          orgsData?.forEach(o => { orgsMap[o.id] = o; });
        }

        const driverIds = [...new Set(shipmentsRaw.map(s => s.driver_id).filter(Boolean))] as string[];
        const driversMap: Record<string, any> = {};
        if (driverIds.length > 0) {
          const { data: driversData } = await supabase.from('drivers').select('license_number, vehicle_type, vehicle_plate, id, profile:profiles(full_name, phone)').in('id', driverIds);
          driversData?.forEach(d => { driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile }; });
        }

        const shipments = shipmentsRaw.map(s => ({
          ...s,
          generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
          transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
          recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
          driver: s.driver_id ? driversMap[s.driver_id] || null : null,
        }));

        const shipmentIds = shipments.map(s => s.id);
        const [reportsRes, receiptsRes, deliveryCertsRes] = await Promise.all([
          supabase.from('recycling_reports').select('shipment_id').in('shipment_id', shipmentIds),
          supabase.from('shipment_receipts').select('shipment_id').in('shipment_id', shipmentIds),
          supabase.from('shipment_receipts').select('shipment_id').in('shipment_id', shipmentIds).eq('generator_id', organization?.id || ''),
        ]);

        const reportedIds = new Set(reportsRes.data?.map(r => r.shipment_id) || []);
        const receiptIds = new Set(receiptsRes.data?.map(r => r.shipment_id) || []);
        const deliveryCertIds = new Set(deliveryCertsRes.data?.map(r => r.shipment_id) || []);

        const shipmentsWithStatus = shipments.map(s => ({
          ...s,
          has_report: reportedIds.has(s.id),
          has_receipt: receiptIds.has(s.id),
          has_delivery_certificate: deliveryCertIds.has(s.id),
        }));

        setRecentShipments(shipmentsWithStatus as unknown as RecentShipment[]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintShipment = (shipment: RecentShipment) => {
    setSelectedShipment(shipment);
    setShowPrintDialog(true);
  };

  const quickActions = useQuickActions({
    type: 'generator',
    handlers: {
      openDepositDialog: () => setShowDepositDialog(true),
      openSmartWeightUpload: () => setShowSmartWeightUpload(true),
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <SmartDailyBrief
        role="generator"
        stats={{
          pending: recentShipments.filter(s => s.status === 'new').length,
          active: recentShipments.filter(s => ['approved', 'in_transit', 'collecting'].includes(s.status)).length,
          completed: recentShipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length,
          total: recentShipments.length,
        }}
      />
      <StoryCircles />

      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
        <div className={`flex items-center gap-2 flex-wrap ${isMobile ? 'order-2' : ''}`}>
          <Button onClick={() => setShowWorkOrder(true)} variant="default" size={isMobile ? 'sm' : 'default'} className="gap-2">
            <ClipboardList className="w-4 h-4" />
            {!isMobile && t('workOrder.createNew')}
          </Button>
          <SmartRequestDialog buttonText={isMobile ? t('common.search') : t('common.search')} buttonVariant="outline" />
          <Button onClick={() => setShowDocumentVerification(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className="gap-2">
            <FileCheck className="w-4 h-4" />
            {!isMobile && t('docVerify.sectionBadge')}
          </Button>
          <Button onClick={() => setShowSmartWeightUpload(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className="gap-2">
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
        <div className={`text-right ${isMobile ? 'order-1' : ''}`}>
          <h1 className="font-bold text-xl sm:text-2xl">مرحباً، {profile?.full_name}</h1>
          <p className="text-muted-foreground text-sm">
            {organization?.name} - الجهة المولدة
          </p>
        </div>
      </div>

      {/* ★ مركز القيادة */}
      <GeneratorCommandCenter />

      {/* ★ Daily Operations */}
      <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
        <DailyOperationsSummary />
      </ErrorBoundary>

      <AutomationSettingsDialog organizationType="generator" />

      {/* Alerts & Approvals */}
      <ErrorBoundary fallbackTitle="خطأ في التنبيهات">
        <OperationalAlertsWidget />
      </ErrorBoundary>

      <PendingApprovalsWidget />
      <UnifiedDocumentSearch />

      {/* ★ Tabbed Sections — same pattern as Transporter */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">نظرة عامة</TabsTrigger>
          <TabsTrigger value="shipments" className="text-xs sm:text-sm whitespace-nowrap">الشحنات</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs sm:text-sm whitespace-nowrap">العمليات</TabsTrigger>
          <TabsTrigger value="work-orders" className="text-xs sm:text-sm whitespace-nowrap">أوامر الشغل</TabsTrigger>
          <TabsTrigger value="partners" className="text-xs sm:text-sm whitespace-nowrap">الجهات المرتبطة</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm whitespace-nowrap">الامتثال القانوني</TabsTrigger>
        </TabsList>

        {/* ── نظرة عامة ── */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <DashboardBrief />
          </Suspense>

          <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
            <Suspense fallback={<TabFallback />}>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <WeeklyShipmentChart />
                <ComplianceGauge />
              </div>
            </Suspense>
          </ErrorBoundary>

          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="الوظائف المستخدمة بكثرة"
          />

          <ErrorBoundary fallbackTitle="خطأ في الملخص المالي">
            <Suspense fallback={<TabFallback />}>
              <FinancialSummaryWidget />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        {/* ── الشحنات ── */}
        <TabsContent value="shipments" className="space-y-4 mt-4 sm:mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Suspense fallback={null}>
                    <BulkCertificateButton
                      shipments={recentShipments.map(s => ({
                        id: s.id, shipment_number: s.shipment_number, status: s.status,
                        created_at: s.created_at, waste_type: s.waste_type, quantity: s.quantity,
                        unit: s.unit, delivered_at: s.delivered_at, confirmed_at: s.confirmed_at,
                        has_report: s.has_report,
                        has_delivery_certificate: s.has_delivery_certificate,
                        generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                        transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                        recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
                      }))}
                      type="delivery"
                      onSuccess={fetchDashboardData}
                    />
                  </Suspense>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                    <Eye className="ml-2 h-4 w-4" />
                    عرض الكل
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Package className="w-5 h-5" />
                    أحدث الشحنات
                  </CardTitle>
                  <CardDescription>آخر 10 شحنات تم إنشاؤها</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد شحنات حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentShipments.map((shipment) => (
                    <div key={shipment.id} className="group relative rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md overflow-hidden">
                      <ShipmentCard shipment={shipment} onStatusChange={fetchDashboardData} />
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border-t border-border/30">
                        <Button
                          variant="outline" size="sm"
                          className="text-xs h-7 gap-1.5 rounded-full px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handlePrintShipment(shipment); }}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          طباعة
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="text-xs h-7 gap-1.5 rounded-full px-3 hover:bg-secondary hover:text-secondary-foreground mr-auto transition-colors"
                          onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          التفاصيل
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── العمليات ── */}
        <TabsContent value="operations" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في التتبع">
              <GeneratorTrackingWidget />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="خطأ في رادار التخلص">
              <DisposalRadarWidget />
            </ErrorBoundary>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <ErrorBoundary fallbackTitle="خطأ في ESG">
                <ESGReportWidget />
              </ErrorBoundary>
              <DriverCodeLookup />
            </div>
          </Suspense>
        </TabsContent>

        {/* ── أوامر الشغل ── */}
        <TabsContent value="work-orders" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <WorkOrderInbox />
          </Suspense>
        </TabsContent>

        {/* ── الجهات المرتبطة ── */}
        <TabsContent value="partners" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <PartnerRatingsWidget />
          </Suspense>
        </TabsContent>

        {/* ── الامتثال القانوني ── */}
        <TabsContent value="compliance" className="space-y-4 mt-4 sm:mt-6">
          <Suspense fallback={<TabFallback />}>
            <ComplianceAlertsWidget />
            <ConsultantKPIsWidget />
            <ComplianceCertificateWidget />
            <RiskMatrixWidget />
            <CorrectiveActionsWidget />
            <AuditPortalWidget />
            <LegalComplianceWidget />
            <LegalArchiveWidget />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EnhancedShipmentPrintView isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
      <DocumentVerificationWidget open={showDocumentVerification} onOpenChange={setShowDocumentVerification} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <Suspense fallback={null}>
        <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
        <CreateWorkOrderDialog open={showWorkOrder} onOpenChange={setShowWorkOrder} />
      </Suspense>
    </div>
  );
};

export default GeneratorDashboard;
