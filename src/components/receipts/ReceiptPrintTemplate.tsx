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
  } | null;
  transporter: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    commercial_register?: string;
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
  const printDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const pickupDateFormatted = receipt.pickup_date
    ? new Date(receipt.pickup_date).toLocaleDateString('ar-EG', {
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
          padding: 15mm 20mm;
          background: white;
          min-height: 297mm;
          position: relative;
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
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2px;
        }
        
        .logo-text p {
          font-size: 11px;
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
          border-radius: 8px;
          padding: 8px 15px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .security-banner span {
          font-size: 12px;
          color: #92400e;
          font-weight: 600;
        }
        
        /* Document Title */
        .doc-title {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .doc-title h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .doc-title .subtitle {
          font-size: 12px;
          color: #6b7280;
        }
        
        /* Receipt Number Box */
        .receipt-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }
        
        .receipt-number {
          text-align: right;
        }
        
        .receipt-number label {
          font-size: 11px;
          color: #059669;
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        
        .receipt-number span {
          font-size: 22px;
          font-weight: 800;
          color: #047857;
          font-family: monospace;
          letter-spacing: 1px;
        }
        
        .shipment-number {
          text-align: left;
        }
        
        .shipment-number label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          display: block;
          margin-bottom: 4px;
        }
        
        .shipment-number span {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        /* Barcode Section */
        .barcode-section {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .barcode-section img {
          height: 50px;
        }
        
        .barcode-section p {
          font-size: 10px;
          color: #6b7280;
          margin-top: 5px;
          font-family: monospace;
        }
        
        /* Info Grid */
        .info-section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          padding-bottom: 8px;
          border-bottom: 2px solid #10b981;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-title::before {
          content: '';
          width: 4px;
          height: 18px;
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-radius: 2px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 15px;
        }
        
        .info-card.full-width {
          grid-column: span 2;
        }
        
        .info-card label {
          font-size: 10px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }
        
        .info-card .value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .info-card .value.highlight {
          color: #059669;
          font-size: 18px;
        }
        
        /* Parties Section */
        .parties-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .party-card {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 15px;
          background: #fafafa;
        }
        
        .party-card h4 {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .party-card .party-name {
          font-size: 15px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .party-card .party-details {
          font-size: 11px;
          color: #6b7280;
        }
        
        /* Waste Details */
        .waste-details {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .waste-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          text-align: center;
        }
        
        .waste-item label {
          font-size: 11px;
          color: #166534;
          font-weight: 600;
          display: block;
          margin-bottom: 5px;
        }
        
        .waste-item .value {
          font-size: 20px;
          font-weight: 800;
          color: #14532d;
        }
        
        .waste-item .unit {
          font-size: 12px;
          color: #166534;
          font-weight: 500;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
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
          border-radius: 8px;
          padding: 12px 15px;
          margin-bottom: 20px;
        }
        
        .notes-section label {
          font-size: 11px;
          color: #92400e;
          font-weight: 600;
          display: block;
          margin-bottom: 5px;
        }
        
        .notes-section p {
          font-size: 13px;
          color: #78350f;
        }
        
        /* Signatures Section */
        .signatures {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px dashed #d1d5db;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 2px solid #9ca3af;
          height: 50px;
          margin-bottom: 10px;
          background: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 5px,
            #f3f4f6 5px,
            #f3f4f6 6px
          );
        }
        
        .signature-label {
          font-size: 12px;
          color: #4b5563;
          font-weight: 600;
        }
        
        .signature-name {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }
        
        /* Stamp Area */
        .stamp-area {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          background: #fafafa;
        }
        
        .stamp-area p {
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }
        
        /* Footer */
        .footer {
          position: absolute;
          bottom: 15mm;
          left: 20mm;
          right: 20mm;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .footer-left {
          font-size: 9px;
          color: #9ca3af;
        }
        
        .footer-right {
          font-size: 10px;
          color: #6b7280;
        }
        
        .verification-code {
          font-family: monospace;
          font-size: 10px;
          color: #059669;
          background: #ecfdf5;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid #a7f3d0;
        }
        
        /* Platform Rights */
        .platform-rights {
          text-align: center;
          margin-top: 20px;
          padding: 10px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 9px;
          color: #6b7280;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 10mm 15mm; min-height: auto; }
          .footer { position: relative; bottom: auto; left: auto; right: auto; margin-top: 30px; }
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
              <div class="party-name">${receipt.generator?.name || '-'}</div>
              ${receipt.generator?.address ? `<div class="party-details">📍 ${receipt.generator.address}</div>` : ''}
              ${receipt.generator?.phone ? `<div class="party-details">📞 ${receipt.generator.phone}</div>` : ''}
              ${receipt.generator?.commercial_register ? `<div class="party-details">📋 س.ت: ${receipt.generator.commercial_register}</div>` : ''}
            </div>
            <div class="party-card">
              <h4>🚛 الجهة الناقلة (المستلم)</h4>
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
        
        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">توقيع المستلم (السائق)</div>
            <div class="signature-name">${receipt.driver?.profile?.full_name || ''}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">توقيع المسلّم (الجهة المولدة)</div>
            <div class="signature-name"></div>
          </div>
        </div>
        
        <!-- Stamp Area -->
        <div class="stamp-area">
          <p>🔏 الختم الرسمي</p>
        </div>
        
        <!-- Platform Rights -->
        <div class="platform-rights">
          ⚖️ ضمان حقوق المنصة: هذه الوثيقة صادرة عن نظام آي ريسايكل لإدارة المخلفات وتخضع لشروط الاستخدام وسياسة الخصوصية
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="footer-content">
            <div class="footer-left">
              <p>تاريخ الطباعة: ${printDate}</p>
            </div>
            <div class="footer-right">
              <span class="verification-code">🔐 ${verificationCode}</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default generateReceiptPrintHTML;
