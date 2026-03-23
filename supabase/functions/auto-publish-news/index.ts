import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // 1. Auto-publish scheduled NEWS
    const { data: dueNews, error: newsErr } = await supabase
      .from("platform_news")
      .select("id")
      .eq("is_published", false)
      .lte("published_at", now)
      .not("published_at", "is", null);

    if (newsErr) throw newsErr;

    let newsPublished = 0;
    if (dueNews && dueNews.length > 0) {
      const ids = dueNews.map((n: any) => n.id);
      const { error } = await supabase
        .from("platform_news")
        .update({ is_published: true })
        .in("id", ids);
      if (error) throw error;
      newsPublished = ids.length;
    }

    // 2. Auto-publish scheduled POSTS
    const { data: duePosts, error: postsErr } = await supabase
      .from("platform_posts")
      .select("id")
      .eq("is_published", false)
      .lte("published_at", now)
      .not("published_at", "is", null);

    if (postsErr) throw postsErr;

    let postsPublished = 0;
    if (duePosts && duePosts.length > 0) {
      const ids = duePosts.map((p: any) => p.id);
      const { error } = await supabase
        .from("platform_posts")
        .update({ is_published: true })
        .in("id", ids);
      if (error) throw error;
      postsPublished = ids.length;
    }

    console.log(`Auto-published: ${newsPublished} news, ${postsPublished} posts at ${now}`);

    return new Response(
      JSON.stringify({ success: true, newsPublished, postsPublished }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto-publish error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
