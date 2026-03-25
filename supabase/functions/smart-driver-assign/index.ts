import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { shipmentId, organizationId, wasteType, pickupLat, pickupLng, isHazardous } = await req.json();
    if (!shipmentId || !organizationId) throw new Error("shipmentId and organizationId are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get all available drivers for this organization
    const { data: drivers, error: drvErr } = await supabase
      .from('drivers')
      .select('id, vehicle_type, vehicle_plate, is_available, profile:profiles(full_name, phone)')
      .eq('organization_id', organizationId)
      .eq('is_available', true);

    if (drvErr) throw drvErr;
    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'no_available_drivers',
        message: 'لا يوجد سائقين متاحين حالياً' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Get latest locations for all drivers
    const driverIds = drivers.map(d => d.id);
    const { data: locations } = await supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude, updated_at')
      .in('driver_id', driverIds)
      .order('updated_at', { ascending: false });

    // Build location map (latest per driver)
    const locationMap = new Map<string, { lat: number; lng: number }>();
    locations?.forEach(loc => {
      if (!locationMap.has(loc.driver_id)) {
        locationMap.set(loc.driver_id, { lat: loc.latitude, lng: loc.longitude });
      }
    });

    // 3. Score each driver
    const hazardousVehicles = ['closed_truck', 'tanker', 'hazmat_truck', 'refrigerated'];
    
    const scoredDrivers = drivers.map(driver => {
      let score = 50; // base score
      let distance = 999;
      const reasons: string[] = [];

      // Distance scoring (max 40 points)
      const loc = locationMap.get(driver.id);
      if (loc && pickupLat && pickupLng) {
        distance = haversineDistance(loc.lat, loc.lng, pickupLat, pickupLng);
        const distScore = Math.max(0, 40 - (distance / 5)); // closer = higher score
        score += distScore;
        reasons.push(`المسافة: ${distance.toFixed(1)} كم`);
      } else {
        reasons.push('لا يوجد موقع GPS');
      }

      // Vehicle compatibility (20 points)
      if (isHazardous) {
        if (hazardousVehicles.includes(driver.vehicle_type || '')) {
          score += 20;
          reasons.push('مركبة مناسبة للمخلفات الخطرة ✅');
        } else {
          score -= 30; // penalty for incompatible vehicle
          reasons.push('مركبة غير مناسبة للمخلفات الخطرة ❌');
        }
      } else {
        score += 10;
      }

      return {
        driver_id: driver.id,
        driver_name: Array.isArray(driver.profile) ? driver.profile[0]?.full_name : (driver.profile as any)?.full_name || 'غير معروف',
        vehicle_plate: driver.vehicle_plate,
        vehicle_type: driver.vehicle_type,
        distance_km: Math.round(distance * 10) / 10,
        score: Math.round(score),
        reasons,
      };
    });

    // Sort by score descending
    scoredDrivers.sort((a, b) => b.score - a.score);

    // 4. Auto-assign best driver
    const bestDriver = scoredDrivers[0];

    if (bestDriver.score < 20) {
      return new Response(JSON.stringify({
        success: false,
        error: 'no_suitable_driver',
        message: 'لا يوجد سائق مناسب لهذه الشحنة',
        candidates: scoredDrivers.slice(0, 5),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update shipment with assigned driver
    await supabase.from('shipments').update({ 
      driver_id: bestDriver.driver_id 
    }).eq('id', shipmentId);

    // Log assignment
    await supabase.from('driver_assignment_logs').insert({
      shipment_id: shipmentId,
      driver_id: bestDriver.driver_id,
      organization_id: organizationId,
      assignment_type: 'auto_nearest',
      distance_km: bestDriver.distance_km,
      score: bestDriver.score,
      reason: bestDriver.reasons.join(' | '),
    });

    return new Response(JSON.stringify({
      success: true,
      assigned: bestDriver,
      candidates: scoredDrivers.slice(0, 5),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error("Smart assignment error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
