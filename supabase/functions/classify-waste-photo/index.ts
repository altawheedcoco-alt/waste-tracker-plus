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

    const { image, shipmentId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `أنت خبير تصنيف مخلفات معتمد وفقاً لقانون إدارة المخلفات المصري رقم 202/2020 واتفاقية بازل الدولية.

مهمتك: حلل صورة المخلفات وصنفها بدقة.

يجب أن تجيب بـ JSON فقط بالتنسيق التالي:
{
  "is_hazardous": true/false,
  "waste_category": "الفئة الرئيسية (مثل: نفايات صناعية، نفايات طبية، نفايات إلكترونية، مخلفات بناء، بلاستيك، معادن، ورق، عضوية)",
  "waste_subcategory": "الفئة الفرعية التفصيلية",
  "basel_code": "كود بازل المناسب (مثل Y1-Y45 للخطرة أو B1010-B4030 لغير الخطرة)",
  "risk_level": "low/medium/high/critical",
  "handling_instructions": ["تعليمة 1", "تعليمة 2", "تعليمة 3"],
  "ppe_required": ["قفازات واقية", "كمامة", "نظارات حماية"],
  "transport_requirements": ["متطلب نقل 1", "متطلب نقل 2"],
  "confidence": 85,
  "egyptian_law_ref": "المادة المرجعية من القانون"
}

قواعد التصنيف:
- المخلفات الطبية (إبر، ضمادات ملوثة، أدوية) = خطرة، حرج
- المخلفات الكيميائية (زيوت، مذيبات، بطاريات) = خطرة، مرتفع
- المخلفات الإلكترونية (شاشات، لوحات إلكترونية) = خطرة، متوسط
- مخلفات البناء (أنقاض، خرسانة) = غير خطرة، منخفض
- البلاستيك والورق والمعادن القابلة للتدوير = غير خطرة، منخفض
- النفايات العضوية (طعام) = غير خطرة، منخفض
- الإطارات المستعملة = غير خطرة، متوسط
- الأسبستوس = خطرة، حرج`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "صنّف هذه المخلفات بدقة وفقاً للمعايير المصرية والدولية" },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          is_hazardous: false, waste_category: "غير محدد", waste_subcategory: "يتطلب فحص يدوي",
          basel_code: "N/A", risk_level: "medium", handling_instructions: ["فحص يدوي مطلوب"],
          ppe_required: ["قفازات واقية"], transport_requirements: ["التعامل بحذر"],
          confidence: 0, egyptian_law_ref: "تجاوز حد الطلبات"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      parsed = {
        is_hazardous: false, waste_category: "غير محدد", waste_subcategory: content.slice(0, 100),
        basel_code: "N/A", risk_level: "medium", handling_instructions: ["فحص يدوي مطلوب"],
        ppe_required: ["قفازات واقية"], transport_requirements: [],
        confidence: 30, egyptian_law_ref: "يتطلب مراجعة"
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("classify-waste-photo error:", error);
    return new Response(JSON.stringify({
      is_hazardous: false, waste_category: "خطأ في التصنيف", waste_subcategory: "يرجى المحاولة لاحقاً",
      basel_code: "N/A", risk_level: "medium", handling_instructions: ["التعامل بحذر حتى التصنيف اليدوي"],
      ppe_required: ["قفازات واقية"], transport_requirements: [],
      confidence: 0, egyptian_law_ref: "غير متاح"
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
