import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminCredentialRequest {
  action: 'reset_pin' | 'reset_page_password' | 'list_users' | 'list_page_passwords';
  targetUserId?: string;
  organizationId?: string;
  pagePasswordId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized: Invalid user token");

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: User is not an admin");

    const body: AdminCredentialRequest = await req.json();

    switch (body.action) {
      case 'list_users': {
        // List all users with their credential status
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, full_name, email, organization_id')
          .order('full_name');

        // Get PIN statuses
        const { data: pins } = await supabaseAdmin
          .from('user_pin_codes')
          .select('id, user_id, is_active, failed_attempts, locked_until');

        const pinMap = new Map();
        pins?.forEach(p => pinMap.set(p.user_id, p));

        const enriched = profiles?.map(p => ({
          ...p,
          has_pin: pinMap.has(p.user_id),
          pin_locked: pinMap.get(p.user_id)?.locked_until ? new Date(pinMap.get(p.user_id).locked_until) > new Date() : false,
          pin_id: pinMap.get(p.user_id)?.id || null,
        }));

        return new Response(JSON.stringify({ users: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'reset_pin': {
        if (!body.targetUserId) throw new Error("Missing targetUserId");

        // Delete the user's PIN (they'll be prompted to create a new one)
        const { error: deleteError } = await supabaseAdmin
          .from('user_pin_codes')
          .delete()
          .eq('user_id', body.targetUserId);

        if (deleteError) {
          console.error("Error deleting PIN:", deleteError);
          throw new Error(`Failed to reset PIN: ${deleteError.message}`);
        }

        await supabaseAdmin.from("activity_logs").insert({
          user_id: user.id,
          action: "إعادة تعيين رمز PIN",
          action_type: "pin_reset",
          resource_type: "user",
          resource_id: body.targetUserId,
          details: { target_user_id: body.targetUserId },
        });

        return new Response(JSON.stringify({ success: true, message: "PIN reset successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'list_page_passwords': {
        if (!body.organizationId) throw new Error("Missing organizationId");

        const { data: passwords } = await supabaseAdmin
          .from('page_passwords')
          .select('id, page_path, page_name, is_active, created_at')
          .eq('organization_id', body.organizationId);

        return new Response(JSON.stringify({ passwords: passwords || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'reset_page_password': {
        if (!body.pagePasswordId) throw new Error("Missing pagePasswordId");

        // Delete the page password
        const { error: deleteError } = await supabaseAdmin
          .from('page_passwords')
          .delete()
          .eq('id', body.pagePasswordId);

        if (deleteError) throw new Error(`Failed to reset page password: ${deleteError.message}`);

        await supabaseAdmin.from("activity_logs").insert({
          user_id: user.id,
          action: "إعادة تعيين كلمة مرور صفحة",
          action_type: "page_password_reset",
          resource_type: "page_password",
          resource_id: body.pagePasswordId,
          details: { page_password_id: body.pagePasswordId, organization_id: body.organizationId },
        });

        return new Response(JSON.stringify({ success: true, message: "Page password reset successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error("Invalid action");
    }
  } catch (error: any) {
    console.error("Error in admin-credential-control:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
