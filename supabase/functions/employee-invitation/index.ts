import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateInvitationPayload {
  email: string;
  employeeType?: string;
  permissions?: string[];
  accessAllPartners?: boolean;
  accessAllWasteTypes?: boolean;
  partnerIds?: string[];
  externalPartnerIds?: string[];
  wasteTypes?: string[];
  expiresInDays?: number;
}

interface AcceptInvitationPayload {
  token: string;
  password: string;
  fullName: string;
  phone?: string;
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle different actions
    if (action === "create") {
      return await handleCreateInvitation(req, supabaseAdmin, supabaseUrl);
    } else if (action === "accept") {
      return await handleAcceptInvitation(req, supabaseAdmin);
    } else if (action === "verify") {
      return await handleVerifyToken(req, supabaseAdmin);
    } else if (action === "cancel") {
      return await handleCancelInvitation(req, supabaseAdmin, supabaseUrl);
    } else if (action === "resend") {
      return await handleResendInvitation(req, supabaseAdmin, supabaseUrl);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleCreateInvitation(req: Request, supabaseAdmin: any, supabaseUrl: string) {
  // Verify authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "غير مصرح" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "غير مصرح" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check permissions
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = roles?.some((r: any) => r.role === "admin");
  const isCompanyAdmin = roles?.some((r: any) => r.role === "company_admin");

  if (!isAdmin && !isCompanyAdmin) {
    return new Response(
      JSON.stringify({ error: "ليس لديك صلاحية إرسال دعوات" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get requester's profile
  const { data: requesterProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, organization_id")
    .eq("user_id", user.id)
    .single();

  if (!requesterProfile?.organization_id) {
    return new Response(
      JSON.stringify({ error: "يجب أن تنتمي لمنظمة لإرسال دعوات" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const body: CreateInvitationPayload = await req.json();
  const {
    email,
    employeeType = 'employee',
    permissions = [],
    accessAllPartners = true,
    accessAllWasteTypes = true,
    partnerIds = [],
    externalPartnerIds = [],
    wasteTypes = [],
    expiresInDays = 7,
  } = body;

  // Validate email
  if (!email || !email.includes('@')) {
    return new Response(
      JSON.stringify({ error: "البريد الإلكتروني غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if email already exists
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  const userExists = existingUser?.users?.some((u: any) => u.email === email);
  
  if (userExists) {
    return new Response(
      JSON.stringify({ error: "هذا البريد الإلكتروني مسجل بالفعل" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check for existing pending invitation
  const { data: existingInvitation } = await supabaseAdmin
    .from("employee_invitations")
    .select("id")
    .eq("email", email)
    .eq("organization_id", requesterProfile.organization_id)
    .eq("status", "pending")
    .single();

  if (existingInvitation) {
    return new Response(
      JSON.stringify({ error: "يوجد دعوة معلقة لهذا البريد الإلكتروني" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate secure token
  const { data: tokenData } = await supabaseAdmin.rpc('generate_invitation_token');
  const token = tokenData;

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create invitation
  const { data: invitation, error: insertError } = await supabaseAdmin
    .from("employee_invitations")
    .insert({
      organization_id: requesterProfile.organization_id,
      invited_by: requesterProfile.id,
      email,
      token,
      employee_type: employeeType,
      permissions,
      access_all_partners: accessAllPartners,
      access_all_waste_types: accessAllWasteTypes,
      partner_ids: partnerIds,
      external_partner_ids: externalPartnerIds,
      waste_types: wasteTypes,
      expires_at: expiresAt.toISOString(),
    })
    .select(`
      id,
      email,
      token,
      expires_at,
      status,
      created_at
    `)
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return new Response(
      JSON.stringify({ error: "فشل في إنشاء الدعوة" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Generate invitation URL
  const baseUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace('.supabase.co', '.lovable.app');
  const invitationUrl = `${baseUrl}/invite/${token}`;

  return new Response(
    JSON.stringify({
      success: true,
      message: "تم إنشاء الدعوة بنجاح",
      invitation: {
        ...invitation,
        url: invitationUrl,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleVerifyToken(req: Request, supabaseAdmin: any) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      JSON.stringify({ error: "رمز الدعوة مطلوب" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: invitation, error } = await supabaseAdmin
    .from("employee_invitations")
    .select(`
      id,
      email,
      employee_type,
      permissions,
      expires_at,
      status,
      organization:organization_id(id, name, logo_url)
    `)
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return new Response(
      JSON.stringify({ error: "رمز الدعوة غير صالح" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    // Update status to expired
    await supabaseAdmin
      .from("employee_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return new Response(
      JSON.stringify({ error: "انتهت صلاحية هذه الدعوة", expired: true }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (invitation.status !== "pending") {
    return new Response(
      JSON.stringify({ error: "هذه الدعوة لم تعد صالحة", status: invitation.status }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      valid: true,
      invitation: {
        email: invitation.email,
        employeeType: invitation.employee_type,
        organization: invitation.organization,
        expiresAt: invitation.expires_at,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleAcceptInvitation(req: Request, supabaseAdmin: any) {
  const body: AcceptInvitationPayload = await req.json();
  const { token, password, fullName, phone } = body;

  if (!token || !password || !fullName) {
    return new Response(
      JSON.stringify({ error: "جميع الحقول مطلوبة" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (password.length < 6) {
    return new Response(
      JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get invitation
  const { data: invitation, error: invError } = await supabaseAdmin
    .from("employee_invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (invError || !invitation) {
    return new Response(
      JSON.stringify({ error: "رمز الدعوة غير صالح" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate invitation
  if (invitation.status !== "pending") {
    return new Response(
      JSON.stringify({ error: "هذه الدعوة لم تعد صالحة" }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabaseAdmin
      .from("employee_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);

    return new Response(
      JSON.stringify({ error: "انتهت صلاحية هذه الدعوة" }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create user account
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      organization_id: invitation.organization_id,
    },
  });

  if (createError) {
    console.error("User creation error:", createError);
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
      email: invitation.email,
      full_name: fullName,
      phone: phone || null,
      organization_id: invitation.organization_id,
      is_active: true,
      employee_type: invitation.employee_type,
      invited_by: invitation.invited_by,
      invitation_date: new Date().toISOString(),
      access_all_partners: invitation.access_all_partners,
      access_all_waste_types: invitation.access_all_waste_types,
    })
    .select("id")
    .single();

  if (profileError || !newProfile) {
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    return new Response(
      JSON.stringify({ error: "فشل في إنشاء الملف الشخصي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Assign employee role
  await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: newUser.user.id, role: "employee" });

  // Add permissions
  if (invitation.permissions?.length > 0) {
    const permissionRecords = invitation.permissions.map((perm: string) => ({
      profile_id: newProfile.id,
      permission_type: perm,
    }));
    await supabaseAdmin.from("employee_permissions").insert(permissionRecords);
  }

  // Add partner access
  if (!invitation.access_all_partners) {
    const partnerRecords = [
      ...invitation.partner_ids.map((id: string) => ({
        profile_id: newProfile.id,
        organization_id: invitation.organization_id,
        partner_organization_id: id,
        created_by: invitation.invited_by,
      })),
      ...invitation.external_partner_ids.map((id: string) => ({
        profile_id: newProfile.id,
        organization_id: invitation.organization_id,
        external_partner_id: id,
        created_by: invitation.invited_by,
      })),
    ];
    if (partnerRecords.length > 0) {
      await supabaseAdmin.from("employee_partner_access").insert(partnerRecords);
    }
  }

  // Add waste access
  if (!invitation.access_all_waste_types && invitation.waste_types?.length > 0) {
    const wasteRecords = invitation.waste_types.map((type: string) => ({
      profile_id: newProfile.id,
      organization_id: invitation.organization_id,
      waste_type: type,
      created_by: invitation.invited_by,
    }));
    await supabaseAdmin.from("employee_waste_access").insert(wasteRecords);
  }

  // Update invitation status
  await supabaseAdmin
    .from("employee_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: newProfile.id,
    })
    .eq("id", invitation.id);

  return new Response(
    JSON.stringify({
      success: true,
      message: "تم قبول الدعوة وإنشاء الحساب بنجاح",
      user_id: newUser.user.id,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleCancelInvitation(req: Request, supabaseAdmin: any, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "غير مصرح" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "غير مصرح" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { invitationId } = await req.json();
  
  const { error } = await supabaseAdmin
    .from("employee_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId);

  if (error) {
    return new Response(
      JSON.stringify({ error: "فشل في إلغاء الدعوة" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "تم إلغاء الدعوة" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleResendInvitation(req: Request, supabaseAdmin: any, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "غير مصرح" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "غير مصرح" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { invitationId } = await req.json();

  // Generate new token and extend expiry
  const { data: tokenData } = await supabaseAdmin.rpc('generate_invitation_token');
  const newToken = tokenData;
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error } = await supabaseAdmin
    .from("employee_invitations")
    .update({ 
      token: newToken, 
      expires_at: expiresAt.toISOString(),
      status: "pending",
    })
    .eq("id", invitationId)
    .select("token")
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: "فشل في تجديد الدعوة" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const baseUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace('.supabase.co', '.lovable.app');
  const invitationUrl = `${baseUrl}/invite/${invitation.token}`;

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "تم تجديد الدعوة",
      url: invitationUrl,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
