/**
 * SecureLetterhead — Renders a full A4 secure letterhead with:
 * - Organization header (logo, name, details)
 * - Watermark (rotated org name/logo)
 * - Guilloche security patterns
 * - QR Code + Barcode + Serial Number
 * - SHA-256 digital fingerprint
 * - Ornate/double borders
 */
import React, { forwardRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Shield, Hash, CheckCircle2 } from 'lucide-react';

interface LetterheadConfig {
  // Organization
  orgName: string;
  orgNameEn?: string;
  orgLogo?: string | null;
  orgAddress?: string;
  orgPhone?: string;
  orgEmail?: string;
  orgCR?: string; // Commercial Registration
  orgTaxId?: string;

  // Template settings
  accentColor: string;
  borderStyle: 'none' | 'single' | 'double' | 'ornate';
  headerLayout: 'centered' | 'left-aligned' | 'split';
  
  // Security features
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  showGuilloche: boolean;
  guillocheColor: string;
  showQR: boolean;
  showBarcode: boolean;
  showSerialNumber: boolean;
  showSHA256: boolean;

  // Document info
  serialNumber: string;
  verificationCode: string;
  sha256Hash?: string;
  documentTitle?: string;
  documentDate?: string;
}

interface SecureLetterheadProps {
  config: LetterheadConfig;
  children?: React.ReactNode;
  className?: string;
}

/** Generate SVG guilloche pattern */
const GuillochePattern: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 0.08 }) => {
  const paths = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < 12; i++) {
      const y = 8 + i * 4;
      result.push(`M0,${y} Q100,${y + (i % 2 === 0 ? 15 : -15)} 200,${y} T400,${y}`);
    }
    return result;
  }, []);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 60" style={{ opacity }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="0.5" />
      ))}
    </svg>
  );
};

/** Watermark overlay */
const WatermarkOverlay: React.FC<{ text: string; opacity: number }> = ({ text, opacity }) => (
  <div 
    className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
    style={{ opacity: Math.max(opacity, 0.06), zIndex: 9999 }}
  >
    <div className="transform -rotate-45 select-none">
      <p className="text-[80pt] font-bold text-gray-400 whitespace-nowrap tracking-widest">
        {text}
      </p>
    </div>
  </div>
);

/** Border wrapper */
const BorderWrapper: React.FC<{ style: string; color: string; children: React.ReactNode }> = ({ style, color, children }) => {
  const borderCSS = style === 'double'
    ? { border: `3px double ${color}`, padding: '4px' }
    : style === 'ornate'
    ? { border: `4px solid ${color}`, boxShadow: `inset 0 0 0 2px white, inset 0 0 0 3px ${color}`, padding: '6px' }
    : style === 'single'
    ? { border: `2px solid ${color}`, padding: '2px' }
    : {};

  return <div style={borderCSS}>{children}</div>;
};

