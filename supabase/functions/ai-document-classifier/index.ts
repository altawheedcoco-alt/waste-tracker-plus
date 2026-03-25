import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ClassificationResult {
  document_type: string;
  confidence: number;
  extracted_data: Record<string, any>;
  suggested_folder: string;
  tags: string[];
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const _authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: _claims, error: _authError } = await _authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (_authError || !_claims?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageBase64, fileName, mimeType } = await req.json();

    if (!imageBase64) {
      throw new Error("imageBase64 is required");
    }

    const systemPrompt = `أنت نظام ذكي متخصص في تصنيف المستندات لشركات إدارة النفايات.

أنواع المستندات التي تتعامل معها:
1. **تذاكر الوزن (weight_ticket)**: إيصالات الموازين، تذاكر الشحن
2. **الفواتير (invoice)**: فواتير البيع والشراء، كشوف الحساب
3. **العقود (contract)**: عقود النقل، اتفاقيات الخدمة، خطابات الترسية
4. **التراخيص (license)**: تراخيص بيئية، رخص مزاولة، شهادات موام
5. **صور المركبات (vehicle_photo)**: صور الشاحنات، لوحات السيارات
6. **صور النفايات (waste_photo)**: صور المخلفات للتصنيف
7. **إثبات الهوية (identity)**: بطاقات هوية، رخص قيادة
8. **مستندات مالية (financial)**: إيصالات إيداع، كشوف بنكية
9. **تقارير (report)**: تقارير بيئية، تقارير تشغيلية
10. **أخرى (other)**: مستندات غير مصنفة

مهمتك:
1. تحديد نوع المستند بدقة
2. استخراج البيانات الرئيسية من المستند
3. اقتراح مجلد التخزين المناسب
4. إنشاء وسوم للبحث السريع
5. كتابة ملخص موجز للمستند`;

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY!, {
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `قم بتصنيف هذا المستند واستخراج البيانات منه.
              
اسم الملف: ${fileName || "غير معروف"}
نوع الملف: ${mimeType || "غير معروف"}

أجب بصيغة JSON فقط بالشكل التالي:
{
  "document_type": "نوع المستند (من القائمة أعلاه)",
  "confidence": 95,
  "extracted_data": {
    "حقول المستند المستخرجة"
  },
  "suggested_folder": "اقتراح مجلد التخزين",
  "tags": ["وسم1", "وسم2"],
  "summary": "ملخص موجز للمستند"
}`
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse classification result");
    }

    const result: ClassificationResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Document classifier error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "حدث خطأ في التصنيف" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
