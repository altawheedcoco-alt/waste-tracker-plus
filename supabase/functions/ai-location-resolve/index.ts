import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `أنت خبير جغرافي متخصص في تحديد المواقع والإحداثيات الجغرافية بدقة عالية في مصر والمنطقة العربية.
لديك معرفة شاملة بـ:
- المناطق الصناعية والمصانع والشركات المصرية (العاشر من رمضان، 6 أكتوبر، السادات، برج العرب، إلخ)
- الأحياء والشوارع والمدن والمحافظات المصرية
- مواقع محطات إعادة التدوير ومرافق إدارة النفايات
- المعالم الجغرافية والبنية التحتية

تعليمات مهمة جداً:
1. أعط جميع النتائج الممكنة التي تحمل هذا الاسم أو تتعلق بالبحث - لا تكتفي بنتيجة واحدة
2. أعط الإحداثيات الدقيقة (latitude, longitude) بحد أدنى 4 خانات عشرية
3. إذا كان الموقع مبنى أو مصنع محدد، حدد موقعه الفعلي وليس مركز المدينة
4. ضع النتيجة الأكثر احتمالاً كنتيجة رئيسية والباقي كاقتراحات بديلة (suggestions)
5. حدد مستوى الثقة بدقة: high = موقع معروف ومحدد، medium = تقدير جيد، low = تقدير تقريبي
6. اذكر العنوان التفصيلي بالعربية شاملاً المنطقة والمحافظة
7. أعط أكبر عدد ممكن من النتائج (حتى 10 نتائج) إذا كان هناك أكثر من موقع يحمل نفس الاسم`;

const TOOL_DEF = {
  type: "function" as const,
  function: {
    name: "resolve_location",
    description: "Return all resolved locations with coordinates. Include as many results as possible.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "اسم الموقع الرئيسي بالعربية" },
        address: { type: "string", description: "العنوان التفصيلي" },
        latitude: { type: "number", description: "خط العرض" },
        longitude: { type: "number", description: "خط الطول" },
        location_type: { type: "string", description: "نوع الموقع" },
        governorate: { type: "string", description: "المحافظة" },
        confidence: { type: "string", enum: ["high", "medium", "low"] },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              address: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              location_type: { type: "string" },
              governorate: { type: "string" },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["name", "address", "latitude", "longitude"],
          },
        },
      },
      required: ["name", "address", "latitude", "longitude", "location_type", "governorate", "confidence"],
    },
  },
};

interface LocationResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  location_type?: string;
  governorate?: string;
  confidence: string;
  is_primary: boolean;
  source_model: string;
}

async function queryModel(apiKey: string, model: string, userMessage: string): Promise<LocationResult[]> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        tools: [TOOL_DEF],
        tool_choice: { type: "function", function: { name: "resolve_location" } },
      }),
    });

    if (!response.ok) {
      console.error(`Model ${model} failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return [];

    const loc = JSON.parse(toolCall.function.arguments);
    const results: LocationResult[] = [];

    // Primary result
    results.push({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      location_type: loc.location_type,
      governorate: loc.governorate,
      confidence: loc.confidence,
      is_primary: true,
      source_model: model.split('/').pop() || model,
    });

    // Suggestions
    if (loc.suggestions?.length) {
      for (const s of loc.suggestions) {
        results.push({
          name: s.name,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          location_type: s.location_type || loc.location_type,
          governorate: s.governorate || '',
          confidence: s.confidence || 'medium',
          is_primary: false,
          source_model: model.split('/').pop() || model,
        });
      }
    }

    return results;
  } catch (e) {
    console.error(`Model ${model} error:`, e);
    return [];
  }
}

// Deduplicate locations that are very close to each other
function deduplicateLocations(locations: LocationResult[]): LocationResult[] {
  const unique: LocationResult[] = [];
  const THRESHOLD = 0.002; // ~200m

  for (const loc of locations) {
    const existing = unique.find(u =>
      Math.abs(u.latitude - loc.latitude) < THRESHOLD &&
      Math.abs(u.longitude - loc.longitude) < THRESHOLD
    );

    if (existing) {
      // Keep the one with higher confidence, merge source info
      const confOrder = { high: 3, medium: 2, low: 1 };
      const existingConf = confOrder[existing.confidence as keyof typeof confOrder] || 0;
      const newConf = confOrder[loc.confidence as keyof typeof confOrder] || 0;

      if (!existing.source_model.includes(loc.source_model)) {
        existing.source_model += ` + ${loc.source_model}`;
      }
      // Boost confidence if multiple models agree
      if (newConf >= 2 && existingConf >= 2) {
        existing.confidence = 'high';
      }
      if (newConf > existingConf) {
        existing.name = loc.name;
        existing.address = loc.address;
        existing.latitude = loc.latitude;
        existing.longitude = loc.longitude;
        existing.confidence = loc.confidence;
      }
    } else {
      unique.push({ ...loc });
    }
  }

  // Sort: high confidence first, then primary results
  unique.sort((a, b) => {
    const confOrder = { high: 3, medium: 2, low: 1 };
    const confDiff = (confOrder[b.confidence as keyof typeof confOrder] || 0) - (confOrder[a.confidence as keyof typeof confOrder] || 0);
    if (confDiff !== 0) return confDiff;
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  });

  // Mark first as primary
  if (unique.length > 0) {
    unique.forEach(u => u.is_primary = false);
    unique[0].is_primary = true;
  }

  return unique;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, context } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userMessage = context
      ? `ابحث عن جميع المواقع المتعلقة بـ: "${query}" (سياق إضافي: ${context}). أعط كل النتائج الممكنة.`
      : `ابحث عن جميع المواقع المتعلقة بـ: "${query}". أعط كل النتائج الممكنة.`;

    // Query 3 models in parallel for best coverage
    const models = [
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
    ];

    const allResults = await Promise.all(
      models.map(model => queryModel(LOVABLE_API_KEY, model, userMessage))
    );

    const flatResults = allResults.flat();

    if (flatResults.length === 0) {
      return new Response(JSON.stringify({ error: "No location resolved from any model" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate and rank
    const mergedLocations = deduplicateLocations(flatResults);
    const primary = mergedLocations.find(l => l.is_primary) || mergedLocations[0];

    // Build legacy location object for backward compatibility
    const location = {
      name: primary.name,
      address: primary.address,
      latitude: primary.latitude,
      longitude: primary.longitude,
      location_type: primary.location_type,
      governorate: primary.governorate,
      confidence: primary.confidence,
      suggestions: mergedLocations.filter(l => !l.is_primary).map(l => ({
        name: l.name,
        address: l.address,
        latitude: l.latitude,
        longitude: l.longitude,
        location_type: l.location_type,
        governorate: l.governorate,
        confidence: l.confidence,
      })),
    };

    return new Response(JSON.stringify({
      location,
      all_locations: mergedLocations,
      models_used: models,
      total_raw_results: flatResults.length,
      total_unique_results: mergedLocations.length,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI location error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
