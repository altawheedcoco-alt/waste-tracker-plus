/**
 * Unified A4 Document for Shipment Tracking
 * Single source of truth for the print layout used across all modes
 */
import { forwardRef, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { PrintTheme, getThemeById } from '../printThemes';
import ShipmentTaglineFooter from '../ShipmentTaglineFooter';
import type {
  ShipmentPrintData, MovementSupervisor,
  WASTE_TYPE_LABELS, STATUS_LABELS, HAZARD_LABELS, DISPOSAL_LABELS, PACKAGING_LABELS,
} from './types';
import {
  WASTE_TYPE_LABELS as wasteLabels,
  STATUS_LABELS as statusLabels,
  HAZARD_LABELS as hazardLabels,
  DISPOSAL_LABELS as disposalLabels,
  PACKAGING_LABELS as packagingLabels,
} from './types';

interface ShipmentA4DocumentProps {
  shipment: ShipmentPrintData;
  theme: PrintTheme;
  qrData: any;
  driverName: string;
  vehiclePlate: string;
  documentSerial: string;
  verificationCode: string;
  supervisors?: MovementSupervisor[];
  declaration?: any;
  /** Which pages to render */
  pages?: ('summary' | 'details')[];
  /** Whether to use compact single-page mode */
  compact?: boolean;
}

const ShipmentA4Document = forwardRef<HTMLDivElement, ShipmentA4DocumentProps>(({
  shipment, theme, qrData, driverName, vehiclePlate,
  documentSerial, verificationCode, supervisors = [], declaration,
  pages = ['summary'], compact = true,
}, ref) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');

  const shipmentUrl = qrData?.url || `${window.location.origin}/verify?type=shipment&code=${shipment.shipment_number}`;
  const qrPayload = qrData?.fullPayload || shipmentUrl;

  // Convert QR to data URL for PDF
  useEffect(() => {
    if (qrRef.current) {
      setTimeout(() => {
        if (qrRef.current) setQrDataUrl(qrRef.current.toDataURL('image/png'));
      }, 100);
    }
  }, [shipment.id]);

  // Convert barcode to data URL
  useEffect(() => {
    if (barcodeRef.current) {
      setTimeout(() => {
        const svg = barcodeRef.current?.querySelector('svg');
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setBarcodeDataUrl(canvas.toDataURL('image/png'));
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }, 100);
    }
  }, [shipment.id]);

  const formatDate = (date: string | null) => date ? format(new Date(date), 'dd/MM/yyyy', { locale: ar }) : '-';

  const cellStyle = (isLabel = false, bg?: string): React.CSSProperties => ({
    border: `1px solid ${theme.colors.border}`,
    padding: compact ? '3px 5px' : '4px 6px',
    fontSize: compact ? '7.5pt' : '8.5pt',
    lineHeight: '1.3',
    ...(isLabel ? { background: bg || theme.colors.labelBg, fontWeight: '700', color: theme.colors.labelText } : {}),
  });

  const sectionHeader = (bg: string, color: string, text: string, extra?: string): React.CSSProperties => ({
    background: bg, color, fontWeight: 'bold', textAlign: 'center' as const,
    fontSize: compact ? '8pt' : '9pt', padding: compact ? '3px' : '5px',
    border: `1px solid ${theme.colors.border}`,
  });

  const renderOrgSection = (
    org: ShipmentPrintData['generator'],
    title: string,
    bgColor: string, textColor: string, lightBg: string,
    extraFields?: { label: string; value: string }[]
  ) => (
    <table style={{ borderCollapse: 'collapse', marginBottom: '0px', width: '100%' }}>
      <tbody>
        <tr>
          <td colSpan={8} style={sectionHeader(bgColor, textColor, title)}>
            {title}: {org?.name || '-'}
            {org?.client_code && <span style={{ marginRight: '8px', background: lightBg, color: textColor, padding: '1px 6px', borderRadius: '3px', fontSize: compact ? '7pt' : '8pt' }}>{org.client_code}</span>}
          </td>
        </tr>
        <tr>
          <td style={cellStyle(true, lightBg)} className="w-[12%]">السجل التجاري</td>
          <td style={cellStyle()} className="w-[13%]">{org?.commercial_register || '-'}</td>
          <td style={cellStyle(true, lightBg)} className="w-[12%]">البطاقة الضريبية</td>
          <td style={cellStyle()} className="w-[13%]">{org?.tax_card || '-'}</td>
          <td style={cellStyle(true, lightBg)} className="w-[12%]">رقم الموافقة البيئية</td>
          <td style={cellStyle()} className="w-[13%]">{org?.environmental_approval_number || '-'}</td>
          <td style={cellStyle(true, lightBg)} className="w-[12%]">رخصة إدارة المخلفات</td>
          <td style={cellStyle()} className="w-[13%]">{org?.wmra_license || '-'}</td>
        </tr>
        <tr>
          <td style={cellStyle(true, lightBg)}>العنوان</td>
          <td style={cellStyle()} colSpan={3}>{org?.address || '-'} {org?.city && `- ${org.city}`}</td>
          <td style={cellStyle(true, lightBg)}>الهاتف</td>
          <td style={cellStyle()}>{org?.phone || '-'}</td>
          <td style={cellStyle(true, lightBg)}>ممثل الجهة</td>
          <td style={cellStyle()}>{org?.representative_name || '-'}</td>
        </tr>
        {extraFields && extraFields.length > 0 && (
          <tr>
            {extraFields.map((f, i) => (
              <>
                <td key={`l-${i}`} style={cellStyle(true, lightBg)}>{f.label}</td>
                <td key={`v-${i}`} style={cellStyle()}>{f.value}</td>
              </>
            ))}
            {extraFields.length < 4 && <td colSpan={8 - extraFields.length * 2} style={cellStyle()} />}
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <>
      {/* Hidden elements for data URL generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <QRCodeCanvas ref={qrRef} value={qrPayload} size={80} level="H" includeMargin={false} />
        <div ref={barcodeRef}>
          <Barcode value={qrData?.barcodeValue || shipment.shipment_number} format="CODE128" width={1.2} height={35} displayValue={false} background="#ffffff" lineColor="#000000" />
        </div>
      </div>

      <div ref={ref} className="print-transparent-tables bg-white p-3 rounded-lg border"
        style={{ direction: 'rtl', fontSize: compact ? '7pt' : '8pt', color: '#000000', fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif", lineHeight: '1.3', WebkitFontSmoothing: 'antialiased' }}>
        <style>{`
          .print-transparent-tables table, .print-transparent-tables tr,
          .print-transparent-tables th, .print-transparent-tables td,
          .print-transparent-tables thead, .print-transparent-tables tbody {
            background-color: transparent !important; background: transparent !important;
          }
          .print-transparent-tables table { margin-bottom: 0 !important; }
        `}</style>

        <div className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: '279mm', boxSizing: 'border-box', paddingBottom: '2px' }}>
          {/* ═══ HEADER ═══ */}
          <table style={{ marginBottom: '0px', border: 'none', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ width: '18%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                  {barcodeDataUrl && <img src={barcodeDataUrl} alt="Barcode" style={{ maxHeight: '28px', width: '100%' }} />}
                  <div style={{ fontSize: '7pt', color: '#000', fontFamily: 'monospace', fontWeight: 'bold' }}>{shipment.shipment_number}</div>
                  {qrData?.docHash && <div style={{ fontSize: '4pt', color: '#6b7280', fontFamily: 'monospace' }}>H:{qrData.docHash}</div>}
                </td>
                <td style={{ width: '64%', textAlign: 'center', border: 'none', padding: '2px' }}>
                   <div style={{ fontSize: compact ? '12pt' : '14pt', fontWeight: 'bold', color: theme.colors.primary }}>نموذج تتبع نقل المخلفات</div>
                   <div style={{ fontSize: compact ? '8pt' : '9pt', color: '#6b7280', marginBottom: '1px' }}>Waste Transport Tracking Form</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                     <span style={{ background: theme.colors.statusBg, color: theme.colors.statusText, padding: '2px 8px', borderRadius: theme.borderRadius, fontSize: compact ? '7pt' : '8pt', fontWeight: '600', border: `1px solid ${theme.colors.statusBorder}` }}>
                       {statusLabels[shipment.status] || shipment.status}
                     </span>
                     <span style={{ background: '#f3f4f6', color: '#000', padding: '2px 8px', borderRadius: theme.borderRadius, fontFamily: 'monospace', fontWeight: 'bold', fontSize: compact ? '8pt' : '9pt', border: '1px solid #d1d5db' }}>
                       {shipment.shipment_number}
                     </span>
                  </div>
                   <div style={{ fontSize: compact ? '6.5pt' : '7pt', color: '#6b7280' }}>
                     الرقم التسلسلي: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: theme.colors.primary }}>{documentSerial}</span>
                     {verificationCode && <> | كود التحقق: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#dc2626' }}>{verificationCode}</span></>}
                   </div>
                </td>
                <td style={{ width: '13%', textAlign: 'center', border: 'none', verticalAlign: 'top', padding: '2px' }}>
                  {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: '50px', height: '50px' }} />}
                  <div style={{ fontSize: '4pt', color: '#6b7280' }}>امسح للتحقق والتتبع</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ═══ ORG LOGOS ═══ */}
          <table style={{ borderCollapse: 'collapse', marginBottom: '0px', width: '100%' }}>
            <tbody>
              <tr>
                {[
                  { org: shipment.generator, bg: theme.colors.generatorLight || '#f0f9ff', icon: '🏢', label: 'الجهة المولدة' },
                  { org: shipment.transporter, bg: theme.colors.transporterLight || '#fffbeb', icon: '🚛', label: 'الجهة الناقلة' },
                  { org: shipment.recycler, bg: theme.colors.recyclerLight || '#f0fdf4', icon: '♻️', label: 'جهة التدوير' },
                ].map((item, i) => (
                  <td key={i} style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.borderLight}`, background: item.bg }}>
                     {item.org?.stamp_url ? (
                       <img src={item.org.stamp_url} alt="logo" style={{ maxHeight: '24px', maxWidth: '70px', objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
                     ) : (
                       <div style={{ fontSize: '7.5pt', fontWeight: '600' }}>{item.icon} {item.org?.name || item.label}</div>
                    )}
                    {item.org?.client_code && <div style={{ fontSize: '4.5pt', fontFamily: 'monospace', color: '#6b7280' }}>{item.org.client_code}</div>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* ═══ SHIPMENT DETAILS ═══ */}
          <table style={{ borderCollapse: 'collapse', marginBottom: '0px', width: '100%' }}>
            <tbody>
              <tr><td colSpan={8} style={sectionHeader(theme.colors.shipmentBg, theme.colors.shipmentText, 'بيانات الشحنة')}>بيانات الشحنة</td></tr>
              <tr>
                <td style={cellStyle(true)}>نوع المخلفات</td>
                <td style={cellStyle()}>{wasteLabels[shipment.waste_type] || shipment.waste_type}</td>
                <td style={cellStyle(true)}>الكمية</td>
                <td style={cellStyle()}>{shipment.weighbridge_net_weight || shipment.quantity} {shipment.unit || 'كجم'}</td>
                <td style={cellStyle(true)}>مستوى الخطورة</td>
                <td style={cellStyle()}>{hazardLabels[shipment.hazard_level || ''] || shipment.hazard_level || '-'}</td>
                <td style={cellStyle(true)}>تاريخ الاستلام</td>
                <td style={cellStyle()}>{formatDate(shipment.pickup_date)}</td>
              </tr>
              <tr>
                <td style={cellStyle(true)}>طريقة التعبئة</td>
                <td style={cellStyle()}>{packagingLabels[shipment.packaging_method || ''] || shipment.packaging_method || '-'}</td>
                <td style={cellStyle(true)}>طريقة التخلص</td>
                <td style={cellStyle()}>{disposalLabels[shipment.disposal_method || ''] || shipment.disposal_method || '-'}</td>
                <td style={cellStyle(true)}>وصف المخلفات</td>
                <td colSpan={3} style={cellStyle()}>{shipment.waste_description || '-'}</td>
              </tr>
              <tr>
                <td style={cellStyle(true)}>موقع الاستلام</td>
                <td colSpan={3} style={cellStyle()}>{shipment.pickup_address}</td>
                <td style={cellStyle(true)}>موقع التسليم</td>
                <td colSpan={3} style={cellStyle()}>{shipment.delivery_address}</td>
              </tr>
            </tbody>
          </table>

          {/* ═══ GENERATOR ═══ */}
          {renderOrgSection(shipment.generator, 'بيانات الجهة المولدة',
            theme.colors.generatorBg, theme.colors.generatorText, theme.colors.generatorLight || '#dbeafe',
            [
              { label: 'تسجيل المنشأة', value: shipment.generator?.establishment_registration || '-' },
              { label: 'النشاط المسجل', value: shipment.generator?.registered_activity || shipment.generator?.activity_type || '-' },
            ]
          )}

          {/* ═══ TRANSPORTER ═══ */}
          {renderOrgSection(shipment.transporter, 'بيانات الجهة الناقلة',
            theme.colors.transporterBg, theme.colors.transporterText, theme.colors.transporterLight || '#fef3c7',
            [
              { label: 'رخصة النقل البري', value: shipment.transporter?.land_transport_license || '-' },
              { label: 'السائق', value: driverName },
              { label: 'لوحة المركبة', value: vehiclePlate },
            ]
          )}

          {/* ═══ RECYCLER ═══ */}
          {renderOrgSection(shipment.recycler, 'بيانات جهة التدوير',
            theme.colors.recyclerBg, theme.colors.recyclerText, theme.colors.recyclerLight || '#dcfce7',
            [
              { label: 'رخصة التنمية الصناعية', value: shipment.recycler?.ida_license || '-' },
              { label: 'السجل الصناعي', value: shipment.recycler?.industrial_registry || '-' },
              { label: 'رقم الترخيص', value: shipment.recycler?.license_number || '-' },
            ]
          )}

          {/* ═══ LEGAL DECLARATIONS ═══ */}
          <table style={{ borderCollapse: 'collapse', marginBottom: '0px', width: '100%' }}>
            <tbody>
              <tr><td colSpan={2} style={{ background: '#e2e8f0', color: '#000', fontWeight: 'bold', textAlign: 'center', fontSize: '7pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>الإقرارات القانونية والبيئية</td></tr>
              {[
                { bg: theme.colors.generatorLight || '#eff6ff', label: 'إقرار المولّد', text: 'يُقر المولّد بأن المخلفات ناتجة عن نشاطه وملتزم بيئياً وفقاً للقانون 202/2020 والقانون 4/1994 ولوائحهما.' },
                { bg: theme.colors.transporterLight || '#fffbeb', label: 'إقرار الناقل', text: 'يُقر الناقل بتطبيق المعايير البيئية واشتراطات WMRA ويتحمل المسؤولية عن سلامة المخلفات خلال النقل.' },
                { bg: theme.colors.recyclerLight || '#f0fdf4', label: 'إقرار المستقبل', text: 'يُقر المستقبل باستلام المخلفات وتطبيق المعايير البيئية وفقاً لترخيصه ومعايير WMRA.' },
                { bg: '#fef2f2', label: 'إخلاء مسؤولية', text: 'منصة iRecycle أداة رقمية للتوثيق فقط ولا تتحمل مسؤولية قانونية. المسؤولية على الأطراف الموقّعة.', labelColor: '#991b1b' },
              ].map((d, i) => (
                <tr key={i}>
                  <td style={{ background: d.bg, fontWeight: '600', width: '12%', border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6.5pt', verticalAlign: 'top', color: d.labelColor || '#000' }}>{d.label}</td>
                   <td style={{ border: `1px solid ${theme.colors.border}`, padding: '2px 4px', fontSize: '6.5pt', lineHeight: '1.35', color: '#000' }}>{d.text}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ═══ MOVEMENT SUPERVISORS ═══ */}
          {supervisors.length > 0 && (
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px', width: '100%' }}>
              <tbody>
                <tr><td colSpan={4} style={{ background: '#e0e7ff', color: '#312e81', fontWeight: 'bold', textAlign: 'center', fontSize: '7.5pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>👁️ مسئولو الحركة والمتابعة</td></tr>
                <tr>
                   {['الجهة', 'المسئول', 'الهاتف', 'وضع التوقيع'].map(h => (
                     <td key={h} style={{ background: '#eef2ff', fontWeight: '600', fontSize: '7pt', padding: '2px 4px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>{h}</td>
                   ))}
                </tr>
                {supervisors.map((sup, i) => {
                  const roleLabels: Record<string, string> = { generator: 'المولد', transporter: 'الناقل', recycler: 'المدوّر', disposal: 'التخلص' };
                  const methodLabels: Record<string, string> = { manual: 'يدوي', otp: 'OTP', national_id: 'رقم قومي', digital_stamp: 'ختم رقمي', full_auto: 'تلقائي كامل' };
                  return (
                     <tr key={i}>
                       <td style={{ fontSize: '6.5pt', padding: '2px 4px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>{roleLabels[sup.party_role] || sup.party_role}</td>
                       <td style={{ fontSize: '6.5pt', padding: '2px 4px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>{sup.supervisor_type === 'ai' ? '🤖 ' : '👤 '}{sup.supervisor_name || '-'}</td>
                       <td style={{ fontSize: '6.5pt', padding: '2px 4px', border: `1px solid ${theme.colors.border}`, color: '#000', fontFamily: 'monospace' }}>{sup.supervisor_phone || '-'}</td>
                       <td style={{ fontSize: '6.5pt', padding: '2px 4px', border: `1px solid ${theme.colors.border}`, color: '#000' }}>{methodLabels[sup.auto_sign_method || 'manual'] || 'يدوي'}</td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* ═══ STAMPS & SIGNATURES ═══ */}
          <table style={{ borderCollapse: 'collapse', marginBottom: '0', flexGrow: 1, width: '100%' }}>
            <tbody>
              <tr><td colSpan={3} style={{ background: theme.colors.stampBg, color: theme.colors.stampText, fontWeight: 'bold', textAlign: 'center', fontSize: '7.5pt', padding: '2px', border: `1px solid ${theme.colors.border}` }}>التوقيعات والأختام</td></tr>
              <tr>
                {[
                  { org: shipment.generator, label: 'المولّد', bg: theme.colors.generatorLight || '#eff6ff' },
                  { org: shipment.transporter, label: 'الناقل', bg: theme.colors.transporterLight || '#fffbeb' },
                  { org: shipment.recycler, label: 'المستقبل', bg: theme.colors.recyclerLight || '#f0fdf4' },
                ].map((item, i) => (
                  <td key={i} style={{ width: '33.33%', textAlign: 'center', padding: '2px', border: `1px solid ${theme.colors.border}`, background: item.bg }}>
                     <div style={{ fontSize: '7.5pt', fontWeight: '700', color: '#000' }}>{item.label}</div>
                     <div style={{ fontSize: '6.5pt', color: '#000' }}>{item.org?.representative_name || item.org?.name || '-'}</div>
                  </td>
                ))}
              </tr>
              <tr>
                {[shipment.generator, shipment.transporter, shipment.recycler].map((org, i) => (
                  <td key={i} style={{ width: '33.33%', textAlign: 'center', padding: '3px', verticalAlign: 'top', border: `1px solid ${theme.colors.border}`, minHeight: '45px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'flex-end', minHeight: '22px' }}>
                      {org?.stamp_url && <img src={org.stamp_url} alt="ختم" style={{ maxHeight: '22px', maxWidth: '22px', objectFit: 'contain' }} crossOrigin="anonymous" />}
                      {org?.signature_url && <img src={org.signature_url} alt="توقيع" style={{ maxHeight: '20px', maxWidth: '40px', objectFit: 'contain' }} crossOrigin="anonymous" />}
                    </div>
                    <div style={{ borderTop: '1px dashed #9ca3af', marginTop: '2px', paddingTop: '1px', fontSize: '6pt', color: '#000' }}>الاسم / التوقيع / الختم</div>
                    <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                      <QRCodeSVG
                        value={`${window.location.origin}/qr-verify?type=signer&code=${encodeURIComponent(org?.commercial_register || org?.name || '')}&doc=${encodeURIComponent(shipment.shipment_number)}`}
                        size={28} level="M"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* ═══ DECLARATION ═══ */}
          {declaration && (
            <table style={{ borderCollapse: 'collapse', marginBottom: '0px', width: '100%' }}>
              <tbody>
                <tr>
                  <td colSpan={2} style={{ background: '#7c3aed', color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: compact ? '6pt' : '8pt', padding: compact ? '2px' : '4px', border: '1px solid #6d28d9' }}>
                    📋 إقرار تسليم الشحنة
                  </td>
                </tr>
                <tr>
                  <td style={{ width: '70%', padding: compact ? '2px' : '6px', border: '1px solid #d1d5db', fontSize: compact ? '5pt' : '7pt', verticalAlign: 'top' }}>
                    <div><span style={{ color: '#6b7280' }}>المُقِر: </span><strong>{declaration.driver_name || '-'}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>تاريخ: </span><strong>{declaration.declared_at ? format(new Date(declaration.declared_at), 'dd/MM/yyyy hh:mm a', { locale: ar }) : '-'}</strong></div>
                    <div style={{ marginTop: '2px', fontSize: '5pt', color: '#16a34a', fontWeight: '600' }}>✅ تم التوقيع إلكترونياً</div>
                  </td>
                  <td style={{ width: '30%', textAlign: 'center', padding: compact ? '2px' : '6px', border: '1px solid #d1d5db' }}>
                    <QRCodeSVG value={`${window.location.origin}/qr-verify?type=declaration&code=DEC-${declaration.id?.slice(0, 8).toUpperCase()}`} size={35} level="M" />
                    <div style={{ fontSize: '4pt', color: '#6b7280', marginTop: '1px' }}>DEC-{declaration.id?.slice(0, 8).toUpperCase()}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* ═══ TAGLINE ═══ */}
          <ShipmentTaglineFooter shipmentNumber={shipment.shipment_number} disposalMethod={shipment.disposal_method} />

          {/* ═══ FOOTER ═══ */}
           <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '6.5pt', color: '#000', paddingTop: '3px', paddingBottom: '2px', borderTop: '1px solid #e5e7eb', background: 'rgba(241,245,249,0.5)', borderRadius: '0 0 3px 3px' }}>
             <div style={{ fontWeight: '600' }}>تم إنشاء هذا النموذج بواسطة نظام إدارة المخلفات الذكي</div>
             <div style={{ fontFamily: 'monospace', fontSize: '6pt' }}>
              رقم التتبع: {shipment.shipment_number} | {documentSerial} | {verificationCode} | {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

ShipmentA4Document.displayName = 'ShipmentA4Document';
export default ShipmentA4Document;
