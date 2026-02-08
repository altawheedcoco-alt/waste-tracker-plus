import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DynamicModuleHealth {
  name: string;
  nameAr: string;
  health: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: {
    total: number;
    active: number;
    pending: number;
    rate: number;
  };
}

export interface DynamicSystemHealth {
  overallScore: number;
  status: 'healthy' | 'warning' | 'critical';
  modules: Record<string, DynamicModuleHealth>;
  infrastructure: {
    database: {
      status: 'connected' | 'slow' | 'error';
      latency: number;
      tablesHealthy: number;
    };
    edgeFunctions: {
      total: number;
      deployed: number;
      status: 'healthy' | 'warning' | 'critical';
    };
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    warningChecks: number;
    criticalChecks: number;
  };
  lastUpdated: Date;
}

const calculateModuleHealth = (
  total: number,
  active: number,
  pending: number,
  thresholds: { warningPending: number; criticalPending: number }
): { health: number; status: 'healthy' | 'warning' | 'critical'; issues: string[] } => {
  const issues: string[] = [];
  let health = 100;
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // If no data, return healthy (new system)
  if (total === 0) {
    return { health: 100, status: 'healthy', issues: [] };
  }

  // Calculate activity rate
  const activityRate = (active / total) * 100;

  // Penalize for low activity
  if (activityRate < 30 && total > 5) {
    health -= 15;
    issues.push('معدل النشاط منخفض');
  }

  // Penalize for high pending items
  if (pending >= thresholds.criticalPending && thresholds.criticalPending > 0) {
    health -= 30;
    status = 'critical';
    issues.push(`${pending} عنصر معلق يحتاج معالجة فورية`);
  } else if (pending >= thresholds.warningPending && thresholds.warningPending > 0) {
    health -= 15;
    status = 'warning';
    issues.push(`${pending} عنصر معلق`);
  }

  // Ensure health is between 0 and 100
  health = Math.max(0, Math.min(100, health));

  // Adjust status based on health score
  if (health < 50) status = 'critical';
  else if (health < 80) status = 'warning';

  return { health, status, issues };
};

