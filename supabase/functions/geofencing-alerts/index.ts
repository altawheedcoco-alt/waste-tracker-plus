import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        const { driver_id, latitude, longitude, shipment_id } = data as DriverLocation & { shipment_id?: string }
        
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
        const GEOFENCE_RADIUS = 200 // 200 meters default radius

        for (const shipment of shipments || []) {
          // Check pickup zone
          if (shipment.pickup_lat && shipment.pickup_lng && ['approved', 'collecting'].includes(shipment.status)) {
            const distanceToPickup = calculateDistance(
              latitude,
              longitude,
              shipment.pickup_lat,
              shipment.pickup_lng
            )

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
            const distanceToDelivery = calculateDistance(
              latitude,
              longitude,
              shipment.delivery_lat,
              shipment.delivery_lng
            )

            if (distanceToDelivery <= GEOFENCE_RADIUS) {
              alerts.push({
                type: 'entered_delivery_zone',
                message: `وصلت إلى منطقة التسليم للشحنة ${shipment.shipment_number}`,
                shipment_id: shipment.id,
                zone: 'delivery'
              })
            }
          }
        }

        // Create notifications for alerts
        if (alerts.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', driver.profile_id)
            .single()

          if (profile?.user_id) {
            for (const alert of alerts) {
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

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: check-location, get-nearby-locations' }),
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
