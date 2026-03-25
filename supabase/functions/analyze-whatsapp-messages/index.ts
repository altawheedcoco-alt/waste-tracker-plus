import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { phone, action } = await req.json();

    if (action === "analyze-contact") {
      // Get all messages for this contact
      const { data: msgs } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .or(`to_phone.eq.${phone},from_phone.eq.${phone}`)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!msgs || msgs.length === 0) {
        return new Response(JSON.stringify({ error: "لا توجد رسائل لهذا الرقم" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const inbound = msgs.filter((m: any) => m.direction === "inbound");
      const outbound = msgs.filter((m: any) => m.direction === "outbound");

      const conversationText = msgs.map((m: any) =>
        `[${m.direction === 'inbound' ? 'عميل' : 'نظام'}] ${m.content || `[${m.message_type}]`}`
      ).join("\n");

      const prompt = `أنت محلل ذكي لمحادثات واتساب في منصة إدارة النفايات iRecycle. حلّل المحادثة التالية بين النظام والعميل:

${conversationText}

قدّم تحليلاً شاملاً بصيغة JSON تتضمن:
1. "sentiment": المشاعر العامة للعميل (إيجابي/محايد/سلبي/مختلط)
2. "sentiment_score": درجة من -1.0 (سلبي جداً) إلى 1.0 (إيجابي جداً)
3. "customer_opinion": ملخص رأي العميل في 2-3 جمل
4. "suggestions": مصفوفة من اقتراحات العميل إن وجدت
5. "opt_out_detected": هل طلب العميل إيقاف الرسائل؟ (true/false)
6. "opt_out_category": إذا طلب إيقاف نوع معين من الرسائل، ما هو؟ (مثل: شحنات، فواتير، تنبيهات، ترحيب، بيئية، الكل)
7. "key_topics": مصفوفة بأهم المواضيع التي ناقشها العميل
8. "engagement_assessment": تقييم مستوى تفاعل العميل (عالي/متوسط/منخفض/غير متفاعل)
9. "is_interested": هل العميل مهتم بالخدمة؟ (true/false)
10. "interest_reason": سبب الاهتمام أو عدمه
11. "recommended_actions": مصفوفة من الإجراءات المقترحة لتحسين التواصل مع هذا العميل
12. "risk_level": مستوى خطر فقدان العميل (منخفض/متوسط/عالي)

أجب فقط بصيغة JSON بدون أي نص إضافي.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "أنت محلل بيانات ذكي متخصص في تحليل محادثات العملاء. أجب دائماً بصيغة JSON صالحة فقط." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiData = await response.json();
      let analysisText = aiData.choices?.[0]?.message?.content || "";
      
      // Clean markdown code blocks if present
      analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        analysis = { sentiment: "محايد", sentiment_score: 0, customer_opinion: analysisText, suggestions: [], opt_out_detected: false, key_topics: [], engagement_assessment: "متوسط", is_interested: true, recommended_actions: [], risk_level: "منخفض" };
      }

      // Save analysis
      await supabase.from("whatsapp_ai_analysis").insert({
        phone,
        analysis_type: "full",
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        customer_opinion: analysis.customer_opinion,
        suggestions: analysis.suggestions || [],
        opt_out_detected: analysis.opt_out_detected || false,
        opt_out_category: analysis.opt_out_category || null,
        key_topics: analysis.key_topics || [],
        raw_analysis: analysis,
        messages_analyzed: msgs.length,
      });

      // Update contact preferences if opt-out detected
      if (analysis.opt_out_detected) {
        const categories = analysis.opt_out_category === "الكل"
          ? ["شحنات", "فواتير", "تنبيهات", "ترحيب", "بيئية"]
          : analysis.opt_out_category ? [analysis.opt_out_category] : [];

        await supabase.from("whatsapp_contact_preferences").upsert({
          phone,
          contact_name: msgs.find((m: any) => m.metadata?.profile_name)?.metadata?.profile_name || null,
          opted_out_categories: categories,
          opted_out_all: analysis.opt_out_category === "الكل",
          opt_out_reason: analysis.interest_reason || "طلب العميل",
          opted_out_at: new Date().toISOString(),
          sentiment_summary: analysis.sentiment,
          last_ai_analysis: analysis,
          last_analyzed_at: new Date().toISOString(),
        }, { onConflict: "phone" });
      } else {
        // Update preferences with latest analysis
        await supabase.from("whatsapp_contact_preferences").upsert({
          phone,
          contact_name: msgs.find((m: any) => m.metadata?.profile_name)?.metadata?.profile_name || null,
          sentiment_summary: analysis.sentiment,
          last_ai_analysis: analysis,
          last_analyzed_at: new Date().toISOString(),
        }, { onConflict: "phone" });
      }

      return new Response(JSON.stringify({
        success: true,
        analysis,
        stats: { total: msgs.length, inbound: inbound.length, outbound: outbound.length },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bulk-analyze") {
      // Get unique phones with inbound messages
      const { data: msgs } = await supabase
        .from("whatsapp_messages")
        .select("from_phone, metadata")
        .eq("direction", "inbound")
        .not("from_phone", "is", null)
        .limit(500);

      const phones = [...new Set((msgs || []).map((m: any) => m.from_phone).filter(Boolean))];
      
      return new Response(JSON.stringify({
        success: true,
        phones,
        count: phones.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update-preference") {
      const { categories, opted_out_all, reason } = await req.json();
      
      await supabase.from("whatsapp_contact_preferences").upsert({
        phone,
        opted_out_categories: categories || [],
        opted_out_all: opted_out_all || false,
        opt_out_reason: reason || null,
        opted_out_at: opted_out_all || (categories && categories.length > 0) ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "phone" });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
