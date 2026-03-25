import { createClient } from "npm:@supabase/supabase-js@2";

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
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { target_user_id, new_email, new_password, mode } = body;

    // mode = "self" (driver changing own) or "admin" (admin changing driver's)
    if (mode === "self") {
      // Driver changing their own credentials
      const updates: Record<string, string> = {};
      if (new_email) updates.email = new_email;
      if (new_password) updates.password = new_password;

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ error: "لا توجد بيانات للتحديث" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updates);
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update email in profiles table too
      if (new_email) {
        await supabaseAdmin.from("profiles").update({ email: new_email }).eq("user_id", user.id);
      }

      return new Response(JSON.stringify({ success: true, message: "تم تحديث البيانات بنجاح" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "admin") {
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id مطلوب" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify requester is admin/manager of the same organization
      const { data: requesterProfile } = await supabaseAdmin
        .from("profiles").select("organization_id").eq("user_id", user.id).single();

      const { data: targetProfile } = await supabaseAdmin
        .from("profiles").select("organization_id, user_id").eq("user_id", target_user_id).single();

      if (!requesterProfile?.organization_id || !targetProfile?.organization_id ||
          requesterProfile.organization_id !== targetProfile.organization_id) {
        return new Response(JSON.stringify({ error: "غير مصرح لك بتعديل بيانات هذا المستخدم" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, string> = {};
      if (new_email) updates.email = new_email;
      if (new_password) updates.password = new_password;

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ error: "لا توجد بيانات للتحديث" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, updates);
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new_email) {
        await supabaseAdmin.from("profiles").update({ email: new_email }).eq("user_id", target_user_id);
      }

      return new Response(JSON.stringify({ success: true, message: "تم تحديث بيانات السائق بنجاح" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "وضع غير صالح" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
