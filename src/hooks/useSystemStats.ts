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
      // Fetch all stats in parallel
      const [
        shipmentsResult,
        orgsResult,
        driversResult,
        contractsResult,
        approvalsResult,
        ticketsResult,
        usersResult,
        documentsResult,
        reportsResult,
      ] = await Promise.all([
        // Shipments stats
        supabase.from('shipments').select('status', { count: 'exact' }),
        // Organizations stats
        supabase.from('organizations').select('is_verified', { count: 'exact' }),
        // Drivers stats
        supabase.from('drivers').select('is_available', { count: 'exact' }),
        // Contracts stats
        supabase.from('contracts').select('status', { count: 'exact' }),
        // Pending approvals
        supabase.from('approval_requests').select('*', { count: 'exact' }).eq('status', 'pending'),
        // Support tickets
        supabase.from('support_tickets').select('status, satisfaction_rating'),
        // Users
        supabase.from('profiles').select('*', { count: 'exact' }),
        // Documents
        supabase.from('organization_documents').select('verification_status', { count: 'exact' }),
        // Recycling reports
        supabase.from('recycling_reports').select('*', { count: 'exact' }),
      ]);

      const shipments = shipmentsResult.data || [];
      const orgs = orgsResult.data || [];
      const drivers = driversResult.data || [];
      const contracts = contractsResult.data || [];
      const tickets = ticketsResult.data || [];

      // Calculate ticket ratings
      const ratedTickets = tickets.filter(t => t.satisfaction_rating !== null);
      const avgRating = ratedTickets.length > 0
        ? ratedTickets.reduce((acc, t) => acc + (t.satisfaction_rating || 0), 0) / ratedTickets.length
        : 0;

      return {
        totalShipments: shipmentsResult.count || 0,
        pendingShipments: shipments.filter(s => s.status === 'new' || s.status === 'approved').length,
        confirmedShipments: shipments.filter(s => s.status === 'confirmed').length,
        totalOrganizations: orgsResult.count || 0,
        verifiedOrganizations: orgs.filter(o => o.is_verified).length,
        totalDrivers: driversResult.count || 0,
        activeDrivers: drivers.filter(d => d.is_available).length,
        totalContracts: contractsResult.count || 0,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        pendingApprovals: approvalsResult.count || 0,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        avgTicketRating: Number(avgRating.toFixed(1)),
        totalUsers: usersResult.count || 0,
        totalDocuments: documentsResult.count || 0,
        pendingDocuments: (documentsResult.data || []).filter(d => d.verification_status === 'pending').length,
        totalRecyclingReports: reportsResult.count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
