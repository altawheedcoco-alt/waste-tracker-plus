const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Image = btoa(binary);
    const mimeType = imageFile.type || "image/jpeg";

    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const response = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a waste management expert AI. Analyze this image of a shipment/waste load and extract the following information in JSON format:
{
  "waste_type": "نوع المخلف (بالعربية)",
  "waste_type_en": "waste type in English",
  "estimated_weight_kg": estimated weight in kg (number),
  "weight_confidence": "high/medium/low",
  "condition": "حالة الشحنة (بالعربية)",
  "description": "وصف مختصر للشحنة (بالعربية)",
  "hazardous": true/false,
  "container_type": "نوع الحاوية (بالعربية)",
  "fill_level_percent": estimated fill percentage (number 0-100),
  "notes": "ملاحظات إضافية (بالعربية)"
}

Be as accurate as possible. If you can't determine something, use null.
Return ONLY valid JSON, no markdown or extra text.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";

    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = { description: content, error: "Could not parse structured response" };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
