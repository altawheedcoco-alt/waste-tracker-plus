import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // === Action: Chat with smart agent ===
    if (action === "chat") {
      const { organization_id, conversation_id, message, channel, contact_info } = body;

      if (!organization_id || !message) {
        return new Response(JSON.stringify({ error: "organization_id and message required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1) Get agent config
      const { data: config } = await supabase
        .from("ai_agent_configs")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("is_enabled", true)
        .single();

      if (!config) {
        return new Response(JSON.stringify({ error: "Agent not enabled for this organization" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2) Get or create conversation
      let convId = conversation_id;
      if (!convId) {
        const { data: conv } = await supabase
          .from("ai_agent_conversations")
          .insert({
            organization_id,
            channel: channel || "website",
            contact_name: contact_info?.name || "زائر",
            contact_phone: contact_info?.phone,
            contact_email: contact_info?.email,
            channel_contact_id: contact_info?.channel_id,
          })
          .select()
          .single();
        convId = conv?.id;
      }

      // 3) Save user message
      await supabase.from("ai_agent_messages").insert({
        conversation_id: convId,
        role: "customer",
        content: message,
        message_type: "text",
      });

      // 4) Get conversation history
      const { data: history } = await supabase
        .from("ai_agent_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(30);

      // 5) Get knowledge base
      const { data: knowledge } = await supabase
        .from("ai_agent_knowledge")
        .select("title, content, knowledge_type, category")
        .eq("organization_id", organization_id)
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(20);

      // 6) Get org info
      const { data: org } = await supabase
        .from("organizations")
        .select("name, organization_type, city, governorate, phone, email, website")
        .eq("id", organization_id)
        .single();

      // 7) Build system prompt
      const knowledgeContext = (knowledge || []).map(k =>
        `[${k.knowledge_type}${k.category ? ` - ${k.category}` : ""}] ${k.title}: ${k.content}`
      ).join("\n");

      const systemPrompt = `أنت "${config.agent_name}" - الوكيل الذكي لشركة "${org?.name || ""}".
نوع الجهة: ${org?.organization_type || "غير محدد"}
${org?.city ? `الموقع: ${org.city}${org.governorate ? `, ${org.governorate}` : ""}` : ""}
${org?.phone ? `هاتف: ${org.phone}` : ""}
${org?.website ? `موقع: ${org.website}` : ""}

## شخصيتك:
- الأسلوب: ${config.tone === "friendly_professional" ? "ودود ومهني" : config.tone === "formal" ? "رسمي" : "ودود وبسيط"}
- اللغة: ${config.language === "ar" ? "العربية" : "الإنجليزية"}
- أنت تتحدث كأنك موظف حقيقي في الشركة، لا كروبوت
- ردودك مخصصة ومبنية على بيانات الشركة الفعلية
- لا تقل أبداً "أنا بوت" أو "أنا ذكاء اصطناعي"

## قاعدة المعرفة:
${knowledgeContext || "لا توجد بيانات مخصصة بعد."}

## مهامك الأساسية:
1. الرد على استفسارات العملاء بناءً على قاعدة المعرفة
2. جمع معلومات الطلبات (الاسم، الهاتف، العنوان، نوع الخدمة، الكمية)
3. عند اكتمال بيانات الطلب، قم بتلخيصه بصيغة JSON داخل بلوك:
   \`\`\`order
   {"customer_name":"...","customer_phone":"...","customer_address":"...","order_type":"...","items":[{"name":"...","quantity":"..."}],"notes":"..."}
   \`\`\`
4. ${config.escalation_keywords?.length ? `إذا ذكر العميل: ${config.escalation_keywords.join("، ")} → أبلغه: "${config.escalation_message}"` : ""}

## تعليمات خاصة:
- كن مختصراً (3 جمل كحد أقصى في الرد العادي)
- اطرح سؤالاً واحداً في كل رد لجمع المعلومات
- لا تختلق معلومات غير موجودة في قاعدة المعرفة
- إذا لم تعرف الإجابة قل: "سأحول سؤالك لفريقنا المتخصص"`;

      // Convert history to OpenAI format
      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...(history || []).map(h => ({
          role: h.role === "customer" ? "user" : "assistant",
          content: h.content,
        })),
      ];

      // 8) Call AI
      const startTime = Date.now();
      const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
      const aiResponse = await callAIWithRetry(LOVABLE_API_KEY, {
        messages: chatMessages,
        stream: false,
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiResponse.json();
      const reply = aiData.choices?.[0]?.message?.content || "عذراً، لم أتمكن من المعالجة.";
      const responseTime = Date.now() - startTime;

      // 9) Save agent reply
      await supabase.from("ai_agent_messages").insert({
        conversation_id: convId,
        role: "agent",
        content: reply,
        message_type: "text",
        response_time_ms: responseTime,
        tokens_used: aiData.usage?.total_tokens || 0,
      });

      // 10) Update conversation
      await supabase
        .from("ai_agent_conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          message_count: (history?.length || 0) + 2,
        })
        .eq("id", convId);

      // 11) Check for order in reply
      const orderMatch = reply.match(/```order\s*([\s\S]*?)```/);
      let orderCreated = null;
      if (orderMatch && config.auto_create_orders) {
        try {
          const orderData = JSON.parse(orderMatch[1]);
          const { data: order } = await supabase
            .from("ai_agent_orders")
            .insert({
              conversation_id: convId,
              organization_id,
              customer_name: orderData.customer_name || contact_info?.name || "عميل",
              customer_phone: orderData.customer_phone || contact_info?.phone,
              customer_email: orderData.customer_email,
              customer_address: orderData.customer_address,
              order_type: orderData.order_type || "collection_request",
              items: orderData.items || [],
              notes: orderData.notes,
              channel: channel || "website",
            })
            .select()
            .single();

          orderCreated = order;

          // Update conversation
          await supabase
            .from("ai_agent_conversations")
            .update({ order_created: true, order_id: order?.id })
            .eq("id", convId);

          // Update stats
          await supabase.rpc("increment_field", { 
            table_name: "ai_agent_configs",
            field_name: "total_orders_created",
            row_id: config.id,
          }).catch(() => {});

          // Notify org if enabled
          if (config.notify_on_new_order) {
            // Create notification for all org members
            const { data: members } = await supabase
              .from("user_organizations")
              .select("user_id")
              .eq("organization_id", organization_id);

            if (members?.length) {
              const notifications = members.map(m => ({
                user_id: m.user_id,
                title: "🎉 أوردر جديد من الوكيل الذكي!",
                message: `عميل جديد: ${orderData.customer_name || "غير محدد"} - ${orderData.order_type || "طلب"}`,
                type: "order",
                organization_id,
                is_read: false,
              }));
              await supabase.from("notifications").insert(notifications).catch(() => {});
            }
          }
        } catch (e) {
          console.error("Failed to parse order:", e);
        }
      }

      // Clean reply (remove order JSON block for display)
      const cleanReply = reply.replace(/```order[\s\S]*?```/g, "").trim();

      return new Response(JSON.stringify({
        conversation_id: convId,
        reply: cleanReply || "تم تسجيل طلبك بنجاح! سيتواصل معك فريقنا قريباً.",
        order: orderCreated,
        response_time_ms: responseTime,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Action: Get agent config (for widget) ===
    if (action === "get_config") {
      const { organization_id } = body;
      const { data: config } = await supabase
        .from("ai_agent_configs")
        .select("agent_name, welcome_message, website_widget_enabled, working_hours_start, working_hours_end, outside_hours_message, language")
        .eq("organization_id", organization_id)
        .eq("is_enabled", true)
        .single();

      return new Response(JSON.stringify({ config }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Action: Webhook for external channels ===
    if (action === "webhook") {
      const { channel, organization_id, sender_id, sender_name, message: msg } = body;

      // Route to chat action
      const chatResult = await fetch(`${supabaseUrl}/functions/v1/smart-agent`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          action: "chat",
          organization_id,
          message: msg,
          channel,
          contact_info: { name: sender_name, channel_id: sender_id },
        }),
      });

      const result = await chatResult.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Smart agent error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
