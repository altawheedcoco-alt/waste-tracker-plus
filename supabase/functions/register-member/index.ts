import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type MemberRole = "entity_head" | "assistant" | "deputy_assistant" | "agent" | "delegate" | "member";

const ROLE_LEVELS: Record<MemberRole, number> = {
  entity_head: 1,
  assistant: 2,
  deputy_assistant: 3,
  agent: 4,
  delegate: 5,
  member: 6,
};

interface RegisterMemberPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  organizationId: string;
  memberRole: MemberRole;
  jobTitleAr?: string;
  departmentId?: string;
  positionId?: string;
  grantedPermissions?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT of the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Get the requesting user
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: requestingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "جلسة غير صالحة" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: RegisterMemberPayload = await req.json();

    // Validate required fields
    if (!payload.email || !payload.password || !payload.fullName || !payload.phone || !payload.organizationId || !payload.memberRole) {
      return new Response(JSON.stringify({ error: "جميع الحقول المطلوبة يجب ملؤها" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.password.length < 6) {
      return new Response(JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check requesting user is a member with sufficient authority
    const { data: requestingMember, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("id, member_role, can_manage_members, granted_permissions")
      .eq("user_id", requestingUser.id)
      .eq("organization_id", payload.organizationId)
      .eq("status", "active")
      .single();

    if (memberError || !requestingMember) {
      // Check if user is admin
      const { data: adminRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", requestingUser.id)
        .eq("role", "admin")
        .single();

      if (!adminRole) {
        return new Response(JSON.stringify({ error: "ليس لديك صلاحية لإضافة أعضاء في هذه الجهة" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Verify hierarchy: requesting user must be higher level
      const requestingLevel = ROLE_LEVELS[requestingMember.member_role as MemberRole] || 6;
      const targetLevel = ROLE_LEVELS[payload.memberRole] || 6;

      if (requestingLevel >= targetLevel) {
        return new Response(JSON.stringify({ error: "لا يمكنك تعيين دور أعلى أو مساوٍ لدورك" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!requestingMember.can_manage_members && requestingMember.member_role !== "entity_head") {
        return new Response(JSON.stringify({ error: "ليس لديك صلاحية إدارة الأعضاء" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate granted permissions are within the granting user's own permissions
      if (payload.grantedPermissions && payload.grantedPermissions.length > 0) {
        const granterPerms = (requestingMember.granted_permissions as string[]) || [];
        const isEntityHead = requestingMember.member_role === "entity_head";
        
        if (!isEntityHead) {
          const invalidPerms = payload.grantedPermissions.filter(p => !granterPerms.includes(p));
          if (invalidPerms.length > 0) {
            return new Response(JSON.stringify({ 
              error: `لا يمكنك منح صلاحيات لا تملكها: ${invalidPerms.join(", ")}` 
            }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    // 1) Create auth user
    const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin
      .createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          full_name: payload.fullName,
          organization_id: payload.organizationId,
        },
      });

    if (createUserError || !createdUser?.user) {
      const errorCode = (createUserError as any)?.code;
      if (errorCode === "email_exists") {
        return new Response(JSON.stringify({ error: "هذا البريد الإلكتروني مسجل بالفعل" }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(createUserError?.message || "فشل في إنشاء الحساب");
    }

    const userId = createdUser.user.id;

    // 2) Create profile
    const { data: newProfile, error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      organization_id: payload.organizationId,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      is_active: true,
    }).select("id").single();

    if (profileError || !newProfile) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(profileError?.message || "فشل في إنشاء الملف الشخصي");
    }

    // 3) Assign employee role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "employee",
    });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(roleError.message || "فشل في تعيين الدور");
    }

    // 4) Create organization member record
    const { error: memberInsertError } = await supabaseAdmin.from("organization_members").insert({
      organization_id: payload.organizationId,
      user_id: userId,
      profile_id: newProfile.id,
      member_role: payload.memberRole,
      job_title_ar: payload.jobTitleAr || null,
      department_id: payload.departmentId || null,
      position_id: payload.positionId || null,
      granted_permissions: payload.grantedPermissions || [],
      can_manage_members: ["entity_head", "assistant", "deputy_assistant"].includes(payload.memberRole),
      can_grant_permissions: ["entity_head", "assistant"].includes(payload.memberRole),
      appointed_by: requestingMember?.id || null,
      status: "active",
    });

    if (memberInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(memberInsertError.message || "فشل في إنشاء العضوية");
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in register-member:", error);
    return new Response(JSON.stringify({ error: error.message || "خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
