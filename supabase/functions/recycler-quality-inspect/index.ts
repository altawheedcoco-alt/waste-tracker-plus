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

    const { image, wasteType, sourceDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `أنت مفتش جودة خبير في مواد التدوير بمصنع إعادة تدوير المخلفات. مهمتك فحص المواد الواردة وتحديد:
1. نسبة النقاء (مدى خلو المادة من الشوائب)
2. مدى صلاحيتها لإعادة التدوير
3. المنتجات النهائية الممكنة مع قيود السلامة
4. مخاطر التلوث المتبادل

⚠️ قواعد سلامة حرجة:
- بلاستيك ملوث بزيوت أو كيماويات = ممنوع تدويره لأغراض غذائية
- بلاستيك طبي = ممنوع تدويره نهائياً، يجب حرقه
- معادن ملوثة بإشعاع = رفض فوري
- ورق ملوث بمواد كيميائية = تدوير صناعي فقط
- زجاج ملوث = تدوير لمواد بناء فقط

أجب بـ JSON فقط:
{
  "material_type": "نوع المادة الأساسي",
  "purity_percentage": 85,
  "moisture_percentage": 5,
  "contamination_level": "none|low|medium|high|critical",
  "contaminants_found": ["شائبة 1", "شائبة 2"],
  "is_recyclable": true,
  "recyclable_grade": "A|B|C|D|rejected",
  "rejection_reason": "سبب الرفض إن وجد أو null",
  "safe_end_products": [
    {"product": "اسم المنتج", "safety_level": "food_grade|industrial|construction|rejected", "notes": "ملاحظات السلامة"}
  ],
  "unsafe_end_products": [
    {"product": "منتج ممنوع", "reason": "سبب المنع"}
  ],
  "estimated_yield_percentage": 75,
  "estimated_market_value_per_ton_egp": 5000,
  "processing_method": "طريقة المعالجة المقترحة",
  "processing_temperature": "درجة الحرارة المطلوبة",
  "quality_recommendations": ["توصية 1", "توصية 2"],
  "safety_warnings": ["تحذير 1"],
  "confidence": 90,
  "egyptian_standard_ref": "المرجع القياسي المصري"
}`;

    const userContent: any[] = [
      { type: "text", text: `افحص هذه المادة الواردة لمصنع التدوير.\nنوع المخلف المُعلن: ${wasteType || 'غير محدد'}\nوصف إضافي: ${sourceDescription || 'لا يوجد'}` },
      { type: "image_url", image_url: { url: image } },
    ];

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوز حد الطلبات، حاول لاحقاً" }), {
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
    } catch {
      parsed = null;
    }

    if (!parsed) {
      parsed = {
        material_type: "غير محدد", purity_percentage: 0, moisture_percentage: 0,
        contamination_level: "high", contaminants_found: [], is_recyclable: false,
        recyclable_grade: "rejected", rejection_reason: "فشل التحليل الآلي - يتطلب فحص يدوي",
        safe_end_products: [], unsafe_end_products: [],
        estimated_yield_percentage: 0, estimated_market_value_per_ton_egp: 0,
        processing_method: "فحص يدوي مطلوب", processing_temperature: "N/A",
        quality_recommendations: ["إجراء فحص يدوي"], safety_warnings: ["لا تعالج حتى الفحص اليدوي"],
        confidence: 0, egyptian_standard_ref: "غير متاح"
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("recycler-quality-inspect error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
