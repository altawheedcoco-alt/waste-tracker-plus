import { ManualShipmentData, WasteItem } from '@/hooks/useManualShipmentDraft';
import { generateRoleTagline } from '@/lib/roleTaglineEngine';
// PDF generated via unified PDFService

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

function v(s: string | undefined | null): string {
  return s || '—';
}

function generateFinanceHTML(form: ManualShipmentData): string {
  const items = form.waste_items || [];
  if (items.length === 0) {
    return `<div style="page-break-before:always;"></div><div class="sec-title" style="margin-top:0;">صفحة البيانات المالية</div><p style="text-align:center;color:#888;padding:20px;">لم يتم إدخال بيانات مالية</p>`;
  }

  let html = `<div style="page-break-before:always;"></div><div class="sec-title" style="margin-top:0;">صفحة البيانات المالية</div>`;
  let grandTotal = 0;

  items.forEach((item: WasteItem, idx: number) => {
    const base = parseFloat(item.price) || 0;
    const unitPrice = parseFloat(item.price_per_unit) || 0;
    const qty = parseFloat(item.quantity) || 0;
    const extra = parseFloat(item.extra_costs) || 0;
    const vatEnabled = item.vat_enabled === 'true';
    const vatAmt = vatEnabled ? (base + extra) * 0.14 : 0;
    const laborEnabled = item.labor_tax_enabled === 'true';
    const laborPct = parseFloat(item.labor_tax_percent) || 0;
    const laborAmt = laborEnabled ? (base + extra) * laborPct / 100 : 0;
    const itemTotal = base + extra + vatAmt + laborAmt;
    grandTotal += itemTotal;

    const wLabel = wasteTypeLabels[item.waste_type] || item.waste_type || `مخلف ${idx + 1}`;
    const uLabel = unitLabels[item.unit] || item.unit || '';

    let rows = '';
    if (unitPrice) rows += `<tr><td class="k">سعر الوحدة</td><td>${unitPrice.toFixed(2)} ج.م</td><td class="k">الكمية</td><td>${qty} ${uLabel}</td></tr>`;
    rows += `<tr><td class="k">إجمالي قبل الضرائب</td><td>${base.toFixed(2)} ج.م</td><td class="k">مصاريف إضافية</td><td>${extra ? extra.toFixed(2) + ' ج.م' : '—'}</td></tr>`;
    if (vatEnabled) rows += `<tr><td class="k">ضريبة القيمة المضافة (14%)</td><td>${vatAmt.toFixed(2)} ج.م</td><td class="k"></td><td></td></tr>`;
    if (laborEnabled) rows += `<tr><td class="k">ضريبة العمل (${laborPct}%)</td><td>${laborAmt.toFixed(2)} ج.م</td><td class="k"></td><td></td></tr>`;
    rows += `<tr style="background:#f0f0e8;font-weight:700;"><td class="k">صافي الصنف</td><td colspan="3">${itemTotal.toFixed(2)} ج.م</td></tr>`;

    html += `<table class="classic"><thead><tr><th colspan="4">الصنف ${idx + 1}: ${wLabel}</th></tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Grand total summary
  const paid = parseFloat(form.amount_paid) || 0;
  const remaining = grandTotal - paid;
  html += `<table class="classic"><thead><tr><th colspan="4">الإجمالي العام</th></tr></thead><tbody>`;
  html += `<tr style="font-weight:700;font-size:10px;"><td class="k">الإجمالي الكلي</td><td>${grandTotal.toFixed(2)} ج.م</td><td class="k">المدفوع</td><td>${paid ? paid.toFixed(2) + ' ج.م' : '—'}</td></tr>`;
  if (paid) html += `<tr><td class="k">المتبقي</td><td style="color:${remaining > 0 ? '#dc2626' : '#16a34a'};font-weight:700;">${remaining.toFixed(2)} ج.م</td><td class="k"></td><td></td></tr>`;
  if (form.price_notes) html += `<tr><td class="k">ملاحظات مالية</td><td colspan="3">${v(form.price_notes)}</td></tr>`;
  html += `</tbody></table>`;

  return html;
}

interface PdfOptions {
  includeFinance?: boolean;
}

function generateFullHTML(form: ManualShipmentData, options: PdfOptions = {}): string {
  const { includeFinance = true } = options;
  const shipTypeLabel = form.shipment_type === 'urgent' ? 'عاجلة' : form.shipment_type === 'scheduled' ? 'مجدولة' : 'عادية';
  const destTypeLabel = form.destination_type === 'disposal' ? 'تخلص نهائي' : 'إعادة تدوير';
  const destSectionTitle = form.destination_type === 'disposal' ? 'جهة التخلص النهائي' : 'جهة إعادة التدوير';
  const dateNow = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const verificationCode = `iRC-${(form.shipment_number || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const qrUrl = encodeURIComponent(`https://irecycle21.lovable.app/verify/${verificationCode}`);

  // Deterministic role-based tagline — stays the same for the same shipment
  const shipmentSeed = form.shipment_number || form.id || 'DRAFT';
  const destRole = form.destination_type === 'disposal' ? 'disposal' as const : 'recycler' as const;
  const taglineGenerator = generateRoleTagline('generator', shipmentSeed);
  const taglineTransporter = generateRoleTagline('transporter', shipmentSeed);
  const taglineDestination = generateRoleTagline(destRole, shipmentSeed);

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
  @page { size: A4; margin: 10mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Amiri', 'Cairo', 'Times New Roman', serif;
    font-size: 10px;
    color: #222;
    direction: rtl;
    background: #fff;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 8mm 10mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* Classic Header */
  .header {
    text-align: center;
    border-bottom: 2px double #333;
    padding-bottom: 6px;
    margin-bottom: 8px;
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
    margin-top: 4px;
    font-size: 9px;
    color: #444;
  }
  .header-meta .right { display: table-cell; text-align: right; }
  .header-meta .left { display: table-cell; text-align: left; }

  /* Classic Tables */
  table.classic {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    font-size: 9.5px;
  }
  table.classic th {
    background: #f5f5f0;
    border: 1px solid #999;
    padding: 3px 6px;
    font-size: 10px;
    font-weight: 700;
    text-align: right;
    color: #1a1a1a;
    font-family: 'Cairo', sans-serif;
  }
  table.classic td {
    border: 1px solid #bbb;
    padding: 2px 6px;
    text-align: right;
    vertical-align: top;
    word-break: break-word;
  }
  table.classic td.k {
    background: #fafaf7;
    font-weight: 700;
    width: 28%;
    color: #333;
    font-family: 'Cairo', sans-serif;
    font-size: 9px;
    white-space: nowrap;
  }

  /* Two column layout */
  .row { display: table; width: 100%; table-layout: fixed; }
  .row .cell { display: table-cell; vertical-align: top; }
  .row .cell:first-child { padding-left: 3px; }
  .row .cell:last-child { padding-right: 3px; }

  /* Section titles */
  .sec-title {
    font-family: 'Cairo', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 1px solid #999;
    padding-bottom: 2px;
    margin: 8px 0 4px;
  }
  .sec-title span { font-size: 8px; color: #777; font-weight: 400; margin-right: 6px; }

  /* Declarations */
  .decl-block {
    border: 1px solid #bbb;
    padding: 5px 8px;
    margin-bottom: 6px;
    font-size: 8.5px;
    line-height: 1.7;
  }
  .decl-block .dt {
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
    font-size: 9px;
    text-decoration: underline;
    margin-bottom: 2px;
  }
  .decl-warn {
    border: 1px solid #b45309;
    background: #fffbeb;
    padding: 3px 6px;
    font-size: 8px;
    margin-top: 4px;
    text-align: center;
    color: #92400e;
  }

  /* Signatures */
  .sig-row { display: table; width: 100%; margin-top: 6px; }
  .sig-cell { display: table-cell; width: 33.33%; text-align: center; vertical-align: top; padding: 3px 5px; }
  .sig-cell + .sig-cell { border-right: 1px solid #bbb; }
  .sig-label { font-family: 'Cairo', sans-serif; font-size: 9px; font-weight: 700; margin-bottom: 2px; }
  .sig-box { height: 35px; border-bottom: 1px solid #333; margin: 4px 16px 3px; }
  .sig-hint { font-size: 7px; color: #888; }

  /* Verification */
  .verify-row { display: table; width: 100%; border: 1px solid #bbb; margin-top: 5px; }
  .verify-cell { display: table-cell; vertical-align: middle; padding: 4px; text-align: center; }
  .qr-img { width: 56px; height: 56px; border: 1px solid #ccc; }
  .barcode-img { height: 22px; max-width: 160px; margin-top: 3px; }
  .v-code { font-family: 'Courier New', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; }
  .stamp-circle {
    width: 50px; height: 50px;
    border: 2px solid #333;
    border-radius: 50%;
    display: inline-block;
    line-height: 1.2;
    padding-top: 8px;
  }

  /* Footer */
  .footer {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #999;
    font-size: 7px;
    color: #888;
    display: table;
    width: 100%;
  }
  .footer .r { display: table-cell; text-align: right; }
  .footer .l { display: table-cell; text-align: left; width: 100px; }

  /* Terms page */
  .terms-body { font-size: 9px; line-height: 1.9; }
  .terms-notice {
    border: 1px solid #333;
    padding: 4px 8px;
    text-align: center;
    font-size: 9px;
    font-weight: 700;
    margin-bottom: 8px;
    font-family: 'Cairo', sans-serif;
  }
  .t-sec { margin-bottom: 6px; }
  .t-sec-title {
    font-family: 'Cairo', sans-serif;
    font-weight: 700;
    font-size: 10px;
    border-bottom: 1px solid #bbb;
    padding-bottom: 2px;
    margin-bottom: 3px;
  }
  .t-sec-body { padding: 0 6px; font-size: 8.5px; }

  @media print {
    body { background: #fff; }
    .page { padding: 0; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- ===== PAGE 1: SHIPMENT MANIFEST ===== -->
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
      <div class="left">
        ${dateNow} — ${timeNow}
      </div>
    </div>
  </div>

  <!-- Generator + Transporter side by side -->
  <div class="row">
    <div class="cell">
      ${partyTable('أولاً: المولّد (Generator)', form.generator_name, form.generator_address, form.generator_phone, form.generator_email, form.generator_license, form.generator_commercial_register, form.generator_tax_id, form.generator_representative)}
    </div>
    <div class="cell">
      ${partyTable('ثانياً: الناقل (Transporter)', form.transporter_name, form.transporter_address, form.transporter_phone, form.transporter_email, form.transporter_license, form.transporter_commercial_register, form.transporter_tax_id, form.transporter_representative)}
    </div>
  </div>

  <!-- Destination -->
  ${partyTable(`ثالثاً: ${destSectionTitle} (Destination)`, form.destination_name, form.destination_address, form.destination_phone, form.destination_email, form.destination_license, form.destination_commercial_register, form.destination_tax_id, form.destination_representative)}

  <!-- Waste + Vehicle side by side -->
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

  <!-- Logistics -->
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

  ${includeFinance ? generateFinanceHTML(form) : ''}

  ${(form.notes || form.special_instructions) ? `
  <table class="classic">
    <thead><tr><th colspan="2">ملاحظات وتعليمات خاصة</th></tr></thead>
    <tbody>
      ${form.notes ? `<tr><td class="k">ملاحظات</td><td>${v(form.notes)}</td></tr>` : ''}
      ${form.special_instructions ? `<tr><td class="k">تعليمات خاصة</td><td>${v(form.special_instructions)}</td></tr>` : ''}
    </tbody>
  </table>` : ''}

  <!-- Declarations -->
  <div class="sec-title">الإقرارات القانونية والبيئية</div>
  <div class="decl-block">
    <div><span class="dt">إقرار المولّد:</span> يُقر المولّد بأن المخلفات المذكورة ناتجة عن نشاطه وأنه المسؤول الأول عن صحة ودقة جميع البيانات، وأنه ملتزم بيئياً وفقاً للقانون رقم 202 لسنة 2020 والقانون رقم 4 لسنة 1994 ولوائحهما التنفيذية.</div>
    <div><span class="dt">إقرار الناقل:</span> يُقر الناقل بتطبيق جميع المعايير القانونية والبيئية والتزامه بكافة اشتراطات وزارة البيئة وجهاز تنظيم إدارة المخلفات (WMRA)، ويتحمل كامل المسؤولية عن سلامة المخلفات خلال النقل.</div>
    <div><span class="dt">إقرار المستقبل:</span> يُقر المستقبل بأنه استلم المخلفات وسيطبق كافة المعايير البيئية والتنظيمية في عمليات ${form.destination_type === 'disposal' ? 'التخلص النهائي' : 'إعادة التدوير'} وفقاً لترخيصه ومعايير WMRA.</div>
    <div class="decl-warn"><strong>إخلاء مسؤولية:</strong> منصة iRecycle أداة رقمية للتوثيق والتتبع فقط، ولا تتحمل أي مسؤولية قانونية عن محتوى البيانات أو العمليات. المسؤولية الكاملة على الأطراف الموقّعة.</div>
  </div>

  <!-- Signatures -->
  <div class="sec-title">التوقيعات والأختام</div>
  <div class="sig-row">
    <div class="sig-cell">
      <div class="sig-label">المولّد</div>
      <div class="sig-box"></div>
      <div class="sig-hint">الاسم / التوقيع / الختم</div>
    </div>
    <div class="sig-cell">
      <div class="sig-label">الناقل</div>
      <div class="sig-box"></div>
      <div class="sig-hint">الاسم / التوقيع / الختم</div>
    </div>
    <div class="sig-cell">
      <div class="sig-label">المستقبل</div>
      <div class="sig-box"></div>
      <div class="sig-hint">الاسم / التوقيع / الختم</div>
    </div>
  </div>

  <!-- Verification -->
  <div class="verify-row">
    <div class="verify-cell" style="width:80px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrUrl}&bgcolor=ffffff&color=222222" class="qr-img" alt="QR"/>
      <div style="font-size:6px;color:#888;margin-top:2px;">رمز QR</div>
    </div>
    <div class="verify-cell" style="width:auto;">
      <div style="font-size:7px;color:#888;margin-bottom:2px;">رمز التحقق الإلكتروني</div>
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
    <div class="r">مستند صادر إلكترونياً من منصة <strong>iRecycle</strong> لإدارة المخلفات — صفحة 1 من 2 — يُرجى مراجعة الشروط والأحكام في الصفحة التالية</div>
    <div class="l">${dateNow}</div>
  </div>

</div>

<!-- ===== PAGE 2: TERMS & CONDITIONS (no guilloche) ===== -->
<div class="page no-guilloche">

  <div class="header">
    <h1>الشروط والأحكام والسياسات</h1>
    <div class="subtitle">Terms, Conditions & Policies</div>
    <div class="header-meta">
      <div class="right">ملحق ببيان شحنة رقم: <strong>${v(form.shipment_number)}</strong></div>
      <div class="left">${dateNow}</div>
    </div>
  </div>

  <div class="terms-body">
    <div class="terms-notice">بتوقيع الأطراف على بيان الشحنة (الصفحة الأولى)، يُعتبر ذلك موافقة صريحة وكاملة على جميع الشروط والأحكام الواردة أدناه</div>

    <div class="t-sec">
      <div class="t-sec-title">أولاً: الأحكام العامة</div>
      <div class="t-sec-body">
        1. يُعد هذا البيان وثيقة رسمية ملزمة قانونياً لجميع الأطراف الموقعة عليه وفقاً للقوانين المصرية السارية.<br/>
        2. جميع البيانات المدونة تُعتبر صحيحة وملزمة ما لم يثبت خلاف ذلك بالأدلة المادية.<br/>
        3. يخضع هذا البيان لأحكام القانون رقم 202 لسنة 2020 بشأن تنظيم إدارة المخلفات ولائحته التنفيذية.<br/>
        4. يخضع لأحكام القانون رقم 4 لسنة 1994 بشأن حماية البيئة المعدّل بالقانون رقم 9 لسنة 2009.<br/>
        5. أي نزاع ينشأ عن هذا البيان تختص به المحاكم المصرية المختصة.
      </div>
    </div>

    <div class="t-sec">
      <div class="t-sec-title">ثانياً: التزامات المولّد</div>
      <div class="t-sec-body">
        1. يلتزم المولّد بالتصنيف الدقيق للمخلفات وفقاً لجداول التصنيف المعتمدة من WMRA.<br/>
        2. يتحمل المولّد المسؤولية الكاملة عن صحة بيانات الكميات والأوزان والأنواع المدونة.<br/>
        3. يلتزم بتغليف وتعبئة المخلفات وفقاً للمواصفات الفنية المعتمدة قبل تسليمها للناقل.<br/>
        4. يلتزم بالحصول على جميع التراخيص والتصاريح اللازمة لتوليد ونقل المخلفات.<br/>
        5. يتحمل تكاليف أي أضرار بيئية ناتجة عن عدم دقة البيانات المقدمة.
      </div>
    </div>

    <div class="t-sec">
      <div class="t-sec-title">ثالثاً: التزامات الناقل</div>
      <div class="t-sec-body">
        1. يلتزم الناقل بنقل المخلفات في مركبات مرخصة ومجهزة وفقاً لاشتراطات وزارة البيئة و WMRA.<br/>
        2. يتحمل المسؤولية الكاملة عن سلامة المخلفات من لحظة الاستلام حتى التسليم.<br/>
        3. يلتزم بالمسار المحدد وعدم الانحراف عنه إلا في حالات الضرورة القصوى مع التوثيق.<br/>
        4. يلتزم بالإبلاغ الفوري عن أي حوادث أو تسربات أثناء النقل.<br/>
        5. يحظر خلط أنواع مختلفة من المخلفات أثناء النقل دون تصريح مسبق.
      </div>
    </div>

    <div class="t-sec">
      <div class="t-sec-title">رابعاً: التزامات المستقبل (${destSectionTitle})</div>
      <div class="t-sec-body">
        1. يلتزم المستقبل بمعالجة المخلفات وفقاً للطريقة المحددة في البيان وترخيصه الساري.<br/>
        2. يلتزم بعدم إعادة تصدير أو نقل المخلفات لجهة ثالثة دون موافقة كتابية مسبقة.<br/>
        3. يلتزم بالاحتفاظ بسجلات دقيقة لعمليات المعالجة والتدوير لمدة لا تقل عن 5 سنوات.<br/>
        4. يلتزم بإخطار الجهات المختصة فور اكتشاف أي مخالفات في المخلفات المستلمة.
      </div>
    </div>

    <div class="t-sec">
      <div class="t-sec-title">خامساً: المسؤولية والتعويضات</div>
      <div class="t-sec-body">
        1. يتحمل كل طرف المسؤولية القانونية عن الأضرار الناتجة عن إخلاله بالتزاماته.<br/>
        2. في حالة التلوث البيئي، تتضامن الأطراف المتسببة في تحمل تكاليف المعالجة والتعويض.<br/>
        3. لا تتحمل منصة iRecycle أي مسؤولية قانونية أو مالية عن العمليات أو البيانات المدخلة.<br/>
        4. تقتصر مسؤولية المنصة على توفير الأدوات الرقمية للتوثيق والتتبع فقط.
      </div>
    </div>

    <div class="t-sec">
      <div class="t-sec-title">سادساً: حماية البيانات والخصوصية</div>
      <div class="t-sec-body">
        1. تُعامل جميع البيانات بسرية تامة ولا يُفصح عنها إلا للجهات الرقابية المختصة.<br/>
        2. يحق للجهات الرقابية (وزارة البيئة، WMRA) الاطلاع على البيان في أي وقت.<br/>
        3. يوافق الأطراف على حفظ نسخة رقمية على منصة iRecycle لأغراض التوثيق والتتبع.
      </div>
    </div>
  </div>

  <!-- Page 2 Verification -->
  <div class="verify-row">
    <div class="verify-cell" style="width:72px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent('https://irecycle21.lovable.app/terms')}&bgcolor=ffffff&color=222222" class="qr-img" style="width:56px;height:56px;" alt="QR"/>
      <div style="font-size:6px;color:#888;margin-top:2px;">QR الشروط</div>
    </div>
    <div class="verify-cell" style="width:auto;">
      <div style="font-size:7px;color:#888;">رمز مصادقة الشروط والأحكام</div>
      <div class="v-code">TRM-${verificationCode}</div>
      <img src="https://barcodeapi.org/api/128/${encodeURIComponent('TRM-' + verificationCode)}" class="barcode-img" alt="Barcode"/>
    </div>
    <div class="verify-cell" style="width:72px;">
      <div class="stamp-circle">
        <div style="font-size:6px;font-weight:700;">iRecycle</div>
        <div style="font-size:5px;color:#888;">شروط وأحكام</div>
        <div style="font-size:5px;">${dateNow}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="r">الشروط والأحكام — ملحق ببيان الشحنة رقم <strong>${v(form.shipment_number)}</strong> — صفحة 2 من 2 — جميع الحقوق محفوظة © iRecycle ${new Date().getFullYear()}</div>
    <div class="l">${dateNow}</div>
  </div>

</div>

</body>
</html>`;
}

export async function generateManualShipmentPDF(form: ManualShipmentData, options?: PdfOptions) {
  const htmlContent = generateFullHTML(form, options);
  
  const { PrintService } = await import('@/services/documentService');
  PrintService.printHTML(htmlContent, { title: 'نموذج شحنة يدوي' });
}

/**
 * Generate PDF as Blob for uploading/sending via WhatsApp
 */
export async function generateManualShipmentPDFBlob(form: ManualShipmentData, options?: PdfOptions): Promise<Blob | null> {
  try {
    const htmlContent = generateFullHTML(form, options);
    
    // Create hidden container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.background = 'white';
    container.style.zIndex = '-1';
    document.body.appendChild(container);

    // Create iframe for isolated rendering
    const iframe = document.createElement('iframe');
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = 'none';
    container.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(container);
      return null;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Wait for fonts and content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Use unified PDFService for consistent A4 output
    const { PDFService } = await import('@/services/documentService');
    const pdf = await PDFService.generate(doc.body, {
      orientation: 'portrait',
      format: 'a4',
      scale: 2,
    });

    document.body.removeChild(container);
    return pdf.output('blob');
  } catch (err) {
    console.error('[ManualShipmentPDF] Blob generation failed:', err);
    return null;
  }
}
