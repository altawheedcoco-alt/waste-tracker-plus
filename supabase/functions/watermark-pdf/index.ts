import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts, degrees } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: "Missing documentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch document info
    const { data: doc, error: docError } = await supabase
      .from("organization_documents")
      .select("file_path, file_name, watermark_enabled, organization_id")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile and org name for watermark text
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", doc.organization_id)
      .single();

    // Download the file from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("organization-documents")
      .download(doc.file_path);

    if (dlError || !fileData) {
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPdf = doc.file_name?.toLowerCase().endsWith(".pdf");

    if (!isPdf || !doc.watermark_enabled) {
      // Return file as-is
      return new Response(fileData, {
        headers: {
          ...corsHeaders,
          "Content-Type": isPdf ? "application/pdf" : "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
        },
      });
    }

    // Embed watermark into PDF
    const pdfBytes = await fileData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // pdf-lib standard fonts only support WinAnsi (Latin). Strip non-Latin chars.
    const toAscii = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim() || 'User';
    const userName = toAscii(profile?.full_name || user.email || "User");
    const orgName = toAscii(org?.name || "");
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const watermarkLine1 = `[PROTECTED] ${userName} - ${orgName} - ${timestamp}`;

    const legalLines = [
      "! Unauthorized use prohibited without written consent",
      "! Distribution or printing without permission is forbidden", 
      "! iRecycle disclaims liability for any illegal use of this document",
    ];

    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();

      const stepX = 400;
      const stepY = 150;

      for (let y = -height; y < height * 2; y += stepY) {
        for (let x = -width; x < width * 2; x += stepX) {
          // User info (blue-tinted, bold courier)
          page.drawText(watermarkLine1, {
            x,
            y,
            size: 10,
            font: fontBold,
            color: rgb(0.3, 0.4, 0.7),
            opacity: 0.18,
            rotate: degrees(-30),
          });

          // Legal lines (red-tinted, courier)
          legalLines.forEach((line, i) => {
            page.drawText(line, {
              x: x + 5,
              y: y - 15 - i * 11,
              size: 7,
              font,
              color: rgb(0.7, 0.2, 0.2),
              opacity: 0.13,
              rotate: degrees(-30),
            });
          });

          // Repeated user marker offset
          page.drawText(`-- Protected: ${userName} - ${timestamp} --`, {
            x: x + 20,
            y: y - 60,
            size: 8,
            font,
            color: rgb(0.3, 0.4, 0.7),
            opacity: 0.12,
            rotate: degrees(-30),
          });
        }
      }
    }

    const watermarkedPdf = await pdfDoc.save();

    return new Response(watermarkedPdf, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.file_name)}"`,
      },
    });
  } catch (error) {
    console.error("Watermark error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
