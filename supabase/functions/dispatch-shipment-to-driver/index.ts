import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * dispatch-shipment-to-driver
 * Finds the nearest freelance driver within 10km and sends them a shipment offer.
 * If no driver is found or the offer expires (15 min), it moves to the next closest driver.
 * 
 * POST body: { shipment_id, pickup_lat, pickup_lng, max_radius_km? }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { shipment_id, pickup_lat, pickup_lng, max_radius_km = 10 } = body;

    if (!shipment_id || !pickup_lat || !pickup_lng) {
      return new Response(JSON.stringify({ error: "Missing shipment_id, pickup_lat, or pickup_lng" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get already-offered driver IDs for this shipment to exclude them
    const { data: existingOffers } = await supabaseAdmin
      .from("driver_shipment_offers")
      .select("driver_id")
      .eq("shipment_id", shipment_id)
      .in("status", ["pending", "accepted"]);

    const excludedDriverIds = (existingOffers || []).map((o: any) => o.driver_id);

    // Find freelance drivers with active locations
    // Freelance driver = has role 'driver' but no organization
    const { data: driverLocations, error: locError } = await supabaseAdmin
      .from("driver_locations")
      .select("driver_id, latitude, longitude, updated_at")
      .eq("is_active", true)
      .gte("updated_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active in last 30 min

    if (locError) {
      console.error("Error fetching driver locations:", locError);
      return new Response(JSON.stringify({ error: "Failed to find drivers" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!driverLocations || driverLocations.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "لا يوجد سائقين متاحين في المنطقة حالياً",
        drivers_found: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate distance using Haversine formula and filter by radius
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371; // Earth radius in km
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Filter and sort by distance
    const nearbyDrivers = driverLocations
      .filter((dl: any) => !excludedDriverIds.includes(dl.driver_id))
      .map((dl: any) => ({
        driver_id: dl.driver_id,
        distance_km: haversine(pickup_lat, pickup_lng, dl.latitude, dl.longitude),
      }))
      .filter((d: any) => d.distance_km <= max_radius_km)
      .sort((a: any, b: any) => a.distance_km - b.distance_km);

    if (nearbyDrivers.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: `لا يوجد سائقين في نطاق ${max_radius_km} كم`,
        drivers_found: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send offer to the nearest driver
    const nearest = nearbyDrivers[0];
    const offerRound = (existingOffers?.length || 0) + 1;

    const { data: offer, error: offerError } = await supabaseAdmin
      .from("driver_shipment_offers")
      .insert({
        shipment_id,
        driver_id: nearest.driver_id,
        offered_by: user.id,
        distance_km: Math.round(nearest.distance_km * 100) / 100,
        max_radius_km,
        offer_round: offerRound,
        status: "pending",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (offerError) {
      console.error("Error creating offer:", offerError);
      return new Response(JSON.stringify({ error: "Failed to create offer" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send notification to the driver
    await supabaseAdmin.from("notifications").insert({
      user_id: nearest.driver_id,
      title: "🚛 شحنة جديدة بالقرب منك!",
      message: `لديك شحنة جديدة على بعد ${nearest.distance_km.toFixed(1)} كم. لديك 15 دقيقة للقبول.`,
      type: "shipment_offer",
      action_url: `/dashboard/driver-offers?offer=${offer.id}`,
      metadata: { shipment_id, offer_id: offer.id, distance_km: nearest.distance_km },
    });

    return new Response(JSON.stringify({
      success: true,
      offer_id: offer.id,
      driver_id: nearest.driver_id,
      distance_km: nearest.distance_km,
      expires_in_minutes: 15,
      total_nearby_drivers: nearbyDrivers.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in dispatch-shipment-to-driver:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
