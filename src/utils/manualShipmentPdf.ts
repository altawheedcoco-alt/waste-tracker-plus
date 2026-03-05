import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

function val(v: string | undefined | null): string {
  return v || '—';
}

function generateHTML(form: ManualShipmentData): string {
  const shipTypeLabel = form.shipment_type === 'urgent' ? 'عاجلة' : form.shipment_type === 'scheduled' ? 'مجدولة' : 'عادية';
  const destTypeLabel = form.destination_type === 'disposal' ? 'تخلص نهائي' : 'إعادة تدوير';
  const destSectionTitle = form.destination_type === 'disposal' ? 'جهة التخلص النهائي' : 'جهة إعادة التدوير';
  const dateNow = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const hazardClass = form.hazard_level === 'highly_hazardous' ? '#dc2626' : form.hazard_level === 'hazardous' ? '#ea580c' : '#16a34a';

  const row = (label: string, value: string, icon?: string) => `
    <tr>
      <td style="padding:5px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;text-align:right;width:38%;color:#475569;font-size:11px;white-space:nowrap;">
        ${icon ? `<span style="margin-left:4px;">${icon}</span>` : ''}${label}
      </td>
      <td style="padding:5px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:#1e293b;font-size:11.5px;font-weight:500;">${val(value)}</td>
    </tr>`;

  const section = (title: string, icon: string, rows: string, color: string = '#059669') => `
    <div style="margin-bottom:12px;break-inside:avoid;">
      <div style="background:linear-gradient(135deg, ${color}, ${color}dd);color:white;padding:6px 14px;font-size:12px;font-weight:700;border-radius:6px 6px 0 0;display:flex;align-items:center;gap:6px;letter-spacing:0.3px;">
        <span style="font-size:14px;">${icon}</span>
        ${title}
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
        ${rows}
      </table>
    </div>`;

  let html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 11px;
    color: #1e293b;
    direction: rtl;
    padding: 0;
    background: white;
    width: 794px;
  }
  .page-container {
    padding: 24px 28px;
    position: relative;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 90px;
    color: rgba(5, 150, 105, 0.035);
    font-weight: 900;
    pointer-events: none;
    z-index: 0;
    letter-spacing: 8px;
  }
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
</style></head><body>
<div class="watermark">iRecycle</div>
<div class="page-container">`;

  // ===== HEADER =====
  html += `
  <div style="border-bottom:3px solid #059669;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div style="flex:1;text-align:right;">
      <div style="display:flex;align-items:center;gap:10px;justify-content:flex-start;">
        <div style="width:52px;height:52px;background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900;box-shadow:0 4px 12px rgba(5,150,105,0.3);">♻</div>
        <div>
          <h1 style="font-size:20px;color:#059669;margin:0;font-weight:800;letter-spacing:0.5px;">بيان شحنة مخلفات</h1>
          <div style="font-size:11px;color:#64748b;font-weight:500;">Waste Shipment Manifest</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:12px;flex-wrap:wrap;">
        <span style="background:#f0fdf4;border:1px solid #bbf7d0;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;color:#166534;">
          📋 رقم: ${val(form.shipment_number)}
        </span>
        <span style="background:#eff6ff;border:1px solid #bfdbfe;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;color:#1e40af;">
          🚛 ${shipTypeLabel}
        </span>
        <span style="background:${hazardClass}15;border:1px solid ${hazardClass}40;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;color:${hazardClass};">
          ⚠ ${hazardLabels[form.hazard_level] || 'غير محدد'}
        </span>
      </div>
    </div>
    <div style="text-align:left;font-size:10px;color:#94a3b8;line-height:1.8;min-width:140px;">
      <div><strong style="color:#64748b;">التاريخ:</strong> ${dateNow}</div>
      <div><strong style="color:#64748b;">الوقت:</strong> ${timeNow}</div>
      <div><strong style="color:#64748b;">الوجهة:</strong> ${destTypeLabel}</div>
      <div style="margin-top:4px;padding:3px 8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;text-align:center;font-size:9px;">
        وثيقة رسمية
      </div>
    </div>
  </div>`;

  // ===== PARTIES (2 columns) =====
  html += `<div class="two-col">`;

  // Generator
  html += section('المولّد / Generator', '🏭',
    row('الاسم', form.generator_name) +
    row('العنوان', form.generator_address) +
    row('الهاتف', form.generator_phone) +
    row('البريد', form.generator_email) +
    row('الترخيص', form.generator_license) +
    row('السجل التجاري', form.generator_commercial_register) +
    row('الرقم الضريبي', form.generator_tax_id) +
    row('الممثل القانوني', form.generator_representative),
    '#0369a1'
  );

  // Transporter
  html += section('الناقل / Transporter', '🚛',
    row('الاسم', form.transporter_name) +
    row('العنوان', form.transporter_address) +
    row('الهاتف', form.transporter_phone) +
    row('البريد', form.transporter_email) +
    row('الترخيص', form.transporter_license) +
    row('السجل التجاري', form.transporter_commercial_register) +
    row('الرقم الضريبي', form.transporter_tax_id) +
    row('الممثل القانوني', form.transporter_representative),
    '#059669'
  );

  html += `</div>`;

  // Destination (full width)
  html += section(`${destSectionTitle} / Destination`, '🏗️',
    row('الاسم', form.destination_name) +
    row('العنوان', form.destination_address) +
    row('الهاتف', form.destination_phone) +
    row('البريد', form.destination_email) +
    row('الترخيص', form.destination_license) +
    row('السجل التجاري', form.destination_commercial_register) +
    row('الرقم الضريبي', form.destination_tax_id) +
    row('الممثل القانوني', form.destination_representative),
    '#7c3aed'
  );

  // ===== WASTE + DRIVER (2 columns) =====
  html += `<div class="two-col">`;

  html += section('بيانات المخلفات', '☣️',
    row('نوع المخلف', wasteTypeLabels[form.waste_type] || form.waste_type) +
    row('الوصف', form.waste_description) +
    row('مستوى الخطورة', hazardLabels[form.hazard_level] || form.hazard_level) +
    row('الكمية', `${form.quantity || '—'} ${unitLabels[form.unit] || form.unit || ''}`) +
    row('طريقة المعالجة', disposalLabels[form.disposal_method] || form.disposal_method),
    '#dc2626'
  );

  html += section('السائق والمركبة', '👤',
    row('اسم السائق', form.driver_name) +
    row('هاتف السائق', form.driver_phone) +
    row('لوحة المركبة', form.vehicle_plate) +
    row('نوع المركبة', form.vehicle_type),
    '#ca8a04'
  );

  html += `</div>`;

  // ===== LOGISTICS (full width) =====
  html += section('التحميل والتسليم / Logistics', '📍',
    `<tr>
      <td colspan="2" style="padding:0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:50%;padding:6px 12px;border-left:1px solid #e2e8f0;border-bottom:1px solid #f0f0f0;vertical-align:top;">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">📦 موقع التحميل</div>
              <div style="font-size:11px;font-weight:600;color:#1e293b;">${val(form.pickup_address)}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px;">📅 ${val(form.pickup_date)}</div>
            </td>
            <td style="width:50%;padding:6px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">📬 موقع التسليم</div>
              <div style="font-size:11px;font-weight:600;color:#1e293b;">${val(form.delivery_address)}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px;">📅 ${val(form.delivery_date)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    '#0891b2'
  );

  // ===== FINANCIAL + NOTES =====
  if (form.price || form.notes || form.special_instructions) {
    html += `<div class="two-col">`;
    if (form.price) {
      html += section('البيانات المالية', '💰',
        row('السعر', form.price) +
        row('ملاحظات', form.price_notes),
        '#b45309'
      );
    }
    if (form.notes || form.special_instructions) {
      let noteRows = '';
      if (form.notes) noteRows += row('ملاحظات عامة', form.notes);
      if (form.special_instructions) noteRows += row('تعليمات خاصة', form.special_instructions);
      html += section('ملاحظات وتعليمات', '📝', noteRows, '#6b7280');
    }
    html += `</div>`;
  }

  // ===== SIGNATURE AREA =====
  html += `
  <div style="margin-top:18px;border:2px solid #059669;border-radius:8px;overflow:hidden;break-inside:avoid;">
    <div style="background:linear-gradient(135deg,#059669,#10b981);color:white;padding:6px 14px;font-size:12px;font-weight:700;text-align:center;letter-spacing:1px;">
      ✍️ التوقيعات والأختام / Signatures & Stamps
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:33.33%;padding:12px;text-align:center;border-left:1px solid #e2e8f0;">
          <div style="font-weight:700;font-size:12px;color:#0369a1;margin-bottom:6px;">🏭 المولّد</div>
          <div style="font-size:10px;color:#94a3b8;">Generator</div>
          <div style="height:55px;margin:8px 0;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:9px;color:#cbd5e1;">التوقيع هنا</span>
          </div>
          <div style="border-top:1px solid #cbd5e1;padding-top:4px;font-size:9px;color:#94a3b8;">الاسم والتوقيع والختم</div>
        </td>
        <td style="width:33.33%;padding:12px;text-align:center;border-left:1px solid #e2e8f0;">
          <div style="font-weight:700;font-size:12px;color:#059669;margin-bottom:6px;">🚛 الناقل</div>
          <div style="font-size:10px;color:#94a3b8;">Transporter</div>
          <div style="height:55px;margin:8px 0;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:9px;color:#cbd5e1;">التوقيع هنا</span>
          </div>
          <div style="border-top:1px solid #cbd5e1;padding-top:4px;font-size:9px;color:#94a3b8;">الاسم والتوقيع والختم</div>
        </td>
        <td style="width:33.33%;padding:12px;text-align:center;">
          <div style="font-weight:700;font-size:12px;color:#7c3aed;margin-bottom:6px;">🏗️ المستقبل</div>
          <div style="font-size:10px;color:#94a3b8;">Receiver</div>
          <div style="height:55px;margin:8px 0;border:1px dashed #cbd5e1;border-radius:6px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:9px;color:#cbd5e1;">التوقيع هنا</span>
          </div>
          <div style="border-top:1px solid #cbd5e1;padding-top:4px;font-size:9px;color:#94a3b8;">الاسم والتوقيع والختم</div>
        </td>
      </tr>
    </table>
  </div>`;

  // ===== LEGAL DECLARATIONS =====
  html += `
  <div style="margin-top:16px;border:1.5px solid #334155;border-radius:8px;overflow:hidden;break-inside:avoid;">
    <div style="background:linear-gradient(135deg,#1e293b,#334155);color:white;padding:6px 14px;font-size:11px;font-weight:700;text-align:center;letter-spacing:0.5px;">
      ⚖️ الإقرارات القانونية والبيئية / Legal & Environmental Declarations
    </div>
    <div style="padding:10px 14px;font-size:9.5px;line-height:1.9;color:#334155;">
      <div style="margin-bottom:8px;">
        <span style="font-weight:700;color:#0369a1;">🏭 إقرار المولّد (Generator Declaration):</span><br/>
        يُقر المولّد بأن المخلفات المذكورة أعلاه ناتجة عن نشاطه وأنه المسؤول الأول عن صحة ودقة جميع البيانات الواردة في هذا البيان، وأنه ملتزم بيئياً وفقاً لأحكام القانون رقم 202 لسنة 2020 بشأن تنظيم إدارة المخلفات والقانون رقم 4 لسنة 1994 بشأن البيئة ولوائحهما التنفيذية، ويتحمل كامل المسؤولية القانونية عن أي مخالفة أو بيانات غير صحيحة.
      </div>
      <div style="margin-bottom:8px;">
        <span style="font-weight:700;color:#059669;">🚛 إقرار الناقل (Transporter Declaration):</span><br/>
        يُقر الناقل بأنه طبّق جميع المعايير القانونية والبيئية المعمول بها في جمهورية مصر العربية أثناء عملية النقل، والتزم بكافة الاشتراطات الصادرة عن وزارة البيئة وجهاز تنظيم إدارة المخلفات (WMRA)، بما يشمل معايير السلامة والتغليف والتتبع، ويتحمل كامل المسؤولية عن سلامة المخلفات خلال فترة النقل حتى تسليمها للجهة المستقبلة.
      </div>
      <div style="margin-bottom:8px;">
        <span style="font-weight:700;color:#7c3aed;">🏗️ إقرار ${destSectionTitle} (Receiver Declaration):</span><br/>
        يُقر المستقبل بأنه استلم المخلفات المبيّنة أعلاه وأنه سيقوم بتطبيق كافة المعايير البيئية والتنظيمية في عمليات ${form.destination_type === 'disposal' ? 'التخلص النهائي' : 'إعادة التدوير'} وفقاً للترخيص الممنوح له، مع الالتزام بمعايير جهاز تنظيم إدارة المخلفات (WMRA) والقوانين البيئية السارية.
      </div>
      <div style="padding:6px 10px;background:#fef3c7;border:1px solid #fbbf24;border-radius:4px;font-size:9px;color:#92400e;">
        ⚠️ <strong>إخلاء مسؤولية المنصة:</strong> منصة iRecycle هي أداة رقمية لتسهيل التوثيق والتتبع فقط، ولا تتحمل أي مسؤولية قانونية عن محتوى البيانات المدخلة أو صحتها أو عن أي أضرار ناتجة عن العمليات المذكورة. المسؤولية الكاملة تقع على عاتق الأطراف الموقّعة أعلاه.
      </div>
    </div>
  </div>`;

  // ===== VERIFICATION CODES + FOOTER (Page 1) =====
  const verificationCode = `iRC-${(form.shipment_number || 'DRAFT').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;
  const qrData = encodeURIComponent(`https://irecycle21.lovable.app/verify/${verificationCode}`);
  const barcodeText = verificationCode;

  html += `
  <div style="margin-top:14px;border:1.5px solid #059669;border-radius:8px;overflow:hidden;break-inside:avoid;">
    <div style="background:linear-gradient(135deg,#059669,#047857);color:white;padding:5px 14px;font-size:10px;font-weight:700;text-align:center;">
      🔐 رموز التحقق والمصادقة / Verification & Authentication Codes
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;gap:12px;">
      <div style="text-align:center;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}&bgcolor=ffffff&color=059669" 
             style="width:80px;height:80px;border:2px solid #e2e8f0;border-radius:6px;" alt="QR"/>
        <div style="font-size:7px;color:#94a3b8;margin-top:3px;">QR Code</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:8px;color:#64748b;margin-bottom:4px;">رمز التحقق / Verification Code</div>
        <div style="font-size:14px;font-weight:900;color:#059669;letter-spacing:2px;font-family:monospace;">${verificationCode}</div>
        <div style="margin-top:6px;">
          <img src="https://barcodeapi.org/api/128/${encodeURIComponent(barcodeText)}" 
               style="height:30px;max-width:220px;" alt="Barcode"/>
        </div>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">Barcode / باركود</div>
      </div>
      <div style="text-align:center;min-width:80px;">
        <div style="width:70px;height:70px;border:2px solid #059669;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">
          <div style="text-align:center;line-height:1.2;">
            <div style="font-size:7px;color:#059669;font-weight:700;">♻ iRecycle</div>
            <div style="font-size:6px;color:#94a3b8;">مصدّق</div>
            <div style="font-size:6px;color:#94a3b8;">Certified</div>
            <div style="font-size:5px;color:#059669;margin-top:1px;">${dateNow}</div>
          </div>
        </div>
        <div style="font-size:7px;color:#94a3b8;margin-top:3px;">ختم المنصة</div>
      </div>
    </div>
  </div>`;

  html += `
  <div style="margin-top:10px;padding-top:8px;border-top:2px solid #059669;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:7px;color:#94a3b8;line-height:1.6;">
      <div>هذا المستند صادر إلكترونياً من منصة <strong style="color:#059669;">iRecycle</strong> لإدارة المخلفات</div>
      <div>صفحة 1 من 2 — بيان الشحنة | الشروط والأحكام في الصفحة التالية</div>
    </div>
    <div style="text-align:left;font-size:7px;color:#94a3b8;">
      <div>${dateNow} — ${timeNow}</div>
      <div style="margin-top:2px;padding:2px 8px;background:#f0fdf4;border-radius:4px;color:#059669;font-weight:600;font-size:6px;text-align:center;">
        Powered by iRecycle ♻
      </div>
    </div>
  </div>`;

  html += `</div>`; // end page 1 container

  // =========================================
  // ===== PAGE 2: TERMS & CONDITIONS =====
  // =========================================
  html += `
  <div style="page-break-before:always;padding:24px 28px;position:relative;">

  <!-- Page 2 Header -->
  <div style="border-bottom:3px solid #059669;padding-bottom:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:42px;height:42px;background:linear-gradient(135deg,#059669,#10b981);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:900;box-shadow:0 4px 12px rgba(5,150,105,0.3);">♻</div>
      <div>
        <h2 style="font-size:17px;color:#1e293b;margin:0;font-weight:800;">الشروط والأحكام والسياسات</h2>
        <div style="font-size:10px;color:#64748b;">Terms, Conditions & Policies</div>
      </div>
    </div>
    <div style="font-size:9px;color:#94a3b8;text-align:left;">
      <div>ملحق ببيان شحنة رقم: <strong style="color:#059669;">${val(form.shipment_number)}</strong></div>
      <div>${dateNow}</div>
    </div>
  </div>

  <div style="font-size:9.5px;line-height:2;color:#334155;">

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:9px;color:#166534;font-weight:600;text-align:center;">
      بتوقيع الأطراف على بيان الشحنة (الصفحة الأولى)، يُعتبر ذلك موافقة صريحة وكاملة على جميع الشروط والأحكام الواردة أدناه
    </div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:700;color:#0369a1;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">📋 أولاً: الأحكام العامة</div>
      <div style="padding:0 8px;">
        1. يُعد هذا البيان وثيقة رسمية ملزمة قانونياً لجميع الأطراف الموقعة عليه وفقاً للقوانين المصرية السارية.<br/>
        2. جميع البيانات المدونة في هذا البيان تُعتبر صحيحة وملزمة ما لم يثبت خلاف ذلك بالأدلة المادية.<br/>
        3. يخضع هذا البيان لأحكام القانون رقم 202 لسنة 2020 بشأن تنظيم إدارة المخلفات ولائحته التنفيذية.<br/>
        4. يخضع هذا البيان لأحكام القانون رقم 4 لسنة 1994 بشأن حماية البيئة المعدّل بالقانون رقم 9 لسنة 2009.<br/>
        5. أي نزاع ينشأ عن هذا البيان تختص به المحاكم المصرية المختصة.
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:700;color:#059669;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">🏭 ثانياً: التزامات المولّد</div>
      <div style="padding:0 8px;">
        1. يلتزم المولّد بالتصنيف الدقيق للمخلفات وفقاً لجداول التصنيف المعتمدة من جهاز تنظيم إدارة المخلفات (WMRA).<br/>
        2. يتحمل المولّد المسؤولية الكاملة عن صحة بيانات الكميات والأوزان والأنواع المدونة في هذا البيان.<br/>
        3. يلتزم المولّد بتغليف وتعبئة المخلفات وفقاً للمواصفات الفنية المعتمدة قبل تسليمها للناقل.<br/>
        4. يلتزم المولّد بالحصول على جميع التراخيص والتصاريح اللازمة لتوليد ونقل المخلفات.<br/>
        5. يتحمل المولّد تكاليف أي أضرار بيئية ناتجة عن عدم دقة البيانات المقدمة.
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:700;color:#ca8a04;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">🚛 ثالثاً: التزامات الناقل</div>
      <div style="padding:0 8px;">
        1. يلتزم الناقل بنقل المخلفات في مركبات مرخصة ومجهزة وفقاً لاشتراطات وزارة البيئة و WMRA.<br/>
        2. يتحمل الناقل المسؤولية الكاملة عن سلامة المخلفات من لحظة الاستلام حتى التسليم للجهة المستقبلة.<br/>
        3. يلتزم الناقل بالمسار المحدد وعدم الانحراف عنه إلا في حالات الضرورة القصوى مع التوثيق.<br/>
        4. يلتزم الناقل بالإبلاغ الفوري عن أي حوادث أو تسربات أثناء عملية النقل.<br/>
        5. يحظر على الناقل خلط أنواع مختلفة من المخلفات أثناء النقل دون تصريح مسبق.
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:700;color:#7c3aed;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">🏗️ رابعاً: التزامات المستقبل (${destSectionTitle})</div>
      <div style="padding:0 8px;">
        1. يلتزم المستقبل بمعالجة المخلفات وفقاً للطريقة المحددة في هذا البيان وترخيصه الساري.<br/>
        2. يلتزم المستقبل بعدم إعادة تصدير أو نقل المخلفات لجهة ثالثة دون موافقة كتابية مسبقة.<br/>
        3. يلتزم المستقبل بالاحتفاظ بسجلات دقيقة لعمليات المعالجة والتدوير لمدة لا تقل عن 5 سنوات.<br/>
        4. يلتزم المستقبل بإخطار الجهات المختصة فور اكتشاف أي مخالفات في المخلفات المستلمة.
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:700;color:#dc2626;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">⚠️ خامساً: المسؤولية والتعويضات</div>
      <div style="padding:0 8px;">
        1. يتحمل كل طرف المسؤولية القانونية عن الأضرار الناتجة عن إخلاله بالتزاماته المنصوص عليها.<br/>
        2. في حالة التلوث البيئي، تتضامن الأطراف المتسببة في تحمل تكاليف المعالجة والتعويض.<br/>
        3. لا تتحمل منصة iRecycle أي مسؤولية قانونية أو مالية عن العمليات المادية أو البيانات المدخلة.<br/>
        4. تقتصر مسؤولية المنصة على توفير الأدوات الرقمية للتوثيق والتتبع فقط.
      </div>
    </div>

    <div style="margin-bottom:10px;">
      <div style="font-weight:700;color:#6b7280;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">🔒 سادساً: حماية البيانات والخصوصية</div>
      <div style="padding:0 8px;">
        1. تُعامل جميع البيانات الواردة في هذا البيان بسرية تامة ولا يُفصح عنها إلا للجهات الرقابية المختصة.<br/>
        2. يحق للجهات الرقابية (وزارة البيئة، WMRA) الاطلاع على هذا البيان وبياناته في أي وقت.<br/>
        3. يوافق الأطراف على حفظ نسخة رقمية من هذا البيان على منصة iRecycle لأغراض التوثيق والتتبع.
      </div>
    </div>

  </div>

  <!-- Page 2 Verification Codes -->
  <div style="margin-top:12px;border:1.5px solid #1e293b;border-radius:8px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e293b,#334155);color:white;padding:5px 14px;font-size:10px;font-weight:700;text-align:center;">
      🔐 مصادقة الشروط والأحكام / Terms Authentication
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;gap:12px;">
      <div style="text-align:center;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent('https://irecycle21.lovable.app/terms')}&bgcolor=ffffff&color=1e293b" 
             style="width:70px;height:70px;border:2px solid #e2e8f0;border-radius:6px;" alt="QR"/>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">QR الشروط</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:8px;color:#64748b;margin-bottom:4px;">رمز مصادقة الشروط / Terms Auth Code</div>
        <div style="font-size:13px;font-weight:900;color:#1e293b;letter-spacing:2px;font-family:monospace;">TRM-${verificationCode}</div>
        <div style="margin-top:6px;">
          <img src="https://barcodeapi.org/api/128/${encodeURIComponent('TRM-' + barcodeText)}" 
               style="height:28px;max-width:200px;" alt="Barcode"/>
        </div>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">باركود الشروط والأحكام</div>
      </div>
      <div style="text-align:center;min-width:70px;">
        <div style="width:65px;height:65px;border:2px solid #1e293b;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">
          <div style="text-align:center;line-height:1.2;">
            <div style="font-size:6px;color:#1e293b;font-weight:700;">♻ iRecycle</div>
            <div style="font-size:5px;color:#94a3b8;">شروط وأحكام</div>
            <div style="font-size:5px;color:#94a3b8;">Terms</div>
            <div style="font-size:5px;color:#1e293b;margin-top:1px;">${dateNow}</div>
          </div>
        </div>
        <div style="font-size:7px;color:#94a3b8;margin-top:2px;">ختم المنصة</div>
      </div>
    </div>
  </div>

  <!-- Page 2 Footer -->
  <div style="margin-top:10px;padding-top:8px;border-top:2px solid #1e293b;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:7px;color:#94a3b8;line-height:1.6;">
      <div>الشروط والأحكام — ملحق ببيان الشحنة رقم <strong style="color:#059669;">${val(form.shipment_number)}</strong></div>
      <div>صفحة 2 من 2 — جميع الحقوق محفوظة © iRecycle ${new Date().getFullYear()}</div>
    </div>
    <div style="text-align:left;font-size:7px;color:#94a3b8;">
      <div>${dateNow} — ${timeNow}</div>
      <div style="margin-top:2px;padding:2px 8px;background:#f0fdf4;border-radius:4px;color:#059669;font-weight:600;font-size:6px;text-align:center;">
        Powered by iRecycle ♻
      </div>
    </div>
  </div>

  </div>

  </body></html>`;
  return html;
}

export async function generateManualShipmentPDF(form: ManualShipmentData) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.width = '794px';
  iframe.style.height = '4000px'; // taller for 2 pages
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error('Could not access iframe');

  const htmlContent = generateHTML(form);
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for images (QR, barcode) to load
  await new Promise(resolve => setTimeout(resolve, 1500));

  const canvas = await html2canvas(iframeDoc.body, {
    scale: 2,
    useCORS: true,
    logging: false,
    width: 794,
    windowWidth: 794,
    backgroundColor: '#ffffff',
  });

  document.body.removeChild(iframe);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = -(imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const fileName = form.shipment_number
    ? `shipment-${form.shipment_number}.pdf`
    : `shipment-draft-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(fileName);
}
