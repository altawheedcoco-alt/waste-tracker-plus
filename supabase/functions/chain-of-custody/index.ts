import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateHash(data: string, previousHash: string): string {
  // Simple deterministic hash for chain integrity
  let hash = 0;
  const str = previousHash + data;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, shipmentId, organizationId, eventType, eventDescription, actorId, actorName, actorRole, locationName, locationLat, locationLng, weightAtEvent, wasteType, evidenceUrls } = await req.json();

    if (action === "add_event") {
      // Get previous hash
      const { data: lastEntry } = await supabase
        .from("chain_of_custody")
        .select("custody_hash, block_number")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const previousHash = lastEntry?.custody_hash || "0000000000000000";
      const blockNumber = (lastEntry?.block_number || 0) + 1;
      const eventData = JSON.stringify({ shipmentId, eventType, eventDescription, actorId, weightAtEvent, timestamp: new Date().toISOString() });
      const custodyHash = generateHash(eventData, previousHash);

      const { data, error } = await supabase.from("chain_of_custody").insert({
        shipment_id: shipmentId,
        organization_id: organizationId,
        custody_hash: custodyHash,
        previous_hash: previousHash,
        event_type: eventType,
        event_description: eventDescription,
        actor_id: actorId,
        actor_name: actorName,
        actor_role: actorRole,
        location_name: locationName,
        location_lat: locationLat,
        location_lng: locationLng,
        weight_at_event: weightAtEvent,
        waste_type: wasteType,
        evidence_urls: evidenceUrls || [],
        block_number: blockNumber,
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, entry: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_chain") {
      const { data, error } = await supabase
        .from("chain_of_custody")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("block_number", { ascending: true });

      if (error) throw error;

      // Verify chain integrity
      let isValid = true;
      for (let i = 1; i < (data?.length || 0); i++) {
        if (data![i].previous_hash !== data![i - 1].custody_hash) {
          isValid = false;
          break;
        }
      }

      return new Response(JSON.stringify({ success: true, chain: data, isValid, totalBlocks: data?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      const { data } = await supabase
        .from("chain_of_custody")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("block_number", { ascending: true });

      let isValid = true;
      let brokenAt = -1;
      for (let i = 1; i < (data?.length || 0); i++) {
        if (data![i].previous_hash !== data![i - 1].custody_hash) {
          isValid = false;
          brokenAt = i;
          break;
        }
      }

      return new Response(JSON.stringify({ success: true, isValid, brokenAt, totalBlocks: data?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
