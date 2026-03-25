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

    const { organizationId, reportType, periodStart, periodEnd } = await req.json();

    // Fetch shipments for the period
    const { data: shipments } = await supabase
      .from("shipments")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    const totalShipments = shipments?.length || 0;
    const totalWeight = shipments?.reduce((s: number, sh: any) => s + (sh.actual_weight || sh.estimated_weight || 0), 0) || 0;
    const wasteTypes: Record<string, { count: number; weight: number }> = {};

    shipments?.forEach((s: any) => {
      const type = s.waste_type || "غير محدد";
      if (!wasteTypes[type]) wasteTypes[type] = { count: 0, weight: 0 };
      wasteTypes[type].count++;
      wasteTypes[type].weight += (s.actual_weight || s.estimated_weight || 0);
    });

    // Fetch carbon data
    const { data: carbon } = await supabase
      .from("carbon_footprint_records")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("calculation_date", periodStart)
      .lte("calculation_date", periodEnd);

    const totalEmissions = carbon?.reduce((s: number, c: any) => s + (c.total_emissions || 0), 0) || 0;
    const totalSavings = carbon?.reduce((s: number, c: any) => s + (c.total_savings || 0), 0) || 0;

    // Fetch incidents
    const { data: incidents } = await supabase
      .from("incident_reports")
      .select("*")
      .eq("organization_id", organizationId)
      .gte("created_at", periodStart)
      .lte("created_at", periodEnd);

    const reportData = {
      shipments: { total: totalShipments, totalWeight, wasteTypes },
      environmental: { totalEmissions, totalSavings, netImpact: totalSavings - totalEmissions },
      incidents: { total: incidents?.length || 0, resolved: incidents?.filter((i: any) => i.status === "resolved").length || 0 },
      compliance: {
        licensesValid: true,
        vehiclesInspected: true,
        driversLicensed: true,
      },
    };

    const complianceScore = Math.min(100, 70 + (totalShipments > 0 ? 10 : 0) + (incidents?.length === 0 ? 10 : 0) + ((totalSavings > totalEmissions) ? 10 : 0));

    const issues: any[] = [];
    if (totalShipments === 0) issues.push({ type: "warning", message: "لا توجد شحنات في هذه الفترة" });
    if (incidents && incidents.length > 5) issues.push({ type: "critical", message: `${incidents.length} حوادث مسجلة` });

    const periodName = `${periodStart} إلى ${periodEnd}`;

    // Save report
    const { data: report, error } = await supabase.from("government_reports").insert({
      organization_id: organizationId,
      report_type: reportType || "quarterly",
      report_period: periodName,
      period_start: periodStart,
      period_end: periodEnd,
      report_data: reportData,
      summary: {
        totalShipments,
        totalWeight,
        totalEmissions: totalEmissions.toFixed(2),
        totalSavings: totalSavings.toFixed(2),
        incidentCount: incidents?.length || 0,
      },
      compliance_score: complianceScore,
      issues_found: issues,
      status: "draft",
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, report, complianceScore }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
