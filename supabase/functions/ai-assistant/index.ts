import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Input Validation ---
const VALID_TYPES = ['chat', 'generate_text', 'classify_waste', 'extract_weight', 'optimize_route', 'generate_report', 'waste_state', 'ping'] as const;

function validateRequest(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!VALID_TYPES.includes(body.type)) return 'Invalid request type';
  
  if ((body.type === 'chat' || body.type === 'generate_text') && (!Array.isArray(body.messages) || body.messages.length === 0)) {
    return 'Messages array is required';
  }
  if ((body.type === 'classify_waste' || body.type === 'extract_weight') && typeof body.imageBase64 !== 'string') {
    return 'Image data is required';
  }
  if ((body.type === 'optimize_route' || body.type === 'generate_report') && typeof body.prompt !== 'string') {
    return 'Prompt is required';
  }
  
  // Validate messages format
  if (body.messages && Array.isArray(body.messages)) {
    for (const msg of body.messages) {
      if (!msg || typeof msg !== 'object') return 'Invalid message format';
      if (!['user', 'assistant', 'system'].includes(msg.role)) return 'Invalid message role';
      if (msg.content === undefined || msg.content === null) return 'Message content is required';
    }
    // Limit messages count
    if (body.messages.length > 50) return 'Too many messages (max 50)';
  }
  
  // Limit prompt length
  if (body.prompt && typeof body.prompt === 'string' && body.prompt.length > 50000) {
    return 'Prompt too long (max 50000 characters)';
  }
  
  // Limit image size (base64 ~1.33x of original, allow ~10MB images)
  if (body.imageBase64 && typeof body.imageBase64 === 'string' && body.imageBase64.length > 15_000_000) {
    return 'Image too large';
  }
  
  return null;
}

