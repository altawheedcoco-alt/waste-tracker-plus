import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return new Response(
        JSON.stringify({ error: "link_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "link_expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max views
    if (link.max_views && link.view_count >= link.max_views) {
      return new Response(
        JSON.stringify({ error: "max_views_reached" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check PIN
    if (link.requires_pin) {
      if (!pin) {
        return new Response(
          JSON.stringify({ error: "pin_required", requires_pin: true }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (pin !== link.pin_hash) {
        return new Response(
          JSON.stringify({ error: "invalid_pin" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      return new Response(
        JSON.stringify({ error: "auth_required", visibility_level: "authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (link.visibility_level === "linked_only" && accessLevel !== "linked") {
      return new Response(
        JSON.stringify({
          error: userId ? "not_linked" : "auth_required",
          visibility_level: "linked_only",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check partner restrictions - block shared links if restricted
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
          // Get org name
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

    // Log view
    await adminClient.from("shared_link_views").insert({
      shared_link_id: link.id,
      viewer_user_id: userId,
    });

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
