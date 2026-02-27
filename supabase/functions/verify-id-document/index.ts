import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface VerificationResult {
  is_valid_document: boolean;
  document_type: 'national_id' | 'passport' | 'unknown';
  side: 'front' | 'back' | 'unknown';
  confidence: number;
  extracted_data: {
    full_name_ar?: string;
    full_name_en?: string;
    national_id?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    job_title?: string;
    religion?: string;
    marital_status?: string;
    expiry_date?: string;
    issue_date?: string;
    governorate?: string;
    serial_number?: string;
    // Passport fields
    passport_number?: string;
    nationality?: string;
    place_of_birth?: string;
    machine_readable_zone?: string;
  };
  face_detected: boolean;
  warnings: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageBase64, expectedSide, verifyFace, selfieBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("imageBase64 is required");
    }

    // Step 1: Verify and extract data from ID document
    const extractionPrompt = `أنت نظام متخصص في التحقق من وثائق الهوية المصرية واستخراج البيانات منها بدقة عالية.

مهمتك:
1. تحديد نوع المستند: بطاقة رقم قومي مصرية (national_id) أو جواز سفر (passport) أو غير معروف (unknown)
2. تحديد الوجه: هل هذا وجه البطاقة (front) أم ظهرها (back)
3. التحقق من صحة المستند (هل هو مستند حقيقي وليس صورة عشوائية)
4. استخراج جميع البيانات الموجودة في المستند بدقة

للبطاقة الشخصية المصرية (الوجه/front):
- الاسم بالعربية (full_name_ar)
- الاسم بالإنجليزية إن وجد (full_name_en)  
- الرقم القومي (national_id) - 14 رقم
- تاريخ الميلاد (date_of_birth)
- النوع/الجنس (gender)
- العنوان (address)
- الديانة (religion)
- الحالة الاجتماعية (marital_status)
- الوظيفة (job_title)
- صورة الوجه موجودة (face_detected)

للبطاقة الشخصية المصرية (الظهر/back):
- الرقم القومي (national_id)
- تاريخ الإصدار (issue_date)
- تاريخ الانتهاء (expiry_date)
- المحافظة (governorate)
- الرقم التسلسلي (serial_number)

لجواز السفر:
- الاسم الكامل (full_name_ar, full_name_en)
- رقم الجواز (passport_number)
- الجنسية (nationality)
- تاريخ الميلاد (date_of_birth)
- مكان الميلاد (place_of_birth)
- تاريخ الإصدار والانتهاء

الجانب المتوقع: ${expectedSide || 'غير محدد'}

أجب بصيغة JSON فقط:
{
  "is_valid_document": true/false,
  "document_type": "national_id" | "passport" | "unknown",
  "side": "front" | "back" | "unknown",
  "confidence": 0-100,
  "extracted_data": { ... كل البيانات المستخرجة ... },
  "face_detected": true/false,
  "warnings": ["تحذيرات إن وجدت"]
}`;

    const messages: any[] = [
      { role: "system", content: extractionPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "قم بتحليل هذا المستند واستخراج جميع البيانات منه. تحقق أنه مستند هوية حقيقي." },
          { type: "image_url", image_url: { url: imageBase64 } }
        ]
      }
    ];

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY!, {
      messages,
      temperature: 0.1,
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "يرجى إضافة رصيد" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse verification result");

    const result: VerificationResult = JSON.parse(jsonMatch[0]);

    // Step 2: Face matching if selfie provided
    let faceMatchResult = null;
    if (verifyFace && selfieBase64) {
      const faceMatchResponse = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `أنت نظام متخصص في مقارنة الوجوه والتحقق من الهوية. 
مهمتك مقارنة صورة الوجه في بطاقة الهوية مع الصورة الشخصية (السيلفي) للتحقق من أنهما لنفس الشخص.

أجب بصيغة JSON فقط:
{
  "faces_match": true/false,
  "match_confidence": 0-100,
  "details": "وصف موجز للمقارنة",
  "warnings": ["تحذيرات إن وجدت"]
}`
            },
            {
              role: "user",
              content: [
                { type: "text", text: "قارن بين صورة الوجه في بطاقة الهوية (الصورة الأولى) والصورة الشخصية (السيلفي - الصورة الثانية). هل هما لنفس الشخص؟" },
                { type: "image_url", image_url: { url: imageBase64 } },
                { type: "image_url", image_url: { url: selfieBase64 } }
              ]
            }
          ],
          temperature: 0.1,
        }),
      });

      if (faceMatchResponse.ok) {
        const faceData = await faceMatchResponse.json();
        const faceContent = faceData.choices?.[0]?.message?.content || "";
        const faceJsonMatch = faceContent.match(/\{[\s\S]*\}/);
        if (faceJsonMatch) {
          faceMatchResult = JSON.parse(faceJsonMatch[0]);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      faceMatch: faceMatchResult 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("ID verification error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "حدث خطأ في التحقق" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
