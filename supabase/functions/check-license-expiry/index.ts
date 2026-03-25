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
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const DAYS_BEFORE_EXPIRY = 7;
    const today = new Date();
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + DAYS_BEFORE_EXPIRY);
    const warningDateStr = warningDate.toISOString().split("T")[0];

    // Find transporters with license expiring within 7 days and not yet suspended
    const { data: expiringOrgs, error } = await supabase
      .from("organizations")
      .select("id, name, license_expiry_date, license_renewal_url, is_suspended")
      .eq("organization_type", "transporter")
      .eq("is_active", true)
      .eq("is_suspended", false)
      .not("license_expiry_date", "is", null)
      .lte("license_expiry_date", warningDateStr);

    if (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }

    console.log(`Found ${expiringOrgs?.length || 0} transporters with expiring licenses`);

    const results = { suspended: 0, warned: 0, errors: 0 };

    for (const org of expiringOrgs || []) {
      try {
        const expiryDate = new Date(org.license_expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const hasRenewal = !!org.license_renewal_url;

        if (hasRenewal) {
          console.log(`Skipping ${org.name}: renewal document uploaded`);
          continue;
        }

        if (daysUntilExpiry <= 0) {
          // License expired - suspend account
          const { error: suspendError } = await supabase
            .from("organizations")
            .update({
              is_suspended: true,
              is_active: false,
              suspension_reason: `تم تعطيل الحساب تلقائياً: انتهاء ترخيص النقل بتاريخ ${org.license_expiry_date}`,
              suspended_at: new Date().toISOString(),
            } as any)
            .eq("id", org.id);

          if (suspendError) throw suspendError;

          // Notify all org members
          const { data: members } = await supabase
            .from("profiles")
            .select("id")
            .eq("organization_id", org.id);

          if (members) {
            const notifications = members.map((m: any) => ({
              user_id: m.id,
              title: "⛔ تم تعطيل حساب شركتكم",
              message: `تم تعطيل حساب "${org.name}" بسبب انتهاء ترخيص النقل. يرجى رفع نسخة محدثة من الترخيص لإعادة تفعيل الحساب.`,
              type: "license_expired",
              reference_id: org.id,
              reference_type: "organization",
            }));
            await supabase.from("notifications").insert(notifications);
          }

          // Notify admins
          const { data: admins } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          if (admins) {
            const adminNotifs = admins.map((a: any) => ({
              user_id: a.user_id,
              title: "تنبيه: تعطيل حساب ناقل",
              message: `تم تعطيل حساب "${org.name}" تلقائياً بسبب انتهاء الترخيص بتاريخ ${org.license_expiry_date}.`,
              type: "license_expired",
              reference_id: org.id,
              reference_type: "organization",
            }));
            await supabase.from("notifications").insert(adminNotifs);
          }

          results.suspended++;
          console.log(`Suspended: ${org.name} (expired ${org.license_expiry_date})`);
        } else {
          // License expiring soon - send warning
          const { data: members } = await supabase
            .from("profiles")
            .select("id")
            .eq("organization_id", org.id);

          if (members) {
            const notifications = members.map((m: any) => ({
              user_id: m.id,
              title: `⚠️ ترخيص النقل ينتهي خلال ${daysUntilExpiry} يوم`,
              message: `ترخيص النقل لشركة "${org.name}" ينتهي بتاريخ ${org.license_expiry_date}. يرجى رفع نسخة محدثة قبل انتهاء الصلاحية لتجنب تعطيل الحساب تلقائياً.`,
              type: "license_expiry_warning",
              reference_id: org.id,
              reference_type: "organization",
            }));
            await supabase.from("notifications").insert(notifications);
          }

          results.warned++;
          console.log(`Warning sent: ${org.name} (expires in ${daysUntilExpiry} days)`);
        }
      } catch (orgError) {
        console.error(`Error processing ${org.name}:`, orgError);
        results.errors++;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("License check error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
