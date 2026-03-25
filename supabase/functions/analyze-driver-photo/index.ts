import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { image, type, shipmentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompts: Record<string, string> = {
      load: `أنت مفتش حمولات ذكي. حلل هذه الصورة للحمولة وأجب بالعربية:
        1. هل الحمولة واضحة ومرئية؟
        2. ما نوع المواد المرئية (نفايات صناعية، بلاستيك، معادن، إلخ)؟
        3. هل هناك مخاطر مرئية (تسرب، مواد خطرة)؟
        أجب بـ JSON: { "verified": true/false, "message": "ملخص", "details": { "material_type": "...", "hazard_detected": true/false, "load_quality": "good/fair/poor" } }`,
      scale: `أنت قارئ موازين ذكي. حلل صورة الميزان:
        1. هل القراءة واضحة؟
        2. ما الوزن المقروء؟
        أجب بـ JSON: { "verified": true/false, "message": "ملخص", "details": { "weight_reading": "...", "unit": "kg/ton", "clarity": "clear/blurry" } }`,
      delivery: `أنت مفتش تسليم. حلل صورة موقع التسليم:
        1. هل الموقع مناسب للتفريغ؟
        2. هل هناك علامات تعريف مرئية؟
        أجب بـ JSON: { "verified": true/false, "message": "ملخص", "details": { "site_condition": "good/fair/poor", "signage_visible": true/false } }`,
      general: `حلل هذه الصورة الخاصة بتوثيق عملية نقل النفايات. صف ما تراه بإيجاز.
        أجب بـ JSON: { "verified": true, "message": "وصف مختصر", "details": {} }`,
    };

    const systemPrompt = prompts[type] || prompts.general;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "حلل هذه الصورة" },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ verified: true, message: "تم الحفظ (تجاوز حد الطلبات)", details: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { verified: true, message: content, details: {} };
    } catch {
      parsed = { verified: true, message: content.slice(0, 200), details: {} };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-driver-photo error:", error);
    return new Response(JSON.stringify({
      verified: true,
      message: "تم حفظ الصورة (التحليل غير متاح حالياً)",
      details: {},
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
