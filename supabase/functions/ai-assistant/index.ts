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
    const { type, messages, imageBase64, prompt, wasteDescription, wasteType } = await req.json();
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
        // مساعد ذكي متخصص للمنصة
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: platformSystemPrompt
            },
            ...messages
          ],
          stream: true,
        };
        break;

      case "classify_waste":
        // تصنيف النفايات من الصورة
        requestBody = {
          model: "google/gemini-2.5-flash",
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
        // استخراج بيانات الميزان من الصورة - شامل لجميع الحقول
        requestBody = {
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `أنت خبير في قراءة واستخراج البيانات من إيصالات الموازين العربية. حلل هذه الصورة واستخرج جميع البيانات المرئية بدقة.

الحقول المطلوب استخراجها:
1. اسم الشركة/المنشأة (company_name) - اسم الشركة صاحبة الميزان
2. رقم التذكرة/الإيصال (ticket_number)
3. نوع العملية (operation_type) - صادر/وارد/خارجي
4. اسم الصنف/المادة (material_type) - نوع المادة المنقولة
5. اسم العميل/المورد (customer_name)
6. اسم السائق (driver_name)
7. رقم السيارة/المركبة (vehicle_number)
8. رقم المقطورة (trailer_number) - إن وجد
9. المحافظة/المنطقة (governorate)
10. الوزن الأول/الإجمالي (first_weight) - بالكيلوجرام
11. الوزن الثاني/الفارغ (second_weight) - بالكيلوجرام
12. الوزن الصافي (net_weight) - بالكيلوجرام
13. وحدة الوزن (unit) - kg أو ton
14. تاريخ الوزن الأول (first_date)
15. وقت الوزن الأول (first_time)
16. تاريخ الوزن الثاني (second_date)
17. وقت الوزن الثاني (second_time)
18. اسم القائم بالوزن (weigher_name)
19. ملاحظات (notes) - أي ملاحظات إضافية

أجب بصيغة JSON فقط مع كل الحقول المتوفرة. إذا لم تجد قيمة لحقل معين، اتركه فارغاً "":
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
        // تحسين المسارات
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
              content: prompt
            }
          ]
        };
        break;

      case "generate_report":
        // تقارير ذكية
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
              content: prompt
            }
          ]
        };
        break;

      case "waste_state":
        // تحديد حالة المخلف (صلبة/سائلة/شبه صلبة/غازية) بناءً على نوع النفاية
        requestBody = {
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `أنت خبير في تصنيف حالات المخلفات والنفايات. مهمتك تحديد الحالة الفيزيائية للمخلف.

الحالات المتاحة:
- solid: مخلفات صلبة (بلاستيك، معادن، ورق، زجاج، إلكترونيات، مخلفات بناء، إلخ)
- liquid: مخلفات سائلة (زيوت، مذيبات، أحماض، محاليل كيميائية، سوائل طبية، إلخ)
- semi_solid: مخلفات شبه صلبة (حمأة، طين ملوث، شحوم، معاجين، إلخ)
- gas: مخلفات غازية (غازات صناعية، أبخرة كيميائية، إلخ)

أمثلة:
- البلاستيك PET → solid
- الزيوت المستعملة → liquid
- حمأة الصرف → semi_solid
- الأحماض السائلة → liquid
- الخردة المعدنية → solid
- الشحوم الصناعية → semi_solid
- الغازات المضغوطة → gas

أجب بحالة واحدة فقط من (solid, liquid, semi_solid, gas) دون أي شرح إضافي.`
            },
            {
              role: "user",
              content: `حدد حالة هذا المخلف:
نوع المخلف: ${wasteType || 'غير محدد'}
وصف المخلف: ${wasteDescription || 'غير محدد'}

أجب بكلمة واحدة فقط: solid أو liquid أو semi_solid أو gas`
            }
          ]
        };
        break;

      default:
        throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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

    // Special handling for waste_state to extract just the state value
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
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
