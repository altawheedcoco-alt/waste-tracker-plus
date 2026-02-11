import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemStats {
  totalShipments: number;
  pendingShipments: number;
  confirmedShipments: number;
  totalOrganizations: number;
  verifiedOrganizations: number;
  totalDrivers: number;
  activeDrivers: number;
  totalContracts: number;
  activeContracts: number;
  pendingApprovals: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgTicketRating: number;
  totalUsers: number;
  totalDocuments: number;
  pendingDocuments: number;
  totalRecyclingReports: number;
}

export const useSystemStats = () => {
  return useQuery({
    queryKey: ['system-stats'],
    queryFn: async (): Promise<SystemStats> => {
      // Use head:true + count:'exact' for pure counts (no row data transferred)
      const [
        totalShipmentsRes,
        pendingShipmentsRes,
        confirmedShipmentsRes,
        totalOrgsRes,
        verifiedOrgsRes,
        totalDriversRes,
        activeDriversRes,
        totalContractsRes,
        activeContractsRes,
        pendingApprovalsRes,
        totalTicketsRes,
        openTicketsRes,
        resolvedTicketsRes,
        ratedTicketsRes,
        totalUsersRes,
        totalDocsRes,
        pendingDocsRes,
        totalReportsRes,
      ] = await Promise.all([
        supabase.from('shipments').select('*', { count: 'exact', head: true }),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).in('status', ['new', 'approved']),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('drivers').select('*', { count: 'exact', head: true }),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('contracts').select('*', { count: 'exact', head: true }),
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['resolved', 'closed']),
        // Only fetch rated tickets (minimal columns) for avg calculation
        supabase.from('support_tickets').select('satisfaction_rating').not('satisfaction_rating', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('organization_documents').select('*', { count: 'exact', head: true }),
        supabase.from('organization_documents').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('recycling_reports').select('*', { count: 'exact', head: true }),
      ]);

      // Calculate avg rating from only rated tickets
      const ratedTickets = ratedTicketsRes.data || [];
      const avgRating = ratedTickets.length > 0
        ? ratedTickets.reduce((acc, t) => acc + (t.satisfaction_rating || 0), 0) / ratedTickets.length
        : 0;

      return {
        totalShipments: totalShipmentsRes.count || 0,
        pendingShipments: pendingShipmentsRes.count || 0,
        confirmedShipments: confirmedShipmentsRes.count || 0,
        totalOrganizations: totalOrgsRes.count || 0,
        verifiedOrganizations: verifiedOrgsRes.count || 0,
        totalDrivers: totalDriversRes.count || 0,
        activeDrivers: activeDriversRes.count || 0,
        totalContracts: totalContractsRes.count || 0,
        activeContracts: activeContractsRes.count || 0,
        pendingApprovals: pendingApprovalsRes.count || 0,
        totalTickets: totalTicketsRes.count || 0,
        openTickets: openTicketsRes.count || 0,
        resolvedTickets: resolvedTicketsRes.count || 0,
        avgTicketRating: Number(avgRating.toFixed(1)),
        totalUsers: totalUsersRes.count || 0,
        totalDocuments: totalDocsRes.count || 0,
        pendingDocuments: pendingDocsRes.count || 0,
        totalRecyclingReports: totalReportsRes.count || 0,
      };
    },
    refetchInterval: 30000,
  });
};
