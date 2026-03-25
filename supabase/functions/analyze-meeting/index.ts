import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { meeting_id } = await req.json();
    if (!meeting_id) throw new Error("meeting_id is required");

    // Fetch meeting details
    const { data: meeting } = await supabase
      .from("video_meetings")
      .select("*")
      .eq("id", meeting_id)
      .single();

    if (!meeting) throw new Error("Meeting not found");

    // Fetch all chat messages
    const { data: messages } = await supabase
      .from("video_meeting_messages")
      .select("*, sender:profiles!video_meeting_messages_sender_id_fkey(full_name)")
      .eq("meeting_id", meeting_id)
      .order("created_at", { ascending: true });

    // Fetch participants
    const { data: participants } = await supabase
      .from("video_meeting_participants")
      .select("*, user:profiles!video_meeting_participants_user_id_fkey(full_name)")
      .eq("meeting_id", meeting_id);

    // Fetch meeting notes
    const { data: notes } = await supabase
      .from("meeting_notes")
      .select("*")
      .eq("meeting_id", meeting_id)
      .order("created_at", { ascending: true });

    // Build transcript
    const transcript = (messages || []).map((m: any) => {
      const time = new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      const name = m.sender?.full_name || "مجهول";
      return `[${time}] ${name}: ${m.content}`;
    }).join("\n");

    const participantList = (participants || []).map((p: any) => {
      const name = p.user?.full_name || "مجهول";
      const role = p.role === "host" ? "منشئ" : "مشارك";
      const joinTime = p.joined_at ? new Date(p.joined_at).toLocaleTimeString("ar-EG") : "";
      const leftTime = p.left_at ? new Date(p.left_at).toLocaleTimeString("ar-EG") : "لم يغادر";
      return `- ${name} (${role}) | انضم: ${joinTime} | غادر: ${leftTime}`;
    }).join("\n");

    const notesList = (notes || []).map((n: any) => {
      const time = new Date(n.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      return `[${time}] ${n.user_name} (${n.note_type}): ${n.content}`;
    }).join("\n");

    // Calculate duration
    let durationMinutes = 0;
    if (meeting.started_at && meeting.ended_at) {
      durationMinutes = Math.round((new Date(meeting.ended_at).getTime() - new Date(meeting.started_at).getTime()) / 60000);
    }

    const systemPrompt = `أنت محلل اجتماعات ذكي متخصص. مهمتك تحليل محتوى الاجتماع وتقديم ملخص شامل ومنظم باللغة العربية.

يجب أن تُرجع النتيجة باستخدام الأداة المقدمة لك. حلل كل ما يلي بدقة:
1. ملخص شامل للاجتماع (فقرات واضحة)
2. النقاط الرئيسية والمحورية (مع ذكر من طرحها ومتى)
3. القرارات المتخذة
4. المهام والإجراءات المطلوبة (مع المسؤول عنها)
5. الملاحظات المهمة`;

    const userPrompt = `## بيانات الاجتماع
- العنوان: ${meeting.title}
- الوصف: ${meeting.description || "لا يوجد"}
- النوع: ${meeting.meeting_type === "video" ? "فيديو" : "صوتي"}
- تاريخ البدء: ${meeting.started_at || meeting.created_at}
- تاريخ الانتهاء: ${meeting.ended_at || "لم ينتهِ بعد"}
- المدة: ${durationMinutes} دقيقة

## المشاركون
${participantList || "لا يوجد بيانات مشاركين"}

## سجل المحادثة الكامل
${transcript || "لا توجد رسائل مسجلة"}

## ملاحظات الاجتماع
${notesList || "لا توجد ملاحظات"}

حلل هذا الاجتماع بشكل شامل ومفصل.`;

    // Call AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_meeting_analysis",
              description: "Save the structured meeting analysis results",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "ملخص شامل ومفصل للاجتماع بالعربية"
                  },
                  key_points: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        point: { type: "string", description: "النقطة الرئيسية" },
                        raised_by: { type: "string", description: "من طرح هذه النقطة" },
                        time: { type: "string", description: "الوقت التقريبي" },
                        category: { type: "string", enum: ["decision", "discussion", "action", "info", "concern"] }
                      },
                      required: ["point", "category"]
                    },
                    description: "النقاط الرئيسية والمحورية"
                  },
                  action_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task: { type: "string", description: "المهمة المطلوبة" },
                        assigned_to: { type: "string", description: "المسؤول عن التنفيذ" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        deadline: { type: "string", description: "الموعد النهائي إن وُجد" }
                      },
                      required: ["task", "priority"]
                    },
                    description: "المهام والإجراءات المطلوبة"
                  }
                },
                required: ["summary", "key_points", "action_items"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "save_meeting_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى شحن رصيد الذكاء الاصطناعي" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let analysis;
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback
      analysis = {
        summary: aiData.choices?.[0]?.message?.content || "لم يتم توليد ملخص",
        key_points: [],
        action_items: []
      };
    }

    // Save to database
    await supabase.from("video_meetings").update({
      ai_summary: analysis.summary,
      ai_key_points: analysis.key_points,
      ai_action_items: analysis.action_items,
      summary_generated_at: new Date().toISOString(),
      summary_generated_by: user.id,
      meeting_duration_minutes: durationMinutes,
    }).eq("id", meeting_id);

    return new Response(JSON.stringify({
      success: true,
      summary: analysis.summary,
      key_points: analysis.key_points,
      action_items: analysis.action_items,
      duration_minutes: durationMinutes,
      participants_count: participants?.length || 0,
      messages_count: messages?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze-meeting error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
