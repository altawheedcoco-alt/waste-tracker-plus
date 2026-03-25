import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...data } = await req.json()
    console.log(`[Analytics Engine] Action: ${action}, User: ${user.id}`)

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, organizations(organization_type)')
      .eq('user_id', user.id)
      .single()

    const organizationId = profile?.organization_id

    switch (action) {
      case 'dashboard-summary': {
        const { period = '30d' } = data
        
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
        const days = daysMap[period] || 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Shipments stats
        const { data: shipments, count: totalShipments } = await supabase
          .from('shipments')
          .select('*', { count: 'exact' })
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', startDate.toISOString())

        const statusCounts = (shipments || []).reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const totalWeight = (shipments || []).reduce((sum, s) => sum + (s.actual_weight || s.weight || 0), 0)

        // Waste type distribution
        const wasteTypeCounts = (shipments || []).reduce((acc, s) => {
          const wt = s.waste_type || 'غير محدد'
          acc[wt] = (acc[wt] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Partners count
        const { count: partnersCount } = await supabase
          .from('organization_partners')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)

        // Contracts count
        const { count: activeContracts } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'active')

        return new Response(
          JSON.stringify({
            success: true,
            period,
            summary: {
              total_shipments: totalShipments || 0,
              total_weight_tons: +(totalWeight / 1000).toFixed(2),
              status_distribution: statusCounts,
              waste_type_distribution: wasteTypeCounts,
              active_partners: partnersCount || 0,
              active_contracts: activeContracts || 0,
              completion_rate: totalShipments 
                ? +((statusCounts['confirmed'] || 0) / totalShipments * 100).toFixed(1) 
                : 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'performance-trends': {
        const { period = '30d', metric = 'shipments' } = data
        
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
        const days = daysMap[period] || 30

        const trends: { date: string; value: number }[] = []
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)

          const { count } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
            .gte('created_at', dateStr)
            .lt('created_at', nextDate.toISOString().split('T')[0])

          trends.push({ date: dateStr, value: count || 0 })
        }

        // Calculate trend direction
        const firstHalf = trends.slice(0, Math.floor(trends.length / 2))
        const secondHalf = trends.slice(Math.floor(trends.length / 2))
        const firstAvg = firstHalf.reduce((s, t) => s + t.value, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((s, t) => s + t.value, 0) / secondHalf.length
        const trendDirection = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable'
        const trendPercent = firstAvg > 0 ? +(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1) : 0

        return new Response(
          JSON.stringify({
            success: true,
            metric,
            period,
            trends,
            analysis: {
              direction: trendDirection,
              change_percent: trendPercent,
              total: trends.reduce((s, t) => s + t.value, 0),
              average: +(trends.reduce((s, t) => s + t.value, 0) / trends.length).toFixed(1)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'partner-performance': {
        const { partner_id, period = '30d' } = data
        
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
        const days = daysMap[period] || 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get shipments with this partner
        let query = supabase
          .from('shipments')
          .select('*')
          .gte('created_at', startDate.toISOString())

        if (partner_id) {
          query = query.or(`generator_id.eq.${partner_id},transporter_id.eq.${partner_id},recycler_id.eq.${partner_id}`)
        }

        const { data: shipments } = await query

        // Calculate metrics
        const totalShipments = shipments?.length || 0
        const completedShipments = (shipments || []).filter(s => s.status === 'confirmed').length
        const onTimeDeliveries = (shipments || []).filter(s => {
          if (s.status !== 'confirmed' || !s.confirmed_at || !s.created_at) return false
          const deliveryTime = new Date(s.confirmed_at).getTime() - new Date(s.created_at).getTime()
          const maxTime = 48 * 60 * 60 * 1000 // 48 hours
          return deliveryTime <= maxTime
        }).length

        const totalWeight = (shipments || []).reduce((sum, s) => sum + (s.actual_weight || s.weight || 0), 0)

        return new Response(
          JSON.stringify({
            success: true,
            partner_id,
            period,
            performance: {
              total_shipments: totalShipments,
              completed_shipments: completedShipments,
              completion_rate: totalShipments ? +((completedShipments / totalShipments) * 100).toFixed(1) : 0,
              on_time_rate: completedShipments ? +((onTimeDeliveries / completedShipments) * 100).toFixed(1) : 0,
              total_weight_kg: totalWeight,
              avg_weight_per_shipment: totalShipments ? +(totalWeight / totalShipments).toFixed(1) : 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'waste-analytics': {
        const { period = '30d' } = data
        
        const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }
        const days = daysMap[period] || 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const { data: shipments } = await supabase
          .from('shipments')
          .select('waste_type, actual_weight, weight, status, created_at')
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', startDate.toISOString())

        // Group by waste type
        const wasteTypeStats = (shipments || []).reduce((acc, s) => {
          const wt = s.waste_type || 'غير محدد'
          if (!acc[wt]) {
            acc[wt] = { count: 0, weight: 0, confirmed: 0 }
          }
          acc[wt].count++
          acc[wt].weight += s.actual_weight || s.weight || 0
          if (s.status === 'confirmed') acc[wt].confirmed++
          return acc
        }, {} as Record<string, { count: number; weight: number; confirmed: number }>)

        const wasteAnalytics = Object.entries(wasteTypeStats).map(([type, stats]) => ({
          waste_type: type,
          shipment_count: stats.count,
          total_weight_kg: stats.weight,
          confirmed_count: stats.confirmed,
          completion_rate: +((stats.confirmed / stats.count) * 100).toFixed(1)
        })).sort((a, b) => b.total_weight_kg - a.total_weight_kg)

        return new Response(
          JSON.stringify({
            success: true,
            period,
            waste_analytics: wasteAnalytics,
            totals: {
              types_count: wasteAnalytics.length,
              total_weight_kg: wasteAnalytics.reduce((s, w) => s + w.total_weight_kg, 0),
              total_shipments: wasteAnalytics.reduce((s, w) => s + w.shipment_count, 0)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'ping':
        return new Response(
          JSON.stringify({ success: true, message: 'Analytics Engine is running', timestamp: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: dashboard-summary, performance-trends, partner-performance, waste-analytics, ping' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[Analytics Engine] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
