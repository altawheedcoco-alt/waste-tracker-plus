import React, { forwardRef, ReactNode, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Leaf, FileCheck, Building2, CheckCircle2, Shield, Hash } from 'lucide-react';
import { useGuillocheBackground } from '@/hooks/useGuillocheBackground';
import { generatePatternPaths, GUILLOCHE_COLOR_PALETTES, type SavedPatternRef } from '@/lib/guillochePatternUtils';

// ===== Partner Identity (Logo + Barcode) =====
export interface PrintPartner {
  name: string;
  role: string; // المولّد، الناقل، المدوّر
  logo?: string | null;
  barcode?: string | null; // Organization barcode/client code
}

interface PrintWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  documentNumber?: string;
  verificationCode?: string;
  serialNumber?: string; // e.g. shipment number
  showQR?: boolean;
  showBarcode?: boolean;
  qrValue?: string;
  barcodeValue?: string;
  organizationName?: string;
  organizationLogo?: string | null;
  /** Partner identity strip */
  partners?: PrintPartner[];
  showWatermark?: boolean;
  watermarkText?: string;
  isOfficial?: boolean;
  showFooter?: boolean;
  footerText?: string;
  /** Accent color for borders */
  accentColor?: string;
  /** Shipment arrival date for footer */
  arrivalDate?: string | null;
  className?: string;
}

