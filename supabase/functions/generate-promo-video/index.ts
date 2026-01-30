import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, duration, style, organizationId, postDirectly } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    let profileId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        profileId = profile?.id;
      }
    }

    // Step 1: Generate video script with AI
    const scriptPrompt = `أنت خبير في إنشاء محتوى الفيديوهات الترويجية. أنشئ سيناريو فيديو احترافي:

الموضوع: ${prompt}
المدة: ${duration} ثانية
النمط: ${style === 'modern' ? 'عصري وحديث' : style === 'corporate' ? 'احترافي رسمي' : 'إبداعي وملفت'}

أجب بتنسيق JSON فقط كالتالي:
{
  "title": "عنوان الفيديو",
  "script": "النص الصوتي الكامل للفيديو",
  "scenes": ["وصف المشهد 1 مع تفاصيل بصرية دقيقة", "وصف المشهد 2", "وصف المشهد 3"],
  "hashtags": ["هاشتاق1", "هاشتاق2", "هاشتاق3"],
  "callToAction": "الدعوة للعمل",
  "videoPrompt": "وصف دقيق بالإنجليزية لتوليد الفيديو بالذكاء الاصطناعي (professional promotional video about recycling and waste management in Egypt, modern style, eco-friendly theme)"
}`;

    console.log("Generating script with AI...");
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت خبير في إنشاء محتوى الفيديوهات الترويجية والتسويقية. تجيب دائماً بتنسيق JSON فقط." },
          { role: "user", content: scriptPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      throw new Error("فشل في توليد المحتوى");
    }

    const aiData = await aiResponse.json();
    const aiResult = aiData.choices?.[0]?.message?.content;

    if (!aiResult) {
      throw new Error("لم يتم الحصول على رد من الذكاء الاصطناعي");
    }

    // Parse the JSON response
    const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("فشل في تحليل المحتوى");
    }

    // Clean up the JSON - remove trailing commas before ] or }
    let cleanedJson = jsonMatch[0]
      .replace(/,\s*]/g, ']')  // Remove trailing comma before ]
      .replace(/,\s*}/g, '}'); // Remove trailing comma before }
    
    let generatedContent;
    try {
      generatedContent = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("JSON parse error, attempting recovery:", parseError);
      // Try a more aggressive cleanup
      cleanedJson = cleanedJson
        .replace(/[\u0000-\u001F]+/g, ' ') // Remove control characters
        .replace(/,(\s*[}\]])/g, '$1');     // Remove any trailing commas
      generatedContent = JSON.parse(cleanedJson);
    }
    console.log("Script generated successfully");

    // Step 2: Generate promotional image using AI with image modality
    const imagePrompt = `Create a professional, high-quality promotional image for a recycling and waste management platform in Egypt. 
Style: ${style === 'modern' ? 'Modern and sleek' : style === 'corporate' ? 'Professional corporate' : 'Creative and eye-catching'}
Theme: Eco-friendly, sustainability, green technology
Elements: Recycling symbols, clean environment, modern trucks, factories, green nature
Colors: Green, blue, white, earth tones
Aspect ratio: 16:9 landscape
Ultra high resolution, professional marketing quality`;

    console.log("Generating promotional image with AI...");
    
    let imageUrl = null;
    let imageBase64 = null;
    
    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: imagePrompt }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        console.log("Image generation response received");
        
        // Check for base64 image in the response
        const images = imageData.choices?.[0]?.message?.images;
        if (images && images.length > 0) {
          imageBase64 = images[0]?.image_url?.url;
          if (imageBase64) {
            console.log("Base64 image generated successfully");
            imageUrl = imageBase64; // Use the data URL directly
          }
        }
      } else {
        console.error("Image generation failed:", await imageResponse.text());
      }
    } catch (imgError) {
      console.error("Error generating image:", imgError);
    }

    // Step 3: Post directly to organization posts if requested
    if (postDirectly && organizationId && profileId) {
      console.log("Posting to organization...");
      
      // Create post content
      const postContent = `🎬 ${generatedContent.title}\n\n${generatedContent.script}\n\n📢 ${generatedContent.callToAction}\n\n${generatedContent.hashtags.map((h: string) => `#${h}`).join(' ')}`;
      
      const mediaUrls = imageUrl ? [imageUrl] : [];
      const postType = imageUrl ? 'image' : 'text';

      const { data: post, error: postError } = await supabase
        .from('organization_posts')
        .insert({
          organization_id: organizationId,
          author_id: profileId,
          content: postContent,
          media_urls: mediaUrls,
          post_type: postType,
        })
        .select()
        .single();

      if (postError) {
        console.error("Error creating post:", postError);
      } else {
        console.log("Post created successfully:", post.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          content: generatedContent,
          imageUrl,
          posted: !postError,
          postId: post?.id,
          message: postError ? 'تم إنشاء المحتوى لكن فشل النشر' : 'تم إنشاء ونشر المحتوى بنجاح'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        imageUrl,
        posted: false,
        message: 'تم إنشاء المحتوى بنجاح'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
