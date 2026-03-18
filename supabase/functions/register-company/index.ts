import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type OrganizationType = "generator" | "transporter" | "recycler" | "disposal" | "consultant" | "consulting_office" | "iso_body";

interface RegisterCompanyPayload {
  // auth
  email?: string;
  password: string;
  fullName: string;
  phone: string;
  registrationMethod?: "email" | "phone";

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

function generatePhoneEmail(phone: string): string {
  const cleaned = phone.replace(/[\s\-()+ ]/g, "");
  return `phone_${cleaned}@phone.irecycle.local`;
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

    const payload: RegisterCompanyPayload = await req.json();

    // Determine registration method
    const isPhoneRegistration = payload.registrationMethod === "phone" || (!payload.email && payload.phone);

    // Basic server-side validation
    requireNonEmpty(payload.password, "password");
    requireNonEmpty(payload.fullName, "fullName");
    requireNonEmpty(payload.phone, "phone");

    if (isPhoneRegistration) {
      if (payload.phone.replace(/[\s\-()]/g, "").length < 8) {
        return badRequest("رقم الهاتف غير صالح");
      }
    } else {
      requireNonEmpty(payload.email, "email");
    }

    requireNonEmpty(payload.organizationType, "organizationType");
    requireNonEmpty(payload.organizationName, "organizationName");
    requireNonEmpty(payload.organizationEmail, "organizationEmail");
    requireNonEmpty(payload.organizationPhone, "organizationPhone");
    requireNonEmpty(payload.address, "address");
    requireNonEmpty(payload.city, "city");

    if (payload.password.length < 6) {
      return badRequest("Password must be at least 6 characters long");
    }

    const authEmail = isPhoneRegistration ? generatePhoneEmail(payload.phone) : payload.email!;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    // Check duplicates
    if (isPhoneRegistration) {
      const normalizedPhone = payload.phone.replace(/[\s\-()]/g, "");
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`phone.eq.${normalizedPhone},phone.eq.${normalizedPhone.replace(/^\+/, "")}`)
        .limit(1)
        .maybeSingle();
      if (existingProfile) {
        return badRequest("رقم الهاتف مسجل بالفعل");
      }
    }

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
      console.error("register-company org insert error:", orgError);
      throw new Error(orgError?.message || "Failed to create organization");
    }

    // 2) Create auth user
    const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin
      .createUser({
        email: authEmail,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          full_name: payload.fullName,
          organization_id: org.id,
          registration_method: isPhoneRegistration ? "phone" : "email",
        },
      });

    if (createUserError || !createdUser?.user) {
      console.error("register-company createUser error:", createUserError);
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      
      const errorCode = (createUserError as any)?.code;
      if (errorCode === "email_exists") {
        return new Response(JSON.stringify({ error: isPhoneRegistration ? "رقم الهاتف مسجل بالفعل." : "هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد آخر أو تسجيل الدخول." }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(createUserError?.message || "Failed to create user");
    }

    const userId = createdUser.user.id;

    // 3) Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      organization_id: org.id,
      full_name: payload.fullName,
      email: isPhoneRegistration ? null : payload.email,
      phone: payload.phone,
      is_active: false,
    });

    if (profileError) {
      console.error("register-company profile insert error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      throw new Error(profileError.message || "Failed to create profile");
    }

    // 4) Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "company_admin",
    });

    if (roleError) {
      console.error("register-company role insert error:", roleError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from("organizations").delete().eq("id", org.id);
      throw new Error(roleError.message || "Failed to assign role");
    }

    // 5) Send notification to admins
    try {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "super_admin"]);

      if (adminRoles && adminRoles.length > 0) {
        const identifier = isPhoneRegistration ? `برقم ${payload.phone}` : `بالبريد ${payload.email}`;
        const notifications = adminRoles.map((r: any) => ({
          user_id: r.user_id,
          title: "تسجيل شركة جديدة",
          message: `قام ${payload.fullName} بتسجيل ${payload.organizationName} (${payload.organizationType}) ${identifier}`,
          type: "new_registration",
          is_read: false,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch (e) {
      console.error("Notification error (non-critical):", e);
    }

    return new Response(JSON.stringify({ success: true, organization_id: org.id, auth_email: authEmail }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in register-company:", error);
    const msg = typeof error?.message === "string" ? error.message : "Unknown error";
    const isBadRequest = msg.startsWith("Missing required field:") || msg.includes("Password");
    return new Response(JSON.stringify({ error: msg }), {
      status: isBadRequest ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
