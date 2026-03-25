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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find the test organizations
    const { data: generatorOrg } = await supabase
      .from("organizations")
      .select("id, name, phone")
      .eq("name", "عبدالله المولد للمخلفات")
      .maybeSingle();

    const { data: transporterOrg } = await supabase
      .from("organizations")
      .select("id, name, phone")
      .eq("name", "عبدالله الناقل للنقل")
      .maybeSingle();

    const { data: recyclerOrg } = await supabase
      .from("organizations")
      .select("id, name, phone")
      .eq("name", "عبدالله المدور للتدوير")
      .maybeSingle();

    // Find driver profile
    // Find driver record (FK references drivers table, not profiles)
    const { data: driverRecord } = await supabase
      .from("drivers")
      .select("id, profile_id")
      .eq("organization_id", transporterOrg?.id || "")
      .maybeSingle();

    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", "abdullah-driver@irecycle.test")
      .maybeSingle();

    if (!generatorOrg || !transporterOrg || !recyclerOrg) {
      return new Response(
        JSON.stringify({ error: "الجهات التجريبية غير موجودة. قم بتشغيل seed-demo-accounts أولاً" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate shipment number
    const shipmentNumber = `SHP-SIM-${Date.now().toString().slice(-6)}`;

    // Create the shipment
    const { data: shipment, error: shipErr } = await supabase
      .from("shipments")
      .insert({
        shipment_number: shipmentNumber,
        status: "new",
        waste_type: "plastic",
        quantity: 500,
        unit: "kg",
        pickup_address: "المنطقة الصناعية، العاشر من رمضان",
        pickup_latitude: 30.2833,
        pickup_longitude: 31.7833,
        delivery_address: "مصنع التدوير، مدينة بدر",
        delivery_latitude: 30.1167,
        delivery_longitude: 31.7167,
        generator_id: generatorOrg.id,
        transporter_id: transporterOrg.id,
        recycler_id: recyclerOrg.id,
        driver_id: driverRecord?.id || null,
        price_per_unit: 2.5,
        total_value: 1250,
        pickup_date: new Date().toISOString(),
        notes: "شحنة تجريبية - محاكاة دورة كاملة خلال 3 دقائق",
      })
      .select()
      .single();

    if (shipErr) {
      return new Response(
        JSON.stringify({ error: "فشل إنشاء الشحنة", details: shipErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whatsappUrl = `${supabaseUrl}/functions/v1/whatsapp-event`;
    const invokeHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    };

    // Helper: send WhatsApp notification to ALL parties
    async function notifyAllParties(eventType: string, extraFields: Record<string, any> = {}) {
      const basePayload = {
        event_type: eventType,
        shipment_id: shipment.id,
        shipment_number: shipmentNumber,
        waste_type: "بلاستيك",
        generator_name: generatorOrg.name,
        transporter_name: transporterOrg.name,
        recycler_name: recyclerOrg.name,
        driver_name: driverProfile?.full_name || "عبدالله السائق",
        ...extraFields,
      };

      // Send to each org separately
      const orgIds = [generatorOrg.id, transporterOrg.id, recyclerOrg.id];
      const results = [];

      for (const orgId of orgIds) {
        try {
          const res = await fetch(whatsappUrl, {
            method: "POST",
            headers: invokeHeaders,
            body: JSON.stringify({ ...basePayload, organization_id: orgId }),
          });
          const r = await res.json();
          results.push({ org: orgId, ...r });
        } catch (e: any) {
          results.push({ org: orgId, error: e.message });
        }
      }

      // Also send to driver phone directly
      try {
        const res = await fetch(whatsappUrl, {
          method: "POST",
          headers: invokeHeaders,
          body: JSON.stringify({ ...basePayload, customer_phone: "01157570643" }),
        });
        const r = await res.json();
        results.push({ driver_direct: true, ...r });
      } catch (e: any) {
        results.push({ driver_direct: true, error: e.message });
      }

      return results;
    }

    // Step 1: Notify creation (immediate)
    const creationResults = await notifyAllParties("shipment_created");
    console.log("[simulate] Step 1: Created", JSON.stringify(creationResults));

    // Schedule status changes over 3 minutes using setTimeout pattern
    // We'll use a background task approach

    const STEPS = [
      { delay: 30000, status: "approved", event: "shipment_approved" },       // 30s
      { delay: 60000, status: "collecting", event: "shipment_collecting" },    // 1min
      { delay: 90000, status: "in_transit", event: "shipment_in_transit" },    // 1.5min
      { delay: 150000, status: "delivered", event: "shipment_delivered" },     // 2.5min
      { delay: 180000, status: "confirmed", event: "shipment_confirmed" },    // 3min
    ];

    // Use EdgeRuntime.waitUntil for background processing
    const backgroundWork = (async () => {
      for (const step of STEPS) {
        await new Promise((r) => setTimeout(r, step.delay - (STEPS.indexOf(step) > 0 ? STEPS[STEPS.indexOf(step) - 1].delay : 0)));

        // Update shipment status
        await supabase
          .from("shipments")
          .update({ 
            status: step.status,
            ...(step.status === "collecting" ? { collection_started_at: new Date().toISOString() } : {}),
            ...(step.status === "in_transit" ? { in_transit_at: new Date().toISOString() } : {}),
            ...(step.status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
            ...(step.status === "confirmed" ? { confirmed_at: new Date().toISOString() } : {}),
            ...(step.status === "approved" ? { approved_at: new Date().toISOString() } : {}),
          })
          .eq("id", shipment.id);

        // Log the status change
        await supabase.from("shipment_logs").insert({
          shipment_id: shipment.id,
          status: step.status as any,
          notes: `محاكاة: تم التغيير إلى ${step.status}`,
        });

        // Notify all parties
        const results = await notifyAllParties(step.event);
        console.log(`[simulate] Step ${step.status}:`, JSON.stringify(results));
      }
    })();

    // Use waitUntil if available (Deno Deploy)
    try {
      (globalThis as any).EdgeRuntime?.waitUntil?.(backgroundWork);
    } catch {
      // Fallback: just let it run
      backgroundWork.catch(console.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إنشاء الشحنة وبدأت المحاكاة — ستتلقى الإشعارات على 01157570643 خلال 3 دقائق",
        shipment_id: shipment.id,
        shipment_number: shipmentNumber,
        parties: {
          generator: generatorOrg.name,
          transporter: transporterOrg.name,
          recycler: recyclerOrg.name,
          driver: driverProfile?.full_name || "عبدالله السائق",
        },
        timeline: [
          "0:00 — إنشاء الشحنة ✅ (تم)",
          "0:30 — الموافقة",
          "1:00 — بدء الجمع",
          "1:30 — في الطريق",
          "2:30 — تم التسليم",
          "3:00 — تأكيد الاستلام",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
