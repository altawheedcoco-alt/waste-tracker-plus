import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

/**
 * Edge Function: update-gamification
 * 
 * Called when a shipment is confirmed. Updates user gamification stats
 * (points, XP, shipment count, tonnage, streak) and unlocks earned achievements.
 * 
 * Body: { user_id, organization_id, quantity_tons }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, organization_id, quantity_tons } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tons = Number(quantity_tons) || 0;

    // 1) Upsert gamification row
    const { data: existing } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    const now = new Date();
    let streak = existing?.streak_days || 0;
    let longestStreak = existing?.longest_streak || 0;

    // Calculate streak
    if (existing?.last_activity_at) {
      const last = new Date(existing.last_activity_at);
      const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 48) {
        streak += 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    longestStreak = Math.max(longestStreak, streak);

    // Points: 10 per shipment + 5 per ton
    const pointsEarned = 10 + Math.round(tons * 5);
    const newTotalPoints = (existing?.total_points || 0) + pointsEarned;
    const newXP = (existing?.xp_current || 0) + pointsEarned;
    const newShipments = (existing?.total_shipments || 0) + 1;
    const newTons = Number(existing?.total_tons || 0) + tons;

    // Calculate level
    const LEVELS = [
      { level: 1, name: "برونزي", xp: 0 },
      { level: 2, name: "برونزي II", xp: 100 },
      { level: 3, name: "فضي", xp: 300 },
      { level: 4, name: "فضي II", xp: 600 },
      { level: 5, name: "ذهبي", xp: 1000 },
      { level: 6, name: "ذهبي II", xp: 1500 },
      { level: 7, name: "بلاتيني", xp: 2500 },
      { level: 8, name: "بلاتيني II", xp: 4000 },
      { level: 9, name: "ماسي", xp: 6000 },
      { level: 10, name: "أسطوري", xp: 10000 },
    ];

    let currentLevel = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (newXP >= LEVELS[i].xp) {
        currentLevel = LEVELS[i];
        break;
      }
    }
    const nextLevel = LEVELS[currentLevel.level] || currentLevel;

    const gamData = {
      user_id,
      organization_id: organization_id || existing?.organization_id || null,
      total_points: newTotalPoints,
      current_level: currentLevel.level,
      level_name: currentLevel.name,
      xp_current: newXP,
      xp_next_level: nextLevel.xp,
      total_shipments: newShipments,
      total_tons: newTons,
      streak_days: streak,
      longest_streak: longestStreak,
      last_activity_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (existing) {
      await supabase
        .from("user_gamification")
        .update(gamData)
        .eq("user_id", user_id);
    } else {
      await supabase.from("user_gamification").insert(gamData);
    }

    // 2) Check and unlock achievements
    const { data: allAchievements } = await supabase
      .from("achievement_definitions")
      .select("*")
      .eq("is_active", true);

    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user_id);

    const earnedIds = new Set((userAchievements || []).map((a: any) => a.achievement_id));
    const newlyEarned: string[] = [];

    for (const ach of allAchievements || []) {
      if (earnedIds.has(ach.id)) continue;

      let qualified = false;
      switch (ach.condition_type) {
        case "shipment_count":
          qualified = newShipments >= ach.condition_value;
          break;
        case "tonnage":
          qualified = newTons >= ach.condition_value;
          break;
        case "streak_days":
          qualified = streak >= ach.condition_value;
          break;
      }

      if (qualified) {
        newlyEarned.push(ach.id);
      }
    }

    if (newlyEarned.length > 0) {
      const inserts = newlyEarned.map((achId) => ({
        user_id,
        achievement_id: achId,
      }));
      await supabase.from("user_achievements").insert(inserts);

      // Add achievement points
      const bonusPoints = (allAchievements || [])
        .filter((a: any) => newlyEarned.includes(a.id))
        .reduce((sum: number, a: any) => sum + (a.points_reward || 0), 0);

      if (bonusPoints > 0) {
        await supabase
          .from("user_gamification")
          .update({
            total_points: newTotalPoints + bonusPoints,
            xp_current: newXP + bonusPoints,
          })
          .eq("user_id", user_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        points_earned: pointsEarned,
        new_level: currentLevel.level,
        level_name: currentLevel.name,
        achievements_unlocked: newlyEarned.length,
        streak_days: streak,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Gamification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
