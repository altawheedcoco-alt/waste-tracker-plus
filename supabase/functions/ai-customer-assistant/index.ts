import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AssistantRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userId?: string;
  organizationId?: string;
  context?: {
    shipmentId?: string;
    ticketId?: string;
  };
}

interface AssistantResponse {
  reply: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
  escalateToHuman?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: AssistantRequest = await req.json();
    const { message, conversationHistory = [], userId, organizationId, context } = body;

    console.log('Customer assistant request:', { 
      messageLength: message.length, 
      historyLength: conversationHistory.length,
      userId,
      organizationId
    });

    // Build context information
    let contextInfo = "";
    
    // Fetch user/org info if available
    if (organizationId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name, organization_type')
        .eq('id', organizationId)
        .single();
      
      if (org) {
        contextInfo += `\nالمستخدم من منظمة: ${org.name} (${getOrgTypeLabel(org.organization_type)})`;
      }
    }

    // Fetch shipment info if referenced
    if (context?.shipmentId) {
      const { data: shipment } = await supabase
        .from('shipments')
        .select('tracking_number, status, waste_type, quantity')
        .eq('id', context.shipmentId)
        .single();
      
      if (shipment) {
        contextInfo += `\nشحنة مذكورة: ${shipment.tracking_number} - الحالة: ${getStatusLabel(shipment.status)}`;
      }
    }

    // Get recent shipments for context
    if (organizationId) {
      const { data: recentShipments } = await supabase
        .from('shipments')
        .select('tracking_number, status, waste_type')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentShipments && recentShipments.length > 0) {
        contextInfo += `\nآخر الشحنات: ${recentShipments.map(s => `${s.tracking_number} (${getStatusLabel(s.status)})`).join('، ')}`;
      }
    }

    // Build messages for AI
    const systemPrompt = `أنت مساعد خدمة العملاء الذكي لمنصة إدارة النفايات والشحنات. مهمتك مساعدة المستخدمين بإجاباتك الودية والمفيدة.

قدراتك:
1. الإجابة على الأسئلة حول الشحنات وحالتها
2. شرح كيفية استخدام المنصة
3. المساعدة في حل المشكلات الشائعة
4. توجيه المستخدم للخطوات الصحيحة
5. تصعيد الأمور المعقدة للدعم البشري

قواعد الرد:
- كن ودوداً ومهنياً
- قدم إجابات مختصرة ومفيدة
- إذا لم تعرف الإجابة، اعترف بذلك واقترح التحدث مع الدعم
- استخدم اللغة العربية الفصحى البسيطة
- قدم اقتراحات للأسئلة التالية المحتملة

${contextInfo ? `\nمعلومات السياق:${contextInfo}` : ''}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages
      { role: 'user', content: message }
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "respond_to_customer",
              description: "الرد على استفسار العميل",
              parameters: {
                type: "object",
                properties: {
                  reply: {
                    type: "string",
                    description: "الرد على العميل"
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "أسئلة مقترحة يمكن للعميل طرحها"
                  },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["navigate", "create_ticket", "track_shipment", "call_support"] },
                        label: { type: "string" }
                      }
                    },
                    description: "إجراءات مقترحة"
                  },
                  escalateToHuman: {
                    type: "boolean",
                    description: "هل يحتاج تصعيد لدعم بشري"
                  }
                },
                required: ["reply"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "respond_to_customer" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          reply: "نعتذر، الخدمة مشغولة حالياً. يرجى المحاولة بعد قليل.",
          escalateToHuman: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          reply: "نعتذر عن هذا الخلل. يرجى التواصل مع الدعم الفني مباشرة.",
          escalateToHuman: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let response: AssistantResponse;

    if (toolCall) {
      response = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback response
      response = {
        reply: aiData.choices?.[0]?.message?.content || "مرحباً! كيف يمكنني مساعدتك اليوم؟",
        suggestions: [
          "كيف أتتبع شحنتي؟",
          "كيف أنشئ شحنة جديدة؟",
          "أريد التحدث مع الدعم"
        ]
      };
    }

    // Add default suggestions if none provided
    if (!response.suggestions || response.suggestions.length === 0) {
      response.suggestions = [
        "كيف أتتبع شحنتي؟",
        "ما هي حالة طلباتي؟",
        "أريد إنشاء تذكرة دعم"
      ];
    }

    console.log('Customer assistant response generated:', {
      replyLength: response.reply.length,
      suggestionsCount: response.suggestions?.length,
      escalate: response.escalateToHuman
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Customer assistant error:', error);
    return new Response(JSON.stringify({ 
      reply: "نعتذر، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.",
      escalateToHuman: true,
      suggestions: ["التحدث مع الدعم الفني"]
    }), {
      status: 200, // Return 200 with error message to prevent client errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getOrgTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    generator: 'مُنتج نفايات',
    transporter: 'ناقل',
    recycler: 'مُدوِّر'
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'جديدة',
    approved: 'معتمدة',
    in_transit: 'في الطريق',
    delivered: 'تم التسليم',
    confirmed: 'مؤكدة',
    cancelled: 'ملغاة'
  };
  return labels[status] || status;
}
