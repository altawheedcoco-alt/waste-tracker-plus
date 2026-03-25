import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-camera-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // ============ Webhook: Camera sends plate detection event ============
    if (action === "plate_detected") {
      const {
        facility_organization_id,
        camera_id,
        plate_number,
        photo_url,
        video_clip_url,
        confidence_score,
        event_timestamp,
        metadata,
      } = body;

      if (!facility_organization_id || !plate_number) {
        return new Response(JSON.stringify({ error: "facility_organization_id and plate_number required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Try to match plate to a fleet vehicle
      const { data: vehicles } = await supabase
        .from("fleet_vehicles")
        .select("id, organization_id, plate_number, driver_name")
        .ilike("plate_number", plate_number.trim());

      // Also check drivers table
      const { data: drivers } = await supabase
        .from("drivers")
        .select("id, organization_id, vehicle_plate, profile_id")
        .ilike("vehicle_plate", plate_number.trim());

      let matchedVehicleId: string | null = null;
      let matchedDriverId: string | null = null;
      let shipmentId: string | null = null;
      let generatorOrgId: string | null = null;
      let plateMatched = false;

      // 2. Find active shipment destined to this facility with this vehicle/driver
      if (vehicles && vehicles.length > 0) {
        matchedVehicleId = vehicles[0].id;
        plateMatched = true;

        // Find shipment going to this facility
        const { data: shipments } = await supabase
          .from("shipments")
          .select("id, generator_id, transporter_id, recycler_id, status")
          .or(`recycler_id.eq.${facility_organization_id},destination_facility_id.eq.${facility_organization_id}`)
          .in("status", ["in_transit", "picked_up", "on_the_way"])
          .order("created_at", { ascending: false })
          .limit(5);

        if (shipments && shipments.length > 0) {
          // Match shipment by transporter org (vehicle owner)
          const matched = shipments.find(s => s.transporter_id === vehicles[0].organization_id);
          if (matched) {
            shipmentId = matched.id;
            generatorOrgId = matched.generator_id;
          } else {
            // Take first available
            shipmentId = shipments[0].id;
            generatorOrgId = shipments[0].generator_id;
          }
        }
      }

      if (drivers && drivers.length > 0) {
        matchedDriverId = drivers[0].id;
        plateMatched = true;

        // If no shipment found via vehicle, try via driver assignment
        if (!shipmentId) {
          const { data: assignments } = await supabase
            .from("driver_shipment_assignments")
            .select("shipment_id")
            .eq("driver_id", drivers[0].id)
            .eq("status", "active")
            .order("assigned_at", { ascending: false })
            .limit(1);

          if (assignments && assignments.length > 0) {
            const { data: shipment } = await supabase
              .from("shipments")
              .select("id, generator_id")
              .eq("id", assignments[0].shipment_id)
              .single();

            if (shipment) {
              shipmentId = shipment.id;
              generatorOrgId = shipment.generator_id;
            }
          }
        }
      }

      // 3. Insert camera event
      const { data: event, error } = await supabase
        .from("camera_arrival_events")
        .insert({
          facility_organization_id,
          camera_id: camera_id || null,
          shipment_id: shipmentId,
          plate_number: plate_number.trim(),
          plate_matched: plateMatched,
          photo_url: photo_url || null,
          video_clip_url: video_clip_url || null,
          confidence_score: confidence_score || null,
          event_timestamp: event_timestamp || new Date().toISOString(),
          matched_vehicle_id: matchedVehicleId,
          matched_driver_id: matchedDriverId,
          generator_organization_id: generatorOrgId,
          arrival_verified: plateMatched && !!shipmentId,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      // 4. If matched, update shipment status and notify generator (only if grant exists)
      if (shipmentId && plateMatched) {
        // Add to chain of custody
        await supabase.from("chain_of_custody").insert({
          shipment_id: shipmentId,
          organization_id: facility_organization_id,
          event_type: "camera_arrival_verified",
          event_description: `وصول مؤكد بالكاميرا - لوحة المركبة: ${plate_number}`,
          actor_name: "نظام الكاميرات الذكية",
          actor_role: "camera_system",
          evidence_urls: photo_url ? [photo_url] : [],
          custody_hash: "auto",
          previous_hash: "auto",
          block_number: 0,
        });

        // Only notify generator if they have an active camera access grant
        if (generatorOrgId) {
          const { data: grant } = await supabase
            .from("camera_access_grants")
            .select("id")
            .eq("facility_organization_id", facility_organization_id)
            .eq("granted_to_organization_id", generatorOrgId)
            .eq("is_active", true)
            .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
            .maybeSingle();

          if (grant) {
            await supabase.from("notifications").insert({
              organization_id: generatorOrgId,
              title: "✅ تأكيد وصول الشحنة بالكاميرا",
              message: `تم تأكيد وصول المركبة (${plate_number}) إلى مرفق الاستلام عبر نظام الكاميرات الذكية`,
              type: "shipment_update",
              priority: "high",
              metadata: {
                shipment_id: shipmentId,
                camera_event_id: event.id,
                plate_number,
                photo_url,
              },
            });
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        event,
        matched: plateMatched,
        shipment_found: !!shipmentId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ Get arrival events for a shipment ============
    if (action === "get_arrivals") {
      const { shipment_id } = body;

      // Auth check for this endpoint
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "غير مصرح" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("camera_arrival_events")
        .select(`
          *,
          camera:facility_cameras(camera_name, camera_location)
        `)
        .eq("shipment_id", shipment_id)
        .order("event_timestamp", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, events: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Camera webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
