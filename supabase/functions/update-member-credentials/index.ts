import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ROLE_LEVELS: Record<string, number> = {
  entity_head: 1,
  assistant: 2,
  deputy_assistant: 3,
  agent: 4,
  delegate: 5,
  member: 6,
};

interface UpdateCredentialsPayload {
  mode: "self" | "manage";
  target_user_id?: string;
  new_email?: string;
  new_password?: string;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "جلسة غير صالحة" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: UpdateCredentialsPayload = await req.json();
    const { mode, target_user_id, new_email, new_password } = body;

    if (!new_email && !new_password) {
      return new Response(JSON.stringify({ error: "أدخل البريد الجديد أو كلمة المرور الجديدة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new_password && new_password.length < 6) {
      return new Response(JSON.stringify({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Mode: Self (user changes their own credentials) ───
    if (mode === "self") {
      const updates: Record<string, string> = {};
      if (new_email) updates.email = new_email;
      if (new_password) updates.password = new_password;

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updates);
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new_email) {
        await supabaseAdmin.from("profiles").update({ email: new_email }).eq("user_id", user.id);
      }

      return new Response(JSON.stringify({ success: true, message: "تم تحديث بيانات الدخول بنجاح" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Mode: Manage (org head/manager changes member's credentials) ───
    if (mode === "manage") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "يجب تحديد المستخدم المستهدف" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if requester is admin
      const { data: adminRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (adminRole) {
        // Admin can change anyone's credentials
        const updates: Record<string, string> = {};
        if (new_email) updates.email = new_email;
        if (new_password) updates.password = new_password;

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, updates);
        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (new_email) {
          await supabaseAdmin.from("profiles").update({ email: new_email }).eq("user_id", target_user_id);
        }

        return new Response(JSON.stringify({ success: true, message: "تم تحديث البيانات بنجاح" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get requester's org membership
      const { data: requesterMember, error: reqErr } = await supabaseAdmin
        .from("organization_members")
        .select("id, member_role, can_manage_members, organization_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (reqErr || !requesterMember) {
        return new Response(JSON.stringify({ error: "ليس لديك صلاحية إدارة الأعضاء" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!requesterMember.can_manage_members && requesterMember.member_role !== "entity_head") {
        return new Response(JSON.stringify({ error: "ليس لديك صلاحية إدارة بيانات الأعضاء" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get target's org membership
      const { data: targetMember, error: targetErr } = await supabaseAdmin
        .from("organization_members")
        .select("id, member_role, organization_id")
        .eq("user_id", target_user_id)
        .eq("organization_id", requesterMember.organization_id)
        .eq("status", "active")
        .single();

      if (targetErr || !targetMember) {
        return new Response(JSON.stringify({ error: "المستخدم المستهدف غير موجود في هذه الجهة" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enforce hierarchy: requester must be higher level
      const reqLevel = ROLE_LEVELS[requesterMember.member_role] || 6;
      const targetLevel = ROLE_LEVELS[targetMember.member_role] || 6;

      if (reqLevel >= targetLevel) {
        return new Response(JSON.stringify({ error: "لا يمكنك تعديل بيانات عضو بدرجة أعلى أو مساوية لك" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Perform update
      const updates: Record<string, string> = {};
      if (new_email) updates.email = new_email;
      if (new_password) updates.password = new_password;

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, updates);
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new_email) {
        await supabaseAdmin.from("profiles").update({ email: new_email }).eq("user_id", target_user_id);
      }

      // Log the action
      await supabaseAdmin.from("activity_logs").insert({
        user_id: user.id,
        organization_id: requesterMember.organization_id,
        action: "تعديل بيانات دخول عضو",
        action_type: "credential_update",
        resource_type: "organization_member",
        resource_id: targetMember.id,
        details: {
          target_user_id,
          email_changed: !!new_email,
          password_changed: !!new_password,
        },
      });

      return new Response(JSON.stringify({ success: true, message: "تم تحديث بيانات العضو بنجاح" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "وضع غير صالح" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in update-member-credentials:", error);
    const msg = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
