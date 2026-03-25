import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYMOB_API_URL = "https://accept.paymob.com/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const PAYMOB_API_KEY = Deno.env.get("PAYMOB_API_KEY");
    if (!PAYMOB_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Paymob not configured. Add PAYMOB_API_KEY secret." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { user_id, plan_id, payment_method = "card", organization_id } = body;

    if (!user_id || !plan_id) {
      return new Response(
        JSON.stringify({ error: "user_id and plan_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plan not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, email:id")
      .eq("id", user_id)
      .single();

    // Get integration IDs from config or env
    let cardIntegrationId = Deno.env.get("PAYMOB_CARD_INTEGRATION_ID");
    let walletIntegrationId = Deno.env.get("PAYMOB_WALLET_INTEGRATION_ID");
    let kioskIntegrationId = Deno.env.get("PAYMOB_KIOSK_INTEGRATION_ID");
    let iframeId = Deno.env.get("PAYMOB_IFRAME_ID");

    if (organization_id) {
      const { data: config } = await supabase
        .from("paymob_config")
        .select("*")
        .eq("organization_id", organization_id)
        .single();

      if (config) {
        cardIntegrationId = config.card_integration_id || cardIntegrationId;
        walletIntegrationId = config.wallet_integration_id || walletIntegrationId;
        kioskIntegrationId = config.kiosk_integration_id || kioskIntegrationId;
        iframeId = config.iframe_id || iframeId;
      }
    }

    // Step 1: Authenticate with Paymob
    const authRes = await fetch(`${PAYMOB_API_URL}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const authData = await authRes.json();
    const token = authData.token;

    if (!token) {
      throw new Error("Failed to authenticate with Paymob");
    }

    // Step 2: Create order
    const amountCents = Math.round(plan.price_egp * 100);
    const orderRes = await fetch(`${PAYMOB_API_URL}/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: `sub_${user_id}_${Date.now()}`,
        items: [{
          name: plan.name_ar,
          amount_cents: amountCents,
          quantity: 1,
          description: plan.description || plan.name_ar,
        }],
      }),
    });
    const orderData = await orderRes.json();

    if (!orderData.id) {
      throw new Error("Failed to create Paymob order");
    }

    // Determine integration ID based on payment method
    let integrationId: string;
    switch (payment_method) {
      case "wallet":
        integrationId = walletIntegrationId || "";
        break;
      case "kiosk":
        integrationId = kioskIntegrationId || "";
        break;
      default:
        integrationId = cardIntegrationId || "";
    }

    if (!integrationId) {
      return new Response(
        JSON.stringify({ error: `Integration ID for ${payment_method} not configured` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Generate payment key
    const nameParts = (profile?.full_name || "User").split(" ");
    const paymentKeyRes = await fetch(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderData.id,
        billing_data: {
          first_name: nameParts[0] || "N/A",
          last_name: nameParts.slice(1).join(" ") || "N/A",
          email: `${user_id}@platform.local`,
          phone_number: profile?.phone || "01000000000",
          apartment: "N/A",
          floor: "N/A",
          street: "N/A",
          building: "N/A",
          shipping_method: "N/A",
          postal_code: "N/A",
          city: "N/A",
          country: "EG",
          state: "N/A",
        },
        currency: "EGP",
        integration_id: parseInt(integrationId),
        lock_order_when_paid: true,
      }),
    });
    const paymentKeyData = await paymentKeyRes.json();

    if (!paymentKeyData.token) {
      throw new Error("Failed to generate payment key");
    }

    // Create pending transaction
    await supabase.from("payment_transactions").insert({
      user_id,
      organization_id,
      amount: plan.price_egp,
      currency: "EGP",
      payment_method,
      payment_provider: "paymob",
      provider_order_id: String(orderData.id),
      status: "pending",
      metadata: { plan_id, plan_name: plan.name_ar },
    });

    // Build response based on payment method
    let paymentUrl: string;
    if (payment_method === "wallet") {
      // For mobile wallets, need wallet pay endpoint
      paymentUrl = `${PAYMOB_API_URL}/acceptance/payments/pay`;
    } else if (payment_method === "kiosk") {
      paymentUrl = `${PAYMOB_API_URL}/acceptance/payments/pay`;
    } else {
      // Card payment - redirect to iframe
      paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKeyData.token}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: paymentUrl,
        payment_token: paymentKeyData.token,
        order_id: orderData.id,
        payment_method,
        amount: plan.price_egp,
        currency: "EGP",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Paymob checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
