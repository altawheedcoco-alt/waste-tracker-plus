import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type OrganizationType = "generator" | "transporter" | "recycler" | "disposal";

interface CompleteGoogleRegistrationPayload {
  // org
  organizationType: OrganizationType;
  organizationName: string;
  organizationNameEn?: string;
  organizationEmail: string;
  organizationPhone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  region?: string;
  commercialRegister?: string;
  environmentalLicense?: string;
  activityType?: string;
  productionCapacity?: string;

  // user info
  fullName: string;
  phone: string;

  // legal representative
  representativeName?: string;
  representativePosition?: string;
  representativePhone?: string;
  representativeEmail?: string;
  representativeNationalId?: string;

  // delegate
  delegateName?: string;
  delegatePhone?: string;
  delegateEmail?: string;
  delegateNationalId?: string;

  // agent
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentNationalId?: string;
}

function requireNonEmpty(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${field}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user from the auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already has a profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: "المستخدم لديه حساب بالفعل" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: CompleteGoogleRegistrationPayload = await req.json();

    // Validate required fields
    requireNonEmpty(payload.fullName, "fullName");
    requireNonEmpty(payload.phone, "phone");
    requireNonEmpty(payload.organizationType, "organizationType");
    requireNonEmpty(payload.organizationName, "organizationName");
    requireNonEmpty(payload.organizationEmail, "organizationEmail");
    requireNonEmpty(payload.organizationPhone, "organizationPhone");
    requireNonEmpty(payload.address, "address");
    requireNonEmpty(payload.city, "city");

    // 1) Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: payload.organizationName,
        name_en: payload.organizationNameEn || null,
        organization_type: payload.organizationType,
        email: payload.organizationEmail,
        phone: payload.organizationPhone,
        secondary_phone: payload.secondaryPhone || null,
        address: payload.address,
        city: payload.city,
        region: payload.region || null,
        commercial_register: payload.commercialRegister || null,
        environmental_license: payload.environmentalLicense || null,
        activity_type: payload.activityType || null,
        production_capacity: payload.productionCapacity || null,
        representative_name: payload.representativeName || null,
        representative_position: payload.representativePosition || null,
        representative_phone: payload.representativePhone || null,
        representative_email: payload.representativeEmail || null,
        representative_national_id: payload.representativeNationalId || null,
        delegate_name: payload.delegateName || null,
        delegate_phone: payload.delegatePhone || null,
        delegate_email: payload.delegateEmail || null,
        delegate_national_id: payload.delegateNationalId || null,
        agent_name: payload.agentName || null,
        agent_phone: payload.agentPhone || null,
        agent_email: payload.agentEmail || null,
        agent_national_id: payload.agentNationalId || null,
        is_verified: false,
        is_active: false,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      console.error("complete-google-registration org insert error:", orgError);
      throw new Error(orgError?.message || "Failed to create organization");
    }

    // 2) Create profile linked to existing Google user
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: user.id,
      organization_id: org.id,
      full_name: payload.fullName,
      email: user.email,
      phone: payload.phone,
      is_active: false,
    });

    if (profileError) {
      console.error("complete-google-registration profile insert error:", profileError);
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      throw new Error(profileError.message || "Failed to create profile");
    }

    // 3) Assign company_admin role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: user.id,
      role: "company_admin",
    });

    if (roleError) {
      console.error("complete-google-registration role insert error:", roleError);
      await supabaseAdmin.from("profiles").delete().eq("user_id", user.id);
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      throw new Error(roleError.message || "Failed to assign role");
    }

    // 4) Update user metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: payload.fullName,
        organization_id: org.id,
      },
    });

    return new Response(JSON.stringify({ success: true, organization_id: org.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in complete-google-registration:", error);
    const msg = typeof error?.message === "string" ? error.message : "Unknown error";
    const isBadRequest = msg.startsWith("Missing required field:");
    return new Response(JSON.stringify({ error: msg }), {
      status: isBadRequest ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
