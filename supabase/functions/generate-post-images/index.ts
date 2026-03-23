import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { batch_size = 5 } = await req.json().catch(() => ({}));
    const actualBatchSize = Math.min(batch_size, 10); // Max 10 per call

    // Fetch posts that don't have AI-generated images yet
    const { data: posts, error: fetchError } = await supabase
      .from("platform_posts")
      .select("id, title, category, excerpt")
      .eq("ai_image_generated", false)
      .order("sort_order", { ascending: true })
      .limit(actualBatchSize);

    if (fetchError) throw fetchError;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ 
        message: "All posts already have AI images", 
        remaining: 0 
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    
    for (const post of posts) {
      try {
        // Build a descriptive prompt based on post title and category
        const categoryPrompts: Record<string, string> = {
          'بيئة': 'environmental protection, green nature, clean earth, sustainability',
          'تقنية': 'modern technology, AI, robotics, smart systems, digital innovation',
          'قوانين': 'legal documents, courthouse, justice, regulations, compliance',
          'نصائح': 'eco-friendly tips, recycling at home, green lifestyle, sustainable living',
          'شراكات': 'business partnership, handshake, collaboration, teamwork, corporate meeting',
          'إنجازات': 'achievement, success, trophy, celebration, growth chart, milestone',
          'تحديثات': 'software update, digital dashboard, app interface, modern UI, technology',
          'عام': 'sustainability, circular economy, green future, nature conservation',
          'بصمة كربونية': 'carbon footprint, CO2 emissions, clean energy, solar panels, wind turbines',
        };

        const categoryContext = categoryPrompts[post.category] || 'waste management, recycling, environment';
        
        const prompt = `Create a professional, modern, photorealistic blog cover image (landscape 800x400) for an Arabic article about waste management and recycling in Egypt. The article title is: "${post.title}". Style: ${categoryContext}. Make it vibrant, professional, and suitable for a corporate environmental platform. No text or words in the image. Clean, high-quality, editorial style.`;

        // Generate image using Lovable AI
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API error for post ${post.id}: ${aiResponse.status}`);
          results.push({ id: post.id, status: "error", error: `AI API ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image generated for post ${post.id}`);
          results.push({ id: post.id, status: "error", error: "No image in response" });
          continue;
        }

        // Extract base64 data
        const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
        if (!base64Match) {
          results.push({ id: post.id, status: "error", error: "Invalid base64 format" });
          continue;
        }

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase Storage
        const fileName = `post-${post.id}.${imageFormat === 'jpeg' ? 'jpg' : imageFormat}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, imageBytes, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for post ${post.id}:`, uploadError);
          results.push({ id: post.id, status: "error", error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // Update post with new image URL
        const { error: updateError } = await supabase
          .from("platform_posts")
          .update({ 
            cover_image_url: publicUrl, 
            ai_image_generated: true 
          })
          .eq("id", post.id);

        if (updateError) {
          results.push({ id: post.id, status: "error", error: updateError.message });
        } else {
          results.push({ id: post.id, status: "success", url: publicUrl });
        }

        // Small delay between generations
        await new Promise(r => setTimeout(r, 1000));

      } catch (err) {
        console.error(`Error processing post ${post.id}:`, err);
        results.push({ id: post.id, status: "error", error: String(err) });
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("platform_posts")
      .select("id", { count: "exact", head: true })
      .eq("ai_image_generated", false);

    return new Response(JSON.stringify({
      processed: results.length,
      successful: results.filter(r => r.status === "success").length,
      failed: results.filter(r => r.status === "error").length,
      remaining: count || 0,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