const SecureLetterhead = forwardRef<HTMLDivElement, SecureLetterheadProps>(
  ({ config, children, className = '' }, ref) => {
    const {
      orgName, orgNameEn, orgLogo, orgAddress, orgPhone, orgEmail, orgCR, orgTaxId,
      accentColor, borderStyle, headerLayout,
      showWatermark, watermarkText, watermarkOpacity,
      showGuilloche, guillocheColor,
      showQR: _showQR, showBarcode: _showBarcode, showSerialNumber: _showSerialNumber, showSHA256,
      serialNumber, verificationCode, sha256Hash,
      documentTitle, documentDate,
    } = config;

    const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=stationery&code=${encodeURIComponent(serialNumber)}`;

    return (
      <div ref={ref} className={`bg-white relative ${className}`} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontFamily: "'Cairo', sans-serif" }} dir="rtl">
        <BorderWrapper style={borderStyle} color={accentColor}>
          <div className="relative" style={{ padding: '15mm 18mm' }}>
            
            {/* Watermark */}
            {showWatermark && <WatermarkOverlay text={watermarkText} opacity={watermarkOpacity} />}

            {/* Guilloche top strip */}
            {showGuilloche && (
              <div className="absolute top-0 left-0 right-0 h-[60px] overflow-hidden">
                <GuillochePattern color={guillocheColor} opacity={0.1} />
              </div>
            )}

            {/* === HEADER === */}
            <div className="relative z-10 mb-6">
              {headerLayout === 'centered' && (
                <div className="text-center border-b-2 pb-4" style={{ borderColor: accentColor }}>
                  {orgLogo && <img src={orgLogo} alt={orgName} className="h-16 mx-auto mb-2 object-contain" crossOrigin="anonymous" />}
                  <h1 className="text-xl font-bold" style={{ color: accentColor }}>{orgName}</h1>
                  {orgNameEn && <p className="text-sm text-gray-500 font-medium">{orgNameEn}</p>}
                  <div className="flex items-center justify-center gap-4 mt-2 text-[8pt] text-gray-500">
                    {orgAddress && <span>{orgAddress}</span>}
                    {orgPhone && <span>📞 {orgPhone}</span>}
                    {orgEmail && <span>✉️ {orgEmail}</span>}
                  </div>
                  {(orgCR || orgTaxId) && (
                    <div className="flex items-center justify-center gap-4 mt-1 text-[7pt] text-gray-400">
                      {orgCR && <span>س.ت: {orgCR}</span>}
                      {orgTaxId && <span>ر.ض: {orgTaxId}</span>}
                    </div>
                  )}
                </div>
              )}

              {headerLayout === 'split' && (
                <div className="flex items-start justify-between border-b-2 pb-4" style={{ borderColor: accentColor }}>
                  <div className="text-right flex-1">
                    <h1 className="text-lg font-bold" style={{ color: accentColor }}>{orgName}</h1>
                    {orgNameEn && <p className="text-xs text-gray-500">{orgNameEn}</p>}
                    <div className="text-[7pt] text-gray-500 mt-1 space-y-0.5">
                      {orgAddress && <p>{orgAddress}</p>}
                      {orgPhone && <p>📞 {orgPhone}</p>}
                    </div>
                  </div>
                  {orgLogo && (
                    <img src={orgLogo} alt={orgName} className="h-14 object-contain" crossOrigin="anonymous" />
                  )}
                  <div className="text-left flex-1 text-[7pt] text-gray-500">
                    {orgEmail && <p>✉️ {orgEmail}</p>}
                    {orgCR && <p>C.R: {orgCR}</p>}
                    {orgTaxId && <p>Tax: {orgTaxId}</p>}
                  </div>
                </div>
              )}

              {headerLayout === 'left-aligned' && (
                <div className="flex items-center gap-4 border-b-2 pb-4" style={{ borderColor: accentColor }}>
                  {orgLogo && <img src={orgLogo} alt={orgName} className="h-14 object-contain" crossOrigin="anonymous" />}
                  <div>
                    <h1 className="text-lg font-bold" style={{ color: accentColor }}>{orgName}</h1>
                    {orgNameEn && <p className="text-xs text-gray-500">{orgNameEn}</p>}
                  </div>
                </div>
              )}

              {/* Document title & date row */}
              {(documentTitle || documentDate || showSerialNumber) && (
                <div className="flex items-center justify-between mt-3 text-[9pt]">
                  {documentTitle && <p className="font-bold" style={{ color: accentColor }}>{documentTitle}</p>}
                  <div className="flex gap-4 text-gray-500">
                    {documentDate && <span>التاريخ: {documentDate}</span>}
                    {showSerialNumber && <span>الرقم: <span className="font-mono font-bold">{serialNumber}</span></span>}
                  </div>
                </div>
              )}
            </div>

            {/* === CONTENT AREA === */}
            <div className="relative z-10 min-h-[180mm]">
              {children}
            </div>

            {/* Guilloche bottom strip */}
            {showGuilloche && (
              <div className="absolute bottom-[100px] left-0 right-0 h-[60px] overflow-hidden">
                <GuillochePattern color={guillocheColor} opacity={0.06} />
              </div>
            )}

            {/* === FOOTER / SECURITY STRIP === */}
            <div className="relative z-10 mt-auto pt-4 border-t" style={{ borderColor: accentColor }}>
              <div className="flex items-center justify-between gap-3">
                {/* QR */}
                {showQR && (
                  <div className="text-center flex-shrink-0">
                    <QRCodeSVG value={qrValue} size={55} level="H" />
                    <p className="text-[6pt] text-gray-400 mt-0.5">امسح للتحقق</p>
                  </div>
                )}

                {/* Center info */}
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield className="w-3 h-3" style={{ color: accentColor }} />
                    <span className="text-[8pt] font-bold" style={{ color: accentColor }}>مستند مؤمّن إلكترونياً</span>
                  </div>
                  <p className="text-[7pt] text-gray-500">
                    كود التحقق: <span className="font-mono font-bold" style={{ color: accentColor }}>{verificationCode}</span>
                  </p>
                  {showSHA256 && sha256Hash && (
                    <p className="text-[6pt] text-gray-400 font-mono mt-0.5 break-all">
                      <Hash className="w-2 h-2 inline ml-0.5" />
                      SHA-256: {sha256Hash.slice(0, 32)}...
                    </p>
                  )}
                </div>

                {/* Barcode */}
                {showBarcode && (
                  <div className="flex-shrink-0">
                    <Barcode value={serialNumber} width={0.9} height={28} fontSize={7} displayValue margin={0} />
                  </div>
                )}
              </div>

              <p className="text-center text-[5pt] text-gray-300 mt-2">
                <CheckCircle2 className="w-2 h-2 inline ml-0.5" />
                وثيقة صادرة من منصة iRecycle — للتحقق من صحتها امسح رمز QR أو أدخل كود التحقق
              </p>
            </div>
          </div>
        </BorderWrapper>
      </div>
    );
  }
);

SecureLetterhead.displayName = 'SecureLetterhead';
export default SecureLetterhead;
