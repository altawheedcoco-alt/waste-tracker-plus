import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIWithRetry, parseAIJsonResponse } from "../_shared/ai-retry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fallback data when AI is completely unavailable
const FALLBACK_DATA = {
  commodities: [
    {
      type: "metals", name: "Metals & Scrap", name_ar: "المعادن والسكراب",
      subtypes: [
        { subtype: "iron_scrap", name: "Iron Scrap", name_ar: "سكراب حديد", current_price_usd: 350, previous_price_usd: 340, change_percent: 2.9, trend: "rising", source: "LME", region_prices: [{ region: "Egypt", price: 320 }, { region: "Europe", price: 380 }], forecast_7d: 355, forecast_30d: 365, supply_demand: "balanced" },
        { subtype: "aluminum_scrap", name: "Aluminum Scrap", name_ar: "سكراب ألومنيوم", current_price_usd: 1200, previous_price_usd: 1180, change_percent: 1.7, trend: "rising", source: "LME", region_prices: [], forecast_7d: 1210, forecast_30d: 1230, supply_demand: "deficit" },
        { subtype: "copper_scrap", name: "Copper Scrap", name_ar: "سكراب نحاس", current_price_usd: 7800, previous_price_usd: 7650, change_percent: 2.0, trend: "rising", source: "LME", region_prices: [], forecast_7d: 7850, forecast_30d: 7950, supply_demand: "deficit" },
      ]
    },
    {
      type: "paper", name: "Paper & Cardboard", name_ar: "الورق والكرتون",
      subtypes: [
        { subtype: "occ", name: "OCC (Old Corrugated Containers)", name_ar: "كرتون مموج مستعمل", current_price_usd: 120, previous_price_usd: 115, change_percent: 4.3, trend: "rising", source: "RISI/Fastmarkets", region_prices: [], forecast_7d: 125, forecast_30d: 130, supply_demand: "deficit" },
        { subtype: "mixed_paper", name: "Mixed Paper", name_ar: "ورق مختلط", current_price_usd: 65, previous_price_usd: 70, change_percent: -7.1, trend: "falling", source: "RISI", region_prices: [], forecast_7d: 62, forecast_30d: 58, supply_demand: "surplus" },
      ]
    },
    {
      type: "plastics", name: "Plastics", name_ar: "البلاستيك",
      subtypes: [
        { subtype: "pet", name: "PET Bottles", name_ar: "زجاجات PET", current_price_usd: 280, previous_price_usd: 270, change_percent: 3.7, trend: "rising", source: "Plastics Exchange", region_prices: [], forecast_7d: 285, forecast_30d: 295, supply_demand: "deficit" },
        { subtype: "hdpe", name: "HDPE", name_ar: "بولي إيثيلين عالي الكثافة", current_price_usd: 450, previous_price_usd: 460, change_percent: -2.2, trend: "falling", source: "Plastics Exchange", region_prices: [], forecast_7d: 445, forecast_30d: 440, supply_demand: "surplus" },
      ]
    },
    {
      type: "rdf", name: "RDF & Alternative Fuel", name_ar: "وقود بديل RDF",
      subtypes: [
        { subtype: "rdf_pellets", name: "RDF Pellets", name_ar: "حبيبات وقود بديل", current_price_usd: 45, previous_price_usd: 42, change_percent: 7.1, trend: "rising", source: "Cement Industry", region_prices: [], forecast_7d: 47, forecast_30d: 50, supply_demand: "deficit" },
      ]
    },
    {
      type: "wood", name: "Wood & Pallets", name_ar: "الخشب والطبالي",
      subtypes: [
        { subtype: "wood_scrap", name: "Wood Scrap", name_ar: "خشب سكراب", current_price_usd: 85, previous_price_usd: 80, change_percent: 6.25, trend: "rising", source: "Local Market", region_prices: [], forecast_7d: 88, forecast_30d: 92, supply_demand: "deficit" },
      ]
    },
    {
      type: "glass", name: "Glass", name_ar: "الزجاج",
      subtypes: [
        { subtype: "clear_glass", name: "Clear Glass Cullet", name_ar: "زجاج شفاف مكسر", current_price_usd: 55, previous_price_usd: 53, change_percent: 3.8, trend: "rising", source: "Local Market", region_prices: [], forecast_7d: 56, forecast_30d: 58, supply_demand: "balanced" },
      ]
    },
    {
      type: "textiles", name: "Textiles & Fabrics", name_ar: "المنسوجات والأقمشة",
      subtypes: [
        { subtype: "cotton_waste", name: "Cotton Waste", name_ar: "فضلات قطن", current_price_usd: 150, previous_price_usd: 145, change_percent: 3.4, trend: "rising", source: "Textile Industry", region_prices: [], forecast_7d: 153, forecast_30d: 158, supply_demand: "balanced" },
      ]
    },
    {
      type: "organic", name: "Organic Waste", name_ar: "المخلفات العضوية",
      subtypes: [
        { subtype: "food_waste", name: "Food Waste (Composting)", name_ar: "مخلفات طعام (سماد)", current_price_usd: 15, previous_price_usd: 14, change_percent: 7.1, trend: "rising", source: "Composting Facilities", region_prices: [], forecast_7d: 16, forecast_30d: 18, supply_demand: "deficit" },
      ]
    },
  ],
  global_sentiment: "bullish",
  key_insights: [
    "أسعار المعادن ترتفع بسبب الطلب العالمي على البنية التحتية",
    "سوق RDF ينمو بسرعة مع توسع مصانع الأسمنت في استخدام الوقود البديل",
    "فائض في الورق المختلط يضغط على الأسعار",
    "الطلب على PET مرتفع عالمياً مع التوجه نحو التدوير"
  ],
  last_updated: new Date().toISOString().split('T')[0],
  _fallback: true,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { commodity_type, region, include_forecast } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a global waste commodity market analyst. Analyze current market prices for waste materials and recyclables.

${commodity_type ? `Focus on: ${commodity_type}` : 'Cover ALL commodity types: metals, paper, plastics, rdf, wood, textiles, glass, organic'}
Region focus: ${region || 'global'}

Return a JSON object with this EXACT structure (no markdown, just JSON):
{
  "commodities": [
    {
      "type": "metals",
      "name": "Metals & Scrap",
      "name_ar": "المعادن والسكراب",
      "subtypes": [
        {
          "subtype": "iron_scrap",
          "name": "Iron Scrap",
          "name_ar": "سكراب حديد",
          "current_price_usd": 350,
          "previous_price_usd": 340,
          "change_percent": 2.9,
          "trend": "rising",
          "source": "LME",
          "region_prices": [{"region": "Egypt", "price": 320}, {"region": "Europe", "price": 380}],
          "forecast_7d": 355,
          "forecast_30d": 365,
          "supply_demand": "balanced",
          "alert": "Iron scrap prices rising due to construction demand"
        }
      ]
    }
  ],
  "global_sentiment": "bullish",
  "key_insights": ["insight1", "insight2"],
  "last_updated": "${new Date().toISOString().split('T')[0]}"
}

IMPORTANT: Use REALISTIC current market prices based on your knowledge. Adjust for the ${region || 'global'} region. Include Arabic names. Return ONLY valid JSON.`;

    try {
      const response = await callAIWithRetry(LOVABLE_API_KEY, {
        messages: [
          { role: "system", content: "You are a waste commodity market analyst. Return ONLY valid JSON, no markdown." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      });

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!response.ok) {
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      const parsed = parseAIJsonResponse(content);

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (aiError) {
      // AI failed after all retries - return fallback data
      console.warn("AI failed, returning fallback data:", aiError);
      return new Response(JSON.stringify(FALLBACK_DATA), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("commodity-market-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
