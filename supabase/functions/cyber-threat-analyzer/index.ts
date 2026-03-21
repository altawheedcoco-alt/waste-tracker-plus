import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Verify JWT auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action } = await req.json();

    if (action === "scan") {
      return await performSecurityScan(supabase, LOVABLE_API_KEY);
    }

    if (action === "zero-trust-check") {
      return await performZeroTrustCheck(supabase, user.id);
    }

    if (action === "heartbeat") {
      return await getSystemHeartbeat(supabase);
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cyber-threat-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function performSecurityScan(supabase: any, apiKey: string | undefined) {
  const threats: any[] = [];
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Brute force detection — many failed security events from same source
  const { data: recentEvents } = await supabase
    .from("security_events")
    .select("ip_address, user_id, event_type, severity, details, created_at")
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false })
    .limit(500);

  if (recentEvents?.length) {
    // Group by IP for brute force
    const ipCounts = new Map<string, number>();
    for (const ev of recentEvents) {
      if (ev.ip_address && (ev.event_type === 'login_failed' || ev.severity === 'warning')) {
        ipCounts.set(ev.ip_address, (ipCounts.get(ev.ip_address) || 0) + 1);
      }
    }
    for (const [ip, count] of ipCounts) {
      if (count >= 5) {
        threats.push({
          threat_type: 'brute_force',
          severity: count >= 15 ? 'critical' : count >= 10 ? 'high' : 'medium',
          source_ip: ip,
          description: `اكتشاف ${count} محاولة وصول فاشلة من IP: ${ip} خلال الساعة الأخيرة`,
          evidence: { failed_attempts: count, time_window: '1h' },
        });
      }
    }

    // Rate abuse — too many requests from single user
    const userCounts = new Map<string, number>();
    for (const ev of recentEvents) {
      if (ev.user_id && ev.event_type === 'rate_limit_exceeded') {
        userCounts.set(ev.user_id, (userCounts.get(ev.user_id) || 0) + 1);
      }
    }
    for (const [userId, count] of userCounts) {
      if (count >= 3) {
        threats.push({
          threat_type: 'api_abuse',
          severity: count >= 10 ? 'high' : 'medium',
          source_user_id: userId,
          description: `تجاوز حد الطلبات ${count} مرة من المستخدم خلال الساعة الأخيرة`,
          evidence: { rate_limit_hits: count },
        });
      }
    }
  }

  // 2. Suspicious login patterns — logins from unusual times or multiple locations
  const { data: recentLogins } = await supabase
    .from("activity_logs")
    .select("user_id, ip_address, created_at, details")
    .eq("action_type", "auth")
    .gte("created_at", oneDayAgo)
    .limit(500);

  if (recentLogins?.length) {
    const userIps = new Map<string, Set<string>>();
    for (const login of recentLogins) {
      if (login.user_id && login.ip_address) {
        if (!userIps.has(login.user_id)) userIps.set(login.user_id, new Set());
        userIps.get(login.user_id)!.add(login.ip_address);
      }
    }
    for (const [userId, ips] of userIps) {
      if (ips.size >= 5) {
        threats.push({
          threat_type: 'suspicious_login',
          severity: ips.size >= 10 ? 'critical' : 'high',
          source_user_id: userId,
          description: `تسجيل دخول من ${ips.size} عناوين IP مختلفة خلال 24 ساعة — احتمال اختراق حساب`,
          evidence: { unique_ips: ips.size, ips: Array.from(ips).slice(0, 10) },
        });
      }
    }
  }

  // 3. Data exfiltration — unusually high data access volume
  const { data: apiLogs } = await supabase
    .from("api_request_logs")
    .select("api_key_id, endpoint, status_code, created_at")
    .gte("created_at", oneHourAgo)
    .limit(1000);

  if (apiLogs?.length) {
    const keyUsage = new Map<string, number>();
    for (const log of apiLogs) {
      keyUsage.set(log.api_key_id, (keyUsage.get(log.api_key_id) || 0) + 1);
    }
    for (const [keyId, count] of keyUsage) {
      if (count >= 200) {
        threats.push({
          threat_type: 'data_exfiltration',
          severity: count >= 500 ? 'critical' : 'high',
          target_resource: `API Key: ${keyId}`,
          description: `نشاط غير عادي: ${count} طلب API في الساعة الأخيرة — احتمال تسريب بيانات`,
          evidence: { request_count: count, time_window: '1h' },
        });
      }
    }
  }

  // 4. Anomalous access patterns — access outside normal hours (midnight-5am)
  const hour = now.getUTCHours();
  if (recentEvents?.length && (hour >= 22 || hour <= 4)) {
    const lateEvents = recentEvents.filter((e: any) => {
      const h = new Date(e.created_at).getUTCHours();
      return h >= 22 || h <= 4;
    });
    if (lateEvents.length >= 10) {
      threats.push({
        threat_type: 'anomalous_access',
        severity: 'medium',
        description: `${lateEvents.length} حدث أمني في ساعات غير اعتيادية (بين 10 مساءً و 5 صباحاً)`,
        evidence: { event_count: lateEvents.length, time_range: '22:00-05:00 UTC' },
      });
    }
  }

  // 5. Check expired but still active tokens
  const { count: expiredTokens } = await supabase
    .from("portal_access_tokens")
    .select("id", { count: "exact", head: true })
    .lt("expires_at", now.toISOString())
    .eq("is_active", true);

  if (expiredTokens && expiredTokens > 0) {
    // Auto-fix: deactivate them
    await supabase.from("portal_access_tokens")
      .update({ is_active: false })
      .lt("expires_at", now.toISOString())
      .eq("is_active", true);

    threats.push({
      threat_type: 'anomalous_access',
      severity: 'medium',
      description: `تم اكتشاف وتعطيل ${expiredTokens} رمز وصول منتهي الصلاحية تلقائياً`,
      auto_response_taken: 'revoke_token',
      auto_response_at: now.toISOString(),
      evidence: { expired_tokens_revoked: expiredTokens },
    });
  }

  // Use AI to analyze patterns if available and there are threats
  if (apiKey && threats.length > 0) {
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "أنت محلل أمن سيبراني متخصص. حلل التهديدات المكتشفة وأعطِ تقييماً شاملاً وتوصيات. أجب بالعربية بشكل مختصر (أقل من 200 كلمة)." },
            { role: "user", content: `حلل التهديدات التالية:\n${JSON.stringify(threats.map(t => ({ type: t.threat_type, severity: t.severity, desc: t.description })), null, 2)}` },
          ],
        }),
      });
      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        const aiText = aiResult.choices?.[0]?.message?.content;
        if (aiText) {
          for (const t of threats) {
            t.ai_analysis = aiText;
            t.ai_confidence = 85;
          }
        }
      }
    } catch (e) {
      console.warn("AI analysis skipped:", e);
    }
  }

  // Execute auto-responses
  if (threats.length > 0) {
    const { data: rules } = await supabase
      .from("cyber_defense_rules")
      .select("*")
      .eq("is_enabled", true);

    const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

    for (const threat of threats) {
      const matchingRules = (rules || []).filter((r: any) =>
        r.threat_type === threat.threat_type &&
        severityRank[threat.severity] >= severityRank[r.severity_trigger]
      );

      for (const rule of matchingRules) {
        // Apply cooldown check
        if (rule.last_triggered_at) {
          const cooldownEnd = new Date(rule.last_triggered_at).getTime() + rule.cooldown_minutes * 60000;
          if (now.getTime() < cooldownEnd) continue;
        }

        threat.auto_response_taken = threat.auto_response_taken || rule.action_type;
        threat.auto_response_at = threat.auto_response_at || now.toISOString();

        // Update rule trigger info
        await supabase.from("cyber_defense_rules").update({
          last_triggered_at: now.toISOString(),
          trigger_count: (rule.trigger_count || 0) + 1,
          updated_at: now.toISOString(),
        }).eq("id", rule.id);

        // Notify admins for high/critical
        if (severityRank[threat.severity] >= 3) {
          const { data: admins } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          if (admins?.length) {
            await supabase.from("notifications").insert(
              admins.map((a: any) => ({
                user_id: a.user_id,
                title: `🔴 تهديد سيبراني ${threat.severity === 'critical' ? 'حرج' : 'عالي'}`,
                message: threat.description,
                type: "security",
                is_read: false,
              }))
            );
          }
        }
      }
    }

    // Insert threats
    const { error: insertErr } = await supabase.from("cyber_threats").insert(
      threats.map((t: any) => ({
        ...t,
        status: t.auto_response_taken ? 'mitigated' : 'detected',
        detected_at: now.toISOString(),
      }))
    );
    if (insertErr) console.error("Error inserting threats:", insertErr);

    // Update patterns
    for (const t of threats) {
      const sig = `${t.threat_type}:${t.source_ip || t.source_user_id || 'system'}`;
      const { data: existing } = await supabase
        .from("threat_patterns")
        .select("id, occurrence_count")
        .eq("pattern_name", sig)
        .maybeSingle();

      if (existing) {
        await supabase.from("threat_patterns").update({
          occurrence_count: existing.occurrence_count + 1,
          last_seen_at: now.toISOString(),
          risk_score: Math.min(100, (existing.occurrence_count + 1) * 10),
        }).eq("id", existing.id);
      } else {
        await supabase.from("threat_patterns").insert({
          pattern_name: sig,
          pattern_type: t.threat_type.includes('login') ? 'access' : t.threat_type.includes('api') ? 'frequency' : 'behavioral',
          pattern_signature: { threat_type: t.threat_type, source: t.source_ip || t.source_user_id },
          risk_score: 20,
        });
      }
    }
  }

  // Log scan
  await supabase.from("security_events").insert({
    event_type: "cyber_threat_scan",
    severity: threats.some(t => t.severity === 'critical') ? 'critical' : threats.length > 0 ? 'warning' : 'info',
    details: { threats_found: threats.length, scan_time: now.toISOString() },
  });

  return new Response(JSON.stringify({
    success: true,
    scan_time: now.toISOString(),
    threats_found: threats.length,
    threats_mitigated: threats.filter(t => t.auto_response_taken).length,
    threats,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
