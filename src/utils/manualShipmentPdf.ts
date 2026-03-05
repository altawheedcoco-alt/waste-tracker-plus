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
  return v || '-';
}

function generateHTML(form: ManualShipmentData): string {
  const shipTypeLabel = form.shipment_type === 'urgent' ? 'عاجلة' : form.shipment_type === 'scheduled' ? 'مجدولة' : 'عادية';
  const destTypeLabel = form.destination_type === 'disposal' ? 'تخلص' : 'تدوير';
  const destSectionTitle = form.destination_type === 'disposal' ? 'جهة التخلص' : 'جهة التدوير';

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:bold;text-align:right;width:35%;color:#374151;font-size:12px;">${label}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;font-size:12px;">${val(value)}</td>
    </tr>`;

  const section = (title: string, rows: string) => `
    <div style="margin-bottom:14px;">
      <div style="background:#059669;color:white;padding:7px 12px;font-size:13px;font-weight:bold;border-radius:4px 4px 0 0;">${title}</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;">
        ${rows}
      </table>
    </div>`;

  let html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<style>
  @page { size: A4; margin: 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size:12px; color:#1a1a1a; direction:rtl; padding:20px; background:white; }
</style></head><body>`;

  // Header
  html += `<div style="text-align:center;border-bottom:3px solid #059669;padding-bottom:12px;margin-bottom:16px;">
    <h1 style="font-size:22px;color:#059669;margin-bottom:4px;">♻ بيان شحنة / Shipment Manifest</h1>
    <div style="font-size:11px;color:#666;">التاريخ: ${new Date().toLocaleDateString('ar-EG')} | رقم الشحنة: ${val(form.shipment_number)}</div>
  </div>`;

  // Shipment Info
  html += section('بيانات الشحنة',
    row('رقم الشحنة', form.shipment_number) +
    row('نوع النقلة', shipTypeLabel) +
    row('الوجهة', destTypeLabel)
  );

  // Generator
  html += section('المولّد (Generator)',
    row('الاسم', form.generator_name) +
    row('العنوان', form.generator_address) +
    row('الهاتف', form.generator_phone) +
    row('البريد الإلكتروني', form.generator_email) +
    row('الترخيص', form.generator_license) +
    row('السجل التجاري', form.generator_commercial_register) +
    row('الرقم الضريبي', form.generator_tax_id) +
    row('الممثل القانوني', form.generator_representative)
  );

  // Transporter
  html += section('الناقل (Transporter)',
    row('الاسم', form.transporter_name) +
    row('العنوان', form.transporter_address) +
    row('الهاتف', form.transporter_phone) +
    row('البريد الإلكتروني', form.transporter_email) +
    row('الترخيص', form.transporter_license) +
    row('السجل التجاري', form.transporter_commercial_register) +
    row('الرقم الضريبي', form.transporter_tax_id) +
    row('الممثل القانوني', form.transporter_representative)
  );

  // Destination
  html += section(`${destSectionTitle} (Destination)`,
    row('الاسم', form.destination_name) +
    row('العنوان', form.destination_address) +
    row('الهاتف', form.destination_phone) +
    row('البريد الإلكتروني', form.destination_email) +
    row('الترخيص', form.destination_license) +
    row('السجل التجاري', form.destination_commercial_register) +
    row('الرقم الضريبي', form.destination_tax_id) +
    row('الممثل القانوني', form.destination_representative)
  );

  // Waste Details
  html += section('بيانات المخلفات',
    row('نوع المخلف', wasteTypeLabels[form.waste_type] || form.waste_type) +
    row('الوصف', form.waste_description) +
    row('مستوى الخطورة', hazardLabels[form.hazard_level] || form.hazard_level) +
    row('الكمية', `${form.quantity || '-'} ${unitLabels[form.unit] || form.unit || ''}`) +
    row('طريقة المعالجة', disposalLabels[form.disposal_method] || form.disposal_method)
  );

  // Driver & Vehicle
  html += section('السائق والمركبة',
    row('السائق', form.driver_name) +
    row('هاتف السائق', form.driver_phone) +
    row('لوحة المركبة', form.vehicle_plate) +
    row('نوع المركبة', form.vehicle_type)
  );

  // Logistics
  html += section('التحميل والتسليم',
    row('موقع التحميل', form.pickup_address) +
    row('موقع التسليم', form.delivery_address) +
    row('تاريخ التحميل', form.pickup_date) +
    row('تاريخ التسليم', form.delivery_date)
  );

  // Financial
  if (form.price) {
    html += section('البيانات المالية',
      row('السعر', form.price) +
      row('ملاحظات السعر', form.price_notes)
    );
  }

  // Notes
  if (form.notes || form.special_instructions) {
    let noteRows = '';
    if (form.notes) noteRows += row('ملاحظات عامة', form.notes);
    if (form.special_instructions) noteRows += row('تعليمات خاصة', form.special_instructions);
    html += section('ملاحظات', noteRows);
  }

  // Signature area
  html += `<div style="margin-top:24px;border-top:2px solid #059669;padding-top:16px;">
    <table style="width:100%;text-align:center;">
      <tr>
        <td style="width:33%;padding:10px;">
          <div style="font-weight:bold;font-size:12px;margin-bottom:30px;">المولّد</div>
          <div style="border-top:1px solid #999;padding-top:4px;font-size:10px;color:#666;">الاسم والتوقيع والختم</div>
        </td>
        <td style="width:33%;padding:10px;">
          <div style="font-weight:bold;font-size:12px;margin-bottom:30px;">الناقل</div>
          <div style="border-top:1px solid #999;padding-top:4px;font-size:10px;color:#666;">الاسم والتوقيع والختم</div>
        </td>
        <td style="width:33%;padding:10px;">
          <div style="font-weight:bold;font-size:12px;margin-bottom:30px;">المستقبل</div>
          <div style="border-top:1px solid #999;padding-top:4px;font-size:10px;color:#666;">الاسم والتوقيع والختم</div>
        </td>
      </tr>
    </table>
  </div>`;

  // Footer
  html += `<div style="margin-top:16px;text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e7eb;padding-top:8px;">
    تم الإنشاء بواسطة منصة iRecycle لإدارة المخلفات | ${new Date().toLocaleDateString('ar-EG')}
  </div>`;

  html += `</body></html>`;
  return html;
}

export async function generateManualShipmentPDF(form: ManualShipmentData) {
  // Create offscreen iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.width = '794px';
  iframe.style.height = '1123px';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error('Could not access iframe');

  const htmlContent = generateHTML(form);
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 500));

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
