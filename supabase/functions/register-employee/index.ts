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

    // Check if user is admin or company_admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    const isCompanyAdmin = roles?.some(r => r.role === "company_admin");

    if (!isAdmin && !isCompanyAdmin) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to add employees" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the requester's organization
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    const body = await req.json();
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      position, 
      department, 
      organization_id,
      permissions 
    } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email, password, and full name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the organization to use
    let targetOrgId = organization_id;
    if (!isAdmin) {
      // Company admins can only add to their own organization
      targetOrgId = requesterProfile?.organization_id;
      if (!targetOrgId) {
        return new Response(
          JSON.stringify({ error: "You must belong to an organization to add employees" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email,
        full_name,
        phone,
        position,
        department,
        organization_id: targetOrgId,
        is_active: true,
      });

    if (profileError) {
      // Rollback user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign the employee role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "employee",
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
    }

    // Get the profile ID for permissions
    const { data: newProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", newUser.user.id)
      .single();

    // Add permissions if provided
    if (permissions && permissions.length > 0 && newProfile) {
      const permissionRecords = permissions.map((perm: string) => ({
        profile_id: newProfile.id,
        permission_type: perm,
      }));

      await supabaseAdmin
        .from("employee_permissions")
        .insert(permissionRecords);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Employee registered successfully",
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
