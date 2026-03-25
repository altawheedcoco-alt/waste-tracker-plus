import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels } from '@/lib/wasteClassification';

export interface ReceiptPrintData {
  receipt_number: string;
  pickup_date: string;
  waste_type: string;
  actual_weight: number | null;
  declared_weight: number | null;
  unit: string;
  status: string;
  notes: string | null;
  pickup_location: string | null;
  shipment: {
    id: string;
    shipment_number: string;
  } | null;
  generator: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    commercial_register?: string;
    logo_url?: string | null;
  } | null;
  transporter: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    commercial_register?: string;
    logo_url?: string | null;
  } | null;
  driver: {
    id: string;
    license_number?: string;
    vehicle_plate?: string;
    profile: {
      full_name: string;
      phone?: string;
    } | null;
  } | null;
  created_at?: string;
  confirmed_at?: string;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed': return 'مؤكدة ✓';
    case 'pending': return 'بانتظار التأكيد';
    case 'disputed': return 'متنازع عليها';
    case 'cancelled': return 'ملغية';
    default: return status;
  }
};

const getWasteTypeLabel = (type: string) => {
  return wasteTypeLabels[type] || type || 'غير محدد';
};

export const generateReceiptPrintHTML = (receipt: ReceiptPrintData): string => {
  const printDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const pickupDateFormatted = receipt.pickup_date
    ? new Date(receipt.pickup_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  const verificationCode = `EG-RCP-${receipt.receipt_number.replace('RCP-', '')}`;
  const barcodeData = receipt.receipt_number;
  const qrData = encodeURIComponent(JSON.stringify({
    type: 'SHIPMENT_RECEIPT',
    receiptNo: receipt.receipt_number,
    shipmentNo: receipt.shipment?.shipment_number || '',
    date: receipt.pickup_date,
    weight: receipt.actual_weight || receipt.declared_weight,
    unit: receipt.unit,
    verifyUrl: `https://irecycle.app/verify?code=${verificationCode}`,
  }));

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>شهادة استلام شحنة - ${receipt.receipt_number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Tajawal', Arial, sans-serif; 
          background: white;
          color: #1f2937;
          line-height: 1.6;
        }
        
        .page {
          max-width: 210mm;
          margin: 0 auto;
          padding: 8mm 10mm;
          background: white;
          min-height: 297mm;
          position: relative;
          page-break-after: always;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        
        /* Header Section */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 3px solid #10b981;
          margin-bottom: 25px;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
        }
        
        .logo-text {
          text-align: right;
        }
        
        .logo-text h1 {
          font-size: 18px;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2px;
        }
        
        .logo-text p {
          font-size: 9px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .header-right {
          text-align: left;
        }
        
        .qr-container {
          width: 80px;
          height: 80px;
          padding: 5px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qr-container img {
          width: 100%;
          height: 100%;
        }
        
        /* Security Banner */
        .security-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 5px 10px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .security-banner span {
          font-size: 10px;
          color: #92400e;
          font-weight: 600;
        }
        
        /* Document Title */
        .doc-title {
          text-align: center;
          margin-bottom: 12px;
        }
        
        .doc-title h2 {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .doc-title .subtitle {
          font-size: 10px;
          color: #6b7280;
        }
        
        /* Receipt Number Box */
        .receipt-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 10px 15px;
          margin-bottom: 12px;
        }
        
        .receipt-number label {
          font-size: 9px;
          color: #059669;
          font-weight: 600;
          display: block;
          margin-bottom: 2px;
        }
        
        .receipt-number span {
          font-size: 16px;
          font-weight: 800;
          color: #047857;
          font-family: monospace;
          letter-spacing: 1px;
        }
        
        .shipment-number label {
          font-size: 9px;
          color: #6b7280;
          font-weight: 500;
          display: block;
          margin-bottom: 2px;
        }
        
        .shipment-number span {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        
        /* Barcode Section */
        .barcode-section {
          text-align: center;
          margin-bottom: 12px;
        }
        
        .barcode-section img {
          height: 35px;
        }
        
        .barcode-section p {
          font-size: 10px;
          color: #6b7280;
          margin-top: 5px;
          font-family: monospace;
        }
        
        /* Info Grid */
        .info-section {
          margin-bottom: 10px;
        }
        
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          padding-bottom: 4px;
          border-bottom: 2px solid #10b981;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .section-title::before {
          content: '';
          width: 3px;
          height: 14px;
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-radius: 2px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .info-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 10px;
        }
        
        .info-card.full-width {
          grid-column: span 2;
        }
        
        .info-card label {
          font-size: 8px;
          color: #6b7280;
          font-weight: 600;
          display: block;
          margin-bottom: 2px;
        }
        
        .info-card .value {
          font-size: 11px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .info-card .value.highlight {
          color: #059669;
          font-size: 14px;
        }
        
        /* Parties Section */
        .parties-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .party-card {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px;
          background: #fafafa;
        }
        
        .party-card h4 {
          font-size: 9px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .party-card .party-name {
          font-size: 12px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 3px;
        }
        
        .party-card .party-details {
          font-size: 9px;
          color: #6b7280;
        }
        
        /* Waste Details */
        .waste-details {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
        }
        
        .waste-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          text-align: center;
        }
        
        .waste-item label {
          font-size: 9px;
          color: #166534;
          font-weight: 600;
          display: block;
          margin-bottom: 3px;
        }
        
        .waste-item .value {
          font-size: 16px;
          font-weight: 800;
          color: #14532d;
        }
        
        .waste-item .unit {
          font-size: 10px;
          color: #166534;
          font-weight: 500;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .status-confirmed {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        
        .status-pending {
          background: #fef9c3;
          color: #854d0e;
          border: 1px solid #fde047;
        }
        
        /* Notes Section */
        .notes-section {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 8px 10px;
          margin-bottom: 10px;
        }
        
        .notes-section label {
          font-size: 9px;
          color: #92400e;
          font-weight: 600;
          display: block;
          margin-bottom: 3px;
        }
        
        .notes-section p {
          font-size: 10px;
          color: #78350f;
        }
        
        /* Signatures Section */
        .signatures {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px dashed #d1d5db;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 2px solid #9ca3af;
          height: 30px;
          margin-bottom: 5px;
        }
        
        .signature-label {
          font-size: 10px;
          color: #4b5563;
          font-weight: 600;
        }
        
        .signature-name {
          font-size: 9px;
          color: #9ca3af;
          margin-top: 2px;
        }
        
        /* Stamp Area */
        .stamp-area {
          text-align: center;
          margin-top: 10px;
          padding: 10px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background: #fafafa;
        }
        
        .stamp-area p {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        /* Footer */
        .footer {
          margin-top: auto;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .footer-left {
          font-size: 7px;
          color: #9ca3af;
        }
        
        .footer-right {
          font-size: 8px;
          color: #6b7280;
        }
        
        .verification-code {
          font-family: monospace;
          font-size: 8px;
          color: #059669;
          background: #ecfdf5;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid #a7f3d0;
        }
        
        /* Platform Rights */
        .platform-rights {
          text-align: center;
          margin-top: 8px;
          padding: 6px;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 7px;
          color: #6b7280;
        }

        /* Terms Back Page */
        .terms-page {
          page-break-before: always;
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 8mm 10mm;
          background: white;
          box-sizing: border-box;
          font-size: 7pt;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
        }
        .terms-page h2 { font-size: 13pt; font-weight: bold; margin: 0; }
        .terms-page .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; flex: 1; }
        .terms-page .terms-section h3 { font-size: 8.5pt; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; margin-bottom: 4px; }
        .terms-page .terms-section ul { margin: 0; padding-right: 12px; }
        .terms-page .terms-section li { font-size: 7pt; line-height: 1.55; margin-bottom: 2px; }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 8mm 10mm; min-height: auto; }
          .footer { position: relative; bottom: auto; left: auto; right: auto; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-icon">♻️</div>
            <div class="logo-text">
              <h1>iRecycle</h1>
              <p>نظام آي ريسايكل لإدارة المخلفات</p>
              <p style="font-size: 10px; color: #10b981;">Waste Management System</p>
            </div>
          </div>
          <div class="header-right">
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}" alt="QR Code" />
            </div>
          </div>
        </div>
        
        <!-- Security Banner -->
        <div class="security-banner">
          <span>🔒</span>
          <span>هذه الوثيقة رسمية ومؤمنة - للتحقق من صحتها استخدم رمز QR أو كود التحقق</span>
          <span>🔒</span>
        </div>
        
        <!-- Document Title -->
        <div class="doc-title">
          <h2>📋 شهادة استلام شحنة</h2>
          <p class="subtitle">Shipment Receipt Certificate</p>
        </div>
        
        <!-- Receipt & Shipment Numbers -->
        <div class="receipt-box">
          <div class="receipt-number">
            <label>رقم الشهادة</label>
            <span>${receipt.receipt_number}</span>
          </div>
          <div class="shipment-number">
            <label>رقم الشحنة</label>
            <span>${receipt.shipment?.shipment_number || '-'}</span>
          </div>
        </div>
        
        <!-- Barcode -->
        <div class="barcode-section">
          <img src="https://barcode.tec-it.com/barcode.ashx?data=${barcodeData}&code=Code128&dpi=96" alt="Barcode" />
          <p>${barcodeData}</p>
        </div>
        
        <!-- Date & Status Info -->
        <div class="info-section">
          <div class="info-grid">
            <div class="info-card">
              <label>📅 تاريخ الاستلام</label>
              <div class="value">${pickupDateFormatted}</div>
            </div>
            <div class="info-card">
              <label>✅ حالة الشهادة</label>
              <div class="value">
                <span class="status-badge ${receipt.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}">
                  ${getStatusLabel(receipt.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Parties -->
        <div class="info-section">
          <div class="section-title">الأطراف المعنية</div>
          <div class="parties-grid">
            <div class="party-card">
              <h4>🏭 الجهة المولدة (المسلّم)</h4>
              ${receipt.generator?.logo_url ? `<img src="${receipt.generator.logo_url}" alt="Logo" style="height: 40px; object-fit: contain; margin-bottom: 8px;" crossOrigin="anonymous" />` : ''}
              <div class="party-name">${receipt.generator?.name || '-'}</div>
              ${receipt.generator?.address ? `<div class="party-details">📍 ${receipt.generator.address}</div>` : ''}
              ${receipt.generator?.phone ? `<div class="party-details">📞 ${receipt.generator.phone}</div>` : ''}
              ${receipt.generator?.commercial_register ? `<div class="party-details">📋 س.ت: ${receipt.generator.commercial_register}</div>` : ''}
            </div>
            <div class="party-card">
              <h4>🚛 الجهة الناقلة (المستلم)</h4>
              ${receipt.transporter?.logo_url ? `<img src="${receipt.transporter.logo_url}" alt="Logo" style="height: 40px; object-fit: contain; margin-bottom: 8px;" crossOrigin="anonymous" />` : ''}
              <div class="party-name">${receipt.transporter?.name || '-'}</div>
              ${receipt.transporter?.address ? `<div class="party-details">📍 ${receipt.transporter.address}</div>` : ''}
              ${receipt.transporter?.phone ? `<div class="party-details">📞 ${receipt.transporter.phone}</div>` : ''}
              ${receipt.transporter?.commercial_register ? `<div class="party-details">📋 س.ت: ${receipt.transporter.commercial_register}</div>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Driver Info -->
        ${receipt.driver?.profile?.full_name ? `
        <div class="info-section">
          <div class="section-title">بيانات السائق</div>
          <div class="info-grid">
            <div class="info-card">
              <label>👤 اسم السائق</label>
              <div class="value">${receipt.driver.profile.full_name}</div>
            </div>
            <div class="info-card">
              <label>🚗 رقم اللوحة</label>
              <div class="value">${receipt.driver.vehicle_plate || '-'}</div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Waste Details -->
        <div class="info-section">
          <div class="section-title">تفاصيل المخلفات</div>
          <div class="waste-details">
            <div class="waste-grid">
              <div class="waste-item">
                <label>♻️ نوع المخلفات</label>
                <div class="value">${getWasteTypeLabel(receipt.waste_type)}</div>
              </div>
              <div class="waste-item">
                <label>📦 الوزن المصرح</label>
                <div class="value">${receipt.declared_weight || '-'}</div>
                <div class="unit">${receipt.unit}</div>
              </div>
              <div class="waste-item">
                <label>⚖️ الوزن الفعلي</label>
                <div class="value highlight">${receipt.actual_weight || receipt.declared_weight || '-'}</div>
                <div class="unit">${receipt.unit}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pickup Location -->
        ${receipt.pickup_location ? `
        <div class="info-section">
          <div class="info-grid">
            <div class="info-card full-width">
              <label>📍 موقع الاستلام</label>
              <div class="value">${receipt.pickup_location}</div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Notes -->
        ${receipt.notes ? `
        <div class="notes-section">
          <label>📝 ملاحظات</label>
          <p>${receipt.notes}</p>
        </div>
        ` : ''}
        
        <!-- Signatures with QR -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">توقيع المستلم (السائق)</div>
            <div class="signature-name">${receipt.driver?.profile?.full_name || ''}</div>
            <div style="margin-top: 8px; display: flex; justify-content: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=receipt-driver&receipt=${receipt.receipt_number}`)}" alt="QR" style="width: 32px; height: 32px;" />
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">توقيع المسلّم (الجهة المولدة)</div>
            <div class="signature-name"></div>
            <div style="margin-top: 8px; display: flex; justify-content: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=receipt-generator&receipt=${receipt.receipt_number}`)}" alt="QR" style="width: 32px; height: 32px;" />
            </div>
          </div>
        </div>
        
        <!-- Stamp Area -->
        <div class="stamp-area">
          <p>🔏 الختم الرسمي</p>
          <div style="margin-top: 8px; display: flex; justify-content: center;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=receipt-stamp&receipt=${receipt.receipt_number}`)}" alt="QR" style="width: 45px; height: 45px;" />
          </div>
        </div>
        
        <!-- Legal Disclaimer -->
        <div style="padding: 10px 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 15px; font-size: 9px; color: #991b1b; line-height: 1.5;">
          <p style="margin: 0; font-weight: bold;">⚖️ إخلاء مسؤولية وتحذير قانوني:</p>
          <p style="margin: 3px 0 0 0;">
            هذه الوثيقة ملزمة قانونياً لجميع الأطراف. أي مخالفة للبيانات المذكورة أو تلاعب بمحتويات الشحنة أو إخفاء معلومات جوهرية يُعرّض المخالف للمساءلة المدنية والجنائية وفقاً لقانون تنظيم إدارة المخلفات 202/2020 وقانون حماية البيئة 4/1994 وقانون العقوبات المصري. يخضع هذا المستند لشروط وأحكام وسياسات منصة iRecycle المعتمدة. والمخالف يتحمل كافة التبعات القانونية المدنية والجنائية المترتبة على ذلك.
          </p>
        </div>

        <!-- Platform Rights -->
        <div class="platform-rights">
          ⚖️ ضمان حقوق المنصة: هذه الوثيقة مؤمنة وذكية وصادرة عن نظام آي ريسايكل لإدارة المخلفات — تخضع لشروط الاستخدام وسياسة الخصوصية والأحكام العامة المنشورة والمعتمدة
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-left">
              <p>تاريخ الطباعة: ${printDate}</p>
              <p style="margin-top: 4px; font-size: 7pt; color: #6b7280;">📅 تاريخ وصول الشحنة (أول تسجيل على المنظومة): ${receipt.confirmed_at ? new Date(receipt.confirmed_at).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : receipt.created_at ? new Date(receipt.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
            </div>
            <div class="footer-right">
              <span class="verification-code">🔐 ${verificationCode}</span>
            </div>
          </div>
          <div style="text-align: center; margin-top: 8px; font-style: italic; color: #059669; font-weight: bold; font-size: 9px; display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap;">
            ${(() => {
              const taglines = [
                'الإنتاج عليك.. والدائرة المقفولة علينا. خليك',
                'إدارة مخلفات بمواصفات عالمية.. سيستم مبيغلطش.',
                'إحنا مش بنلم مخلفات، إحنا بنقفل دايرة الإنتاج صح.',
                'من المصنع للمستقبل.. سكة واحدة مع',
              ];
              const logo = '<img src="/irecycle-logo.webp" alt="iRecycle" style="height:16px;vertical-align:middle;display:inline-block;margin:0 3px;border-radius:3px;" />';
              return taglines[Math.floor(Date.now() / 86400000) % 4] + ' ' + logo;
            })()}
          </div>
        </div>
      </div>

      <!-- Page 2 — Terms & Policies -->
      <div class="terms-page" dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 3px double #10b981;">
          <div>
            <h2 style="color: #10b981;">اشتراطات وسياسات وأحكام المنصة</h2>
            <p style="font-size: 7.5pt; color: #6b7280;">الإصدار 3.0.0 • منصة iRecycle لإدارة المخلفات والاستدامة البيئية</p>
          </div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/platform-terms?v=3.0.0`)}" alt="QR" style="width: 45px; height: 45px;" />
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px; margin-bottom: 10px; font-size: 7.5pt; line-height: 1.5;">
          <p style="font-weight: bold; font-size: 8pt; margin: 0 0 3px;">⚖️ الإطار القانوني والتنظيمي</p>
          تسري هذه الاشتراطات على جميع أطراف المنظومة (مولد، ناقل، مُدوِّر، جهة تخلص آمن) وفقاً لقانون تنظيم إدارة المخلفات 202/2020 ولائحته التنفيذية، وقانون البيئة 4/1994 المعدّل، واتفاقية بازل، ومعايير ISO 14001 و45001.
        </div>

        <div class="terms-grid">
          <div class="terms-section">
            <h3>1. التزامات المولد (GEN)</h3>
            <ul>
              <li>الإفصاح الدقيق عن نوع وكمية المخلفات وفصل الخطرة عن غير الخطرة</li>
              <li>الحصول على التراخيص اللازمة من WMRA/EEAA/IDA</li>
              <li>تطبيق مبدأ «الملوث يدفع» وفقاً لقانون 202/2020</li>
              <li>توفير منطقة تجميع آمنة ومطابقة للمواصفات</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>2. التزامات النقل (TRN)</h3>
            <ul>
              <li>مركبة مرخصة بتجهيزات أمان وGPS وملصقات تحذيرية</li>
              <li>سائق بشهادة تدريب والتزام بالمسار المحدد (Geofencing 200م)</li>
              <li>صور ميزان وحمولة إلزامية • تفاوت الوزن المقبول &lt; 5%</li>
              <li>الإبلاغ الفوري عن أي حادث خلال 10 دقائق</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>3. التزامات التدوير (RCY)</h3>
            <ul>
              <li>ترخيص تدوير ساري وفحص جودة دوري</li>
              <li>تأكيد الاستلام خلال 15 دقيقة وإصدار شهادة تدوير رقمية</li>
              <li>سجل رقمي كامل لسلسلة الحيازة</li>
              <li>الامتثال لمعايير ISO 14001</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>4. التخلص الآمن (DSP)</h3>
            <ul>
              <li>الالتزام بمعايير التخلص وفقاً للقانون المصري واتفاقية بازل</li>
              <li>توثيق كامل بالصور والأوزان وشهادة تخلص رقمية</li>
              <li>تطبيق إجراءات السلامة ISO 45001</li>
              <li>الاحتفاظ بسجلات التخلص لمدة 5 سنوات</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>5. المستندات والتوقيعات الإلكترونية</h3>
            <ul>
              <li>بصمة رقمية SHA-256 وتوقيع إلكتروني مُلزم (قانون 15/2004)</li>
              <li>أرشفة غير قابلة للتعديل (Immutable Audit Trail)</li>
              <li>تحقق بيومتري من هوية الموقعين</li>
              <li>رمز QR فريد لكل مستند للتحقق الفوري</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>6. الامتثال والرقابة</h3>
            <ul>
              <li>مؤشر امتثال من 6 محاور • الحد الأدنى 70%</li>
              <li>إشارة مرور للتراخيص: أخضر/أصفر/أحمر (حظر تلقائي)</li>
              <li>تزييف GPS أو التلاعب = تعليق فوري + إبلاغ السلطات</li>
              <li>مراجعة دورية آلية مع إشعارات استباقية</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>7. الاستدامة البيئية</h3>
            <ul>
              <li>حساب البصمة الكربونية وفقاً لمعاملات IPCC 2006</li>
              <li>تتبع مؤشرات الاقتصاد الدائري (MCI) وجواز المنتج الرقمي</li>
              <li>تقارير ESG دورية لكل منشأة مسجلة</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>8. أمن المعلومات والخصوصية</h3>
            <ul>
              <li>تشفير AES-256 لجميع البيانات وعزل RLS</li>
              <li>تحقق هوية من 3 مراحل: OCR + بيومتري + توقيع</li>
              <li>حماية البيانات الشخصية</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>9. المخالفات والعقوبات</h3>
            <ul>
              <li>16 نوع مخالفة تشغيلية مصنفة حسب الخطورة</li>
              <li>التلاعب في البيانات = حظر نهائي</li>
              <li>حق المنصة في الإبلاغ للجهات الرقابية</li>
            </ul>
          </div>
          <div class="terms-section">
            <h3>10. الأحكام العامة والقانون الحاكم</h3>
            <ul>
              <li>تخضع للقانون المصري وتختص المحاكم المصرية بأي نزاع</li>
              <li>يحق للمنصة تعديل السياسات مع إخطار قبل 30 يوماً</li>
              <li>أي تعديل بعد الطباعة يُعد باطلاً ما لم يكن مختوماً رقمياً</li>
            </ul>
          </div>
        </div>

        <div style="border-top: 3px double #10b981; padding-top: 8px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 6.5pt; color: #6b7280;">
            <div>
              <p style="margin: 0;"><strong>⚖️ إقرار:</strong> بتوقيع هذا المستند أو استخدام المنصة يُقر الطرف بالموافقة الكاملة على جميع الاشتراطات والسياسات.</p>
              <p style="margin: 2px 0 0;">• التوقيعات الإلكترونية مُلزمة قانونياً وفقاً لقانون التوقيع الإلكتروني 15/2004.</p>
              <p style="margin: 2px 0 0;">• جميع المستندات محمية ببصمة SHA-256 ويمكن التحقق منها عبر QR.</p>
            </div>
            <div style="text-align: center; margin: 0 15px;">
              <div style="width: 60px; height: 60px; border: 1px dashed #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,0.05);">
                <span style="font-size: 6pt; color: #10b981;">♻️ مختوم رقمياً</span>
              </div>
            </div>
            <div style="text-align: center;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=platform-terms&version=3.0.0`)}" alt="QR" style="width: 45px; height: 45px;" />
              <p style="font-size: 6pt; margin-top: 2px;">امسح للتحقق</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 6px; font-size: 6pt; color: #6b7280;">
            جميع الحقوق محفوظة © ${new Date().getFullYear()} iRecycle • الإصدار 3.0.0 • وثيقة محمية بتقنية SHA-256
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default generateReceiptPrintHTML;
