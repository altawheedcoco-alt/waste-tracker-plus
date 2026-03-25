import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    const { organizationId, partnerId, partnerType } = await req.json();

    // Fetch shipment history with this partner
    let query = supabase.from("shipments").select("*").eq("organization_id", organizationId);
    if (partnerType === "external") {
      query = query.eq("external_partner_id", partnerId);
    } else {
      query = query.or(`sender_organization_id.eq.${partnerId},receiver_organization_id.eq.${partnerId}`);
    }
    const { data: shipments } = await query.order("created_at", { ascending: false }).limit(200);

    const totalShipments = shipments?.length || 0;
    const delayedShipments = shipments?.filter((s: any) => s.status === "delayed" || s.is_delayed).length || 0;
    const disputedShipments = shipments?.filter((s: any) => s.has_dispute || s.status === "disputed").length || 0;
    const deliveredShipments = shipments?.filter((s: any) => s.status === "delivered").length || 0;

    // Payment analysis from accounting
    const { data: ledger } = await supabase
      .from("accounting_ledger")
      .select("*")
      .eq("organization_id", organizationId)
      .or(partnerType === "external" 
        ? `external_partner_id.eq.${partnerId}` 
        : `partner_organization_id.eq.${partnerId}`)
      .limit(100);

    const payments = ledger?.filter((e: any) => e.entry_type === "credit") || [];
    const avgPaymentDays = payments.length > 0
      ? payments.reduce((sum: number, p: any) => {
          const created = new Date(p.created_at);
          const entryDate = new Date(p.entry_date);
          return sum + Math.abs(entryDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / payments.length
      : 15;

    // Calculate scores
    const deliveryRate = totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 50;
    const delayRate = totalShipments > 0 ? (delayedShipments / totalShipments) * 100 : 0;
    const disputeRate = totalShipments > 0 ? (disputedShipments / totalShipments) * 100 : 0;

    const deliveryScore = Math.min(100, Math.max(0, deliveryRate));
    const paymentScore = Math.min(100, Math.max(0, 100 - (avgPaymentDays > 30 ? (avgPaymentDays - 30) * 2 : 0)));
    const complianceScore = Math.min(100, Math.max(0, 100 - disputeRate * 5));
    const reliabilityScore = Math.min(100, Math.max(0, 100 - delayRate * 3));

    const overallScore = (deliveryScore * 0.3 + paymentScore * 0.3 + complianceScore * 0.2 + reliabilityScore * 0.2);
    const riskLevel = overallScore >= 80 ? "low" : overallScore >= 60 ? "medium" : overallScore >= 40 ? "high" : "critical";

    const riskFactors: any[] = [];
    if (delayRate > 20) riskFactors.push({ factor: "معدل تأخير مرتفع", severity: "high", value: `${delayRate.toFixed(1)}%` });
    if (avgPaymentDays > 45) riskFactors.push({ factor: "تأخر في السداد", severity: "high", value: `${avgPaymentDays.toFixed(0)} يوم` });
    if (disputeRate > 10) riskFactors.push({ factor: "نزاعات متكررة", severity: "medium", value: `${disputeRate.toFixed(1)}%` });
    if (totalShipments < 5) riskFactors.push({ factor: "سجل تعامل محدود", severity: "low", value: `${totalShipments} شحنات` });

    const recommendations: any[] = [];
    if (riskLevel === "critical") recommendations.push("مراجعة العقد فوراً والنظر في إيقاف التعامل");
    if (riskLevel === "high") recommendations.push("تشديد شروط الدفع وطلب ضمانات إضافية");
    if (avgPaymentDays > 30) recommendations.push("تقصير فترة السداد المسموحة");
    if (delayRate > 15) recommendations.push("وضع غرامات تأخير في العقد القادم");

    const result = {
      risk_score: Math.round(overallScore),
      risk_level: riskLevel,
      payment_score: Math.round(paymentScore),
      delivery_score: Math.round(deliveryScore),
      compliance_score: Math.round(complianceScore),
      reliability_score: Math.round(reliabilityScore),
      total_shipments: totalShipments,
      delayed_shipments: delayedShipments,
      disputed_shipments: disputedShipments,
      avg_payment_days: Math.round(avgPaymentDays),
      risk_factors: riskFactors,
      recommendations,
    };

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
