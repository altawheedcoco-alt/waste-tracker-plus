import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_BASE_URL = "https://irecycle21.lovable.app";

// Map button IDs to platform actions
const BUTTON_ACTIONS: Record<string, { newStatus: string; label: string }> = {
  approve: { newStatus: "approved", label: "تمت الموافقة" },
  start_transit: { newStatus: "in_transit", label: "بدأ النقل" },
  confirm_delivery: { newStatus: "delivered", label: "تم التسليم" },
  confirm_receipt: { newStatus: "confirmed", label: "تم تأكيد الاستلام" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "lovable_whatsapp_verify";

  // GET = Webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Verification failed", { status: 403, headers: corsHeaders });
  }

  // POST = Incoming messages & status updates
  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        // Handle message status updates
        if (value.statuses) {
          for (const status of value.statuses) {
            const { id: waMessageId, status: msgStatus, timestamp } = status;
            await supabase
              .from("whatsapp_messages")
              .update({ 
                status: msgStatus,
                updated_at: new Date(parseInt(timestamp) * 1000).toISOString(),
              })
              .eq("meta_message_id", waMessageId);
          }
        }

        // Handle incoming messages (including button replies)
        if (value.messages) {
          for (const message of value.messages) {
            const fromPhone = message.from;
            const waMessageId = message.id;

            // Check if this is an interactive button reply
            if (message.type === "interactive" && message.interactive?.type === "button_reply") {
              const buttonId = message.interactive.button_reply.id || "";
              const buttonTitle = message.interactive.button_reply.title || "";

              console.log(`[Webhook] Button reply from ${fromPhone}: ${buttonId} - ${buttonTitle}`);

              // Parse button action: format is "action_shipmentId"
              const parts = buttonId.split("_");
              const shipmentId = parts[parts.length - 1];
              const actionKey = parts.slice(0, -1).join("_");

              // Handle "view" button - just log, no action needed
              if (actionKey === "view") {
                await supabase.from("whatsapp_messages").insert({
                  direction: "inbound",
                  from_phone: fromPhone,
                  message_type: "button_reply",
                  content: `عرض الشحنة: ${shipmentId}`,
                  meta_message_id: waMessageId,
                  status: "delivered",
                  metadata: { button_id: buttonId, action: "view", shipment_id: shipmentId },
                });

                // Send back the link
                const linkText = `🔗 رابط الشحنة:\n${APP_BASE_URL}/dashboard/s/${shipmentId}`;
                // We'll just log it - the user already has the link in the original message
                continue;
              }

              // Handle action buttons (approve, start_transit, etc.)
              const action = BUTTON_ACTIONS[actionKey];
              if (action && shipmentId) {
                // Find the user by phone number
                let cleanPhone = fromPhone.replace(/[\s+\-()]/g, "");
                const { data: userProfile } = await supabase
                  .from("profiles")
                  .select("id, organization_id, full_name")
                  .or(`phone.eq.${cleanPhone},phone.eq.+${cleanPhone},phone.eq.0${cleanPhone.slice(-10)}`)
                  .limit(1)
                  .single();

                if (userProfile) {
                  // Execute the status change
                  const { error: updateError } = await supabase
                    .from("shipments")
                    .update({ status: action.newStatus })
                    .eq("id", shipmentId);

                  if (!updateError) {
                    // Log the status change
                    await supabase.from("shipment_logs").insert({
                      shipment_id: shipmentId,
                      status: action.newStatus,
                      notes: `${action.label} عبر واتساب بواسطة ${userProfile.full_name || fromPhone}`,
                      changed_by: userProfile.id,
                    });

                    // Confirm back to user
                    await supabase.from("whatsapp_messages").insert({
                      direction: "inbound",
                      from_phone: fromPhone,
                      message_type: "button_reply",
                      content: `✅ ${action.label} - الشحنة ${shipmentId}`,
                      meta_message_id: waMessageId,
                      status: "delivered",
                      metadata: { 
                        button_id: buttonId, 
                        action: actionKey, 
                        shipment_id: shipmentId,
                        executed: true,
                        executed_by: userProfile.id,
                      },
                    });

                    console.log(`[Webhook] Action executed: ${actionKey} on shipment ${shipmentId} by ${userProfile.id}`);
                  } else {
                    console.error(`[Webhook] Failed to update shipment:`, updateError);
                    await supabase.from("whatsapp_messages").insert({
                      direction: "inbound",
                      from_phone: fromPhone,
                      message_type: "button_reply",
                      content: `❌ فشل تنفيذ الإجراء: ${buttonTitle}`,
                      meta_message_id: waMessageId,
                      status: "delivered",
                      metadata: { button_id: buttonId, error: updateError.message },
                    });
                  }
                } else {
                  console.warn(`[Webhook] Unknown user for phone ${fromPhone}`);
                  await supabase.from("whatsapp_messages").insert({
                    direction: "inbound",
                    from_phone: fromPhone,
                    message_type: "button_reply",
                    content: `رد زر: ${buttonTitle} (مستخدم غير معروف)`,
                    meta_message_id: waMessageId,
                    status: "delivered",
                    metadata: { button_id: buttonId, action: actionKey, unmatched: true },
                  });
                }
              }
              continue;
            }

            // Regular text message
            const messageBody = message.text?.body || message.type;
            await supabase.from("whatsapp_messages").insert({
              direction: "inbound",
              from_phone: fromPhone,
              to_phone: value.metadata?.display_phone_number,
              message_type: message.type === "text" ? "text" : message.type,
              content: messageBody,
              meta_message_id: waMessageId,
              status: "delivered",
              metadata: {
                profile_name: value.contacts?.[0]?.profile?.name,
                wa_id: value.contacts?.[0]?.wa_id,
              },
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
