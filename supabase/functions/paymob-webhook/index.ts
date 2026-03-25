import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const HMAC_SECRET = Deno.env.get("PAYMOB_HMAC_SECRET");

    // Handle GET for Paymob callback redirect
    if (req.method === "GET") {
      const url = new URL(req.url);
      const success = url.searchParams.get("success") === "true";
      const orderId = url.searchParams.get("order");
      const transactionId = url.searchParams.get("id");

      // Redirect to app with result
      const redirectUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/subscription?status=${success ? 'success' : 'failed'}&order=${orderId}`;
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl, ...corsHeaders },
      });
    }

    // POST - Webhook from Paymob
    const body = await req.json();
    console.log("Paymob webhook received:", JSON.stringify(body).substring(0, 500));

    const { type, obj } = body;

    // Verify HMAC if configured
    if (HMAC_SECRET) {
      const hmac = body.hmac;
      if (hmac) {
        // Paymob HMAC verification
        const concatenated = [
          obj.amount_cents,
          obj.created_at,
          obj.currency,
          obj.error_occured,
          obj.has_parent_transaction,
          obj.id,
          obj.integration_id,
          obj.is_3d_secure,
          obj.is_auth,
          obj.is_capture,
          obj.is_refunded,
          obj.is_standalone_payment,
          obj.is_voided,
          obj.order?.id,
          obj.owner,
          obj.pending,
          obj.source_data?.pan,
          obj.source_data?.sub_type,
          obj.source_data?.type,
          obj.success,
        ].join("");

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(HMAC_SECRET),
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(concatenated));
        const computedHmac = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        if (computedHmac !== hmac) {
          console.error("HMAC verification failed");
          return new Response(
            JSON.stringify({ error: "HMAC verification failed" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (type === "TRANSACTION") {
      const orderId = String(obj.order?.id);
      const transactionId = String(obj.id);
      const isSuccess = obj.success === true;
      const amountCents = obj.amount_cents;
      const sourceType = obj.source_data?.type; // card, wallet
      const sourcePan = obj.source_data?.pan;
      const sourceSubType = obj.source_data?.sub_type; // Visa, MasterCard, etc

      // Find the pending transaction
      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("*, metadata")
        .eq("provider_order_id", orderId)
        .eq("status", "pending")
        .single();

      if (!transaction) {
        console.error("Transaction not found for order:", orderId);
        return new Response(
          JSON.stringify({ error: "Transaction not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update transaction
      await supabase
        .from("payment_transactions")
        .update({
          provider_transaction_id: transactionId,
          status: isSuccess ? "success" : "failed",
          error_message: isSuccess ? null : (obj.data?.message || "Payment failed"),
          card_last_four: sourcePan,
          card_brand: sourceSubType,
          payment_method: sourceType || transaction.payment_method,
        })
        .eq("id", transaction.id);

      if (isSuccess) {
        const planId = transaction.metadata?.plan_id;

        // Get plan for duration
        let durationDays = 30;
        if (planId) {
          const { data: plan } = await supabase
            .from("subscription_plans")
            .select("duration_days")
            .eq("id", planId)
            .single();
          if (plan) durationDays = plan.duration_days;
        }

        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        // Upsert subscription
        const { data: existingSub } = await supabase
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", transaction.user_id)
          .single();

        if (existingSub) {
          await supabase
            .from("user_subscriptions")
            .update({
              status: "active",
              plan_id: planId,
              start_date: now.toISOString(),
              expiry_date: expiryDate.toISOString(),
              last_payment_date: now.toISOString(),
              payment_method: sourceType || transaction.payment_method,
              organization_id: transaction.organization_id,
            })
            .eq("id", existingSub.id);
        } else {
          await supabase
            .from("user_subscriptions")
            .insert({
              user_id: transaction.user_id,
              organization_id: transaction.organization_id,
              plan_id: planId,
              status: "active",
              start_date: now.toISOString(),
              expiry_date: expiryDate.toISOString(),
              last_payment_date: now.toISOString(),
              payment_method: sourceType || transaction.payment_method,
            });
        }

        // Send notification
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "✅ تم تفعيل اشتراكك بنجاح",
          message: `تم استلام دفعتك بنجاح (${amountCents / 100} جنيه). اشتراكك فعال حتى ${expiryDate.toLocaleDateString("ar-EG")}.`,
          type: "payment_success",
        });

        // Send WhatsApp if configured
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", transaction.user_id)
            .single();

          if (profile?.phone) {
            await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to_phone: profile.phone,
                template_name: "payment_confirmation",
                template_params: [String(amountCents / 100), transactionId],
                user_id: transaction.user_id,
                organization_id: transaction.organization_id,
              }),
            });
          }
        } catch (waError) {
          console.error("WhatsApp notification error (non-blocking):", waError);
        }

        console.log(`Subscription activated for user ${transaction.user_id} until ${expiryDate.toISOString()}`);
      } else {
        // Payment failed notification
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "❌ فشلت عملية الدفع",
          message: `لم تتم عملية الدفع. ${obj.data?.message || "يرجى المحاولة مرة أخرى."}`,
          type: "payment_failed",
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Paymob webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
