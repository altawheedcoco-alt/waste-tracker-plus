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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Image = btoa(binary);
    const mimeType = imageFile.type || "image/jpeg";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `أنت خبير متخصص في تحليل وتصنيف المخلفات والنفايات. حلل هذه الصورة بدقة متناهية واستخرج تقريراً تفصيلياً شاملاً.

أجب بصيغة JSON فقط بالشكل التالي:
{
  "overall_description": "وصف شامل لمحتوى الصورة بالعربية (3-5 جمل)",
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
  }
}

تعليمات مهمة:
- حلل كل مكون مرئي في الصورة بشكل منفصل
- قدر الأوزان بناءً على الحجم المرئي والكثافة المعروفة لكل مادة
- احسب النسب بدقة بحيث يكون مجموعها 100%
- إذا لم تستطع تحديد شيء، استخدم null
- أجب بـ JSON صالح فقط بدون أي نص إضافي أو markdown`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
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
