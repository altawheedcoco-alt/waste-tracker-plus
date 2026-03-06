import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Shield, CheckCircle2 } from 'lucide-react';

interface DocumentVerificationBlockProps {
  /** QR code data string (JSON) */
  qrData: string;
  /** Barcode value (document number or verification code) */
  barcodeData: string;
  /** Unique verification code */
  verificationCode: string;
  /** Organization declaration number */
  declNumber?: string;
  /** Organization name */
  orgName?: string;
  /** Optional signature URL (shown only if provided) */
  signatureUrl?: string | null;
  /** Optional stamp URL (shown only if provided) */
  stampUrl?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show in print-friendly mode (inline styles) */
  printMode?: boolean;
  /** Custom class */
  className?: string;
}

/**
 * Universal verification block for all documents.
 * QR Code + Barcode + Verification Code are MANDATORY.
 * Signature + Stamp are OPTIONAL (shown only if URLs are provided).
 */
const DocumentVerificationBlock = ({
  qrData,
  barcodeData,
  verificationCode,
  declNumber,
  orgName,
  signatureUrl,
  stampUrl,
  size = 'md',
  printMode = false,
  className = '',
}: DocumentVerificationBlockProps) => {
  const qrSize = size === 'sm' ? 70 : size === 'lg' ? 120 : 90;
  const barcodeHeight = size === 'sm' ? 30 : size === 'lg' ? 55 : 40;
  const barcodeWidth = size === 'sm' ? 1 : size === 'lg' ? 1.5 : 1.2;
  const fontSize = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;

  if (printMode) {
    return (
      <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px', marginTop: '16px' }} className={className}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          {/* QR Code */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <QRCodeSVG value={qrData} size={qrSize} level="M" />
            <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '4px' }}>امسح للتحقق</p>
          </div>

          {/* Center: Verification Info */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '8pt', color: '#16a34a', fontWeight: 'bold' }}>✓ مستند محقق رقمياً</span>
            </div>
            <p style={{ fontSize: '8pt', color: '#374151' }}>
              رمز التحقق: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#166534', letterSpacing: '1px' }}>{verificationCode}</span>
            </p>
            {declNumber && (
              <p style={{ fontSize: '7pt', color: '#6b7280', marginTop: '2px' }}>
                رقم الإعلان الرقمي: <span style={{ fontFamily: 'monospace' }}>{declNumber}</span>
              </p>
            )}
            <div style={{ marginTop: '6px' }}>
              <Barcode
                value={barcodeData}
                height={barcodeHeight}
                width={barcodeWidth}
                fontSize={fontSize}
                margin={2}
                displayValue
              />
            </div>
          </div>

          {/* Optional: Signature & Stamp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', flexShrink: 0, minWidth: '80px' }}>
            {signatureUrl && (
              <div style={{ textAlign: 'center' }}>
                <img src={signatureUrl} alt="التوقيع" style={{ maxHeight: '35px', objectFit: 'contain' }} />
                <p style={{ fontSize: '6pt', color: '#9ca3af' }}>التوقيع</p>
              </div>
            )}
            {stampUrl && (
              <div style={{ textAlign: 'center' }}>
                <img src={stampUrl} alt="الختم" style={{ maxHeight: '35px', objectFit: 'contain' }} />
                <p style={{ fontSize: '6pt', color: '#9ca3af' }}>الختم</p>
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: '6pt', color: '#9ca3af', textAlign: 'center', marginTop: '6px' }}>
          {orgName && `${orgName} · `}تم التحقق آلياً عبر منصة iRecycle · {new Date().toLocaleDateString('ar-EG')}
        </p>
      </div>
    );
  }

  // Tailwind / interactive version
  return (
    <div className={`border-t-2 border-border pt-3 mt-4 ${className}`}>
      <div className="flex justify-between items-start gap-3">
        {/* QR Code */}
        <div className="text-center flex-shrink-0">
          <QRCodeSVG value={qrData} size={qrSize} level="M" />
          <p className="text-[7pt] text-muted-foreground mt-1">امسح للتحقق</p>
        </div>

        {/* Center: Verification Info */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">مستند محقق رقمياً</span>
          </div>
          <p className="text-xs text-foreground">
            رمز التحقق: <span className="font-mono font-bold text-primary tracking-wider">{verificationCode}</span>
          </p>
          {declNumber && (
            <p className="text-[9px] text-muted-foreground mt-0.5">
              رقم الإعلان الرقمي: <span className="font-mono">{declNumber}</span>
            </p>
          )}
          <div className="mt-1.5">
            <Barcode
              value={barcodeData}
              height={barcodeHeight}
              width={barcodeWidth}
              fontSize={fontSize}
              margin={2}
              displayValue
            />
          </div>
        </div>

        {/* Optional: Signature & Stamp */}
        {(signatureUrl || stampUrl) && (
          <div className="flex flex-col gap-1 items-center flex-shrink-0 min-w-[70px]">
            {signatureUrl && (
              <div className="text-center">
                <img src={signatureUrl} alt="التوقيع" className="max-h-[35px] object-contain" />
                <p className="text-[6pt] text-muted-foreground">التوقيع</p>
              </div>
            )}
            {stampUrl && (
              <div className="text-center">
                <img src={stampUrl} alt="الختم" className="max-h-[35px] object-contain" />
                <p className="text-[6pt] text-muted-foreground">الختم</p>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-[7px] text-muted-foreground text-center mt-1.5">
        {orgName && `${orgName} · `}تم التحقق آلياً عبر منصة iRecycle · {new Date().toLocaleDateString('ar-EG')}
      </p>
    </div>
  );
};

export default DocumentVerificationBlock;
