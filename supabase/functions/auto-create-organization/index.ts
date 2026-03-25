import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AutoCreatePayload {
  name: string;
  organization_type: string; // generator | recycler | disposal
  created_by_org_id?: string; // the transporter org that created this
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify caller with anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: AutoCreatePayload = await req.json();

    if (!payload.name?.trim()) {
      return new Response(JSON.stringify({ error: "اسم الجهة مطلوب" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTypes = ["generator", "recycler", "disposal", "transporter", "consultant", "consulting_office", "iso_body"];
    if (!validTypes.includes(payload.organization_type)) {
      return new Response(JSON.stringify({ error: "نوع الجهة غير صالح" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if org with same name and type already exists
    const { data: existing } = await adminClient
      .from("organizations")
      .select("id, name")
      .eq("name", payload.name.trim())
      .eq("organization_type", payload.organization_type)
      .maybeSingle();

    if (existing) {
      // Return existing org instead of creating duplicate
      return new Response(JSON.stringify({ 
        organization_id: existing.id, 
        name: existing.name,
        already_exists: true,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create org with minimal data — can be completed later
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name: payload.name.trim(),
        organization_type: payload.organization_type,
        email: `pending-${Date.now()}@autocreated.local`,
        phone: "0000000000",
        address: "",
        city: "",
        is_verified: false,
        is_active: true, // active so it can be used immediately
      })
      .select("id, name")
      .single();

    if (orgError || !org) {
      console.error("auto-create-organization error:", orgError);
      throw new Error(orgError?.message || "فشل في إنشاء حساب الجهة");
    }

    // If created by a transporter, auto-link them as partners
    if (payload.created_by_org_id) {
      await adminClient.from("verified_partnerships").insert({
        organization_id: payload.created_by_org_id,
        partner_id: org.id,
        status: "active",
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      }).then(({ error }) => {
        if (error) console.error("Auto-link partnership error (non-blocking):", error);
      });
    }

    return new Response(JSON.stringify({ 
      organization_id: org.id, 
      name: org.name,
      already_exists: false,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in auto-create-organization:", error);
    return new Response(JSON.stringify({ error: error.message || "حدث خطأ" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
