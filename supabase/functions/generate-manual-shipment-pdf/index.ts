import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WAPILOT_BASE = "https://api.wapilot.net/api/v2";

function v(s: string | undefined | null): string {
  return s || '—';
}

const unitLabels: Record<string, string> = {
  ton: 'طن', kg: 'كيلوجرام', liter: 'لتر', m3: 'متر مكعب', unit: 'وحدة',
};
const hazardLabels: Record<string, string> = {
  non_hazardous: 'غير خطرة', hazardous: 'خطرة', highly_hazardous: 'شديدة الخطورة',
};
const disposalLabels: Record<string, string> = {
  recycling: 'إعادة تدوير', remanufacturing: 'إعادة تصنيع',
  landfill: 'دفن صحي', incineration: 'حرق', treatment: 'معالجة', reuse: 'إعادة استخدام',
};

// Helper: fetch Arabic font and return base64
async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buf.length; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function drawTable(doc: any, startY: number, title: string, rows: [string, string][], pageWidth: number, margin: number): number {
  const tableWidth = pageWidth - margin * 2;
  const labelWidth = tableWidth * 0.32;
  const valueWidth = tableWidth * 0.68;
  let y = startY;

  // Title row
  doc.setFillColor(240, 240, 235);
  doc.rect(margin, y, tableWidth, 6, 'FD');
  doc.setDrawColor(150);
  doc.rect(margin, y, tableWidth, 6, 'S');
  doc.setFontSize(9);
  doc.setFont("Amiri", "bold");
  doc.text(title, pageWidth - margin - 3, y + 4.2, { align: 'right' });
  y += 6;

  // Data rows
  doc.setFontSize(7.5);
  for (const [label, value] of rows) {
    const rowH = 5;
    // Label cell
    doc.setFillColor(250, 250, 247);
    doc.rect(pageWidth - margin - labelWidth, y, labelWidth, rowH, 'FD');
    doc.setDrawColor(180);
    doc.rect(pageWidth - margin - labelWidth, y, labelWidth, rowH, 'S');
    doc.setFont("Amiri", "bold");
    doc.text(label, pageWidth - margin - 2, y + 3.5, { align: 'right' });

    // Value cell
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, valueWidth, rowH, 'FD');
    doc.rect(margin, y, valueWidth, rowH, 'S');
    doc.setFont("Amiri", "normal");
    // Truncate long values
    const maxChars = 60;
    const truncVal = value.length > maxChars ? value.substring(0, maxChars) + '...' : value;
    doc.text(truncVal, pageWidth - margin - labelWidth - 2, y + 3.5, { align: 'right' });

    y += rowH;
  }

  return y + 2;
}

