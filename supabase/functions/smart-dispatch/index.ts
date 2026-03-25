import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispatchRequest {
  shipment_id: string;
  pickup_lat?: number;
  pickup_lng?: number;
  max_distance_km?: number;
  offered_price?: number;
  offer_expires_minutes?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: DispatchRequest = await req.json();
    const {
      shipment_id,
      pickup_lat,
      pickup_lng,
      max_distance_km = 50,
      offered_price,
      offer_expires_minutes = 15,
    } = body;

    if (!shipment_id) {
      return new Response(JSON.stringify({ error: 'shipment_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Verify shipment exists and has no driver assigned
    const { data: shipment, error: shipErr } = await supabase
      .from('shipments')
      .select('id, pickup_address, delivery_address, waste_type, estimated_weight, transporter_id')
      .eq('id', shipment_id)
      .single();

    if (shipErr || !shipment) {
      return new Response(JSON.stringify({ error: 'Shipment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Find available independent drivers
    // Ordered by: rating DESC, rejection_count ASC, total_trips DESC
    const { data: drivers, error: drvErr } = await supabase
      .from('drivers')
      .select('id, profile_id, service_area_km, rating, rejection_count, total_trips, preferred_waste_types')
      .eq('driver_type', 'independent')
      .eq('is_available', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .order('rejection_count', { ascending: true })
      .order('total_trips', { ascending: false })
      .limit(20);

    if (drvErr) {
      console.error('Error fetching drivers:', drvErr);
      return new Response(JSON.stringify({ error: 'Failed to query drivers' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No available independent drivers found',
        offers_created: 0 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. If we have coordinates, filter by distance using location logs
    let eligibleDriverIds = drivers.map(d => d.id);

    if (pickup_lat && pickup_lng) {
      // Get latest location for each driver
      const locationPromises = drivers.map(async (driver) => {
        const { data: loc } = await supabase
          .from('driver_location_logs')
          .select('latitude, longitude')
          .eq('driver_id', driver.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!loc) return null;

        // Haversine distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (loc.latitude - pickup_lat) * Math.PI / 180;
        const dLng = (loc.longitude - pickup_lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(pickup_lat * Math.PI / 180) * Math.cos(loc.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const effectiveRange = Math.min(driver.service_area_km || 10, max_distance_km);
        return distance <= effectiveRange ? { driver_id: driver.id, distance_km: Math.round(distance * 10) / 10 } : null;
      });

      const results = (await Promise.all(locationPromises)).filter(Boolean);
      eligibleDriverIds = results.map(r => r!.driver_id);
    }

    if (eligibleDriverIds.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No drivers within range',
        offers_created: 0 
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Create mission offers for eligible drivers (top 5)
    const topDrivers = eligibleDriverIds.slice(0, 5);
    const expiresAt = new Date(Date.now() + offer_expires_minutes * 60 * 1000).toISOString();

    const offers = topDrivers.map(driverId => ({
      shipment_id,
      driver_id: driverId,
      offered_by_org_id: shipment.transporter_id,
      offer_type: 'smart_dispatch' as const,
      status: 'pending' as const,
      offered_price: offered_price || null,
      expires_at: expiresAt,
    }));

    const { data: createdOffers, error: insertErr } = await supabase
      .from('driver_mission_offers')
      .insert(offers)
      .select('id, driver_id');

    if (insertErr) {
      console.error('Error creating offers:', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to create offers' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      offers_created: createdOffers?.length || 0,
      driver_ids: createdOffers?.map(o => o.driver_id) || [],
      expires_at: expiresAt,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Smart dispatch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
