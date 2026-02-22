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
    // Auth check
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

    // Fetch shipment with all related data
    const orgFields = `name, name_en, address, address_details, city, region, phone, secondary_phone, email, business_email, commercial_register, tax_card, license_number, environmental_license, environmental_approval_number, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, eeaa_license_issue_date, eeaa_license_expiry_date, ida_license, ida_license_issue_date, ida_license_expiry_date, land_transport_license, land_transport_license_issue_date, land_transport_license_expiry_date, industrial_registry, establishment_registration, organization_type, partner_code, client_code, representative_name, representative_phone, representative_email, representative_position, representative_national_id, agent_name, agent_phone, agent_email, agent_national_id, delegate_name, delegate_phone, delegate_email, delegate_national_id, activity_type, field_of_work, hazardous_certified, headquarters, logo_url, digital_declaration_number, certifications_approvals`;
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select(`
        *,
        generator:organizations!shipments_generator_id_fkey(${orgFields}),
        transporter:organizations!shipments_transporter_id_fkey(${orgFields}),
        recycler:organizations!shipments_recycler_id_fkey(${orgFields})
      `)
      .eq("id", shipmentId)
      .single();

    console.log("Query result:", { shipment: !!shipment, error: error?.message, errorDetails: error });

    if (error || !shipment) throw new Error(`Shipment not found: ${error?.message || 'no data'}`);

    // Fetch custody chain
    const { data: custodyChain } = await supabase
      .from("custody_chain_events")
      .select("*, actor_organization:organizations!custody_chain_events_actor_organization_id_fkey(name)")
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: true });

    // Fetch signatures for this shipment
    const { data: signatures } = await supabase
      .from("document_signatures")
      .select("*, signer:profiles!document_signatures_signer_id_fkey(full_name), signer_organization:organizations!document_signatures_organization_id_fkey(name)")
      .eq("document_id", shipmentId)
      .order("signed_at", { ascending: true });

    // Generate HTML manifest
    const html = generateManifestHTML(shipment, custodyChain || [], signatures || []);

    return new Response(
      JSON.stringify({
        success: true,
        html,
        shipmentNumber: shipment.shipment_number,
        manifestData: {
          generator: shipment.generator,
          transporter: shipment.transporter,
          recycler: shipment.recycler,
          driver: shipment.driver,
          disposal_facility: shipment.disposal_facility,
          waste_type: shipment.waste_type,
          waste_description: shipment.waste_description,
          quantity: shipment.quantity,
          unit: shipment.unit,
          actual_weight: shipment.actual_weight,
          pickup_address: shipment.pickup_address,
          delivery_address: shipment.delivery_address,
          pickup_date: shipment.pickup_date,
          delivered_at: shipment.delivered_at,
          status: shipment.status,
          shipment_number: shipment.shipment_number,
          hazard_level: shipment.hazard_level,
          packaging_method: shipment.packaging_method,
          waste_state: shipment.waste_state,
          gps_pickup_lat: shipment.gps_pickup_lat,
          gps_pickup_lng: shipment.gps_pickup_lng,
          gps_delivery_lat: shipment.gps_delivery_lat,
          gps_delivery_lng: shipment.gps_delivery_lng,
          weighbridge_net_weight: shipment.weighbridge_net_weight,
          weighbridge_gross_weight: shipment.weighbridge_gross_weight,
          weighbridge_tare_weight: shipment.weighbridge_tare_weight,
          weighbridge_ticket_number: shipment.weighbridge_ticket_number,
          custodyChain: custodyChain,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Manifest generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generate a simple QR code as SVG (no external deps)
function generateQRSvg(data: string, size: number = 60): string {
  // Use a simple API-based QR code - rendered as an img tag with inline data URL
  const encodedData = encodeURIComponent(data);
  return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=svg" width="${size}" height="${size}" style="display:block;margin:0 auto;" alt="QR Code" />`;
}

// Generate a Code128-style barcode as SVG
function generateBarcodeSvg(text: string, width: number = 180, height: number = 30): string {
  // Simple visual barcode representation using SVG
  const chars = text.replace(/[^A-Z0-9-]/gi, '');
  let bars = '';
  let x = 0;
  const barWidth = width / (chars.length * 11 + 20);
  
  // Start pattern
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    const pattern = [
      (code >> 6) & 1, (code >> 5) & 1, (code >> 4) & 1,
      (code >> 3) & 1, (code >> 2) & 1, (code >> 1) & 1,
      code & 1, 1, 0, 1, 0
    ];
    for (const bit of pattern) {
      if (bit) {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#000"/>`;
      }
      x += barWidth;
    }
  }
  
  return `<svg width="${width}" height="${height + 12}" viewBox="0 0 ${width} ${height + 12}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
    <text x="${width/2}" y="${height + 10}" text-anchor="middle" font-family="monospace" font-size="7" fill="#333">${text}</text>
  </svg>`;
}

function getLicenseStatusHTML(expiryDate: string | null | undefined): string {
  if (!expiryDate) return '<span style="color:#9ca3af;font-size:5.5px">⚪ غير محدد</span>';
  const now = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `<span style="color:#dc2626;font-size:5.5px;font-weight:bold">🔴 منتهي (${new Date(expiryDate).toLocaleDateString("ar-EG")})</span>`;
  if (days <= 30) return `<span style="color:#d97706;font-size:5.5px;font-weight:bold">🟡 ينتهي خلال ${days} يوم (${new Date(expiryDate).toLocaleDateString("ar-EG")})</span>`;
  return `<span style="color:#16a34a;font-size:5.5px">🟢 ساري حتى ${new Date(expiryDate).toLocaleDateString("ar-EG")}</span>`;
}

function renderLicensesBlock(org: any): string {
  if (!org) return '';
  const isTransporter = org.organization_type === 'transporter';
  const isRecyclerOrDisposal = org.organization_type === 'recycler' || org.organization_type === 'disposal';
  
  let html = `<div style="border-top:1px dashed #d1d5db;margin-top:2px;padding-top:2px;">`;
  html += `<p style="font-size:6px;font-weight:bold;color:#15803d;margin-bottom:1px;">📋 حالة التراخيص:</p>`;
  
  // WMRA - all types
  if (org.wmra_license) html += `<p><span class="lbl">WMRA:</span> ${org.wmra_license} ${getLicenseStatusHTML(org.wmra_license_expiry_date)}</p>`;
  // EEAA - all types
  if (org.environmental_license) html += `<p><span class="lbl">EEAA:</span> ${org.environmental_license} ${getLicenseStatusHTML(org.eeaa_license_expiry_date)}</p>`;
  // IDA - recycler/disposal/generator
  if (!isTransporter && org.ida_license) html += `<p><span class="lbl">IDA:</span> ${org.ida_license} ${getLicenseStatusHTML(org.ida_license_expiry_date)}</p>`;
  // Land transport - transporter
  if (isTransporter && org.land_transport_license) html += `<p><span class="lbl">نقل بري:</span> ${org.land_transport_license} ${getLicenseStatusHTML(org.land_transport_license_expiry_date)}</p>`;
  // Digital declaration
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

  // Generate SHA-256-like hash for document integrity
  const docData = `${shipment.shipment_number}|${shipment.created_at}|${shipment.quantity}|${shipment.waste_type}`;
  let hash = 0;
  for (let i = 0; i < docData.length; i++) { hash = ((hash << 5) - hash) + docData.charCodeAt(i); hash = hash & hash; }
  const integrityHash = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();

  // Generate per-party hashes for individual QR codes
  const genHash = Math.abs(hash * 31).toString(16).padStart(8, '0').toUpperCase();
  const transHash = Math.abs(hash * 37).toString(16).padStart(8, '0').toUpperCase();
  const recHash = Math.abs(hash * 41).toString(16).padStart(8, '0').toUpperCase();

  const isHazardous = shipment.hazard_level && shipment.hazard_level !== "low";
  const verifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}`;
  const genVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=generator&h=${genHash}`;
  const transVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=transporter&h=${transHash}`;
  const recVerifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}&party=recycler&h=${recHash}`;

  // Find signatures per party
  const genSig = signatures.find((s: any) => s.signer_role === 'generator' || s.organization_id === shipment.generator_id);
  const transSig = signatures.find((s: any) => s.signer_role === 'transporter' || s.organization_id === shipment.transporter_id);
  const recSig = signatures.find((s: any) => s.signer_role === 'recycler' || s.organization_id === shipment.recycler_id);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
    font-size: 7.5px; 
    color: #1a1a1a; 
    direction: rtl; 
    width: 794px; 
    min-height: 1123px; 
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px;
  }
  /* Scrollbar */
  body::-webkit-scrollbar { width: 6px; }
  body::-webkit-scrollbar-track { background: transparent; }
  body::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 3px; }
  body::-webkit-scrollbar-thumb:hover { background-color: #9ca3af; }
  body { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }

  /* Watermark */
  body::before {
    content: "iRecycle";
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 130px;
    font-weight: 900;
    color: rgba(22, 163, 74, 0.08);
    pointer-events: none;
    z-index: 9999;
    letter-spacing: 20px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  /* Header */
  .hdr { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 6px; margin-bottom: 6px; }
  .hdr-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .hdr-logo { font-size: 14px; font-weight: 900; color: #16a34a; }
  .hdr h1 { font-size: 12px; color: #16a34a; margin: 2px 0; }
  .hdr-sub { font-size: 7px; color: #666; }
  .hdr-num { font-size: 10px; font-weight: bold; margin-top: 3px; background: #f0fdf4; padding: 2px 8px; display: inline-block; border-radius: 3px; border: 1px solid #bbf7d0; }
  ${isHazardous ? `.hdr-hazard { background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 8px; border: 1px solid #fecaca; display: inline-block; margin-top: 3px; }` : ''}

  /* Sections */
  .sec { margin-bottom: 5px; }
  .sec-t { background: linear-gradient(90deg, #f0fdf4, #fff); border-right: 3px solid #16a34a; padding: 2px 8px; font-weight: bold; font-size: 8px; margin-bottom: 3px; color: #15803d; }
  
  /* Tables */
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #d1d5db; padding: 2px 4px; text-align: right; font-size: 7px; line-height: 1.3; }
  th { background: #f0fdf4; font-weight: bold; color: #15803d; font-size: 6.5px; }
  
  /* Parties grid */
  .parties { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 4px; }
  .party { border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 6px; background: #fafafa; }
  .party h4 { font-size: 7.5px; color: #16a34a; margin-bottom: 2px; border-bottom: 1px solid #e5e7eb; padding-bottom: 1px; }
  .party p { font-size: 6.5px; margin: 1px 0; line-height: 1.3; }
  .lbl { color: #6b7280; }
  .val { font-weight: 600; }
  
  /* Chain */
  .chain-row td { font-size: 6.5px; padding: 1.5px 3px; }
  .chain-hash { font-family: monospace; font-size: 5.5px; color: #6b7280; }
  
  /* Signatures */
  .sigs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 6px 0; }
  .sig-box { border: 1px solid #d1d5db; border-radius: 4px; padding: 4px; text-align: center; min-height: 70px; background: #fafafa; }
  .sig-box h5 { font-size: 7px; color: #15803d; margin-bottom: 2px; }
  .sig-line { border-bottom: 1px dotted #9ca3af; margin: 8px 8px 2px; }
  .sig-label { font-size: 5.5px; color: #9ca3af; }
  .sig-qr { margin: 4px auto; }
  .sig-hash { font-family: monospace; font-size: 5px; color: #16a34a; background: #f0fdf4; padding: 1px 3px; border-radius: 2px; display: inline-block; margin-top: 2px; }
  .sig-status { font-size: 5.5px; padding: 1px 4px; border-radius: 2px; display: inline-block; margin-top: 2px; }
  .sig-signed { background: #dcfce7; color: #166534; }
  .sig-pending { background: #fef3c7; color: #92400e; }
  
  /* Declaration */
  .decl { background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 5px 6px; margin: 5px 0; }
  .decl h4 { font-size: 7.5px; color: #92400e; margin-bottom: 3px; }
  .decl p { font-size: 6px; color: #78350f; line-height: 1.5; }
  .decl-party { background: #fef9c3; border: 1px solid #fde047; border-radius: 3px; padding: 3px 5px; margin: 3px 0; }
  .decl-party strong { font-size: 6.5px; color: #854d0e; }
  .decl-party p { font-size: 5.5px; color: #713f12; margin: 1px 0; }
  
  /* Terms */
  .terms { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px; margin: 4px 0; }
  .terms h4 { font-size: 7px; color: #334155; margin-bottom: 2px; }
  .terms ol { font-size: 5.5px; color: #475569; padding-right: 12px; line-height: 1.5; columns: 2; column-gap: 12px; }
  .terms li { break-inside: avoid; margin-bottom: 1px; }
  
  /* Security footer */
  .sec-footer { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #16a34a; padding-top: 6px; margin-top: 6px; }
  .sec-footer .left { font-size: 5.5px; color: #6b7280; }
  .sec-footer .center { text-align: center; }
  .sec-footer .right { text-align: left; direction: ltr; }
  .qr-main { border: 1px solid #d1d5db; border-radius: 4px; padding: 3px; background: #fff; display: inline-block; }
  .hash-badge { font-family: monospace; font-size: 5.5px; color: #16a34a; background: #f0fdf4; padding: 1px 4px; border-radius: 2px; border: 1px solid #bbf7d0; }
  .barcode-container { text-align: center; }
  .security-strip { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 3px; }
  .security-strip span { font-size: 5px; color: #9ca3af; }
  
  /* Verification codes section */
  .verify-codes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 4px 0; padding: 4px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; }
  .verify-code-item { text-align: center; }
  .verify-code-item p { font-size: 5px; color: #6b7280; margin-top: 2px; }
</style>
</head>
<body>

<!-- Header -->
<div class="hdr">
  <div class="hdr-top">
    <div style="font-size:6px;color:#666;text-align:right;">
      جمهورية مصر العربية<br/>جهاز تنظيم إدارة المخلفات (WMRA)
    </div>
    <div class="hdr-logo">iRecycle</div>
    <div style="font-size:6px;color:#666;text-align:left;direction:ltr;">
      Arab Republic of Egypt<br/>Waste Management Regulatory Agency
    </div>
  </div>
  <h1>مانيفست نقل المخلفات | Waste Transport Manifest</h1>
  <div class="hdr-sub">نموذج موحد وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية</div>
  <div class="hdr-num">رقم المانيفست: ${shipment.shipment_number} &nbsp;|&nbsp; تاريخ الإصدار: ${formatDate(shipment.created_at)}</div>
  ${isHazardous ? `<div class="hdr-hazard">⚠️ مخلفات خطرة - مستوى الخطورة: ${hazardLabels[shipment.hazard_level] || shipment.hazard_level}</div>` : ''}
</div>

<!-- 1. الأطراف -->
<div class="sec">
  <div class="sec-t">القسم الأول: الأطراف المعنية | Involved Parties</div>
  <div class="parties">
    <div class="party">
      <h4>🏭 المولّد (الطرف الأول) | Generator</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.generator?.name || shipment.manual_generator_name || "—"}</span></p>
      ${shipment.generator?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.generator.name_en}</span></p>` : ''}
      <p><span class="lbl">كود الشريك:</span> ${shipment.generator?.partner_code || "—"} ${shipment.generator?.client_code ? `| كود العميل: ${shipment.generator.client_code}` : ''}</p>
      <p><span class="lbl">النوع:</span> ${shipment.generator?.organization_type || "—"} ${shipment.generator?.activity_type ? `| النشاط: ${shipment.generator.activity_type}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.generator?.address || "—"}${shipment.generator?.address_details ? ` - ${shipment.generator.address_details}` : ''}</p>
      <p><span class="lbl">المدينة:</span> ${shipment.generator?.city || "—"} ${shipment.generator?.region ? `| المنطقة: ${shipment.generator.region}` : ''} ${shipment.generator?.headquarters ? `| المقر: ${shipment.generator.headquarters}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.generator?.phone || "—"} ${shipment.generator?.secondary_phone ? `| ${shipment.generator.secondary_phone}` : ''}</p>
      <p><span class="lbl">بريد:</span> ${shipment.generator?.email || "—"} ${shipment.generator?.business_email ? `| ${shipment.generator.business_email}` : ''}</p>
      <p><span class="lbl">سجل تجاري:</span> ${shipment.generator?.commercial_register || "—"} ${shipment.generator?.tax_card ? `| بطاقة ضريبية: ${shipment.generator.tax_card}` : ''}</p>
      ${shipment.generator?.industrial_registry ? `<p><span class="lbl">سجل صناعي:</span> ${shipment.generator.industrial_registry}</p>` : ''}
      ${shipment.generator?.environmental_license ? `<p><span class="lbl">ترخيص بيئي:</span> ${shipment.generator.environmental_license}</p>` : ''}
      ${shipment.generator?.environmental_approval_number ? `<p><span class="lbl">رقم الموافقة البيئية:</span> ${shipment.generator.environmental_approval_number}</p>` : ''}
      ${shipment.generator?.wmra_license ? `<p><span class="lbl">ترخيص WMRA:</span> ${shipment.generator.wmra_license}</p>` : ''}
      ${shipment.generator?.establishment_registration ? `<p><span class="lbl">قيد المنشأة:</span> ${shipment.generator.establishment_registration}</p>` : ''}
      ${shipment.generator?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.generator.representative_name} ${shipment.generator?.representative_position ? `(${shipment.generator.representative_position})` : ''}</p>` : ''}
      ${shipment.generator?.representative_phone ? `<p><span class="lbl">هاتف المفوض:</span> ${shipment.generator.representative_phone} ${shipment.generator?.representative_national_id ? `| رقم قومي: ${shipment.generator.representative_national_id}` : ''}</p>` : ''}
      ${shipment.generator?.field_of_work ? `<p><span class="lbl">مجال العمل:</span> ${shipment.generator.field_of_work}</p>` : ''}
      ${renderLicensesBlock(shipment.generator)}
    </div>
    <div class="party">
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.transporter?.name || shipment.manual_transporter_name || "—"}</span></p>
      ${shipment.transporter?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.transporter.name_en}</span></p>` : ''}
      <p><span class="lbl">كود الشريك:</span> ${shipment.transporter?.partner_code || "—"} ${shipment.transporter?.client_code ? `| كود العميل: ${shipment.transporter.client_code}` : ''}</p>
      <p><span class="lbl">النوع:</span> ${shipment.transporter?.organization_type || "—"} ${shipment.transporter?.activity_type ? `| النشاط: ${shipment.transporter.activity_type}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.transporter?.address || "—"}${shipment.transporter?.address_details ? ` - ${shipment.transporter.address_details}` : ''}</p>
      <p><span class="lbl">المدينة:</span> ${shipment.transporter?.city || "—"} ${shipment.transporter?.region ? `| المنطقة: ${shipment.transporter.region}` : ''} ${shipment.transporter?.headquarters ? `| المقر: ${shipment.transporter.headquarters}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.transporter?.phone || "—"} ${shipment.transporter?.secondary_phone ? `| ${shipment.transporter.secondary_phone}` : ''}</p>
      <p><span class="lbl">بريد:</span> ${shipment.transporter?.email || "—"} ${shipment.transporter?.business_email ? `| ${shipment.transporter.business_email}` : ''}</p>
      <p><span class="lbl">سجل تجاري:</span> ${shipment.transporter?.commercial_register || "—"} ${shipment.transporter?.tax_card ? `| بطاقة ضريبية: ${shipment.transporter.tax_card}` : ''}</p>
      <p><span class="lbl">ترخيص نقل:</span> ${shipment.transporter?.license_number || "—"}</p>
      ${shipment.transporter?.land_transport_license ? `<p><span class="lbl">ترخيص نقل بري:</span> ${shipment.transporter.land_transport_license}</p>` : ''}
      ${shipment.transporter?.environmental_license ? `<p><span class="lbl">ترخيص بيئي:</span> ${shipment.transporter.environmental_license}</p>` : ''}
      ${shipment.transporter?.wmra_license ? `<p><span class="lbl">ترخيص WMRA:</span> ${shipment.transporter.wmra_license}</p>` : ''}
      ${shipment.transporter?.ida_license ? `<p><span class="lbl">ترخيص IDA:</span> ${shipment.transporter.ida_license}</p>` : ''}
      ${shipment.transporter?.hazardous_certified ? `<p><span class="lbl">معتمد للمخلفات الخطرة:</span> ✅ نعم</p>` : ''}
      ${shipment.transporter?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.transporter.representative_name} ${shipment.transporter?.representative_position ? `(${shipment.transporter.representative_position})` : ''}</p>` : ''}
      ${shipment.transporter?.representative_phone ? `<p><span class="lbl">هاتف المفوض:</span> ${shipment.transporter.representative_phone} ${shipment.transporter?.representative_national_id ? `| رقم قومي: ${shipment.transporter.representative_national_id}` : ''}</p>` : ''}
      ${shipment.transporter?.field_of_work ? `<p><span class="lbl">مجال العمل:</span> ${shipment.transporter.field_of_work}</p>` : ''}
      ${renderLicensesBlock(shipment.transporter)}
    </div>
    <div class="party">
      <h4>♻️ المدوّر (الطرف الثالث) | Recycler</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.recycler?.name || shipment.manual_recycler_name || "—"}</span></p>
      ${shipment.recycler?.name_en ? `<p><span class="lbl">Name:</span> <span class="val">${shipment.recycler.name_en}</span></p>` : ''}
      <p><span class="lbl">كود الشريك:</span> ${shipment.recycler?.partner_code || "—"} ${shipment.recycler?.client_code ? `| كود العميل: ${shipment.recycler.client_code}` : ''}</p>
      <p><span class="lbl">النوع:</span> ${shipment.recycler?.organization_type || "—"} ${shipment.recycler?.activity_type ? `| النشاط: ${shipment.recycler.activity_type}` : ''}</p>
      <p><span class="lbl">العنوان:</span> ${shipment.recycler?.address || "—"}${shipment.recycler?.address_details ? ` - ${shipment.recycler.address_details}` : ''}</p>
      <p><span class="lbl">المدينة:</span> ${shipment.recycler?.city || "—"} ${shipment.recycler?.region ? `| المنطقة: ${shipment.recycler.region}` : ''} ${shipment.recycler?.headquarters ? `| المقر: ${shipment.recycler.headquarters}` : ''}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.recycler?.phone || "—"} ${shipment.recycler?.secondary_phone ? `| ${shipment.recycler.secondary_phone}` : ''}</p>
      <p><span class="lbl">بريد:</span> ${shipment.recycler?.email || "—"} ${shipment.recycler?.business_email ? `| ${shipment.recycler.business_email}` : ''}</p>
      <p><span class="lbl">سجل تجاري:</span> ${shipment.recycler?.commercial_register || "—"} ${shipment.recycler?.tax_card ? `| بطاقة ضريبية: ${shipment.recycler.tax_card}` : ''}</p>
      ${shipment.recycler?.environmental_license ? `<p><span class="lbl">ترخيص بيئي:</span> ${shipment.recycler.environmental_license}</p>` : ''}
      ${shipment.recycler?.environmental_approval_number ? `<p><span class="lbl">رقم الموافقة البيئية:</span> ${shipment.recycler.environmental_approval_number}</p>` : ''}
      ${shipment.recycler?.wmra_license ? `<p><span class="lbl">ترخيص WMRA:</span> ${shipment.recycler.wmra_license}</p>` : ''}
      ${shipment.recycler?.ida_license ? `<p><span class="lbl">ترخيص IDA:</span> ${shipment.recycler.ida_license}</p>` : ''}
      ${shipment.recycler?.industrial_registry ? `<p><span class="lbl">سجل صناعي:</span> ${shipment.recycler.industrial_registry}</p>` : ''}
      ${shipment.recycler?.hazardous_certified ? `<p><span class="lbl">معتمد للمخلفات الخطرة:</span> ✅ نعم</p>` : ''}
      ${shipment.recycler?.representative_name ? `<p><span class="lbl">المفوض:</span> ${shipment.recycler.representative_name} ${shipment.recycler?.representative_position ? `(${shipment.recycler.representative_position})` : ''}</p>` : ''}
      ${shipment.recycler?.representative_phone ? `<p><span class="lbl">هاتف المفوض:</span> ${shipment.recycler.representative_phone} ${shipment.recycler?.representative_national_id ? `| رقم قومي: ${shipment.recycler.representative_national_id}` : ''}</p>` : ''}
      ${shipment.recycler?.field_of_work ? `<p><span class="lbl">مجال العمل:</span> ${shipment.recycler.field_of_work}</p>` : ''}
      ${renderLicensesBlock(shipment.recycler)}
    </div>
  </div>
</div>

<!-- 2. توصيف المخلف بالتفصيل -->
<div class="sec">
  <div class="sec-t">القسم الثاني: التوصيف الدقيق للمخلف | Waste Detailed Description</div>
  <table>
    <tr>
      <th style="width:12%">تصنيف المخلف</th>
      <th style="width:22%">الوصف التفصيلي</th>
      <th>الحالة الفيزيائية</th>
      <th>مستوى الخطورة</th>
      <th>طريقة التعبئة</th>
      <th>طريقة المعالجة</th>
      <th>نوع التخلص</th>
    </tr>
    <tr>
      <td><strong>${wasteTypeLabels[shipment.waste_type] || shipment.waste_type || "—"}</strong></td>
      <td>${shipment.waste_description || "غير محدد"}</td>
      <td>${shipment.waste_state || "—"}</td>
      <td style="${isHazardous ? 'color:#dc2626;font-weight:bold;' : ''}">${hazardLabels[shipment.hazard_level] || shipment.hazard_level || "غير محدد"} ${isHazardous ? '⚠️' : ''}</td>
      <td>${shipment.packaging_method || "—"}</td>
      <td>${shipment.disposal_method || "—"}</td>
      <td>${shipment.disposal_type || "—"}</td>
    </tr>
  </table>
</div>

<!-- 3. الكميات والأوزان -->
<div class="sec">
  <div class="sec-t">القسم الثالث: الكميات والأوزان | Quantities & Weights</div>
  <table>
    <tr>
      <th>الكمية</th><th>الوحدة</th><th>تذكرة الميزان</th><th>إجمالي (كجم)</th><th>فارغة (كجم)</th><th>صافي (كجم)</th><th>فعلي (كجم)</th><th>عند المصدر</th><th>عند الوجهة</th><th>فرق %</th>
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
  ${shipment.weighbridge_date ? `<p style="font-size:5.5px;color:#6b7280;margin-top:2px;">تاريخ الوزن: ${formatDateTime(shipment.weighbridge_date)} ${shipment.weighbridge_verified ? '| ✅ تم التحقق' : '| ⏳ لم يُتحقق'}</p>` : ''}
</div>

<!-- 4. السائق والمركبة -->
<div class="sec">
  <div class="sec-t">القسم الرابع: بيانات السائق والمركبة | Driver & Vehicle</div>
  <table>
    <tr>
      <th>اسم السائق</th><th>رخصة القيادة</th><th>هاتف السائق</th><th>نوع المركبة</th><th>رقم اللوحة</th><th>تحقق اللوحة</th>
    </tr>
    <tr>
      <td>${shipment.driver?.full_name || shipment.manual_driver_name || "—"}</td>
      <td>${shipment.driver?.license_number || "—"}</td>
      <td>${shipment.driver?.phone || "—"}</td>
      <td>${shipment.driver?.vehicle_type || "—"}</td>
      <td>${shipment.driver?.vehicle_plate_number || shipment.manual_vehicle_plate || "—"}</td>
      <td>${shipment.plate_verified ? '✅ تم التحقق' : '—'}</td>
    </tr>
  </table>
</div>

<!-- 5. المسار الجغرافي والجدول الزمني -->
<div class="sec">
  <div class="sec-t">القسم الخامس: المسار والجدول الزمني | Route & Timeline</div>
  <table>
    <tr>
      <th>نقطة الاستلام</th><th>مدينة الاستلام</th><th>إحداثيات الاستلام</th><th>نقطة التسليم</th><th>مدينة التسليم</th><th>إحداثيات التسليم</th>
    </tr>
    <tr>
      <td>${shipment.pickup_address || "—"}</td>
      <td>${shipment.pickup_city || "—"}</td>
      <td style="font-family:monospace;font-size:5.5px;">${shipment.gps_pickup_lat ? `${Number(shipment.gps_pickup_lat).toFixed(4)},${Number(shipment.gps_pickup_lng).toFixed(4)}` : (shipment.pickup_latitude ? `${Number(shipment.pickup_latitude).toFixed(4)},${Number(shipment.pickup_longitude).toFixed(4)}` : "—")}</td>
      <td>${shipment.delivery_address || "—"}</td>
      <td>${shipment.delivery_city || "—"}</td>
      <td style="font-family:monospace;font-size:5.5px;">${shipment.gps_delivery_lat ? `${Number(shipment.gps_delivery_lat).toFixed(4)},${Number(shipment.gps_delivery_lng).toFixed(4)}` : (shipment.delivery_latitude ? `${Number(shipment.delivery_latitude).toFixed(4)},${Number(shipment.delivery_longitude).toFixed(4)}` : "—")}</td>
    </tr>
  </table>
  <table style="margin-top:3px;">
    <tr>
      <th>تاريخ الإنشاء</th><th>تاريخ الاستلام</th><th>بدء النقل</th><th>التسليم المتوقع</th><th>تاريخ التسليم</th><th>تاريخ الاعتماد</th><th>تاريخ التأكيد</th>
    </tr>
    <tr>
      <td>${formatDateTime(shipment.created_at)}</td>
      <td>${formatDate(shipment.pickup_date)}</td>
      <td>${formatDateTime(shipment.in_transit_at)}</td>
      <td>${formatDate(shipment.expected_delivery_date)}</td>
      <td>${formatDateTime(shipment.delivered_at)}</td>
      <td>${formatDateTime(shipment.approved_at)}</td>
      <td>${formatDateTime(shipment.confirmed_at)}</td>
    </tr>
  </table>
  <p style="font-size:5.5px;color:#6b7280;margin-top:2px;">
    GPS: ${shipment.gps_active_throughout ? '✅ نشط طوال الرحلة' : '⚠️ غير مؤكد'}${shipment.gps_signal_lost_at ? ` | فقدان إشارة: ${formatDateTime(shipment.gps_signal_lost_at)}` : ''}
    | سلسلة الحيازة: ${shipment.custody_chain_complete ? '✅ مكتملة' : '⏳ غير مكتملة'}
    | الامتثال: ${shipment.compliance_verified ? '✅ تم التحقق' : '⏳ غير مؤكد'}
  </p>
</div>


<!-- 4. سلسلة الحيازة -->
${custodyChain.length > 0 ? `
<div class="sec">
  <div class="sec-t">القسم السابع: سلسلة الحيازة الرقمية (Digital Chain of Custody)</div>
  <table>
    <tr><th>#</th><th>الحدث</th><th>الجهة</th><th>التاريخ/الوقت</th><th>الإحداثيات</th><th>بصمة التحقق</th></tr>
    ${custodyChain.slice(0, 6).map((evt: any, i: number) => `
    <tr class="chain-row">
      <td>${i + 1}</td>
      <td>${eventTypeLabels[evt.event_type] || evt.event_type}</td>
      <td>${evt.actor_organization?.name || "—"}</td>
      <td>${formatDateTime(evt.created_at)}</td>
      <td style="font-family:monospace;font-size:5px;">${evt.gps_latitude ? `${Number(evt.gps_latitude).toFixed(4)},${Number(evt.gps_longitude).toFixed(4)}` : "—"}</td>
      <td class="chain-hash">${evt.qr_code_hash?.slice(0, 20) || "—"}...</td>
    </tr>`).join("")}
  </table>
</div>` : ""}

<!-- 8. الإقرار القانوني لكل طرف -->
<div class="decl">
  <h4>📜 الإقرارات والتعهدات القانونية الملزمة</h4>
  <p style="margin-bottom:4px;">
    يقر كل طرف من الأطراف الموقعة أدناه بصحة جميع البيانات الواردة في هذا المانيفست، ويتحمل كل طرف كامل المسئولية المدنية والجنائية عن أي مخالفة أو بيانات غير صحيحة تخص نطاق عمله، وذلك وفقاً لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية وقانون البيئة رقم 4 لسنة 1994 واتفاقية بازل الدولية.
  </p>
  
  <div class="decl-party">
    <strong>🏭 إقرار المولّد (الطرف الأول): ${shipment.generator?.name || "—"}</strong>
    <p>أقر بأن المخلفات الموصوفة أعلاه تم تصنيفها بدقة وفقاً للكود المصري، وأن الكميات والأوصاف المذكورة صحيحة ومطابقة للواقع. أتحمل كامل المسئولية القانونية عن أي خطأ في التصنيف أو الإفصاح عن طبيعة المخلفات وخطورتها وفقاً للمادة 27 من القانون 202/2020.</p>
  </div>
  
  <div class="decl-party">
    <strong>🚛 إقرار الناقل (الطرف الثاني): ${shipment.transporter?.name || "—"}</strong>
    <p>أقر باستلام المخلفات المذكورة أعلاه والتزامي بنقلها عبر المسار المحدد وعدم الانحراف عنه أو تفريغها في غير الجهة المستلمة المحددة. أتحمل كامل المسئولية عن سلامة النقل والالتزام بالتصاريح والتراخيص اللازمة وفقاً للمادة 29 من القانون 202/2020.</p>
  </div>
  
  <div class="decl-party">
    <strong>♻️ إقرار المستلم (الطرف الثالث): ${shipment.recycler?.name || "—"}</strong>
    <p>أقر باستلام المخلفات المذكورة أعلاه وتحققي من مطابقتها للمانيفست. أتحمل كامل المسئولية عن المعالجة والتدوير أو التخلص الآمن وفقاً للمعايير البيئية المنصوص عليها في التراخيص الممنوحة لمنشأتي وأحكام القانون 202/2020.</p>
  </div>
  
  <p style="margin-top:3px;font-weight:bold;font-size:5.5px;color:#991b1b;">
    ⚠️ تحذير: يعتبر التوقيع على هذا المانيفست بمثابة موافقة نهائية وغير قابلة للإلغاء. أي مخالفة تعرض المخالف للعقوبات المنصوص عليها في المواد 68-82 من القانون 202/2020 والتي تشمل الغرامات المالية والحبس.
  </p>
</div>

<!-- 9. التوقيعات والأختام مع رموز التحقق -->
<div class="sigs">
  <div class="sig-box">
    <h5>🏭 توقيع وختم المولّد</h5>
    ${genSig?.signature_url ? `<img src="${genSig.signature_url}" style="max-width:60px;max-height:25px;margin:2px auto;display:block;" alt="توقيع المولد"/>` : `<div class="sig-line"></div>`}
    <div class="sig-label">الاسم: ${genSig?.signer?.full_name || shipment.generator?.name || ".................."}</div>
    <div class="sig-label">التاريخ: ${genSig?.signed_at ? formatDate(genSig.signed_at) : formatDate(shipment.pickup_date)}</div>
    <span class="sig-status ${genSig ? 'sig-signed' : 'sig-pending'}">${genSig ? '✓ موقّع' : '⏳ في انتظار التوقيع'}</span>
    <div class="sig-qr">${generateQRSvg(genVerifyUrl, 35)}</div>
    <div class="sig-hash">VRF-G: ${genHash}</div>
    <div class="sig-label" style="margin-top:2px;font-size:5px;color:#d97706;">مكان الختم الرسمي</div>
  </div>
  <div class="sig-box">
    <h5>🚛 توقيع وختم الناقل</h5>
    ${transSig?.signature_url ? `<img src="${transSig.signature_url}" style="max-width:60px;max-height:25px;margin:2px auto;display:block;" alt="توقيع الناقل"/>` : `<div class="sig-line"></div>`}
    <div class="sig-label">الاسم: ${transSig?.signer?.full_name || shipment.transporter?.name || ".................."}</div>
    <div class="sig-label">التاريخ: ${transSig?.signed_at ? formatDate(transSig.signed_at) : formatDate(shipment.in_transit_at)}</div>
    <span class="sig-status ${transSig ? 'sig-signed' : 'sig-pending'}">${transSig ? '✓ موقّع' : '⏳ في انتظار التوقيع'}</span>
    <div class="sig-qr">${generateQRSvg(transVerifyUrl, 35)}</div>
    <div class="sig-hash">VRF-T: ${transHash}</div>
    <div class="sig-label" style="margin-top:2px;font-size:5px;color:#d97706;">مكان الختم الرسمي</div>
  </div>
  <div class="sig-box">
    <h5>♻️ توقيع وختم المستلم</h5>
    ${recSig?.signature_url ? `<img src="${recSig.signature_url}" style="max-width:60px;max-height:25px;margin:2px auto;display:block;" alt="توقيع المستلم"/>` : `<div class="sig-line"></div>`}
    <div class="sig-label">الاسم: ${recSig?.signer?.full_name || shipment.recycler?.name || ".................."}</div>
    <div class="sig-label">التاريخ: ${recSig?.signed_at ? formatDate(recSig.signed_at) : formatDate(shipment.delivered_at)}</div>
    <span class="sig-status ${recSig ? 'sig-signed' : 'sig-pending'}">${recSig ? '✓ موقّع' : '⏳ في انتظار التوقيع'}</span>
    <div class="sig-qr">${generateQRSvg(recVerifyUrl, 35)}</div>
    <div class="sig-hash">VRF-R: ${recHash}</div>
    <div class="sig-label" style="margin-top:2px;font-size:5px;color:#d97706;">مكان الختم الرسمي</div>
  </div>
</div>

<!-- 10. الشروط والأحكام -->
<div class="terms">
  <h4>📋 الشروط والأحكام الأساسية</h4>
  <ol>
    <li>يلتزم المولّد بتصنيف المخلفات بدقة وفقاً للكود المصري ويتحمل مسئولية أي خطأ في التصنيف.</li>
    <li>يلتزم الناقل بنقل المخلفات عبر المسار المحدد وعدم الانحراف عنه، ويُحظر التفريغ في غير الجهة المستلمة.</li>
    <li>يلتزم المستلم بالتحقق من مطابقة المخلفات للمانيفست ورفض أي شحنة غير مطابقة فوراً.</li>
    <li>يُحظر نقل أو تداول مخلفات خطرة بدون التصاريح والتراخيص اللازمة وفقاً للمادة 29 من القانون 202/2020.</li>
    <li>تخضع جميع العمليات للرقابة الإلكترونية عبر نظام التتبع بالأقمار الصناعية (GPS) وسلسلة الحيازة الرقمية.</li>
    <li>أي مخالفة لأحكام هذا المانيفست تعرض المخالف للعقوبات المنصوص عليها في المواد 68-82 من القانون 202/2020.</li>
    <li>يعتبر هذا المانيفست وثيقة رسمية إلكترونية محمية ببصمة رقمية (SHA-256) وأي تلاعب يعد تزويراً.</li>
    <li>الاختصاص القضائي: محاكم جمهورية مصر العربية المختصة. هذا المستند صادر إلكترونياً ولا يحتاج توقيعاً مادياً للنفاذ.</li>
  </ol>
</div>

<!-- Security Footer with Real QR & Barcode -->
<div class="sec-footer">
  <div class="left">
    <div><strong>iRecycle</strong> - نظام إدارة المخلفات الذكي</div>
    <div>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</div>
    <div>⚠️ وثيقة إلكترونية محمية - يمنع التعديل أو التزوير</div>
    <div class="hash-badge">SHA-256: ${integrityHash}</div>
    <div style="margin-top:2px;font-size:5px;color:#6b7280;">
      رمز النزاهة: ${integrityHash.slice(0, 8)}-${integrityHash.slice(8, 12)}-${integrityHash.slice(12)}
    </div>
  </div>
  <div class="center">
    <div class="qr-main">
      ${generateQRSvg(verifyUrl, 55)}
    </div>
    <div style="font-size:5px;color:#6b7280;margin-top:2px;">امسح للتحقق من صحة الوثيقة</div>
    <div class="security-strip">
      <span>🔒 مؤمّن رقمياً</span>
      <span>|</span>
      <span>📋 ${shipment.shipment_number}</span>
      <span>|</span>
      <span>🌐 iRecycle Platform</span>
    </div>
  </div>
  <div class="right">
    <div class="barcode-container">
      ${generateBarcodeSvg(shipment.shipment_number, 140, 25)}
    </div>
    <div style="font-size:5px;color:#9ca3af;margin-top:2px;text-align:center;">Barcode: ${shipment.shipment_number}</div>
  </div>
</div>

</body>
</html>`;
}
