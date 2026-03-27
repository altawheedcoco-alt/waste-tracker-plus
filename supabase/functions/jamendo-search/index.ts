import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JAMENDO_CLIENT_ID = "b0838f40"; // Public client_id (free tier)
const JAMENDO_API = "https://api.jamendo.com/v3.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "search";

    if (action === "search") {
      const query = url.searchParams.get("q") || "";
      const tags = url.searchParams.get("tags") || "";
      const limit = url.searchParams.get("limit") || "20";
      const offset = url.searchParams.get("offset") || "0";
      const order = url.searchParams.get("order") || "popularity_total";

      const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: "json",
        limit,
        offset,
        order,
        include: "musicinfo",
        imagesize: "200",
        audioformat: "mp32",
      });

      if (query) params.set("search", query);
      if (tags) params.set("tags", tags);

      const res = await fetch(`${JAMENDO_API}/tracks/?${params.toString()}`);
      const data = await res.json();

      // Map to simpler format
      const tracks = (data.results || []).map((t: any) => ({
        id: `jamendo-${t.id}`,
        jamendoId: t.id,
        name: t.name,
        artist: t.artist_name,
        albumImage: t.album_image || t.image,
        audioUrl: t.audio,
        audioDownload: t.audiodownload,
        duration: t.duration,
        genre: t.musicinfo?.tags?.genres?.[0] || "",
        mood: t.musicinfo?.tags?.vartags?.[0] || "",
        shareUrl: t.shareurl,
      }));

      return new Response(JSON.stringify({ tracks, total: data.headers?.results_count || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "popular") {
      const tags = url.searchParams.get("tags") || "";
      const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: "json",
        limit: "20",
        order: "popularity_week",
        include: "musicinfo",
        imagesize: "200",
        audioformat: "mp32",
      });
      if (tags) params.set("tags", tags);

      const res = await fetch(`${JAMENDO_API}/tracks/?${params.toString()}`);
      const data = await res.json();

      const tracks = (data.results || []).map((t: any) => ({
        id: `jamendo-${t.id}`,
        jamendoId: t.id,
        name: t.name,
        artist: t.artist_name,
        albumImage: t.album_image || t.image,
        audioUrl: t.audio,
        audioDownload: t.audiodownload,
        duration: t.duration,
        genre: t.musicinfo?.tags?.genres?.[0] || "",
        mood: t.musicinfo?.tags?.vartags?.[0] || "",
        shareUrl: t.shareurl,
      }));

      return new Response(JSON.stringify({ tracks }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
