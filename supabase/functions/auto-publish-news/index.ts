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

    // Find news items that are scheduled and due for publishing
    const now = new Date().toISOString();

    const { data: dueNews, error: fetchError } = await supabase
      .from("platform_news")
      .select("id")
      .eq("is_published", false)
      .lte("published_at", now)
      .not("published_at", "is", null);

    if (fetchError) throw fetchError;

    if (!dueNews || dueNews.length === 0) {
      return new Response(
        JSON.stringify({ success: true, published: 0, message: "لا توجد أخبار مستحقة للنشر" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = dueNews.map((n: any) => n.id);

    const { error: updateError } = await supabase
      .from("platform_news")
      .update({ is_published: true })
      .in("id", ids);

    if (updateError) throw updateError;

    console.log(`Auto-published ${ids.length} news items at ${now}`);

    return new Response(
      JSON.stringify({ success: true, published: ids.length }),
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
