import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `أنت مساعد ذكي متخصص في تحديد المواقع الجغرافية في مصر.
المستخدم سيرسل لك وصفاً لموقع بالعربية أو الإنجليزية. يجب أن تُعيد:
1. الاسم الكامل للموقع بالعربية
2. العنوان التفصيلي
3. الإحداثيات الجغرافية (latitude, longitude) بدقة عالية
4. نوع الموقع (مصنع، شركة، منطقة صناعية، حي، شارع، مدينة، إلخ)
5. المحافظة

إذا لم تتمكن من تحديد الموقع بدقة، أعط أقرب تقدير ممكن مع ذكر ذلك.
ركز على مصر والمنطقة العربية. استخدم معرفتك بالمناطق الصناعية والمصانع والشركات المصرية.`;

    const userMessage = context 
      ? `حدد موقع: "${query}" (سياق إضافي: ${context})`
      : `حدد موقع: "${query}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [{
          type: "function",
          function: {
            name: "resolve_location",
            description: "Return resolved location data with coordinates",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "اسم الموقع بالعربية" },
                address: { type: "string", description: "العنوان التفصيلي" },
                latitude: { type: "number", description: "خط العرض" },
                longitude: { type: "number", description: "خط الطول" },
                location_type: { type: "string", description: "نوع الموقع" },
                governorate: { type: "string", description: "المحافظة" },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "مستوى الثقة في الإحداثيات" },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      address: { type: "string" },
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                    },
                    required: ["name", "address", "latitude", "longitude"],
                  },
                  description: "مواقع بديلة محتملة إذا كان هناك غموض",
                },
              },
              required: ["name", "address", "latitude", "longitude", "location_type", "governorate", "confidence"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "resolve_location" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No location resolved" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const location = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ location }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI location error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
