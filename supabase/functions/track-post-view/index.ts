import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { post_id, visitor_id, user_agent, device_type, browser, os, referrer } = await req.json();

    if (!post_id || !visitor_id) {
      return new Response(JSON.stringify({ error: "missing params" }), { status: 400, headers: corsHeaders });
    }

    // التقاط IP من الـ headers
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.rpc("track_post_view", {
      p_post_id: post_id,
      p_visitor_id: visitor_id,
      p_ip_address: ip_address,
      p_user_agent: user_agent || null,
      p_device_type: device_type || null,
      p_browser: browser || null,
      p_os: os || null,
      p_referrer: referrer || null,
    });

    return new Response(JSON.stringify({ ok: true, ip: ip_address }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
