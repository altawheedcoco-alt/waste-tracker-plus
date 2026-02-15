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
    const { shipmentId } = await req.json();
    if (!shipmentId) throw new Error("shipmentId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all data in parallel
    const [shipmentRes, logsRes, receiptsRes, endorsementsRes, custodyRes] = await Promise.all([
      supabase.from("shipments").select(`
        *,
        generator:organizations!shipments_generator_id_fkey(name, address, city, commercial_register, phone, email, logo_url),
        transporter:organizations!shipments_transporter_id_fkey(name, address, city, commercial_register, license_number, phone, logo_url),
        recycler:organizations!shipments_recycler_id_fkey(name, address, city, commercial_register, phone, logo_url)
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
    ]);

    if (shipmentRes.error || !shipmentRes.data) throw new Error(`Shipment not found: ${shipmentRes.error?.message}`);

    const shipment = shipmentRes.data;
    const logs = logsRes.data || [];
    const receipts = receiptsRes.data || [];
    const endorsements = endorsementsRes.data || [];
    const custody = custodyRes.data || [];

    const html = generateCompleteDocHTML(shipment, logs, receipts, endorsements, custody);

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

function generateCompleteDocHTML(shipment: any, logs: any[], receipts: any[], endorsements: any[], custody: any[]) {
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ar-EG") : "—";
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString("ar-EG") : "—";

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

  const partyBox = (icon: string, title: string, org: any, fallbackName?: string) => `
    <div class="party-box">
      <h4>${icon} ${title}</h4>
      <p><span class="l">الاسم:</span> <strong>${org?.name || fallbackName || "—"}</strong></p>
      <p><span class="l">العنوان:</span> ${org?.address || "—"}، ${org?.city || "—"}</p>
      <p><span class="l">السجل التجاري:</span> ${org?.commercial_register || "—"}</p>
      <p><span class="l">الهاتف:</span> ${org?.phone || "—"}</p>
      ${org?.email ? `<p><span class="l">البريد:</span> ${org.email}</p>` : ""}
      ${org?.license_number ? `<p><span class="l">رقم الترخيص:</span> ${org.license_number}</p>` : ""}
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

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 10px; color: #1a1a1a; direction: rtl; margin: 0; padding: 0; }
  .page { page-break-after: always; padding: 10px; }
  .page:last-child { page-break-after: auto; }
  .header { text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 8px; margin-bottom: 12px; }
  .header h1 { font-size: 20px; color: #0f766e; margin: 4px 0; }
  .header h2 { font-size: 13px; color: #333; margin: 2px 0; }
  .header .sub { font-size: 9px; color: #666; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-weight: bold; font-size: 11px; }
  .badge-green { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
  .section { margin-bottom: 10px; }
  .sec-title { background: linear-gradient(135deg, #f0fdfa, #e0f2fe); border-right: 4px solid #0f766e; padding: 5px 10px; font-weight: bold; font-size: 11px; margin-bottom: 6px; color: #0f766e; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .party-box { border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; font-size: 9px; }
  .party-box h4 { font-size: 10px; color: #0f766e; margin: 0 0 4px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  .party-box p { margin: 1px 0; }
  .l { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; }
  td, th { border: 1px solid #d1d5db; padding: 3px 6px; text-align: right; }
  th { background: #f0fdfa; font-weight: bold; color: #0f766e; font-size: 9px; }
  .sig-cell { text-align: center; width: 60px; }
  .sig-img { max-width: 50px; max-height: 30px; object-fit: contain; }
  .stamp-area { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 15px; }
  .stamp-box { border: 2px dashed #d1d5db; border-radius: 8px; padding: 10px; text-align: center; min-height: 90px; }
  .stamp-box h5 { font-size: 10px; color: #0f766e; margin: 0 0 4px; }
  .stamp-box .date { font-size: 8px; color: #999; }
  .footer { border-top: 2px solid #0f766e; padding-top: 8px; margin-top: 15px; text-align: center; font-size: 8px; color: #6b7280; }
  .watermark { position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; color: rgba(15, 118, 110, 0.04); font-weight: bold; pointer-events: none; z-index: 0; }
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
    <div style="margin-top:6px">
      <span class="badge badge-green">رقم الشحنة: ${shipment.shipment_number}</span>
      <span class="badge badge-blue" style="margin-right:8px">الحالة: ${statusLabels[shipment.status] || shipment.status}</span>
    </div>
    <p class="sub" style="margin-top:4px">تاريخ الإصدار: ${formatDateTime(new Date().toISOString())}</p>
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
      <tr><th>نقطة الاستلام</th><th>نقطة التسليم</th><th>المسافة</th></tr>
      <tr>
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
</div>

<!-- الصفحة 2: الإقرارات والتوقيعات -->
<div class="page">
  <div class="header" style="padding-bottom:5px;margin-bottom:8px">
    <h1 style="font-size:16px">📋 مستند الشحنة الكامل — ${shipment.shipment_number}</h1>
    <p class="sub">صفحة الإقرارات والتوقيعات والأختام</p>
  </div>

  ${endorsements.length > 0 ? `
  <div class="section">
    <div class="sec-title">القسم الرابع: إقرارات وتوقيعات الجهات (${endorsements.length})</div>
    <table>
      <tr><th>#</th><th>نوع المستند</th><th>نوع الاعتماد</th><th>رقم المستند</th><th>تاريخ التوقيع</th><th>كود التحقق</th><th>رقم الختم</th><th>التوقيع</th><th>الختم</th></tr>
      ${endorsementRows}
    </table>
  </div>` : `
  <div class="section">
    <div class="sec-title">القسم الرابع: إقرارات وتوقيعات الجهات</div>
    <p style="text-align:center;color:#999;padding:10px">لا توجد إقرارات مسجلة بعد</p>
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

  <!-- مساحة التوقيعات والأختام الرسمية -->
  <div class="stamp-area">
    <div class="stamp-box">
      <h5>🏭 توقيع وختم المولد</h5>
      <div style="min-height:50px"></div>
      <p class="date">${shipment.generator?.name || "—"}</p>
      <p class="date">التاريخ: ${formatDate(shipment.pickup_date)}</p>
    </div>
    <div class="stamp-box">
      <h5>🚛 توقيع وختم الناقل</h5>
      <div style="min-height:50px"></div>
      <p class="date">${shipment.transporter?.name || "—"}</p>
      <p class="date">التاريخ: ${formatDate(shipment.in_transit_at)}</p>
    </div>
    <div class="stamp-box">
      <h5>♻️ توقيع وختم المستلم</h5>
      <div style="min-height:50px"></div>
      <p class="date">${shipment.recycler?.name || "—"}</p>
      <p class="date">التاريخ: ${formatDate(shipment.delivered_at || shipment.confirmed_at)}</p>
    </div>
  </div>

  <div class="footer">
    <p><strong>مستند الشحنة الكامل</strong> — صادر إلكترونياً من نظام iRecycle لإدارة المخلفات</p>
    <p>رقم الشحنة: ${shipment.shipment_number} | الحالة: ${statusLabels[shipment.status] || shipment.status} | تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</p>
    <p>⚠️ هذا المستند إلكتروني رسمي ويمكن التحقق من صحته عبر بوابة التحقق الإلكتروني</p>
    <p style="font-size:7px;margin-top:4px">وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية — جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
  </div>
</div>

</body></html>`;
}
