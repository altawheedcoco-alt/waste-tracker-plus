import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type OrganizationType = "generator" | "transporter" | "recycler";

interface AddOrganizationPayload {
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

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    // Get the authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: AddOrganizationPayload = await req.json();

    // Check if user already has any organizations
    const { data: existingOrgs, error: existingOrgsError } = await supabaseClient
      .rpc('get_user_organizations', { _user_id: user.id });
    
    if (existingOrgsError) {
      console.error("Error checking existing organizations:", existingOrgsError);
      throw new Error("فشل في التحقق من المنظمات الحالية");
    }

    // If user already has any organization, they cannot add more
    if (existingOrgs && existingOrgs.length > 0) {
      return badRequest("لا يمكنك إضافة منظمات جديدة. يُسمح بمنظمة واحدة فقط لكل حساب.");
    }

    // Basic server-side validation
    requireNonEmpty(payload.organizationType, "organizationType");
    requireNonEmpty(payload.organizationName, "organizationName");
    requireNonEmpty(payload.organizationEmail, "organizationEmail");
    requireNonEmpty(payload.organizationPhone, "organizationPhone");
    requireNonEmpty(payload.address, "address");
    requireNonEmpty(payload.city, "city");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // 1) Create organization (pending approval)
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
      console.error("add-organization org insert error:", orgError);
      // Check for duplicate email error
      if (orgError?.code === "23505" && orgError?.message?.includes("email")) {
        return badRequest("البريد الإلكتروني مستخدم بالفعل لمنظمة أخرى");
      }
      throw new Error(orgError?.message || "Failed to create organization");
    }

    // 2) Create user_organizations entry
    const { error: userOrgError } = await supabaseAdmin
      .from("user_organizations")
      .insert({
        user_id: user.id,
        organization_id: org.id,
        role_in_organization: "admin",
        is_primary: false, // Not primary since user already has a primary org
        is_active: true,
      });

    if (userOrgError) {
      console.error("add-organization user_organizations insert error:", userOrgError);
      // Rollback org creation
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      throw new Error(userOrgError.message || "Failed to link organization");
    }

    return new Response(JSON.stringify({ success: true, organization_id: org.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in add-organization:", error);
    const msg = typeof error?.message === "string" ? error.message : "Unknown error";
    const isBadRequest = msg.startsWith("Missing required field:");
    return new Response(JSON.stringify({ error: msg }), {
      status: isBadRequest ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
