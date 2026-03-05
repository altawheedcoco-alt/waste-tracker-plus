import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function v(s: string | undefined | null): string {
  return s || '—';
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوي', chemical: 'كيميائي',
  medical: 'طبي', construction: 'مخلفات بناء', other: 'أخرى',
};
const unitLabels: Record<string, string> = {
  ton: 'طن', kg: 'كيلوجرام', liter: 'لتر', m3: 'متر مكعب', unit: 'وحدة',
};
const hazardLabels: Record<string, string> = {
  non_hazardous: 'غير خطر', hazardous: 'خطر', highly_hazardous: 'شديد الخطورة',
};
const disposalLabels: Record<string, string> = {
  recycling: 'إعادة تدوير', remanufacturing: 'إعادة تصنيع',
  landfill: 'دفن صحي', incineration: 'حرق', treatment: 'معالجة', reuse: 'إعادة استخدام',
};

function generateShipmentHTML(form: any): string {
  const shipTypeLabel = form.shipment_type === 'urgent' ? 'عاجلة' : form.shipment_type === 'scheduled' ? 'مجدولة' : 'عادية';
  const destTypeLabel = form.destination_type === 'disposal' ? 'تخلص نهائي' : 'إعادة تدوير';
  const destSectionTitle = form.destination_type === 'disposal' ? 'جهة التخلص النهائي' : 'جهة إعادة التدوير';
  const dateNow = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const verificationCode = `iRC-${(form.shipment_number || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const qrUrl = encodeURIComponent(`https://irecycle21.lovable.app/verify/${verificationCode}`);

  const partyTable = (title: string, name: string, addr: string, phone: string, email: string, lic: string, cr: string, tax: string, rep: string) => `
    <table class="classic">
      <thead><tr><th colspan="2">${title}</th></tr></thead>
      <tbody>
        <tr><td class="k">الاسم</td><td>${v(name)}</td></tr>
        <tr><td class="k">العنوان</td><td>${v(addr)}</td></tr>
        <tr><td class="k">الهاتف</td><td>${v(phone)}</td></tr>
        <tr><td class="k">البريد الإلكتروني</td><td>${v(email)}</td></tr>
        <tr><td class="k">رقم الترخيص</td><td>${v(lic)}</td></tr>
        <tr><td class="k">السجل التجاري</td><td>${v(cr)}</td></tr>
        <tr><td class="k">الرقم الضريبي</td><td>${v(tax)}</td></tr>
        <tr><td class="k">الممثل القانوني</td><td>${v(rep)}</td></tr>
      </tbody>
    </table>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>بيان شحنة - ${v(form.shipment_number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap');
  @page { size: A4; margin: 14mm 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Amiri', 'Cairo', 'Times New Roman', serif;
    font-size: 9px;
    color: #222;
    direction: rtl;
    background: #fff;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 12mm 16mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .header {
    text-align: center;
    border-bottom: 2px double #333;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .header h1 {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 1px;
    font-family: 'Cairo', sans-serif;
  }
  .header .subtitle {
    font-size: 10px;
    color: #555;
    font-style: italic;
  }
  .header-meta {
    display: table;
    width: 100%;
    margin-top: 6px;
    font-size: 8px;
    color: #444;
  }
  .header-meta .right { display: table-cell; text-align: right; }
  .header-meta .left { display: table-cell; text-align: left; }
  table.classic {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
    font-size: 8.5px;
  }
  table.classic th {
    background: #f5f5f0;
    border: 1px solid #999;
    padding: 3px 8px;
    font-size: 9px;
    font-weight: 700;
    text-align: right;
    color: #1a1a1a;
    font-family: 'Cairo', sans-serif;
  }
  table.classic td {
    border: 1px solid #bbb;
    padding: 2.5px 8px;
    text-align: right;
    vertical-align: top;
  }
  table.classic td.k {
    background: #fafaf7;
    font-weight: 700;
    width: 30%;
    color: #333;
    font-family: 'Cairo', sans-serif;
    font-size: 8px;
  }
  .row { display: table; width: 100%; table-layout: fixed; }
  .row .cell { display: table-cell; vertical-align: top; }
  .row .cell:first-child { padding-left: 4px; }
  .row .cell:last-child { padding-right: 4px; }
  .sec-title {
    font-family: 'Cairo', sans-serif;
    font-size: 10px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 1px solid #999;
    padding-bottom: 2px;
    margin: 10px 0 5px;
  }
  .decl-block {
    border: 1px solid #bbb;
    padding: 6px 10px;
    margin-bottom: 8px;
    font-size: 8px;
    line-height: 1.8;
  }
  .decl-block .dt {
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
    font-size: 8.5px;
    text-decoration: underline;
    margin-bottom: 2px;
  }
  .decl-warn {
    border: 1px solid #b45309;
    background: #fffbeb;
    padding: 4px 8px;
    font-size: 7.5px;
    margin-top: 6px;
    text-align: center;
    color: #92400e;
  }
  .sig-row { display: table; width: 100%; margin-top: 8px; }
  .sig-cell { display: table-cell; width: 33.33%; text-align: center; vertical-align: top; padding: 4px 6px; }
  .sig-cell + .sig-cell { border-right: 1px solid #bbb; }
  .sig-label { font-family: 'Cairo', sans-serif; font-size: 9px; font-weight: 700; margin-bottom: 2px; }
  .sig-box { height: 40px; border-bottom: 1px solid #333; margin: 6px 20px 4px; }
  .sig-hint { font-size: 7px; color: #888; }
  .verify-row { display: table; width: 100%; border: 1px solid #bbb; margin-top: 6px; }
  .verify-cell { display: table-cell; vertical-align: middle; padding: 6px; text-align: center; }
  .qr-img { width: 64px; height: 64px; border: 1px solid #ccc; }
  .barcode-img { height: 24px; max-width: 180px; margin-top: 4px; }
  .v-code { font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
  .stamp-circle {
    width: 56px; height: 56px;
    border: 2px solid #333;
    border-radius: 50%;
    display: inline-block;
    line-height: 1.2;
    padding-top: 10px;
  }
  .footer {
    margin-top: 8px;
    padding-top: 5px;
    border-top: 1px solid #999;
    font-size: 7px;
    color: #888;
    display: table;
    width: 100%;
  }
  .footer .r { display: table-cell; text-align: right; }
  .footer .l { display: table-cell; text-align: left; width: 120px; }
  .terms-body { font-size: 8.5px; line-height: 2; }
  .terms-notice {
    border: 1px solid #333;
    padding: 5px 10px;
    text-align: center;
    font-size: 8.5px;
    font-weight: 700;
    margin-bottom: 10px;
    font-family: 'Cairo', sans-serif;
  }
  .t-sec { margin-bottom: 8px; }
  .t-sec-title {
    font-family: 'Cairo', sans-serif;
    font-weight: 700;
    font-size: 9.5px;
    border-bottom: 1px solid #bbb;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }
  .t-sec-body { padding: 0 6px; font-size: 8px; }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<div class="page">
  <div class="header">
    <h1>بيان شحنة مخلفات</h1>
    <div class="subtitle">Waste Shipment Manifest — Official Document</div>
    <div class="header-meta">
      <div class="right">
        رقم الشحنة: <strong>${v(form.shipment_number)}</strong>
        &nbsp;|&nbsp; النوع: <strong>${shipTypeLabel}</strong>
        &nbsp;|&nbsp; الخطورة: <strong>${hazardLabels[form.hazard_level] || 'غير محدد'}</strong>
        &nbsp;|&nbsp; الوجهة: <strong>${destTypeLabel}</strong>
      </div>
      <div class="left">${dateNow} — ${timeNow}</div>
    </div>
  </div>

  <div class="row">
    <div class="cell">
      ${partyTable('أولاً: المولّد (Generator)', form.generator_name, form.generator_address, form.generator_phone, form.generator_email, form.generator_license, form.generator_commercial_register, form.generator_tax_id, form.generator_representative)}
    </div>
    <div class="cell">
      ${partyTable('ثانياً: الناقل (Transporter)', form.transporter_name, form.transporter_address, form.transporter_phone, form.transporter_email, form.transporter_license, form.transporter_commercial_register, form.transporter_tax_id, form.transporter_representative)}
    </div>
  </div>

  ${partyTable(`ثالثاً: ${destSectionTitle} (Destination)`, form.destination_name, form.destination_address, form.destination_phone, form.destination_email, form.destination_license, form.destination_commercial_register, form.destination_tax_id, form.destination_representative)}

  <div class="row">
    <div class="cell">
      <table class="classic">
        <thead><tr><th colspan="2">رابعاً: بيانات المخلفات</th></tr></thead>
        <tbody>
          <tr><td class="k">نوع المخلف</td><td>${v(wasteTypeLabels[form.waste_type] || form.waste_type)}</td></tr>
          <tr><td class="k">الوصف</td><td>${v(form.waste_description)}</td></tr>
          <tr><td class="k">مستوى الخطورة</td><td>${v(hazardLabels[form.hazard_level] || form.hazard_level)}</td></tr>
          <tr><td class="k">الكمية</td><td>${form.quantity || '—'} ${unitLabels[form.unit] || form.unit || ''}</td></tr>
          <tr><td class="k">طريقة المعالجة</td><td>${v(disposalLabels[form.disposal_method] || form.disposal_method)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="cell">
      <table class="classic">
        <thead><tr><th colspan="2">خامساً: السائق والمركبة</th></tr></thead>
        <tbody>
          <tr><td class="k">اسم السائق</td><td>${v(form.driver_name)}</td></tr>
          <tr><td class="k">هاتف السائق</td><td>${v(form.driver_phone)}</td></tr>
          <tr><td class="k">لوحة المركبة</td><td>${v(form.vehicle_plate)}</td></tr>
          <tr><td class="k">نوع المركبة</td><td>${v(form.vehicle_type)}</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <table class="classic">
    <thead><tr><th colspan="4">سادساً: بيانات التحميل والتسليم</th></tr></thead>
    <tbody>
      <tr>
        <td class="k">موقع التحميل</td><td>${v(form.pickup_address)}</td>
        <td class="k">تاريخ التحميل</td><td>${v(form.pickup_date)}</td>
      </tr>
      <tr>
        <td class="k">موقع التسليم</td><td>${v(form.delivery_address)}</td>
        <td class="k">تاريخ التسليم</td><td>${v(form.delivery_date)}</td>
      </tr>
    </tbody>
  </table>

  ${form.price ? `
  <table class="classic">
    <thead><tr><th colspan="2">سابعاً: البيانات المالية</th></tr></thead>
    <tbody>
      <tr><td class="k">السعر</td><td>${v(form.price)}</td></tr>
      ${form.price_notes ? `<tr><td class="k">ملاحظات</td><td>${v(form.price_notes)}</td></tr>` : ''}
    </tbody>
  </table>` : ''}

  ${(form.notes || form.special_instructions) ? `
  <table class="classic">
    <thead><tr><th colspan="2">ملاحظات وتعليمات خاصة</th></tr></thead>
    <tbody>
      ${form.notes ? `<tr><td class="k">ملاحظات</td><td>${v(form.notes)}</td></tr>` : ''}
      ${form.special_instructions ? `<tr><td class="k">تعليمات خاصة</td><td>${v(form.special_instructions)}</td></tr>` : ''}
    </tbody>
  </table>` : ''}

  <div class="sec-title">الإقرارات القانونية والبيئية</div>
  <div class="decl-block">
    <div><span class="dt">إقرار المولّد:</span> يُقر المولّد بأن المخلفات المذكورة ناتجة عن نشاطه وأنه المسؤول الأول عن صحة ودقة جميع البيانات.</div>
    <div><span class="dt">إقرار الناقل:</span> يُقر الناقل بتطبيق جميع المعايير القانونية والبيئية والتزامه بكافة اشتراطات وزارة البيئة وجهاز WMRA.</div>
    <div><span class="dt">إقرار المستقبل:</span> يُقر المستقبل بأنه استلم المخلفات وسيطبق كافة المعايير البيئية والتنظيمية.</div>
    <div class="decl-warn"><strong>إخلاء مسؤولية:</strong> منصة iRecycle أداة رقمية للتوثيق والتتبع فقط.</div>
  </div>

  <div class="sec-title">التوقيعات والأختام</div>
  <div class="sig-row">
    <div class="sig-cell"><div class="sig-label">المولّد</div><div class="sig-box"></div><div class="sig-hint">الاسم / التوقيع / الختم</div></div>
    <div class="sig-cell"><div class="sig-label">الناقل</div><div class="sig-box"></div><div class="sig-hint">الاسم / التوقيع / الختم</div></div>
    <div class="sig-cell"><div class="sig-label">المستقبل</div><div class="sig-box"></div><div class="sig-hint">الاسم / التوقيع / الختم</div></div>
  </div>

  <div class="verify-row">
    <div class="verify-cell" style="width:80px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrUrl}&bgcolor=ffffff&color=222222" class="qr-img" alt="QR"/>
    </div>
    <div class="verify-cell" style="width:auto;">
      <div style="font-size:7px;color:#888;">رمز التحقق الإلكتروني</div>
      <div class="v-code">${verificationCode}</div>
      <img src="https://barcodeapi.org/api/128/${encodeURIComponent(verificationCode)}" class="barcode-img" alt="Barcode"/>
    </div>
    <div class="verify-cell" style="width:72px;">
      <div class="stamp-circle">
        <div style="font-size:6px;font-weight:700;">iRecycle</div>
        <div style="font-size:5px;color:#888;">مصدّق</div>
        <div style="font-size:5px;">${dateNow}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="r">مستند صادر إلكترونياً من منصة <strong>iRecycle</strong> — صفحة 1 من 2</div>
    <div class="l">${dateNow}</div>
  </div>
</div>

<div class="page">
  <div class="header">
    <h1>الشروط والأحكام والسياسات</h1>
    <div class="subtitle">Terms, Conditions & Policies</div>
    <div class="header-meta">
      <div class="right">ملحق ببيان شحنة رقم: <strong>${v(form.shipment_number)}</strong></div>
      <div class="left">${dateNow}</div>
    </div>
  </div>
  <div class="terms-body">
    <div class="terms-notice">بتوقيع الأطراف على بيان الشحنة، يُعتبر ذلك موافقة صريحة وكاملة على جميع الشروط والأحكام</div>
    <div class="t-sec"><div class="t-sec-title">أولاً: الأحكام العامة</div><div class="t-sec-body">1. يُعد هذا البيان وثيقة رسمية ملزمة قانونياً.<br/>2. جميع البيانات المدونة تُعتبر صحيحة وملزمة.<br/>3. يخضع لأحكام القانون رقم 202 لسنة 2020.<br/>4. يخضع لأحكام القانون رقم 4 لسنة 1994.<br/>5. أي نزاع تختص به المحاكم المصرية.</div></div>
    <div class="t-sec"><div class="t-sec-title">ثانياً: التزامات المولّد</div><div class="t-sec-body">1. يلتزم بالتصنيف الدقيق للمخلفات وفقاً لجداول WMRA.<br/>2. يتحمل المسؤولية الكاملة عن صحة البيانات.<br/>3. يلتزم بتغليف وتعبئة المخلفات وفقاً للمواصفات.<br/>4. يلتزم بالحصول على جميع التراخيص اللازمة.</div></div>
    <div class="t-sec"><div class="t-sec-title">ثالثاً: التزامات الناقل</div><div class="t-sec-body">1. يلتزم بنقل المخلفات في مركبات مرخصة ومجهزة.<br/>2. يتحمل المسؤولية الكاملة عن سلامة المخلفات أثناء النقل.<br/>3. يلتزم بالمسار المحدد وعدم الانحراف عنه.<br/>4. يلتزم بالإبلاغ الفوري عن أي حوادث.</div></div>
    <div class="t-sec"><div class="t-sec-title">رابعاً: التزامات المستقبل</div><div class="t-sec-body">1. يلتزم بمعالجة المخلفات وفقاً للطريقة المحددة وترخيصه.<br/>2. يلتزم بعدم إعادة تصدير المخلفات لجهة ثالثة.<br/>3. يلتزم بالاحتفاظ بسجلات دقيقة لمدة 5 سنوات.</div></div>
    <div class="t-sec"><div class="t-sec-title">خامساً: المسؤولية والتعويضات</div><div class="t-sec-body">1. يتحمل كل طرف المسؤولية عن الأضرار الناتجة عن إخلاله.<br/>2. لا تتحمل منصة iRecycle أي مسؤولية قانونية أو مالية.</div></div>
    <div class="t-sec"><div class="t-sec-title">سادساً: حماية البيانات</div><div class="t-sec-body">1. تُعامل جميع البيانات بسرية تامة.<br/>2. يحق للجهات الرقابية الاطلاع على البيان في أي وقت.</div></div>
  </div>

  <div class="verify-row">
    <div class="verify-cell" style="width:72px;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent('https://irecycle21.lovable.app/terms')}&bgcolor=ffffff&color=222222" class="qr-img" style="width:56px;height:56px;" alt="QR"/></div>
    <div class="verify-cell" style="width:auto;"><div class="v-code">TRM-${verificationCode}</div><img src="https://barcodeapi.org/api/128/${encodeURIComponent('TRM-' + verificationCode)}" class="barcode-img" alt="Barcode"/></div>
    <div class="verify-cell" style="width:72px;"><div class="stamp-circle"><div style="font-size:6px;font-weight:700;">iRecycle</div><div style="font-size:5px;">شروط وأحكام</div><div style="font-size:5px;">${dateNow}</div></div></div>
  </div>

  <div class="footer">
    <div class="r">الشروط والأحكام — ملحق ببيان الشحنة رقم <strong>${v(form.shipment_number)}</strong> — صفحة 2 من 2 — © iRecycle ${new Date().getFullYear()}</div>
    <div class="l">${dateNow}</div>
  </div>
</div>

</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { draft_id, send_whatsapp, to_phone } = body;

    if (!draft_id) {
      return new Response(JSON.stringify({ error: "draft_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch shipment data
    const { data: draft, error: fetchErr } = await supabase
      .from("manual_shipment_drafts")
      .select("*")
      .eq("id", draft_id)
      .single();

    if (fetchErr || !draft) {
      return new Response(JSON.stringify({ error: "Draft not found", details: fetchErr?.message }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate HTML
    const html = generateShipmentHTML(draft);
    const htmlBlob = new Blob([new TextEncoder().encode(html)], { type: "text/html" });
    
    const filename = `manifest-${(draft.shipment_number || draft.id).replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.html`;
    const storagePath = `manual-shipments/${filename}`;

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from("shipment-documents")
      .upload(storagePath, htmlBlob, {
        contentType: "text/html; charset=utf-8",
        upsert: true,
      });

    if (uploadErr) {
      console.error("[PDF Gen] Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Upload failed", details: uploadErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage
      .from("shipment-documents")
      .getPublicUrl(storagePath);
    
    const publicUrl = urlData.publicUrl;
    console.log("[PDF Gen] Document uploaded:", publicUrl);

    // Send via WhatsApp if requested
    let whatsappResult = null;
    if (send_whatsapp && to_phone) {
      const WAPILOT_TOKEN = Deno.env.get("WAPILOT_API_TOKEN");
      if (!WAPILOT_TOKEN) {
        console.warn("[PDF Gen] WaPilot not configured");
      } else {
        // Get active instance
        const { data: instances } = await supabase
          .from("whatsapp_instances")
          .select("instance_id")
          .eq("is_active", true)
          .limit(1);

        const instanceId = instances?.[0]?.instance_id;
        if (instanceId) {
          let formattedPhone = to_phone.replace(/[\s+\-()]/g, "").replace(/^0+/, "");
          if (/^1\d{9}$/.test(formattedPhone)) formattedPhone = "20" + formattedPhone;
          const chatId = `${formattedPhone}@c.us`;

          // Download the HTML and send as file
          try {
            const htmlBytes = new TextEncoder().encode(html);
            const formData = new FormData();
            formData.append("chat_id", chatId);
            formData.append("caption", `📄 بيان شحنة رقم ${draft.shipment_number || draft.id}`);
            formData.append("media", new File([htmlBytes], `بيان-شحنة-${draft.shipment_number || 'draft'}.html`, { type: "text/html" }));

            const WAPILOT_BASE = "https://api.wapilot.net/api/v2";
            const fileRes = await fetch(`${WAPILOT_BASE}/${instanceId}/send-file`, {
              method: "POST",
              headers: { token: WAPILOT_TOKEN },
              body: formData,
            });
            const fileResult = await fileRes.text();
            console.log(`[PDF Gen] WhatsApp file send (${fileRes.status}):`, fileResult);

            // Also send text summary
            const textMsg = `📦 *بيان شحنة رقم: ${draft.shipment_number || ''}*\n━━━━━━━━━━━━━━━━━━\n🏭 المولّد: ${draft.generator_name || '—'}\n🚛 الناقل: ${draft.transporter_name || '—'}\n♻️ المدوّر: ${draft.destination_name || '—'}\n📋 النفايات: ${draft.waste_description || '—'}\n⚖️ الكمية: ${draft.quantity || '—'} ${unitLabels[draft.unit] || draft.unit || ''}\n🚚 السائق: ${draft.driver_name || '—'}\n📅 التاريخ: ${draft.pickup_date || '—'}\n\n📎 المستند المرفق أعلاه يحتوي على كافة التفاصيل الرسمية\n🔗 رابط المشاركة: https://irecycle21.lovable.app/shared/manual-shipment/${draft.share_code || ''}`;
            
            const msgRes = await fetch(`${WAPILOT_BASE}/${instanceId}/send-message`, {
              method: "POST",
              headers: { token: WAPILOT_TOKEN, "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: textMsg }),
            });
            const msgResult = await msgRes.text();
            console.log(`[PDF Gen] WhatsApp text send (${msgRes.status}):`, msgResult);

            whatsappResult = { file_sent: fileRes.ok, text_sent: msgRes.ok };
          } catch (e) {
            console.error("[PDF Gen] WhatsApp send error:", e.message);
            whatsappResult = { error: e.message };
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      document_url: publicUrl,
      filename,
      whatsapp: whatsappResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[PDF Gen] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
