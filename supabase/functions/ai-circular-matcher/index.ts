import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // === Authentication Check ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const _authClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: _claims, error: _authError } = await _authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (_authError || !_claims?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { waste_type, quantity_tons, location_governorate } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active symbiosis listings that accept this material type
    const { data: listings } = await supabase
      .from('symbiosis_listings')
      .select('*, organizations(name, city)')
      .eq('listing_type', 'input')
      .eq('is_active', true)
      .limit(50);

    // Fetch recycler organizations  
    const { data: recyclers } = await supabase
      .from('organizations')
      .select('id, name, city, type')
      .in('type', ['recycler', 'disposal_facility'])
      .limit(50);

    // Use AI to rank and provide reasoning
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const candidates = [
      ...(listings || []).map((l: any) => ({
        name: l.organizations?.name || 'جهة تدوير',
        city: l.organizations?.city || l.location_governorate || 'غير محدد',
        material: l.material_type,
        capacity: l.quantity_tons_per_month,
        price: l.price_per_ton,
        source: 'symbiosis',
      })),
      ...(recyclers || []).map((r: any) => ({
        name: r.name,
        city: r.city || 'غير محدد',
        material: waste_type,
        capacity: 100,
        price: null,
        source: 'registry',
      })),
    ];

    if (LOVABLE_API_KEY && candidates.length > 0) {
      const prompt = `أنت خبير في إدارة المخلفات والاقتصاد الدوار في مصر. 
      
لدي ${quantity_tons} طن من "${waste_type}" في "${location_governorate}".

هذه الجهات المتاحة:
${candidates.slice(0, 10).map((c, i) => `${i + 1}. ${c.name} - ${c.city} - سعة: ${c.capacity} طن/شهر${c.price ? ` - سعر: ${c.price} ج.م/طن` : ''}`).join('\n')}

قم بترتيب أفضل 5 جهات مع:
- نسبة التطابق (0-100)
- المسافة التقديرية بالكيلومتر
- السعر التقديري للطن
- وفر الكربون بالكيلوجرام
- سبب التوصية (جملة واحدة بالعربية)

أجب بصيغة JSON فقط: {"matches": [{"organization_name": "...", "match_score": N, "distance_km": N, "price_per_ton": N, "carbon_savings_kg": N, "capacity_tons": N, "reasoning": "..."}]}`;

      try {
        const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
        const aiResponse = await callAIWithRetry(LOVABLE_API_KEY, {
          messages: [
            { role: "system", content: "You are a waste management and circular economy expert. Always respond in valid JSON." },
            { role: "user", content: prompt },
          ],
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify(parsed), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (aiErr) {
        console.error('AI matching error:', aiErr);
      }
    }

    // Fallback: algorithmic matching
    const matches = candidates.slice(0, 5).map((c, i) => {
      const sameGov = c.city === location_governorate;
      // Deterministic distance based on same governorate + candidate index
      const distanceKm = sameGov ? 15 + i * 8 : 60 + i * 40;
      const materialMatch = c.material === waste_type;
      const capacityScore = Math.min(c.capacity / Math.max(quantity_tons, 1) * 20, 20);
      const score = Math.round(
        (sameGov ? 30 : 10) +
        (materialMatch ? 40 : 15) +
        capacityScore +
        Math.max(0, 10 - i * 2)
      );

      // Deterministic price based on capacity and material match
      const basePrice = materialMatch ? 5000 : 8000;
      const estimatedPrice = c.price || Math.round(basePrice + (c.capacity > 50 ? 2000 : 5000));

      return {
        organization_name: c.name,
        material_type: c.material,
        match_score: Math.min(score, 98),
        distance_km: Math.round(distanceKm),
        price_per_ton: estimatedPrice,
        carbon_savings_kg: Math.round(quantity_tons * 0.75 * 1000),
        capacity_tons: c.capacity,
        reasoning: sameGov
          ? `جهة في نفس المحافظة (${c.city}) مما يقلل تكلفة النقل والانبعاثات`
          : `جهة متخصصة في معالجة ${c.material} بسعة ${c.capacity} طن/شهر`,
      };
    }).sort((a, b) => b.match_score - a.match_score);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-circular-matcher error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", matches: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
