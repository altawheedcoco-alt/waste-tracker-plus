import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeofenceZone {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  organization_id: string
  zone_type: 'pickup' | 'delivery' | 'restricted'
}

interface DriverLocation {
  driver_id: string
  latitude: number
  longitude: number
  speed?: number
}

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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
    console.log(`[Geofencing] Action: ${action}`)

    switch (action) {
      case 'check-location': {
        const { driver_id, latitude, longitude, shipment_id, speed } = data as DriverLocation & { shipment_id?: string }
        
        if (!driver_id || latitude === undefined || longitude === undefined) {
          return new Response(
            JSON.stringify({ error: 'driver_id, latitude, and longitude are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get driver's organization
        const { data: driver } = await supabase
          .from('drivers')
          .select('organization_id, profile_id')
          .eq('id', driver_id)
          .single()

        if (!driver) {
          return new Response(
            JSON.stringify({ error: 'Driver not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get active shipments for this driver
        const { data: shipments } = await supabase
          .from('shipments')
          .select('id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, generator_id, recycler_id, shipment_number, status')
          .eq('driver_id', driver_id)
          .in('status', ['approved', 'collecting', 'in_transit'])

        const alerts: { type: string; message: string; shipment_id?: string; zone?: string }[] = []
        const GEOFENCE_RADIUS = 200

        for (const shipment of shipments || []) {
          // Check pickup zone
          if (shipment.pickup_lat && shipment.pickup_lng && ['approved', 'collecting'].includes(shipment.status)) {
            const distanceToPickup = calculateDistance(latitude, longitude, shipment.pickup_lat, shipment.pickup_lng)
            if (distanceToPickup <= GEOFENCE_RADIUS) {
              alerts.push({
                type: 'entered_pickup_zone',
                message: `وصلت إلى منطقة الاستلام للشحنة ${shipment.shipment_number}`,
                shipment_id: shipment.id,
                zone: 'pickup'
              })
            }
          }

          // Check delivery zone
          if (shipment.delivery_lat && shipment.delivery_lng && shipment.status === 'in_transit') {
            const distanceToDelivery = calculateDistance(latitude, longitude, shipment.delivery_lat, shipment.delivery_lng)
            
            if (distanceToDelivery <= GEOFENCE_RADIUS) {
              alerts.push({
                type: 'entered_delivery_zone',
                message: `وصلت إلى منطقة التسليم للشحنة ${shipment.shipment_number}`,
                shipment_id: shipment.id,
                zone: 'delivery'
              })
            }

            // ETA notification for recycler (within ~15 min / ~15km at avg speed)
            const avgSpeedKmh = speed && speed > 0 ? speed * 3.6 : 40 // default 40 km/h
            const etaMinutes = (distanceToDelivery / 1000) / avgSpeedKmh * 60
            
            if (etaMinutes <= 15 && etaMinutes > 0 && distanceToDelivery > GEOFENCE_RADIUS) {
              // Check if we already sent an ETA notification recently (within 30 min)
              const { data: recentNotif } = await supabase
                .from('notifications')
                .select('id')
                .eq('shipment_id', shipment.id)
                .eq('type', 'eta_alert')
                .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
                .limit(1)

              if (!recentNotif || recentNotif.length === 0) {
                // Get recycler's admin user to notify
                if (shipment.recycler_id) {
                  const { data: recyclerUsers } = await supabase
                    .from('user_organizations')
                    .select('user_id')
                    .eq('organization_id', shipment.recycler_id)
                    .limit(5)

                  for (const ru of recyclerUsers || []) {
                    await supabase.from('notifications').insert({
                      user_id: ru.user_id,
                      title: '🚛 شاحنة في الطريق إليك',
                      message: `شحنة رقم ${shipment.shipment_number} ستصل خلال ${Math.round(etaMinutes)} دقيقة تقريباً. يرجى تجهيز منطقة الاستلام والميزان.`,
                      type: 'eta_alert',
                      shipment_id: shipment.id
                    })
                  }

                  alerts.push({
                    type: 'eta_notification_sent',
                    message: `تم إبلاغ المدور - ETA ${Math.round(etaMinutes)} دقيقة`,
                    shipment_id: shipment.id,
                    zone: 'delivery'
                  })
                  
                  console.log(`[Geofencing] ETA alert sent to recycler for shipment ${shipment.shipment_number}: ${Math.round(etaMinutes)} min`)
                }
              }
            }
          }
        }

        // Create notifications for geofence alerts
        if (alerts.filter(a => a.type.startsWith('entered_')).length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', driver.profile_id)
            .single()

          if (profile?.user_id) {
            for (const alert of alerts.filter(a => a.type.startsWith('entered_'))) {
              await supabase.from('notifications').insert({
                user_id: profile.user_id,
                title: alert.type === 'entered_pickup_zone' ? '📍 وصول لمنطقة الاستلام' : '🎯 وصول لمنطقة التسليم',
                message: alert.message,
                type: 'geofence_alert',
                shipment_id: alert.shipment_id
              })
            }
          }
        }

        console.log(`[Geofencing] Driver ${driver_id}: ${alerts.length} alerts generated`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            alerts,
            checked_shipments: shipments?.length || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get-nearby-locations': {
        const { latitude, longitude, radius_km = 10, type } = data

        if (latitude === undefined || longitude === undefined) {
          return new Response(
            JSON.stringify({ error: 'latitude and longitude are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get organizations with locations
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id, name, organization_type, latitude, longitude, address')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)

        const nearbyLocations = (organizations || [])
          .map(org => {
            const distance = calculateDistance(latitude, longitude, org.latitude!, org.longitude!)
            return { ...org, distance_meters: Math.round(distance), distance_km: +(distance / 1000).toFixed(2) }
          })
          .filter(org => org.distance_km <= radius_km)
          .filter(org => !type || org.organization_type === type)
          .sort((a, b) => a.distance_meters - b.distance_meters)

        return new Response(
          JSON.stringify({ 
            success: true, 
            locations: nearbyLocations,
            center: { latitude, longitude },
            radius_km
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'check-gps-signal': {
        // Check for drivers who haven't sent location in 3+ minutes
        const { organization_id } = data
        if (!organization_id) {
          return new Response(
            JSON.stringify({ error: 'organization_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get active shipments
        const { data: activeShipments } = await supabase
          .from('shipments')
          .select('id, shipment_number, driver_id, status')
          .or(`organization_id.eq.${organization_id},recycler_id.eq.${organization_id}`)
          .in('status', ['in_transit', 'collecting'])

        const signalLostAlerts: any[] = []
        const thresholdMs = 3 * 60 * 1000 // 3 minutes

        for (const shipment of activeShipments || []) {
          if (!shipment.driver_id) continue

          const { data: lastLog } = await supabase
            .from('driver_location_logs')
            .select('recorded_at')
            .eq('driver_id', shipment.driver_id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single()

          if (lastLog) {
            const timeSince = Date.now() - new Date(lastLog.recorded_at).getTime()
            if (timeSince > thresholdMs) {
              // Mark GPS as lost
              await supabase.from('shipments').update({
                gps_active_throughout: false,
                gps_signal_lost_at: new Date(Date.now() - timeSince).toISOString()
              }).eq('id', shipment.id)

              signalLostAlerts.push({
                shipment_id: shipment.id,
                shipment_number: shipment.shipment_number,
                driver_id: shipment.driver_id,
                minutes_since_last: Math.round(timeSince / 60000)
              })
            }
          }
        }

        // Notify admins
        if (signalLostAlerts.length > 0) {
          const { data: adminUsers } = await supabase
            .from('user_organizations')
            .select('user_id')
            .eq('organization_id', organization_id)
            .limit(5)

          for (const admin of adminUsers || []) {
            for (const alert of signalLostAlerts) {
              await supabase.from('notifications').insert({
                user_id: admin.user_id,
                title: '🔴 فقدان إشارة GPS',
                message: `السائق في شحنة ${alert.shipment_number} فقد الإشارة منذ ${alert.minutes_since_last} دقيقة`,
                type: 'gps_signal_lost',
                shipment_id: alert.shipment_id
              })
            }
          }
        }

        console.log(`[Geofencing] GPS check: ${signalLostAlerts.length} signal losses detected`)

        return new Response(
          JSON.stringify({ success: true, signal_lost: signalLostAlerts }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: check-location, get-nearby-locations, check-gps-signal' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[Geofencing] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
