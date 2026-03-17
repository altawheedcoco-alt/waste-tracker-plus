import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentUrl, documentName, scanType = "general", extractFields, documentCategory } = await req.json();
    if (!documentUrl) {
      return new Response(JSON.stringify({ error: "documentUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build system prompt based on scan type
    let systemPrompt: string;

    if (scanType === 'business_document' && extractFields) {
      const fieldPrompts: Record<string, string> = {
        tax_card: `استخرج من البطاقة الضريبية المصرية كل الحقول التالية:
- اسم الشركة/المنشأة (عربي وإنجليزي)
- رقم التسجيل الضريبي
- رقم الملف الضريبي
- نوع النشاط
- العنوان والمحافظة
- اسم صاحب الشأن/المالك
- الرقم القومي للمالك
- تاريخ الإصدار وتاريخ الانتهاء`,
        commercial_register: `استخرج من السجل التجاري المصري كل الحقول التالية:
- اسم الشركة (عربي وإنجليزي)
- رقم السجل التجاري
- الشكل القانوني (شركة ذات مسؤولية محدودة، فردية، مساهمة...)
- نوع النشاط
- رأس المال
- العنوان ومكتب التسجيل
- اسم المدير المسؤول/صاحب الشأن
- الرقم القومي
- عدد الفروع
- تاريخ القيد وتاريخ الانتهاء`,
        data_statement: `استخرج من وثيقة البيانات كل الحقول التالية:
- اسم الشركة (عربي وإنجليزي)
- رقم السجل التجاري
- رقم التسجيل الضريبي
- الشكل القانوني
- نوع النشاط
- العنوان
- اسم صاحب الشأن
- تاريخ الإصدار`,
      };

      systemPrompt = `أنت محلل مستندات تجارية مصرية متخصص. مهمتك استخراج كل البيانات بدقة عالية.

${fieldPrompts[documentCategory || ''] || fieldPrompts.data_statement}

أجب بصيغة JSON فقط بالهيكل التالي:
{
  "classification": "نوع المستند",
  "summary": "ملخص قصير",
  "entities": [{"type": "نوع الحقل بالعربي", "value": "القيمة المستخرجة", "confidence": 0.95}],
  "key_dates": [{"label": "وصف التاريخ", "date": "YYYY-MM-DD"}],
  "amounts": [{"label": "وصف", "amount": 0, "currency": "EGP"}],
  "risks": [],
  "confidence_score": 0.90
}

ملاحظات:
- اكتب أنواع الكيانات (type) بالعربي بشكل واضح مثل: "اسم الشركة"، "رقم التسجيل الضريبي"، "رقم السجل التجاري"، "نوع النشاط"، "العنوان"، "المحافظة"، "صاحب الشأن"، "الرقم القومي"، "رأس المال"، "عدد الفروع"، "مكتب التسجيل"، "الشكل القانوني"، "رقم الملف الضريبي"
- إذا لم تستطع قراءة حقل، لا تضفه
- اكتب التواريخ بصيغة YYYY-MM-DD`;
    } else {
      systemPrompt = `أنت محلل مستندات ذكي متخصص في استخراج البيانات من الوثائق العربية والإنجليزية.
مهمتك:
1. تصنيف نوع المستند (عقد، فاتورة، تصريح، رخصة، شهادة، تقرير، خطاب، إقرار، أخرى)
2. استخراج الكيانات: الأسماء، التواريخ، المبالغ، أرقام الهوية، أرقام السجلات، العناوين
3. تحديد المخاطر القانونية أو البنود الحرجة
4. ملخص المستند في 2-3 جمل

أجب بصيغة JSON فقط بالهيكل التالي:
{
  "classification": "نوع المستند",
  "summary": "ملخص قصير",
  "entities": [{"type": "نوع", "value": "قيمة", "confidence": 0.95}],
  "key_dates": [{"label": "وصف", "date": "YYYY-MM-DD"}],
  "amounts": [{"label": "وصف", "amount": 0, "currency": "EGP"}],
  "risks": ["مخاطرة 1"],
  "confidence_score": 0.90
}`;
    }

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
          {
            role: "user",
            content: [
              { type: "text", text: `حلل هذا المستند (${scanType}): ${documentName || "مستند"}` },
              { type: "image_url", image_url: { url: documentUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "يرجى شحن رصيد AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";

    // Parse JSON from response
    let parsed: any = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { parsed = { raw_text: content }; }

    // Save to DB
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      await supabase.from("ocr_scan_results").insert({
        organization_id: profile.organization_id,
        document_url: documentUrl,
        document_name: documentName,
        scan_type: scanType,
        extracted_data: parsed,
        entities: parsed.entities || [],
        classification: parsed.classification || "unknown",
        confidence_score: parsed.confidence_score || 0,
        scanned_by: user.id,
      } as any);
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("OCR scanner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
