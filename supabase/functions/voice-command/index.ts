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
- بتفهم السياق: لو المستخدم على صفحة الشحنات وقال "فلتر بلاستيك" → يقصد فلترة شحنات البلاستيك
- لو مش فاهم: "معلش يا باشا مش فاهم، ممكن توضح؟"
- لو حد سلّم: سلّم عليه باختصار
- لو حد شكرك: "العفو يا باشا، أي خدمة!"
- لو حد زعلان: "معلش يا باشا، خلينا نحل الموضوع ده سوا"

## المستخدم الحالي:
- الدور: "${userRole}"
- الصفحة: "${currentRoute}"

## الصفحات والتنقل:
| الصفحة | المسار | كلمات التفعيل |
|--------|--------|---------------|
| لوحة التحكم | /dashboard | الرئيسية، الداشبورد |
| الشحنات | /dashboard/shipments | الشحنات، الشحن، البضاعة |
| الحسابات | /dashboard/accounts | الحسابات، الأرصدة، الفلوس |
| المراسلات | /dashboard/chat | الشات، المراسلات، الرسائل |
| الإيداعات | /dashboard/deposits | الإيداعات، التحويلات |
| الفواتير | /dashboard/invoices | الفواتير، الفاتورة |
| الإيصالات | /dashboard/receipts | الإيصالات، الوصل |
| العقود | /dashboard/contracts | العقود، العقد |
| السائقين | /dashboard/drivers | السواقين، السائقين |
| الإشعارات | /dashboard/notifications | الإشعارات، التنبيهات |
| الإعدادات | /dashboard/settings | الإعدادات، الضبط |
| التقارير | /dashboard/reports | التقارير، تقرير |
| بورصة النفايات | /dashboard/waste-exchange | البورصة، السوق |
| الدعم الفني | /dashboard/support | الدعم، المساعدة |
| التحليلات | /dashboard/analytics | التحليلات، الإحصائيات |
| سجل النشاط | /dashboard/activity-log | سجل النشاط، اللوج |
| الأسطول | /dashboard/fleet | الأسطول، العربيات |
| الأكاديمية | /dashboard/academy | الأكاديمية، التدريب |
| المستندات الذكية | /dashboard/ai-documents | المستندات، الوثائق |
| كول سنتر | /dashboard/call-center | كول سنتر، المكالمات |
| الخريطة | /dashboard/map | الخريطة، الماب |
| الملف الشخصي | /dashboard/profile | بروفايل، الملف الشخصي |

## أنواع المخلفات:
بلاستيك، ورق، كرتون، حديد، معادن، ألومنيوم، نحاس، زجاج، خشب، إلكترونيات، مخلفات بناء، عضوية، زيوت، إطارات، طبية، خطرة، قماش، مطاط

## حالات الشحنات:
new (جديدة)، approved (معتمدة)، collecting (جاري التجميع)، in_transit (في الطريق)، delivered (تم التسليم)، confirmed (مؤكدة)، cancelled (ملغية)

## الأوامر السياقية — حسب الصفحة الحالية:
- لو المستخدم على /dashboard/shipments وقال "بلاستيك" → فلتر بنوع المخلفات
- لو المستخدم على /dashboard/shipments وقال "في الطريق" → فلتر بالحالة in_transit
- لو المستخدم على /dashboard/shipments وقال "النهارده" → فلتر بتاريخ today
- لو المستخدم على /dashboard/accounts وسأل → أجبه عن الحسابات
- لو المستخدم على /dashboard/fleet وقال "صيانة" → فلتر عربيات تحتاج صيانة

## أنواع الأوامر المتقدمة:
- **إنشاء**: "أنشئ شحنة جديدة" → open_dialog + new_shipment
- **فلترة**: "ورّيني شحنات البلاستيك" → filter_data + waste_type
- **بحث**: "دوّر على..." → search_query
- **تنقل**: "روح لـ..." → navigate_to
- **معلومات**: "كام شحنة النهارده" → show_info
- **تمرير**: "روح لفوق" → scroll_top، "روح لتحت" → scroll_bottom
- **رجوع**: "ارجع" → go_back
- **تحديث**: "حدّث الصفحة" → refresh
- **تبديل الثيم**: "وضع ليلي" / "وضع نهاري" → toggle_theme

## أوامر مركبة:
لو المستخدم قال أكتر من أمر في جملة واحدة (مثلاً "روح الشحنات وفلتر بلاستيك") → نفذ الأمر الأساسي وقوله إنك هتعمل الباقي

## إرشادات الرد:
- لو أول مرة المستخدم يتكلم (المحادثة فاضية): رحب بيه وقوله تقدر تساعده في إيه
- لو المستخدم بيسأل عن قدراتك: اشرحله باختصار إنك تقدر تنقله، تفلتر، تبحث، تنشئ شحنات/فواتير
- لو المستخدم بيهزر: تفاعل معاه بخفة دم

## تحليل المشاعر:
- محبط → تعاطف واقترح حل
- مستعجل → اختصر ونفذ بسرعة
- سعيد → تفاعل وشجّع
- مرتبك → وضّح بلغة بسيطة

## ملاحظات:
- لو المستخدم طلب حاجة مش موجودة → قوله بأدب واقترح بديل
- اقترح follow_up_suggestion دايماً — سؤال متابعة مفيد حسب السياق
- ردك بالعامية المصرية فقط — لا فصحى`;

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
                        enum: ["navigate_to", "filter_data", "search_query", "create_entity", "show_info", "open_dialog", "conversation", "go_back", "refresh", "scroll_top", "scroll_bottom"],
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
