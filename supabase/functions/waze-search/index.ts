import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://www.waze.com/live-map/",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "ar,en;q=0.9",
    };

    // Try multiple Waze endpoints in parallel for best results
    const endpoints = [
      // 1. Waze livemap autocomplete (what the iframe uses)
      fetch(`https://www.waze.com/live-map/api/autocomplete?q=${encodeURIComponent(q)}&lang=${lang}&lon=${lon}&lat=${lat}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return [];
          // Autocomplete returns array of suggestions
          return (Array.isArray(data) ? data : data.suggestions || data.results || [])
            .filter((item: any) => item.location || item.bounds || item.lat || (item.geometry && item.geometry.coordinates))
            .map((item: any, i: number) => {
              const itemLat = item.location?.lat || item.lat || item.geometry?.coordinates?.[1] || 0;
              const itemLng = item.location?.lon || item.location?.lng || item.lon || item.lng || item.geometry?.coordinates?.[0] || 0;
              return {
                id: `waze-auto-${i}`,
                name: item.name || item.display_name || item.title || item.text || "",
                address: item.address || item.formatted_address || item.city || "",
                lat: itemLat,
                lng: itemLng,
                city: item.city || "",
                type: "waze-livemap",
                source: "autocomplete",
              };
            });
        })
        .catch(() => []),

      // 2. Waze SearchServer mozi (classic endpoint, wider coverage)
      fetch(`https://www.waze.com/row-SearchServer/mozi?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}&lang=${lang}&origin=livemap&limit=10`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !Array.isArray(data)) return [];
          return data
            .filter((item: any) => item.location)
            .map((item: any, i: number) => ({
              id: `waze-mozi-${i}`,
              name: item.name || item.streetName || "موقع غير معروف",
              address: [item.streetName, item.city, item.state, item.countryName]
                .filter(Boolean)
                .join("، ") || item.name || "",
              lat: item.location?.lat || 0,
              lng: item.location?.lon || 0,
              city: item.city || "",
              type: "waze",
              source: "mozi",
            }));
        })
        .catch(() => []),

      // 3. Waze livemap place-search 
      fetch(`https://www.waze.com/live-map/api/place-search?q=${encodeURIComponent(q)}&lang=${lang}&lon=${lon}&lat=${lat}&count=10`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return [];
          const items = Array.isArray(data) ? data : data.results || data.places || [];
          return items
            .filter((item: any) => item.location || item.lat || item.geometry)
            .map((item: any, i: number) => {
              const itemLat = item.location?.lat || item.lat || item.geometry?.coordinates?.[1] || 0;
              const itemLng = item.location?.lon || item.location?.lng || item.lon || item.lng || item.geometry?.coordinates?.[0] || 0;
              return {
                id: `waze-place-${i}`,
                name: item.name || item.title || "",
                address: item.address || item.city || "",
                lat: itemLat,
                lng: itemLng,
                city: item.city || "",
                type: "waze-place",
                source: "place-search",
              };
            });
        })
        .catch(() => []),
    ];

    const [autocompleteResults, moziResults, placeResults] = await Promise.all(endpoints);

    console.log(`Search "${q}": autocomplete=${autocompleteResults.length}, mozi=${moziResults.length}, place=${placeResults.length}`);

    // Merge all results, prioritizing autocomplete (livemap) results first
    const allResults = [...autocompleteResults, ...placeResults, ...moziResults];
    
    // Deduplicate by proximity (within ~200m)
    const deduped: any[] = [];
    for (const r of allResults) {
      if (!r.lat && !r.lng) continue;
      const isDupe = deduped.some(
        d => Math.abs(d.lat - r.lat) < 0.002 && Math.abs(d.lng - r.lng) < 0.002 && 
             d.name.includes(r.name.substring(0, 5))
      );
      if (!isDupe) deduped.push(r);
    }

    return new Response(JSON.stringify({ results: deduped.slice(0, 15) }), {
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
