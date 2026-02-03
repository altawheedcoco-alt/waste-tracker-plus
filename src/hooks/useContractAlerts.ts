import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, parseISO, addDays } from 'date-fns';

interface ContractAlert {
  id: string;
  title: string;
  contractNumber: string;
  endDate: string;
  daysRemaining: number;
  status: 'expiring_soon' | 'expired' | 'active';
  partnerName: string | null;
}

interface UseContractAlertsOptions {
  organizationId: string | null;
  alertDays?: number; // Days before expiry to start alerting
  enabled?: boolean;
}

export const useContractAlerts = ({
  organizationId,
  alertDays = 30,
  enabled = true
}: UseContractAlertsOptions) => {
  const {
    data: alerts = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['contract-alerts', organizationId, alertDays],
    queryFn: async () => {
      if (!organizationId) return [];

      const today = new Date();
      const alertDate = addDays(today, alertDays);

      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          title,
          contract_number,
          end_date,
          status,
          partner_name,
          partner_organization:partner_organization_id(name)
        `)
        .eq('organization_id', organizationId)
        .not('end_date', 'is', null)
        .lte('end_date', alertDate.toISOString())
        .in('status', ['active', 'pending'])
        .order('end_date', { ascending: true });

      if (error) throw error;

      return (contracts || []).map(contract => {
        const endDate = parseISO(contract.end_date!);
        const daysRemaining = differenceInDays(endDate, today);
        
        let status: ContractAlert['status'] = 'active';
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= alertDays) {
          status = 'expiring_soon';
        }

        return {
          id: contract.id,
          title: contract.title,
          contractNumber: contract.contract_number,
          endDate: contract.end_date!,
          daysRemaining,
          status,
          partnerName: contract.partner_name || 
            (contract.partner_organization as any)?.name || null
        };
      }) as ContractAlert[];
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  // Show toast notifications for expiring contracts
  const showExpiryNotifications = useCallback(() => {
    const expiringContracts = alerts.filter(a => a.status === 'expiring_soon');
    const expiredContracts = alerts.filter(a => a.status === 'expired');

    if (expiredContracts.length > 0) {
      toast.error(
        `لديك ${expiredContracts.length} عقد/عقود منتهية الصلاحية`,
        {
          description: 'يرجى مراجعة العقود وتجديدها',
          duration: 8000,
        }
      );
    }

    if (expiringContracts.length > 0) {
      toast.warning(
        `لديك ${expiringContracts.length} عقد/عقود تنتهي قريباً`,
        {
          description: `خلال ${alertDays} يوم`,
          duration: 6000,
        }
      );
    }
  }, [alerts, alertDays]);

  // Get summary statistics
  const summary = {
    total: alerts.length,
    expiringSoon: alerts.filter(a => a.status === 'expiring_soon').length,
    expired: alerts.filter(a => a.status === 'expired').length,
    critical: alerts.filter(a => a.daysRemaining <= 7 && a.daysRemaining >= 0).length,
  };

  // Get contracts by urgency
  const getContractsByUrgency = useCallback(() => {
    return {
      critical: alerts.filter(a => a.daysRemaining <= 7 && a.daysRemaining >= 0),
      warning: alerts.filter(a => a.daysRemaining > 7 && a.daysRemaining <= 14),
      notice: alerts.filter(a => a.daysRemaining > 14),
      expired: alerts.filter(a => a.daysRemaining < 0),
    };
  }, [alerts]);

  return {
    alerts,
    summary,
    isLoading,
    refetch,
    showExpiryNotifications,
    getContractsByUrgency,
  };
};
