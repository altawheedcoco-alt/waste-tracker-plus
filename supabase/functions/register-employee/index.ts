import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterEmployeePayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  employeeType?: string;
  permissions?: string[];
  accessAllPartners?: boolean;
  accessAllWasteTypes?: boolean;
  partnerIds?: string[];
  externalPartnerIds?: string[];
  wasteTypes?: string[];
  // Legacy fields
  full_name?: string;
  position?: string;
  department?: string;
  organization_id?: string;
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
        JSON.stringify({ error: "غير مصرح" }),
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
        JSON.stringify({ error: "ليس لديك صلاحية إضافة موظفين" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the requester's profile
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, organization_id")
      .eq("user_id", user.id)
      .single();

    if (!requesterProfile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "يجب أن تنتمي لمنظمة لإضافة موظفين" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RegisterEmployeePayload = await req.json();
    
    // Support both new and legacy field names
    const email = body.email;
    const password = body.password;
    const fullName = body.fullName || body.full_name;
    const phone = body.phone;
    const employeeType = body.employeeType || 'employee';
    const permissions = body.permissions || [];
    const accessAllPartners = body.accessAllPartners ?? true;
    const accessAllWasteTypes = body.accessAllWasteTypes ?? true;
    const partnerIds = body.partnerIds || [];
    const externalPartnerIds = body.externalPartnerIds || [];
    const wasteTypes = body.wasteTypes || [];

    // Validate required fields
    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "البريد الإلكتروني وكلمة المرور والاسم مطلوبون" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine the organization to use
    const targetOrgId = isAdmin && body.organization_id ? body.organization_id : requesterProfile.organization_id;

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        organization_id: targetOrgId,
      },
    });

    if (createError) {
      // Handle duplicate email
      if (createError.message.includes('already been registered') || createError.message.includes('email_exists')) {
        return new Response(
          JSON.stringify({ error: "هذا البريد الإلكتروني مسجل بالفعل" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the profile with extended fields
    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
        position: body.position || null,
        department: body.department || null,
        organization_id: targetOrgId,
        is_active: true,
        employee_type: employeeType,
        invited_by: requesterProfile.id,
        invitation_date: new Date().toISOString(),
        access_all_partners: accessAllPartners,
        access_all_waste_types: accessAllWasteTypes,
      })
      .select("id")
      .single();

    if (profileError || !newProfile) {
      // Rollback user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: profileError?.message || "فشل في إنشاء الملف الشخصي" }),
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

    // Add permissions if provided
    if (permissions.length > 0) {
      const permissionRecords = permissions.map((perm: string) => ({
        profile_id: newProfile.id,
        permission_type: perm,
      }));

      const { error: permError } = await supabaseAdmin
        .from("employee_permissions")
        .insert(permissionRecords);

      if (permError) {
        console.error("Error adding permissions:", permError);
      }
    }

    // Add partner access if not all partners
    if (!accessAllPartners) {
      // Add organization partner access
      if (partnerIds.length > 0) {
        const partnerRecords = partnerIds.map((partnerId: string) => ({
          profile_id: newProfile.id,
          organization_id: targetOrgId,
          partner_organization_id: partnerId,
          created_by: requesterProfile.id,
        }));

        const { error: partnerError } = await supabaseAdmin
          .from("employee_partner_access")
          .insert(partnerRecords);

        if (partnerError) {
          console.error("Error adding partner access:", partnerError);
        }
      }

      // Add external partner access
      if (externalPartnerIds.length > 0) {
        const extPartnerRecords = externalPartnerIds.map((partnerId: string) => ({
          profile_id: newProfile.id,
          organization_id: targetOrgId,
          external_partner_id: partnerId,
          created_by: requesterProfile.id,
        }));

        const { error: extPartnerError } = await supabaseAdmin
          .from("employee_partner_access")
          .insert(extPartnerRecords);

        if (extPartnerError) {
          console.error("Error adding external partner access:", extPartnerError);
        }
      }
    }

    // Add waste type access if not all waste types
    if (!accessAllWasteTypes && wasteTypes.length > 0) {
      const wasteRecords = wasteTypes.map((wasteType: string) => ({
        profile_id: newProfile.id,
        organization_id: targetOrgId,
        waste_type: wasteType,
        created_by: requesterProfile.id,
      }));

      const { error: wasteError } = await supabaseAdmin
        .from("employee_waste_access")
        .insert(wasteRecords);

      if (wasteError) {
        console.error("Error adding waste access:", wasteError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم إنشاء حساب الموظف بنجاح",
        user_id: newUser.user.id,
        employee_id: newProfile.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
