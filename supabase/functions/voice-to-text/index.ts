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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = formData.get("language")?.toString() || "ar";

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binary);

    const mimeType = audioFile.type || "audio/webm";

    // Use Gemini for speech-to-text
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe the following audio recording accurately. The audio is likely in ${language === "ar" ? "Arabic" : "English"}. 
Return ONLY the transcribed text, nothing else. If the audio contains shipment details like weight, waste type, location, or vehicle info, extract them clearly.
If you cannot understand the audio, return "لم يتم التعرف على الصوت" for Arabic or "Could not recognize speech" for English.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Audio}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ text: transcription, language }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice-to-text error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
