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
    const lng = url.searchParams.get("lng") || "31.2357";
    const lang = url.searchParams.get("lang") || "ar";

    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search in both Arabic and English for better coverage
    const searchQueries = [q];
    // Detect if query is Arabic or English and add the other language variant
    const isArabic = /[\u0600-\u06FF]/.test(q);
    const searchLangs = isArabic ? ["ar", "en"] : ["en", "ar"];

    const HERE_API_KEY = Deno.env.get("HERE_API_KEY");
    const LOCATIONIQ_API_KEY = Deno.env.get("LOCATIONIQ_API_KEY");
    const OPENCAGE_API_KEY = Deno.env.get("OPENCAGE_API_KEY");
    const TOMTOM_API_KEY = Deno.env.get("TOMTOM_API_KEY");

    const promises: Promise<any[]>[] = [];

    // 1. HERE Maps (best for Middle East) - search in both languages
    if (HERE_API_KEY) {
      for (const sl of searchLangs) {
        promises.push(
          fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(q)}&in=countryCode:EGY&at=${lat},${lng}&limit=8&lang=${sl}&apiKey=${HERE_API_KEY}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (!data?.items) return [];
              return data.items.map((item: any, i: number) => ({
                id: `here-${sl}-${i}`,
                name: item.title || item.address?.label?.split(",")[0] || "",
                address: item.address?.label || "",
                lat: item.position?.lat || 0,
                lng: item.position?.lng || 0,
                source: "here",
              }));
            })
            .catch(() => [])
        );
      }
    }

    // 2. LocationIQ
    if (LOCATIONIQ_API_KEY) {
      promises.push(
        fetch(`https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(q)}&countrycodes=eg&format=json&limit=6&accept-language=${lang}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data || !Array.isArray(data)) return [];
            return data.map((item: any, i: number) => ({
              id: `liq-${i}`,
              name: item.display_name?.split(",")[0] || "",
              address: item.display_name || "",
              lat: parseFloat(item.lat) || 0,
              lng: parseFloat(item.lon) || 0,
              source: "locationiq",
            }));
          })
          .catch(() => [])
      );
    }

    // 3. OpenCage
    if (OPENCAGE_API_KEY) {
      promises.push(
        fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(q)}&countrycode=eg&limit=6&language=${lang}&key=${OPENCAGE_API_KEY}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data?.results) return [];
            return data.results.map((item: any, i: number) => ({
              id: `ocg-${i}`,
              name: item.formatted?.split(",")[0] || "",
              address: item.formatted || "",
              lat: item.geometry?.lat || 0,
              lng: item.geometry?.lng || 0,
              source: "opencage",
            }));
          })
          .catch(() => [])
      );
    }

    // 4. Mapbox - search in both languages with POI support
    const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN") || "pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g";
    for (const sl of searchLangs) {
      promises.push(
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=eg&limit=8&language=${sl}&types=address,place,locality,neighborhood,poi,region`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data?.features) return [];
            return data.features.map((f: any, i: number) => ({
              id: `mapbox-${sl}-${i}`,
              name: f.text || f.place_name?.split(",")[0] || "",
              address: f.place_name || "",
              lat: f.center?.[1] || 0,
              lng: f.center?.[0] || 0,
              source: "mapbox",
            }));
          })
          .catch(() => [])
      );
    }

    // 5. Photon/Komoot - no tag restriction to find POIs/companies
    promises.push(
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=10&lang=en`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.features) return [];
          return data.features.map((f: any, i: number) => ({
            id: `photon-${i}`,
            name: f.properties?.name || f.properties?.street || "",
            address: [f.properties?.street, f.properties?.city, f.properties?.state, f.properties?.country]
              .filter(Boolean).join("، ") || f.properties?.name || "",
            lat: f.geometry?.coordinates?.[1] || 0,
            lng: f.geometry?.coordinates?.[0] || 0,
            source: "photon",
          }));
        })
        .catch(() => [])
    );

    // 6. HERE Autosuggest - search both languages
    for (const sl of searchLangs) {
      promises.push(
        fetch(`https://autocomplete.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(q)}&at=${lat},${lng}&in=countryCode:EGY&limit=8&lang=${sl}${HERE_API_KEY ? `&apiKey=${HERE_API_KEY}` : ""}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data?.items) return [];
            return data.items
              .filter((item: any) => item.position)
              .map((item: any, i: number) => ({
                id: `herewego-${sl}-${i}`,
                name: item.title || "",
                address: item.address?.label || item.vicinity || "",
                lat: item.position?.lat || 0,
                lng: item.position?.lng || 0,
                source: "herewego",
              }));
          })
          .catch(() => [])
      );
    }

    // 7. Nominatim/OSM - search both languages for POIs
    for (const sl of searchLangs) {
      promises.push(
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=eg&limit=8&accept-language=${sl}&addressdetails=1&extratags=1`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data || !Array.isArray(data)) return [];
            return data.map((item: any, i: number) => ({
              id: `osm-${sl}-${i}`,
              name: item.display_name?.split(",")[0] || "",
              address: item.display_name || "",
              lat: parseFloat(item.lat) || 0,
              lng: parseFloat(item.lon) || 0,
              source: "osm",
            }));
          })
          .catch(() => [])
      );
    }

    // 8. TomTom (2500 free/day)
    if (TOMTOM_API_KEY) {
      promises.push(
        fetch(`https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${TOMTOM_API_KEY}&countrySet=EG&lat=${lat}&lon=${lng}&limit=6&language=${lang}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data?.results) return [];
            return data.results.map((item: any, i: number) => ({
              id: `tomtom-${i}`,
              name: item.poi?.name || item.address?.freeformAddress?.split(",")[0] || "",
              address: item.address?.freeformAddress || "",
              lat: item.position?.lat || 0,
              lng: item.position?.lon || 0,
              source: "tomtom",
            }));
          })
          .catch(() => [])
      );
    }

    const allArrays = await Promise.all(promises);
    const allResults = allArrays.flat();

    // Deduplicate by name similarity + proximity (~200m)
    const deduped: any[] = [];
    for (const r of allResults) {
      if (!r.lat && !r.lng) continue;
      if (!r.name) continue;
      const nameLower = r.name.toLowerCase().trim();
      const isDupe = deduped.some(
        d => (Math.abs(d.lat - r.lat) < 0.002 && Math.abs(d.lng - r.lng) < 0.002) ||
             (d.name.toLowerCase().trim() === nameLower && Math.abs(d.lat - r.lat) < 0.01)
      );
      if (!isDupe) deduped.push(r);
    }

    const configuredSources = [
      HERE_API_KEY ? "here" : null,
      LOCATIONIQ_API_KEY ? "locationiq" : null,
      OPENCAGE_API_KEY ? "opencage" : null,
      TOMTOM_API_KEY ? "tomtom" : null,
      "mapbox",
      "photon",
      "herewego",
      "osm",
    ].filter(Boolean);

    console.log(`Multi-geocode "${q}": ${deduped.length} results from [${configuredSources.join(", ")}] (langs: ${searchLangs.join(",")})`);

    return new Response(JSON.stringify({ results: deduped.slice(0, 30), sources: configuredSources }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Multi-geocode error:", error);
    return new Response(
      JSON.stringify({ results: [], error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
