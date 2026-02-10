import { useState, useEffect } from 'react';
import StoryCircles from '@/components/stories/StoryCircles';
import { Recycle, Package, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FacilityDashboardHeader from './shared/FacilityDashboardHeader';
import StatsCardsGrid, { StatCardItem } from './shared/StatsCardsGrid';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import CreateShipmentButton from './CreateShipmentButton';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import RecyclerBulkStatusDropdown from '@/components/shipments/RecyclerBulkStatusDropdown';
import RecyclerIncomingPanel from './recycler/RecyclerIncomingPanel';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import DailyOperationsSummary from './operations/DailyOperationsSummary';
import OperationalAlertsWidget from './operations/OperationalAlertsWidget';
import DriverCodeLookup from '@/components/drivers/DriverCodeLookup';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import { AlertCircle, Eye } from 'lucide-react';

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

const RecyclerDashboard = () => {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportShipment, setReportShipment] = useState<RecentShipment | null>(null);

  // Realtime subscription
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(getTabChannelName('recycler-shipments-realtime'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `recycler_id=eq.${organization.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recycler-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['recycler-incoming'] });
          queryClient.invalidateQueries({ queryKey: ['recycler-awaiting-confirm'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const { data: shipmentData, refetch: fetchDashboardData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['recycler-dashboard', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { shipments: [], stats: { total: 0, incoming: 0, processing: 0, completed: 0 } };

      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, waste_type, quantity, unit, status, created_at,
          pickup_address, delivery_address, pickup_date, expected_delivery_date,
          notes, generator_notes, recycler_notes, waste_description, hazard_level,
          packaging_method, disposal_method, approved_at, collection_started_at,
          in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, driver_id,
          generator:organizations!shipments_generator_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          transporter:organizations!shipments_transporter_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          recycler:organizations!shipments_recycler_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .eq('recycler_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const shipmentIds = shipments?.map(s => s.id) || [];
      const { data: reportsData } = await supabase
        .from('recycling_reports')
        .select('shipment_id')
        .in('shipment_id', shipmentIds);

      const reportedIds = new Set(reportsData?.map(r => r.shipment_id) || []);
      const enriched = (shipments || []).map(s => ({ ...s, has_report: reportedIds.has(s.id) }));

      return {
        shipments: enriched as unknown as RecentShipment[],
        stats: {
          total: enriched.length,
          incoming: enriched.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length,
          processing: enriched.filter(s => s.status === 'delivered').length,
          completed: enriched.filter(s => s.status === 'confirmed').length,
        }
      };
    },
    enabled: !!organization?.id,
  });

  const recentShipments = shipmentData?.shipments || [];
  const stats = shipmentData?.stats || { total: 0, incoming: 0, processing: 0, completed: 0 };

  const statCards: StatCardItem[] = [
    { title: 'إجمالي الشحنات', value: stats.total, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'شحنات واردة', value: stats.incoming, icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { title: 'قيد المعالجة', value: stats.processing, icon: Clock, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'مؤكدة', value: stats.completed, icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ];

  const handleRefresh = () => {
    fetchDashboardData();
    queryClient.invalidateQueries({ queryKey: ['recycler-incoming'] });
    queryClient.invalidateQueries({ queryKey: ['recycler-awaiting-confirm'] });
  };

  return (
    <div className="space-y-6">
      <StoryCircles />
      <FacilityDashboardHeader
        userName={profile?.full_name || ''}
        orgName={organization?.name || ''}
        orgLabel="الجهة المدورة"
        icon={Recycle}
        iconGradient="from-emerald-500 to-green-600"
        onSmartWeightUpload={() => setShowSmartWeightUpload(true)}
        onRefresh={handleRefresh}
      />

      <StatsCardsGrid stats={statCards} isLoading={shipmentsLoading} />

      <DailyOperationsSummary />
      <OperationalAlertsWidget />
      <DriverCodeLookup />
      <RecyclerIncomingPanel />
      <PendingApprovalsWidget />

      <QuickActionsGrid
        actions={useQuickActions({ type: 'recycler', handlers: {
          openDepositDialog: () => setShowDepositDialog(true),
          openSmartWeightUpload: () => setShowSmartWeightUpload(true),
        }})}
        title="الإجراءات السريعة"
        subtitle="وظائف التدوير المستخدمة بكثرة"
      />

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
                onSuccess={handleRefresh}
              />
              <RecyclerBulkStatusDropdown
                shipments={recentShipments.map(s => ({ id: s.id, status: s.status, created_at: s.created_at, waste_type: s.waste_type }))}
                onStatusChange={handleRefresh}
              />
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/shipments'}>
                <Eye className="ml-2 h-4 w-4" />
                عرض الكل
              </Button>
            </div>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Recycle className="w-5 h-5" />
                الشحنات الواردة
              </CardTitle>
              <CardDescription>آخر 10 شحنات واردة إلى منشأتك</CardDescription>
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

      {/* Dialogs */}
      <EnhancedShipmentPrintView isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
      <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      {reportShipment && (
        <RecyclingCertificateDialog
          isOpen={showReportDialog}
          onClose={() => { setShowReportDialog(false); setReportShipment(null); }}
          shipment={reportShipment as any}
        />
      )}
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
    </div>
  );
};

export default RecyclerDashboard;
