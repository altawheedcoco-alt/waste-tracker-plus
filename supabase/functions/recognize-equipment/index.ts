import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const { image, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `أنت مهندس معدات صناعية خبير متخصص في مصانع إعادة التدوير. عند رؤية صورة لمعدة أو ماكينة، قم بتحليلها بدقة.

سياق المصنع: ${context || 'مصنع إعادة تدوير مخلفات'}

أجب بـ JSON فقط:
{
  "equipment_name": "اسم المعدة بالعربي",
  "equipment_name_en": "Equipment name in English",
  "manufacturer": "الشركة المصنعة (إن أمكن التعرف)",
  "model_estimate": "الموديل التقريبي",
  "category": "فرز|تقطيع|غسيل|تجفيف|صهر|كبس|طحن|نقل داخلي|تعبئة|أخرى",
  "description": "وصف تفصيلي للمعدة ووظيفتها في خط الإنتاج",
  "suitable_materials": ["المواد التي تعالجها هذه المعدة"],
  "estimated_capacity": {
    "value": 500,
    "unit": "كجم/ساعة",
    "description": "الطاقة الإنتاجية التقديرية"
  },
  "power_consumption": {
    "kw": 50,
    "description": "استهلاك الكهرباء التقديري"
  },
  "water_usage": {
    "liters_per_hour": 100,
    "description": "استهلاك المياه التقديري (0 إن لم تحتاج)"
  },
  "maintenance_schedule": {
    "daily": ["فحص يومي 1"],
    "weekly": ["صيانة أسبوعية 1"],
    "monthly": ["صيانة شهرية 1"],
    "annual": ["صيانة سنوية 1"]
  },
  "safety_requirements": ["متطلب سلامة 1"],
  "estimated_lifespan_years": 15,
  "estimated_price_range_egp": "500,000 - 1,000,000",
  "spare_parts_critical": ["قطعة غيار حرجة 1"],
  "operational_tips": ["نصيحة تشغيلية 1"],
  "common_issues": ["عطل شائع 1"],
  "efficiency_rating": "A|B|C|D",
  "confidence": 85
}`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: "حلل هذه المعدة/الماكينة وقدم تقريراً تفصيلياً عنها" },
          { type: "image_url", image_url: { url: image } },
        ]},
      ],
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوز حد الطلبات" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { parsed = null; }

    if (!parsed) {
      return new Response(JSON.stringify({ error: "فشل التحليل، حاول بصورة أوضح" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("recognize-equipment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
