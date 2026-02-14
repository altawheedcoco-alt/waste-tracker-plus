import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "lovable_whatsapp_verify";

  // GET = Webhook verification from Meta
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
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

        // Handle message status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            const { id: waMessageId, status: msgStatus, timestamp } = status;

            // Update message status in our DB
            const { error } = await supabase
              .from("whatsapp_messages")
              .update({ 
                status: msgStatus,
                updated_at: new Date(parseInt(timestamp) * 1000).toISOString(),
              })
              .eq("meta_message_id", waMessageId);

            if (error) {
              console.error("Error updating message status:", error);
            }
          }
        }

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            const fromPhone = message.from;
            const messageBody = message.text?.body || message.type;
            const waMessageId = message.id;

            // Log inbound message
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

            console.log(`Inbound message from ${fromPhone}: ${messageBody}`);
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
    // Always return 200 to Meta to avoid retries
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
