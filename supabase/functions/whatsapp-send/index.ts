import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    if (!WHATSAPP_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: "WhatsApp not configured. Please add WHATSAPP_ACCESS_TOKEN." }),
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
      // Bulk send
      recipients, // Array of { phone, params }
    } = body;

    // Get org WhatsApp config
    let phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    
    if (organization_id) {
      const { data: config } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("organization_id", organization_id)
        .single();

      if (config?.phone_number_id) {
        phoneNumberId = config.phone_number_id;
      }

      if (config && !config.is_active) {
        return new Response(
          JSON.stringify({ error: "WhatsApp is disabled for this organization" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "WhatsApp Phone Number ID not configured." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle bulk send
    if (action === "bulk" && recipients?.length > 0) {
      const results = [];
      for (const recipient of recipients) {
        try {
          const result = await sendWhatsAppMessage({
            phoneNumberId,
            accessToken: WHATSAPP_ACCESS_TOKEN,
            to: recipient.phone,
            templateName: template_name,
            templateParams: recipient.params || template_params,
            messageText: message_text,
            messageType: message_type,
          });

          // Log message
          await supabase.from("whatsapp_messages").insert({
            organization_id,
            direction: "outbound",
            to_phone: recipient.phone,
            user_id: recipient.user_id,
            message_type: template_name ? "template" : message_type,
            content: message_text || template_name,
            template_params: recipient.params || template_params,
            meta_message_id: result.messages?.[0]?.id,
            status: result.messages ? "sent" : "failed",
            error_message: result.error?.message,
            notification_id,
            metadata,
          });

          results.push({ phone: recipient.phone, success: !!result.messages });
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

    const result = await sendWhatsAppMessage({
      phoneNumberId,
      accessToken: WHATSAPP_ACCESS_TOKEN,
      to: to_phone,
      templateName: template_name,
      templateParams: template_params,
      messageText: message_text,
      messageType: message_type,
    });

    // Log the message
    const { data: msgLog } = await supabase.from("whatsapp_messages").insert({
      organization_id,
      direction: "outbound",
      to_phone,
      user_id,
      message_type: template_name ? "template" : message_type,
      content: message_text || template_name,
      template_params,
      meta_message_id: result.messages?.[0]?.id,
      status: result.messages ? "sent" : "failed",
      error_message: result.error?.message,
      notification_id,
      metadata,
    }).select().single();

    if (result.error) {
      console.error("WhatsApp API error:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error, message_id: msgLog?.id }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message_id: msgLog?.id, wa_message_id: result.messages?.[0]?.id }),
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

interface SendParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName?: string;
  templateParams?: any;
  messageText?: string;
  messageType: string;
}

async function sendWhatsAppMessage(params: SendParams) {
  const { phoneNumberId, accessToken, to, templateName, templateParams, messageText, messageType } = params;
  
  // Format phone number (remove + and spaces)
  const formattedPhone = to.replace(/[\s+\-()]/g, "");

  let payload: any;

  if (templateName) {
    // Template message
    const components = [];
    if (templateParams && Array.isArray(templateParams)) {
      components.push({
        type: "body",
        parameters: templateParams.map((p: string) => ({
          type: "text",
          text: String(p),
        })),
      });
    }

    payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "ar" },
        components: components.length > 0 ? components : undefined,
      },
    };
  } else {
    // Text message
    payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "text",
      text: { body: messageText || "" },
    };
  }

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return await response.json();
}
