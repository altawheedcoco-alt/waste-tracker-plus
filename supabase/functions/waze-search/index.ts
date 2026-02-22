import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const lat = url.searchParams.get("lat") || "30.0444";
    const lon = url.searchParams.get("lon") || "31.2357";
    const lang = url.searchParams.get("lang") || "ar";

    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Waze SearchServer (mozi) endpoint
    const wazeUrl = `https://www.waze.com/row-SearchServer/mozi?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}&lang=${lang}&origin=livemap&limit=10`;

    const wazeRes = await fetch(wazeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.waze.com/live-map/",
        "Accept": "application/json",
      },
    });

    if (!wazeRes.ok) {
      throw new Error(`Waze API returned ${wazeRes.status}`);
    }

    const wazeData = await wazeRes.json();

    // Normalize Waze results
    const results = (wazeData || [])
      .filter((item: any) => item.location)
      .map((item: any, i: number) => ({
        id: `waze-${i}-${item.name || ""}`.slice(0, 50),
        name: item.name || item.streetName || "موقع غير معروف",
        address: [item.streetName, item.city, item.state, item.countryName]
          .filter(Boolean)
          .join("، ") || item.name || "",
        lat: item.location?.lat || 0,
        lng: item.location?.lon || 0,
        city: item.city || "",
        type: item.type || "venue",
      }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Waze search error:", error);
    return new Response(
      JSON.stringify({ results: [], error: error.message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
