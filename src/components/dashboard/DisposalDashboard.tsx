import { useState, useEffect, lazy, Suspense } from 'react';
import { Factory, Package, Clock, CheckCircle, TrendingUp, Shield, Eye, AlertCircle, Truck, Wrench, BarChart3, Users, FileText, Settings, Leaf } from 'lucide-react';

const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FacilityDashboardHeader from '@/components/dashboard/shared/FacilityDashboardHeader';
import FacilityCapacityCard from '@/components/dashboard/shared/FacilityCapacityCard';
import StatsCardsGrid, { StatCardItem } from '@/components/dashboard/shared/StatsCardsGrid';
import DisposalIncomingPanel from '@/components/dashboard/disposal/DisposalIncomingPanel';
import DisposalDailyOperations from '@/components/dashboard/disposal/DisposalDailyOperations';
import DisposalRecentOperations from '@/components/dashboard/disposal/DisposalRecentOperations';
import OperationalAlertsWidget from '@/components/dashboard/operations/OperationalAlertsWidget';
import DriverCodeLookup from '@/components/drivers/DriverCodeLookup';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import StoryCircles from '@/components/stories/StoryCircles';
import LegalComplianceWidget from '@/components/dashboard/generator/LegalComplianceWidget';
import VehicleComplianceManager from '@/components/compliance/VehicleComplianceManager';
import DriverComplianceManager from '@/components/compliance/DriverComplianceManager';
import IncidentReportManager from '@/components/compliance/IncidentReportManager';
import CreateShipmentButton from '@/components/dashboard/CreateShipmentButton';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';

interface DisposalDashboardProps {
  embedded?: boolean;
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
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
}

