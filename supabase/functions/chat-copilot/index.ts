import { Deno } from "https://deno.land/x/deno@v2.0.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { command, context, userId, organizationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build system prompt based on context
    const systemPrompt = `أنت مساعد ذكي متخصص في إدارة النفايات والشحنات والفواتير. تعمل داخل منصة iRecycle.
    - أجب بالعربية دائماً
    - كن مختصراً ومفيداً
    - إذا طُلب منك تلخيص محادثة، لخّصها بنقاط واضحة
    - إذا طُلب منك معلومات عن شحنة أو فاتورة، استخدم البيانات المتاحة
    - لا تخترع بيانات غير موجودة
    - استخدم الإيموجي بذكاء لتحسين القراءة`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(context?.recentMessages || []).map((m: any) => ({
        role: m.isOwn ? "user" : "assistant",
        content: `[${m.senderName}]: ${m.content}`,
      })),
      { role: "user", content: command },
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
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "يرجى شحن الرصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "لم أتمكن من المعالجة";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-copilot error:", e);
    return new Response(JSON.stringify({ error: e.message || "خطأ غير متوقع" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
