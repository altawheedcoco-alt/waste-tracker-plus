import jsPDF from 'jspdf';
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

export function generateManualShipmentPDF(form: ManualShipmentData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register Arabic-compatible font fallback
  doc.setFont('helvetica');
  
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addTitle = (text: string) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += 10;
  };

  const addSectionHeader = (text: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, contentWidth, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(text, pageWidth - margin, y, { align: 'right' });
    y += 10;
  };

  const addRow = (label: string, value: string) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', margin + 5, y);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', pageWidth - margin, y, { align: 'right' });
    y += 7;
  };

  const addLine = () => {
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header
  addTitle('Shipment Manifest / نموذج شحنة');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - margin, y, { align: 'right' });
  y += 8;
  addLine();

  // Shipment Info
  addSectionHeader('Shipment Info / بيانات الشحنة');
  addRow('Shipment No / رقم الشحنة', form.shipment_number);
  addRow('Type / نوع النقلة', form.shipment_type === 'urgent' ? 'Urgent / عاجلة' : form.shipment_type === 'scheduled' ? 'Scheduled / مجدولة' : 'Regular / عادية');
  addRow('Destination / الوجهة', form.destination_type === 'disposal' ? 'Disposal / تخلص' : 'Recycling / تدوير');
  y += 3;

  // Generator
  addSectionHeader('Generator / المولّد');
  addRow('Name / الاسم', form.generator_name);
  addRow('Address / العنوان', form.generator_address);
  addRow('Phone / الهاتف', form.generator_phone);
  addRow('License / الترخيص', form.generator_license);
  y += 3;

  // Transporter
  addSectionHeader('Transporter / الناقل');
  addRow('Name / الاسم', form.transporter_name);
  addRow('Address / العنوان', form.transporter_address);
  addRow('Phone / الهاتف', form.transporter_phone);
  addRow('License / الترخيص', form.transporter_license);
  y += 3;

  // Destination
  addSectionHeader(form.destination_type === 'disposal' ? 'Disposal Facility / جهة التخلص' : 'Recycler / جهة التدوير');
  addRow('Name / الاسم', form.destination_name);
  addRow('Address / العنوان', form.destination_address);
  addRow('Phone / الهاتف', form.destination_phone);
  addRow('License / الترخيص', form.destination_license);
  y += 3;

  // Waste
  addSectionHeader('Waste Details / بيانات المخلفات');
  addRow('Waste Type / نوع المخلف', wasteTypeLabels[form.waste_type] || form.waste_type);
  addRow('Description / الوصف', form.waste_description);
  addRow('Hazard Level / الخطورة', hazardLabels[form.hazard_level] || form.hazard_level);
  addRow('Quantity / الكمية', `${form.quantity} ${unitLabels[form.unit] || form.unit}`);
  addRow('Disposal Method / طريقة المعالجة', disposalLabels[form.disposal_method] || form.disposal_method);
  y += 3;

  // Driver
  addSectionHeader('Driver & Vehicle / السائق والمركبة');
  addRow('Driver / السائق', form.driver_name);
  addRow('Phone / الهاتف', form.driver_phone);
  addRow('Vehicle Plate / اللوحة', form.vehicle_plate);
  addRow('Vehicle Type / نوع المركبة', form.vehicle_type);
  y += 3;

  // Logistics
  addSectionHeader('Logistics / التحميل والتسليم');
  addRow('Pickup / موقع التحميل', form.pickup_address);
  addRow('Delivery / موقع التسليم', form.delivery_address);
  addRow('Pickup Date / تاريخ التحميل', form.pickup_date);
  addRow('Delivery Date / تاريخ التسليم', form.delivery_date);
  y += 3;

  // Financial
  if (form.price) {
    addSectionHeader('Financial / البيانات المالية');
    addRow('Price / السعر', form.price);
    addRow('Notes / ملاحظات', form.price_notes);
    y += 3;
  }

  // Notes
  if (form.notes || form.special_instructions) {
    addSectionHeader('Notes / ملاحظات');
    if (form.notes) addRow('General / عامة', form.notes);
    if (form.special_instructions) addRow('Special Instructions / تعليمات', form.special_instructions);
    y += 3;
  }

  // Signature area
  if (y > 230) { doc.addPage(); y = 20; }
  y += 10;
  addLine();
  y += 5;

  const sigWidth = contentWidth / 3;
  const sigLabels = ['Generator / المولّد', 'Transporter / الناقل', 'Receiver / المستقبل'];
  sigLabels.forEach((label, i) => {
    const x = margin + (sigWidth * i) + sigWidth / 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, y, { align: 'center' });
    doc.line(margin + sigWidth * i + 5, y + 20, margin + sigWidth * (i + 1) - 5, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Name, Signature & Stamp', x, y + 25, { align: 'center' });
  });

  // Save
  const fileName = form.shipment_number
    ? `shipment-${form.shipment_number}.pdf`
    : `shipment-draft-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
