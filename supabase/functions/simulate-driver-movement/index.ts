import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Highway route from 6th October Industrial Zone to Cairo Ring Road
// This simulates a truck moving on major highways
const highwayRoute = [
  // Starting point - 6th October Industrial Zone
  { lat: 29.9553, lng: 30.9106 },
  // Moving towards Ring Road
  { lat: 29.9580, lng: 30.9200 },
  { lat: 29.9620, lng: 30.9350 },
  { lat: 29.9680, lng: 30.9500 },
  // Entering Ring Road (Mehwar)
  { lat: 29.9750, lng: 30.9650 },
  { lat: 29.9820, lng: 30.9800 },
  { lat: 29.9900, lng: 30.9950 },
  { lat: 29.9980, lng: 31.0100 },
  // On Ring Road heading east
  { lat: 30.0050, lng: 31.0250 },
  { lat: 30.0120, lng: 31.0400 },
  { lat: 30.0180, lng: 31.0550 },
  { lat: 30.0230, lng: 31.0700 },
  // Continuing on highway
  { lat: 30.0280, lng: 31.0850 },
  { lat: 30.0320, lng: 31.1000 },
  { lat: 30.0350, lng: 31.1150 },
  { lat: 30.0380, lng: 31.1300 },
  // Approaching Cairo
  { lat: 30.0400, lng: 31.1450 },
  { lat: 30.0420, lng: 31.1600 },
  { lat: 30.0450, lng: 31.1750 },
  { lat: 30.0480, lng: 31.1900 },
  // Cairo Ring Road section
  { lat: 30.0510, lng: 31.2050 },
  { lat: 30.0550, lng: 31.2200 },
  { lat: 30.0600, lng: 31.2350 },
  { lat: 30.0650, lng: 31.2500 },
  // Heading towards Heliopolis
  { lat: 30.0700, lng: 31.2650 },
  { lat: 30.0750, lng: 31.2800 },
  { lat: 30.0800, lng: 31.2950 },
  { lat: 30.0850, lng: 31.3100 },
  // Cairo Airport Road area
  { lat: 30.0900, lng: 31.3250 },
  { lat: 30.0950, lng: 31.3400 },
  { lat: 30.1000, lng: 31.3550 },
  { lat: 30.1050, lng: 31.3700 },
  // New Cairo direction
  { lat: 30.1000, lng: 31.3850 },
  { lat: 30.0950, lng: 31.4000 },
  { lat: 30.0900, lng: 31.4150 },
  { lat: 30.0850, lng: 31.4300 },
  // Suez Road
  { lat: 30.0800, lng: 31.4450 },
  { lat: 30.0750, lng: 31.4600 },
  { lat: 30.0700, lng: 31.4750 },
  { lat: 30.0650, lng: 31.4900 },
  // Return loop - heading back west on southern ring road
  { lat: 30.0550, lng: 31.4800 },
  { lat: 30.0450, lng: 31.4600 },
  { lat: 30.0350, lng: 31.4400 },
  { lat: 30.0250, lng: 31.4200 },
  // Southern Cairo
  { lat: 30.0150, lng: 31.4000 },
  { lat: 30.0050, lng: 31.3800 },
  { lat: 29.9950, lng: 31.3600 },
  { lat: 29.9850, lng: 31.3400 },
  // Maadi area
  { lat: 29.9750, lng: 31.3200 },
  { lat: 29.9650, lng: 31.3000 },
  { lat: 29.9550, lng: 31.2800 },
  { lat: 29.9450, lng: 31.2600 },
  // Giza direction
  { lat: 29.9400, lng: 31.2400 },
  { lat: 29.9350, lng: 31.2200 },
  { lat: 29.9300, lng: 31.2000 },
  { lat: 29.9250, lng: 31.1800 },
  // Returning to 6th October
  { lat: 29.9300, lng: 31.1500 },
  { lat: 29.9350, lng: 31.1200 },
  { lat: 29.9400, lng: 31.0900 },
  { lat: 29.9450, lng: 31.0600 },
  { lat: 29.9500, lng: 31.0300 },
  { lat: 29.9530, lng: 31.0000 },
  { lat: 29.9550, lng: 30.9700 },
  { lat: 29.9560, lng: 30.9400 },
  // Back to starting point
  { lat: 29.9553, lng: 30.9106 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, driverId } = await req.json();

    if (action === "start") {
      // Start continuous simulation
      const simulationId = crypto.randomUUID();
      
      // Store simulation state in a simple way - use KV or just run in background
      const simulateMovement = async () => {
        let currentIndex = 0;
        const totalPoints = highwayRoute.length;
        
        while (true) {
          const point = highwayRoute[currentIndex];
          
          // Calculate heading based on next point
          const nextIndex = (currentIndex + 1) % totalPoints;
          const nextPoint = highwayRoute[nextIndex];
          const heading = Math.atan2(
            nextPoint.lng - point.lng,
            nextPoint.lat - point.lat
          ) * (180 / Math.PI);
          
          // Simulate realistic highway speed (80-120 km/h)
          const speed = 80 + Math.random() * 40;
          
          // Insert location log
          await supabase.from("driver_location_logs").insert({
            driver_id: driverId,
            latitude: point.lat + (Math.random() - 0.5) * 0.0005, // Small variance
            longitude: point.lng + (Math.random() - 0.5) * 0.0005,
            accuracy: 5 + Math.random() * 10,
            speed: speed / 3.6, // Convert to m/s
            heading: heading,
            recorded_at: new Date().toISOString(),
          });
          
          currentIndex = (currentIndex + 1) % totalPoints;
          
          // Wait 3 seconds between updates (simulating ~100m movement at highway speed)
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      };

      // Run simulation in background (will run for request timeout)
      // For continuous simulation, we'll insert multiple points per request
      for (let i = 0; i < 20; i++) {
        const point = highwayRoute[i % highwayRoute.length];
        const nextPoint = highwayRoute[(i + 1) % highwayRoute.length];
        
        const heading = Math.atan2(
          nextPoint.lng - point.lng,
          nextPoint.lat - point.lat
        ) * (180 / Math.PI);
        
        const speed = 80 + Math.random() * 40;
        
        await supabase.from("driver_location_logs").insert({
          driver_id: driverId,
          latitude: point.lat + (Math.random() - 0.5) * 0.0003,
          longitude: point.lng + (Math.random() - 0.5) * 0.0003,
          accuracy: 5 + Math.random() * 5,
          speed: speed / 3.6,
          heading: heading,
          recorded_at: new Date(Date.now() + i * 3000).toISOString(),
        });
        
        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "تم بدء المحاكاة - السائق يتحرك على الطريق السريع",
          simulationId,
          pointsInserted: 20
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "continue") {
      // Continue simulation from last position
      const { data: lastLog } = await supabase
        .from("driver_location_logs")
        .select("latitude, longitude")
        .eq("driver_id", driverId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      // Find closest point in route
      let startIndex = 0;
      if (lastLog) {
        let minDist = Infinity;
        highwayRoute.forEach((point, idx) => {
          const dist = Math.sqrt(
            Math.pow(point.lat - lastLog.latitude, 2) + 
            Math.pow(point.lng - lastLog.longitude, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            startIndex = idx;
          }
        });
      }

      // Insert next batch of points
      for (let i = 0; i < 20; i++) {
        const idx = (startIndex + i) % highwayRoute.length;
        const point = highwayRoute[idx];
        const nextPoint = highwayRoute[(idx + 1) % highwayRoute.length];
        
        const heading = Math.atan2(
          nextPoint.lng - point.lng,
          nextPoint.lat - point.lat
        ) * (180 / Math.PI);
        
        const speed = 80 + Math.random() * 40;
        
        await supabase.from("driver_location_logs").insert({
          driver_id: driverId,
          latitude: point.lat + (Math.random() - 0.5) * 0.0003,
          longitude: point.lng + (Math.random() - 0.5) * 0.0003,
          accuracy: 5 + Math.random() * 5,
          speed: speed / 3.6,
          heading: heading,
          recorded_at: new Date(Date.now() + i * 3000).toISOString(),
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "تم إضافة نقاط جديدة للمسار",
          pointsInserted: 20
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Simulation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
