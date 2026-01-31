import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  waste_description?: string;
  disposal_method?: string;
  pickup_address?: string;
  delivery_address?: string;
  pickup_date?: string | null;
  expected_delivery_date?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  generator?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
  transporter?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
  recycler?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
  } | null;
}

interface RecyclerOrg {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  commercial_register?: string;
  environmental_license?: string;
  stamp_url?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  representative_name?: string | null;
}

interface RecyclingCertificatePrintProps {
  shipment: Shipment;
  template: string;
  customNotes: string;
  processingDetails: string;
  openingDeclaration?: string;
  closingDeclaration?: string;
  recyclerOrg: RecyclerOrg | null;
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const templateTitles: Record<string, string> = {
  standard: 'شهادة إعادة التدوير',
  detailed: 'تقرير إعادة التدوير التفصيلي',
  environmental: 'تقرير الامتثال البيئي',
  custom: 'شهادة إعادة التدوير',
};

// Print-optimized styles
const styles = {
  container: {
    width: '210mm',
    minHeight: '297mm',
    margin: '0 auto',
    padding: '20mm 15mm',
    backgroundColor: '#ffffff',
    fontFamily: 'Cairo, Arial, sans-serif',
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#1f2937',
    direction: 'rtl' as const,
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '3px solid #16a34a',
  },
  titleSection: {
    textAlign: 'center' as const,
    flex: 1,
    padding: '0 20px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: '5px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#4b5563',
    marginBottom: '10px',
  },
  certNumber: {
    display: 'inline-block',
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '6px',
    padding: '8px 15px',
    fontSize: '13px',
  },
  certNumberLabel: {
    color: '#374151',
  },
  certNumberValue: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#15803d',
    marginRight: '5px',
  },
  qrSection: {
    textAlign: 'center' as const,
  },
  qrLabel: {
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '5px',
  },
  barcodeSection: {
    textAlign: 'center' as const,
  },
  barcodeLabel: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#374151',
    marginTop: '3px',
  },
  declarationBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
  },
  declarationTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  declarationText: {
    fontSize: '12px',
    color: '#1e3a8a',
    lineHeight: '1.8',
  },
  sectionTitle: {
    backgroundColor: '#f3f4f6',
    padding: '8px 12px',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#1f2937',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '20px',
    fontSize: '11px',
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    padding: '10px',
    fontWeight: '600',
    textAlign: 'right' as const,
    borderBottom: '1px solid #e5e7eb',
    width: '25%',
  },
  tableCell: {
    padding: '10px',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'right' as const,
  },
  tableCellHighlight: {
    padding: '10px',
    borderBottom: '1px solid #e5e7eb',
    textAlign: 'right' as const,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  partiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  partyCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
  },
  partyCardRecycler: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '12px',
  },
  partyTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  partyInfo: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  partyName: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#1f2937',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '15px',
    fontSize: '12px',
    lineHeight: '1.8',
  },
  closingDeclaration: {
    backgroundColor: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px',
    padding: '18px',
    marginBottom: '25px',
  },
  closingTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closingText: {
    fontSize: '12px',
    color: '#14532d',
    lineHeight: '1.8',
  },
  checkList: {
    marginTop: '12px',
    marginRight: '15px',
    fontSize: '11px',
    color: '#166534',
  },
  checkItem: {
    marginBottom: '4px',
  },
  signatureSection: {
    borderTop: '2px solid #d1d5db',
    paddingTop: '25px',
    marginTop: '30px',
  },
  signatureGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
  },
  signatureBox: {
    textAlign: 'center' as const,
  },
  signatureTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '5px',
    fontSize: '12px',
  },
  signatureOrg: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '15px',
  },
  signatureImages: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
  },
  signatureItem: {
    textAlign: 'center' as const,
  },
  signatureImage: {
    height: '60px',
    maxWidth: '100px',
    objectFit: 'contain' as const,
    marginBottom: '5px',
  },
  signaturePlaceholder: {
    height: '50px',
    width: '100px',
    borderBottom: '2px solid #9ca3af',
    margin: '0 auto 5px',
  },
  signatureLabel: {
    fontSize: '10px',
    color: '#6b7280',
  },
  footer: {
    marginTop: '30px',
    paddingTop: '15px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center' as const,
    fontSize: '10px',
    color: '#9ca3af',
  },
  icon: {
    width: '16px',
    height: '16px',
    display: 'inline-block',
    verticalAlign: 'middle',
  },
};

