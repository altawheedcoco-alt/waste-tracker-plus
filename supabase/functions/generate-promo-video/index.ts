import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

أجب بتنسيق JSON فقط بدون أي نص إضافي كالتالي:
{
  "title": "عنوان الفيديو",
  "script": "النص الصوتي الكامل للفيديو",
  "scenes": ["وصف المشهد 1", "وصف المشهد 2", "وصف المشهد 3"],
  "hashtags": ["هاشتاق1", "هاشتاق2", "هاشتاق3"],
  "callToAction": "الدعوة للعمل",
  "videoPrompt": "professional cinematic video about recycling and waste management in Egypt, green eco-friendly theme, modern technology, clean environment, sustainability"
}

مهم جداً: أجب بـ JSON صالح فقط بدون فواصل زائدة`;

    console.log("Generating script with AI...");
    
    const { callAIWithRetry } = await import("../_shared/ai-retry.ts");
    const aiResponse = await callAIWithRetry(LOVABLE_API_KEY, {
      messages: [
        { role: "system", content: "أنت خبير في إنشاء محتوى الفيديوهات. تجيب دائماً بتنسيق JSON صالح فقط بدون أي نص إضافي." },
        { role: "user", content: scriptPrompt }
      ],
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
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}');
    
    let generatedContent;
    try {
      generatedContent = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("JSON parse error, attempting recovery:", parseError);
      cleanedJson = cleanedJson
        .replace(/[\u0000-\u001F]+/g, ' ')
        .replace(/,(\s*[}\]])/g, '$1');
      generatedContent = JSON.parse(cleanedJson);
    }
    console.log("Script generated successfully");

    // Step 2: Generate promotional image
    const imagePrompt = `Professional promotional image for recycling platform in Egypt. 
Style: ${style === 'modern' ? 'Modern sleek' : style === 'corporate' ? 'Corporate professional' : 'Creative eye-catching'}
Theme: Eco-friendly, sustainability, green technology, recycling symbols, clean environment
Colors: Green, blue, white, earth tones
Ultra high resolution, marketing quality, 16:9 aspect ratio`;

    console.log("Generating promotional image...");
    
    let imageUrl = null;
    
    try {
      const imageResponse = await callAIWithRetry(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: imagePrompt }
        ],
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        console.log("Image generation response received");
        
        const images = imageData.choices?.[0]?.message?.images;
        if (images && images.length > 0) {
          imageUrl = images[0]?.image_url?.url;
          if (imageUrl) {
            console.log("Image generated successfully");
          }
        }
      } else {
        console.error("Image generation failed:", await imageResponse.text());
      }
    } catch (imgError) {
      console.error("Error generating image:", imgError);
    }

    // Step 3: Generate actual video using Lovable video generation
    let videoUrl = null;
    const videoPromptText = generatedContent.videoPrompt || 
      `Professional cinematic promotional video about recycling and waste management platform in Egypt. 
      Modern green technology, eco-friendly theme, clean environment, sustainability concept.
      Show recycling facilities, green nature, modern trucks, professional workers.
      Style: ${style === 'modern' ? 'Modern and sleek' : style === 'corporate' ? 'Corporate professional' : 'Creative and dynamic'}`;

    console.log("Generating video...");
    
    try {
      // Use Lovable's video generation endpoint
      const videoResponse = await fetch("https://video.lovable.dev/v1/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: videoPromptText,
          duration: parseInt(duration) <= 10 ? parseInt(duration) : 5, // API supports 5 or 10 seconds
          aspect_ratio: "16:9",
          resolution: "1080p"
        }),
      });

      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        videoUrl = videoData.video_url || videoData.url;
        console.log("Video generated successfully:", videoUrl);
      } else {
        const errorText = await videoResponse.text();
        console.log("Video generation API response:", videoResponse.status, errorText);
        // Video generation might not be available, continue without it
      }
    } catch (videoError) {
      console.log("Video generation not available:", videoError);
      // Continue without video - provide image as fallback
    }

    // Step 4: Post directly to organization posts if requested
    if (postDirectly && organizationId && profileId) {
      console.log("Posting to organization...");
      
      const postContent = `🎬 ${generatedContent.title}\n\n${generatedContent.script}\n\n📢 ${generatedContent.callToAction}\n\n${generatedContent.hashtags.map((h: string) => `#${h}`).join(' ')}`;
      
      const mediaUrls = videoUrl ? [videoUrl] : (imageUrl ? [imageUrl] : []);
      const postType = videoUrl ? 'video' : (imageUrl ? 'image' : 'text');

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
          videoUrl,
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
        videoUrl,
        posted: false,
        message: videoUrl ? 'تم إنشاء الفيديو والمحتوى بنجاح' : 'تم إنشاء المحتوى والصورة بنجاح'
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
