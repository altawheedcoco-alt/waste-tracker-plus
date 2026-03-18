import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePhoneEmail(phone: string): string {
  const cleaned = phone.replace(/[\s\-()+ ]/g, "");
  return `phone_${cleaned}@phone.irecycle.local`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { 
      email, password, full_name, phone, 
      license_number, vehicle_type, vehicle_plate, license_expiry,
      registration_method,
    } = body;

    // Validate required fields
    if (!full_name || !password || !license_number) {
      return new Response(
        JSON.stringify({ error: "الاسم وكلمة المرور ورقم الرخصة مطلوبون" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isPhoneRegistration = registration_method === "phone" || (!email && phone);

    if (isPhoneRegistration && (!phone || phone.trim().length < 8)) {
      return new Response(
        JSON.stringify({ error: "رقم الهاتف مطلوب وغير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isPhoneRegistration && !email) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authEmail = isPhoneRegistration ? generatePhoneEmail(phone) : email;

    // Check duplicates
    if (isPhoneRegistration) {
      const normalizedPhone = phone.replace(/[\s\-()]/g, "");
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`phone.eq.${normalizedPhone},phone.eq.${normalizedPhone.replace(/^\+/, "")}`)
        .limit(1)
        .maybeSingle();
      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "رقم الهاتف مسجل بالفعل" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some(u => u.email === email);
      if (emailExists) {
        return new Response(
          JSON.stringify({ error: "البريد الإلكتروني مسجل بالفعل" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, registration_method: isPhoneRegistration ? "phone" : "email" },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create profile
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email: isPhoneRegistration ? null : email,
        full_name,
        phone,
        organization_id: null,
        is_active: false,
      })
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create driver record
    const { error: driverError } = await supabaseAdmin
      .from("drivers")
      .insert({
        profile_id: newProfile.id,
        organization_id: null,
        license_number,
        vehicle_type,
        vehicle_plate,
        license_expiry: license_expiry || null,
        is_available: false,
      });

    if (driverError) {
      await supabaseAdmin.from("profiles").delete().eq("id", newProfile.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: driverError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign driver role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "driver" });

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    // Send notification to admins
    try {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "super_admin"]);

      if (adminRoles && adminRoles.length > 0) {
        const notifications = adminRoles.map((r: any) => ({
          user_id: r.user_id,
          title: "تسجيل سائق جديد",
          message: `قام ${full_name} بالتسجيل كسائق${isPhoneRegistration ? ` برقم ${phone}` : ` بالبريد ${email}`}`,
          type: "new_registration",
          is_read: false,
        }));
        await supabaseAdmin.from("notifications").insert(notifications);
      }
    } catch (e) {
      console.error("Notification error (non-critical):", e);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم تسجيل السائق بنجاح. سيتم مراجعة طلبك من قبل الإدارة.",
        user_id: newUser.user.id,
        auth_email: authEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
