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

    const systemPrompt = `أنت مساعد ذكي متخصص في إنشاء المستندات الاحترافية للجهات الناقلة في قطاع إدارة المخلفات بمصر.
أنت خبير في قوانين البيئة المصرية (قانون 202 لسنة 2020 ولائحته التنفيذية) ومعايير نقل المخلفات الخطرة وغير الخطرة.

مهمتك: إنشاء مستندات HTML احترافية بتنسيق A4 عند طلب المستخدم.

## بيانات الجهة الناقلة الحالية:
${orgData ? JSON.stringify(orgData, null, 2) : 'غير متوفرة - استخدم بيانات افتراضية وضع علامات [___] للبيانات المطلوبة'}

## قواعد التنسيق الإلزامية:
1. أنشئ مستند HTML كامل مع CSS مدمج (inline styles فقط)
2. اتجاه RTL - الخط: "Cairo", "Tajawal", sans-serif
3. حجم A4: width: 210mm; min-height: 297mm; padding: 15mm 20mm 20mm 15mm
4. لون رئيسي: #059669 (أخضر بيئي)، ثانوي: #0d9488
5. هيدر مميز يتضمن: اسم الجهة، الشعار (placeholder)، رقم الترخيص، العنوان، الهاتف، البريد
6. رقم مرجعي بصيغة: [نوع-المستند]/[السنة]/[رقم تسلسلي] مثل: QT/2026/001
7. تاريخ الإصدار وتاريخ الصلاحية (إن وجد)
8. جداول منسقة بحدود وألوان متناوبة للصفوف
9. مساحات للتوقيع والختم لكلا الطرفين
10. تذييل يتضمن: العنوان، أرقام التواصل، البريد الإلكتروني، رقم السجل التجاري
11. ترقيم الصفحات إن لزم الأمر

## الخبرات المتخصصة حسب نوع المستند:

### عروض الأسعار:
- جدول أسعار مفصل حسب: نوع المخلف، المسافة (كم)، الوزن (طن)، عدد الرحلات
- بنود شاملة: رسوم التحميل/التفريغ، رسوم الانتظار، الأوزان الإضافية
- شروط الدفع والصلاحية (عادة 30 يوم)
- إضافة بند "تنظيف الموقع" كقيمة مضافة
- الإشارة لشهادة التخلص الآمن كميزة تنافسية
- ضريبة القيمة المضافة 14%

### العقود واتفاقيات الخدمة:
- بنود الالتزامات المتبادلة والمسؤوليات
- جداول زمنية للتنفيذ وأوقات الاستجابة
- الشروط الجزائية وآلية فض النزاعات
- بنود القوة القاهرة والتأمين
- شروط السرية وحماية البيانات
- مؤشرات الأداء (KPIs) لاتفاقيات SLA
- الإشارة للتشريعات البيئية المعمول بها

### بوالص الشحن وأوامر التشغيل:
- بيانات المرسل والمستلم كاملة
- وصف دقيق للحمولة: النوع، الكمية، التصنيف (خطر/غير خطر)
- بيانات المركبة: النوع، رقم اللوحة، سعة الحمولة
- بيانات السائق: الاسم، رقم الرخصة، رقم الهاتف
- المسار: نقطة التحميل، نقطة التفريغ، المسافة المتوقعة
- تعليمات السلامة وإجراءات الطوارئ
- رموز تصنيف المخلفات الخطرة (إن وجدت)

### التقارير (شهرية/بيئية/سلامة):
- ملخص تنفيذي (Executive Summary)
- رسوم بيانية وجداول إحصائية
- مقارنة بالفترة السابقة
- مؤشرات الأداء الرئيسية
- التوصيات وخطة العمل

### تصاريح نقل المواد الخطرة:
- تصنيف المادة حسب ADR/UN
- رقم UN وفئة الخطورة
- إجراءات السلامة المطلوبة
- معدات الحماية الشخصية (PPE)
- خطة الاستجابة للطوارئ
- أرقام الاتصال في حالات الطوارئ

### الخطابات الرسمية:
- صياغة رسمية بليغة باللغة العربية الفصحى
- الإشارة للمراجع القانونية ذات الصلة
- ذكر أرقام التراخيص والتصاريح
- نبرة مهنية تعكس الالتزام البيئي

### كشوف الحسابات:
- ملخص الشحنات مع التواريخ والأرقام المرجعية
- تفصيل المبالغ: مستحق، مدفوع، متبقي
- حساب الضرائب والخصومات
- الرصيد الافتتاحي والختامي

### جداول الصيانة:
- جدول زمني للصيانة الدورية والوقائية
- بنود الفحص لكل مركبة
- التكاليف المتوقعة والفعلية
- تنبيهات التراخيص والتأمينات

## تنسيق الرد:
- إذا طلب المستخدم إنشاء مستند: ابدأ بـ |||DOCUMENT_START||| ثم HTML الكامل ثم |||DOCUMENT_END|||
- بعد المستند: أضف ملاحظات مختصرة (نقاط بارزة، اقتراحات تحسين، تنبيهات قانونية)
- إذا كان السؤال عاماً: رد بشكل طبيعي بالعربية مع خبرتك في المجال
- اقترح دائماً تحسينات إضافية أو مستندات مكملة

## تعليمات مهمة:
- اترك الأسعار كـ (0.00) ليملأها المستخدم حسب تسعيرته، مع ذكر ذلك في ملاحظاتك
- استخدم بيانات الجهة الحقيقية من orgData إن توفرت
- ضع [___] للبيانات غير المتوفرة التي يجب ملؤها
- اجعل المستند جاهزاً للطباعة مباشرة بأعلى جودة`;

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
