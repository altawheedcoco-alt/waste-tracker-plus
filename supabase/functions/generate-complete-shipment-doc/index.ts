import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipmentId } = await req.json();
    if (!shipmentId) throw new Error("shipmentId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all data in parallel
    const [shipmentRes, logsRes, receiptsRes, endorsementsRes, custodyRes, declarationsRes] = await Promise.all([
      supabase.from("shipments").select(`
        *,
        generator:organizations!shipments_generator_id_fkey(name, address, city, commercial_register, tax_card, establishment_registration, registered_activity, environmental_approval_number, phone, email, logo_url, organization_type, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_license, eeaa_license_issue_date, eeaa_license_expiry_date, ida_license, ida_license_issue_date, ida_license_expiry_date, industrial_registry, license_number, digital_declaration_number, certifications_approvals),
        transporter:organizations!shipments_transporter_id_fkey(name, address, city, commercial_register, tax_card, establishment_registration, registered_activity, environmental_approval_number, license_number, phone, logo_url, organization_type, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_license, eeaa_license_issue_date, eeaa_license_expiry_date, land_transport_license, land_transport_license_issue_date, land_transport_license_expiry_date, hazardous_certified, digital_declaration_number, certifications_approvals),
        recycler:organizations!shipments_recycler_id_fkey(name, address, city, commercial_register, tax_card, establishment_registration, registered_activity, environmental_approval_number, phone, logo_url, organization_type, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_license, eeaa_license_issue_date, eeaa_license_expiry_date, ida_license, ida_license_issue_date, ida_license_expiry_date, industrial_registry, license_number, digital_declaration_number, certifications_approvals, hazardous_certified)
      `).eq("id", shipmentId).single(),
      supabase.from("shipment_logs").select("*").eq("shipment_id", shipmentId).order("created_at", { ascending: true }),
      supabase.from("shipment_receipts").select("*").eq("shipment_id", shipmentId).order("created_at", { ascending: true }),
      supabase.from("document_endorsements").select(`
        *, 
        system_endorsements(system_seal_number, system_seal_hash, legal_disclaimer),
        signature:organization_signatures(signature_url),
        stamp:organization_stamps(stamp_url)
      `).eq("document_id", shipmentId).order("endorsed_at", { ascending: true }),
      supabase.from("custody_chain_events").select("*, actor_organization:organizations!custody_chain_events_actor_organization_id_fkey(name)").eq("shipment_id", shipmentId).order("created_at", { ascending: true }),
      supabase.from("delivery_declarations").select("*").eq("shipment_id", shipmentId).order("declared_at", { ascending: true }),
    ]);

    if (shipmentRes.error || !shipmentRes.data) throw new Error(`Shipment not found: ${shipmentRes.error?.message}`);

    const shipment = shipmentRes.data;
    const logs = logsRes.data || [];
    const receipts = receiptsRes.data || [];
    const endorsements = endorsementsRes.data || [];
    const custody = custodyRes.data || [];
    const declarations = declarationsRes.data || [];

    // Use direct URLs for images instead of base64 to avoid freezing the browser
    const html = generateCompleteDocHTML(shipment, logs, receipts, endorsements, custody, declarations);

    return new Response(
      JSON.stringify({ success: true, html, shipmentNumber: shipment.shipment_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Complete doc error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateCompleteDocHTML(shipment: any, logs: any[], receipts: any[], endorsements: any[], custody: any[], declarations: any[]) {
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ar-EG") : "—";
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString("ar-EG") : "—";

  const getImg = (url: string | null) => url || null;

  const wasteLabels: Record<string, string> = {
    plastic: "بلاستيك", paper: "ورق وكرتون", metal: "معادن", glass: "زجاج",
    organic: "عضوي", electronic: "إلكتروني", textile: "منسوجات",
    chemical: "كيميائي", medical: "طبي", construction: "مخلفات بناء",
    rubber: "مطاط", wood: "خشب", mixed: "مخلوط", other: "أخرى",
    hazardous_chemical: "كيميائي خطر", hazardous_medical: "طبي خطر",
    hazardous_electronic: "إلكتروني خطر", hazardous_industrial: "صناعي خطر",
  };

  const statusLabels: Record<string, string> = {
    new: "جديدة", pending: "قيد الانتظار", approved: "معتمدة", registered: "مسجلة",
    in_transit: "قيد النقل", delivered: "تم التسليم", confirmed: "مؤكدة",
    completed: "مكتملة", cancelled: "ملغاة",
  };

  const receiptStatusLabels: Record<string, string> = {
    pending: "قيد الانتظار", confirmed: "مؤكد", rejected: "مرفوض",
  };

  const getLicenseStatus = (expiryDate: string | null | undefined): string => {
    if (!expiryDate) return '<span style="color:#9ca3af;font-size:7px">⚪ غير محدد</span>';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `<span style="color:#dc2626;font-size:7px;font-weight:bold">🔴 منتهي</span>`;
    if (days <= 30) return `<span style="color:#d97706;font-size:7px;font-weight:bold">🟡 ينتهي خلال ${days} يوم</span>`;
    return `<span style="color:#16a34a;font-size:7px">🟢 ساري</span>`;
  };

  const renderLicenses = (org: any): string => {
    if (!org) return '';
    const isTransporter = org.organization_type === 'transporter';
    let html = `<div style="border-top:1px dashed #d1d5db;margin-top:3px;padding-top:3px;">`;
    html += `<p style="font-size:7px;font-weight:bold;color:#0f766e;margin-bottom:2px;">📋 التراخيص:</p>`;
    if (org.wmra_license) html += `<p><span class="l">WMRA:</span> ${org.wmra_license} ${getLicenseStatus(org.wmra_license_expiry_date)}</p>`;
    if (org.environmental_license) html += `<p><span class="l">EEAA:</span> ${org.environmental_license} ${getLicenseStatus(org.eeaa_license_expiry_date)}</p>`;
    if (!isTransporter && org.ida_license) html += `<p><span class="l">IDA:</span> ${org.ida_license} ${getLicenseStatus(org.ida_license_expiry_date)}</p>`;
    if (isTransporter && org.land_transport_license) html += `<p><span class="l">نقل بري:</span> ${org.land_transport_license} ${getLicenseStatus(org.land_transport_license_expiry_date)}</p>`;
    if (org.digital_declaration_number) html += `<p><span class="l">إقرار رقمي:</span> ${org.digital_declaration_number}</p>`;
    html += `</div>`;
    return html;
  };

  const renderCertifications = (org: any): string => {
    if (!org?.certifications_approvals || !Array.isArray(org.certifications_approvals) || org.certifications_approvals.length === 0) return '';
    let html = `<div style="border-top:1px dashed #d1d5db;margin-top:3px;padding-top:3px;">`;
    html += `<p style="font-size:7px;font-weight:bold;color:#0f766e;margin-bottom:2px;">🏅 شهادات/موافقات:</p>`;
    for (const cert of org.certifications_approvals) {
      if (cert.name) {
        html += `<p><span class="l">${cert.name}:</span> ${cert.number || '—'} ${cert.expiry_date ? getLicenseStatus(cert.expiry_date) : ''}</p>`;
      }
    }
    html += `</div>`;
    return html;
  };

  const partyBox = (icon: string, title: string, org: any, fallbackName?: string) => `
    <div class="party-box">
      <h4>${icon} ${title}</h4>
      <p><span class="l">الاسم:</span> <strong>${org?.name || fallbackName || "—"}</strong></p>
      <p><span class="l">العنوان:</span> ${org?.address || "—"}، ${org?.city || "—"}</p>
      <p><span class="l">السجل التجاري:</span> ${org?.commercial_register || "—"} ${org?.tax_card ? `| بطاقة ضريبية: ${org.tax_card}` : ''}</p>
      ${org?.establishment_registration ? `<p><span class="l">رقم تسجيل المنشأة:</span> ${org.establishment_registration}</p>` : ''}
      ${org?.registered_activity ? `<p><span class="l">النشاط المسجل:</span> ${org.registered_activity}</p>` : ''}
      ${org?.environmental_approval_number ? `<p><span class="l">الموافقة البيئية:</span> ${org.environmental_approval_number}</p>` : ''}
      <p><span class="l">الهاتف:</span> ${org?.phone || "—"}</p>
      ${org?.email ? `<p><span class="l">البريد:</span> ${org.email}</p>` : ""}
      ${org?.license_number ? `<p><span class="l">رقم الترخيص:</span> ${org.license_number}</p>` : ""}
      ${org?.industrial_registry ? `<p><span class="l">السجل الصناعي:</span> ${org.industrial_registry}</p>` : ""}
      ${org?.hazardous_certified ? `<p><span class="l">مخلفات خطرة:</span> ✅ معتمد</p>` : ""}
      ${renderLicenses(org)}
      ${renderCertifications(org)}
    </div>`;

  const endorsementRows = endorsements.map((e: any, i: number) => {
    const sysEnd = Array.isArray(e.system_endorsements) ? e.system_endorsements[0] : e.system_endorsements;
    return `<tr>
      <td>${i + 1}</td>
      <td>${e.document_type || "—"}</td>
      <td>${e.endorsement_type || "—"}</td>
      <td>${e.document_number}</td>
      <td>${formatDateTime(e.endorsed_at)}</td>
      <td style="font-size:8px;font-family:monospace">${e.verification_code || "—"}</td>
      <td>${sysEnd?.system_seal_number || "—"}</td>
      <td class="sig-cell">
        ${e.signature?.signature_url ? `<img src="${e.signature.signature_url}" class="sig-img"/>` : "—"}
      </td>
      <td class="sig-cell">
        ${e.stamp?.stamp_url ? `<img src="${e.stamp.stamp_url}" class="sig-img"/>` : "—"}
      </td>
    </tr>`;
  }).join("");

  const receiptRows = receipts.map((r: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.receipt_number}</td>
      <td>${receiptStatusLabels[r.status] || r.status}</td>
      <td>${r.waste_type || "—"}</td>
      <td>${r.declared_weight || "—"}</td>
      <td>${r.actual_weight || "—"}</td>
      <td>${formatDateTime(r.pickup_date)}</td>
      <td>${formatDateTime(r.confirmed_at)}</td>
      <td>${r.transporter_approval_status || "—"}</td>
    </tr>`).join("");

  const logRows = logs.map((l: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${statusLabels[l.status] || l.status}</td>
      <td>${formatDateTime(l.created_at)}</td>
      <td>${l.notes || "—"}</td>
    </tr>`).join("");

  const custodyRows = custody.map((c: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${c.event_type || "—"}</td>
      <td>${c.actor_organization?.name || "—"}</td>
      <td>${formatDateTime(c.created_at)}</td>
      <td style="font-size:8px;font-family:monospace">${c.gps_latitude ? `${Number(c.gps_latitude).toFixed(4)}, ${Number(c.gps_longitude).toFixed(4)}` : "—"}</td>
      <td style="font-size:7px;font-family:monospace">${c.qr_code_hash?.slice(0, 20) || "—"}...</td>
    </tr>`).join("");

  // Build photos section
  const weighbridgeImg = getImg(shipment.weighbridge_photo_url);
  const paymentProofImg = getImg(shipment.payment_proof_url);
  
  // Collect all pickup photos from receipts
  const allPickupPhotos: string[] = [];
  for (const r of receipts) {
    if (r.pickup_photos && Array.isArray(r.pickup_photos)) {
      for (const p of r.pickup_photos) {
        const resolved = getImg(p);
        if (resolved) allPickupPhotos.push(resolved);
      }
    }
  }

  const hasPhotos = weighbridgeImg || paymentProofImg || allPickupPhotos.length > 0;

  const photosSection = hasPhotos ? `
  <div class="section">
    <div class="sec-title">القسم السابع: التوثيق المرئي — صور الميزان والحمولة</div>
    <div class="photos-grid">
      ${weighbridgeImg ? `
      <div class="photo-card">
        <div class="photo-label">📷 تذكرة ميزان البسكول</div>
        <img src="${weighbridgeImg}" class="doc-photo" />
        <div class="photo-meta">رقم التذكرة: ${shipment.weighbridge_ticket_number || "—"}</div>
      </div>` : ""}
      ${paymentProofImg ? `
      <div class="photo-card">
        <div class="photo-label">💳 إثبات الدفع</div>
        <img src="${paymentProofImg}" class="doc-photo" />
        <div class="photo-meta">نوع الإثبات: ${shipment.payment_proof_type || "إيصال"}</div>
      </div>` : ""}
      ${allPickupPhotos.map((p, i) => `
      <div class="photo-card">
        <div class="photo-label">📦 صورة الحمولة ${allPickupPhotos.length > 1 ? `(${i + 1})` : ""}</div>
        <img src="${p}" class="doc-photo" />
      </div>`).join("")}
    </div>
  </div>` : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 10px; color: #1a1a1a; direction: rtl; margin: 0; padding: 0; }
  .page { width: 794px; min-height: 1123px; max-height: 1123px; overflow: hidden; padding: 15mm 15mm 20mm 15mm; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: auto; }
  .header { text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 6px; margin-bottom: 8px; }
  .header h1 { font-size: 18px; color: #0f766e; margin: 3px 0; }
  .header h2 { font-size: 12px; color: #333; margin: 2px 0; }
  .header .sub { font-size: 8px; color: #666; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-weight: bold; font-size: 10px; }
  .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
  .section { margin-bottom: 8px; }
  .sec-title { background: linear-gradient(135deg, #f0fdfa, #e0f2fe); border-right: 4px solid #0f766e; padding: 4px 8px; font-weight: bold; font-size: 10px; margin-bottom: 5px; color: #0f766e; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .party-box { border: 1px solid #d1d5db; border-radius: 5px; padding: 5px 7px; font-size: 8px; }
  .party-box h4 { font-size: 9px; color: #0f766e; margin: 0 0 3px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
  .party-box p { margin: 1px 0; }
  .l { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8px; table-layout: fixed; word-wrap: break-word; }
  td, th { border: 1px solid #d1d5db; padding: 2px 4px; text-align: right; overflow: hidden; text-overflow: ellipsis; }
  th { background: #f0fdfa; font-weight: bold; color: #0f766e; font-size: 8px; }
  .sig-cell { text-align: center; width: 50px; }
  .sig-img { max-width: 40px; max-height: 25px; object-fit: contain; }
  .stamp-area { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px; }
  .stamp-box { border: 2px dashed #d1d5db; border-radius: 6px; padding: 8px; text-align: center; min-height: 70px; }
  .stamp-box h5 { font-size: 9px; color: #0f766e; margin: 0 0 3px; }
  .stamp-box .date { font-size: 7px; color: #999; }
  .footer { border-top: 2px solid #0f766e; padding-top: 6px; margin-top: 10px; text-align: center; font-size: 7px; color: #6b7280; }
  .watermark { position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; color: rgba(15, 118, 110, 0.04); font-weight: bold; pointer-events: none; z-index: 0; }
  .photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .photo-card { border: 1px solid #d1d5db; border-radius: 5px; padding: 5px; text-align: center; }
  .photo-label { font-weight: bold; font-size: 9px; color: #0f766e; margin-bottom: 3px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
  .doc-photo { max-width: 100%; max-height: 130px; object-fit: contain; border-radius: 4px; border: 1px solid #e5e7eb; }
  .photo-meta { font-size: 7px; color: #6b7280; margin-top: 2px; }
  .decl-card { border: 1px solid #d1d5db; border-radius: 5px; padding: 6px 8px; margin-bottom: 6px; font-size: 8px; }
  .decl-card .decl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  .decl-card .decl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin-bottom: 4px; }
  .decl-card .decl-text { white-space: pre-wrap; font-size: 8px; line-height: 1.5; padding: 4px 6px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 3px; max-height: 120px; overflow: hidden; }
  .page-num { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-size: 7px; color: #999; }
</style>
</head>
<body>
<div class="watermark">مستند شحنة كامل</div>

<!-- الصفحة 1: البيانات الأساسية -->
<div class="page">
  <div class="header">
    <h2>جمهورية مصر العربية — جهاز تنظيم إدارة المخلفات</h2>
    <h1>📋 مستند الشحنة الكامل</h1>
    <h2>COMPLETE SHIPMENT DOCUMENT</h2>
    <p class="sub">وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020</p>
    <div style="margin-top:4px">
      <span class="badge badge-green">رقم الشحنة: ${shipment.shipment_number}</span>
      <span class="badge badge-blue" style="margin-right:6px">الحالة: ${statusLabels[shipment.status] || shipment.status}</span>
    </div>
    <p class="sub" style="margin-top:3px">تاريخ الإصدار: ${formatDateTime(new Date().toISOString())}</p>
  </div>

  <div class="section">
    <div class="sec-title">القسم الأول: الأطراف المشاركة في الشحنة</div>
    <div class="parties">
      ${partyBox("🏭", "مولد المخلفات", shipment.generator, shipment.manual_generator_name)}
      ${partyBox("🚛", "شركة النقل", shipment.transporter, shipment.manual_transporter_name)}
      ${partyBox("♻️", "جهة التدوير / التخلص", shipment.recycler, shipment.manual_recycler_name)}
      <div class="party-box">
        <h4>🧑‍✈️ بيانات السائق والمركبة</h4>
        <p><span class="l">السائق:</span> <strong>${shipment.manual_driver_name || "—"}</strong></p>
        <p><span class="l">لوحة المركبة:</span> ${shipment.manual_vehicle_plate || "—"}</p>
        <p><span class="l">تاريخ الاستلام:</span> ${formatDateTime(shipment.pickup_date || shipment.collection_started_at)}</p>
        <p><span class="l">تاريخ التسليم:</span> ${formatDateTime(shipment.delivered_at)}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="sec-title">القسم الثاني: تفاصيل المخلفات والأوزان</div>
    <table>
      <tr><th>نوع المخلف</th><th>الوصف</th><th>الكمية</th><th>الوحدة</th><th>الوزن الفعلي</th><th>رقم تذكرة الميزان</th></tr>
      <tr>
        <td>${wasteLabels[shipment.waste_type] || shipment.waste_type || "—"}</td>
        <td>${shipment.waste_description || "—"}</td>
        <td>${shipment.quantity || "—"}</td>
        <td>${shipment.unit || "طن"}</td>
        <td>${shipment.actual_weight || shipment.weighbridge_net_weight || "—"}</td>
        <td>${shipment.weighbridge_ticket_number || "—"}</td>
      </tr>
    </table>
    <table>
      <tr><th>الوزن الإجمالي</th><th>وزن الفارغة</th><th>صافي الوزن</th><th>نقطة الاستلام</th><th>نقطة التسليم</th><th>المسافة</th></tr>
      <tr>
        <td>${shipment.weighbridge_gross_weight || "—"}</td>
        <td>${shipment.weighbridge_tare_weight || "—"}</td>
        <td>${shipment.weighbridge_net_weight || "—"}</td>
        <td>${shipment.pickup_address || "—"}</td>
        <td>${shipment.delivery_address || "—"}</td>
        <td>${shipment.estimated_distance_km ? `${shipment.estimated_distance_km} كم` : "—"}</td>
      </tr>
    </table>
  </div>

  ${receipts.length > 0 ? `
  <div class="section">
    <div class="sec-title">القسم الثالث: إيصالات الاستلام والتسليم (${receipts.length})</div>
    <table>
      <tr><th>#</th><th>رقم الإيصال</th><th>الحالة</th><th>نوع المخلف</th><th>الوزن المعلن</th><th>الوزن الفعلي</th><th>تاريخ الاستلام</th><th>تاريخ التأكيد</th><th>موافقة الناقل</th></tr>
      ${receiptRows}
    </table>
  </div>` : ""}
  <div class="page-num">صفحة 1</div>
</div>

<!-- صفحة الإقرارات القانونية -->
<div class="page">
  <div class="header" style="padding-bottom:4px;margin-bottom:6px">
    <h1 style="font-size:14px">📋 مستند الشحنة الكامل — ${shipment.shipment_number}</h1>
    <p class="sub">صفحة الإقرارات القانونية للأطراف</p>
  </div>

  ${declarations.length > 0 ? `
  <div class="section">
    <div class="sec-title">الإقرارات والتصريحات القانونية (${declarations.length})</div>
    ${declarations.map((d: any, i: number) => {
      const typeLabels: Record<string, string> = {
        generator_handover: '🏭 إقرار تسليم — المولّد',
        recycler_receipt: '♻️ إقرار استلام — المدوّر/جهة التخلص',
        transporter_delivery: '🚛 إقرار نقل — الناقل',
      };
      return `
      <div class="decl-card" style="${d.status === 'rejected' ? 'background:#fef2f2;border-color:#fecaca' : 'background:#f0fdf4;border-color:#86efac'}">
        <div class="decl-header">
          <strong style="font-size:9px;color:#0f766e">${typeLabels[d.declaration_type] || d.declaration_type || 'إقرار'} — (${i + 1})</strong>
          <span style="font-size:8px;padding:1px 6px;border-radius:8px;${d.status === 'rejected' ? 'background:#fee2e2;color:#991b1b' : d.status === 'confirmed' ? 'background:#dcfce7;color:#166534' : 'background:#fef9c3;color:#854d0e'}">${d.status === 'confirmed' ? '✅ مؤكد' : d.status === 'rejected' ? '❌ مرفوض' : '⏳ قيد الانتظار'}</span>
        </div>
        <div class="decl-grid">
          ${d.driver_name ? `<div><span class="l">السائق:</span> <strong>${d.driver_name}</strong></div>` : ''}
          ${d.driver_national_id ? `<div><span class="l">الهوية:</span> <strong>${d.driver_national_id}</strong></div>` : ''}
          ${d.generator_name ? `<div><span class="l">المولد:</span> <strong>${d.generator_name}</strong></div>` : ''}
          ${d.transporter_name ? `<div><span class="l">الناقل:</span> <strong>${d.transporter_name}</strong></div>` : ''}
          ${d.recycler_name ? `<div><span class="l">المدوّر:</span> <strong>${d.recycler_name}</strong></div>` : ''}
          <div><span class="l">التاريخ:</span> <strong>${formatDateTime(d.declared_at)}</strong></div>
          <div><span class="l">الكمية:</span> <strong>${d.quantity || '—'} ${d.unit || 'طن'}</strong></div>
        </div>
        <div class="decl-text">${d.declaration_text}</div>
        ${d.auto_generated ? `<div style="font-size:7px;color:#6b7280;margin-top:2px">🤖 إقرار تلقائي</div>` : ''}
      </div>`;
    }).join('')}
  </div>` : `
  <div class="section">
    <div class="sec-title">الإقرارات والتصريحات القانونية</div>
    <p style="text-align:center;color:#999;padding:8px">لا توجد إقرارات تسليم مسجلة بعد</p>
  </div>`}
  <div class="page-num">صفحة 2</div>
</div>

<!-- صفحة التوقيعات والأختام -->
<div class="page">
  <div class="header" style="padding-bottom:4px;margin-bottom:6px">
    <h1 style="font-size:14px">📋 مستند الشحنة الكامل — ${shipment.shipment_number}</h1>
    <p class="sub">صفحة التوقيعات والأختام وسلسلة الحيازة</p>
  </div>

  ${endorsements.length > 0 ? `
  <div class="section">
    <div class="sec-title">القسم الرابع: توقيعات وأختام الجهات (${endorsements.length})</div>
    <table>
      <tr><th>#</th><th>نوع المستند</th><th>نوع الاعتماد</th><th>رقم المستند</th><th>التاريخ</th><th>كود التحقق</th><th>رقم الختم</th><th>التوقيع</th><th>الختم</th></tr>
      ${endorsementRows}
    </table>
  </div>` : `
  <div class="section">
    <div class="sec-title">القسم الرابع: توقيعات وأختام الجهات</div>
    <p style="text-align:center;color:#999;padding:8px">لا توجد توقيعات مسجلة بعد</p>
  </div>`}

  ${custody.length > 0 ? `
  <div class="section">
    <div class="sec-title">القسم الخامس: سلسلة الحيازة الرقمية (${custody.length})</div>
    <table>
      <tr><th>#</th><th>الحدث</th><th>الجهة</th><th>التاريخ</th><th>الإحداثيات</th><th>بصمة SHA-256</th></tr>
      ${custodyRows}
    </table>
  </div>` : ""}

  ${logs.length > 0 ? `
  <div class="section">
    <div class="sec-title">القسم السادس: سجل تغييرات الحالة (${logs.length})</div>
    <table>
      <tr><th>#</th><th>الحالة</th><th>التاريخ</th><th>ملاحظات</th></tr>
      ${logRows}
    </table>
  </div>` : ""}

  <div class="stamp-area">
    <div class="stamp-box">
      <h5>🏭 توقيع وختم المولد</h5>
      <div style="min-height:40px"></div>
      <p class="date">${shipment.generator?.name || "—"}</p>
      <p class="date">التاريخ: ${formatDate(shipment.pickup_date)}</p>
    </div>
    <div class="stamp-box">
      <h5>🚛 توقيع وختم الناقل</h5>
      <div style="min-height:40px"></div>
      <p class="date">${shipment.transporter?.name || "—"}</p>
      <p class="date">التاريخ: ${formatDate(shipment.in_transit_at)}</p>
    </div>
    <div class="stamp-box">
      <h5>♻️ توقيع وختم المستلم</h5>
      <div style="min-height:40px"></div>
      <p class="date">${shipment.recycler?.name || "—"}</p>
      <p class="date">التاريخ: ${formatDate(shipment.delivered_at || shipment.confirmed_at)}</p>
    </div>
  </div>
  <div class="page-num">صفحة 3</div>
</div>

${hasPhotos ? `
<!-- صفحة التوثيق المرئي -->
<div class="page">
  <div class="header" style="padding-bottom:4px;margin-bottom:6px">
    <h1 style="font-size:14px">📋 مستند الشحنة الكامل — ${shipment.shipment_number}</h1>
    <p class="sub">صفحة التوثيق المرئي — صور الميزان والحمولة وإثبات الدفع</p>
  </div>
  ${photosSection}
  <div class="page-num">صفحة 4</div>
</div>
` : ""}

<!-- التذييل الرسمي -->
<div class="page" style="page-break-after:auto;display:flex;flex-direction:column;justify-content:flex-end">
  <div class="footer">
    <p><strong>مستند الشحنة الكامل</strong> — صادر إلكترونياً من نظام iRecycle لإدارة المخلفات</p>
    <p>رقم الشحنة: ${shipment.shipment_number} | الحالة: ${statusLabels[shipment.status] || shipment.status} | تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</p>
    <p>⚠️ هذا المستند إلكتروني رسمي ويمكن التحقق من صحته عبر بوابة التحقق الإلكتروني</p>
    <p style="font-size:6px;margin-top:3px">وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية — جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
  </div>
</div>

</body></html>`;
}
