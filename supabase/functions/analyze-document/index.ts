import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageBase64, fileName, mimeType, analysisType, context } = await req.json();

    if (!imageBase64) {
      throw new Error("imageBase64 is required");
    }

    const startTime = Date.now();

    const systemPrompt = `أنت نظام ذكاء اصطناعي متقدم لتحليل المستندات في منصة إدارة النفايات والتدوير.
لديك 4 قدرات أساسية تقوم بها جميعاً في تحليل واحد شامل:

## 1. التصنيف الذكي
صنّف المستند إلى أحد الأنواع:
- weight_ticket: تذاكر وزن / إيصالات موازين
- invoice: فواتير / كشوف حساب
- contract: عقود / اتفاقيات
- award_letter: خطابات ترسية / أوامر شراء
- license: تراخيص بيئية / رخص مزاولة
- certificate: شهادات تدوير / شهادات بيئية
- receipt: إيصالات استلام / تسليم
- delivery_declaration: إقرارات تسليم
- vehicle_document: مستندات مركبات / رخص سير
- identity_document: بطاقات هوية / رخص قيادة
- financial_statement: كشوف بنكية / تقارير مالية
- environmental_report: تقارير بيئية
- photo_evidence: صور إثبات / صور موازين
- correspondence: مراسلات رسمية
- other: أخرى

## 2. استخراج البيانات
استخرج كل البيانات المهيكلة من المستند:
- الأرقام المرجعية والتسلسلية
- التواريخ والمبالغ
- الأسماء والعناوين
- أرقام الهواتف والبريد الإلكتروني
- الأوزان والكميات
- أي بيانات جدولية

## 3. الملخص الذكي
اكتب ملخصاً شاملاً ومفيداً بالعربية (3-5 جمل) يوضح:
- ما هو المستند ومن أصدره
- المحتوى الرئيسي والغرض
- أي تواريخ أو مبالغ مهمة

## 4. تحليل المخاطر والامتثال
قيّم المستند من حيث:
- صلاحية المستند (هل منتهي الصلاحية؟)
- اكتمال البيانات المطلوبة
- التوافق مع المتطلبات البيئية والقانونية المصرية
- وجود أختام وتوقيعات
- مستوى المخاطرة (low/medium/high/critical)
- درجة الامتثال من 100

أجب بصيغة JSON فقط:
{
  "classification": {
    "document_type": "النوع",
    "confidence": 95,
    "suggested_folder": "المجلد المقترح"
  },
  "extracted_data": {
    "reference_number": "",
    "date": "",
    "amount": null,
    "parties": [],
    "weights": [],
    "other_fields": {}
  },
  "summary": "ملخص شامل بالعربية",
  "risk_analysis": {
    "risk_level": "low|medium|high|critical",
    "compliance_score": 85,
    "checks": [
      {"name": "اسم الفحص", "passed": true, "details": "التفاصيل"}
    ],
    "recommendations": ["توصية 1", "توصية 2"]
  },
  "tags": ["وسم1", "وسم2", "وسم3"]
}`;

    const userContent: any[] = [
      {
        type: "text",
        text: `حلل هذا المستند تحليلاً شاملاً.
اسم الملف: ${fileName || "غير معروف"}
نوع الملف: ${mimeType || "غير معروف"}
${context ? `السياق: ${context}` : ""}
${analysisType ? `نوع التحليل المطلوب: ${analysisType}` : "تحليل شامل (تصنيف + استخراج + ملخص + مخاطر)"}

أجب بصيغة JSON فقط.`
      },
    ];

    // Support both image and text-based documents
    if (imageBase64.startsWith("data:") || imageBase64.startsWith("http")) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 }
      });
    }

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("فشل في تحليل استجابة الذكاء الاصطناعي");
    }

    const result = JSON.parse(jsonMatch[0]);
    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      duration_ms: duration,
      model: "gemini-3-flash-preview"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Document analysis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "حدث خطأ في تحليل المستند" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
