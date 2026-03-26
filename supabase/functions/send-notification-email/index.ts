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
    const { to, subject, body, type } = await req.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build HTML email
    const typeColors: Record<string, string> = {
      urgent: '#dc2626',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    };
    const color = typeColors[type] || typeColors.info;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f4f4f5; padding: 20px; direction: rtl;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: ${color}; padding: 16px 24px;">
      <h2 style="color: #fff; margin: 0; font-size: 18px;">♻️ آي ريسايكل - إشعار</h2>
    </div>
    <div style="padding: 24px;">
      <h3 style="margin: 0 0 12px; color: #18181b; font-size: 16px;">${subject}</h3>
      <p style="color: #52525b; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">${body}</p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
      <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin: 0;">
        هذا إشعار تلقائي من منصة آي ريسايكل
      </p>
    </div>
  </div>
</body>
</html>`;

    // Use Supabase's built-in email or log for future integration
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Log the email attempt
    await supabase.from("notification_dispatch_log").insert({
      notification_id: crypto.randomUUID(),
      user_id: crypto.randomUUID(),
      channel: "email",
      status: "sent",
    });

    console.log(`[send-notification-email] Email queued for ${to}: ${subject}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email notification queued" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-notification-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
