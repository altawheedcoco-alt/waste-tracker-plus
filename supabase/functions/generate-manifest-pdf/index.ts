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

    // Fetch shipment with all related data
    const { data: shipment, error } = await supabase
      .from("shipments")
      .select(`
        *,
        generator:organizations!shipments_generator_id_fkey(name, address, city, commercial_register, phone, email),
        transporter:organizations!shipments_transporter_id_fkey(name, address, city, commercial_register, license_number, phone),
        recycler:organizations!shipments_recycler_id_fkey(name, address, city, commercial_register, phone)
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

    // Generate HTML manifest matching WMRA template
    const html = generateManifestHTML(shipment, custodyChain || []);

    // Return manifest data (HTML to be rendered as PDF client-side)
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

function generateManifestHTML(shipment: any, custodyChain: any[]) {
  const wasteTypeLabels: Record<string, string> = {
    plastic: "بلاستيك", paper: "ورق وكرتون", metal: "معادن", glass: "زجاج",
    organic: "عضوي", electronic: "إلكتروني", textile: "منسوجات",
    chemical: "كيميائي", medical: "طبي", construction: "مخلفات بناء",
    rubber: "مطاط", wood: "خشب", mixed: "مخلوط", other: "أخرى",
    hazardous_chemical: "كيميائي خطر", hazardous_medical: "طبي خطر",
    hazardous_electronic: "إلكتروني خطر", hazardous_industrial: "صناعي خطر",
  };

  const hazardLabels: Record<string, string> = {
    low: "منخفض", medium: "متوسط", high: "عالي", critical: "حرج",
  };

  const eventTypeLabels: Record<string, string> = {
    generator_handover: "تسليم المولد",
    transporter_pickup: "استلام الناقل",
    transporter_delivery: "تسليم الناقل",
    recycler_receipt: "استلام المدوّر",
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ar-EG") : "—";
  const formatDateTime = (d: string | null) => d ? new Date(d).toLocaleString("ar-EG") : "—";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 11px; color: #1a1a1a; direction: rtl; }
  .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { font-size: 18px; color: #16a34a; margin: 5px 0; }
  .header h2 { font-size: 14px; color: #333; margin: 3px 0; }
  .header .subtitle { font-size: 10px; color: #666; }
  .section { margin-bottom: 12px; }
  .section-title { background: #f0fdf4; border-right: 4px solid #16a34a; padding: 6px 12px; font-weight: bold; font-size: 12px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  td, th { border: 1px solid #ddd; padding: 5px 8px; text-align: right; font-size: 10px; }
  th { background: #f9fafb; font-weight: bold; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .info-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
  .info-box h4 { font-size: 11px; color: #16a34a; margin: 0 0 5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
  .info-box p { margin: 2px 0; font-size: 10px; }
  .label { color: #6b7280; }
  .value { font-weight: 600; }
  .chain-event { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
  .chain-dot { width: 10px; height: 10px; border-radius: 50%; background: #16a34a; margin-top: 3px; flex-shrink: 0; }
  .chain-line { border-right: 2px solid #16a34a; margin-right: 4px; padding-right: 10px; }
  .hazard-badge { background: #fef2f2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-weight: bold; border: 1px solid #fecaca; }
  .footer { border-top: 2px solid #16a34a; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 9px; color: #6b7280; }
  .qr-placeholder { text-align: center; padding: 10px; border: 1px dashed #ccc; margin: 10px 0; font-size: 10px; color: #999; }
  .stamp-area { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 20px; }
  .stamp-box { border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; min-height: 80px; }
  .stamp-box h5 { font-size: 10px; color: #333; margin: 0 0 5px; }
  .gps-info { font-family: monospace; font-size: 9px; color: #6b7280; }
</style>
</head>
<body>

<div class="header">
  <h2>جمهورية مصر العربية</h2>
  <p class="subtitle">جهاز تنظيم إدارة المخلفات (WMRA)</p>
  <h1>🌿 مانيفست نقل المخلفات</h1>
  <h2>WASTE TRANSPORT MANIFEST</h2>
  <p class="subtitle">نموذج موحد وفقاً لقانون تنظيم إدارة المخلفات رقم 202 لسنة 2020</p>
  <p style="font-size: 13px; font-weight: bold; margin-top: 8px;">
    رقم المانيفست: ${shipment.shipment_number}
  </p>
  <p class="subtitle">تاريخ الإصدار: ${formatDate(shipment.created_at)}</p>
</div>

<!-- القسم 1: بيانات الأطراف -->
<div class="section">
  <div class="section-title">القسم الأول: بيانات الأطراف المعنية</div>
  <div class="info-grid">
    <div class="info-box">
      <h4>🏭 مولد المخلفات (الطرف الأول)</h4>
      <p><span class="label">الاسم:</span> <span class="value">${shipment.generator?.name || shipment.manual_generator_name || "—"}</span></p>
      <p><span class="label">العنوان:</span> ${shipment.generator?.address || "—"}, ${shipment.generator?.city || "—"}</p>
      <p><span class="label">السجل التجاري:</span> ${shipment.generator?.commercial_register || "—"}</p>
      <p><span class="label">البريد:</span> ${shipment.generator?.email || "—"}</p>
      <p><span class="label">الهاتف:</span> ${shipment.generator?.phone || "—"}</p>
    </div>
    <div class="info-box">
      <h4>🚛 شركة النقل (الطرف الثاني)</h4>
      <p><span class="label">الاسم:</span> <span class="value">${shipment.transporter?.name || shipment.manual_transporter_name || "—"}</span></p>
      <p><span class="label">العنوان:</span> ${shipment.transporter?.address || "—"}, ${shipment.transporter?.city || "—"}</p>
      <p><span class="label">رقم الترخيص:</span> ${shipment.transporter?.license_number || "—"}</p>
      <p><span class="label">السجل التجاري:</span> ${shipment.transporter?.commercial_register || "—"}</p>
      <p><span class="label">الهاتف:</span> ${shipment.transporter?.phone || "—"}</p>
    </div>
    <div class="info-box">
      <h4>♻️ جهة إعادة التدوير / التخلص (الطرف الثالث)</h4>
      <p><span class="label">الاسم:</span> <span class="value">${shipment.recycler?.name || shipment.manual_recycler_name || "—"}</span></p>
      <p><span class="label">العنوان:</span> ${shipment.recycler?.address || "—"}, ${shipment.recycler?.city || "—"}</p>
      <p><span class="label">السجل التجاري:</span> ${shipment.recycler?.commercial_register || "—"}</p>
      <p><span class="label">الهاتف:</span> ${shipment.recycler?.phone || "—"}</p>
    </div>
    ${shipment.disposal_facility ? `
    <div class="info-box">
      <h4>🏗️ مرفق التخلص النهائي</h4>
      <p><span class="label">الاسم:</span> <span class="value">${shipment.disposal_facility.name}</span></p>
      <p><span class="label">العنوان:</span> ${shipment.disposal_facility.address || "—"}, ${shipment.disposal_facility.city || "—"}</p>
      <p><span class="label">نوع المرفق:</span> ${shipment.disposal_facility.facility_type || "—"}</p>
    </div>` : ""}
  </div>
</div>

<!-- القسم 2: بيانات السائق والمركبة -->
<div class="section">
  <div class="section-title">القسم الثاني: بيانات السائق والمركبة</div>
  <table>
    <tr>
      <th>اسم السائق</th>
      <th>رقم الرخصة</th>
      <th>الهاتف</th>
      <th>نوع المركبة</th>
      <th>رقم اللوحة</th>
    </tr>
    <tr>
      <td>${shipment.driver?.full_name || shipment.manual_driver_name || "—"}</td>
      <td>${shipment.driver?.license_number || "—"}</td>
      <td>${shipment.driver?.phone || "—"}</td>
      <td>${shipment.driver?.vehicle_type || "—"}</td>
      <td>${shipment.driver?.vehicle_plate_number || shipment.manual_vehicle_plate || "—"}</td>
    </tr>
  </table>
</div>

<!-- القسم 3: بيانات المخلفات -->
<div class="section">
  <div class="section-title">القسم الثالث: وصف المخلفات ${shipment.hazard_level && shipment.hazard_level !== "low" ? `<span class="hazard-badge">⚠️ مخلفات خطرة - مستوى: ${hazardLabels[shipment.hazard_level] || shipment.hazard_level}</span>` : ""}</div>
  <table>
    <tr>
      <th>نوع المخلف</th>
      <th>الوصف</th>
      <th>الكمية المقدرة</th>
      <th>الوحدة</th>
      <th>الحالة الفيزيائية</th>
      <th>طريقة التعبئة</th>
    </tr>
    <tr>
      <td>${wasteTypeLabels[shipment.waste_type] || shipment.waste_type || "—"}</td>
      <td>${shipment.waste_description || "—"}</td>
      <td>${shipment.quantity || "—"}</td>
      <td>${shipment.unit || "طن"}</td>
      <td>${shipment.waste_state || "—"}</td>
      <td>${shipment.packaging_method || "—"}</td>
    </tr>
  </table>
</div>

<!-- القسم 4: بيانات الأوزان -->
<div class="section">
  <div class="section-title">القسم الرابع: بيانات الوزن والميزان</div>
  <table>
    <tr>
      <th>رقم تذكرة الميزان</th>
      <th>الوزن الإجمالي (كجم)</th>
      <th>وزن المركبة الفارغة (كجم)</th>
      <th>الوزن الصافي (كجم)</th>
      <th>الوزن الفعلي (كجم)</th>
    </tr>
    <tr>
      <td>${shipment.weighbridge_ticket_number || "—"}</td>
      <td>${shipment.weighbridge_gross_weight || "—"}</td>
      <td>${shipment.weighbridge_tare_weight || "—"}</td>
      <td>${shipment.weighbridge_net_weight || "—"}</td>
      <td>${shipment.actual_weight || "—"}</td>
    </tr>
  </table>
</div>

<!-- القسم 5: المسار الجغرافي -->
<div class="section">
  <div class="section-title">القسم الخامس: المسار الجغرافي وتواريخ العملية</div>
  <table>
    <tr>
      <th></th>
      <th>العنوان</th>
      <th>الإحداثيات</th>
      <th>التاريخ/الوقت</th>
    </tr>
    <tr>
      <td><strong>نقطة الاستلام</strong></td>
      <td>${shipment.pickup_address || "—"}, ${shipment.pickup_city || "—"}</td>
      <td class="gps-info">${shipment.gps_pickup_lat ? `${shipment.gps_pickup_lat}, ${shipment.gps_pickup_lng}` : "—"}</td>
      <td>${formatDateTime(shipment.pickup_date || shipment.collection_started_at)}</td>
    </tr>
    <tr>
      <td><strong>نقطة التسليم</strong></td>
      <td>${shipment.delivery_address || "—"}, ${shipment.delivery_city || "—"}</td>
      <td class="gps-info">${shipment.gps_delivery_lat ? `${shipment.gps_delivery_lat}, ${shipment.gps_delivery_lng}` : "—"}</td>
      <td>${formatDateTime(shipment.delivered_at)}</td>
    </tr>
  </table>
</div>

<!-- القسم 6: سلسلة الحيازة الرقمية -->
${custodyChain.length > 0 ? `
<div class="section">
  <div class="section-title">القسم السادس: سلسلة الحيازة الرقمية (Digital Chain of Custody)</div>
  <table>
    <tr>
      <th>#</th>
      <th>الحدث</th>
      <th>الجهة</th>
      <th>التاريخ/الوقت</th>
      <th>الإحداثيات</th>
      <th>بصمة SHA-256</th>
    </tr>
    ${custodyChain.map((evt: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${eventTypeLabels[evt.event_type] || evt.event_type}</td>
      <td>${evt.actor_organization?.name || "—"}</td>
      <td>${formatDateTime(evt.created_at)}</td>
      <td class="gps-info">${evt.gps_latitude ? `${evt.gps_latitude.toFixed(4)}, ${evt.gps_longitude?.toFixed(4)}` : "—"}</td>
      <td class="gps-info" style="font-size:8px">${evt.qr_code_hash?.slice(0, 24)}...</td>
    </tr>`).join("")}
  </table>
</div>` : ""}

<!-- التوقيعات والأختام -->
<div class="stamp-area">
  <div class="stamp-box">
    <h5>🏭 توقيع وختم المولد</h5>
    <p style="font-size:9px; color:#999;">التاريخ: ${formatDate(shipment.pickup_date)}</p>
  </div>
  <div class="stamp-box">
    <h5>🚛 توقيع وختم الناقل</h5>
    <p style="font-size:9px; color:#999;">التاريخ: ${formatDate(shipment.in_transit_at)}</p>
  </div>
  <div class="stamp-box">
    <h5>♻️ توقيع وختم المستلم</h5>
    <p style="font-size:9px; color:#999;">التاريخ: ${formatDate(shipment.delivered_at)}</p>
  </div>
</div>

<div class="footer">
  <p>هذا المانيفست صادر إلكترونياً من نظام iRecycle لإدارة المخلفات ومطابق لنموذج جهاز تنظيم إدارة المخلفات (WMRA)</p>
  <p>رقم المانيفست: ${shipment.shipment_number} | تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</p>
  <p>⚠️ هذا المستند إلكتروني ويمكن التحقق من صحته عبر مسح رمز QR أو زيارة بوابة التحقق</p>
</div>

</body>
</html>`;
}
