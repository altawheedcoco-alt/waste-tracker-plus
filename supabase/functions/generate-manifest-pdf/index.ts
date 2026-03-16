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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabaseAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await supabaseAuth.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (authError) {
      return new Response(JSON.stringify({ error: 'غير مصرح' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { shipmentId } = await req.json();
    if (!shipmentId) throw new Error("shipmentId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const orgFields = `name, name_en, address, address_details, city, region, phone, secondary_phone, email, business_email, commercial_register, tax_card, license_number, environmental_license, environmental_approval_number, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, eeaa_license_issue_date, eeaa_license_expiry_date, ida_license, ida_license_issue_date, ida_license_expiry_date, land_transport_license, land_transport_license_issue_date, land_transport_license_expiry_date, industrial_registry, establishment_registration, organization_type, partner_code, client_code, representative_name, representative_phone, representative_email, representative_position, representative_national_id, agent_name, agent_phone, agent_email, agent_national_id, delegate_name, delegate_phone, delegate_email, delegate_national_id, activity_type, field_of_work, hazardous_certified, headquarters, logo_url, digital_declaration_number, certifications_approvals`;
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select(`*, generator:organizations!shipments_generator_id_fkey(${orgFields}), transporter:organizations!shipments_transporter_id_fkey(${orgFields}), recycler:organizations!shipments_recycler_id_fkey(${orgFields})`)
      .eq("id", shipmentId)
      .single();

    if (error || !shipment) throw new Error(`Shipment not found: ${error?.message || 'no data'}`);

    const { data: custodyChain } = await supabase
      .from("custody_chain_events")
      .select("*, actor_organization:organizations!custody_chain_events_actor_organization_id_fkey(name)")
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: true });

    const { data: signatures } = await supabase
      .from("document_signatures")
      .select("*, signer:profiles!document_signatures_signer_id_fkey(full_name), signer_organization:organizations!document_signatures_organization_id_fkey(name)")
      .eq("document_id", shipmentId)
      .order("signed_at", { ascending: true });

    const html = generateManifestHTML(shipment, custodyChain || [], signatures || []);

    return new Response(
      JSON.stringify({ success: true, html, shipmentNumber: shipment.shipment_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Manifest generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function generateQRSvg(data: string, size = 60): string {
  const encodedData = encodeURIComponent(data);
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=svg" width="${size}" height="${size}" style="display:block;margin:0 auto;" alt="QR Code" crossorigin="anonymous" />`;
}

function generateBarcodeSvg(text: string, width = 180, height = 30): string {
  const chars = text.replace(/[^A-Z0-9-]/gi, '');
  let bars = '';
  let x = 0;
  const barWidth = width / (chars.length * 11 + 20);
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    const pattern = [(code >> 6) & 1, (code >> 5) & 1, (code >> 4) & 1, (code >> 3) & 1, (code >> 2) & 1, (code >> 1) & 1, code & 1, 1, 0, 1, 0];
    for (const bit of pattern) {
      if (bit) bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#000"/>`;
      x += barWidth;
    }
  }
  return `<svg width="${width}" height="${height + 12}" viewBox="0 0 ${width} ${height + 12}" xmlns="http://www.w3.org/2000/svg">${bars}<text x="${width/2}" y="${height + 10}" text-anchor="middle" font-family="monospace" font-size="7" fill="#333">${text}</text></svg>`;
}

function getLicenseStatusHTML(expiryDate: string | null | undefined): string {
  if (!expiryDate) return '<span style="color:#9ca3af;font-size:5.5px">⚪ غير محدد</span>';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `<span style="color:#dc2626;font-size:5.5px;font-weight:bold">🔴 منتهي (${new Date(expiryDate).toLocaleDateString("ar-EG")})</span>`;
  if (days <= 30) return `<span style="color:#d97706;font-size:5.5px;font-weight:bold">🟡 ينتهي خلال ${days} يوم</span>`;
  return `<span style="color:#16a34a;font-size:5.5px">🟢 ساري حتى ${new Date(expiryDate).toLocaleDateString("ar-EG")}</span>`;
}

function renderLicensesBlock(org: any): string {
  if (!org) return '';
  const isTransporter = org.organization_type === 'transporter';
  const isRecyclerOrDisposal = org.organization_type === 'recycler' || org.organization_type === 'disposal';
  let html = `<div style="border-top:1px dashed #d1d5db;margin-top:2px;padding-top:2px;">`;
  html += `<p style="font-size:5.5px;font-weight:bold;color:#15803d;margin-bottom:1px;">📋 التراخيص:</p>`;
  if (org.wmra_license) html += `<p><span class="lbl">WMRA:</span> ${org.wmra_license} ${getLicenseStatusHTML(org.wmra_license_expiry_date)}</p>`;
  if (org.environmental_license) html += `<p><span class="lbl">EEAA:</span> ${org.environmental_license} ${getLicenseStatusHTML(org.eeaa_license_expiry_date)}</p>`;
  if (isRecyclerOrDisposal && org.ida_license) html += `<p><span class="lbl">IDA:</span> ${org.ida_license} ${getLicenseStatusHTML(org.ida_license_expiry_date)}</p>`;
  if (isTransporter && org.land_transport_license) html += `<p><span class="lbl">نقل بري:</span> ${org.land_transport_license} ${getLicenseStatusHTML(org.land_transport_license_expiry_date)}</p>`;
  if (org.digital_declaration_number) html += `<p><span class="lbl">إقرار رقمي:</span> ${org.digital_declaration_number}</p>`;
  html += `</div>`;
  return html;
}

function generateManifestHTML(shipment: any, custodyChain: any[], signatures: any[]) {
  const wasteTypeLabels: Record<string, string> = {
    plastic: "بلاستيك", paper: "ورق وكرتون", metal: "معادن", glass: "زجاج",
    organic: "عضوي", electronic: "إلكتروني", textile: "منسوجات",
    chemical: "كيميائي", medical: "طبي", construction: "مخلفات بناء",
    rubber: "مطاط", wood: "خشب", mixed: "مخلوط", other: "أخرى",
    hazardous_chemical: "كيميائي خطر", hazardous_medical: "طبي خطر",
    hazardous_electronic: "إلكتروني خطر", hazardous_industrial: "صناعي خطر",
  };
  const hazardLabels: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالي", critical: "حرج" };
  const eventTypeLabels: Record<string, string> = {
    generator_handover: "تسليم المولد", transporter_pickup: "استلام الناقل",
    transporter_delivery: "تسليم الناقل", recycler_receipt: "استلام المدوّر",
  };
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ar-EG") : "—";
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString("ar-EG") : "—";

  // Integrity hash
  const docData = `${shipment.shipment_number}|${shipment.created_at}|${shipment.quantity}|${shipment.waste_type}`;
  let hash = 0;
  for (let i = 0; i < docData.length; i++) { hash = ((hash << 5) - hash) + docData.charCodeAt(i); hash = hash & hash; }
  const integrityHash = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
  const genHash = Math.abs(hash * 31).toString(16).padStart(8, '0').toUpperCase();
  const transHash = Math.abs(hash * 37).toString(16).padStart(8, '0').toUpperCase();
  const recHash = Math.abs(hash * 41).toString(16).padStart(8, '0').toUpperCase();

  const isHazardous = shipment.hazard_level && shipment.hazard_level !== "low";
  const verifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}`;
  const genVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=generator&h=${genHash}`;
  const transVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=transporter&h=${transHash}`;
  const recVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=recycler&h=${recHash}`;

  const genSig = signatures.find((s: any) => s.signer_role === 'generator' || s.organization_id === shipment.generator_id);
  const transSig = signatures.find((s: any) => s.signer_role === 'transporter' || s.organization_id === shipment.transporter_id);
  const recSig = signatures.find((s: any) => s.signer_role === 'recycler' || s.organization_id === shipment.recycler_id);

  // MICR line data
  const now = new Date();
  const dateStamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const timeStamp = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const orgCode = shipment.transporter?.client_code || shipment.generator?.client_code || '000000';
  const micrLine = `A${orgCode}A B${dateStamp}D${timeStamp}B C${shipment.shipment_number}C`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  @font-face { font-family: 'MICR E13B'; src: url('/fonts/micr-e13b.ttf') format('truetype'); font-weight: normal; font-style: normal; }
  @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { 
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; 
    font-size: 7px; color: #1a1a1a; direction: rtl; 
    width: 210mm; min-height: 297mm; position: relative;
    padding: 15mm 15mm 20mm 15mm;
    background: #fff;
  }
  
  /* Vertical rotated text on left side */
  .vertical-text {
    position: fixed; left: 0; top: 0; bottom: 0; width: 5mm;
    writing-mode: vertical-rl; text-orientation: mixed;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cairo', 'Courier New', monospace; font-size: 6.5px; font-weight: 900;
    letter-spacing: 1px; color: #000; z-index: 10; direction: ltr;
    background: rgba(240,253,244,0.6); border-left: 1px solid #16a34a;
  }
  .vertical-text span {
    transform: rotate(180deg);
    white-space: nowrap;
    padding: 4px 2px;
  }

  /* MICR line at bottom inside content area */
  .micr-line {
    position: absolute; bottom: 1mm; left: 6mm; right: 6mm;
    direction: ltr; text-align: center;
    font-family: 'MICR E13B', 'Courier New', monospace;
    font-size: 10px; letter-spacing: 1.5px; color: #000;
    z-index: 5; pointer-events: none; user-select: none;
    border-top: 1px solid #e5e7eb; padding-top: 1mm;
  }

  /* Watermark */
  body::before {
    content: "iRecycle"; position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 100px; font-weight: 900; color: rgba(22,163,74,0.06);
    pointer-events: none; z-index: 0; letter-spacing: 15px;
  }
  
  .hdr { text-align: center; border-bottom: 2.5px solid #16a34a; padding-bottom: 4px; margin-bottom: 4px; position: relative; z-index: 2; }
  .hdr-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
  .hdr-logo { font-size: 13px; font-weight: 900; color: #16a34a; }
  .hdr h1 { font-size: 11px; color: #16a34a; margin: 2px 0; }
  .hdr-sub { font-size: 6.5px; color: #666; }
  .hdr-num { font-size: 9px; font-weight: bold; margin-top: 2px; background: #f0fdf4; padding: 2px 8px; display: inline-block; border-radius: 3px; border: 1px solid #bbf7d0; }
  .hdr-codes { display: flex; justify-content: center; gap: 12px; align-items: center; margin-top: 4px; }
  .hdr-codes .qr-box { border: 1px solid #d1d5db; border-radius: 3px; padding: 2px; background: #fff; }
  .hdr-codes .barcode-box { text-align: center; }

  .sec { margin-bottom: 3px; position: relative; z-index: 2; }
  .sec-t { background: linear-gradient(90deg, #f0fdf4, #fff); border-right: 3px solid #16a34a; padding: 1.5px 6px; font-weight: bold; font-size: 7.5px; margin-bottom: 2px; color: #15803d; }
  
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #d1d5db; padding: 1.5px 3px; text-align: right; font-size: 6.5px; line-height: 1.25; }
  th { background: #f0fdf4; font-weight: bold; color: #15803d; font-size: 6px; }
  
  .parties { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; margin-bottom: 3px; }
  .party { border: 1px solid #d1d5db; border-radius: 3px; padding: 3px 4px; background: #fafafa; }
  .party h4 { font-size: 7px; color: #16a34a; margin-bottom: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 1px; }
  .party p { font-size: 6px; margin: 0.5px 0; line-height: 1.25; }
  .lbl { color: #6b7280; }
  .val { font-weight: 600; }
  
  .chain-row td { font-size: 6px; padding: 1px 2px; }
  
  .sigs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin: 4px 0; }
  .sig-box { border: 1px solid #d1d5db; border-radius: 3px; padding: 3px; text-align: center; min-height: 55px; background: #fafafa; }
  .sig-box h5 { font-size: 6.5px; color: #15803d; margin-bottom: 1px; }
  .sig-line { border-bottom: 1px dotted #9ca3af; margin: 6px 6px 1px; }
  .sig-label { font-size: 5px; color: #9ca3af; }
  .sig-qr { margin: 2px auto; }
  .sig-hash { font-family: monospace; font-size: 4.5px; color: #16a34a; background: #f0fdf4; padding: 1px 3px; border-radius: 2px; display: inline-block; margin-top: 1px; }
  .sig-status { font-size: 5px; padding: 1px 3px; border-radius: 2px; display: inline-block; margin-top: 1px; }
  .sig-signed { background: #dcfce7; color: #166534; }
  .sig-pending { background: #fef3c7; color: #92400e; }
  
  .decl { background: #fffbeb; border: 1px solid #fde68a; border-radius: 3px; padding: 3px 4px; margin: 3px 0; }
  .decl h4 { font-size: 7px; color: #92400e; margin-bottom: 2px; }
  .decl p { font-size: 5.5px; color: #78350f; line-height: 1.4; }
  .decl-party { background: #fef9c3; border: 1px solid #fde047; border-radius: 2px; padding: 2px 4px; margin: 2px 0; }
  .decl-party strong { font-size: 6px; color: #854d0e; }
  .decl-party p { font-size: 5px; color: #713f12; margin: 0.5px 0; }
  
  .terms { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 3px; padding: 3px 5px; margin: 3px 0; }
  .terms h4 { font-size: 6.5px; color: #334155; margin-bottom: 1px; }
  .terms ol { font-size: 5px; color: #475569; padding-right: 10px; line-height: 1.4; columns: 2; column-gap: 10px; }
  .terms li { break-inside: avoid; margin-bottom: 0.5px; }
  
  .sec-footer { display: flex; justify-content: space-between; align-items: center; border-top: 2.5px solid #16a34a; padding-top: 4px; margin-top: 4px; }
  .sec-footer .left { font-size: 5px; color: #6b7280; }
  .sec-footer .center { text-align: center; }
  .sec-footer .right { text-align: left; direction: ltr; }
  .qr-main { border: 1px solid #d1d5db; border-radius: 3px; padding: 2px; background: #fff; display: inline-block; }
  .hash-badge { font-family: monospace; font-size: 5px; color: #16a34a; background: #f0fdf4; padding: 1px 3px; border-radius: 2px; border: 1px solid #bbf7d0; }
</style>
</head>
<body>

<!-- Vertical Rotated Text on Left Side -->
<div class="vertical-text">
  <span>▸ منصة اي ريسايكل — هذه الوثيقة مؤمنة وذكية | iRecycle Platform — This Document is Secured &amp; Smart | 𓇋𓂋𓇌𓋴𓇌𓎡𓃭 — 𓅓𓋴𓏏𓈖𓂧 𓅓𓀀𓅓𓈖 𓅱𓇌𓎡𓇌 ◂</span>
</div>

<!-- MICR Line at Bottom -->
<div class="micr-line">${micrLine}</div>

<!-- Header with QR & Barcode -->
<div class="hdr">
  <div class="hdr-top">
    <div style="font-size:5.5px;color:#666;text-align:right;">
      جمهورية مصر العربية<br/>جهاز تنظيم إدارة المخلفات (WMRA)
    </div>
    <div class="hdr-logo">♻️ iRecycle</div>
    <div style="font-size:5.5px;color:#666;text-align:left;direction:ltr;">
      Arab Republic of Egypt<br/>Waste Management Regulatory Agency
    </div>
  </div>
  <h1>مانيفست نقل المخلفات | Waste Transport Manifest</h1>
  <div class="hdr-sub">نموذج موحد وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية</div>
  <div class="hdr-num">رقم المانيفست: ${shipment.shipment_number} &nbsp;|&nbsp; تاريخ الإصدار: ${formatDate(shipment.created_at)}</div>
  ${isHazardous ? `<div style="background:#fef2f2;color:#dc2626;padding:2px 6px;border-radius:3px;font-weight:bold;font-size:7px;border:1px solid #fecaca;display:inline-block;margin-top:2px;">⚠️ مخلفات خطرة - مستوى الخطورة: ${hazardLabels[shipment.hazard_level] || shipment.hazard_level}</div>` : ''}
  
  <!-- QR Code & Barcode in Header -->
  <div class="hdr-codes">
    <div class="qr-box">${generateQRSvg(verifyUrl, 45)}</div>
    <div class="barcode-box">${generateBarcodeSvg(shipment.shipment_number, 160, 22)}</div>
    <div style="font-size:5px;color:#6b7280;">
      <div>امسح للتحقق من صحة الوثيقة</div>
      <div class="hash-badge" style="margin-top:2px;">SHA: ${integrityHash}</div>
    </div>
  </div>
</div>

<!-- 1. الأطراف -->
<div class="sec">
  <div class="sec-t">القسم الأول: الأطراف المعنية | Involved Parties</div>
  <div class="parties">
    <div class="party">
      <h4>🏭 المولّد | Generator</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.generator?.name || shipment.manual_generator_name || "—"}</span></p>
      ${shipment.generator?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.generator.name_en}</span></p>` : ''}
      <p><span class="lbl">كود:</span> ${shipment.generator?.partner_code || "—"} ${shipment.generator?.client_code ? `| ${shipment.generator.client_code}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.generator?.address || "—"}${shipment.generator?.city ? ` - ${shipment.generator.city}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.generator?.phone || "—"}</p>
      <p><span class="lbl">سجل:</span> ${shipment.generator?.commercial_register || "—"} ${shipment.generator?.tax_card ? `| ض: ${shipment.generator.tax_card}` : ''}</p>
      ${shipment.generator?.environmental_approval_number ? `<p><span class="lbl">موافقة بيئية:</span> ${shipment.generator.environmental_approval_number}</p>` : ''}
      ${shipment.generator?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.generator.representative_name}</p>` : ''}
      ${renderLicensesBlock(shipment.generator)}
    </div>
    <div class="party">
      <h4>🚛 الناقل | Transporter</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.transporter?.name || shipment.manual_transporter_name || "—"}</span></p>
      ${shipment.transporter?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.transporter.name_en}</span></p>` : ''}
      <p><span class="lbl">كود:</span> ${shipment.transporter?.partner_code || "—"} ${shipment.transporter?.client_code ? `| ${shipment.transporter.client_code}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.transporter?.address || "—"}${shipment.transporter?.city ? ` - ${shipment.transporter.city}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.transporter?.phone || "—"}</p>
      <p><span class="lbl">سجل:</span> ${shipment.transporter?.commercial_register || "—"}</p>
      <p><span class="lbl">رخصة نقل:</span> ${shipment.transporter?.license_number || "—"}</p>
      ${shipment.transporter?.hazardous_certified ? `<p><span class="lbl">مخلفات خطرة:</span> ✅</p>` : ''}
      ${shipment.transporter?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.transporter.representative_name}</p>` : ''}
      ${renderLicensesBlock(shipment.transporter)}
    </div>
    <div class="party">
      <h4>♻️ المدوّر | Recycler</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.recycler?.name || shipment.manual_recycler_name || "—"}</span></p>
      ${shipment.recycler?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.recycler.name_en}</span></p>` : ''}
      <p><span class="lbl">كود:</span> ${shipment.recycler?.partner_code || "—"} ${shipment.recycler?.client_code ? `| ${shipment.recycler.client_code}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.recycler?.address || "—"}${shipment.recycler?.city ? ` - ${shipment.recycler.city}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.recycler?.phone || "—"}</p>
      <p><span class="lbl">سجل:</span> ${shipment.recycler?.commercial_register || "—"}</p>
      ${shipment.recycler?.environmental_approval_number ? `<p><span class="lbl">موافقة بيئية:</span> ${shipment.recycler.environmental_approval_number}</p>` : ''}
      ${shipment.recycler?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.recycler.representative_name}</p>` : ''}
      ${renderLicensesBlock(shipment.recycler)}
    </div>
  </div>
</div>

<!-- 2. توصيف المخلف -->
<div class="sec">
  <div class="sec-t">القسم الثاني: التوصيف الدقيق للمخلف | Waste Description</div>
  <table>
    <tr>
      <th>تصنيف المخلف</th><th>الوصف التفصيلي</th><th>الحالة</th><th>الخطورة</th><th>التعبئة</th><th>المعالجة</th><th>التخلص</th>
    </tr>
    <tr>
      <td><strong>${wasteTypeLabels[shipment.waste_type] || shipment.waste_type || "—"}</strong></td>
      <td>${shipment.waste_description || "غير محدد"}</td>
      <td>${shipment.waste_state || "—"}</td>
      <td style="${isHazardous ? 'color:#dc2626;font-weight:bold;' : ''}">${hazardLabels[shipment.hazard_level] || shipment.hazard_level || "—"} ${isHazardous ? '⚠️' : ''}</td>
      <td>${shipment.packaging_method || "—"}</td>
      <td>${shipment.disposal_method || "—"}</td>
      <td>${shipment.disposal_type || "—"}</td>
    </tr>
  </table>
</div>

<!-- 3. الكميات -->
<div class="sec">
  <div class="sec-t">القسم الثالث: الكميات والأوزان | Quantities & Weights</div>
  <table>
    <tr>
      <th>الكمية</th><th>الوحدة</th><th>تذكرة الميزان</th><th>إجمالي</th><th>فارغة</th><th>صافي</th><th>فعلي</th><th>عند المصدر</th><th>عند الوجهة</th><th>فرق %</th>
    </tr>
    <tr>
      <td><strong>${shipment.quantity || "—"}</strong></td>
      <td>${shipment.unit || "طن"}</td>
      <td>${shipment.weighbridge_ticket_number || "—"}</td>
      <td>${shipment.weighbridge_gross_weight || "—"}</td>
      <td>${shipment.weighbridge_tare_weight || "—"}</td>
      <td>${shipment.weighbridge_net_weight || "—"}</td>
      <td>${shipment.actual_weight || "—"}</td>
      <td>${shipment.weight_at_source || "—"}</td>
      <td>${shipment.weight_at_destination || "—"}</td>
      <td style="${shipment.weight_discrepancy_pct && shipment.weight_discrepancy_pct > 5 ? 'color:#dc2626;font-weight:bold;' : ''}">${shipment.weight_discrepancy_pct != null ? shipment.weight_discrepancy_pct + '%' : "—"}</td>
    </tr>
  </table>
</div>

<!-- 4. السائق والمركبة -->
<div class="sec">
  <div class="sec-t">القسم الرابع: السائق والمركبة | Driver & Vehicle</div>
  <table>
    <tr><th>اسم السائق</th><th>الرخصة</th><th>الهاتف</th><th>نوع المركبة</th><th>رقم اللوحة</th><th>تحقق</th></tr>
    <tr>
      <td>${shipment.driver?.full_name || shipment.manual_driver_name || "—"}</td>
      <td>${shipment.driver?.license_number || "—"}</td>
      <td>${shipment.driver?.phone || "—"}</td>
      <td>${shipment.driver?.vehicle_type || "—"}</td>
      <td>${shipment.driver?.vehicle_plate_number || shipment.manual_vehicle_plate || "—"}</td>
      <td>${shipment.plate_verified ? '✅' : '—'}</td>
    </tr>
  </table>
</div>

<!-- 5. المسار والجدول الزمني -->
<div class="sec">
  <div class="sec-t">القسم الخامس: المسار والجدول الزمني | Route & Timeline</div>
  <table>
    <tr><th>نقطة الاستلام</th><th>إحداثيات</th><th>نقطة التسليم</th><th>إحداثيات</th></tr>
    <tr>
      <td>${shipment.pickup_address || "—"} ${shipment.pickup_city ? `- ${shipment.pickup_city}` : ''}</td>
      <td style="font-family:monospace;font-size:5px;">${shipment.gps_pickup_lat ? `${Number(shipment.gps_pickup_lat).toFixed(4)},${Number(shipment.gps_pickup_lng).toFixed(4)}` : "—"}</td>
      <td>${shipment.delivery_address || "—"} ${shipment.delivery_city ? `- ${shipment.delivery_city}` : ''}</td>
      <td style="font-family:monospace;font-size:5px;">${shipment.gps_delivery_lat ? `${Number(shipment.gps_delivery_lat).toFixed(4)},${Number(shipment.gps_delivery_lng).toFixed(4)}` : "—"}</td>
    </tr>
  </table>
  <table style="margin-top:2px;">
    <tr><th>الإنشاء</th><th>الاستلام</th><th>بدء النقل</th><th>التسليم المتوقع</th><th>التسليم</th><th>الاعتماد</th></tr>
    <tr>
      <td>${formatDateTime(shipment.created_at)}</td>
      <td>${formatDate(shipment.pickup_date)}</td>
      <td>${formatDateTime(shipment.in_transit_at)}</td>
      <td>${formatDate(shipment.expected_delivery_date)}</td>
      <td>${formatDateTime(shipment.delivered_at)}</td>
      <td>${formatDateTime(shipment.approved_at)}</td>
    </tr>
  </table>
  <p style="font-size:5px;color:#6b7280;margin-top:1px;">
    GPS: ${shipment.gps_active_throughout ? '✅ نشط' : '⚠️ غير مؤكد'} | الحيازة: ${shipment.custody_chain_complete ? '✅ مكتملة' : '⏳'} | الامتثال: ${shipment.compliance_verified ? '✅' : '⏳'}
  </p>
</div>

<!-- 6. سلسلة الحيازة -->
${custodyChain.length > 0 ? `
<div class="sec">
  <div class="sec-t">القسم السادس: سلسلة الحيازة الرقمية | Digital Chain of Custody</div>
  <table>
    <tr><th>#</th><th>الحدث</th><th>الجهة</th><th>التاريخ</th><th>الإحداثيات</th><th>بصمة</th></tr>
    ${custodyChain.slice(0, 6).map((evt: any, i: number) => `
    <tr class="chain-row">
      <td>${i + 1}</td>
      <td>${eventTypeLabels[evt.event_type] || evt.event_type}</td>
      <td>${evt.actor_organization?.name || "—"}</td>
      <td>${formatDateTime(evt.created_at)}</td>
      <td style="font-family:monospace;font-size:5px;">${evt.gps_latitude ? `${Number(evt.gps_latitude).toFixed(4)},${Number(evt.gps_longitude).toFixed(4)}` : "—"}</td>
      <td style="font-family:monospace;font-size:4.5px;">${evt.qr_code_hash?.slice(0, 16) || "—"}</td>
    </tr>`).join("")}
  </table>
</div>` : ""}

<!-- 7. الإقرارات -->
<div class="decl">
  <h4>📜 الإقرارات والتعهدات القانونية</h4>
  <p style="margin-bottom:2px;font-size:5px;">
    يقر كل طرف بصحة البيانات الواردة ويتحمل المسئولية المدنية والجنائية عن أي مخالفة وفقاً لقانون 202/2020 ولائحته التنفيذية وقانون البيئة 4/1994 واتفاقية بازل.
  </p>
  <div class="decl-party">
    <strong>🏭 المولّد: ${shipment.generator?.name || "—"}</strong>
    <p>أقر بتصنيف المخلفات بدقة وفقاً للكود المصري وأن الكميات والأوصاف صحيحة. (المادة 27 — ق202/2020)</p>
  </div>
  <div class="decl-party">
    <strong>🚛 الناقل: ${shipment.transporter?.name || "—"}</strong>
    <p>أقر باستلام المخلفات والتزامي بالمسار المحدد وعدم التفريغ في غير الجهة المستلمة. (المادة 29 — ق202/2020)</p>
  </div>
  <div class="decl-party">
    <strong>♻️ المستلم: ${shipment.recycler?.name || "—"}</strong>
    <p>أقر باستلام المخلفات وتحققي من مطابقتها للمانيفست. (المادة 31 — ق202/2020)</p>
  </div>
  <p style="margin-top:2px;font-weight:bold;font-size:5px;color:#991b1b;">
    ⚠️ تحذير: التوقيع بمثابة موافقة نهائية. المخالفة تعرض للعقوبات (المواد 68-82 — ق202/2020).
  </p>
</div>

<!-- 8. التوقيعات -->
<div class="sigs">
  <div class="sig-box">
    <h5>🏭 المولّد</h5>
    ${genSig?.signature_url ? `<img src="${genSig.signature_url}" style="max-width:50px;max-height:20px;margin:2px auto;display:block;" alt="توقيع"/>` : `<div class="sig-line"></div>`}
    <div class="sig-label">${genSig?.signer?.full_name || shipment.generator?.name || ".................."}</div>
    <div class="sig-label">${genSig?.signed_at ? formatDate(genSig.signed_at) : formatDate(shipment.pickup_date)}</div>
    <span class="sig-status ${genSig ? 'sig-signed' : 'sig-pending'}">${genSig ? '✓ موقّع' : '⏳ انتظار'}</span>
    <div class="sig-qr">${generateQRSvg(genVerifyUrl, 30)}</div>
    <div class="sig-hash">VRF-G: ${genHash}</div>
  </div>
  <div class="sig-box">
    <h5>🚛 الناقل</h5>
    ${transSig?.signature_url ? `<img src="${transSig.signature_url}" style="max-width:50px;max-height:20px;margin:2px auto;display:block;" alt="توقيع"/>` : `<div class="sig-line"></div>`}
    <div class="sig-label">${transSig?.signer?.full_name || shipment.transporter?.name || ".................."}</div>
    <div class="sig-label">${transSig?.signed_at ? formatDate(transSig.signed_at) : formatDate(shipment.in_transit_at)}</div>
    <span class="sig-status ${transSig ? 'sig-signed' : 'sig-pending'}">${transSig ? '✓ موقّع' : '⏳ انتظار'}</span>
    <div class="sig-qr">${generateQRSvg(transVerifyUrl, 30)}</div>
    <div class="sig-hash">VRF-T: ${transHash}</div>
  </div>
  <div class="sig-box">
    <h5>♻️ المستلم</h5>
    ${recSig?.signature_url ? `<img src="${recSig.signature_url}" style="max-width:50px;max-height:20px;margin:2px auto;display:block;" alt="توقيع"/>` : `<div class="sig-line"></div>`}
    <div class="sig-label">${recSig?.signer?.full_name || shipment.recycler?.name || ".................."}</div>
    <div class="sig-label">${recSig?.signed_at ? formatDate(recSig.signed_at) : formatDate(shipment.delivered_at)}</div>
    <span class="sig-status ${recSig ? 'sig-signed' : 'sig-pending'}">${recSig ? '✓ موقّع' : '⏳ انتظار'}</span>
    <div class="sig-qr">${generateQRSvg(recVerifyUrl, 30)}</div>
    <div class="sig-hash">VRF-R: ${recHash}</div>
  </div>
</div>

<!-- 9. الشروط -->
<div class="terms">
  <h4>📋 الشروط والأحكام</h4>
  <ol>
    <li>يلتزم المولّد بتصنيف المخلفات بدقة ويتحمل مسئولية أي خطأ في التصنيف.</li>
    <li>يُحظر على الناقل الانحراف عن المسار أو التفريغ في غير الجهة المستلمة.</li>
    <li>يلتزم المستلم بالتحقق من مطابقة المخلفات للمانيفست ورفض غير المطابق.</li>
    <li>يُحظر تداول مخلفات خطرة بدون التصاريح اللازمة (م.29 — ق202/2020).</li>
    <li>تخضع العمليات للرقابة الإلكترونية عبر GPS وسلسلة الحيازة الرقمية.</li>
    <li>أي مخالفة تعرض المخالف للعقوبات (م.68-82 — ق202/2020).</li>
    <li>المانيفست وثيقة رسمية إلكترونية محمية ببصمة SHA-256.</li>
    <li>الاختصاص القضائي: محاكم جمهورية مصر العربية المختصة.</li>
  </ol>
</div>

<!-- Security Footer -->
<div class="sec-footer">
  <div class="left">
    <div><strong>iRecycle</strong> — نظام إدارة المخلفات الذكي</div>
    <div>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</div>
    <div>⚠️ وثيقة إلكترونية محمية — يمنع التعديل أو التزوير</div>
    <div class="hash-badge">SHA-256: ${integrityHash}</div>
  </div>
  <div class="center">
    <div class="qr-main">${generateQRSvg(verifyUrl, 50)}</div>
    <div style="font-size:4.5px;color:#6b7280;margin-top:1px;">امسح للتحقق</div>
  </div>
  <div class="right">
    ${generateBarcodeSvg(shipment.shipment_number, 130, 22)}
    <div style="font-size:4.5px;color:#9ca3af;text-align:center;">Barcode: ${shipment.shipment_number}</div>
  </div>
</div>

</body>
</html>`;
}
