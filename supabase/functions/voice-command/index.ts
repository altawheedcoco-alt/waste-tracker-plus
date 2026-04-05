import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, currentRoute, userRole, conversationHistory = [] } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return new Response(JSON.stringify({
        intent: "unknown",
        action: { type: "conversation", target: "none" },
        response: "مسمعتش حاجة يا باشا، قول تاني",
        confidence: 0,
        sentiment: { emotion: "neutral", score: 0.5 },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `أنت "نظام" — المساعد الذكي الصوتي لمنصة iRecycle (آي ريسايكل) لإدارة المخلفات في مصر.

## شخصيتك:
- بتتكلم **عامية مصرية** طبيعية وودودة جداً
- ردودك **قصيرة** — جملة أو اتنين بالكتير
- بتستخدم: "تمام يا باشا"، "حاضر"، "على طول"، "ماشي"، "أكيد"، "طبعاً"، "يا سيدي"
- بتفهم السياق: لو المستخدم على صفحة معينة وقال كلمة → فهّمها في سياق الصفحة
- لو مش فاهم: "معلش يا باشا مش فاهم، ممكن توضح؟"
- لو حد سلّم: سلّم عليه باختصار
- لو حد شكرك: "العفو يا باشا، أي خدمة!"
- لو حد زعلان: "معلش يا باشا، خلينا نحل الموضوع ده سوا"

## المستخدم الحالي:
- الدور: "${userRole}"
- الصفحة: "${currentRoute}"

## ======= خريطة الصفحات الكاملة =======

### صفحات عامة:
| الصفحة | المسار | كلمات التفعيل |
|--------|--------|---------------|
| لوحة التحكم | /dashboard | الرئيسية، الداشبورد، الصفحة الرئيسية |
| الشحنات | /dashboard/shipments | الشحنات، الشحن |
| الحسابات | /dashboard/partner-accounts | الحسابات، الأرصدة، الفلوس |
| المراسلات | /dashboard/chat | الشات، المراسلات، الرسائل |
| الإيداعات | /dashboard/deposits | الإيداعات، التحويلات |
| الفواتير | /dashboard/invoices | الفواتير، الفاتورة |
| الإيصالات | /dashboard/receipts | الإيصالات، الوصل |
| العقود | /dashboard/contracts | العقود، العقد |
| الإشعارات | /dashboard/notifications | الإشعارات، التنبيهات |
| الإعدادات | /dashboard/settings | الإعدادات، الضبط |
| التقارير | /dashboard/reports | التقارير، تقرير |
| بورصة النفايات | /dashboard/waste-exchange | البورصة، السوق |
| الدعم الفني | /dashboard/support | الدعم، المساعدة |
| التحليلات | /dashboard/analytics | التحليلات، الإحصائيات |
| سجل النشاط | /dashboard/activity-log | سجل النشاط، اللوج |
| الأكاديمية | /dashboard/academy | الأكاديمية، التدريب |
| المستندات الذكية | /dashboard/ai-documents | المستندات، الوثائق |
| كول سنتر | /dashboard/call-center | كول سنتر، المكالمات |
| الخريطة | /dashboard/map | الخريطة، الماب |
| الملف الشخصي | /dashboard/profile | بروفايل، الملف الشخصي |

### صفحات المولّد (Generator):
| الصفحة | المسار | كلمات |
|--------|--------|-------|
| طلباتي | /dashboard/my-requests | طلباتي، الطلبات |
| طلبات التجميع | /dashboard/collection-requests | طلبات التجميع، تجميع |
| إيصالات المولّد | /dashboard/generator-receipts | الإيصالات، إيصال |
| إنشاء إيصال | /dashboard/create-receipt | إنشاء إيصال، إيصال جديد |
| سجل غير خطرة | /dashboard/non-hazardous-register | سجل غير الخطرة، غير خطر |
| سجل خطرة | /dashboard/hazardous-register | سجل الخطرة، خطرة |
| تصنيف النفايات | /dashboard/waste-types | تصنيف النفايات، أنواع |
| تقارير الشحنات | /dashboard/shipment-reports | تقارير الشحنات |
| التقرير المجمع | /dashboard/aggregate-report | التقرير المجمع |
| البصمة الكربونية | /dashboard/carbon-footprint | البصمة الكربونية، كربون |
| الاستدامة البيئية | /dashboard/environmental-sustainability | الاستدامة، بيئة |
| التحديثات التنظيمية | /dashboard/regulatory-updates | التحديثات التنظيمية، قوانين جديدة |
| الخطط التشغيلية | /dashboard/operational-plans | الخطط التشغيلية، خطة |
| المستندات التنظيمية | /dashboard/regulatory-documents | المستندات التنظيمية |
| القوانين واللوائح | /dashboard/laws-regulations | القوانين، اللوائح |
| التصاريح | /dashboard/permits | التصاريح، التراخيص، الرخص |
| مستشارين بيئيين | /dashboard/environmental-consultants | مستشارين، استشاري |
| المفوضين بالتوقيع | /dashboard/authorized-signatories | المفوضين، التوقيع |
| روابط الإيداع | /dashboard/quick-deposit-links | روابط الإيداع |
| روابط الشحن | /dashboard/quick-shipment-links | روابط الشحن |
| شحنة يدوية | /dashboard/manual-shipment | شحنة يدوية |
| مسودات يدوية | /dashboard/manual-shipment-drafts | مسودات |
| إقرارات التسليم | /dashboard/delivery-declarations | إقرارات التسليم |
| رؤى ذكية | /dashboard/smart-insights | رؤى ذكية، تحليل ذكي |
| عروض الأسعار | /dashboard/quotations | عروض الأسعار، عرض سعر |
| الفاتورة الإلكترونية | /dashboard/e-invoice | فاتورة إلكترونية |
| بوابة العملاء | /dashboard/customer-portal | بوابة العملاء |
| اللوحة التنفيذية | /dashboard/executive | اللوحة التنفيذية، الإدارة العليا |
| المساعد الذكي | /dashboard/smart-agent | المساعد الذكي |
| تقارير ESG | /dashboard/esg-reports | ESG، تقارير الاستدامة |
| تحليل النفايات | /dashboard/detailed-waste-analysis | تحليل النفايات |
| وزن سريع | /dashboard/quick-weight | وزن سريع |
| وزنات جماعية | /dashboard/bulk-weight-entries | وزنات جماعية |
| السجلات الخارجية | /dashboard/external-records | سجلات خارجية |

### صفحات الناقل (Transporter):
| الصفحة | المسار | كلمات |
|--------|--------|-------|
| شحنات الناقل | /dashboard/transporter-shipments | شحنات الناقل |
| سواقين الناقل | /dashboard/transporter-drivers | سواقين، إدارة السواقين |
| أدوات AI الناقل | /dashboard/transporter-ai-tools | أدوات الذكاء الاصطناعي |
| إيصالات الناقل | /dashboard/transporter-receipts | إيصالات الناقل |
| تتبع السواقين | /dashboard/driver-tracking | تتبع السواقين |
| خريطة المسارات | /dashboard/shipment-routes | خريطة المسارات |
| مركز التتبع | /dashboard/tracking-center | مركز التتبع، التتبع المباشر |
| عمال التحميل | /dashboard/loading-workers | عمال التحميل |
| إدارة الوقود | /dashboard/fuel-management | الوقود، البنزين، السولار |
| روابط السواقين | /dashboard/quick-driver-links | روابط السواقين |
| الشحنات المرفوضة | /dashboard/rejected-shipments | مرفوضة |
| الشحنات المتكررة | /dashboard/recurring-shipments | متكررة |
| خريطة ويز | /dashboard/waze-live-map | ويز، الملاحة |
| إعدادات GPS | /dashboard/gps-settings | GPS، جي بي اس |
| الكاميرات | /dashboard/cameras | الكاميرات |
| إعدادات IoT | /dashboard/iot-settings | IoT، الأجهزة |
| الصيانة الوقائية | /dashboard/preventive-maintenance | صيانة، الصيانة الوقائية |
| لوحة العمليات | /dashboard/operations | العمليات، لوحة العمليات |
| تصاريح السواقين | /dashboard/driver-permits | تصاريح السواقين |
| تجميع B2C | /dashboard/b2c-collection | تجميع الأفراد، B2C |

### صفحات المُدوّر (Recycler):
| الصفحة | المسار | كلمات |
|--------|--------|-------|
| أدوات AI المدوّر | /dashboard/recycler-ai-tools | أدوات الذكاء الاصطناعي |
| شهادات التدوير | /dashboard/recycling-certificates | شهادات التدوير |
| إصدار شهادات | /dashboard/issue-recycling-certificates | إصدار شهادة |
| شهادات الفخر | /dashboard/pride-certificates | شهادات الفخر |
| سوق الخشب | /dashboard/wood-market | سوق الخشب |
| البورصة العالمية | /dashboard/commodity-exchange | البورصة العالمية، السلع |
| خريطة تدفق | /dashboard/waste-flow-heatmap | خريطة التدفق |
| الاقتصاد الدائري | /dashboard/circular-economy | الاقتصاد الدائري |
| المزادات | /dashboard/waste-auctions | المزادات |
| سوق B2B | /dashboard/b2b-marketplace | سوق الأعمال |
| لوحة الإنتاج | /dashboard/production | الإنتاج، التصنيع |
| إدارة الطاقة | /dashboard/capacity-management | الطاقة الاستيعابية |
| سوق المعدات | /dashboard/equipment-marketplace | سوق المعدات |
| سوق المركبات | /dashboard/vehicle-marketplace | سوق المركبات |
| العقود الآجلة | /dashboard/futures-market | العقود الآجلة |

### صفحات السائق (Driver):
| الصفحة | المسار | كلمات |
|--------|--------|-------|
| ملف السائق | /dashboard/driver-profile | ملفي، بروفايلي |
| بياناتي | /dashboard/driver-data | بياناتي |
| العروض | /dashboard/driver-offers | العروض، عقود |
| سوق الشحنات | /dashboard/shipment-market | سوق الشحنات |
| محفظتي | /dashboard/driver-wallet | محفظتي، رصيدي |
| تحليلاتي | /dashboard/driver-analytics | تحليلاتي، أدائي |
| مساري | /dashboard/driver-my-route | مساري، الطريق |
| موقعي | /dashboard/my-location | موقعي، مكاني |
| الأكاديمية | /dashboard/driver-academy | الأكاديمية، التدريب |
| المكافآت | /dashboard/driver-rewards | المكافآت، النقاط |
| تصاريحي | /dashboard/driver-permits | تصاريحي |
| جدول الرحلات | /dashboard/driver-trip-schedule | جدول الرحلات، المواعيد |

## أنواع المخلفات:
بلاستيك، ورق، كرتون، حديد، معادن، ألومنيوم، نحاس، زجاج، خشب، إلكترونيات، مخلفات بناء، عضوية، زيوت، إطارات، طبية، خطرة، قماش، مطاط

## حالات الشحنات:
new (جديدة)، approved (معتمدة)، collecting (جاري التجميع)، in_transit (في الطريق)، delivered (تم التسليم)، confirmed (مؤكدة)، cancelled (ملغية)

## أنواع الأوامر:
- **تنقل**: "روح لـ..." / "افتح..." → navigate_to + المسار
- **إنشاء**: "أنشئ شحنة/إيصال/فاتورة جديدة" → open_dialog
- **فلترة**: "ورّيني شحنات البلاستيك" → filter_data
- **بحث**: "دوّر على..." → search_query
- **معلومات**: "كام شحنة..." → show_info
- **تمرير**: "روح لفوق/لتحت" → scroll_top/scroll_bottom
- **رجوع**: "ارجع" → go_back
- **تحديث**: "حدّث الصفحة" → refresh
- **ثيم**: "وضع ليلي/نهاري" → toggle_theme
- **محادثة**: أي سؤال عام → conversation

## أوامر مركبة:
لو المستخدم قال أكتر من أمر → نفذ الأول واقترح الباقي كـ follow_up

## تحليل المشاعر:
- محبط → تعاطف واقترح حل
- مستعجل → اختصر ونفذ بسرعة
- سعيد → تفاعل وشجّع
- مرتبك → وضّح بلغة بسيطة

## ملاحظات:
- لو الأمر مش موجود → قوله بأدب واقترح بديل
- اقترح follow_up_suggestion دايماً حسب السياق
- ردك بالعامية المصرية فقط`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: transcript },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "execute_voice_command",
              description: "تنفيذ أمر صوتي — الردود بالعامية المصرية فقط",
              parameters: {
                type: "object",
                properties: {
                  intent: {
                    type: "string",
                    enum: ["navigate", "filter", "search", "create", "info", "chat", "help", "scroll", "unknown"],
                  },
                  action: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["navigate_to", "filter_data", "search_query", "create_entity", "show_info", "open_dialog", "conversation", "go_back", "refresh", "scroll_top", "scroll_bottom", "toggle_theme"],
                      },
                      target: { type: "string" },
                      params: { type: "object" },
                    },
                    required: ["type", "target"],
                  },
                  response: {
                    type: "string",
                    description: "رد صوتي قصير بالعامية المصرية — جملة أو اتنين بالكتير",
                  },
                  confidence: { type: "number" },
                  sentiment: {
                    type: "object",
                    properties: {
                      emotion: {
                        type: "string",
                        enum: ["neutral", "happy", "frustrated", "angry", "urgent", "confused", "satisfied"],
                      },
                      score: { type: "number" },
                      adaptive_tone: {
                        type: "string",
                        description: "نفس الرد لكن بنبرة مكيفة حسب المشاعر",
                      },
                    },
                    required: ["emotion", "score"],
                  },
                  follow_up_suggestion: {
                    type: "string",
                    description: "اقتراح سؤال متابعة بالعامية — مثال: عايز تشوف شحنات النهارده؟",
                  },
                },
                required: ["intent", "action", "response", "confidence", "sentiment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "execute_voice_command" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          intent: "unknown",
          action: { type: "conversation", target: "none" },
          response: "النظام مشغول شوية يا باشا، حاول تاني بعد ثواني",
          confidence: 0,
          sentiment: { emotion: "neutral", score: 0.5 },
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          intent: "unknown",
          action: { type: "conversation", target: "none" },
          response: "الرصيد خلص يا باشا، محتاج يتجدد",
          confidence: 0,
          sentiment: { emotion: "neutral", score: 0.5 },
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      intent: "unknown",
      action: { type: "conversation", target: "none" },
      response: "معلش يا باشا مش فاهم، ممكن تقولها تاني؟",
      confidence: 0,
      sentiment: { emotion: "confused", score: 0.5 },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("voice-command error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
      intent: "unknown",
      action: { type: "conversation", target: "none" },
      response: "حصلت مشكلة يا باشا، حاول تاني",
      confidence: 0,
      sentiment: { emotion: "neutral", score: 0.5 },
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
