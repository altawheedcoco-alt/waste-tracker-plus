import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, documentType, orgData } = await req.json();

    const systemPrompt = `أنت مساعد ذكي متخصص في إنشاء المستندات الاحترافية لقطاع إدارة المخلفات في مصر.

مهمتك: عندما يطلب المستخدم إنشاء مستند (عرض سعر، خطاب رسمي، إعلان، تقرير، عقد، إلخ)، قم بإنشاء مستند HTML كامل بتنسيق A4 احترافي ومبهر.

## قواعد التنسيق:
1. أنشئ مستند HTML كامل مع CSS مدمج (inline styles)
2. استخدم اتجاه RTL للعربية
3. حجم الصفحة A4 (210mm × 297mm)
4. استخدم ألوان احترافية: أخضر (#059669) كلون رئيسي
5. أضف هيدر يتضمن اسم الجهة وبياناتها
6. أضف تذييل يتضمن العنوان والهاتف والبريد
7. استخدم جداول منسقة وعناوين واضحة
8. أضف أرقام مرجعية وتواريخ
9. أضف مساحة للتوقيع والختم
10. اجعل التصميم مبهراً واحترافياً

## بيانات الجهة الحالية:
${orgData ? JSON.stringify(orgData, null, 2) : 'غير متوفرة'}

## تنسيق الرد:
- إذا طلب المستخدم إنشاء مستند، ابدأ ردك بـ |||DOCUMENT_START||| ثم كود HTML الكامل ثم |||DOCUMENT_END|||
- بعد المستند، أضف شرح مختصر لما تم إنشاؤه
- إذا كان السؤال عام (ليس طلب مستند)، رد بشكل طبيعي بالعربية
- يمكنك اقتراح تحسينات أو بدائل

## أنواع المستندات المدعومة:
- عروض أسعار (Quotations)
- خطابات رسمية (Official Letters)
- إعلانات (Announcements)
- تقارير (Reports)
- عقود (Contracts)
- فواتير أولية (Proforma Invoices)
- شهادات (Certificates)
- مذكرات داخلية (Internal Memos)
- خطابات ضمان (Guarantee Letters)
- أي مستند آخر يطلبه المستخدم`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-document-studio error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
