import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Database tools the AI agent can use
const DB_TOOLS = [
  {
    type: "function",
    function: {
      name: "ask_user",
      description: "اسأل المستخدم سؤال للحصول على بيانات ناقصة. استخدم هذا لما تحتاج معلومة من المستخدم.",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "السؤال بالعامية المصرية" },
          field_name: { type: "string", description: "اسم الحقل المطلوب" },
          options: {
            type: "array",
            items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" } } },
            description: "خيارات متاحة للمستخدم (اختياري)",
          },
        },
        required: ["question", "field_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_organizations",
      description: "البحث عن جهات (مولد، مدور، تخلص، ناقل) بالاسم أو النوع",
      parameters: {
        type: "object",
        properties: {
          search_term: { type: "string" },
          org_type: { type: "string", enum: ["generator", "recycler", "disposal", "transporter", "all"] },
        },
        required: ["org_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_drivers",
      description: "البحث عن سائقين متاحين",
      parameters: {
        type: "object",
        properties: {
          search_term: { type: "string" },
          organization_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_waste_types",
      description: "جلب أنواع المخلفات المتاحة",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_shipment",
      description: "إنشاء شحنة جديدة في قاعدة البيانات. استخدم هذا بعد تجميع كل البيانات المطلوبة.",
      parameters: {
        type: "object",
        properties: {
          generator_id: { type: "string", description: "معرف الجهة المولدة" },
          destination_id: { type: "string", description: "معرف جهة الوجهة (مدور أو تخلص)" },
          destination_type: { type: "string", enum: ["recycler", "disposal"] },
          waste_type: { type: "string" },
          estimated_weight: { type: "number" },
          weight_unit: { type: "string", enum: ["kg", "ton"] },
          is_hazardous: { type: "boolean" },
          is_packaged: { type: "boolean" },
          notes: { type: "string" },
          driver_id: { type: "string" },
          vehicle_id: { type: "string" },
        },
        required: ["generator_id", "destination_id", "destination_type", "waste_type", "estimated_weight"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_shipment_status",
      description: "تحديث حالة شحنة",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string" },
          new_status: { type: "string", enum: ["approved", "collecting", "in_transit", "delivered", "confirmed", "cancelled"] },
        },
        required: ["shipment_id", "new_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_driver_to_shipment",
      description: "تعيين سائق لشحنة",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string" },
          driver_id: { type: "string" },
        },
        required: ["shipment_id", "driver_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_shipments",
      description: "البحث عن شحنات بمعايير معينة",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          generator_id: { type: "string" },
          date_from: { type: "string" },
          date_to: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description: "جلب إحصائيات لوحة التحكم",
      parameters: {
        type: "object",
        properties: {
          organization_id: { type: "string" },
          period: { type: "string", enum: ["today", "week", "month", "year"] },
        },
        required: ["organization_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_invoice",
      description: "إنشاء فاتورة جديدة",
      parameters: {
        type: "object",
        properties: {
          shipment_id: { type: "string" },
          amount: { type: "number" },
          partner_id: { type: "string" },
          invoice_type: { type: "string", enum: ["receivable", "payable"] },
          notes: { type: "string" },
        },
        required: ["shipment_id", "amount", "partner_id", "invoice_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to_page",
      description: "توجيه المستخدم لصفحة معينة",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "مسار الصفحة مثل /dashboard/shipments/new" },
          message: { type: "string", description: "رسالة للمستخدم" },
        },
        required: ["path", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_action",
      description: "إبلاغ المستخدم بانتهاء العملية بنجاح أو فشل",
      parameters: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string", description: "رسالة بالعامية المصرية" },
          created_id: { type: "string", description: "معرف العنصر المنشأ (اختياري)" },
          next_suggestion: { type: "string", description: "اقتراح الخطوة التالية" },
        },
        required: ["success", "message"],
      },
    },
  },
];

// Execute a tool call against the database
async function executeTool(
  supabaseAdmin: any,
  toolName: string,
  args: any,
  context: { userId: string; organizationId: string; userRole: string }
): Promise<any> {
  switch (toolName) {
    case "ask_user":
      return { type: "ask_user", ...args };

    case "search_organizations": {
      let query = supabaseAdmin.from("organizations").select("id, name, name_ar, organization_type, city, governorate").eq("is_active", true);
      if (args.org_type && args.org_type !== "all") query = query.eq("organization_type", args.org_type);
      if (args.search_term) query = query.or(`name.ilike.%${args.search_term}%,name_ar.ilike.%${args.search_term}%`);
      const { data, error } = await query.limit(10);
      if (error) return { error: error.message };
      return { organizations: data || [] };
    }

    case "search_drivers": {
      let query = supabaseAdmin.from("profiles").select("id, full_name, phone").eq("account_type", "driver");
      if (args.search_term) query = query.ilike("full_name", `%${args.search_term}%`);
      if (args.organization_id) {
        // Get drivers linked to org
        const { data: members } = await supabaseAdmin
          .from("organization_members")
          .select("user_id")
          .eq("organization_id", args.organization_id)
          .eq("status", "active");
        if (members?.length) query = query.in("id", members.map((m: any) => m.user_id));
      }
      const { data, error } = await query.limit(10);
      if (error) return { error: error.message };
      return { drivers: data || [] };
    }

    case "get_waste_types": {
      const { data } = await supabaseAdmin.from("waste_types").select("id, name, name_ar, category, is_hazardous").eq("is_active", true).limit(50);
      return { waste_types: data || [] };
    }

    case "create_shipment": {
      const shipmentData: any = {
        generator_organization_id: args.generator_id,
        waste_type: args.waste_type,
        estimated_weight: args.estimated_weight,
        weight_unit: args.weight_unit || "ton",
        is_hazardous: args.is_hazardous || false,
        is_packaged: args.is_packaged || false,
        notes: args.notes || `تم الإنشاء بواسطة المساعد الصوتي`,
        status: "new",
        created_by: context.userId,
        transporter_organization_id: context.organizationId,
      };
      if (args.destination_type === "recycler") shipmentData.recycler_organization_id = args.destination_id;
      else shipmentData.disposal_organization_id = args.destination_id;
      if (args.driver_id) shipmentData.driver_id = args.driver_id;
      if (args.vehicle_id) shipmentData.vehicle_id = args.vehicle_id;

      const { data, error } = await supabaseAdmin.from("shipments").insert(shipmentData).select("id, tracking_number").single();
      if (error) return { error: error.message };
      return { success: true, shipment: data };
    }

    case "update_shipment_status": {
      const { data, error } = await supabaseAdmin
        .from("shipments")
        .update({ status: args.new_status, updated_at: new Date().toISOString() })
        .eq("id", args.shipment_id)
        .select("id, tracking_number, status")
        .single();
      if (error) return { error: error.message };
      return { success: true, shipment: data };
    }

    case "assign_driver_to_shipment": {
      const { data, error } = await supabaseAdmin
        .from("shipments")
        .update({ driver_id: args.driver_id, updated_at: new Date().toISOString() })
        .eq("id", args.shipment_id)
        .select("id, tracking_number")
        .single();
      if (error) return { error: error.message };
      return { success: true, shipment: data };
    }

    case "search_shipments": {
      let query = supabaseAdmin.from("shipments").select("id, tracking_number, status, waste_type, estimated_weight, created_at").order("created_at", { ascending: false });
      if (args.status) query = query.eq("status", args.status);
      if (args.generator_id) query = query.eq("generator_organization_id", args.generator_id);
      if (args.date_from) query = query.gte("created_at", args.date_from);
      if (args.date_to) query = query.lte("created_at", args.date_to);
      const { data, error } = await query.limit(args.limit || 10);
      if (error) return { error: error.message };
      return { shipments: data || [] };
    }

    case "get_dashboard_stats": {
      const period = args.period || "month";
      const now = new Date();
      let dateFrom: string;
      switch (period) {
        case "today": dateFrom = new Date(now.setHours(0, 0, 0, 0)).toISOString(); break;
        case "week": dateFrom = new Date(now.getTime() - 7 * 86400000).toISOString(); break;
        case "year": dateFrom = new Date(now.getFullYear(), 0, 1).toISOString(); break;
        default: dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }
      const { data: shipments } = await supabaseAdmin
        .from("shipments")
        .select("id, status, estimated_weight")
        .eq("transporter_organization_id", args.organization_id)
        .gte("created_at", dateFrom);
      const total = shipments?.length || 0;
      const delivered = shipments?.filter((s: any) => s.status === "delivered" || s.status === "confirmed").length || 0;
      const totalWeight = shipments?.reduce((sum: number, s: any) => sum + (s.estimated_weight || 0), 0) || 0;
      return { total_shipments: total, delivered, in_progress: total - delivered, total_weight: totalWeight };
    }

    case "create_invoice": {
      const { data, error } = await supabaseAdmin.from("invoices").insert({
        shipment_id: args.shipment_id,
        amount: args.amount,
        partner_organization_id: args.partner_id,
        invoice_type: args.invoice_type,
        notes: args.notes,
        status: "draft",
        organization_id: context.organizationId,
        created_by: context.userId,
      }).select("id, invoice_number").single();
      if (error) return { error: error.message };
      return { success: true, invoice: data };
    }

    case "navigate_to_page":
      return { type: "navigate", path: args.path, message: args.message };

    case "complete_action":
      return { type: "complete", ...args };

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userRole, organizationId, userId, currentRoute, actionContext } = await req.json();

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const systemPrompt = `أنت "نظام" — المساعد التنفيذي الذكي لمنصة iRecycle لإدارة المخلفات في مصر.

## شخصيتك:
- بتتكلم عامية مصرية طبيعية وودودة
- إنت مساعد تنفيذي استباقي — مش بس بتجاوب، إنت بتنفذ أوامر فعلية وبتقرأ أفكار المستخدم
- دايماً بتتوقع اللي المستخدم عايزه من سياق الصفحة اللي هو فيها
- ردودك قصيرة جداً — جملة أو اتنين بالكتير

## المستخدم الحالي:
- الدور: ${userRole || "unknown"}
- المنظمة: ${organizationId || "unknown"}
- المعرف: ${userId || "unknown"}
- الصفحة: ${currentRoute || "/dashboard"}

## ⭐ السلوك الاستباقي (أهم قاعدة):
أنت مش بتستنى أوامر وبس — إنت بتبادر!
1. لو المستخدم فتح صفحة إنشاء شحنة → ابدأ أنت اسأله "يلا ننشئ شحنة، مين الجهة المولّدة؟"
2. لو فتح صفحة الشحنات → اسأله "عايز تنشئ شحنة جديدة ولا تدور على شحنة؟"
3. لو فتح صفحة الفواتير → اسأله "عايز تنشئ فاتورة ولا تراجع فاتورة؟"
4. لو المستخدم قال كلام عام → استنتج نيته من الصفحة اللي هو فيها
5. لو الرسالة الأولى في المحادثة → رحّب بيه وقوله الاختيارات المتاحة في الصفحة دي

## قواعد جمع البيانات:
1. اسأل حقل واحد بس في كل مرة — متسألش أكتر من سؤال
2. لو المستخدم ذكر أكتر من بيانة في جملة واحدة → التقطهم كلهم ومتسألش عنهم تاني
3. لو تقدر تستنتج حاجة من السياق (مثلاً منظمة المستخدم = المولّد) → استنتجها ومتسألش
4. لو لقيت نتيجة بحث واحدة بس → اختارها تلقائياً وقول "لقيت [الاسم]، هختاره"
5. بعد ما تجمع كل البيانات المطلوبة → لخّص للمستخدم وقوله "هنشئ شحنة من [مولد] لـ[مدور]، نوع [بلاستيك]، وزن [5 طن]. أنفذ؟"
6. بعد التأكيد → نفّذ فوراً

## قواعد التنفيذ:
1. لما المستخدم يقول "أنشئ شحنة" → ابدأ اسأله: الجهة المولدة، الوجهة، نوع المخلفات، الوزن
2. لما يقول "عيّن سواق" → اسأله عن الشحنة والسائق
3. لو قال اسم جهة → ابحث عنها في الداتابيز واعرضله النتائج
4. لو قال "اعرض الشحنات" → ابحث واعرض ملخص
5. لما تكمّل عملية → بلّغه بنجاحها واقترح الخطوة اللي بعدها
6. لو مش متأكد → اسأل قبل ما تنفذ
7. لو الأمر فيه خطورة (حذف، إلغاء) → اتأكد الأول من المستخدم

## قواعد مهمة:
- استخدم ask_user لما تحتاج بيانات من المستخدم — سؤال واحد في كل مرة
- استخدم search_organizations قبل create_shipment عشان تتأكد من المعرفات
- لما المستخدم يعطيك اسم → ابحث واعرض النتائج وخليه يختار
- لو المستخدم قال "آه"، "أيوه"، "تمام"، "ماشي" → ده يعني موافقة، نفّذ
- لو قال "لأ"، "مش عايز"، "غلط" → ارجع للخطوة اللي قبلها
- لو قال رقم أو اسم بدون سؤال → ده إجابة على آخر سؤال سألته

${actionContext ? `## السياق الإضافي من الصفحة:\n${actionContext}` : "## لا يوجد سياق إضافي من الصفحة"}`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // AI agent loop — max 5 iterations to prevent infinite loops
    let iteration = 0;
    const MAX_ITERATIONS = 5;
    const toolResults: any[] = [];
    let finalResponse: any = null;

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: DB_TOOLS,
      }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({
            type: "error",
            message: "النظام مشغول شوية يا باشا، حاول تاني بعد ثواني",
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (status === 402) {
          return new Response(JSON.stringify({
            type: "error",
            message: "الرصيد خلص يا باشا، محتاج يتجدد",
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error(`AI error: ${status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) throw new Error("No AI response");

      // If the AI wants to call tools
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length) {
        const toolCalls = choice.message.tool_calls;
        aiMessages.push(choice.message); // Add assistant message with tool calls

        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          let toolArgs: any;
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            toolArgs = {};
          }

          // If AI wants to ask the user a question, return immediately
          if (toolName === "ask_user") {
            return new Response(JSON.stringify({
              type: "ask_user",
              question: toolArgs.question,
              field_name: toolArgs.field_name,
              options: toolArgs.options || [],
              conversation_state: aiMessages, // Return state for continuation
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // If AI wants to navigate
          if (toolName === "navigate_to_page") {
            return new Response(JSON.stringify({
              type: "navigate",
              path: toolArgs.path,
              message: toolArgs.message,
              conversation_state: aiMessages,
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // If AI completed the action
          if (toolName === "complete_action") {
            return new Response(JSON.stringify({
              type: "complete",
              success: toolArgs.success,
              message: toolArgs.message,
              created_id: toolArgs.created_id,
              next_suggestion: toolArgs.next_suggestion,
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // Execute database tools
          const result = await executeTool(supabaseAdmin, toolName, toolArgs, {
            userId: userId || "",
            organizationId: organizationId || "",
            userRole: userRole || "",
          });

          // Add tool result to conversation
          aiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }
        // Continue the loop — AI will process tool results
        continue;
      }

      // AI responded with text (no tool calls) — treat as conversation
      finalResponse = {
        type: "message",
        message: choice.message?.content || "مش فاهم يا باشا، ممكن توضح؟",
      };
      break;
    }

    if (!finalResponse) {
      finalResponse = {
        type: "message",
        message: "معلش يا باشا، الموضوع معقد شوية. ممكن نبسطه؟",
      };
    }

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-action-engine error:", e);
    return new Response(JSON.stringify({
      type: "error",
      message: "حصلت مشكلة يا باشا، حاول تاني",
      error: e instanceof Error ? e.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
