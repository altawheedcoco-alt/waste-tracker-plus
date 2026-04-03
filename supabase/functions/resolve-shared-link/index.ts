import { createClient } from "npm:@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.224.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_PIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Verify PIN against PBKDF2 hash
async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  // Support new PBKDF2 format: pbkdf2:iterations:salt:hash
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1]);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    const encoder = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const hashHex = new TextDecoder().decode(hexEncode(new Uint8Array(derivedBits)));
    return hashHex === expectedHashHex;
  }

  // Legacy: plain text comparison (backwards compatible)
  return pin === storedHash;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, pin } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "code_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Extract client info for logging
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Check if user is authenticated
    let userId: string | null = null;
    let userOrgId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData } = await userClient.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      if (claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
        const { data: profile } = await adminClient
          .from("profiles")
          .select("organization_id")
          .eq("id", userId)
          .single();
        userOrgId = profile?.organization_id || null;
      }
    }

    // Fetch the shared link
    const { data: link, error: linkErr } = await adminClient
      .from("shared_links")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (linkErr || !link) {
      // Log failed attempt
      await logAttempt(adminClient, null, clientIp, userAgent, userId, "view", false, "link_not_found");
      return new Response(
        JSON.stringify({ error: "link_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if link is locked due to too many failed PIN attempts
    if (link.locked_until && new Date(link.locked_until) > new Date()) {
      const remainingMs = new Date(link.locked_until).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", false, "link_locked");
      return new Response(
        JSON.stringify({ error: "link_locked", remaining_minutes: remainingMin }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", false, "link_expired");
      return new Response(
        JSON.stringify({ error: "link_expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max views
    if (link.max_views && link.view_count >= link.max_views) {
      await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", false, "max_views_reached");
      return new Response(
        JSON.stringify({ error: "max_views_reached" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check PIN with brute-force protection
    if (link.requires_pin) {
      if (!pin) {
        return new Response(
          JSON.stringify({ error: "pin_required", requires_pin: true }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pinValid = await verifyPin(pin, link.pin_hash);
      if (!pinValid) {
        const newAttempts = (link.failed_pin_attempts || 0) + 1;
        const updateData: Record<string, any> = { failed_pin_attempts: newAttempts };

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          updateData.locked_until = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
        }

        await adminClient.from("shared_links").update(updateData).eq("id", link.id);
        await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "pin", false, "invalid_pin", true);

        const attemptsLeft = MAX_PIN_ATTEMPTS - newAttempts;
        return new Response(
          JSON.stringify({
            error: "invalid_pin",
            attempts_left: Math.max(0, attemptsLeft),
            locked: newAttempts >= MAX_PIN_ATTEMPTS,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // PIN correct — reset failed attempts
      await adminClient
        .from("shared_links")
        .update({ failed_pin_attempts: 0, locked_until: null })
        .eq("id", link.id);
    }

    // Determine access level
    let accessLevel: "public" | "authenticated" | "linked" = "public";
    if (userId) {
      accessLevel = "authenticated";
      if (userOrgId === link.organization_id) {
        accessLevel = "linked";
      }
    }

    // Check visibility
    if (link.visibility_level === "authenticated" && !userId) {
      await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", false, "auth_required");
      return new Response(
        JSON.stringify({ error: "auth_required", visibility_level: "authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (link.visibility_level === "linked_only" && accessLevel !== "linked") {
      await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", false, "not_linked");
      return new Response(
        JSON.stringify({
          error: userId ? "not_linked" : "auth_required",
          visibility_level: "linked_only",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check partner restrictions
    if (userOrgId && userOrgId !== link.organization_id) {
      const { data: restrictionCheck } = await adminClient
        .from("partner_restrictions")
        .select("id")
        .eq("organization_id", link.organization_id)
        .eq("restricted_org_id", userOrgId)
        .eq("is_active", true)
        .in("restriction_type", ["block_visibility", "block_all", "blacklist", "suspend_partnership"])
        .limit(1);

      if (restrictionCheck && restrictionCheck.length > 0) {
        await logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", false, "access_restricted");
        return new Response(
          JSON.stringify({ error: "access_restricted", message: "تم تقييد الوصول لهذا المحتوى من قبل الجهة المالكة" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch resource data based on type
    let resourceData: any = null;
    const resourceType = link.resource_type;
    const resourceId = link.resource_id;

    switch (resourceType) {
      case "shipment": {
        const { data } = await adminClient
          .from("shipments")
          .select(
            "id, tracking_number, status, shipment_type, waste_type, quantity, unit, pickup_location, delivery_location, pickup_date, delivery_date, notes, created_at, updated_at, generator_organization_id, transporter_organization_id, receiver_organization_id"
          )
          .eq("id", resourceId)
          .single();
        if (data) {
          if (accessLevel === "public") {
            resourceData = {
              tracking_number: data.tracking_number,
              status: data.status,
              waste_type: data.waste_type,
              shipment_type: data.shipment_type,
              pickup_date: data.pickup_date,
              delivery_date: data.delivery_date,
            };
          } else {
            resourceData = data;
          }
          const { data: timeline } = await adminClient
            .from("shipment_timeline")
            .select("*")
            .eq("shipment_id", resourceId)
            .order("created_at", { ascending: true });
          resourceData.timeline = timeline || [];
        }
        break;
      }

      case "blog": {
        const { data } = await adminClient
          .from("blog_posts")
          .select("*")
          .eq("id", resourceId)
          .eq("status", "published")
          .single();
        resourceData = data;
        break;
      }

      case "certificate": {
        const { data } = await adminClient
          .from("compliance_certificates")
          .select("id, certificate_number, certificate_level, overall_score, operations_score, training_score, documentation_score, licenses_score, safety_environment_score, iso_standards, is_valid, issued_at, expires_at, verification_code, revoked_at, revocation_reason, organization_id")
          .eq("id", resourceId)
          .single();
        if (data) {
          const { data: org } = await adminClient
            .from("organizations")
            .select("name, logo_url, city, organization_type")
            .eq("id", data.organization_id)
            .single();
          resourceData = { ...data, organization_name: org?.name, organization_logo: org?.logo_url, organization_city: org?.city, organization_type: org?.organization_type };
        }
        break;
      }

      case "invoice": {
        const { data } = await adminClient
          .from("invoices")
          .select("id, invoice_number, invoice_type, invoice_category, status, issue_date, due_date, total_amount, subtotal, tax_amount, tax_rate, discount_amount, paid_amount, remaining_amount, currency, partner_name, notes")
          .eq("id", resourceId)
          .single();
        if (data) {
          if (accessLevel === "public") {
            resourceData = {
              invoice_number: data.invoice_number,
              status: data.status,
              issue_date: data.issue_date,
              due_date: data.due_date,
              total_amount: data.total_amount,
              currency: data.currency,
              partner_name: data.partner_name,
            };
          } else {
            resourceData = data;
          }
        }
        break;
      }

      case "organization": {
        const { data } = await adminClient
          .from("organizations")
          .select("id, name, organization_type, bio, logo_url, cover_url, city, address, phone, email, website, is_verified, founded_year, license_number, commercial_register, environmental_license, field_of_work, activity_type")
          .eq("id", resourceId)
          .single();
        if (data) {
          if (accessLevel === "public") {
            resourceData = {
              name: data.name,
              organization_type: data.organization_type,
              bio: data.bio,
              logo_url: data.logo_url,
              cover_url: data.cover_url,
              city: data.city,
              is_verified: data.is_verified,
              field_of_work: data.field_of_work,
              phone: data.phone,
              email: data.email,
              website: data.website,
            };
          } else {
            resourceData = data;
          }
        }
        break;
      }

      default: {
        resourceData = {
          resource_type: resourceType,
          resource_id: resourceId,
          message: "Resource type renderer not yet implemented",
        };
      }
    }

    if (!resourceData) {
      return new Response(
        JSON.stringify({ error: "resource_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment view count
    await adminClient
      .from("shared_links")
      .update({ view_count: (link.view_count || 0) + 1 })
      .eq("id", link.id);

    // Log successful view + access attempt
    await Promise.all([
      adminClient.from("shared_link_views").insert({
        shared_link_id: link.id,
        viewer_user_id: userId,
      }),
      logAttempt(adminClient, link.id, clientIp, userAgent, userId, "view", true, null),
    ]);

    return new Response(
      JSON.stringify({
        resource_type: resourceType,
        access_level: accessLevel,
        title: link.title,
        description: link.description,
        data: resourceData,
        organization_id: link.organization_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function logAttempt(
  client: any,
  linkId: string | null,
  ip: string,
  userAgent: string,
  userId: string | null,
  attemptType: string,
  success: boolean,
  failureReason: string | null,
  pinAttempted = false
) {
  if (!linkId) return;
  try {
    await client.from("shared_link_access_attempts").insert({
      shared_link_id: linkId,
      ip_address: ip,
      user_agent: userAgent,
      viewer_user_id: userId,
      attempt_type: attemptType,
      success,
      failure_reason: failureReason,
      pin_attempted: pinAttempted,
    });
  } catch {
    // Don't fail the main request if logging fails
  }
}
