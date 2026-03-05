import { ManualShipmentData } from '@/hooks/useManualShipmentDraft';

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

function generateFullHTML(form: ManualShipmentData): string {
  const shipTypeLabel = form.shipment_type === 'urgent' ? 'عاجلة' : form.shipment_type === 'scheduled' ? 'مجدولة' : 'عادية';
  const destTypeLabel = form.destination_type === 'disposal' ? 'تخلص نهائي' : 'إعادة تدوير';
  const destSectionTitle = form.destination_type === 'disposal' ? 'جهة التخلص النهائي' : 'جهة إعادة التدوير';
  const dateNow = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const verificationCode = `iRC-${(form.shipment_number || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const qrUrl = encodeURIComponent(`https://irecycle21.lovable.app/verify/${verificationCode}`);

  const partyRows = (name: string, addr: string, phone: string, email: string, lic: string, cr: string, tax: string, rep: string) => `
    <tr><td class="lbl">الاسم</td><td class="val">${v(name)}</td></tr>
    <tr><td class="lbl">العنوان</td><td class="val">${v(addr)}</td></tr>
    <tr><td class="lbl">الهاتف</td><td class="val">${v(phone)}</td></tr>
    <tr><td class="lbl">البريد الإلكتروني</td><td class="val">${v(email)}</td></tr>
    <tr><td class="lbl">رقم الترخيص</td><td class="val">${v(lic)}</td></tr>
    <tr><td class="lbl">السجل التجاري</td><td class="val">${v(cr)}</td></tr>
    <tr><td class="lbl">الرقم الضريبي</td><td class="val">${v(tax)}</td></tr>
    <tr><td class="lbl">الممثل القانوني</td><td class="val">${v(rep)}</td></tr>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>بيان شحنة - ${v(form.shipment_number)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  @page { size: A4; margin: 12mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 11px;
    color: #1e293b;
    direction: rtl;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 0; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* Header */
  .header { border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 14px; }
  .header-top { display: table; width: 100%; }
  .header-right { display: table-cell; vertical-align: top; }
  .header-left { display: table-cell; vertical-align: top; text-align: left; width: 160px; font-size: 10px; color: #64748b; }
  .logo-area { display: table; }
  .logo-icon { display: table-cell; vertical-align: middle; width: 50px; height: 50px; background: #059669; border-radius: 12px; text-align: center; color: #fff; font-size: 26px; font-weight: 900; line-height: 50px; }
  .logo-text { display: table-cell; vertical-align: middle; padding-right: 10px; }
  .logo-text h1 { font-size: 20px; color: #059669; font-weight: 800; }
  .logo-text p { font-size: 11px; color: #64748b; }

  .badges { margin-top: 8px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; margin-left: 6px; }
  .badge-green { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  .badge-blue { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
  .badge-red { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
  .badge-orange { background: #fff7ed; border: 1px solid #fed7aa; color: #ea580c; }

  /* Sections */
  .section { margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  .section-head { padding: 5px 12px; color: #fff; font-size: 12px; font-weight: 700; }
  .bg-blue { background: #0369a1; }
  .bg-green { background: #059669; }
  .bg-purple { background: #7c3aed; }
  .bg-red { background: #dc2626; }
  .bg-amber { background: #ca8a04; }
  .bg-cyan { background: #0891b2; }
  .bg-brown { background: #b45309; }
  .bg-gray { background: #6b7280; }
  .bg-dark { background: #1e293b; }

  table.data { width: 100%; border-collapse: collapse; }
  table.data td { padding: 4px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  table.data td.lbl { font-weight: 700; color: #475569; width: 35%; text-align: right; }
  table.data td.val { color: #1e293b; text-align: right; }

  .two-col { display: table; width: 100%; }
  .two-col .col { display: table-cell; width: 50%; vertical-align: top; }
  .two-col .col:first-child { padding-left: 5px; }
  .two-col .col:last-child { padding-right: 5px; }

  /* Logistics */
  .logistics-grid { display: table; width: 100%; }
  .logistics-cell { display: table-cell; width: 50%; padding: 8px 12px; vertical-align: top; }
  .logistics-cell + .logistics-cell { border-right: 1px solid #e2e8f0; }
  .logistics-label { font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
  .logistics-value { font-size: 11px; font-weight: 600; }
  .logistics-date { font-size: 10px; color: #64748b; margin-top: 2px; }

  /* Signatures */
  .sig-table { width: 100%; border-collapse: collapse; }
  .sig-table td { width: 33.33%; padding: 10px; text-align: center; vertical-align: top; }
  .sig-table td + td { border-right: 1px solid #e2e8f0; }
  .sig-title { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
  .sig-box { height: 50px; border: 1px dashed #cbd5e1; border-radius: 6px; margin: 8px auto; display: block; }
  .sig-sub { border-top: 1px solid #cbd5e1; padding-top: 4px; font-size: 9px; color: #94a3b8; }

  /* Declarations */
  .decl { padding: 10px 14px; font-size: 9.5px; line-height: 1.9; color: #334155; }
  .decl-title { font-weight: 700; margin-bottom: 2px; }
  .decl-warn { padding: 6px 10px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; font-size: 9px; color: #92400e; margin-top: 8px; }

  /* Verification */
  .verify-grid { display: table; width: 100%; }
  .verify-cell { display: table-cell; vertical-align: middle; padding: 10px; text-align: center; }
  .verify-cell.main { width: auto; }
  .qr-img { width: 78px; height: 78px; border: 2px solid #e2e8f0; border-radius: 6px; }
  .barcode-img { height: 30px; max-width: 200px; margin-top: 6px; }
  .verify-code { font-size: 13px; font-weight: 900; letter-spacing: 2px; font-family: monospace; }
  .stamp { width: 68px; height: 68px; border: 2px solid #059669; border-radius: 50%; display: inline-block; line-height: 1.2; padding-top: 12px; }
  .stamp-dark { border-color: #1e293b; }

  /* Footer */
  .footer { margin-top: 10px; padding-top: 8px; border-top: 2px solid #059669; display: table; width: 100%; font-size: 7px; color: #94a3b8; }
  .footer-right { display: table-cell; vertical-align: middle; }
  .footer-left { display: table-cell; vertical-align: middle; text-align: left; width: 120px; }
  .footer-dark { border-top-color: #1e293b; }

  /* Terms */
  .terms-content { font-size: 9.5px; line-height: 2; color: #334155; }
  .terms-notice { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; font-size: 9px; color: #166534; font-weight: 600; text-align: center; }
  .terms-section { margin-bottom: 10px; }
  .terms-section-title { font-weight: 700; font-size: 11px; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
  .terms-section-body { padding: 0 8px; }

  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>

<!-- ============ PAGE 1: SHIPMENT MANIFEST ============ -->
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="header-right">
        <div class="logo-area">
          <div class="logo-icon">♻</div>
          <div class="logo-text">
            <h1>بيان شحنة مخلفات</h1>
            <p>Waste Shipment Manifest</p>
          </div>
        </div>
        <div class="badges">
          <span class="badge badge-green">رقم: ${v(form.shipment_number)}</span>
          <span class="badge badge-blue">${shipTypeLabel}</span>
          <span class="badge ${form.hazard_level === 'highly_hazardous' ? 'badge-red' : form.hazard_level === 'hazardous' ? 'badge-orange' : 'badge-green'}">${hazardLabels[form.hazard_level] || 'غير محدد'}</span>
        </div>
      </div>
      <div class="header-left">
        <div><strong>التاريخ:</strong> ${dateNow}</div>
        <div><strong>الوقت:</strong> ${timeNow}</div>
        <div><strong>الوجهة:</strong> ${destTypeLabel}</div>
        <div style="margin-top:4px;padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;text-align:center;font-size:9px;">وثيقة رسمية</div>
      </div>
    </div>
  </div>

  <!-- GENERATOR + TRANSPORTER (2 columns) -->
  <div class="two-col">
    <div class="col">
      <div class="section">
        <div class="section-head bg-blue">المولّد / Generator</div>
        <table class="data">${partyRows(form.generator_name, form.generator_address, form.generator_phone, form.generator_email, form.generator_license, form.generator_commercial_register, form.generator_tax_id, form.generator_representative)}</table>
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-head bg-green">الناقل / Transporter</div>
        <table class="data">${partyRows(form.transporter_name, form.transporter_address, form.transporter_phone, form.transporter_email, form.transporter_license, form.transporter_commercial_register, form.transporter_tax_id, form.transporter_representative)}</table>
      </div>
    </div>
  </div>

  <!-- DESTINATION (full width) -->
  <div class="section">
    <div class="section-head bg-purple">${destSectionTitle} / Destination</div>
    <table class="data">${partyRows(form.destination_name, form.destination_address, form.destination_phone, form.destination_email, form.destination_license, form.destination_commercial_register, form.destination_tax_id, form.destination_representative)}</table>
  </div>

  <!-- WASTE + DRIVER (2 columns) -->
  <div class="two-col">
    <div class="col">
      <div class="section">
        <div class="section-head bg-red">بيانات المخلفات</div>
        <table class="data">
          <tr><td class="lbl">نوع المخلف</td><td class="val">${v(wasteTypeLabels[form.waste_type] || form.waste_type)}</td></tr>
          <tr><td class="lbl">الوصف</td><td class="val">${v(form.waste_description)}</td></tr>
          <tr><td class="lbl">مستوى الخطورة</td><td class="val">${v(hazardLabels[form.hazard_level] || form.hazard_level)}</td></tr>
          <tr><td class="lbl">الكمية</td><td class="val">${form.quantity || '—'} ${unitLabels[form.unit] || form.unit || ''}</td></tr>
          <tr><td class="lbl">طريقة المعالجة</td><td class="val">${v(disposalLabels[form.disposal_method] || form.disposal_method)}</td></tr>
        </table>
      </div>
    </div>
    <div class="col">
      <div class="section">
        <div class="section-head bg-amber">السائق والمركبة</div>
        <table class="data">
          <tr><td class="lbl">اسم السائق</td><td class="val">${v(form.driver_name)}</td></tr>
          <tr><td class="lbl">هاتف السائق</td><td class="val">${v(form.driver_phone)}</td></tr>
          <tr><td class="lbl">لوحة المركبة</td><td class="val">${v(form.vehicle_plate)}</td></tr>
          <tr><td class="lbl">نوع المركبة</td><td class="val">${v(form.vehicle_type)}</td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- LOGISTICS -->
  <div class="section">
    <div class="section-head bg-cyan">التحميل والتسليم / Logistics</div>
    <div class="logistics-grid">
      <div class="logistics-cell">
        <div class="logistics-label">موقع التحميل</div>
        <div class="logistics-value">${v(form.pickup_address)}</div>
        <div class="logistics-date">التاريخ: ${v(form.pickup_date)}</div>
      </div>
      <div class="logistics-cell">
        <div class="logistics-label">موقع التسليم</div>
        <div class="logistics-value">${v(form.delivery_address)}</div>
        <div class="logistics-date">التاريخ: ${v(form.delivery_date)}</div>
      </div>
    </div>
  </div>

  ${form.price ? `
  <div class="section">
    <div class="section-head bg-brown">البيانات المالية</div>
    <table class="data">
      <tr><td class="lbl">السعر</td><td class="val">${v(form.price)}</td></tr>
      <tr><td class="lbl">ملاحظات</td><td class="val">${v(form.price_notes)}</td></tr>
    </table>
  </div>` : ''}

  ${(form.notes || form.special_instructions) ? `
  <div class="section">
    <div class="section-head bg-gray">ملاحظات وتعليمات</div>
    <table class="data">
      ${form.notes ? `<tr><td class="lbl">ملاحظات عامة</td><td class="val">${v(form.notes)}</td></tr>` : ''}
      ${form.special_instructions ? `<tr><td class="lbl">تعليمات خاصة</td><td class="val">${v(form.special_instructions)}</td></tr>` : ''}
    </table>
  </div>` : ''}

  <!-- DECLARATIONS -->
  <div class="section">
    <div class="section-head bg-dark">الإقرارات القانونية والبيئية</div>
    <div class="decl">
      <div style="margin-bottom:6px;">
        <span class="decl-title" style="color:#0369a1;">إقرار المولّد:</span>
        يُقر المولّد بأن المخلفات المذكورة أعلاه ناتجة عن نشاطه وأنه المسؤول الأول عن صحة ودقة جميع البيانات الواردة في هذا البيان، وأنه ملتزم بيئياً وفقاً لأحكام القانون رقم 202 لسنة 2020 والقانون رقم 4 لسنة 1994 ولوائحهما التنفيذية.
      </div>
      <div style="margin-bottom:6px;">
        <span class="decl-title" style="color:#059669;">إقرار الناقل:</span>
        يُقر الناقل بأنه طبّق جميع المعايير القانونية والبيئية والتزم بكافة الاشتراطات الصادرة عن وزارة البيئة وجهاز تنظيم إدارة المخلفات (WMRA)، ويتحمل كامل المسؤولية عن سلامة المخلفات خلال فترة النقل.
      </div>
      <div style="margin-bottom:6px;">
        <span class="decl-title" style="color:#7c3aed;">إقرار المستقبل:</span>
        يُقر المستقبل بأنه استلم المخلفات وسيطبق كافة المعايير البيئية والتنظيمية في عمليات ${form.destination_type === 'disposal' ? 'التخلص النهائي' : 'إعادة التدوير'} وفقاً لترخيصه ومعايير WMRA.
      </div>
      <div class="decl-warn">
        <strong>إخلاء مسؤولية المنصة:</strong> منصة iRecycle أداة رقمية للتوثيق والتتبع فقط، ولا تتحمل أي مسؤولية قانونية عن محتوى البيانات أو العمليات. المسؤولية الكاملة تقع على الأطراف الموقّعة.
      </div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="section">
    <div class="section-head bg-green">التوقيعات والأختام / Signatures & Stamps</div>
    <table class="sig-table">
      <tr>
        <td>
          <div class="sig-title" style="color:#0369a1;">المولّد</div>
          <div style="font-size:9px;color:#94a3b8;">Generator</div>
          <div class="sig-box"></div>
          <div class="sig-sub">الاسم والتوقيع والختم</div>
        </td>
        <td>
          <div class="sig-title" style="color:#059669;">الناقل</div>
          <div style="font-size:9px;color:#94a3b8;">Transporter</div>
          <div class="sig-box"></div>
          <div class="sig-sub">الاسم والتوقيع والختم</div>
        </td>
        <td>
          <div class="sig-title" style="color:#7c3aed;">المستقبل</div>
          <div style="font-size:9px;color:#94a3b8;">Receiver</div>
          <div class="sig-box"></div>
          <div class="sig-sub">الاسم والتوقيع والختم</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- VERIFICATION CODES -->
  <div class="section">
    <div class="section-head bg-green">رموز التحقق والمصادقة</div>
    <div class="verify-grid">
      <div class="verify-cell" style="width:90px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrUrl}&bgcolor=ffffff&color=059669" class="qr-img" alt="QR"/>
        <div style="font-size:7px;color:#94a3b8;margin-top:3px;">QR Code</div>
      </div>
      <div class="verify-cell main">
        <div style="font-size:8px;color:#64748b;margin-bottom:4px;">رمز التحقق</div>
        <div class="verify-code" style="color:#059669;">${verificationCode}</div>
        <img src="https://barcodeapi.org/api/128/${encodeURIComponent(verificationCode)}" class="barcode-img" alt="Barcode"/>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">باركود</div>
      </div>
      <div class="verify-cell" style="width:90px;">
        <div class="stamp">
          <div style="font-size:7px;color:#059669;font-weight:700;">♻ iRecycle</div>
          <div style="font-size:5px;color:#94a3b8;">مصدّق - Certified</div>
          <div style="font-size:5px;color:#059669;">${dateNow}</div>
        </div>
        <div style="font-size:7px;color:#94a3b8;margin-top:3px;">ختم المنصة</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-right">
      <div>هذا المستند صادر إلكترونياً من منصة <strong style="color:#059669;">iRecycle</strong> لإدارة المخلفات</div>
      <div>صفحة 1 من 2 — بيان الشحنة | الشروط والأحكام في الصفحة التالية</div>
    </div>
    <div class="footer-left">
      <div>${dateNow} — ${timeNow}</div>
      <div style="margin-top:2px;padding:2px 8px;background:#f0fdf4;border-radius:4px;color:#059669;font-weight:600;font-size:6px;text-align:center;">Powered by iRecycle ♻</div>
    </div>
  </div>

</div>

<!-- ============ PAGE 2: TERMS & CONDITIONS ============ -->
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-top">
      <div class="header-right">
        <div class="logo-area">
          <div class="logo-icon">♻</div>
          <div class="logo-text">
            <h1 style="font-size:17px;">الشروط والأحكام والسياسات</h1>
            <p>Terms, Conditions & Policies</p>
          </div>
        </div>
      </div>
      <div class="header-left">
        <div>ملحق ببيان شحنة رقم:</div>
        <div><strong style="color:#059669;">${v(form.shipment_number)}</strong></div>
        <div>${dateNow}</div>
      </div>
    </div>
  </div>

  <div class="terms-content">
    <div class="terms-notice">
      بتوقيع الأطراف على بيان الشحنة (الصفحة الأولى)، يُعتبر ذلك موافقة صريحة وكاملة على جميع الشروط والأحكام الواردة أدناه
    </div>

    <div class="terms-section">
      <div class="terms-section-title" style="color:#0369a1;">أولاً: الأحكام العامة</div>
      <div class="terms-section-body">
        1. يُعد هذا البيان وثيقة رسمية ملزمة قانونياً لجميع الأطراف الموقعة عليه وفقاً للقوانين المصرية السارية.<br/>
        2. جميع البيانات المدونة في هذا البيان تُعتبر صحيحة وملزمة ما لم يثبت خلاف ذلك بالأدلة المادية.<br/>
        3. يخضع هذا البيان لأحكام القانون رقم 202 لسنة 2020 بشأن تنظيم إدارة المخلفات ولائحته التنفيذية.<br/>
        4. يخضع هذا البيان لأحكام القانون رقم 4 لسنة 1994 بشأن حماية البيئة المعدّل بالقانون رقم 9 لسنة 2009.<br/>
        5. أي نزاع ينشأ عن هذا البيان تختص به المحاكم المصرية المختصة.
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-section-title" style="color:#059669;">ثانياً: التزامات المولّد</div>
      <div class="terms-section-body">
        1. يلتزم المولّد بالتصنيف الدقيق للمخلفات وفقاً لجداول التصنيف المعتمدة من جهاز تنظيم إدارة المخلفات (WMRA).<br/>
        2. يتحمل المولّد المسؤولية الكاملة عن صحة بيانات الكميات والأوزان والأنواع المدونة في هذا البيان.<br/>
        3. يلتزم المولّد بتغليف وتعبئة المخلفات وفقاً للمواصفات الفنية المعتمدة قبل تسليمها للناقل.<br/>
        4. يلتزم المولّد بالحصول على جميع التراخيص والتصاريح اللازمة لتوليد ونقل المخلفات.<br/>
        5. يتحمل المولّد تكاليف أي أضرار بيئية ناتجة عن عدم دقة البيانات المقدمة.
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-section-title" style="color:#ca8a04;">ثالثاً: التزامات الناقل</div>
      <div class="terms-section-body">
        1. يلتزم الناقل بنقل المخلفات في مركبات مرخصة ومجهزة وفقاً لاشتراطات وزارة البيئة و WMRA.<br/>
        2. يتحمل الناقل المسؤولية الكاملة عن سلامة المخلفات من لحظة الاستلام حتى التسليم للجهة المستقبلة.<br/>
        3. يلتزم الناقل بالمسار المحدد وعدم الانحراف عنه إلا في حالات الضرورة القصوى مع التوثيق.<br/>
        4. يلتزم الناقل بالإبلاغ الفوري عن أي حوادث أو تسربات أثناء عملية النقل.<br/>
        5. يحظر على الناقل خلط أنواع مختلفة من المخلفات أثناء النقل دون تصريح مسبق.
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-section-title" style="color:#7c3aed;">رابعاً: التزامات المستقبل (${destSectionTitle})</div>
      <div class="terms-section-body">
        1. يلتزم المستقبل بمعالجة المخلفات وفقاً للطريقة المحددة في هذا البيان وترخيصه الساري.<br/>
        2. يلتزم المستقبل بعدم إعادة تصدير أو نقل المخلفات لجهة ثالثة دون موافقة كتابية مسبقة.<br/>
        3. يلتزم المستقبل بالاحتفاظ بسجلات دقيقة لعمليات المعالجة والتدوير لمدة لا تقل عن 5 سنوات.<br/>
        4. يلتزم المستقبل بإخطار الجهات المختصة فور اكتشاف أي مخالفات في المخلفات المستلمة.
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-section-title" style="color:#dc2626;">خامساً: المسؤولية والتعويضات</div>
      <div class="terms-section-body">
        1. يتحمل كل طرف المسؤولية القانونية عن الأضرار الناتجة عن إخلاله بالتزاماته المنصوص عليها.<br/>
        2. في حالة التلوث البيئي، تتضامن الأطراف المتسببة في تحمل تكاليف المعالجة والتعويض.<br/>
        3. لا تتحمل منصة iRecycle أي مسؤولية قانونية أو مالية عن العمليات المادية أو البيانات المدخلة.<br/>
        4. تقتصر مسؤولية المنصة على توفير الأدوات الرقمية للتوثيق والتتبع فقط.
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-section-title" style="color:#6b7280;">سادساً: حماية البيانات والخصوصية</div>
      <div class="terms-section-body">
        1. تُعامل جميع البيانات الواردة في هذا البيان بسرية تامة ولا يُفصح عنها إلا للجهات الرقابية المختصة.<br/>
        2. يحق للجهات الرقابية (وزارة البيئة، WMRA) الاطلاع على هذا البيان وبياناته في أي وقت.<br/>
        3. يوافق الأطراف على حفظ نسخة رقمية من هذا البيان على منصة iRecycle لأغراض التوثيق والتتبع.
      </div>
    </div>
  </div>

  <!-- Page 2 Verification -->
  <div class="section">
    <div class="section-head bg-dark">مصادقة الشروط والأحكام</div>
    <div class="verify-grid">
      <div class="verify-cell" style="width:80px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://irecycle21.lovable.app/terms')}&bgcolor=ffffff&color=1e293b" class="qr-img" style="width:68px;height:68px;" alt="QR"/>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">QR الشروط</div>
      </div>
      <div class="verify-cell main">
        <div style="font-size:8px;color:#64748b;margin-bottom:4px;">رمز مصادقة الشروط</div>
        <div class="verify-code" style="color:#1e293b;">TRM-${verificationCode}</div>
        <img src="https://barcodeapi.org/api/128/${encodeURIComponent('TRM-' + verificationCode)}" class="barcode-img" alt="Barcode"/>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">باركود الشروط والأحكام</div>
      </div>
      <div class="verify-cell" style="width:80px;">
        <div class="stamp stamp-dark">
          <div style="font-size:6px;color:#1e293b;font-weight:700;">♻ iRecycle</div>
          <div style="font-size:5px;color:#94a3b8;">شروط وأحكام</div>
          <div style="font-size:5px;color:#1e293b;">${dateNow}</div>
        </div>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">ختم المنصة</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer footer-dark">
    <div class="footer-right">
      <div>الشروط والأحكام — ملحق ببيان الشحنة رقم <strong style="color:#059669;">${v(form.shipment_number)}</strong></div>
      <div>صفحة 2 من 2 — جميع الحقوق محفوظة © iRecycle ${new Date().getFullYear()}</div>
    </div>
    <div class="footer-left">
      <div>${dateNow} — ${timeNow}</div>
      <div style="margin-top:2px;padding:2px 8px;background:#f0fdf4;border-radius:4px;color:#059669;font-weight:600;font-size:6px;text-align:center;">Powered by iRecycle ♻</div>
    </div>
  </div>

</div>

</body>
</html>`;
}

export async function generateManualShipmentPDF(form: ManualShipmentData) {
  const htmlContent = generateFullHTML(form);

  // Open in new window for native browser print (perfect Arabic support)
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    // Fallback: use iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 1000);
    }
    return;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for fonts and images to load
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 800);
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    printWindow.print();
  }, 2000);
}
