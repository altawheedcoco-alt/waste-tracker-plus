import { useState, useEffect } from 'react';
import { Factory, Package, Clock, CheckCircle, TrendingUp, Shield, Eye, AlertCircle, Truck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import FacilityDashboardHeader from '@/components/dashboard/shared/FacilityDashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
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
import DashboardWidgetCustomizer from '@/components/dashboard/DashboardWidgetCustomizer';
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

  // Fetch disposal facility linked to this organization
  const { data: facility } = useQuery({
    queryKey: ['disposal-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_facilities')
        .select('*')
        .eq('organization_id', organization.id)
        .single();
      return data;
    },
    enabled: !!organization?.id
  });

  // Fetch operations stats
  const { data: operationsStats, isLoading: statsLoading } = useQuery({
    queryKey: ['disposal-operations-stats', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('disposal_operations')
        .select('status, quantity')
        .eq('organization_id', organization.id);
      
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

  // Fetch recent shipments destined to this disposal facility
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
    { title: 'إجمالي العمليات', value: operationsStats?.total || 0, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'شحنات واردة', value: recentShipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length, icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { title: 'قيد المعالجة', value: operationsStats?.processing || 0, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    { title: 'مكتملة', value: operationsStats?.completed || 0, icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: 'إجمالي الكميات', value: operationsStats?.totalQuantity?.toFixed(1) || '0', subtitle: 'طن', icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
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
        className="w-full gap-3 h-14 text-base bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 shadow-lg"
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
        iconGradient="from-red-500 to-orange-600"
        facility={facility}
        onSmartWeightUpload={() => setShowSmartWeightUpload(true)}
        onRefresh={handleRefresh}
      />

      {facility && <FacilityCapacityCard facility={facility} />}

      <StatsCardsGrid stats={statsCards} isLoading={statsLoading} />

      {/* Automation Toggle */}
      <AutomationSettingsDialog organizationType="disposal" />

      <DisposalDailyOperations />
      <OperationalAlertsWidget />
      <UnifiedDocumentSearch />
      <DriverCodeLookup />
      <DisposalIncomingPanel facilityId={facility?.id} />
      <PendingApprovalsWidget />

      <QuickActionsGrid
        actions={quickActions}
        title="الإجراءات السريعة"
        subtitle="وظائف التخلص النهائي المستخدمة بكثرة"
      />

      {/* Recent Shipments - like recycler but with disposal naming */}
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

      <DisposalRecentOperations />

      {/* Legal Compliance */}
      <LegalComplianceWidget />
      <VehicleComplianceManager />
      <DriverComplianceManager />
      <IncidentReportManager />

      <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <EnhancedShipmentPrintView isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
    </div>
  );
};

export default DisposalDashboard;