function generatePDF(doc: any, form: any): void {
  const pageWidth = 210;
  const margin = 14;
  let y = 14;

  // ===== HEADER =====
  doc.setFont("Amiri", "bold");
  doc.setFontSize(16);
  doc.text('بيان شحنة مخلفات', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont("Amiri", "normal");
  doc.setTextColor(100);
  doc.text('Waste Shipment Manifest — Official Document', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setTextColor(0);

  // Double line
  doc.setDrawColor(50);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 0.8, pageWidth - margin, y + 0.8);
  y += 3;

  // Meta info
  doc.setFontSize(7.5);
  const shipTypeLabel = form.shipment_type === 'urgent' ? 'عاجلة' : form.shipment_type === 'scheduled' ? 'مجدولة' : 'عادية';
  const hazard = hazardLabels[form.hazard_level] || 'غير محدد';
  const destType = form.destination_type === 'disposal' ? 'تخلص نهائي' : 'إعادة تدوير';
  const dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  doc.setFont("Amiri", "bold");
  doc.text(`رقم الشحنة: ${v(form.shipment_number)}  |  النوع: ${shipTypeLabel}  |  الخطورة: ${hazard}  |  الوجهة: ${destType}`, pageWidth - margin, y, { align: 'right' });
  doc.setFont("Amiri", "normal");
  doc.text(dateStr, margin, y, { align: 'left' });
  y += 6;

  // ===== GENERATOR =====
  y = drawTable(doc, y, 'أولاً: المولّد (Generator)', [
    ['الاسم', v(form.generator_name)],
    ['العنوان', v(form.generator_address)],
    ['الهاتف', v(form.generator_phone)],
    ['البريد الإلكتروني', v(form.generator_email)],
    ['رقم الترخيص', v(form.generator_license)],
    ['السجل التجاري', v(form.generator_commercial_register)],
    ['الرقم الضريبي', v(form.generator_tax_id)],
    ['الممثل القانوني', v(form.generator_representative)],
  ], pageWidth, margin);

  // ===== TRANSPORTER =====
  y = drawTable(doc, y, 'ثانياً: الناقل (Transporter)', [
    ['الاسم', v(form.transporter_name)],
    ['العنوان', v(form.transporter_address)],
    ['الهاتف', v(form.transporter_phone)],
    ['البريد الإلكتروني', v(form.transporter_email)],
    ['رقم الترخيص', v(form.transporter_license)],
    ['السجل التجاري', v(form.transporter_commercial_register)],
    ['الرقم الضريبي', v(form.transporter_tax_id)],
    ['الممثل القانوني', v(form.transporter_representative)],
  ], pageWidth, margin);

  // ===== DESTINATION =====
  const destTitle = form.destination_type === 'disposal' ? 'ثالثاً: جهة التخلص النهائي (Destination)' : 'ثالثاً: جهة إعادة التدوير (Destination)';
  y = drawTable(doc, y, destTitle, [
    ['الاسم', v(form.destination_name)],
    ['العنوان', v(form.destination_address)],
    ['الهاتف', v(form.destination_phone)],
    ['البريد الإلكتروني', v(form.destination_email)],
    ['رقم الترخيص', v(form.destination_license)],
    ['السجل التجاري', v(form.destination_commercial_register)],
    ['الرقم الضريبي', v(form.destination_tax_id)],
    ['الممثل القانوني', v(form.destination_representative)],
  ], pageWidth, margin);

  // Check if need new page
  if (y > 230) {
    doc.addPage();
    y = 14;
  }

  // ===== WASTE DATA =====
  y = drawTable(doc, y, 'رابعاً: بيانات المخلفات', [
    ['الوصف', v(form.waste_description)],
    ['مستوى الخطورة', hazard],
    ['الكمية', `${form.quantity || '—'} ${unitLabels[form.unit] || form.unit || ''}`],
    ['التعبئة', form.packaging_method === 'packaged' ? 'معبأة' : form.packaging_method === 'bulk' ? 'سائبة' : v(form.packaging_method)],
    ['طريقة المعالجة', v(disposalLabels[form.disposal_method] || form.disposal_method)],
  ], pageWidth, margin);

  // ===== DRIVER & VEHICLE =====
  y = drawTable(doc, y, 'خامساً: السائق والمركبة', [
    ['اسم السائق', v(form.driver_name)],
    ['هاتف السائق', v(form.driver_phone)],
    ['رخصة القيادة', v(form.driver_license)],
    ['لوحة المركبة', v(form.vehicle_plate)],
    ['نوع المركبة', v(form.vehicle_type)],
  ], pageWidth, margin);

  // ===== LOGISTICS =====
  y = drawTable(doc, y, 'سادساً: بيانات التحميل والتسليم', [
    ['موقع التحميل', v(form.pickup_address)],
    ['تاريخ التحميل', v(form.pickup_date)],
    ['موقع التسليم', v(form.delivery_address)],
    ['تاريخ التسليم', v(form.delivery_date)],
  ], pageWidth, margin);

  if (y > 250) {
    doc.addPage();
    y = 14;
  }

  // ===== DECLARATIONS =====
  doc.setFontSize(9);
  doc.setFont("Amiri", "bold");
  doc.text('الإقرارات القانونية والبيئية', pageWidth - margin, y + 4, { align: 'right' });
  doc.setDrawColor(150);
  doc.line(margin, y + 5.5, pageWidth - margin, y + 5.5);
  y += 9;

  doc.setFontSize(7);
  doc.setFont("Amiri", "normal");
  const decls = [
    'إقرار المولّد: يُقر المولّد بأن المخلفات ناتجة عن نشاطه وأنه المسؤول الأول عن صحة جميع البيانات.',
    'إقرار الناقل: يُقر الناقل بتطبيق جميع المعايير القانونية والبيئية والتزامه بكافة اشتراطات وزارة البيئة وجهاز WMRA.',
    'إقرار المستقبل: يُقر المستقبل بأنه استلم المخلفات وسيطبق كافة المعايير البيئية والتنظيمية.',
  ];
  for (const d of decls) {
    const lines = doc.splitTextToSize(d, pageWidth - margin * 2 - 4);
    for (const line of lines) {
      doc.text(line, pageWidth - margin - 2, y, { align: 'right' });
      y += 3.5;
    }
    y += 1;
  }

  // Disclaimer
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(180, 83, 9);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'FD');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(6.5);
  doc.text('إخلاء مسؤولية: منصة iRecycle أداة رقمية للتوثيق والتتبع فقط، ولا تتحمل أي مسؤولية قانونية عن محتوى البيانات أو العمليات.', pageWidth / 2, y + 4.5, { align: 'center' });
  doc.setTextColor(0);
  y += 12;

  if (y > 250) {
    doc.addPage();
    y = 14;
  }

  // ===== SIGNATURES =====
  doc.setFontSize(9);
  doc.setFont("Amiri", "bold");
  doc.text('التوقيعات والأختام', pageWidth - margin, y, { align: 'right' });
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
  y += 6;

  const sigWidth = (pageWidth - margin * 2) / 3;
  const sigLabels = ['المولّد', 'الناقل', 'المستقبل'];
  for (let i = 0; i < 3; i++) {
    const x = margin + i * sigWidth;
    doc.setDrawColor(180);
    doc.rect(x, y, sigWidth, 22, 'S');
    doc.setFontSize(8);
    doc.setFont("Amiri", "bold");
    doc.text(sigLabels[2 - i], x + sigWidth / 2, y + 4, { align: 'center' });
    // Signature line
    doc.setDrawColor(50);
    doc.line(x + 8, y + 16, x + sigWidth - 8, y + 16);
    doc.setFontSize(5.5);
    doc.setFont("Amiri", "normal");
    doc.setTextColor(130);
    doc.text('الاسم / التوقيع / الختم', x + sigWidth / 2, y + 20, { align: 'center' });
    doc.setTextColor(0);
  }
  y += 26;

  // ===== FOOTER =====
  doc.setFontSize(6);
  doc.setTextColor(130);
  doc.setDrawColor(150);
  doc.line(margin, 285, pageWidth - margin, 285);
  doc.text(`مستند صادر إلكترونياً من منصة iRecycle لإدارة المخلفات — ${dateStr}`, pageWidth - margin, 289, { align: 'right' });
  doc.text('صفحة 1', margin, 289, { align: 'left' });
  doc.setTextColor(0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const WAPILOT_TOKEN = Deno.env.get("WAPILOT_API_TOKEN");

    const body = await req.json();
    const { draft_id, send_whatsapp, to_phone } = body;

    if (!draft_id) {
      return new Response(JSON.stringify({ error: "draft_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch shipment data
    console.log("[PDF] Fetching draft:", draft_id);
    const { data: draft, error: fetchErr } = await supabase
      .from("manual_shipment_drafts")
      .select("*")
      .eq("id", draft_id)
      .single();

    if (fetchErr || !draft) {
      return new Response(JSON.stringify({ error: "Draft not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch Arabic font
    console.log("[PDF] Fetching Arabic font...");
    const fontCssRes = await fetch("https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const fontCss = await fontCssRes.text();

    // Extract font URLs from CSS
    const fontUrls: { url: string; weight: string }[] = [];
    const regex = /font-weight:\s*(\d+);[^}]*?src:\s*url\(([^)]+)\)\s*format\('woff2'\)/g;
    let match;
    while ((match = regex.exec(fontCss)) !== null) {
      fontUrls.push({ weight: match[1], url: match[2] });
    }

    // Fallback: try truetype format
    if (fontUrls.length === 0) {
      const regex2 = /font-weight:\s*(\d+);[^}]*?src:\s*url\(([^)]+\.ttf)\)/g;
      while ((match = regex2.exec(fontCss)) !== null) {
        fontUrls.push({ weight: match[1], url: match[2] });
      }
    }

    // Download regular font (woff2 or ttf)
    let regularUrl = fontUrls.find(f => f.weight === '400')?.url || fontUrls[0]?.url;
    let boldUrl = fontUrls.find(f => f.weight === '700')?.url;

    if (!regularUrl) {
      // Hardcoded fallback
      regularUrl = "https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUr.ttf";
    }

    console.log("[PDF] Font URL:", regularUrl);
    const regularBase64 = await fetchFontBase64(regularUrl);
    console.log("[PDF] Font loaded, size:", regularBase64.length);

    let boldBase64 = regularBase64; // fallback
    if (boldUrl) {
      try {
        boldBase64 = await fetchFontBase64(boldUrl);
      } catch {
        console.warn("[PDF] Bold font fetch failed, using regular");
      }
    }

    // 3. Create PDF
    console.log("[PDF] Generating PDF...");
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Register fonts
    doc.addFileToVFS("Amiri-Regular.ttf", regularBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.addFileToVFS("Amiri-Bold.ttf", boldBase64);
    doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
    doc.setFont("Amiri");
    doc.setR2L(true);

    generatePDF(doc, draft);

    // 4. Get PDF as ArrayBuffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    console.log("[PDF] Generated, size:", pdfBytes.length, "bytes");

    // 5. Upload to storage
    const shipNum = (draft.shipment_number || draft.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) || 'draft';
    const filename = `manifest-${shipNum}-${Date.now()}.pdf`;
    const storagePath = `manual-shipments/${filename}`;

    const { error: uploadErr } = await supabase.storage
      .from("shipment-documents")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[PDF] Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Upload failed", details: uploadErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("shipment-documents").getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;
    console.log("[PDF] Uploaded:", publicUrl);

    // 6. Send via WhatsApp
    let whatsappResult = null;
    if (send_whatsapp && to_phone && WAPILOT_TOKEN) {
      // Resolve instance: env var first, then API list
      let instanceId = Deno.env.get("WAPILOT_INSTANCE_ID");
      if (!instanceId) {
        try {
          const listRes = await fetch(`${WAPILOT_BASE}/instances`, { headers: { token: WAPILOT_TOKEN } });
          const raw = await listRes.json().catch(() => null);
          const arr = Array.isArray(raw) ? raw : (raw?.id ? [raw] : []);
          if (arr.length > 0) instanceId = arr[0].id;
        } catch (e) { console.warn("[PDF] Instance list failed:", e.message); }
      }
      if (instanceId) {
        let formattedPhone = to_phone.replace(/[\s+\-()]/g, "").replace(/^0+/, "");
        if (/^1\d{9}$/.test(formattedPhone)) formattedPhone = "20" + formattedPhone;
        const chatId = `${formattedPhone}@c.us`;

        try {
          // Send PDF file
          const formData = new FormData();
          formData.append("chat_id", chatId);
          formData.append("caption", `📄 بيان شحنة رقم ${draft.shipment_number || ''}`);
          formData.append("media", new File([pdfBytes], `بيان-شحنة-${draft.shipment_number || 'draft'}.pdf`, { type: "application/pdf" }));

          console.log("[PDF] Sending PDF via WhatsApp...");
          const fileRes = await fetch(`${WAPILOT_BASE}/${instanceId}/send-file`, {
            method: "POST",
            headers: { token: WAPILOT_TOKEN },
            body: formData,
          });
          const fileResult = await fileRes.text();
          console.log(`[PDF] WhatsApp file (${fileRes.status}):`, fileResult);

          // Also send text summary
          const textMsg = `📦 *بيان شحنة رقم: ${draft.shipment_number || ''}*\n━━━━━━━━━━━━━━━━━━\n🏭 المولّد: ${draft.generator_name || '—'}\n🚛 الناقل: ${draft.transporter_name || '—'}\n♻️ المدوّر: ${draft.destination_name || '—'}\n📋 النفايات: ${draft.waste_description || '—'}\n⚖️ الكمية: ${draft.quantity || '—'} ${unitLabels[draft.unit] || draft.unit || ''}\n🚚 السائق: ${draft.driver_name || '—'}\n📅 التاريخ: ${draft.pickup_date || '—'}\n\n📎 المستند الرسمي PDF مرفق أعلاه`;

          const msgRes = await fetch(`${WAPILOT_BASE}/${instanceId}/send-message`, {
            method: "POST",
            headers: { token: WAPILOT_TOKEN, "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: textMsg }),
          });
          const msgResult = await msgRes.text();
          console.log(`[PDF] WhatsApp text (${msgRes.status}):`, msgResult);

          whatsappResult = {
            file_sent: fileRes.ok,
            file_response: JSON.parse(fileResult),
            text_sent: msgRes.ok,
          };
        } catch (e) {
          console.error("[PDF] WhatsApp error:", e.message);
          whatsappResult = { error: e.message };
        }
      } else {
        whatsappResult = { error: "No active WhatsApp instance" };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      pdf_url: publicUrl,
      filename,
      whatsapp: whatsappResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[PDF] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
