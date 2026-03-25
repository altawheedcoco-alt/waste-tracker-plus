import { createClient } from "npm:@supabase/supabase-js@2";

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
      interactive_buttons,
      attachment_url,
      attachment_filename,
      check_visibility = false,
      from_org_id,
      to_org_id,
    } = body;

    // Health check endpoint for monitoring
    if (action === "health-check") {
      return new Response(
        JSON.stringify({ success: true, status: "ok", service: "whatsapp-send", timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Smart visibility check: respect partner masking rules
    if (check_visibility && from_org_id && to_org_id) {
      const { data: vis } = await supabase
        .from("partner_visibility_settings")
        .select("can_receive_notifications, can_view_recycler_info, can_view_generator_info")
        .eq("organization_id", from_org_id)
        .eq("partner_organization_id", to_org_id)
        .single();

      if (vis?.can_receive_notifications === false) {
        return new Response(
          JSON.stringify({ success: false, blocked: true, reason: "Notifications blocked by visibility settings" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check shipment-level masking
      if (metadata?.shipment_id) {
        const { data: shipment } = await supabase
          .from("shipments")
          .select("hide_recycler_from_generator, hide_generator_from_recycler, generator_organization_id, recycler_organization_id")
          .eq("id", metadata.shipment_id)
          .single();

        if (shipment) {
          // If recycler is hidden from generator and we're sending from recycler to generator
          if (shipment.hide_recycler_from_generator &&
              from_org_id === shipment.recycler_organization_id &&
              to_org_id === shipment.generator_organization_id) {
            return new Response(
              JSON.stringify({ success: false, blocked: true, reason: "Recycler hidden from generator" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          // If generator is hidden from recycler
          if (shipment.hide_generator_from_recycler &&
              from_org_id === shipment.generator_organization_id &&
              to_org_id === shipment.recycler_organization_id) {
            return new Response(
              JSON.stringify({ success: false, blocked: true, reason: "Generator hidden from recycler" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

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

    // Resolve WaPilot instance - prefer env var, then provided, then try API
    let activeInstanceId = instance_id || Deno.env.get("WAPILOT_INSTANCE_ID");
    if (!activeInstanceId) {
      try {
        const listRes = await fetch(`${WAPILOT_BASE}/instances`, {
          headers: { token: WAPILOT_TOKEN },
        });
        const instancesRaw = await listRes.json().catch(() => null);
        const instances = Array.isArray(instancesRaw) ? instancesRaw
          : (instancesRaw && typeof instancesRaw === 'object' && instancesRaw.id) ? [instancesRaw]
          : [];
        if (instances.length > 0) {
          activeInstanceId = instances[0].id;
        }
      } catch (e) {
        console.warn("Failed to list instances:", e);
      }
    }

    if (!activeInstanceId) {
      return new Response(
        JSON.stringify({ error: "No WaPilot instance available. Set WAPILOT_INSTANCE_ID or provide instance_id." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message text from template if needed
    let finalText = message_text || "";
    if (template_name && !finalText) {
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
    const sendOne = async (phone: string, text: string, docUrl?: string, docFilename?: string) => {
      // Clean phone: remove spaces, +, -, () then strip leading zeros
      let formattedPhone = phone.replace(/[\s+\-()]/g, "").replace(/^0+/, "");
      // If it looks like a local Egyptian number (starts with 1 and 10 digits), prepend 20
      if (/^1\d{9}$/.test(formattedPhone)) {
        formattedPhone = "20" + formattedPhone;
      }
      const chatId = formattedPhone.endsWith("@c.us") ? formattedPhone : `${formattedPhone}@c.us`;

      // If document URL provided, download it and upload as multipart to WaPilot send-file
      if (docUrl) {
        try {
          console.log("[WaPilot] Downloading file from:", docUrl);
          const fileResponse = await fetch(docUrl);
          if (!fileResponse.ok) throw new Error(`Failed to download file: ${fileResponse.status}`);
          
          const fileBlob = await fileResponse.blob();
          const fname = docFilename || "shipment-document.pdf";
          
          // Build multipart/form-data
          const formData = new FormData();
          formData.append("chat_id", chatId);
          formData.append("caption", fname);
          formData.append("media", new File([fileBlob], fname, { type: "application/pdf" }));

          console.log("[WaPilot] Uploading file via send-file (multipart)");
          const fileRes = await fetch(`${WAPILOT_BASE}/${activeInstanceId}/send-file`, {
            method: "POST",
            headers: { token: WAPILOT_TOKEN },
            body: formData,
          });
          const fileResult = await fileRes.text();
          console.log(`[WaPilot] send-file response (${fileRes.status}):`, fileResult);
        } catch (e) {
          console.warn("[WaPilot] File send failed:", e.message);
        }
      }

      // Build text message payload
      const msgPayload: any = { chat_id: chatId, text };

      // If interactive buttons are provided, use list/button format
      if (interactive_buttons?.length > 0) {
        msgPayload.interactive = {
          type: "button",
          body: { text },
          action: {
            buttons: interactive_buttons.map((btn: any, idx: number) => ({
              type: "reply",
              reply: { id: btn.id || `btn_${idx}`, title: btn.title },
            })),
          },
        };
      }

      const res = await fetch(`${WAPILOT_BASE}/${activeInstanceId}/send-message`, {
        method: "POST",
        headers: { token: WAPILOT_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify(msgPayload),
      });
      return await res.json();
    };

    // Handle send_to_user: resolve user phone from profiles
    if (action === "send_to_user" && user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user_id)
        .single();

      if (!profile?.phone) {
        return new Response(
          JSON.stringify({ success: false, error: "User has no phone number", user_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await sendOne(profile.phone, finalText);

      await supabase.from("whatsapp_messages").insert({
        organization_id,
        direction: "outbound",
        to_phone: profile.phone,
        user_id,
        message_type: "notification",
        content: finalText,
        status: result.error ? "failed" : "sent",
        error_message: result.error || null,
        notification_id,
        metadata,
      });

      return new Response(
        JSON.stringify({ success: !result.error, sent: result.error ? 0 : 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle broadcast_to_users: resolve phones from profiles
    if (action === "broadcast_to_users") {
      if (!body.user_ids?.length) {
        return new Response(
          JSON.stringify({ success: true, sent: 0, total: 0, skipped: "no_user_ids" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("id", body.user_ids);

      const validProfiles = (profiles || []).filter((p: any) => p.phone);
      let sentCount = 0;

      for (const profile of validProfiles) {
        try {
          const result = await sendOne(profile.phone, finalText);
          await supabase.from("whatsapp_messages").insert({
            organization_id,
            direction: "outbound",
            to_phone: profile.phone,
            user_id: profile.id,
            message_type: "notification",
            content: finalText,
            status: result.error ? "failed" : "sent",
            error_message: result.error || null,
            metadata,
            interactive_buttons: interactive_buttons || null,
          });
          if (!result.error) sentCount++;
        } catch (e) {
          console.warn("Broadcast send failed for", profile.id, e.message);
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent: sentCount, total: validProfiles.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle bulk send
    if (action === "bulk" && recipients?.length > 0) {
      const results = [];
      for (const recipient of recipients) {
        try {
          let recipientText = finalText;
          if (recipient.params && Array.isArray(recipient.params) && template_name) {
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
            interactive_buttons: interactive_buttons || null,
            attachment_url: attachment_url || null,
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

    const result = await sendOne(to_phone, finalText, attachment_url, attachment_filename);

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
      interactive_buttons: interactive_buttons || null,
      attachment_url: attachment_url || null,
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
