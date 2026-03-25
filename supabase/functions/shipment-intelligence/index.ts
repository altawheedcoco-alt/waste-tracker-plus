import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Haversine distance in meters
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Calculate bearing between two points
function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

// Detect route deviation: compare driver's heading vs ideal heading to destination
function detectDeviation(
  driverLat: number, driverLng: number,
  destLat: number, destLng: number,
  driverHeading: number | null,
  prevLat: number | null, prevLng: number | null,
): { isDeviating: boolean; deviationDegrees: number; deviationScore: number } {
  const idealBearing = bearing(driverLat, driverLng, destLat, destLng)
  
  // Use actual heading from movement if available
  let actualBearing = driverHeading || 0
  if (prevLat && prevLng) {
    actualBearing = bearing(prevLat, prevLng, driverLat, driverLng)
  }
  
  let diff = Math.abs(idealBearing - actualBearing)
  if (diff > 180) diff = 360 - diff
  
  // Score: 0 = perfect, 100 = completely wrong direction
  const deviationScore = Math.min(100, Math.round((diff / 180) * 100))
  
  return {
    isDeviating: diff > 45, // More than 45° off course
    deviationDegrees: Math.round(diff),
    deviationScore,
  }
}

// Calculate ETA
function calculateETA(distanceMeters: number, speedMps: number | null): {
  etaMinutes: number;
  etaFormatted: string;
  arrivalTime: string;
} {
  const avgSpeed = speedMps && speedMps > 1 ? speedMps : 11.11 // default 40 km/h
  const etaSeconds = distanceMeters / avgSpeed
  const etaMinutes = Math.round(etaSeconds / 60)
  
  const arrivalDate = new Date(Date.now() + etaSeconds * 1000)
  const hours = Math.floor(etaMinutes / 60)
  const mins = etaMinutes % 60
  const etaFormatted = hours > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${mins} دقيقة`
  
  return { etaMinutes, etaFormatted, arrivalTime: arrivalDate.toISOString() }
}

// Rate route health: combines deviation, speed consistency, GPS quality
function calculateRouteHealth(
  deviationScore: number,
  speedKmh: number | null,
  gpsAge: number, // seconds since last GPS update
  totalStops: number, // unexpected stops
): { score: number; grade: string; issues: string[] } {
  const issues: string[] = []
  let score = 100
  
  // Deviation penalty
  score -= deviationScore * 0.4
  if (deviationScore > 30) issues.push('انحراف عن المسار المثالي')
  
  // Speed anomaly
  if (speedKmh !== null) {
    if (speedKmh > 120) { score -= 15; issues.push('سرعة مفرطة') }
    if (speedKmh < 5 && speedKmh > 0) { score -= 10; issues.push('توقف أو بطء شديد') }
  }
  
  // GPS freshness
  if (gpsAge > 300) { score -= 20; issues.push('إشارة GPS ضعيفة أو مفقودة') }
  else if (gpsAge > 120) { score -= 10; issues.push('تأخر في تحديث الموقع') }
  
  // Unexpected stops
  if (totalStops > 3) { score -= totalStops * 3; issues.push(`${totalStops} توقفات غير مبررة`) }
  
  score = Math.max(0, Math.min(100, Math.round(score)))
  const grade = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'warning' : 'critical'
  
  return { score, grade, issues }
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

    const { action, ...data } = await req.json()
    console.log(`[ShipmentIntelligence] Action: ${action}`)

    switch (action) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 1. FULL INTELLIGENCE CHECK (per driver ping)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'driver-ping': {
        const { driver_id, latitude, longitude, speed, heading } = data
        if (!driver_id || !latitude || !longitude) {
          return new Response(JSON.stringify({ error: 'Missing driver_id/lat/lng' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Log location
        await supabase.from('driver_location_logs').insert({
          driver_id, latitude, longitude, speed: speed || null, heading: heading || null,
          recorded_at: new Date().toISOString(),
        })

        // Get previous location for heading calculation
        const { data: prevLoc } = await supabase
          .from('driver_location_logs')
          .select('latitude, longitude, recorded_at')
          .eq('driver_id', driver_id)
          .order('recorded_at', { ascending: false })
          .range(1, 1) // second most recent
          .maybeSingle()

        // Get active shipments for this driver
        const { data: shipments } = await supabase
          .from('shipments')
          .select('id, shipment_number, status, pickup_lat, pickup_lng, delivery_lat, delivery_lng, generator_id, transporter_id, recycler_id')
          .eq('driver_id', driver_id)
          .in('status', ['approved', 'collecting', 'in_transit'])

        const intelligence: any[] = []
        const notifications: any[] = []
        const statusUpdates: any[] = []

        const GEOFENCE_PICKUP = 200 // meters
        const GEOFENCE_DELIVERY = 300 // meters

        for (const shipment of shipments || []) {
          const intel: any = { shipment_id: shipment.id, shipment_number: shipment.shipment_number }

          // ── Determine target based on status ──
          let targetLat: number | null = null
          let targetLng: number | null = null
          let targetType = ''

          if (['approved', 'collecting'].includes(shipment.status)) {
            targetLat = shipment.pickup_lat
            targetLng = shipment.pickup_lng
            targetType = 'pickup'
          } else if (shipment.status === 'in_transit') {
            targetLat = shipment.delivery_lat
            targetLng = shipment.delivery_lng
            targetType = 'delivery'
          }

          if (targetLat && targetLng) {
            // ── Distance ──
            const distanceM = haversine(latitude, longitude, targetLat, targetLng)
            intel.distance_meters = Math.round(distanceM)
            intel.distance_km = +(distanceM / 1000).toFixed(2)
            intel.target_type = targetType

            // ── Speed ──
            const speedMps = speed ? speed : null
            const speedKmh = speedMps ? +(speedMps * 3.6).toFixed(1) : null
            intel.speed_kmh = speedKmh

            // ── ETA ──
            const eta = calculateETA(distanceM, speedMps)
            intel.eta = eta

            // ── Route Deviation ──
            const deviation = detectDeviation(
              latitude, longitude, targetLat, targetLng,
              heading || null, prevLoc?.latitude || null, prevLoc?.longitude || null
            )
            intel.deviation = deviation

            // ── GPS Age ──
            const gpsAge = prevLoc ? (Date.now() - new Date(prevLoc.recorded_at).getTime()) / 1000 : 0
            
            // ── Route Health ──
            const health = calculateRouteHealth(deviation.deviationScore, speedKmh, gpsAge, 0)
            intel.route_health = health

            // ── Auto-Status: Geofence detection ──
            if (targetType === 'pickup' && distanceM <= GEOFENCE_PICKUP && shipment.status === 'approved') {
              statusUpdates.push({ id: shipment.id, status: 'collecting', reason: 'geofence_auto' })
              notifications.push({
                targets: [shipment.generator_id, shipment.transporter_id].filter(Boolean),
                title: '📍 السائق وصل لموقع الاستلام',
                message: `شحنة ${shipment.shipment_number}: السائق وصل لموقع الجمع تلقائياً`,
                type: 'auto_status_update',
                shipment_id: shipment.id,
              })
            }

            if (targetType === 'delivery' && distanceM <= GEOFENCE_DELIVERY && shipment.status === 'in_transit') {
              statusUpdates.push({ id: shipment.id, status: 'at_destination', reason: 'geofence_auto' })
              notifications.push({
                targets: [shipment.generator_id, shipment.transporter_id, shipment.recycler_id].filter(Boolean),
                title: '🎯 الشحنة وصلت للوجهة',
                message: `شحنة ${shipment.shipment_number}: وصلت تلقائياً لمنطقة التسليم`,
                type: 'auto_arrival',
                shipment_id: shipment.id,
              })
            }

            // ── ETA Alert: Notify destination when 15 min away ──
            if (targetType === 'delivery' && eta.etaMinutes <= 15 && eta.etaMinutes > 2 && distanceM > GEOFENCE_DELIVERY) {
              const { data: recent } = await supabase
                .from('notifications')
                .select('id')
                .eq('shipment_id', shipment.id)
                .eq('type', 'eta_approaching')
                .gte('created_at', new Date(Date.now() - 20 * 60 * 1000).toISOString())
                .limit(1)

              if (!recent?.length) {
                notifications.push({
                  targets: [shipment.recycler_id].filter(Boolean),
                  title: '🚛 شاحنة قادمة في الطريق',
                  message: `شحنة ${shipment.shipment_number} ستصل خلال ${eta.etaFormatted}. جهّز الميزان ومنطقة الاستقبال.`,
                  type: 'eta_approaching',
                  shipment_id: shipment.id,
                })
              }
            }

            // ── Route Deviation Alert ──
            if (deviation.isDeviating && deviation.deviationScore > 50) {
              const { data: recentDev } = await supabase
                .from('notifications')
                .select('id')
                .eq('shipment_id', shipment.id)
                .eq('type', 'route_deviation')
                .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
                .limit(1)

              if (!recentDev?.length) {
                notifications.push({
                  targets: [shipment.transporter_id].filter(Boolean),
                  title: '⚠️ انحراف عن المسار',
                  message: `شحنة ${shipment.shipment_number}: السائق منحرف ${deviation.deviationDegrees}° عن المسار المثالي. درجة الانحراف: ${deviation.deviationScore}/100`,
                  type: 'route_deviation',
                  shipment_id: shipment.id,
                })
              }
            }

            // ── Speed Alert ──
            if (speedKmh && speedKmh > 120) {
              notifications.push({
                targets: [shipment.transporter_id].filter(Boolean),
                title: '🚨 سرعة مفرطة',
                message: `شحنة ${shipment.shipment_number}: السائق يتحرك بسرعة ${speedKmh} كم/س — تجاوز الحد الآمن`,
                type: 'speed_alert',
                shipment_id: shipment.id,
              })
            }
          }

          intelligence.push(intel)
        }

        // ── Execute status updates ──
        for (const upd of statusUpdates) {
          await supabase.from('shipments').update({ status: upd.status }).eq('id', upd.id)
          console.log(`[Intelligence] Auto-status: ${upd.id} → ${upd.status} (${upd.reason})`)
        }

        // ── Send notifications ──
        for (const notif of notifications) {
          for (const orgId of notif.targets) {
            const { data: users } = await supabase
              .from('user_organizations')
              .select('user_id')
              .eq('organization_id', orgId)
              .limit(5)

            for (const u of users || []) {
              await supabase.from('notifications').insert({
                user_id: u.user_id,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                shipment_id: notif.shipment_id,
              })
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          intelligence,
          status_updates: statusUpdates.length,
          notifications_sent: notifications.length,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 2. BATCH INTELLIGENCE: Get all active shipments intelligence
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'batch-intelligence': {
        const { organization_id, org_type } = data

        let query = supabase
          .from('shipments')
          .select('id, shipment_number, status, driver_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, generator_id, transporter_id, recycler_id')
          .in('status', ['approved', 'collecting', 'in_transit'])
          .limit(50)

        if (organization_id) {
          if (org_type === 'generator') query = query.eq('generator_id', organization_id)
          else if (org_type === 'transporter' || org_type === 'transport_office') query = query.eq('transporter_id', organization_id)
          else if (org_type === 'recycler' || org_type === 'disposal') query = query.eq('recycler_id', organization_id)
        }

        const { data: shipments } = await query

        const results: any[] = []

        for (const s of shipments || []) {
          const result: any = {
            shipment_id: s.id,
            shipment_number: s.shipment_number,
            status: s.status,
            driver_id: s.driver_id,
          }

          // Get driver's latest location
          if (s.driver_id) {
            const { data: loc } = await supabase
              .from('driver_location_logs')
              .select('latitude, longitude, speed, heading, recorded_at')
              .eq('driver_id', s.driver_id)
              .order('recorded_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (loc) {
              result.driver_location = { lat: loc.latitude, lng: loc.longitude }
              result.speed_kmh = loc.speed ? +(loc.speed * 3.6).toFixed(1) : null
              result.gps_age_seconds = Math.round((Date.now() - new Date(loc.recorded_at).getTime()) / 1000)
              result.gps_fresh = result.gps_age_seconds < 120

              // Determine target
              let tLat = null, tLng = null, tType = ''
              if (['approved', 'collecting'].includes(s.status)) {
                tLat = s.pickup_lat; tLng = s.pickup_lng; tType = 'pickup'
              } else {
                tLat = s.delivery_lat; tLng = s.delivery_lng; tType = 'delivery'
              }

              if (tLat && tLng) {
                const dist = haversine(loc.latitude, loc.longitude, tLat, tLng)
                result.distance_km = +(dist / 1000).toFixed(2)
                result.distance_meters = Math.round(dist)
                result.target_type = tType
                result.eta = calculateETA(dist, loc.speed)
                
                const deviation = detectDeviation(loc.latitude, loc.longitude, tLat, tLng, loc.heading, null, null)
                result.deviation = deviation
                
                const health = calculateRouteHealth(deviation.deviationScore, result.speed_kmh, result.gps_age_seconds, 0)
                result.route_health = health
              }
            } else {
              result.driver_location = null
              result.gps_fresh = false
              result.gps_age_seconds = 9999
            }
          }

          results.push(result)
        }

        // Sort by urgency: critical health first, then by ETA
        results.sort((a, b) => {
          const healthA = a.route_health?.score ?? 100
          const healthB = b.route_health?.score ?? 100
          if (healthA !== healthB) return healthA - healthB
          return (a.eta?.etaMinutes ?? 999) - (b.eta?.etaMinutes ?? 999)
        })

        return new Response(JSON.stringify({
          success: true,
          shipments: results,
          total: results.length,
          critical: results.filter(r => r.route_health?.grade === 'critical').length,
          timestamp: new Date().toISOString(),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 3. PERIODIC REPORT: Send summary to all parties
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      case 'periodic-report': {
        const { organization_id } = data

        const { data: activeShipments } = await supabase
          .from('shipments')
          .select('id, shipment_number, status, driver_id, generator_id, transporter_id, recycler_id')
          .or(`generator_id.eq.${organization_id},transporter_id.eq.${organization_id},recycler_id.eq.${organization_id}`)
          .in('status', ['approved', 'collecting', 'in_transit'])

        const summary = {
          total: activeShipments?.length || 0,
          in_transit: activeShipments?.filter(s => s.status === 'in_transit').length || 0,
          collecting: activeShipments?.filter(s => s.status === 'collecting').length || 0,
          approved: activeShipments?.filter(s => s.status === 'approved').length || 0,
        }

        // Notify org admin
        const { data: users } = await supabase
          .from('user_organizations')
          .select('user_id')
          .eq('organization_id', organization_id)
          .limit(3)

        for (const u of users || []) {
          await supabase.from('notifications').insert({
            user_id: u.user_id,
            title: '📊 تقرير التتبع الدوري',
            message: `لديك ${summary.total} شحنة نشطة: ${summary.in_transit} في الطريق، ${summary.collecting} جاري الجمع، ${summary.approved} معتمدة.`,
            type: 'periodic_tracking_report',
          })
        }

        return new Response(JSON.stringify({ success: true, summary }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action',
          available: ['driver-ping', 'batch-intelligence', 'periodic-report'],
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
  } catch (error) {
    console.error('[ShipmentIntelligence] Error:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
