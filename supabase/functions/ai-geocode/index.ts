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
    const { query, language = "ar" } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: use Nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=5&accept-language=${language}`;
      const nomRes = await fetch(nominatimUrl, {
        headers: { "User-Agent": "iRecycle-App/1.0" },
      });
      const nomData = await nomRes.json();
      const results = (nomData || []).map((r: any) => ({
        name: r.display_name?.split(",")[0] || query,
        address: r.display_name || "",
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        source: "nominatim",
        confidence: 0.7,
      }));
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Lovable AI to identify location
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a geolocation expert specializing in Egypt. When given a location name or description, return the most likely coordinates and details. 
            
IMPORTANT: Always respond with valid JSON only, no extra text. Format:
{
  "locations": [
    {
      "name": "Location name in Arabic",
      "name_en": "Location name in English", 
      "address": "Full address in Arabic",
      "lat": 30.0444,
      "lng": 31.2357,
      "type": "city|district|industrial|company|landmark|facility",
      "confidence": 0.95,
      "description": "Brief description in Arabic"
    }
  ]
}

If you're not sure about the exact coordinates, provide your best estimate with a lower confidence score. Always prioritize Egyptian locations. Include up to 5 results.`
          },
          {
            role: "user",
            content: `حدد الموقع الجغرافي: "${query}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { locations: [] };
      }
    } catch {
      parsed = { locations: [] };
    }

    const results = (parsed.locations || []).map((loc: any) => ({
      name: loc.name || query,
      name_en: loc.name_en || "",
      address: loc.address || "",
      lat: loc.lat || 30.0444,
      lng: loc.lng || 31.2357,
      type: loc.type || "unknown",
      source: "ai",
      confidence: loc.confidence || 0.5,
      description: loc.description || "",
    }));

    // Also fetch Nominatim results for verification
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=3&accept-language=${language}`;
    const nomRes = await fetch(nominatimUrl, {
      headers: { "User-Agent": "iRecycle-App/1.0" },
    });
    const nomData = await nomRes.json();
    const nominatimResults = (nomData || []).map((r: any) => ({
      name: r.display_name?.split(",")[0] || query,
      address: r.display_name || "",
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      source: "nominatim",
      confidence: 0.8,
    }));

    // Merge and deduplicate
    const allResults = [...results, ...nominatimResults];
    const seen = new Set<string>();
    const unique = allResults.filter((r: any) => {
      const key = `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return new Response(JSON.stringify({ results: unique.slice(0, 8) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI geocode error:", error);
    return new Response(JSON.stringify({ error: error.message, results: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
