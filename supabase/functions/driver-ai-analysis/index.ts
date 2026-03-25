import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { driver_id } = await req.json();
    if (!driver_id) throw new Error("driver_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather driver data
    const [driverRes, shipmentsRes, ratingsRes, bidsRes, walletRes] = await Promise.all([
      supabase.from("drivers").select("*, profile:profiles(full_name)").eq("id", driver_id).single(),
      supabase.from("shipments").select("id, status, waste_type, actual_weight, price_per_unit, created_at, pickup_address, delivery_address").eq("driver_id", driver_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("driver_ratings").select("overall_rating, punctuality_rating, safety_rating, communication_rating, professionalism_rating, comment, rating_direction").eq("driver_id", driver_id),
      supabase.from("driver_shipment_bids").select("bid_amount, status, created_at").eq("driver_id", driver_id).order("created_at", { ascending: false }).limit(50),
      supabase.from("driver_financial_wallet").select("balance, pending_balance, total_earned").eq("driver_id", driver_id).maybeSingle(),
    ]);

    const driver = driverRes.data;
    const shipments = shipmentsRes.data || [];
    const ratings = ratingsRes.data || [];
    const bids = bidsRes.data || [];
    const wallet = walletRes.data;

    const completed = shipments.filter((s: any) => s.status === "delivered" || s.status === "confirmed");
    const cancelled = shipments.filter((s: any) => s.status === "cancelled");
    const orgRatings = ratings.filter((r: any) => r.rating_direction === "org_to_driver");
    const avgRating = orgRatings.length ? (orgRatings.reduce((s: number, r: any) => s + r.overall_rating, 0) / orgRatings.length).toFixed(1) : "N/A";
    const acceptedBids = bids.filter((b: any) => b.status === "accepted");

    const dataContext = `
بيانات السائق:
- الاسم: ${driver?.profile?.full_name || "غير معروف"}
- النوع: ${driver?.driver_type || "غير محدد"}
- التقييم: ${avgRating}/5 (${orgRatings.length} تقييم)
- إجمالي الشحنات: ${shipments.length} (مكتملة: ${completed.length}, ملغية: ${cancelled.length})
- معدل الإتمام: ${shipments.length ? ((completed.length / shipments.length) * 100).toFixed(0) : 0}%
- نطاق الخدمة: ${driver?.service_area_km || 10} كم
- متوسط التقييمات الفرعية: مواعيد ${orgRatings.length ? (orgRatings.reduce((s: number, r: any) => s + (r.punctuality_rating || 0), 0) / orgRatings.length).toFixed(1) : "N/A"}, سلامة ${orgRatings.length ? (orgRatings.reduce((s: number, r: any) => s + (r.safety_rating || 0), 0) / orgRatings.length).toFixed(1) : "N/A"}
- المزايدات: ${bids.length} عرض (مقبول: ${acceptedBids.length})
- الرصيد: ${wallet?.balance || 0} ج.م، معلق: ${wallet?.pending_balance || 0} ج.م، إجمالي الأرباح: ${wallet?.total_earned || 0} ج.م
- أكثر أنواع النفايات: ${[...new Set(shipments.map((s: any) => s.waste_type).filter(Boolean))].slice(0, 3).join(", ") || "غير محدد"}
- تعليقات العملاء: ${orgRatings.filter((r: any) => r.comment).map((r: any) => `"${r.comment}"`).slice(0, 5).join(", ") || "لا توجد"}
`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `أنت محلل أداء ذكي لسائقي نقل المخلفات. قدم تقريراً تحليلياً شاملاً بالعربية يتضمن:
1. ملخص تنفيذي (3 أسطر)
2. نقاط القوة (3-5 نقاط)
3. مجالات التحسين (3-5 نقاط) 
4. توصيات عملية (5 نصائح قابلة للتنفيذ فوراً)
5. تقييم المخاطر (منخفض/متوسط/مرتفع مع السبب)
6. درجة الأداء الإجمالية من 100

استخدم إيموجي مناسبة وكن محدداً بالأرقام.`,
          },
          { role: "user", content: dataContext },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "لم يتم توليد تحليل";

    return new Response(JSON.stringify({
      analysis,
      stats: {
        totalShipments: shipments.length,
        completed: completed.length,
        cancelled: cancelled.length,
        completionRate: shipments.length ? Math.round((completed.length / shipments.length) * 100) : 0,
        avgRating: parseFloat(avgRating) || 0,
        totalRatings: orgRatings.length,
        totalBids: bids.length,
        acceptedBids: acceptedBids.length,
        balance: wallet?.balance || 0,
        totalEarned: wallet?.total_earned || 0,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("driver-ai-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