const RecyclingCertificatePrint = ({
  shipment,
  template,
  customNotes,
  processingDetails,
  openingDeclaration,
  closingDeclaration,
  recyclerOrg,
}: RecyclingCertificatePrintProps) => {
  const currentDate = format(new Date(), 'dd/MM/yyyy');
  const deliveryDate = shipment.delivered_at
    ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy')
    : '-';
  const fullDeliveryDate = shipment.delivered_at
    ? format(new Date(shipment.delivered_at), 'PP', { locale: ar })
    : '-';

  const recyclerName = recyclerOrg?.name || shipment.recycler?.name || 'جهة التدوير';
  const stampUrl = recyclerOrg?.stamp_url || shipment.recycler?.stamp_url;
  const signatureUrl = recyclerOrg?.signature_url || shipment.recycler?.signature_url;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        {/* QR Code */}
        <div style={styles.qrSection}>
          <QRCodeSVG
            value={`RECYCLING-CERT-${shipment.shipment_number}`}
            size={70}
            level="M"
            includeMargin={false}
          />
          <div style={styles.qrLabel}>رمز التحقق</div>
        </div>

        {/* Title */}
        <div style={styles.titleSection}>
          <div style={styles.title}>
            🌿 {templateTitles[template]} 🌿
          </div>
          <div style={styles.subtitle}>إدارة المخلفات وإعادة التدوير</div>
          <div style={styles.certNumber}>
            <span style={styles.certNumberLabel}>رقم الشهادة: </span>
            <span style={styles.certNumberValue}>{shipment.shipment_number}</span>
          </div>
        </div>

        {/* Barcode */}
        <div style={styles.barcodeSection}>
          <Barcode
            value={shipment.shipment_number}
            width={1.2}
            height={40}
            fontSize={0}
            displayValue={false}
          />
          <div style={styles.barcodeLabel}>{shipment.shipment_number}</div>
        </div>
      </header>

      {/* Opening Declaration */}
      <div style={styles.declarationBox}>
        <div style={styles.declarationTitle}>
          📄 إقرار رسمي
        </div>
        <div style={styles.declarationText}>
          <p>
            إلى السادة / <strong>{shipment.generator?.name || 'الجهة المولدة'}</strong> - الجهة المولدة للمخلفات
          </p>
          <p>
            وإلى السادة / <strong>{shipment.transporter?.name || 'جهة النقل'}</strong> - جهة الجمع والنقل
          </p>
          <p style={{ marginTop: '10px' }}>تحية طيبة وبعد،</p>
          <p style={{ marginTop: '8px' }}>
            {openingDeclaration || `نفيدكم علماً بأن شركة ${recyclerName} المرخصة في مجال إعادة تدوير المخلفات قد تسلمت الشحنة المشار إليها أعلاه وتم معالجتها وفقاً للإجراءات المعتمدة.`}
          </p>
        </div>
      </div>

      {/* Shipment Details */}
      <div>
        <div style={styles.sectionTitle}>
          ⚖️ بيانات الشحنة
        </div>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tableHeader}>رقم الشحنة</td>
              <td style={styles.tableCell}><strong style={{ fontFamily: 'monospace' }}>{shipment.shipment_number}</strong></td>
              <td style={styles.tableHeader}>تاريخ الاستلام</td>
              <td style={styles.tableCell}>{deliveryDate}</td>
            </tr>
            <tr>
              <td style={styles.tableHeader}>نوع المخلفات</td>
              <td style={styles.tableCell}>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</td>
              <td style={styles.tableHeader}>الكمية</td>
              <td style={styles.tableCellHighlight}>{shipment.quantity} {shipment.unit || 'كجم'}</td>
            </tr>
            <tr>
              <td style={styles.tableHeader}>طريقة التخلص</td>
              <td style={styles.tableCell}>{shipment.disposal_method || 'إعادة التدوير'}</td>
              <td style={styles.tableHeader}>وصف المخلفات</td>
              <td style={styles.tableCell}>{shipment.waste_description || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Parties Section */}
      <div style={styles.partiesGrid}>
        {/* Generator */}
        <div style={styles.partyCard}>
          <div style={{ ...styles.partyTitle, color: '#2563eb' }}>
            🏢 الجهة المولدة
          </div>
          <div style={styles.partyName}>{shipment.generator?.name || '-'}</div>
          <div style={styles.partyInfo}>📍 {shipment.generator?.city || '-'}</div>
          {shipment.generator?.commercial_register && (
            <div style={styles.partyInfo}># س.ت: {shipment.generator.commercial_register}</div>
          )}
          {shipment.generator?.environmental_license && (
            <div style={styles.partyInfo}>📋 ترخيص: {shipment.generator.environmental_license}</div>
          )}
        </div>

        {/* Transporter */}
        <div style={styles.partyCard}>
          <div style={{ ...styles.partyTitle, color: '#d97706' }}>
            🚛 جهة النقل
          </div>
          <div style={styles.partyName}>{shipment.transporter?.name || '-'}</div>
          <div style={styles.partyInfo}>📍 {shipment.transporter?.city || '-'}</div>
          {shipment.transporter?.commercial_register && (
            <div style={styles.partyInfo}># س.ت: {shipment.transporter.commercial_register}</div>
          )}
          {shipment.transporter?.environmental_license && (
            <div style={styles.partyInfo}>📋 ترخيص: {shipment.transporter.environmental_license}</div>
          )}
        </div>

        {/* Recycler */}
        <div style={styles.partyCardRecycler}>
          <div style={{ ...styles.partyTitle, color: '#15803d', borderColor: '#86efac' }}>
            ♻️ جهة التدوير
          </div>
          <div style={styles.partyName}>{recyclerName}</div>
          <div style={styles.partyInfo}>📍 {recyclerOrg?.city || shipment.recycler?.city || '-'}</div>
          {(recyclerOrg?.commercial_register || shipment.recycler?.commercial_register) && (
            <div style={styles.partyInfo}># س.ت: {recyclerOrg?.commercial_register || shipment.recycler?.commercial_register}</div>
          )}
          {(recyclerOrg?.environmental_license || shipment.recycler?.environmental_license) && (
            <div style={styles.partyInfo}>📋 ترخيص: {recyclerOrg?.environmental_license || shipment.recycler?.environmental_license}</div>
          )}
        </div>
      </div>

      {/* Processing Details */}
      {processingDetails && (
        <div>
          <div style={styles.sectionTitle}>
            ♻️ تفاصيل عملية المعالجة والتدوير
          </div>
          <div style={styles.infoBox}>
            {processingDetails}
          </div>
        </div>
      )}

      {/* Custom Notes */}
      {customNotes && (
        <div>
          <div style={styles.sectionTitle}>
            📝 ملاحظات إضافية
          </div>
          <div style={styles.infoBox}>
            {customNotes}
          </div>
        </div>
      )}

      {/* Closing Declaration */}
      <div style={styles.closingDeclaration}>
        <div style={styles.closingTitle}>
          ✅ إقرار استلام ومعالجة
        </div>
        {closingDeclaration ? (
          <div style={styles.closingText}>{closingDeclaration}</div>
        ) : (
          <>
            <div style={styles.closingText}>
              نقر نحن شركة <strong>{recyclerName}</strong> بأنه قد تم استلام الشحنة رقم{' '}
              <strong style={{ fontFamily: 'monospace' }}>{shipment.shipment_number}</strong>{' '}
              بتاريخ <strong>{fullDeliveryDate}</strong> بكامل محتوياتها المكونة من{' '}
              <strong>{shipment.quantity} {shipment.unit || 'كجم'}</strong> من مخلفات{' '}
              <strong>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</strong> وبحالة سليمة.
            </div>
            <div style={{ ...styles.closingText, marginTop: '10px' }}>
              كما نقر بأنه تمت إعادة تدوير ومعالجة هذه المخلفات بالكامل وفقاً للمعايير والمتطلبات التالية:
            </div>
            <div style={styles.checkList}>
              <div style={styles.checkItem}>✓ المتطلبات البيئية المنظمة لنشاط إدارة المخلفات وإعادة التدوير</div>
              <div style={styles.checkItem}>✓ المتطلبات القانونية والتشريعية السارية</div>
              <div style={styles.checkItem}>✓ المعايير الصناعية والفنية المعتمدة</div>
              <div style={styles.checkItem}>✓ اشتراطات الصحة والسلامة المهنية</div>
            </div>
          </>
        )}
      </div>

      {/* Signature Section */}
      <div style={styles.signatureSection}>
        <div style={styles.signatureGrid}>
          {/* Empty space for balance */}
          <div />

          {/* Recycler Signature */}
          <div style={styles.signatureBox}>
            <div style={styles.signatureTitle}>التوقيع والختم</div>
            <div style={styles.signatureOrg}>{recyclerName}</div>
            
            <div style={styles.signatureImages}>
              {/* Signature */}
              <div style={styles.signatureItem}>
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="التوقيع"
                    style={styles.signatureImage}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div style={styles.signaturePlaceholder} />
                )}
                <div style={styles.signatureLabel}>التوقيع</div>
              </div>

              {/* Stamp */}
              <div style={styles.signatureItem}>
                {stampUrl ? (
                  <img
                    src={stampUrl}
                    alt="الختم"
                    style={styles.signatureImage}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div style={styles.signaturePlaceholder} />
                )}
                <div style={styles.signatureLabel}>الختم</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>هذه الوثيقة صادرة إلكترونياً من نظام إدارة المخلفات - تاريخ الإصدار: {currentDate}</p>
        <p style={{ marginTop: '3px' }}>يمكن التحقق من صحة الوثيقة عبر مسح رمز QR أعلاه</p>
      </div>
    </div>
  );
};

export default RecyclingCertificatePrint;
