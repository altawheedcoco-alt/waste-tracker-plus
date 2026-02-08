import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export interface SupportStats {
  totalCalls: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  satisfactionRate: number;
}

export interface CallsByDirection {
  inbound: number;
  outbound: number;
}

export interface TicketsByStatus {
  open: number;
  in_progress: number;
  waiting_response: number;
  resolved: number;
  closed: number;
}

export interface TicketsByPriority {
  low: number;
  medium: number;
  high: number;
  urgent: number;
}

export interface DailyTrend {
  date: string;
  calls: number;
  tickets: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export function useSupportAnalytics(dateRange: { start: Date; end: Date }) {
  const { organization, roles } = useAuth();
  const isAdmin = roles.includes('admin');

  // Fetch call statistics
  const callsQuery = useQuery({
    queryKey: ['support-calls', organization?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      let query = supabase
        .from('call_logs')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!isAdmin && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id || isAdmin,
  });

  // Fetch ticket statistics
  const ticketsQuery = useQuery({
    queryKey: ['support-tickets-analytics', organization?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (!isAdmin && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id || isAdmin,
  });

  // Calculate statistics
  const stats: SupportStats = {
    totalCalls: callsQuery.data?.length || 0,
    totalTickets: ticketsQuery.data?.length || 0,
    openTickets: ticketsQuery.data?.filter(t => t.status === 'open').length || 0,
    resolvedTickets: ticketsQuery.data?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0,
    avgResponseTime: 0, // Would need first_response_at tracking
    satisfactionRate: ticketsQuery.data?.filter(t => t.satisfaction_rating && t.satisfaction_rating >= 4).length 
      / Math.max(ticketsQuery.data?.filter(t => t.satisfaction_rating).length || 1, 1) * 100 || 0,
  };

  // Calls by direction
  const callsByDirection: CallsByDirection = {
    inbound: callsQuery.data?.filter(c => c.direction === 'inbound').length || 0,
    outbound: callsQuery.data?.filter(c => c.direction === 'outbound').length || 0,
  };

  // Tickets by status
  const ticketsByStatus: TicketsByStatus = {
    open: ticketsQuery.data?.filter(t => t.status === 'open').length || 0,
    in_progress: ticketsQuery.data?.filter(t => t.status === 'in_progress').length || 0,
    waiting_response: ticketsQuery.data?.filter(t => t.status === 'waiting_response').length || 0,
    resolved: ticketsQuery.data?.filter(t => t.status === 'resolved').length || 0,
    closed: ticketsQuery.data?.filter(t => t.status === 'closed').length || 0,
  };

  // Tickets by priority
  const ticketsByPriority: TicketsByPriority = {
    low: ticketsQuery.data?.filter(t => t.priority === 'low').length || 0,
    medium: ticketsQuery.data?.filter(t => t.priority === 'medium').length || 0,
    high: ticketsQuery.data?.filter(t => t.priority === 'high').length || 0,
    urgent: ticketsQuery.data?.filter(t => t.priority === 'urgent').length || 0,
  };

  // Daily trends
  const dailyTrends: DailyTrend[] = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  }).map(date => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    return {
      date: format(date, 'MM/dd'),
      calls: callsQuery.data?.filter(c => {
        const callDate = new Date(c.created_at);
        return callDate >= dayStart && callDate <= dayEnd;
      }).length || 0,
      tickets: ticketsQuery.data?.filter(t => {
        const ticketDate = new Date(t.created_at);
        return ticketDate >= dayStart && ticketDate <= dayEnd;
      }).length || 0,
    };
  });

  // Category distribution (from call analysis tags)
  const categoryMap = new Map<string, number>();
  callsQuery.data?.forEach(call => {
    if (call.tags && Array.isArray(call.tags)) {
      call.tags.forEach((tag: string) => {
        categoryMap.set(tag, (categoryMap.get(tag) || 0) + 1);
      });
    }
  });

  const categoryDistribution: CategoryDistribution[] = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    stats,
    callsByDirection,
    ticketsByStatus,
    ticketsByPriority,
    dailyTrends,
    categoryDistribution,
    isLoading: callsQuery.isLoading || ticketsQuery.isLoading,
    error: callsQuery.error || ticketsQuery.error,
    refetch: () => {
      callsQuery.refetch();
      ticketsQuery.refetch();
    },
  };
}
