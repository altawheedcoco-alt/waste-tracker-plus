import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Legacy SHA-256 hash (for backward compatibility during migration)
async function legacySha256Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "page_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Secure PBKDF2-SHA-256 hashing with random salt
async function pbkdf2Hash(password: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");

  return { hash: `pbkdf2:${saltHex}:${hashHex}`, salt: saltHex };
}

async function verifyPbkdf2(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith("pbkdf2:")) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3) return false;
  const saltHex = parts[1];
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const result = await pbkdf2Hash(password, salt);
  return result.hash === storedHash;
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

    const { action, page_password_id, password, backup_code, passwords_to_hash } = await req.json();

    // Action: hash passwords server-side (used when creating page passwords)
    if (action === "hash_passwords") {
      if (!passwords_to_hash || !Array.isArray(passwords_to_hash)) {
        return new Response(
          JSON.stringify({ error: "Missing passwords_to_hash array" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const hashes = await Promise.all(
        passwords_to_hash.map(async (pwd: string) => {
          const result = await pbkdf2Hash(pwd);
          return result.hash;
        })
      );

      return new Response(JSON.stringify({ hashes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

      let valid = false;

      if (data.password_hash.startsWith("pbkdf2:")) {
        // New PBKDF2 hash
        valid = await verifyPbkdf2(password, data.password_hash);
      } else {
        // Legacy SHA-256 hash - verify and upgrade
        const computed = await legacySha256Hash(password);
        valid = computed === data.password_hash;

        // Auto-upgrade to PBKDF2 on successful verification
        if (valid) {
          const upgraded = await pbkdf2Hash(password);
          await supabase
            .from("page_password_hashes")
            .update({ password_hash: upgraded.hash })
            .eq("page_password_id", page_password_id);
        }
      }

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

      const upperCode = backup_code.toUpperCase();
      let valid = false;

      for (const code of codes || []) {
        let match = false;

        if (code.code_hash.startsWith("pbkdf2:")) {
          match = await verifyPbkdf2(upperCode, code.code_hash);
        } else {
          // Legacy SHA-256
          const inputHash = await legacySha256Hash(upperCode);
          match = inputHash === code.code_hash;
        }

        if (match) {
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
