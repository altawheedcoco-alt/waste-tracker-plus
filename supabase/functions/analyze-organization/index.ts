import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authError } = await supabaseClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      throw new Error("organization_id is required");
    }

    // Fetch organization info
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name, organization_type, licensed_waste_types, wmra_license, wmra_license_expiry_date, environmental_approval_number, env_approval_expiry, land_transport_license, hazardous_certified, commercial_register, environmental_license")
      .eq("id", organization_id)
      .single();

    // Fetch all AI-extracted documents
    const { data: docs } = await supabaseClient
      .from("entity_documents")
      .select("document_type, ocr_extracted_data, ocr_confidence, created_at, tags, title")
      .eq("organization_id", organization_id)
      .eq("ai_extracted", true)
      .order("created_at", { ascending: false })
      .limit(50);

    const documentsData = (docs || []).map((d: any) => ({
      type: d.document_type,
      title: d.title,
      fields: d.ocr_extracted_data?.structured_fields || d.ocr_extracted_data?.detected_fields || {},
      obligations: d.ocr_extracted_data?.obligations || [],
      confidence: d.ocr_confidence,
      date: d.created_at,
    }));

    const prompt = `أنت محلل امتثال بيئي وقانوني متخصص في المنشآت المصرية العاملة في مجال إدارة المخلفات.

بيانات الجهة:
- الاسم: ${org?.name || "غير معروف"}
- النوع: ${org?.organization_type || "غير محدد"}
- ترخيص WMRA: ${org?.wmra_license || "غير متوفر"} (ينتهي: ${org?.wmra_license_expiry_date || "غير محدد"})
- الموافقة البيئية: ${org?.environmental_approval_number || "غير متوفرة"} (تنتهي: ${org?.env_approval_expiry || "غير محدد"})
- ترخيص النقل البري: ${org?.land_transport_license || "غير متوفر"}
- مرخص للمخلفات الخطرة: ${org?.hazardous_certified ? "نعم" : "لا"}
- السجل التجاري: ${org?.commercial_register || "غير متوفر"}
- أنواع المخلفات المرخصة: ${(org?.licensed_waste_types || []).join("، ") || "غير محدد"}

المستندات المستخرجة بالذكاء الاصطناعي (${documentsData.length} مستند):
${JSON.stringify(documentsData, null, 2)}

قم بتحليل شامل ومفصل للجهة يتضمن:

1. **ملخص تنفيذي**: وصف شامل للجهة ونشاطها (3-5 جمل)
2. **حالة التراخيص والتصاريح**: كل ترخيص مع حالة الصلاحية وتواريخ الإصدار والانتهاء
3. **تحليل الامتثال البيئي**: مدى التزام الجهة بالقوانين البيئية المصرية (قانون 202 لسنة 2020 و4 لسنة 1994)
4. **الاشتراطات والالتزامات**: كل الاشتراطات المستخرجة من الوثائق ومدى استيفائها
5. **أنواع المخلفات المرخصة**: تفصيل المخلفات المرخص بالتعامل معها
6. **تحليل المخاطر**: المخاطر القانونية والبيئية والتشغيلية مع مستوى كل خطر
7. **المستندات الناقصة**: أي وثائق مطلوبة وغير متوفرة
8. **التوصيات**: توصيات مفصلة وقابلة للتنفيذ لتحسين الامتثال
9. **درجة الامتثال الإجمالية**: من 100 مع تفصيل المعايير

أجب بصيغة JSON فقط:
{
  "executive_summary": "ملخص تنفيذي شامل",
  "compliance_score": 75,
  "risk_level": "medium",
  "licenses": [
    {"name": "اسم الترخيص", "number": "الرقم", "status": "valid|expired|missing", "issue_date": "", "expiry_date": "", "notes": ""}
  ],
  "environmental_compliance": {
    "score": 80,
    "details": "تفاصيل الامتثال البيئي",
    "laws_referenced": ["قانون 202 لسنة 2020"]
  },
  "obligations": [
    {"text": "نص الاشتراط", "status": "fulfilled|pending|unknown", "source_document": ""}
  ],
  "waste_types_analysis": {
    "licensed_types": ["نوع 1"],
    "notes": "ملاحظات"
  },
  "risks": [
    {"category": "legal|environmental|operational", "description": "وصف الخطر", "severity": "high|medium|low", "mitigation": "إجراء التخفيف"}
  ],
  "missing_documents": ["مستند 1", "مستند 2"],
  "recommendations": [
    {"priority": "high|medium|low", "action": "الإجراء المطلوب", "deadline": "الموعد المقترح", "impact": "الأثر المتوقع"}
  ],
  "scoring_breakdown": {
    "licenses_valid": 20,
    "environmental_compliance": 20,
    "documentation_complete": 20,
    "obligations_met": 20,
    "risk_management": 20
  }
}`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");

    const response = await callAIWithRetry(LOVABLE_API_KEY!, {
      messages: [
        { role: "system", content: "أنت محلل امتثال بيئي وقانوني متخصص. أجب دائماً بصيغة JSON فقط." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis result");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Organization analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "حدث خطأ في التحليل",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