/** Renders guilloche pattern layers as SVG background */
const GuillocheBackgroundLayer = ({ patterns }: { patterns: SavedPatternRef[] }) => {
  if (!patterns.length) return null;
  const tileSize = 200;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {patterns.map((ref, idx) => {
        const palette = GUILLOCHE_COLOR_PALETTES.find(c => c.id === ref.colorPaletteId);
        if (!palette) return null;
        const paths = generatePatternPaths(ref.patternType, tileSize, ref.scale, ref.seed);
        const opacity = 0.08 - idx * 0.015;
        const gradId = `pw-grad-${ref.id}-${idx}`;
        const patId = `pw-pat-${ref.id}-${idx}`;
        return (
          <div key={ref.id} style={{ position: 'absolute', inset: 0, opacity }}>
            <svg width="100%" height="100%" viewBox="0 0 595 842" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={palette.primary} />
                  <stop offset="100%" stopColor={palette.secondary} />
                </linearGradient>
                <pattern id={patId} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize}>
                  <g transform={`rotate(${ref.rotation} ${tileSize / 2} ${tileSize / 2})`}>
                    <g opacity={ref.opacity * 10}>
                      {paths.map((d, i) => (
                        <path key={i} d={d} fill="none" stroke={`url(#${gradId})`} strokeWidth={ref.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                      ))}
                    </g>
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${patId})`} />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

const PrintWrapper = forwardRef<HTMLDivElement, PrintWrapperProps>(({
  children,
  title,
  subtitle,
  documentNumber,
  verificationCode,
  serialNumber,
  showQR = true, // kept for API compat but always rendered
  showBarcode = true, // kept for API compat but always rendered
  qrValue,
  barcodeValue,
  organizationName,
  organizationLogo,
  partners = [],
  showWatermark = true,
  watermarkText = 'iRecycle',
  isOfficial = false,
  showFooter = true,
  footerText,
  accentColor = '#16a34a',
  arrivalDate,
  className = '',
}, ref) => {
  // QR and Barcode are ALWAYS shown (mandatory digital verification identity)
  const forceQR = true;
  const forceBarcode = true;
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const currentTime = format(new Date(), 'p', { locale: ar });
  const qrContent = qrValue || `${window.location.origin}/verify?type=document&code=${verificationCode || documentNumber || Date.now()}`;
  const barcodeContent = barcodeValue || documentNumber || `DOC${Date.now()}`;
  const vCode = verificationCode || `VRF-${Date.now().toString(36).toUpperCase()}`;

  // Guilloche background from user preferences
  const { savedPatterns, bgColor } = useGuillocheBackground();

  return (
    <div
      ref={ref}
      className={`print-container text-black ${isOfficial ? 'print-official' : ''} ${className}`}
      dir="rtl"
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        margin: '0 auto', 
        padding: '10mm 12mm',
        boxSizing: 'border-box',
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bgColor || '#ffffff',
      }}
    >
      {/* Guilloche Pattern Background */}
      <GuillocheBackgroundLayer patterns={savedPatterns} />

      {/* Watermark */}
      {showWatermark && (
        <div className="print-watermark">{watermarkText}</div>
      )}

      {/* ===== HEADER: Title ===== */}
      <header className="print-header flex items-start justify-between mb-3 pb-3" style={{ borderBottom: `2px solid ${accentColor}`, position: 'relative', zIndex: 1 }}>

        {/* Title Section */}
        <div className="text-center flex-1 px-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Leaf className="w-5 h-5" style={{ color: accentColor }} />
            <h1 className="text-lg font-bold print-title" style={{ color: accentColor }}>{title}</h1>
            <Leaf className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}

          {/* Serial & Document Numbers */}
          <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
            {documentNumber && (
              <span className="inline-block bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs">
                رقم الوثيقة: <span className="font-mono font-bold" style={{ color: accentColor }}>{documentNumber}</span>
              </span>
            )}
            {serialNumber && (
              <span className="inline-block bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs">
                رقم الشحنة: <span className="font-mono font-bold text-gray-800">{serialNumber}</span>
              </span>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="text-center flex-shrink-0">
          {organizationLogo && (
            <img src={organizationLogo} alt={organizationName || 'Logo'} className="h-12 mx-auto mb-1 object-contain" crossOrigin="anonymous" />
          )}
          {organizationName && <p className="text-[7pt] text-gray-600 mt-0.5">{organizationName}</p>}
        </div>
      </header>

      {/* ===== VERIFICATION + DATE BAR ===== */}
      <div className="flex justify-between items-center text-[8pt] text-gray-500 mb-2 pb-1.5 border-b border-gray-100" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>كود التحقق: <span className="font-mono font-bold text-gray-700">{vCode}</span></span>
        </div>
        <span>تاريخ الإصدار: {currentDate} | {currentTime}</span>
      </div>

      {/* ===== PARTNER IDENTITY STRIP ===== */}
      {partners.length > 0 && (
        <div className="mb-4 p-2 border border-gray-200 rounded-lg bg-gray-50/50" style={{ position: 'relative', zIndex: 1 }}>
          <p className="text-[7pt] text-gray-500 mb-1.5 font-bold text-center">الجهات المشاركة</p>
          <div className="flex items-center justify-around gap-2 flex-wrap">
            {partners.map((partner, idx) => (
              <div key={idx} className="text-center flex-1 min-w-[80px] max-w-[140px]">
                {partner.logo ? (
                  <img src={partner.logo} alt={partner.name} className="h-8 mx-auto mb-1 object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <p className="text-[7pt] font-bold text-gray-800 truncate">{partner.name}</p>
                <p className="text-[6pt] text-gray-500">{partner.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="print-content flex-1" style={{ pageBreakInside: 'auto', position: 'relative', zIndex: 1 }}>{children}</main>

      {/* ===== SECURE FOOTER ===== */}
      {showFooter && (
        <footer className="print-footer mt-6 pt-3 border-t-2 text-center text-[8pt] text-gray-500" style={{ borderColor: accentColor, pageBreakInside: 'avoid' }}>
          {/* Legal Disclaimer */}
          <div className="mb-2 px-2">
            <p className="text-[7pt] text-gray-600 leading-relaxed">
              هذا المستند صدر آلياً من منصة iRecycle. البيانات الواردة به تم إدخالها بواسطة المستخدم وتحت مسؤوليته الكاملة.
              لا تتحمل إدارة المنصة أي مسؤولية قانونية أو مدنية تجاه الغير بخصوص صحة هذه البيانات أو طبيعة المواد المشحونة فعلياً.
              يعتبر رمز التحقق (QR Code) والباركود المرفق هو المرجع الوحيد لإثبات صحة صدور المستند من النظام،
              ولا يتطلب المستند توقيعاً خطياً أو ختماً يدوياً للاعتداد به رقمياً.
            </p>
          </div>
          {/* Footer QR + Barcode + Verification */}
          <div className="flex items-center justify-between mb-2 px-2">
            {/* QR Code */}
            {showQR && (
              <div className="flex-shrink-0">
                <QRCodeSVG value={qrContent} size={56} level="M" includeMargin={false} />
                <p className="text-[6pt] text-gray-400 mt-0.5">امسح للتحقق</p>
              </div>
            )}

            <div className="text-center flex-1 px-3">
              <p>{footerText || 'هذه الوثيقة صادرة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير - آي ريسايكل'}</p>
              <p className="mt-0.5">
                رقم المرجع: {documentNumber || '-'} | كود التحقق: <span className="font-mono font-bold">{vCode}</span>
                {serialNumber && <> | رقم الشحنة: <span className="font-mono">{serialNumber}</span></>}
              </p>
              {arrivalDate && (
                <p className="mt-0.5">تاريخ وصول الشحنة: {format(new Date(arrivalDate), 'PPp', { locale: ar })}</p>
              )}
            </div>

            {/* Barcode */}
            {showBarcode && (
              <div className="flex-shrink-0">
                <Barcode value={barcodeContent} width={1} height={28} fontSize={7} displayValue={true} margin={0} />
              </div>
            )}
          </div>
          <p className="text-gray-400 text-[7pt]">
            مستند صادر آلياً من نظام iRecycle ولا يُعتد به بدون رمز التحقق الرقمي — وفقاً لقانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004
          </p>
        </footer>
      )}
    </div>
  );
});

PrintWrapper.displayName = 'PrintWrapper';

// ===== SUB-COMPONENTS =====

export const PrintSection = ({
  title,
  icon: Icon = FileCheck,
  children,
  className = '',
}: {
  title: string;
  icon?: any;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`print-info-box mb-4 ${className}`}>
    <h3 className="print-info-box-title flex items-center gap-2 font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
      <Icon className="w-4 h-4 text-green-600" />
      {title}
    </h3>
    <div className="text-sm">{children}</div>
  </div>
);

export const PrintDeclaration = ({
  title,
  children,
  variant = 'success',
}: {
  title: string;
  children: ReactNode;
  variant?: 'success' | 'info' | 'warning';
}) => {
  const variants = {
    success: 'bg-green-50 border-green-200 text-green-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  const titleColors = {
    success: 'text-green-700',
    info: 'text-blue-700',
    warning: 'text-amber-700',
  };

  return (
    <div className={`print-declaration rounded-lg p-4 mb-4 border ${variants[variant]}`}>
      <h3 className={`print-declaration-title font-bold mb-2 flex items-center gap-2 ${titleColors[variant]}`}>
        <CheckCircle2 className="w-5 h-5" />
        {title}
      </h3>
      <div className="print-declaration-content text-sm leading-relaxed">{children}</div>
    </div>
  );
};

export const PrintPartyCard = ({
  title,
  icon: Icon = Building2,
  name,
  details,
  highlighted = false,
}: {
  title: string;
  icon?: any;
  name: string;
  details: { label: string; value: string }[];
  highlighted?: boolean;
}) => (
  <div className={`border rounded-lg p-3 ${highlighted ? 'bg-green-50 border-green-200' : ''}`}>
    <h4 className={`font-bold mb-2 flex items-center gap-1 text-sm border-b pb-2 ${highlighted ? 'text-green-700' : 'text-gray-700'}`}>
      <Icon className="w-4 h-4" />
      {title}
    </h4>
    <div className="text-xs space-y-1">
      <p className="font-semibold">{name}</p>
      {details.map((detail, index) => (
        <p key={index} className="text-gray-600">
          <span className="font-medium">{detail.label}: </span>
          {detail.value || '-'}
        </p>
      ))}
    </div>
  </div>
);

export const PrintSignatureSection = ({
  signatures,
  documentRef,
}: {
  signatures: {
    title: string;
    name?: string;
    stampUrl?: string | null;
    signatureUrl?: string | null;
    date?: string;
    sealNumber?: string;
    nationalId?: string;
    signatoryCode?: string;
  }[];
  documentRef?: string;
}) => (
  <div className="print-signatures mt-8 pt-6 border-t-2 border-gray-300">
    <p className="text-center text-[8pt] text-gray-500 mb-4 flex items-center justify-center gap-1">
      <Shield className="w-3 h-3" />
      منطقة التوقيعات والأختام المعتمدة
    </p>
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${signatures.length}, 1fr)` }}>
      {signatures.map((sig, index) => {
        const sigVerifyUrl = sig.sealNumber || sig.signatoryCode
          ? `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=signer&code=${encodeURIComponent(sig.sealNumber || sig.signatoryCode || '')}&doc=${encodeURIComponent(documentRef || '')}`
          : '';

        return (
          <div key={index} className="print-signature-box text-center border border-gray-200 rounded-lg p-3">
            <p className="font-bold text-gray-800 mb-1 text-sm">{sig.title}</p>
            {sig.name && <p className="text-xs text-gray-600 mb-2">{sig.name}</p>}

            <div className="flex justify-center gap-4 mt-2">
              {/* Signature */}
              <div className="text-center">
                {sig.signatureUrl ? (
                  <img src={sig.signatureUrl} alt="التوقيع" className="h-12 mx-auto mb-1 object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="print-signature-line w-24 mx-auto" />
                )}
                <p className="text-[7pt] text-gray-500">التوقيع</p>
              </div>
              {/* Stamp */}
              <div className="text-center">
                {sig.stampUrl ? (
                  <img src={sig.stampUrl} alt="الختم" className="h-14 mx-auto mb-1 object-contain" crossOrigin="anonymous" />
                ) : (
                  <div className="print-stamp-placeholder" />
                )}
                <p className="text-[7pt] text-gray-500">الختم</p>
              </div>
            </div>

            {/* Signer QR + Seal info */}
            <div className="mt-3 pt-2 border-t border-dashed border-gray-200 flex items-center justify-center gap-3">
              <div className="text-right">
                {sig.sealNumber && (
                  <p className="text-[7pt] font-mono text-gray-600">
                    <Hash className="w-2.5 h-2.5 inline-block ml-0.5" />
                    رقم الختم: {sig.sealNumber}
                  </p>
                )}
                {sig.signatoryCode && (
                  <p className="text-[7pt] font-mono text-gray-600">كود المفوض: {sig.signatoryCode}</p>
                )}
                {sig.nationalId && (
                  <p className="text-[7pt] text-gray-500">هوية: ***{sig.nationalId.slice(-4)}</p>
                )}
              </div>
            </div>

            {sig.date && <p className="text-[7pt] text-gray-500 mt-2">التاريخ: {sig.date}</p>}
          </div>
        );
      })}
    </div>
  </div>
);

export const PrintTable = ({
  headers,
  rows,
  className = '',
}: {
  headers: string[];
  rows: (string | number | ReactNode)[][];
  className?: string;
}) => (
  <table className={`w-full border-collapse text-sm mb-4 ${className}`}>
    <thead>
      <tr>
        {headers.map((header, index) => (
          <th key={index} className="p-2 bg-gray-100 font-semibold text-right border border-gray-300">{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-gray-50' : ''}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex} className="p-2 border border-gray-300 text-right">{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export const PrintStats = ({
  stats,
}: {
  stats: { label: string; value: string | number; color?: string }[];
}) => (
  <div className="print-grid-4 grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)` }}>
    {stats.map((stat, index) => (
      <div key={index} className="print-stat-card text-center p-3 border rounded-lg">
        <div className={`print-stat-value text-2xl font-bold ${stat.color || 'text-green-600'}`}>
          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
        </div>
        <div className="print-stat-label text-xs text-gray-600 mt-1">{stat.label}</div>
      </div>
    ))}
  </div>
);

export default PrintWrapper;