function sanitizeString(s: string, maxLen = 5000): string {
  return s.slice(0, maxLen).trim();
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle ping
    if (body.type === 'ping') {
      return new Response(JSON.stringify({ success: true, message: 'AI Assistant service is running', timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationError = validateRequest(body);
    if (validationError) {
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, messages, imageBase64, prompt, wasteDescription, wasteType } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let requestBody: any;

    // System prompt متخصص بالكامل لمنصة آي ريسايكل
    const platformSystemPrompt = `أنت "آي ريسايكل" - المساعد الذكي الرسمي لمنصة إدارة النفايات وإعادة التدوير في المملكة العربية السعودية.

## هويتك ودورك:
أنت جزء أساسي من منصة آي ريسايكل، وتخدم ثلاثة أنواع من المستخدمين:
1. **الشركات المولدة للنفايات (Generators)**: المصانع والمنشآت التي تنتج النفايات
2. **شركات النقل (Transporters)**: المسؤولون عن نقل النفايات بشكل آمن
3. **مراكز إعادة التدوير (Recyclers)**: المنشآت التي تستقبل وتعيد تدوير النفايات

## الوظائف الرئيسية للمنصة:
- **إدارة الشحنات**: إنشاء ومتابعة وتأكيد شحنات النفايات
- **تتبع السائقين**: مراقبة مواقع السائقين والمركبات
- **التقارير والإحصائيات**: تحليل البيانات وإعداد التقارير البيئية
- **أدوات الذكاء الاصطناعي**: استخراج بيانات الميزان، تصنيف النفايات، تحسين المسارات

## أنواع النفايات المدعومة:
- البلاستيك (plastic)
- الورق والكرتون (paper)
- المعادن (metal)
- الزجاج (glass)
- الإلكترونيات (electronic)
- النفايات العضوية (organic)
- النفايات الكيميائية (chemical)
- النفايات الطبية (medical)
- مخلفات البناء (construction)
- أخرى (other)

## حالات الشحنات:
- جديدة (new): تم إنشاء الشحنة
- معتمدة (approved): تمت الموافقة من المُدوِّر
- قيد الجمع (collecting): السائق في طريقه للجمع
- في الطريق (in_transit): يتم نقل النفايات
- تم التسليم (delivered): وصلت للمُدوِّر
- مؤكدة (confirmed): تم تأكيد الاستلام

## تعليمات مهمة:
1. أجب دائماً باللغة العربية
2. كن مختصراً ومفيداً وعملياً
3. ساعد المستخدم في استخدام المنصة بفعالية
4. قدم حلولاً عملية للمشاكل التشغيلية
5. وجه المستخدم للصفحات المناسبة في المنصة عند الحاجة
6. التزم بالأنظمة البيئية السعودية ومتطلبات موام
7. شجع على الممارسات البيئية السليمة

## روابط المنصة المهمة:
- لوحة التحكم: /dashboard
- إنشاء شحنة: /dashboard/shipments/new
- إدارة الشحنات: /dashboard/shipments
- أدوات الذكاء الاصطناعي: /dashboard/ai-tools
- التقارير: /dashboard/reports
- إدارة السائقين: /dashboard/transporter-drivers

أنت هنا لخدمة المستخدم ومساعدته في إنجاز مهامه بكفاءة!`;

    switch (type) {
      case "chat":
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: platformSystemPrompt },
            ...messages
          ],
          stream: true,
        };
        break;

      case "generate_text":
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: platformSystemPrompt },
            ...messages
          ],
          stream: false,
        };
        break;

      case "classify_waste":
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `حلل هذه الصورة للنفايات وأعطني:
                  1. نوع النفاية (plastic, paper, metal, glass, electronic, organic, chemical, medical, construction, other)
                  2. وصف موجز للنفاية
                  3. توصيات للتخلص الآمن
                  أجب بصيغة JSON فقط:
                  {"waste_type": "...", "description": "...", "recommendations": "..."}`
                },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 }
                }
              ]
            }
          ]
        };
        break;

      case "extract_weight":
        requestBody = {
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `أنت محرك OCR عالي الدقة متخصص في قراءة إيصالات الموازين (Weighbridge Receipts) العربية والإنجليزية.

## تعليمات حرجة:
- اقرأ كل حرف ورقم بدقة متناهية كما في برنامج CamScanner OCR.
- إذا كان النص مطبوعاً: اقرأه حرفياً بدون تخمين.
- إذا كان النص مكتوباً بخط اليد: حاول قراءته بأفضل تقدير مع ذكر ذلك في الملاحظات.
- الأرقام العربية (٠١٢٣٤٥٦٧٨٩) حوّلها للأرقام اللاتينية (0123456789).
- الأوزان: اقرأ الرقم كاملاً بما فيه الكسور العشرية. لا تُقرّب.
- التواريخ: حوّلها لصيغة YYYY-MM-DD.
- الأوقات: حوّلها لصيغة HH:MM (24 ساعة).
- إذا وجدت وحدة "طن" حوّل الأوزان للكيلوجرام (× 1000) واكتب unit: "kg".
- إذا كانت بالكيلوجرام أبقها كما هي.

## الحقول المطلوبة (اقرأ كل ما هو مرئي):
1. company_name - اسم الشركة/المنشأة صاحبة الميزان
2. ticket_number - رقم التذكرة/الإيصال (اقرأه حرفياً)
3. operation_type - نوع العملية (وارد/صادر/شراء/بيع)
4. material_type - اسم الصنف/المادة/المخلف
5. customer_name - اسم العميل/المورد
6. driver_name - اسم السائق
7. vehicle_number - رقم لوحة السيارة (كامل بالحروف والأرقام)
8. trailer_number - رقم المقطورة
9. governorate - المحافظة/المنطقة
10. first_weight - الوزن الأول (الإجمالي/المحمّل) بالكجم - رقم فقط
11. second_weight - الوزن الثاني (الفارغ/التفريغ) بالكجم - رقم فقط
12. net_weight - الوزن الصافي بالكجم - رقم فقط
13. unit - وحدة القياس الأصلية (kg أو ton)
14. first_date - تاريخ الوزنة الأولى (YYYY-MM-DD)
15. first_time - وقت الوزنة الأولى (HH:MM)
16. second_date - تاريخ الوزنة الثانية (YYYY-MM-DD)
17. second_time - وقت الوزنة الثانية (HH:MM)
18. weigher_name - اسم القائم بالوزن/المشغل
19. notes - أي ملاحظات أو بيانات إضافية مرئية
20. gross_weight - الوزن الإجمالي (= الأكبر من first/second)
21. tare_weight - وزن الفارغ (= الأصغر من first/second)
22. date - التاريخ الرئيسي للإيصال (YYYY-MM-DD)
23. time - الوقت الرئيسي (HH:MM)

## قواعد التحقق:
- net_weight يجب أن يساوي |first_weight - second_weight|
- إذا لم يتطابق الحساب، صحّح القيم بناءً على ما هو مطبوع
- إذا كان هناك حقل واحد فقط (الصافي)، ضعه في net_weight واترك الباقي فارغاً

أجب بصيغة JSON صالحة فقط. لا تضف أي نص خارج JSON:
{
  "company_name": "",
  "ticket_number": "",
  "operation_type": "",
  "material_type": "",
  "customer_name": "",
  "driver_name": "",
  "vehicle_number": "",
  "trailer_number": "",
  "governorate": "",
  "first_weight": "",
  "second_weight": "",
  "net_weight": "",
  "unit": "kg",
  "first_date": "",
  "first_time": "",
  "second_date": "",
  "second_time": "",
  "weigher_name": "",
  "notes": "",
  "gross_weight": "",
  "tare_weight": "",
  "date": "",
  "time": ""
}`
                },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 }
                }
              ]
            }
          ]
        };
        break;

      case "optimize_route":
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `أنت خبير في تحسين مسارات النقل والخدمات اللوجستية.
              بناءً على المواقع المعطاة، قدم أفضل ترتيب للمسار لتوفير الوقت والوقود.
              أجب بصيغة JSON مع شرح موجز.`
            },
            {
              role: "user",
              content: sanitizeString(prompt, 10000)
            }
          ]
        };
        break;

      case "generate_report":
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `أنت محلل بيانات متخصص في إدارة النفايات.
              حلل البيانات المقدمة وقدم:
              1. ملخص تنفيذي
              2. الاتجاهات الرئيسية
              3. توقعات مستقبلية
              4. توصيات للتحسين
              استخدم اللغة العربية وكن دقيقاً في الأرقام.`
            },
            {
              role: "user",
              content: sanitizeString(prompt, 20000)
            }
          ]
        };
        break;

      case "waste_state":
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `أنت خبير في تصنيف حالات المخلفات والنفايات. مهمتك تحديد الحالة الفيزيائية للمخلف.

الحالات المتاحة:
- solid: مخلفات صلبة
- liquid: مخلفات سائلة
- semi_solid: مخلفات شبه صلبة
- gas: مخلفات غازية

أجب بحالة واحدة فقط من (solid, liquid, semi_solid, gas) دون أي شرح إضافي.`
            },
            {
              role: "user",
              content: `حدد حالة هذا المخلف:
نوع المخلف: ${sanitizeString(wasteType || 'غير محدد', 200)}
وصف المخلف: ${sanitizeString(wasteDescription || 'غير محدد', 500)}

أجب بكلمة واحدة فقط: solid أو liquid أو semi_solid أو gas`
            }
          ]
        };
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid request type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      ...requestBody,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام خدمات الذكاء الاصطناعي" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For streaming chat responses
    if (type === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // For non-streaming responses
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Special handling for waste_state
    if (type === "waste_state") {
      const stateMatch = content?.toLowerCase().trim();
      const validStates = ['solid', 'liquid', 'semi_solid', 'gas'];
      const wasteState = validStates.find(s => stateMatch?.includes(s)) || 'solid';
      return new Response(JSON.stringify({ wasteState }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
