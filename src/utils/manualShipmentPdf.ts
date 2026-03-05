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
    font-size: 8px;
    color: #222;
    direction: rtl;
    background: #fff;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 0; page-break-after: always; height: 277mm; overflow: hidden; position: relative; }
  .page:last-child { page-break-after: auto; }

  .header {
    text-align: center;
    border-bottom: 2px double #333;
    padding-bottom: 5px;
    margin-bottom: 6px;
  }
  .header h1 {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0;
    font-family: 'Cairo', sans-serif;
  }
  .header .subtitle {
    font-size: 8px;
    color: #555;
    font-style: italic;
  }
  .header-meta {
    display: table;
    width: 100%;
    margin-top: 3px;
    font-size: 7px;
    color: #444;
  }
  .header-meta .right { display: table-cell; text-align: right; }
  .header-meta .left { display: table-cell; text-align: left; }

  table.classic {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4px;
    font-size: 7.5px;
  }
  table.classic th {
    background: #f5f5f0;
    border: 1px solid #999;
    padding: 2px 6px;
    font-size: 8px;
    font-weight: 700;
    text-align: right;
    color: #1a1a1a;
    font-family: 'Cairo', sans-serif;
  }
  table.classic td {
    border: 1px solid #bbb;
    padding: 1.5px 6px;
    text-align: right;
    vertical-align: top;
  }
  table.classic td.k {
    background: #fafaf7;
    font-weight: 700;
    width: 28%;
    color: #333;
    font-family: 'Cairo', sans-serif;
    font-size: 7px;
  }

  .row { display: table; width: 100%; table-layout: fixed; }
  .row .cell { display: table-cell; vertical-align: top; }
  .row .cell:first-child { padding-left: 3px; }
  .row .cell:last-child { padding-right: 3px; }

  .sec-title {
    font-family: 'Cairo', sans-serif;
    font-size: 8.5px;
    font-weight: 700;
    color: #1a1a1a;
    border-bottom: 1px solid #999;
    padding-bottom: 1px;
    margin: 5px 0 3px;
  }

  .decl-block {
    border: 1px solid #bbb;
    padding: 3px 8px;
    margin-bottom: 4px;
    font-size: 7px;
    line-height: 1.6;
  }
  .decl-block .dt {
    font-weight: 700;
    font-family: 'Cairo', sans-serif;
    font-size: 7.5px;
    text-decoration: underline;
  }
  .decl-warn {
    border: 1px solid #b45309;
    background: #fffbeb;
    padding: 2px 6px;
    font-size: 6.5px;
    margin-top: 3px;
    text-align: center;
    color: #92400e;
  }

  .sig-row { display: table; width: 100%; margin-top: 4px; }
  .sig-cell { display: table-cell; width: 33.33%; text-align: center; vertical-align: top; padding: 2px 4px; }
  .sig-cell + .sig-cell { border-right: 1px solid #bbb; }
  .sig-label { font-family: 'Cairo', sans-serif; font-size: 8px; font-weight: 700; margin-bottom: 1px; }
  .sig-box { height: 30px; border-bottom: 1px solid #333; margin: 4px 16px 2px; }
  .sig-hint { font-size: 6px; color: #888; }

  .verify-row { display: table; width: 100%; border: 1px solid #bbb; margin-top: 4px; }
  .verify-cell { display: table-cell; vertical-align: middle; padding: 4px; text-align: center; }
  .qr-img { width: 52px; height: 52px; border: 1px solid #ccc; }
  .barcode-img { height: 20px; max-width: 160px; margin-top: 3px; }
  .v-code { font-family: 'Courier New', monospace; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
  .stamp-circle {
    width: 46px; height: 46px;
    border: 2px solid #333;
    border-radius: 50%;
    display: inline-block;
    line-height: 1.1;
    padding-top: 8px;
  }

  .footer {
    margin-top: 4px;
    padding-top: 3px;
    border-top: 1px solid #999;
    font-size: 6px;
    color: #888;
    display: table;
    width: 100%;
  }
  .footer .r { display: table-cell; text-align: right; }
  .footer .l { display: table-cell; text-align: left; width: 100px; }

  .terms-body { font-size: 7.5px; line-height: 1.7; }
  .terms-notice {
    border: 1px solid #333;
    padding: 3px 8px;
    text-align: center;
    font-size: 7.5px;
    font-weight: 700;
    margin-bottom: 6px;
    font-family: 'Cairo', sans-serif;
  }
  .t-sec { margin-bottom: 5px; }
  .t-sec-title {
    font-family: 'Cairo', sans-serif;
    font-weight: 700;
    font-size: 8.5px;
    border-bottom: 1px solid #bbb;
    padding-bottom: 1px;
    margin-bottom: 2px;
  }
  .t-sec-body { padding: 0 4px; font-size: 7px; }

  @media print {
    body { background: #fff; }
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
    <div class="verify-cell" style="width:60px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${qrUrl}&bgcolor=ffffff&color=222222" class="qr-img" alt="QR"/>
      <div style="font-size:5px;color:#888;margin-top:1px;">رمز QR</div>
    </div>
    <div class="verify-cell" style="width:auto;">
      <div style="font-size:6px;color:#888;">رمز التحقق الإلكتروني</div>
      <div class="v-code">${verificationCode}</div>
      <img src="https://barcodeapi.org/api/128/${encodeURIComponent(verificationCode)}" class="barcode-img" alt="Barcode"/>
    </div>
    <div class="verify-cell" style="width:56px;">
      <div class="stamp-circle">
        <div style="font-size:5px;font-weight:700;">iRecycle</div>
        <div style="font-size:4px;color:#888;">مصدّق</div>
        <div style="font-size:4px;">${dateNow}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="r">مستند صادر إلكترونياً من منصة <strong>iRecycle</strong> لإدارة المخلفات — صفحة 1 من 2 — يُرجى مراجعة الشروط والأحكام في الصفحة التالية</div>
    <div class="l">${dateNow}</div>
  </div>

</div>

<!-- ===== PAGE 2: TERMS & CONDITIONS ===== -->
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
    <div class="verify-cell" style="width:56px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent('https://irecycle21.lovable.app/terms')}&bgcolor=ffffff&color=222222" class="qr-img" style="width:44px;height:44px;" alt="QR"/>
      <div style="font-size:5px;color:#888;margin-top:1px;">QR الشروط</div>
    </div>
    <div class="verify-cell" style="width:auto;">
      <div style="font-size:6px;color:#888;">رمز مصادقة الشروط والأحكام</div>
      <div class="v-code">TRM-${verificationCode}</div>
      <img src="https://barcodeapi.org/api/128/${encodeURIComponent('TRM-' + verificationCode)}" class="barcode-img" alt="Barcode"/>
    </div>
    <div class="verify-cell" style="width:56px;">
      <div class="stamp-circle">
        <div style="font-size:5px;font-weight:700;">iRecycle</div>
        <div style="font-size:4px;color:#888;">شروط وأحكام</div>
        <div style="font-size:4px;">${dateNow}</div>
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

export async function generateManualShipmentPDF(form: ManualShipmentData) {
  const htmlContent = generateFullHTML(form);

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
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

  printWindow.onload = () => {
    setTimeout(() => { printWindow.print(); }, 800);
  };
  setTimeout(() => { printWindow.print(); }, 2000);
}
