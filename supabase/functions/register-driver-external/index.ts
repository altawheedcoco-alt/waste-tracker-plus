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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await req.json();
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      license_number,
      vehicle_type,
      vehicle_plate,
      license_expiry,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name || !license_number) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني وكلمة المرور والاسم ورقم الرخصة مطلوبون" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني مسجل بالفعل" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the profile (without organization - pending approval)
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email,
        full_name,
        phone,
        organization_id: null,
        is_active: false, // Will be activated after admin approval
      })
      .select()
      .single();

    if (profileError) {
      // Rollback user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      console.error("Profile creation error:", profileError);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the driver record (without organization - pending assignment)
    const { error: driverError } = await supabaseAdmin
      .from("drivers")
      .insert({
        profile_id: newProfile.id,
        organization_id: null, // Will be assigned by transporter company
        license_number,
        vehicle_type,
        vehicle_plate,
        license_expiry: license_expiry || null,
        is_available: false,
      });

    if (driverError) {
      // Rollback
      await supabaseAdmin.from("profiles").delete().eq("id", newProfile.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      console.error("Driver creation error:", driverError);
      return new Response(
        JSON.stringify({ error: driverError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign the driver role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "driver",
      });

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم تسجيل السائق بنجاح. سيتم مراجعة طلبك من قبل الإدارة.",
        user_id: newUser.user.id 
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
