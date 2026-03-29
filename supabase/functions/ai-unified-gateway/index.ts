import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { callAIWithRetry, parseAIJsonResponse } from "../_shared/ai-retry.ts";

/**
 * Unified AI Gateway — البوابة الموحدة للذكاء الاصطناعي
 * 
 * Single entry point for ALL AI operations in the platform.
 * Works from any domain/host as it's a backend-only service.
 * 
 * Supported actions:
 * - chat: Streaming chat with platform context
 * - classify: Waste classification from image
 * - extract: Data extraction from weighbridge receipts
 * - analyze: Document/data analysis
 * - generate: Text/report generation
 * - optimize: Route/price optimization
 * - detect: Anomaly detection
 * - forecast: Demand forecasting
 * - inspect: Quality inspection
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// === Global Rate Limiter (13 RPM across all users) ===
const GLOBAL_RPM_LIMIT = 13;
const WINDOW_MS = 60_000; // 1 minute
const requestTimestamps: number[] = [];

function isGlobalRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= GLOBAL_RPM_LIMIT) {
    return true;
  }
  requestTimestamps.push(now);
  return false;
}

function getRetryAfterSeconds(): number {
  if (requestTimestamps.length === 0) return 0;
  const oldestInWindow = requestTimestamps[0];
  const msUntilSlotFrees = (oldestInWindow + WINDOW_MS) - Date.now();
  return Math.max(1, Math.ceil(msUntilSlotFrees / 1000));
}

const PLATFORM_SYSTEM_PROMPT = `أنت "آي ريسايكل" - المساعد الذكي الرسمي لمنصة إدارة النفايات وإعادة التدوير.

## دورك:
تخدم الشركات المولدة للنفايات، شركات النقل، ومراكز إعادة التدوير في مصر.

## الوظائف:
- إدارة الشحنات والتتبع اللحظي
- التقارير البيئية والمالية
- تصنيف النفايات وتحليل الصور
- تحسين المسارات والجدولة
- الامتثال للقوانين البيئية المصرية (202/2020 و 4/1994)

## تعليمات:
1. أجب باللغة العربية دائماً
2. كن مختصراً وعملياً
3. قدم حلولاً قابلة للتنفيذ
4. التزم بالأنظمة البيئية المصرية`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let organizationId: string | null = null;
  let userId: string | null = null;

  try {
    // === Authentication ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Allow public access for health-related actions (chat, etc.)
    // by checking if token is the anon key itself (no user session)
    const token = authHeader.replace("Bearer ", "");
    let isPublicAccess = false;

    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      // Check if request body has a public-allowed action before rejecting
      try {
        const bodyClone = req.clone();
        const bodyCheck = await bodyClone.json();
        const PUBLIC_ALLOWED_ACTIONS = ["chat"];
        if (PUBLIC_ALLOWED_ACTIONS.includes(bodyCheck?.action)) {
          isPublicAccess = true;
          console.log("[ai-gateway] Public access granted for action:", bodyCheck.action);
        } else {
          return new Response(JSON.stringify({ error: "Invalid authentication" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        return new Response(JSON.stringify({ error: "Invalid authentication" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!isPublicAccess && claimsData?.claims) {
      userId = claimsData.claims.sub as string;

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();

      organizationId = profile?.organization_id || null;
    }

    // === Parse Request ===
    const body = await req.json();
    const { action, ...params } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: "Action is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Global Rate Limiting (13 RPM across all users) ===
    if (isGlobalRateLimited()) {
      const retryAfter = getRetryAfterSeconds();
      console.warn(`[ai-gateway] Global rate limit hit (${GLOBAL_RPM_LIMIT} RPM). Retry after ${retryAfter}s`);
      return new Response(JSON.stringify({ 
        error: `تم تجاوز الحد العام للطلبات (${GLOBAL_RPM_LIMIT}/دقيقة). يرجى المحاولة بعد ${retryAfter} ثانية`,
        retryAfter,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      });
    }

    // === Load AI Config ===
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    let aiConfig: any = null;
    if (organizationId) {
      const { data } = await adminClient
        .from("ai_platform_config")
        .select("*")
        .eq("organization_id", organizationId)
        .single();
      aiConfig = data;
    }

    const preferredModel = aiConfig?.preferred_model || "google/gemini-3-flash-preview";
    const visionModel = aiConfig?.vision_model || "google/gemini-2.5-pro";
    const fastModel = aiConfig?.fast_model || "google/gemini-2.5-flash-lite";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // === Rate Limiting ===
    if (aiConfig) {
      const now = new Date();
      const resetAt = new Date(aiConfig.usage_reset_at);
      if (now.getDate() !== resetAt.getDate()) {
        // Reset daily counter
        await adminClient
          .from("ai_platform_config")
          .update({ current_daily_usage: 1, usage_reset_at: now.toISOString() })
          .eq("organization_id", organizationId);
      } else if (aiConfig.current_daily_usage >= aiConfig.max_requests_per_day) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد اليومي لطلبات الذكاء الاصطناعي" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        await adminClient
          .from("ai_platform_config")
          .update({ current_daily_usage: aiConfig.current_daily_usage + 1 })
          .eq("organization_id", organizationId);
      }
    }

    // === Route Action ===
    let result: any;
    let modelUsed = preferredModel;
    let isStreaming = false;

    switch (action) {
      case "chat": {
        isStreaming = true;
        const customPrompt = aiConfig?.custom_system_prompt
          ? `${PLATFORM_SYSTEM_PROMPT}\n\n${aiConfig.custom_system_prompt}`
          : PLATFORM_SYSTEM_PROMPT;

        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            { role: "system", content: customPrompt },
            ...(params.messages || []),
          ],
          model: preferredModel,
          stream: true,
        });

        if (!response.ok) {
          return handleAIError(response);
        }

        // Log usage asynchronously
        logUsage(adminClient, {
          organizationId,
          userId,
          functionName: "ai-unified-gateway",
          modelUsed: preferredModel,
          requestType: "chat",
          responseTimeMs: Date.now() - startTime,
        });

        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      case "classify": {
        modelUsed = visionModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `حلل هذه الصورة للنفايات وأعطني بصيغة JSON:
{"waste_type": "plastic|paper|metal|glass|electronic|organic|chemical|medical|construction|other",
 "description": "وصف موجز",
 "purity_percentage": 0-100,
 "moisture_percentage": 0-100,
 "estimated_weight_kg": number,
 "market_price_range": "min-max EGP/ton",
 "recommendations": "توصيات للتخلص الآمن"}`,
                },
                { type: "image_url", image_url: { url: params.imageBase64 } },
              ],
            },
          ],
          model: visionModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = parseAIJsonResponse(data.choices?.[0]?.message?.content || "{}");
        break;
      }

      case "extract": {
        modelUsed = visionModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `استخرج جميع البيانات من إيصال الميزان بصيغة JSON:
{"company_name":"","ticket_number":"","material_type":"","customer_name":"","driver_name":"","vehicle_number":"","first_weight":"","second_weight":"","net_weight":"","unit":"kg","date":"","time":"","notes":""}`,
                },
                { type: "image_url", image_url: { url: params.imageBase64 } },
              ],
            },
          ],
          model: visionModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = parseAIJsonResponse(data.choices?.[0]?.message?.content || "{}");
        break;
      }

      case "analyze": {
        modelUsed = preferredModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "system",
              content: `أنت محلل بيانات متخصص في إدارة النفايات. حلل البيانات وقدم: ملخص تنفيذي، اتجاهات، توقعات، توصيات. ${aiConfig?.response_language === 'en' ? 'Respond in English.' : 'أجب بالعربية.'}`,
            },
            { role: "user", content: params.prompt || JSON.stringify(params.data) },
          ],
          model: preferredModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = data.choices?.[0]?.message?.content;
        break;
      }

      case "generate": {
        modelUsed = preferredModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            { role: "system", content: PLATFORM_SYSTEM_PROMPT },
            ...(params.messages || [{ role: "user", content: params.prompt }]),
          ],
          model: preferredModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = data.choices?.[0]?.message?.content;
        break;
      }

      case "optimize": {
        modelUsed = preferredModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "system",
              content: "أنت خبير في تحسين مسارات النقل والخدمات اللوجستية. قدم أفضل ترتيب للمسار بصيغة JSON.",
            },
            { role: "user", content: params.prompt },
          ],
          model: preferredModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = data.choices?.[0]?.message?.content;
        break;
      }

      case "detect": {
        modelUsed = fastModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "system",
              content: "أنت نظام كشف شذوذ في بيانات الشحنات والعمليات. حلل البيانات وحدد أي أنماط غير طبيعية بصيغة JSON.",
            },
            { role: "user", content: JSON.stringify(params.data) },
          ],
          model: fastModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = data.choices?.[0]?.message?.content;
        break;
      }

      case "forecast": {
        modelUsed = preferredModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "system",
              content: "أنت خبير تنبؤات متخصص في إدارة النفايات. استخدم البيانات التاريخية للتنبؤ بالأحجام المستقبلية بصيغة JSON.",
            },
            { role: "user", content: JSON.stringify(params.data) },
          ],
          model: preferredModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = data.choices?.[0]?.message?.content;
        break;
      }

      case "inspect": {
        modelUsed = visionModel;
        const response = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `افحص جودة هذه المواد المعاد تدويرها وأعطني بصيغة JSON:
{"quality_grade": "A|B|C|D|F", "contamination_level": "none|low|medium|high", "purity_percentage": 0-100, "defects": [], "recommendations": ""}`,
                },
                { type: "image_url", image_url: { url: params.imageBase64 } },
              ],
            },
          ],
          model: visionModel,
        });

        if (!response.ok) return handleAIError(response);
        const data = await response.json();
        result = parseAIJsonResponse(data.choices?.[0]?.message?.content || "{}");
        break;
      }

      case "process_queue": {
        // Process pending AI actions from the queue
        const { data: pendingActions } = await adminClient
          .from("ai_action_queue")
          .select("*")
          .eq("status", "pending")
          .order("priority", { ascending: false })
          .limit(10);

        if (!pendingActions?.length) {
          result = { processed: 0, message: "No pending actions" };
          break;
        }

        let processed = 0;
        for (const action of pendingActions) {
          try {
            await adminClient
              .from("ai_action_queue")
              .update({ status: "processing", attempts: action.attempts + 1 })
              .eq("id", action.id);

            // Route to appropriate handler
            // This is extensible - add new action types here
            const actionResult = await processQueueAction(LOVABLE_API_KEY, action, preferredModel, visionModel);

            await adminClient
              .from("ai_action_queue")
              .update({
                status: "completed",
                output_data: actionResult,
                processed_at: new Date().toISOString(),
              })
              .eq("id", action.id);

            processed++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            await adminClient
              .from("ai_action_queue")
              .update({
                status: action.attempts + 1 >= action.max_attempts ? "failed" : "pending",
                last_error: errorMsg,
              })
              .eq("id", action.id);
          }
        }

        result = { processed, total: pendingActions.length };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // === Log Usage ===
    if (!isStreaming) {
      await logUsage(adminClient, {
        organizationId,
        userId,
        functionName: "ai-unified-gateway",
        modelUsed,
        requestType: action,
        responseTimeMs: Date.now() - startTime,
        status: "success",
      });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Gateway error:", error);

    // Try to log error
    try {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } }
      );
      await logUsage(adminClient, {
        organizationId,
        userId,
        functionName: "ai-unified-gateway",
        modelUsed: "unknown",
        requestType: "error",
        responseTimeMs: Date.now() - startTime,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// === Helper Functions ===

function handleAIError(response: Response) {
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: "تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقاً" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (response.status === 402) {
    return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لاستخدام خدمات الذكاء الاصطناعي" }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logUsage(
  client: any,
  params: {
    organizationId: string | null;
    userId: string | null;
    functionName: string;
    modelUsed: string;
    requestType: string;
    responseTimeMs: number;
    status?: string;
    errorMessage?: string;
  }
) {
  try {
    await client.from("ai_usage_log").insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      function_name: params.functionName,
      model_used: params.modelUsed,
      request_type: params.requestType,
      response_time_ms: params.responseTimeMs,
      status: params.status || "success",
      error_message: params.errorMessage || null,
    });
  } catch (e) {
    console.warn("Failed to log AI usage:", e);
  }
}

async function processQueueAction(
  apiKey: string,
  action: any,
  preferredModel: string,
  visionModel: string
): Promise<any> {
  const { action_type, input_data } = action;

  switch (action_type) {
    case "auto_classify_waste": {
      const response = await callAIWithRetry(apiKey, {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 'صنف هذه النفاية بصيغة JSON: {"waste_type":"","description":"","purity_percentage":0}',
              },
              { type: "image_url", image_url: { url: input_data.imageBase64 } },
            ],
          },
        ],
        model: visionModel,
      });
      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      return parseAIJsonResponse(data.choices?.[0]?.message?.content || "{}");
    }

    case "auto_analyze_shipment": {
      const response = await callAIWithRetry(apiKey, {
        messages: [
          {
            role: "system",
            content: "حلل بيانات الشحنة وحدد أي مخاطر أو شذوذ بصيغة JSON.",
          },
          { role: "user", content: JSON.stringify(input_data) },
        ],
        model: preferredModel,
      });
      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      return { analysis: data.choices?.[0]?.message?.content };
    }

    default:
      throw new Error(`Unknown queue action: ${action_type}`);
  }
}
