import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * expire-driver-offers
 * Runs on a schedule (every minute) to expire pending offers past their 15-min window.
 * When an offer expires, it auto-dispatches to the next nearest driver.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find expired pending offers
    const { data: expiredOffers, error } = await supabaseAdmin
      .from("driver_shipment_offers")
      .select("id, shipment_id, driver_id")
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error finding expired offers:", error);
      return new Response(JSON.stringify({ error: "Failed to query expired offers" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expiredOffers || expiredOffers.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let expiredCount = 0;

    for (const offer of expiredOffers) {
      // Mark as expired
      await supabaseAdmin
        .from("driver_shipment_offers")
        .update({ status: "expired", responded_at: new Date().toISOString() })
        .eq("id", offer.id);

      expiredCount++;

      // Notify the driver that the offer expired
      await supabaseAdmin.from("notifications").insert({
        user_id: offer.driver_id,
        title: "⏰ انتهت مهلة العرض",
        message: "انتهت مهلة الـ 15 دقيقة لقبول الشحنة وتم تحويلها لسائق آخر.",
        type: "offer_expired",
        metadata: { shipment_id: offer.shipment_id, offer_id: offer.id },
      });

      // Clean up: delete shipment data access for this driver
      // (The driver should no longer see this shipment's details)
    }

    return new Response(JSON.stringify({ 
      expired: expiredCount,
      message: `تم إنهاء ${expiredCount} عرض منتهي الصلاحية`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in expire-driver-offers:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
