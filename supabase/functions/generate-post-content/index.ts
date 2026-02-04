import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, tone, contentType, organizationName } = await req.json();

    console.log('Generating post content:', { prompt, tone, contentType, organizationName });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build the system prompt based on tone
    const toneDescriptions: Record<string, string> = {
      professional: 'احترافي ورسمي',
      friendly: 'ودود وقريب من الجمهور',
      motivational: 'تحفيزي وملهم',
      educational: 'تعليمي وتوعوي'
    };

    const toneDesc = toneDescriptions[tone] || toneDescriptions.professional;

    const systemPrompt = `أنت كاتب محتوى متخصص في مجال إدارة النفايات والتدوير والبيئة.
مهمتك إنشاء منشورات لوسائل التواصل الاجتماعي باللغة العربية.
النبرة المطلوبة: ${toneDesc}
${organizationName ? `اسم الجهة: ${organizationName}` : ''}

قواعد المحتوى:
- اكتب محتوى جذاب ومختصر مناسب لوسائل التواصل الاجتماعي
- استخدم إيموجي مناسبة 🌱♻️🌍
- اجعل المنشور بين 50-150 كلمة
- ركز على الرسالة البيئية والاستدامة

أجب بتنسيق JSON فقط بالشكل التالي:
{
  "content": "نص المنشور هنا",
  "hashtags": ["هاشتاق1", "هاشتاق2", "هاشتاق3"]
}`;

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let parsedContent;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      parsedContent = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback: use the raw response as content
      parsedContent = {
        content: aiResponse,
        hashtags: ['إعادة_التدوير', 'البيئة', 'الاستدامة']
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: parsedContent.content,
        hashtags: parsedContent.hashtags || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating post content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate content'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
