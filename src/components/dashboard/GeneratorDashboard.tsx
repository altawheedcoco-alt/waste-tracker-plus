import { useEffect, useState } from 'react';
import StoryCircles from '@/components/stories/StoryCircles';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Clock, CheckCircle2, Truck, AlertCircle, Bot, Eye, Users, Leaf, FileCheck, Send, FolderCheck, FileSignature, Banknote, Printer, Sparkles, ListFilter, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import ResponsiveGrid from './ResponsiveGrid';
import InteractiveStatCard from './shared/InteractiveStatCard';
import { DetailSection } from './shared/InteractiveDetailDrawer';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import DocumentVerificationWidget from './DocumentVerificationWidget';
import SmartRequestDialog from './SmartRequestDialog';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import GeneratorTrackingWidget from './generator/GeneratorTrackingWidget';
import DisposalRadarWidget from './generator/DisposalRadarWidget';
import ESGReportWidget from './generator/ESGReportWidget';
import LegalArchiveWidget from './generator/LegalArchiveWidget';
import LegalComplianceWidget from './generator/LegalComplianceWidget';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import OperationalAlertsWidget from './operations/OperationalAlertsWidget';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import DriverCodeLookup from '@/components/drivers/DriverCodeLookup';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import PartnerRatingsWidget from '@/components/partners/PartnerRatingsWidget';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import WeeklyShipmentChart from './generator/WeeklyShipmentChart';
import FinancialSummaryWidget from './generator/FinancialSummaryWidget';
import ComplianceGauge from './generator/ComplianceGauge';
import DashboardBrief from './generator/DashboardBrief';
import CreateWorkOrderDialog from '@/components/work-orders/CreateWorkOrderDialog';
import WorkOrderInbox from '@/components/work-orders/WorkOrderInbox';

interface ShipmentStats {
  total: number;
  new: number;
  inTransit: number;
  completed: number;
}

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
}

const GeneratorDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    new: 0,
    inTransit: 0,
    completed: 0,
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);

  // Responsive styles
  const titleClass = getResponsiveClass({
    mobile: 'text-lg',
    tablet: 'text-xl',
    desktop: 'text-2xl',
  });

  const statValueClass = getResponsiveClass({
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl',
  });

  const iconContainerClass = getResponsiveClass({
    mobile: 'w-10 h-10',
    tablet: 'w-11 h-11',
    desktop: 'w-12 h-12',
  });

  const iconClass = getResponsiveClass({
    mobile: 'w-5 h-5',
    tablet: 'w-5.5 h-5.5',
    desktop: 'w-6 h-6',
  });

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
        const { data: reportsData } = await supabase
          .from('recycling_reports')
          .select('shipment_id')
          .in('shipment_id', shipmentIds);

        const reportedShipmentIds = new Set(reportsData?.map(r => r.shipment_id) || []);

        const { data: receiptsData } = await supabase
          .from('shipment_receipts')
          .select('shipment_id')
          .in('shipment_id', shipmentIds);

        const receiptShipmentIds = new Set(receiptsData?.map(r => r.shipment_id) || []);

        const shipmentsWithStatus = shipments.map(s => ({
          ...s,
          has_report: reportedShipmentIds.has(s.id),
          has_receipt: receiptShipmentIds.has(s.id),
        }));

        setRecentShipments(shipmentsWithStatus as unknown as RecentShipment[]);

        setStats({
          total: shipments.length,
          new: shipments.filter((s) => s.status === 'new' || s.status === 'approved').length,
          inTransit: shipments.filter((s) => s.status === 'in_transit').length,
          completed: shipments.filter((s) => s.status === 'delivered' || s.status === 'confirmed').length,
        });
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

  const buildStatDetails = (type: string): DetailSection[] => {
    const sections: DetailSection[] = [
      {
        id: 'status-breakdown',
        title: 'توزيع حسب الحالة',
        icon: ListFilter,
        defaultOpen: true,
        content: (
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <Badge variant="secondary">{stats.new}</Badge>
              <span className="text-sm">جديدة / معتمدة</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <Badge variant="secondary">{stats.inTransit}</Badge>
              <span className="text-sm">قيد النقل</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <Badge variant="secondary">{stats.completed}</Badge>
              <span className="text-sm">مكتملة</span>
            </div>
          </div>
        ),
        link: '/dashboard/shipments',
      },
    ];
    return sections;
  };

  const statCards = [
    { title: 'إجمالي الشحنات', value: stats.total, icon: Package, gradient: 'from-blue-500 to-blue-600', color: 'text-blue-500', bgColor: 'bg-blue-500/10', detailSections: buildStatDetails('total') },
    { title: 'شحنات جديدة', value: stats.new, icon: Clock, gradient: 'from-amber-500 to-amber-600', color: 'text-amber-500', bgColor: 'bg-amber-500/10', detailSections: buildStatDetails('new') },
    { title: 'قيد النقل', value: stats.inTransit, icon: Truck, gradient: 'from-purple-500 to-purple-600', color: 'text-purple-500', bgColor: 'bg-purple-500/10', detailSections: buildStatDetails('transit') },
    { title: 'مكتملة', value: stats.completed, icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', detailSections: buildStatDetails('completed') },
  ];

  const quickActions = useQuickActions({
    type: 'generator',
    handlers: {
      openDepositDialog: () => setShowDepositDialog(true),
      openSmartWeightUpload: () => setShowSmartWeightUpload(true),
    },
  });

  return (
    <div className="space-y-3">
      <StoryCircles />

      {/* Welcome section */}
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
          <h1 className={`font-bold ${titleClass}`}>مرحباً، {profile?.full_name}</h1>
          <p className="text-muted-foreground text-sm">
            {organization?.name} - الجهة المولدة
          </p>
        </div>
      </div>

      {/* ★ Comprehensive Daily Brief */}
      <DashboardBrief />

      {/* Chart + Compliance row */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <WeeklyShipmentChart />
        <ComplianceGauge />
      </div>

      {/* Quick Actions - moved up for easy access */}
      <QuickActionsGrid
        actions={quickActions}
        title="الإجراءات السريعة"
        subtitle="الوظائف المستخدمة بكثرة"
      />

      {/* Work Orders */}
      <WorkOrderInbox />

      {/* Search & Verification */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <UnifiedDocumentSearch />
        <DriverCodeLookup />
      </div>

      {/* Operational Widgets */}
      <DailyOperationsSummary />
      <OperationalAlertsWidget />

      {/* Tracking & Monitoring */}
      <GeneratorTrackingWidget />
      <DisposalRadarWidget />

      {/* Reports & Compliance */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <ESGReportWidget />
        <PartnerRatingsWidget />
      </div>

      <PendingApprovalsWidget />
      <AutomationSettingsDialog organizationType="generator" />
      <LegalComplianceWidget />
      <LegalArchiveWidget />

      {/* Recent shipments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <BulkCertificateButton
                shipments={recentShipments.map(s => ({
                  id: s.id, shipment_number: s.shipment_number, status: s.status,
                  created_at: s.created_at, waste_type: s.waste_type, quantity: s.quantity,
                  unit: s.unit, delivered_at: s.delivered_at, confirmed_at: s.confirmed_at,
                  has_report: s.has_report,
                  generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                  transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                  recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
                }))}
                type="certificate"
                onSuccess={fetchDashboardData}
              />
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

      {/* Dialogs */}
      <EnhancedShipmentPrintView isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
      <DocumentVerificationWidget open={showDocumentVerification} onOpenChange={setShowDocumentVerification} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      <CreateWorkOrderDialog open={showWorkOrder} onOpenChange={setShowWorkOrder} />
    </div>
  );
};

export default GeneratorDashboard;
