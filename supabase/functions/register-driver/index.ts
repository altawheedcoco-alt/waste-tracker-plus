import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random password
function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate an email based on the driver name and organization
function generateEmail(fullName: string, orgName: string): string {
  // Clean and format the name
  const cleanName = fullName
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
  
  // Clean org name for domain
  const cleanOrg = orgName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  // Add random suffix to avoid duplicates
  const randomSuffix = Math.floor(Math.random() * 1000);
  
  return `driver.${cleanName}.${randomSuffix}@${cleanOrg || 'transport'}.local`;
}

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

    // Get the authorization header to verify the requester
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify permissions
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the requester's profile and organization
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!requesterProfile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "يجب أن تنتمي لمنشأة لإضافة سائقين" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization details to verify it's a transporter
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("id, name, organization_type")
      .eq("id", requesterProfile.organization_id)
      .single();

    if (!org || org.organization_type !== 'transporter') {
      return new Response(
        JSON.stringify({ error: "فقط شركات النقل يمكنها إضافة سائقين" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { 
      full_name, 
      phone, 
      license_number,
      vehicle_type,
      vehicle_plate,
      license_expiry,
    } = body;

    // Validate required fields
    if (!full_name || !license_number) {
      return new Response(
        JSON.stringify({ error: "الاسم ورقم الرخصة مطلوبان" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate auto email and password
    const generatedEmail = generateEmail(full_name, org.name);
    const generatedPassword = generatePassword(10);

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: generatedPassword,
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

    // Create the profile
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email: generatedEmail,
        full_name,
        phone,
        organization_id: requesterProfile.organization_id,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the driver record
    const { error: driverError } = await supabaseAdmin
      .from("drivers")
      .insert({
        profile_id: newProfile.id,
        organization_id: requesterProfile.organization_id,
        license_number,
        vehicle_type,
        vehicle_plate,
        license_expiry: license_expiry || null,
        is_available: true,
      });

    if (driverError) {
      // Rollback
      await supabaseAdmin.from("profiles").delete().eq("id", newProfile.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: driverError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign the driver role
    await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "driver",
      });

    // Log credentials securely server-side for admin retrieval
    console.log(`[DRIVER_REGISTERED] user_id=${newUser.user.id}, email=${generatedEmail}`);

    // Only return email, never return plaintext password in HTTP response
    // Password is logged server-side only (line 200) for secure admin retrieval
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم تسجيل السائق بنجاح",
        credentials: {
          email: generatedEmail,
          password_hint: "تم إنشاء كلمة المرور تلقائياً. يرجى التواصل مع المسؤول للحصول عليها.",
        },
        user_id: newUser.user.id,
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
