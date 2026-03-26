import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { shipments, organizationId } = await req.json();
    if (!shipments?.length) {
      return new Response(JSON.stringify({ groups: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `You are a logistics AI. Analyze these shipments and suggest consolidation groups.
Each group should contain shipments that can be combined into a single trip (same area, compatible waste types).

Shipments:
${JSON.stringify(shipments.map((s: any) => ({
  id: s.id,
  number: s.shipment_number,
  pickup: s.pickup_address,
  delivery: s.delivery_address,
  wasteType: s.waste_type,
  quantity: s.quantity,
  unit: s.unit,
})), null, 2)}

Return a JSON with this structure:
{
  "groups": [
    {
      "area": "area name",
      "wasteType": "waste type",
      "shipmentIds": ["id1", "id2"],
      "estimatedSaving": 25
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a logistics optimization AI. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "consolidate_shipments",
            description: "Return consolidation groups",
            parameters: {
              type: "object",
              properties: {
                groups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      wasteType: { type: "string" },
                      shipmentIds: { type: "array", items: { type: "string" } },
                      estimatedSaving: { type: "number" }
                    },
                    required: ["area", "wasteType", "shipmentIds", "estimatedSaving"]
                  }
                }
              },
              required: ["groups"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "consolidate_shipments" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      // Map shipmentIds back to full shipment objects
      const groups = result.groups.map((g: any) => ({
        ...g,
        shipments: g.shipmentIds.map((id: string) => shipments.find((s: any) => s.id === id)).filter(Boolean),
      }));
      return new Response(JSON.stringify({ groups }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ groups: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Load consolidator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
