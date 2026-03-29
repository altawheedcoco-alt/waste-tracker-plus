import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  in_transit: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغية",
  picked_up: "تم الاستلام",
  confirmed: "مؤكدة",
};

const typeLabels: Record<string, string> = {
  shipment: "شحنة",
  blog: "مقالة",
  certificate: "شهادة",
  invoice: "فاتورة",
  organization: "منظمة",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const type = url.searchParams.get("type");

    if (!code) {
      return new Response("Missing code", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceKey);

    // Look up the shared link
    const { data: link } = await client
      .from("shared_links")
      .select("resource_type, resource_id, is_active")
      .eq("share_code", code)
      .eq("is_active", true)
      .single();

    if (!link) {
      return serveFallbackHTML(code, type);
    }

    let title = "iRecycle — منصة إدارة المخلفات الذكية";
    let description = "تتبع وإدارة المخلفات بذكاء مع iRecycle";
    let imageUrl = `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/storage/v1/object/public/assets/og-default.png`;

    const resourceType = link.resource_type;
    const typeLabel = typeLabels[resourceType] || resourceType;

    if (resourceType === "shipment") {
      const { data: shipment } = await client
        .from("shipments")
        .select("tracking_number, status, waste_type, pickup_location, delivery_location, quantity, unit")
        .eq("id", link.resource_id)
        .single();

      if (shipment) {
        const status = statusLabels[shipment.status] || shipment.status;
        title = `شحنة ${shipment.tracking_number} — ${status} | iRecycle`;
        description = [
          shipment.waste_type ? `النوع: ${shipment.waste_type}` : null,
          shipment.quantity ? `الكمية: ${shipment.quantity} ${shipment.unit || ""}` : null,
          shipment.pickup_location ? `من: ${shipment.pickup_location}` : null,
          shipment.delivery_location ? `إلى: ${shipment.delivery_location}` : null,
        ].filter(Boolean).join(" | ");
      }
    } else if (resourceType === "blog") {
      const { data: post } = await client
        .from("posts")
        .select("title, content, featured_image")
        .eq("id", link.resource_id)
        .single();

      if (post) {
        title = `${post.title} | iRecycle`;
        description = (post.content || "").substring(0, 160);
        if (post.featured_image) imageUrl = post.featured_image;
      }
    } else if (resourceType === "organization") {
      const { data: org } = await client
        .from("organizations")
        .select("name, description, logo_url")
        .eq("id", link.resource_id)
        .single();

      if (org) {
        title = `${org.name} | iRecycle`;
        description = org.description || `عرض معلومات ${org.name} على منصة iRecycle`;
        if (org.logo_url) imageUrl = org.logo_url;
      }
    } else if (resourceType === "invoice") {
      title = `فاتورة مشتركة | iRecycle`;
      description = "عرض تفاصيل الفاتورة على منصة iRecycle";
    } else if (resourceType === "certificate") {
      title = `شهادة مشتركة | iRecycle`;
      description = "عرض الشهادة على منصة iRecycle";
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://irecycle21.lovable.app";
    const canonicalUrl = `${siteUrl}/s/${resourceType}/${code}`;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:site_name" content="iRecycle" />
  <meta property="og:locale" content="ar_EG" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />

  <!-- Redirect to SPA -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
</head>
<body>
  <p>جاري التحويل إلى <a href="${escapeHtml(canonicalUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("og-preview error:", err);
    return new Response("Error", { status: 500 });
  }
});

function serveFallbackHTML(code: string | null, type: string | null) {
  const siteUrl = Deno.env.get("SITE_URL") || "https://irecycle21.lovable.app";
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>iRecycle — منصة إدارة المخلفات الذكية</title>
  <meta property="og:title" content="iRecycle — منصة إدارة المخلفات الذكية" />
  <meta property="og:description" content="تتبع وإدارة المخلفات بذكاء" />
  <meta property="og:site_name" content="iRecycle" />
  <meta http-equiv="refresh" content="0;url=${siteUrl}/s/${type || 'shipment'}/${code || ''}" />
</head>
<body><p>جاري التحويل...</p></body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
