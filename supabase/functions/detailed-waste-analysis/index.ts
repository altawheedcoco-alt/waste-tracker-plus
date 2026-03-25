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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const formData = await req.formData();
    const userDescription = formData.get("description") as string || "";
    
    // Collect all images
    const imageContents: { type: string; image_url: { url: string } }[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image") && value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Image = btoa(binary);
        const mimeType = value.type || "image/jpeg";
        imageContents.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Image}` },
        });
      }
    }

    if (imageContents.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const descriptionContext = userDescription
      ? `\n\nوصف المستخدم للمحتوى: "${userDescription}" - استخدم هذا الوصف كمرجع إضافي لتحسين دقة التحليل والتسعير.`
      : "";

    const imageCountNote = imageContents.length > 1
      ? `\n\nملاحظة: تم رفع ${imageContents.length} صور. قم بتحليل جميع الصور معاً كشحنة واحدة واحسب إجمالي المكونات من كل الصور.`
      : "";

    const prompt = `أنت خبير متخصص في تحليل وتصنيف المخلفات والنفايات وتسعيرها في السوق المصري. حلل هذه الصور بدقة متناهية واستخرج تقريراً تفصيلياً شاملاً.${descriptionContext}${imageCountNote}

أجب بصيغة JSON فقط بالشكل التالي:
{
  "overall_description": "وصف شامل لمحتوى الصور بالعربية (3-5 جمل)",
  "estimated_total_weight_kg": رقم تقديري للوزن الكلي بالكيلوجرام,
  "weight_confidence": "high/medium/low",
  "overall_condition": "جيدة/متوسطة/رديئة/مختلطة",
  "is_hazardous": true/false,
  "hazard_level": "none/low/medium/high/critical",
  "components": [
    {
      "name": "اسم المكون بالعربية (مثلاً: كرتون مموج)",
      "name_en": "Component name in English",
      "waste_type": "نوع المخلف الرئيسي (paper/plastic/metal/organic/glass/construction/chemical/electronic/medical/other)",
      "sub_type": "النوع الفرعي الدقيق",
      "percentage": نسبة مئوية من الحمولة (رقم 0-100),
      "estimated_weight_kg": وزن تقديري بالكيلو,
      "condition": "حالة المكون (نظيف/ملوث/مبلل/جاف/مكسور/مهترئ)",
      "recyclable": true/false,
      "market_value": "high/medium/low/none",
      "color": "لون المكون إن أمكن",
      "notes": "ملاحظات إضافية عن هذا المكون"
    }
  ],
  "contamination": {
    "dirt_percentage": نسبة التراب والأوساخ (رقم 0-100),
    "moisture_percentage": نسبة الرطوبة التقديرية (رقم 0-100),
    "contamination_level": "none/low/medium/high",
    "contamination_details": "تفاصيل التلوث إن وجد"
  },
  "container_info": {
    "type": "نوع الحاوية/وسيلة النقل (شاحنة/حاوية/أكياس/أرضي/بالة/غير محدد)",
    "fill_level_percent": نسبة الامتلاء (رقم 0-100),
    "size_estimate": "تقدير حجم الحاوية"
  },
  "quality_assessment": {
    "overall_grade": "A/B/C/D/F",
    "sorting_quality": "مصنف/شبه مصنف/غير مصنف/مختلط",
    "purity_percentage": نسبة النقاء (رقم 0-100),
    "recommendations": ["توصية 1", "توصية 2"]
  },
  "recycling_potential": {
    "recyclable_percentage": النسبة القابلة لإعادة التدوير (رقم 0-100),
    "estimated_recovery_value": "القيمة التقديرية للاسترداد",
    "best_recycling_method": "أفضل طريقة لإعادة التدوير",
    "disposal_method": "طريقة التخلص المقترحة للأجزاء غير القابلة للتدوير"
  },
  "financial_analysis": {
    "currency": "EGP",
    "components_pricing": [
      {
        "name": "اسم المكون بالعربية",
        "waste_type": "نوع المخلف",
        "estimated_weight_kg": وزن المكون بالكيلو,
        "price_per_ton_egp": سعر الطن الواحد من هذا الصنف بالجنيه المصري (بناءً على أسعار السوق المصري الحالية التقريبية),
        "total_value_egp": القيمة الإجمالية لهذا المكون بالجنيه المصري (الوزن/1000 × سعر الطن),
        "price_source": "مصدر التسعير (سوق محلي/بورصة/تقدير)"
      }
    ],
    "total_estimated_value_egp": إجمالي القيمة المالية لكل المكونات بالجنيه المصري,
    "mixed_ton_price_egp": سعر الطن المختلط (لو كل المخلفات مخلوطة ببعضها كم سعر الطن الواحد بالجنيه المصري),
    "price_per_kg_egp": متوسط سعر الكيلو الواحد بالجنيه المصري,
    "sorted_vs_mixed_premium": "نسبة الفرق بين سعر المصنف وسعر المختلط (مثلاً: الفرز يزيد القيمة 40%)",
    "market_notes": "ملاحظات عن حالة السوق وتأثيرها على الأسعار"
  }
}

تعليمات مهمة:
- حلل كل مكون مرئي في الصور بشكل منفصل
- قدر الأوزان بناءً على الحجم المرئي والكثافة المعروفة لكل مادة
- احسب النسب بدقة بحيث يكون مجموعها 100%
- قدم أسعاراً واقعية بناءً على السوق المصري الحالي لعام 2025-2026
- إذا قدم المستخدم وصفاً، استخدمه لتحسين دقة التعرف والتسعير
- إذا لم تستطع تحديد شيء، استخدم null
- أجب بـ JSON صالح فقط بدون أي نص إضافي أو markdown`;

    const messageContent: any[] = [{ type: "text", text: prompt }, ...imageContents];

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [{ role: "user", content: messageContent }],
      temperature: 0.2,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات، حاول بعد قليل" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      analysis = { error: "فشل في تحليل الاستجابة", raw: content };
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Detailed waste analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
