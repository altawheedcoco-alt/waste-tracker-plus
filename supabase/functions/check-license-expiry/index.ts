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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // License fields to check per org type
    const LICENSE_FIELDS: Record<string, { field: string; label: string }[]> = {
      transporter: [
        { field: "wmra_license_expiry_date", label: "ترخيص WMRA" },
        { field: "eeaa_license_expiry_date", label: "ترخيص جهاز البيئة" },
        { field: "land_transport_license_expiry_date", label: "رخصة النقل البري" },
        { field: "license_expiry_date", label: "السجل التجاري" },
        { field: "transport_insurance_expiry", label: "تأمين النقل" },
        { field: "adr_certificate_expiry", label: "شهادة ADR" },
      ],
      recycler: [
        { field: "wmra_license_expiry_date", label: "ترخيص WMRA" },
        { field: "eeaa_license_expiry_date", label: "ترخيص جهاز البيئة" },
        { field: "license_expiry_date", label: "السجل التجاري" },
        { field: "ida_license_expiry_date", label: "التنمية الصناعية" },
      ],
      disposal: [
        { field: "wmra_license_expiry_date", label: "ترخيص WMRA" },
        { field: "eeaa_license_expiry_date", label: "ترخيص جهاز البيئة" },
        { field: "license_expiry_date", label: "السجل التجاري" },
        { field: "eia_certificate_expiry", label: "تقييم الأثر البيئي" },
        { field: "incineration_permit_expiry", label: "تصريح الحرق" },
        { field: "landfill_license_expiry", label: "ترخيص المدفن" },
        { field: "emissions_permit_expiry", label: "تصريح الانبعاثات" },
      ],
      generator: [
        { field: "wmra_license_expiry_date", label: "ترخيص WMRA" },
        { field: "license_expiry_date", label: "السجل التجاري" },
      ],
    };

    const allFields = [...new Set(Object.values(LICENSE_FIELDS).flat().map(f => f.field))];
    const selectStr = `id, name, organization_type, ${allFields.join(", ")}`;

    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select(selectStr)
      .eq("is_active", true);

    if (orgsError) throw orgsError;

    let totalNotifications = 0;
    const alertDays = [30, 15, 7, 3, 1, 0];

    for (const org of orgs || []) {
      const orgType = (org as any).organization_type as string;
      const fields = LICENSE_FIELDS[orgType] || LICENSE_FIELDS.generator;

      // Get org admin users
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", (org as any).id)
        .in("role", ["owner", "admin", "manager"]);

      if (!members?.length) continue;

      for (const license of fields) {
        const expiryDate = (org as any)[license.field] as string | null;
        if (!expiryDate) continue;

        const expiry = new Date(expiryDate);
        const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const isExpired = daysRemaining < 0;
        const shouldAlert = alertDays.includes(daysRemaining) || (isExpired && daysRemaining >= -1);
        if (!shouldAlert) continue;

        const severity = isExpired ? "critical" : daysRemaining <= 7 ? "high" : "medium";
        const title = isExpired
          ? `⛔ ${license.label} منتهي — ${(org as any).name}`
          : `⚠️ ${license.label} ينتهي خلال ${daysRemaining} يوم — ${(org as any).name}`;
        const message = isExpired
          ? `تنبيه: ${license.label} لجهة "${(org as any).name}" منتهي. يرجى التجديد.`
          : `${license.label} لجهة "${(org as any).name}" ينتهي خلال ${daysRemaining} يوم (${expiryDate}).`;

        for (const member of members) {
          // Skip if already notified today
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", member.user_id)
            .eq("type", "license_expiry")
            .gte("created_at", todayStr)
            .limit(1);

          if (existing?.length) continue;

          await supabase.from("notifications").insert({
            user_id: member.user_id,
            type: isExpired ? "license_expired" : "license_expiry_warning",
            title,
            message,
            severity,
            reference_id: (org as any).id,
            reference_type: "organization",
          });
          totalNotifications++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, notifications_sent: totalNotifications }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("License check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
