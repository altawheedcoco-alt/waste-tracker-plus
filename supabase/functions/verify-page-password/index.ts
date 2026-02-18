import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "page_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, page_password_id, password, backup_code } = await req.json();

    if (action === "verify_password") {
      if (!page_password_id || !password) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Fetch hash from secure separate table (no client SELECT policy)
      const { data, error } = await supabase
        .from("page_password_hashes")
        .select("password_hash")
        .eq("page_password_id", page_password_id)
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const computed = await hashPassword(password);
      const valid = computed === data.password_hash;

      return new Response(JSON.stringify({ valid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify_backup_code") {
      if (!page_password_id || !backup_code) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: codes } = await supabase
        .from("page_password_backup_codes")
        .select("*")
        .eq("page_password_id", page_password_id)
        .eq("is_used", false);

      const inputHash = await hashPassword(backup_code.toUpperCase());
      let valid = false;

      for (const code of codes || []) {
        if (inputHash === code.code_hash) {
          await supabase
            .from("page_password_backup_codes")
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq("id", code.id);
          valid = true;
          break;
        }
      }

      return new Response(JSON.stringify({ valid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
