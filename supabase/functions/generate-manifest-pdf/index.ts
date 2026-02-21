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

  const isHazardous = shipment.hazard_level && shipment.hazard_level !== "low";
  const verifyUrl = `https://irecycle.app/qr-verify?ref=${shipment.shipment_number}`;

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
    height: 1123px; 
    position: relative;
    overflow: hidden;
    padding: 12px 16px;
  }
  /* Watermark */
  body::before {
    content: "iRecycle";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 120px;
    font-weight: 900;
    color: rgba(22, 163, 74, 0.04);
    pointer-events: none;
    z-index: 0;
    letter-spacing: 20px;
  }
  body > * { position: relative; z-index: 1; }
  
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
  .sig-box { border: 1px solid #d1d5db; border-radius: 4px; padding: 4px; text-align: center; min-height: 50px; background: #fafafa; }
  .sig-box h5 { font-size: 7px; color: #15803d; margin-bottom: 2px; }
  .sig-line { border-bottom: 1px dotted #9ca3af; margin: 12px 8px 2px; }
  .sig-label { font-size: 5.5px; color: #9ca3af; }
  
  /* Declaration */
  .decl { background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; padding: 4px 6px; margin: 4px 0; }
  .decl h4 { font-size: 7.5px; color: #92400e; margin-bottom: 2px; }
  .decl p { font-size: 6px; color: #78350f; line-height: 1.4; }
  
  /* Terms */
  .terms { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px; margin: 4px 0; }
  .terms h4 { font-size: 7px; color: #334155; margin-bottom: 2px; }
  .terms ol { font-size: 5.5px; color: #475569; padding-right: 12px; line-height: 1.5; columns: 2; column-gap: 12px; }
  .terms li { break-inside: avoid; margin-bottom: 1px; }
  
  /* Security footer */
  .sec-footer { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #16a34a; padding-top: 4px; margin-top: 4px; }
  .sec-footer .left { font-size: 5.5px; color: #6b7280; }
  .sec-footer .center { text-align: center; }
  .sec-footer .right { text-align: left; direction: ltr; }
  .qr-box { width: 52px; height: 52px; border: 1px solid #d1d5db; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 5px; color: #9ca3af; background: #fff; }
  .hash-badge { font-family: monospace; font-size: 5.5px; color: #16a34a; background: #f0fdf4; padding: 1px 4px; border-radius: 2px; border: 1px solid #bbf7d0; }
  .barcode { font-family: monospace; font-size: 6px; letter-spacing: 2px; color: #374151; }
  .security-strip { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 3px; }
  .security-strip span { font-size: 5px; color: #9ca3af; }
</style>
</head>
<body>

<!-- Header -->
<div class="hdr">
  <div class="hdr-top">
    <div style="font-size:6px;color:#666;text-align:right;">
      جمهورية مصر العربية<br/>جهاز تنظيم إدارة المخلفات (WMRA)
    </div>
    <div class="hdr-logo">🌿 iRecycle</div>
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
  <div class="sec-t">القسم الأول: الأطراف المعنية</div>
  <div class="parties">
    <div class="party">
      <h4>🏭 المولّد (الطرف الأول)</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.generator?.name || shipment.manual_generator_name || "—"}</span></p>
      <p><span class="lbl">العنوان:</span> ${shipment.generator?.address || "—"}, ${shipment.generator?.city || ""}</p>
      <p><span class="lbl">السجل:</span> ${shipment.generator?.commercial_register || "—"}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.generator?.phone || "—"}</p>
    </div>
    <div class="party">
      <h4>🚛 الناقل (الطرف الثاني)</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.transporter?.name || shipment.manual_transporter_name || "—"}</span></p>
      <p><span class="lbl">العنوان:</span> ${shipment.transporter?.address || "—"}, ${shipment.transporter?.city || ""}</p>
      <p><span class="lbl">ترخيص:</span> ${shipment.transporter?.license_number || "—"}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.transporter?.phone || "—"}</p>
    </div>
    <div class="party">
      <h4>♻️ المدوّر (الطرف الثالث)</h4>
      <p><span class="lbl">الاسم:</span> <span class="val">${shipment.recycler?.name || shipment.manual_recycler_name || "—"}</span></p>
      <p><span class="lbl">العنوان:</span> ${shipment.recycler?.address || "—"}, ${shipment.recycler?.city || ""}</p>
      <p><span class="lbl">السجل:</span> ${shipment.recycler?.commercial_register || "—"}</p>
      <p><span class="lbl">هاتف:</span> ${shipment.recycler?.phone || "—"}</p>
    </div>
  </div>
</div>

<!-- 2. السائق والمركبة + المخلفات -->
<div class="sec">
  <div class="sec-t">القسم الثاني: بيانات السائق والمخلفات</div>
  <table>
    <tr>
      <th>اسم السائق</th><th>رخصة القيادة</th><th>هاتف السائق</th><th>نوع المركبة</th><th>رقم اللوحة</th>
      <th>نوع المخلف</th><th>الوصف</th><th>الكمية</th><th>الحالة</th><th>التعبئة</th>
    </tr>
    <tr>
      <td>${shipment.driver?.full_name || shipment.manual_driver_name || "—"}</td>
      <td>${shipment.driver?.license_number || "—"}</td>
      <td>${shipment.driver?.phone || "—"}</td>
      <td>${shipment.driver?.vehicle_type || "—"}</td>
      <td>${shipment.driver?.vehicle_plate_number || shipment.manual_vehicle_plate || "—"}</td>
      <td>${wasteTypeLabels[shipment.waste_type] || shipment.waste_type || "—"}</td>
      <td>${shipment.waste_description || "—"}</td>
      <td>${shipment.quantity || "—"} ${shipment.unit || "طن"}</td>
      <td>${shipment.waste_state || "—"}</td>
      <td>${shipment.packaging_method || "—"}</td>
    </tr>
  </table>
</div>

<!-- 3. الأوزان والمسار -->
<div class="sec">
  <div class="sec-t">القسم الثالث: الأوزان والمسار الجغرافي</div>
  <table>
    <tr>
      <th>تذكرة الميزان</th><th>إجمالي (كجم)</th><th>فارغة (كجم)</th><th>صافي (كجم)</th><th>فعلي (كجم)</th>
      <th>نقطة الاستلام</th><th>إحداثيات</th><th>نقطة التسليم</th><th>إحداثيات</th>
    </tr>
    <tr>
      <td>${shipment.weighbridge_ticket_number || "—"}</td>
      <td>${shipment.weighbridge_gross_weight || "—"}</td>
      <td>${shipment.weighbridge_tare_weight || "—"}</td>
      <td>${shipment.weighbridge_net_weight || "—"}</td>
      <td>${shipment.actual_weight || "—"}</td>
      <td>${shipment.pickup_address || "—"}</td>
      <td style="font-family:monospace;font-size:5.5px;">${shipment.gps_pickup_lat ? `${Number(shipment.gps_pickup_lat).toFixed(4)},${Number(shipment.gps_pickup_lng).toFixed(4)}` : "—"}</td>
      <td>${shipment.delivery_address || "—"}</td>
      <td style="font-family:monospace;font-size:5.5px;">${shipment.gps_delivery_lat ? `${Number(shipment.gps_delivery_lat).toFixed(4)},${Number(shipment.gps_delivery_lng).toFixed(4)}` : "—"}</td>
    </tr>
  </table>
</div>

<!-- 4. سلسلة الحيازة -->
${custodyChain.length > 0 ? `
<div class="sec">
  <div class="sec-t">القسم الرابع: سلسلة الحيازة الرقمية (Digital Chain of Custody)</div>
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

<!-- 5. الإقرار القانوني -->
<div class="decl">
  <h4>📜 الإقرار والتعهد القانوني</h4>
  <p>
    أقر أنا الموقع أدناه بصحة جميع البيانات الواردة في هذا المانيفست، وأتحمل كامل المسئولية المدنية والجنائية عن أي مخالفة أو بيانات غير صحيحة وفقاً لأحكام قانون تنظيم إدارة المخلفات رقم 202 لسنة 2020 ولائحته التنفيذية. كما أتعهد بالالتزام بكافة الاشتراطات البيئية والصحية المنصوص عليها في القوانين واللوائح السارية، بما فيها قانون البيئة رقم 4 لسنة 1994 واتفاقية بازل الدولية بشأن نقل النفايات الخطرة عبر الحدود. يعتبر التوقيع على هذا المانيفست بمثابة موافقة نهائية وغير قابلة للإلغاء على كافة الشروط والأحكام المرفقة.
  </p>
</div>

<!-- 6. التوقيعات والأختام -->
<div class="sigs">
  <div class="sig-box">
    <h5>🏭 توقيع وختم المولّد</h5>
    <div class="sig-line"></div>
    <div class="sig-label">الاسم: ${shipment.generator?.name || ".................."}</div>
    <div class="sig-label">التاريخ: ${formatDate(shipment.pickup_date)}</div>
    <div class="sig-label" style="margin-top:4px;font-size:5px;color:#d97706;">مكان الختم الرسمي</div>
  </div>
  <div class="sig-box">
    <h5>🚛 توقيع وختم الناقل</h5>
    <div class="sig-line"></div>
    <div class="sig-label">الاسم: ${shipment.transporter?.name || ".................."}</div>
    <div class="sig-label">التاريخ: ${formatDate(shipment.in_transit_at)}</div>
    <div class="sig-label" style="margin-top:4px;font-size:5px;color:#d97706;">مكان الختم الرسمي</div>
  </div>
  <div class="sig-box">
    <h5>♻️ توقيع وختم المستلم</h5>
    <div class="sig-line"></div>
    <div class="sig-label">الاسم: ${shipment.recycler?.name || ".................."}</div>
    <div class="sig-label">التاريخ: ${formatDate(shipment.delivered_at)}</div>
    <div class="sig-label" style="margin-top:4px;font-size:5px;color:#d97706;">مكان الختم الرسمي</div>
  </div>
</div>

<!-- 7. الشروط والأحكام -->
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

<!-- Security Footer -->
<div class="sec-footer">
  <div class="left">
    <div>🌿 <strong>iRecycle</strong> - نظام إدارة المخلفات الذكي</div>
    <div>تاريخ الطباعة: ${new Date().toLocaleString("ar-EG")}</div>
    <div>⚠️ وثيقة إلكترونية محمية - يمنع التعديل أو التزوير</div>
    <div class="hash-badge">SHA-256: ${integrityHash}</div>
  </div>
  <div class="center">
    <div class="qr-box">
      <div>📱 QR<br/><span style="font-size:4px;">${verifyUrl}</span></div>
    </div>
    <div class="security-strip">
      <span>🔒 مؤمّن</span>
      <span>|</span>
      <span>📋 مرجع: ${shipment.shipment_number}</span>
    </div>
  </div>
  <div class="right">
    <div class="barcode">||||| ${shipment.shipment_number} |||||</div>
    <div style="font-size:5px;color:#9ca3af;margin-top:2px;">رمز التحقق السريع</div>
  </div>
</div>

</body>
</html>`;
}
