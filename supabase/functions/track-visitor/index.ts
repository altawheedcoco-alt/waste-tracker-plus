import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle session end update
    if (body._update_session) {
      const { session_id, visitor_fingerprint, session_duration_seconds, max_scroll_depth, exit_page, pages_visited, bounce } = body;

      // Find the latest record for this session and update it
      const { data: existing } = await supabase
        .from("visitor_tracking")
        .select("id")
        .eq("session_id", session_id)
        .eq("visitor_fingerprint", visitor_fingerprint)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from("visitor_tracking").update({
          session_duration_seconds: session_duration_seconds || 0,
          max_scroll_depth: max_scroll_depth || 0,
          exit_page: exit_page || null,
          pages_visited: pages_visited || [],
          bounce: bounce ?? true,
        }).eq("id", existing[0].id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normal visit tracking
    const {
      visitor_fingerprint, user_agent, browser, os, device_type,
      screen_resolution, language, referrer, page_url, session_id,
      user_id, metadata, viewport_width, viewport_height,
      pages_visited, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    } = body;

    // Extract IP
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Geo lookup
    let country = null, city = null, region = null, latitude = null, longitude = null;
    if (ip_address && ip_address !== "unknown") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip_address}?fields=country,city,regionName,lat,lon`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          country = geo.country || null;
          city = geo.city || null;
          region = geo.regionName || null;
          latitude = geo.lat || null;
          longitude = geo.lon || null;
        }
      } catch { /* continue */ }
    }

    // Check returning visitor
    let is_returning = false;
    let visit_count = 1;
    if (visitor_fingerprint) {
      const { data: existing } = await supabase
        .from("visitor_tracking")
        .select("id, visit_count")
        .eq("visitor_fingerprint", visitor_fingerprint)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        is_returning = true;
        visit_count = (existing[0].visit_count || 0) + 1;
      }
    }

    const { error } = await supabase.from("visitor_tracking").insert({
      visitor_fingerprint, ip_address, country, city, region,
      latitude, longitude, user_agent, browser, os, device_type,
      screen_resolution, language, referrer, page_url, session_id,
      is_returning, visit_count,
      user_id: user_id || null,
      metadata: metadata || {},
      viewport_width: viewport_width || null,
      viewport_height: viewport_height || null,
      pages_visited: pages_visited || [],
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Track visitor error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
