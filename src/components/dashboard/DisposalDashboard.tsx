import { useState, useEffect } from 'react';
import { Factory, Package, Clock, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import FacilityDashboardHeader from '@/components/dashboard/shared/FacilityDashboardHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import FacilityCapacityCard from '@/components/dashboard/shared/FacilityCapacityCard';
import StatsCardsGrid, { StatCardItem } from '@/components/dashboard/shared/StatsCardsGrid';
import DisposalIncomingPanel from '@/components/dashboard/disposal/DisposalIncomingPanel';
import DisposalDailyOperations from '@/components/dashboard/disposal/DisposalDailyOperations';
import DisposalRecentOperations from '@/components/dashboard/disposal/DisposalRecentOperations';
import OperationalAlertsWidget from '@/components/dashboard/operations/OperationalAlertsWidget';
import DriverCodeLookup from '@/components/drivers/DriverCodeLookup';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import SmartWeightUpload from '@/components/ai/SmartWeightUpload';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import StoryCircles from '@/components/stories/StoryCircles';

interface DisposalDashboardProps {
  embedded?: boolean;
}

const DisposalDashboard = ({ embedded = false }: DisposalDashboardProps) => {
  const { profile, organization } = useAuth();
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
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
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['disposal-operations-stats'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-facility'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-recent-operations'] });
    queryClient.invalidateQueries({ queryKey: ['disposal-daily-operations'] });
  };

  const statsCards: StatCardItem[] = [
    { title: 'إجمالي العمليات', value: operationsStats?.total || 0, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'قيد المعالجة', value: operationsStats?.processing || 0, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
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
      <DriverCodeLookup />
      <DisposalIncomingPanel facilityId={facility?.id} />
      <PendingApprovalsWidget />

      <QuickActionsGrid
        actions={quickActions}
        title="الإجراءات السريعة"
        subtitle="وظائف التخلص النهائي المستخدمة بكثرة"
      />

      <DisposalRecentOperations />

      <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
    </div>
  );
};

export default DisposalDashboard;
