import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ToggleUserRequest {
  targetUserId: string;
  profileId: string;
  action: 'activate' | 'deactivate';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify requesting user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized: Invalid user token");
    }

    // Check if admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: User is not an admin");
    }

    const { targetUserId, profileId, action }: ToggleUserRequest = await req.json();

    if (!targetUserId || !profileId || !action) {
      throw new Error("Missing required fields");
    }

    const isActive = action === 'activate';

    // Update auth user (ban/unban)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { 
        ban_duration: isActive ? 'none' : '876000h' // ~100 years ban for deactivate
      }
    );

    if (authError) {
      console.error("Error updating auth user:", authError);
      throw new Error(`Failed to ${action} user auth: ${authError.message}`);
    }

    // Update profile is_active status
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", profileId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Log activity
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      action: isActive ? 'تفعيل حساب مستخدم' : 'تعطيل حساب مستخدم',
      action_type: isActive ? 'user_activated' : 'user_deactivated',
      resource_type: 'user',
      resource_id: targetUserId,
      details: { target_user_id: targetUserId, profile_id: profileId, action },
    });

    console.log(`Successfully ${action}d user ${targetUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: `User ${action}d successfully`, is_active: isActive }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-toggle-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
