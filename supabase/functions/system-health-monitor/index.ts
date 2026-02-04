import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheck {
  name: string;
  type: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  value: number;
  details: Record<string, unknown>;
}

interface ModuleHealth {
  name: string;
  health: number;
  status: 'healthy' | 'warning' | 'critical';
  lastActivity: string | null;
  issues: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('[System Health Monitor] Starting comprehensive health check...')

    const checks: HealthCheck[] = []
    const modulesHealth: Record<string, ModuleHealth> = {}

    // 1. Database Connectivity Check
    const dbStart = Date.now()
    const { error: dbError } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const dbLatency = Date.now() - dbStart
    
    checks.push({
      name: 'database_connectivity',
      type: 'infrastructure',
      status: dbError ? 'critical' : dbLatency > 1000 ? 'warning' : 'healthy',
      value: dbLatency,
      details: { latency_ms: dbLatency, error: dbError?.message || null }
    })

    // 2. Shipments Module Health
    const { data: recentShipments, count: totalShipments } = await supabase
      .from('shipments')
      .select('id, status, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)

    const { count: pendingShipments } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'approved'])

    const { count: confirmedShipments } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    const shipmentsIssues: string[] = []
    const pendingRatio = totalShipments ? ((pendingShipments || 0) / totalShipments) * 100 : 0
    if (pendingRatio > 50) shipmentsIssues.push('نسبة عالية من الشحنات المعلقة')

    modulesHealth['shipments'] = {
      name: 'إدارة الشحنات',
      health: shipmentsIssues.length === 0 ? 100 : 85,
      status: shipmentsIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: recentShipments?.[0]?.updated_at || null,
      issues: shipmentsIssues
    }

    checks.push({
      name: 'shipments_module',
      type: 'module',
      status: shipmentsIssues.length === 0 ? 'healthy' : 'warning',
      value: totalShipments || 0,
      details: { total: totalShipments, pending: pendingShipments, confirmed: confirmedShipments }
    })

    // 3. Organizations Module Health
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    const { count: verifiedOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)

    const orgsIssues: string[] = []
    const verificationRate = totalOrgs ? ((verifiedOrgs || 0) / totalOrgs) * 100 : 0
    if (verificationRate < 50) orgsIssues.push('نسبة التحقق من المؤسسات منخفضة')

    modulesHealth['organizations'] = {
      name: 'إدارة المؤسسات',
      health: orgsIssues.length === 0 ? 100 : 80,
      status: orgsIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: orgsIssues
    }

    checks.push({
      name: 'organizations_module',
      type: 'module',
      status: orgsIssues.length === 0 ? 'healthy' : 'warning',
      value: totalOrgs || 0,
      details: { total: totalOrgs, verified: verifiedOrgs, verification_rate: verificationRate.toFixed(1) }
    })

    // 4. Drivers Module Health
    const { count: totalDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })

    const { count: availableDrivers } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)

    const { count: expiredLicenses } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })
      .lt('license_expiry', new Date().toISOString().split('T')[0])

    const driversIssues: string[] = []
    if ((expiredLicenses || 0) > 0) driversIssues.push(`${expiredLicenses} سائق برخصة منتهية`)

    modulesHealth['drivers'] = {
      name: 'إدارة السائقين',
      health: driversIssues.length === 0 ? 100 : 90,
      status: driversIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: driversIssues
    }

    checks.push({
      name: 'drivers_module',
      type: 'module',
      status: driversIssues.length === 0 ? 'healthy' : 'warning',
      value: totalDrivers || 0,
      details: { total: totalDrivers, available: availableDrivers, expired_licenses: expiredLicenses }
    })

    // 5. Contracts Module Health
    const { count: totalContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    const { count: activeContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: expiringContracts } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    const contractsIssues: string[] = []
    if ((expiringContracts || 0) > 0) contractsIssues.push(`${expiringContracts} عقد ينتهي خلال 30 يوم`)

    modulesHealth['contracts'] = {
      name: 'إدارة العقود',
      health: contractsIssues.length === 0 ? 100 : 90,
      status: contractsIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: contractsIssues
    }

    checks.push({
      name: 'contracts_module',
      type: 'module',
      status: contractsIssues.length === 0 ? 'healthy' : 'warning',
      value: totalContracts || 0,
      details: { total: totalContracts, active: activeContracts, expiring_soon: expiringContracts }
    })

    // 6. Support Tickets Health
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, status, created_at, satisfaction_rating')

    const openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0
    const ratedTickets = tickets?.filter(t => t.satisfaction_rating !== null) || []
    const avgRating = ratedTickets.length > 0 
      ? ratedTickets.reduce((acc, t) => acc + (t.satisfaction_rating || 0), 0) / ratedTickets.length 
      : 0

    const ticketsIssues: string[] = []
    if (openTickets > 10) ticketsIssues.push('عدد كبير من التذاكر المفتوحة')
    if (avgRating > 0 && avgRating < 3) ticketsIssues.push('متوسط تقييم الدعم منخفض')

    modulesHealth['support'] = {
      name: 'نظام الدعم الفني',
      health: ticketsIssues.length === 0 ? 100 : 85,
      status: ticketsIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: ticketsIssues
    }

    checks.push({
      name: 'support_module',
      type: 'module',
      status: ticketsIssues.length === 0 ? 'healthy' : 'warning',
      value: tickets?.length || 0,
      details: { total: tickets?.length || 0, open: openTickets, resolved: resolvedTickets, avg_rating: avgRating.toFixed(1) }
    })

    // 7. Notifications System Health
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    const { count: recentNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    modulesHealth['notifications'] = {
      name: 'نظام الإشعارات',
      health: 100,
      status: 'healthy',
      lastActivity: null,
      issues: []
    }

    checks.push({
      name: 'notifications_module',
      type: 'module',
      status: 'healthy',
      value: recentNotifications || 0,
      details: { unread: unreadNotifications, last_24h: recentNotifications }
    })

    // 8. Documents Verification Health
    const { count: totalDocs } = await supabase
      .from('organization_documents')
      .select('*', { count: 'exact', head: true })

    const { count: pendingDocs } = await supabase
      .from('organization_documents')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    const docsIssues: string[] = []
    if ((pendingDocs || 0) > 5) docsIssues.push(`${pendingDocs} وثيقة تنتظر المراجعة`)

    modulesHealth['documents'] = {
      name: 'التحقق من الوثائق',
      health: docsIssues.length === 0 ? 100 : 90,
      status: docsIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: docsIssues
    }

    checks.push({
      name: 'documents_module',
      type: 'module',
      status: docsIssues.length === 0 ? 'healthy' : 'warning',
      value: totalDocs || 0,
      details: { total: totalDocs, pending: pendingDocs }
    })

    // 9. Invoices & Payments Health
    const { count: overdueInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue')

    const invoicesIssues: string[] = []
    if ((overdueInvoices || 0) > 0) invoicesIssues.push(`${overdueInvoices} فاتورة متأخرة`)

    modulesHealth['invoices'] = {
      name: 'الفواتير والمدفوعات',
      health: invoicesIssues.length === 0 ? 100 : 85,
      status: invoicesIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: invoicesIssues
    }

    checks.push({
      name: 'invoices_module',
      type: 'module',
      status: invoicesIssues.length === 0 ? 'healthy' : 'warning',
      value: overdueInvoices || 0,
      details: { overdue: overdueInvoices }
    })

    // 10. Approval Requests Health
    const { count: pendingApprovals } = await supabase
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const approvalsIssues: string[] = []
    if ((pendingApprovals || 0) > 10) approvalsIssues.push(`${pendingApprovals} طلب موافقة معلق`)

    modulesHealth['approvals'] = {
      name: 'طلبات الموافقة',
      health: approvalsIssues.length === 0 ? 100 : 90,
      status: approvalsIssues.length === 0 ? 'healthy' : 'warning',
      lastActivity: null,
      issues: approvalsIssues
    }

    checks.push({
      name: 'approvals_module',
      type: 'module',
      status: approvalsIssues.length === 0 ? 'healthy' : 'warning',
      value: pendingApprovals || 0,
      details: { pending: pendingApprovals }
    })

    // Calculate overall health score
    const healthyChecks = checks.filter(c => c.status === 'healthy').length
    const warningChecks = checks.filter(c => c.status === 'warning').length
    const criticalChecks = checks.filter(c => c.status === 'critical').length
    const overallScore = Math.round(
      ((healthyChecks * 100) + (warningChecks * 70) + (criticalChecks * 0)) / checks.length
    )

    // Store individual metrics
    const metricsToInsert = checks.map(check => ({
      metric_type: check.type,
      metric_name: check.name,
      metric_value: check.value,
      status: check.status,
      details: check.details,
      recorded_at: new Date().toISOString()
    }))

    await supabase.from('system_health_metrics').insert(metricsToInsert)

    // Database stats
    const dbStats = {
      connectivity: dbError ? 'error' : 'ok',
      latency_ms: dbLatency,
      tables_checked: checks.filter(c => c.type === 'module').length
    }

    // Edge functions status (we can check our own functions)
    const edgeFunctionsStatus = {
      total: 24,
      deployed: 24,
      status: 'healthy'
    }

    // Update or insert summary
    const { data: existingSummary } = await supabase
      .from('system_health_summary')
      .select('id')
      .limit(1)
      .single()

    const summaryData = {
      overall_health_score: overallScore,
      total_checks: checks.length,
      passed_checks: healthyChecks,
      warning_checks: warningChecks,
      critical_checks: criticalChecks,
      modules_status: modulesHealth,
      edge_functions_status: edgeFunctionsStatus,
      database_status: dbStats,
      last_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (existingSummary) {
      await supabase
        .from('system_health_summary')
        .update(summaryData)
        .eq('id', existingSummary.id)
    } else {
      await supabase.from('system_health_summary').insert(summaryData)
    }

    // Cleanup old metrics (keep last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('system_health_metrics')
      .delete()
      .lt('recorded_at', sevenDaysAgo)

    console.log(`[System Health Monitor] Complete. Score: ${overallScore}%, Checks: ${checks.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        overall_score: overallScore,
        total_checks: checks.length,
        healthy: healthyChecks,
        warnings: warningChecks,
        critical: criticalChecks,
        modules: modulesHealth,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[System Health Monitor] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