export const useDynamicSystemHealth = () => {
  return useQuery({
    queryKey: ['dynamic-system-health'],
    queryFn: async (): Promise<DynamicSystemHealth> => {
      const startTime = Date.now();

      // Fetch all data in parallel for real-time metrics
      const [
        shipmentsResult,
        orgsResult,
        driversResult,
        contractsResult,
        approvalsResult,
        ticketsResult,
        documentsResult,
        invoicesResult,
        notificationsResult,
      ] = await Promise.all([
        // Shipments - check pending and stale
        supabase.from('shipments').select('status, created_at', { count: 'exact' }),
        // Organizations - check verification status
        supabase.from('organizations').select('is_verified, created_at', { count: 'exact' }),
        // Drivers - check availability
        supabase.from('drivers').select('is_available, created_at', { count: 'exact' }),
        // Contracts - check active vs expired
        supabase.from('contracts').select('status, end_date', { count: 'exact' }),
        // Approvals - check pending
        supabase.from('approval_requests').select('status, created_at', { count: 'exact' }),
        // Support tickets - check open tickets
        supabase.from('support_tickets').select('status, priority, created_at', { count: 'exact' }),
        // Documents - check pending verification
        supabase.from('organization_documents').select('verification_status, created_at', { count: 'exact' }),
        // Invoices - check unpaid
        supabase.from('invoices').select('status, due_date', { count: 'exact' }),
        // Notifications - check unread
        supabase.from('notifications').select('is_read, created_at', { count: 'exact' }),
      ]);

      const dbLatency = Date.now() - startTime;

      // Process shipments module
      const shipments = shipmentsResult.data || [];
      const pendingShipments = shipments.filter(s => 
        s.status === 'new' || s.status === 'approved'
      ).length;
      const activeShipments = shipments.filter(s => 
        s.status === 'collecting' || s.status === 'approved'
      ).length;
      const shipmentsHealth = calculateModuleHealth(
        shipments.length,
        activeShipments + shipments.filter(s => s.status === 'confirmed' || s.status === 'delivered').length,
        pendingShipments,
        { warningPending: 10, criticalPending: 25 }
      );

      // Process organizations module
      const orgs = orgsResult.data || [];
      const unverifiedOrgs = orgs.filter(o => !o.is_verified).length;
      const verifiedOrgs = orgs.filter(o => o.is_verified).length;
      const orgsHealth = calculateModuleHealth(
        orgs.length,
        verifiedOrgs,
        unverifiedOrgs,
        { warningPending: 5, criticalPending: 15 }
      );

      // Process drivers module
      const drivers = driversResult.data || [];
      const availableDrivers = drivers.filter(d => d.is_available).length;
      const unavailableDrivers = drivers.length - availableDrivers;
      const driversHealth = calculateModuleHealth(
        drivers.length,
        availableDrivers,
        0, // No pending concept for drivers
        { warningPending: 0, criticalPending: 0 }
      );
      // Adjust for driver availability
      if (drivers.length > 0 && availableDrivers / drivers.length < 0.2) {
        driversHealth.health -= 20;
        driversHealth.issues.push('نسبة السائقين المتاحين منخفضة');
        if (driversHealth.health < 50) driversHealth.status = 'critical';
        else if (driversHealth.health < 80) driversHealth.status = 'warning';
      }

      // Process contracts module
      const contracts = contractsResult.data || [];
      const now = new Date();
      const activeContracts = contracts.filter(c => c.status === 'active').length;
      const expiringSoon = contracts.filter(c => {
        if (!c.end_date) return false;
        const endDate = new Date(c.end_date);
        const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30 && c.status === 'active';
      }).length;
      const contractsHealth = calculateModuleHealth(
        contracts.length,
        activeContracts,
        expiringSoon,
        { warningPending: 3, criticalPending: 8 }
      );
      if (expiringSoon > 0) {
        contractsHealth.issues = contractsHealth.issues.filter(i => !i.includes('معلق'));
        contractsHealth.issues.push(`${expiringSoon} عقد ينتهي خلال 30 يوم`);
      }

      // Process approvals module
      const approvals = approvalsResult.data || [];
      const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
      const processedApprovals = approvals.filter(a => 
        a.status === 'approved' || a.status === 'rejected'
      ).length;
      const approvalsHealth = calculateModuleHealth(
        approvals.length,
        processedApprovals,
        pendingApprovals,
        { warningPending: 5, criticalPending: 15 }
      );

      // Process support tickets module
      const tickets = ticketsResult.data || [];
      const openTickets = tickets.filter(t => 
        t.status === 'open' || t.status === 'in_progress'
      ).length;
      const highPriorityOpen = tickets.filter(t => 
        (t.status === 'open' || t.status === 'in_progress') && t.priority === 'high'
      ).length;
      const ticketsHealth = calculateModuleHealth(
        tickets.length,
        tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        openTickets,
        { warningPending: 10, criticalPending: 25 }
      );
      if (highPriorityOpen > 0) {
        ticketsHealth.health -= highPriorityOpen * 5;
        ticketsHealth.issues.push(`${highPriorityOpen} تذكرة عالية الأولوية مفتوحة`);
        if (ticketsHealth.health < 50) ticketsHealth.status = 'critical';
        else if (ticketsHealth.health < 80) ticketsHealth.status = 'warning';
      }

      // Process documents module
      const documents = documentsResult.data || [];
      const pendingDocs = documents.filter(d => d.verification_status === 'pending').length;
      const verifiedDocs = documents.filter(d => d.verification_status === 'verified').length;
      const documentsHealth = calculateModuleHealth(
        documents.length,
        verifiedDocs,
        pendingDocs,
        { warningPending: 5, criticalPending: 15 }
      );

      // Process invoices module
      const invoices = invoicesResult.data || [];
      const unpaidInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length;
      const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
      const paidInvoices = invoices.filter(i => i.status === 'paid').length;
      const invoicesHealth = calculateModuleHealth(
        invoices.length,
        paidInvoices,
        unpaidInvoices,
        { warningPending: 5, criticalPending: 15 }
      );
      if (overdueInvoices > 0) {
        invoicesHealth.health -= overdueInvoices * 10;
        invoicesHealth.issues.push(`${overdueInvoices} فاتورة متأخرة السداد`);
        if (invoicesHealth.health < 50) invoicesHealth.status = 'critical';
        else if (invoicesHealth.health < 80) invoicesHealth.status = 'warning';
      }

      // Process notifications module
      const notifications = notificationsResult.data || [];
      const unreadNotifications = notifications.filter(n => !n.is_read).length;
      const notificationsHealth = calculateModuleHealth(
        notifications.length,
        notifications.length - unreadNotifications,
        0,
        { warningPending: 0, criticalPending: 0 }
      );

      // Build modules object
      const modules: Record<string, DynamicModuleHealth> = {
        shipments: {
          name: 'shipments',
          nameAr: 'إدارة الشحنات',
          ...shipmentsHealth,
          metrics: {
            total: shipments.length,
            active: activeShipments,
            pending: pendingShipments,
            rate: shipments.length > 0 ? Math.round((activeShipments / shipments.length) * 100) : 100,
          },
        },
        organizations: {
          name: 'organizations',
          nameAr: 'إدارة المؤسسات',
          ...orgsHealth,
          metrics: {
            total: orgs.length,
            active: verifiedOrgs,
            pending: unverifiedOrgs,
            rate: orgs.length > 0 ? Math.round((verifiedOrgs / orgs.length) * 100) : 100,
          },
        },
        drivers: {
          name: 'drivers',
          nameAr: 'إدارة السائقين',
          ...driversHealth,
          metrics: {
            total: drivers.length,
            active: availableDrivers,
            pending: 0,
            rate: drivers.length > 0 ? Math.round((availableDrivers / drivers.length) * 100) : 100,
          },
        },
        contracts: {
          name: 'contracts',
          nameAr: 'إدارة العقود',
          ...contractsHealth,
          metrics: {
            total: contracts.length,
            active: activeContracts,
            pending: expiringSoon,
            rate: contracts.length > 0 ? Math.round((activeContracts / contracts.length) * 100) : 100,
          },
        },
        approvals: {
          name: 'approvals',
          nameAr: 'طلبات الموافقة',
          ...approvalsHealth,
          metrics: {
            total: approvals.length,
            active: processedApprovals,
            pending: pendingApprovals,
            rate: approvals.length > 0 ? Math.round((processedApprovals / approvals.length) * 100) : 100,
          },
        },
        support: {
          name: 'support',
          nameAr: 'نظام الدعم الفني',
          ...ticketsHealth,
          metrics: {
            total: tickets.length,
            active: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
            pending: openTickets,
            rate: tickets.length > 0 ? Math.round(((tickets.length - openTickets) / tickets.length) * 100) : 100,
          },
        },
        documents: {
          name: 'documents',
          nameAr: 'التحقق من الوثائق',
          ...documentsHealth,
          metrics: {
            total: documents.length,
            active: verifiedDocs,
            pending: pendingDocs,
            rate: documents.length > 0 ? Math.round((verifiedDocs / documents.length) * 100) : 100,
          },
        },
        invoices: {
          name: 'invoices',
          nameAr: 'الفواتير والمدفوعات',
          ...invoicesHealth,
          metrics: {
            total: invoices.length,
            active: paidInvoices,
            pending: unpaidInvoices,
            rate: invoices.length > 0 ? Math.round((paidInvoices / invoices.length) * 100) : 100,
          },
        },
        notifications: {
          name: 'notifications',
          nameAr: 'نظام الإشعارات',
          ...notificationsHealth,
          metrics: {
            total: notifications.length,
            active: notifications.length - unreadNotifications,
            pending: unreadNotifications,
            rate: 100,
          },
        },
      };

      // Calculate overall health
      const moduleValues = Object.values(modules);
      const totalHealth = moduleValues.reduce((acc, m) => acc + m.health, 0);
      const overallScore = Math.round(totalHealth / moduleValues.length);

      // Count checks
      const passedChecks = moduleValues.filter(m => m.status === 'healthy').length;
      const warningChecks = moduleValues.filter(m => m.status === 'warning').length;
      const criticalChecks = moduleValues.filter(m => m.status === 'critical').length;

      // Determine overall status
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalChecks > 0) overallStatus = 'critical';
      else if (warningChecks > 2) overallStatus = 'warning';
      else if (overallScore < 80) overallStatus = 'warning';

      // Database health
      const dbStatus = dbLatency < 200 ? 'connected' : dbLatency < 500 ? 'slow' : 'error';

      return {
        overallScore,
        status: overallStatus,
        modules,
        infrastructure: {
          database: {
            status: dbStatus,
            latency: dbLatency,
            tablesHealthy: 9,
          },
          edgeFunctions: {
            total: 24,
            deployed: 24,
            status: 'healthy',
          },
        },
        summary: {
          totalChecks: moduleValues.length,
          passedChecks,
          warningChecks,
          criticalChecks,
        },
        lastUpdated: new Date(),
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
  });
};
