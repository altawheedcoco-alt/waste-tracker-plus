import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WAPILOT_BASE = "https://api.wapilot.net/api/v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const WAPILOT_TOKEN = Deno.env.get("WAPILOT_API_TOKEN");
    if (!WAPILOT_TOKEN) {
      return new Response(
        JSON.stringify({ error: "WaPilot not configured. Please add WAPILOT_API_TOKEN." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      action = "send",
      to_phone,
      organization_id,
      user_id,
      template_name,
      template_params,
      message_text,
      message_type = "text",
      notification_id,
      metadata,
      instance_id,
      recipients,
    } = body;

    // Check org config
    if (organization_id) {
      const { data: config } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("organization_id", organization_id)
        .single();

      if (config && !config.is_active) {
        return new Response(
          JSON.stringify({ error: "WhatsApp is disabled for this organization" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Resolve WaPilot instance — use provided or fetch first available
    let activeInstanceId = instance_id;
    if (!activeInstanceId) {
      const listRes = await fetch(`${WAPILOT_BASE}/instances`, {
        headers: { token: WAPILOT_TOKEN },
      });
      const instances = await listRes.json();
      if (Array.isArray(instances) && instances.length > 0) {
        activeInstanceId = instances[0].id;
      }
    }

    if (!activeInstanceId) {
      return new Response(
        JSON.stringify({ error: "No WaPilot instance available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message text from template if needed
    let finalText = message_text || "";
    if (template_name && !finalText) {
      // Fetch template from DB and fill params
      const { data: tpl } = await supabase
        .from("whatsapp_templates")
        .select("body_text")
        .eq("template_name", template_name)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (tpl?.body_text) {
        finalText = tpl.body_text;
        if (Array.isArray(template_params)) {
          template_params.forEach((p: string, i: number) => {
            finalText = finalText.replace(`{{${i + 1}}}`, String(p));
          });
        }
      } else {
        finalText = template_name;
      }
    }

    // Helper: send single message via WaPilot
    const sendOne = async (phone: string, text: string) => {
      const formattedPhone = phone.replace(/[\s+\-()]/g, "");
      const chatId = formattedPhone.endsWith("@c.us") ? formattedPhone : `${formattedPhone}@c.us`;

      const res = await fetch(`${WAPILOT_BASE}/${activeInstanceId}/send-message`, {
        method: "POST",
        headers: { token: WAPILOT_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return await res.json();
    };

    // Handle bulk send
    if (action === "bulk" && recipients?.length > 0) {
      const results = [];
      for (const recipient of recipients) {
        try {
          let recipientText = finalText;
          if (recipient.params && Array.isArray(recipient.params)) {
            // Re-resolve template with recipient-specific params
            if (template_name) {
              const { data: tpl } = await supabase
                .from("whatsapp_templates")
                .select("body_text")
                .eq("template_name", template_name)
                .eq("is_active", true)
                .limit(1)
                .single();
              if (tpl?.body_text) {
                recipientText = tpl.body_text;
                recipient.params.forEach((p: string, i: number) => {
                  recipientText = recipientText.replace(`{{${i + 1}}}`, String(p));
                });
              }
            }
          }

          const result = await sendOne(recipient.phone, recipientText);

          await supabase.from("whatsapp_messages").insert({
            organization_id,
            direction: "outbound",
            to_phone: recipient.phone,
            user_id: recipient.user_id,
            message_type: template_name ? "template" : message_type,
            content: recipientText,
            template_params: recipient.params || template_params,
            status: result.error ? "failed" : "sent",
            error_message: result.error || null,
            notification_id,
            metadata,
          });

          results.push({ phone: recipient.phone, success: !result.error });
        } catch (e) {
          results.push({ phone: recipient.phone, success: false, error: e.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single send
    if (!to_phone) {
      return new Response(
        JSON.stringify({ error: "to_phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendOne(to_phone, finalText);

    // Log the message
    const { data: msgLog } = await supabase.from("whatsapp_messages").insert({
      organization_id,
      direction: "outbound",
      to_phone,
      user_id,
      message_type: template_name ? "template" : message_type,
      content: finalText,
      template_params,
      status: result.error ? "failed" : "sent",
      error_message: result.error || null,
      notification_id,
      metadata,
    }).select().single();

    if (result.error) {
      console.error("WaPilot send error:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error, message_id: msgLog?.id }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message_id: msgLog?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