const DisposalDashboard = ({ embedded = false }: DisposalDashboardProps) => {
  const { profile, organization } = useAuth();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase.from('disposal_facilities').select('*').eq('organization_id', organization.id).maybeSingle();
      return data;
    },
    enabled: !!organization?.id
  });

  const { data: operationsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['disposal-operations-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase.from('disposal_operations').select('status, quantity').eq('organization_id', organization.id);
      return {
        total: data?.length || 0,
        pending: data?.filter(o => o.status === 'pending').length || 0,
        processing: data?.filter(o => o.status === 'processing').length || 0,
        completed: data?.filter(o => o.status === 'completed').length || 0,
        totalQuantity: data?.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0) || 0
      };
    },
    enabled: !!organization?.id
  });

  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['disposal-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, waste_type, quantity, unit, status, created_at,
          pickup_address, delivery_address, pickup_date, expected_delivery_date,
          notes, generator_notes, recycler_notes, waste_description, hazard_level,
          packaging_method, disposal_method, approved_at, collection_started_at,
          in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, driver_id,
          generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, representative_name),
          transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, representative_name),
          recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, representative_name),
          driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .eq('recycler_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (shipments || []) as unknown as RecentShipment[];
    },
    enabled: !!organization?.id
  });

  const recentShipments = shipmentsData || [];

  // Realtime subscription
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(getTabChannelName('disposal-ops-realtime'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disposal_operations', filter: `organization_id=eq.${organization.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['disposal-operations-stats'] });
          queryClient.invalidateQueries({ queryKey: ['disposal-recent-operations'] });
          queryClient.invalidateQueries({ queryKey: ['disposal-daily-operations'] });
          queryClient.invalidateQueries({ queryKey: ['disposal-processing-ops'] });
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disposal_incoming_requests' },
        () => { queryClient.invalidateQueries({ queryKey: ['disposal-incoming-pending'] }); }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `recycler_id=eq.${organization.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ['disposal-shipments'] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['disposal-operations-stats'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-facility'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-recent-operations'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-daily-operations'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-shipments'] });
  };

  const statsCards: StatCardItem[] = [
    { title: 'إجمالي العمليات', value: operationsStats?.total || 0, icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'شحنات واردة', value: recentShipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length, icon: Truck, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'قيد المعالجة', value: operationsStats?.processing || 0, icon: Clock, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'مكتملة', value: operationsStats?.completed || 0, icon: CheckCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'إجمالي الكميات', value: operationsStats?.totalQuantity?.toFixed(1) || '0', subtitle: 'طن', icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  ];

  const quickActions = useQuickActions({ type: 'disposal', handlers: {
    openDepositDialog: () => setShowDepositDialog(true),
    openSmartWeightUpload: () => setShowSmartWeightUpload(true),
  }});

  return (
    <div className="space-y-6" dir="rtl">
      <StoryCircles />


      {/* Mission Control Button */}
      <Button
        className="w-full gap-3 h-14 text-base bg-gradient-to-r from-destructive to-primary hover:opacity-90 shadow-lg"
        onClick={() => navigate('/dashboard/disposal/mission-control')}
      >
        <Shield className="w-5 h-5" />
        مركز القيادة — لوحة التحكم الشاملة
      </Button>

      <FacilityDashboardHeader
        userName={profile?.full_name || ''}
        orgName={organization?.name || ''}
        orgLabel="جهة التخلص النهائي"
        orgLogoUrl={organization?.logo_url}
        icon={Factory}
        iconGradient="from-destructive to-primary"
        facility={facility}
        onSmartWeightUpload={() => setShowSmartWeightUpload(true)}
        onRefresh={handleRefresh}
      />

      {facility && <FacilityCapacityCard facility={facility} />}
      <StatsCardsGrid stats={statsCards} isLoading={statsLoading} />
      <AutomationSettingsDialog organizationType="disposal" />

      {/* Main Tabs */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="operations" className="gap-1 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5" /> العمليات
          </TabsTrigger>
          <TabsTrigger value="shipments" className="gap-1 text-xs sm:text-sm">
            <Truck className="w-3.5 h-3.5" /> الشحنات الواردة
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1 text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5" /> الامتثال
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /> المستندات
          </TabsTrigger>
          <TabsTrigger value="fleet" className="gap-1 text-xs sm:text-sm">
            <Truck className="w-3.5 h-3.5" /> الأسطول
          </TabsTrigger>
          <TabsTrigger value="esg" className="gap-1 text-xs sm:text-sm">
            <Leaf className="w-3.5 h-3.5" /> تقارير ESG
          </TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-4 space-y-4">
          <DisposalDailyOperations />
          <OperationalAlertsWidget />
          <DisposalIncomingPanel facilityId={facility?.id} />
          <PendingApprovalsWidget />
          <QuickActionsGrid
            actions={quickActions}
            title="الإجراءات السريعة"
            subtitle="وظائف التخلص النهائي"
          />
          <DisposalRecentOperations />
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="mt-4 space-y-4">
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
                    onSuccess={handleRefresh}
                  />
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                    <Eye className="ml-2 h-4 w-4" />
                    عرض الكل
                  </Button>
                </div>
                <div className="text-right">
                  <CardTitle className="flex items-center gap-2 justify-end">
                    <Factory className="w-5 h-5" />
                    الشحنات الواردة للتخلص
                  </CardTitle>
                  <CardDescription>آخر 10 شحنات واردة إلى منشأة التخلص النهائي</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {shipmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : recentShipments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد شحنات واردة حتى الآن</p>
                  <CreateShipmentButton className="mt-4" onSuccess={handleRefresh} />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentShipments.map((shipment) => (
                    <ShipmentCard key={shipment.id} shipment={shipment} onStatusChange={handleRefresh} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg" />}>
            {organization?.id && <LicensedWasteTypesEditor organizationId={organization.id} />}
            <WMISEventsFeed />
          </Suspense>
          <LegalComplianceWidget />
          <IncidentReportManager />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <UnifiedDocumentSearch />
          <DriverCodeLookup />
        </TabsContent>

        {/* Fleet Tab */}
        <TabsContent value="fleet" className="mt-4 space-y-4">
          <VehicleComplianceManager />
          <DriverComplianceManager />
        </TabsContent>

        {/* ESG Tab */}
        <TabsContent value="esg" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <ESGReportPanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <EnhancedShipmentPrintView isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
    </div>
  );
};

export default DisposalDashboard;
