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
    const { query, userLat, userLng, radius = 50000 } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_API_KEY = Deno.env.get("VITE_GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_API_KEY) {
      console.error("VITE_GOOGLE_MAPS_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "API key not configured", results: [] }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default to Cairo center if no user location
    const searchLat = userLat || 30.0444;
    const searchLng = userLng || 31.2357;

    // Search using Google Places Text Search API (more comprehensive)
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " مصر")}&location=${searchLat},${searchLng}&radius=${radius}&language=ar&key=${GOOGLE_API_KEY}`;
    
    console.log("Searching Google Places:", query);
    
    const textSearchResponse = await fetch(textSearchUrl);
    const textSearchData = await textSearchResponse.json();

    if (textSearchData.status !== "OK" && textSearchData.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", textSearchData.status, textSearchData.error_message);
    }

    let allResults = textSearchData.results || [];

    // Also search with Nearby Search for industrial/factory types
    const industrialTypes = ['factory', 'industrial_area', 'warehouse', 'establishment'];
    
    for (const type of industrialTypes) {
      try {
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLat},${searchLng}&radius=${radius}&keyword=${encodeURIComponent(query)}&type=${type}&language=ar&key=${GOOGLE_API_KEY}`;
        
        const nearbyResponse = await fetch(nearbyUrl);
        const nearbyData = await nearbyResponse.json();
        
        if (nearbyData.results) {
          allResults = [...allResults, ...nearbyData.results];
        }
      } catch (err) {
        console.error(`Error fetching nearby ${type}:`, err);
      }
    }

    // Remove duplicates based on place_id
    const seenPlaceIds = new Set<string>();
    const uniqueResults = allResults.filter((place: any) => {
      if (seenPlaceIds.has(place.place_id)) return false;
      seenPlaceIds.add(place.place_id);
      return true;
    });

    // Sort by distance from user (if user location provided)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const resultsWithDistance = uniqueResults.map((place: any) => ({
      ...place,
      distance: calculateDistance(
        searchLat, 
        searchLng, 
        place.geometry?.location?.lat || 0, 
        place.geometry?.location?.lng || 0
      )
    }));

    // Sort by distance and take top 50
    resultsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
    const top50 = resultsWithDistance.slice(0, 50);

    // Format results
    const formattedResults = top50.map((place: any, index: number) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      type: 'google',
      source: 'Google Maps',
      types: place.types || [],
      rating: place.rating,
      distance: place.distance,
      rank: index + 1,
    }));

    console.log(`Found ${formattedResults.length} results for "${query}"`);

    return new Response(JSON.stringify({ 
      results: formattedResults,
      total: formattedResults.length,
      query,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Google Places search error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      results: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
