import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRelevantKnowledge } from "./knowledge-base.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Detect document type from the user's message
 */
function detectDocumentType(messages: { role: string; content: string }[]): string | undefined {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content?.toLowerCase() || '';

  const patterns: [RegExp, string][] = [
    [/عرض\s*سعر|تسعير|quotation|price/i, 'quotation'],
    [/فاتور[ةه]\s*(أولية|مبدئية)|proforma/i, 'proforma'],
    [/كشف\s*حساب|statement|مالي/i, 'statement'],
    [/اتفاقي[ةه]\s*مستوى|sla|مؤشرات\s*أداء/i, 'sla'],
    [/ملحق\s*عقد|addendum|تعديل\s*عقد/i, 'addendum'],
    [/عقد|contract|اتفاقي[ةه]/i, 'contract'],
    [/خطاب\s*ضمان|guarantee/i, 'guarantee'],
    [/خطاب|letter|مراسل[ةه]|مخاطب[ةه]/i, 'letter'],
    [/تقرير\s*(سلام[ةه]|صح[ةه])|safety/i, 'safety_report'],
    [/تقرير\s*(بيئ|esg|أثر|carbon|كربون)/i, 'environmental'],
    [/تقرير|report|إحصا/i, 'report'],
    [/أمر\s*تشغيل|work\s*order|مهم[ةه]\s*نقل/i, 'work_order'],
    [/بوليص[ةه]|bill\s*of\s*lading|شحن/i, 'bill_of_lading'],
    [/تصريح\s*نقل\s*خطر|hazmat|مواد\s*خطر/i, 'hazmat_permit'],
    [/صيان[ةه]|maintenance|أسطول/i, 'maintenance'],
    [/سياس[ةه]|policy|إجرا[ءئ]ات\s*داخلي/i, 'policy'],
    [/مذكر[ةه]\s*داخلي|memo|تعميم/i, 'memo'],
    [/شهاد[ةه]\s*(إتمام|تخلص|completion)/i, 'certificate'],
    [/إعلان|announcement|تسويق/i, 'announcement'],
    [/جدول\s*صيان/i, 'maintenance'],
  ];

  for (const [regex, type] of patterns) {
    if (regex.test(lastUserMsg)) return type;
  }
  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, documentType, orgData } = await req.json();

    // Auto-detect document type from conversation
    const detectedType = documentType || detectDocumentType(messages);
    
    // Get relevant knowledge based on document type
    const knowledge = getRelevantKnowledge(detectedType);

    const systemPrompt = `أنت مساعد ذكي متخصص في إنشاء المستندات الاحترافية للجهات الناقلة في قطاع إدارة المخلفات بمصر.
أنت خبير في قوانين البيئة المصرية (قانون 202 لسنة 2020 ولائحته التنفيذية) ومعايير نقل المخلفات الخطرة وغير الخطرة.
لديك قاعدة معرفة شاملة تتضمن التشريعات والقوالب والبنود القانونية والمصطلحات الفنية.

## بيانات الجهة الناقلة الحالية:
${orgData ? JSON.stringify(orgData, null, 2) : 'غير متوفرة - استخدم بيانات افتراضية وضع علامات [___] للبيانات المطلوبة'}

## قاعدة المعرفة المرجعية:
${knowledge}

## قواعد التنسيق الإلزامية:
1. أنشئ مستند HTML كامل مع CSS مدمج (inline styles فقط)
2. اتجاه RTL - الخط: "Cairo", "Tajawal", sans-serif
3. حجم A4: width: 210mm; min-height: 297mm; padding: 15mm 20mm 20mm 15mm
4. لون رئيسي: #059669 (أخضر بيئي)، ثانوي: #0d9488
5. هيدر احترافي: اسم الجهة، رقم الترخيص، العنوان، الهاتف، البريد
6. رقم مرجعي مناسب لنوع المستند
7. تاريخ الإصدار وتاريخ الصلاحية
8. جداول منسقة مع ألوان متناوبة وحدود واضحة
9. مساحات التوقيع والختم لكل الأطراف
10. تذييل كامل بالبيانات ورقم الصفحة
11. تصميم احترافي مبهر جاهز للطباعة

## تعليمات حاسمة:
- استخدم بنود وصيغ من قاعدة المعرفة - لا تخترع بنود عشوائية
- أشر للمواد القانونية المناسبة من القانون 202/2020
- اترك الأسعار والمبالغ كـ (0.00) مع ذكر ذلك في ملاحظاتك
- ضع [___] للبيانات المتغيرة التي يملأها المستخدم
- استخدم المصطلحات الفنية الصحيحة من المعجم
- عند إنشاء عقد: استخدم البنود القانونية الكاملة
- عند إنشاء تقرير: استخدم هيكل التقرير ومؤشرات الأداء
- عند إنشاء بوليصة شحن: استخدم الحقول الإلزامية كاملة

## تنسيق الرد:
- مستند: |||DOCUMENT_START||| [HTML كامل] |||DOCUMENT_END|||
- بعد المستند: ملاحظات مختصرة (نقاط بارزة، مراجع قانونية، اقتراحات)
- سؤال عام: رد بخبرة المجال بالعربية`;

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
