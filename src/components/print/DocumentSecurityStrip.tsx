/**
 * DocumentSecurityStrip — A reusable component that adds QR code, barcode,
 * verification code, serial number, and signer QR codes to ANY document.
 * 
 * Drop this into any print view to instantly add full security features.
 */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Shield, Hash, Fingerprint, CheckCircle2 } from 'lucide-react';
import { generateDocumentQRValue, DocumentQRType } from '@/lib/documentQR';

export interface DocumentSigner {
  name: string;
  title?: string;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  sealNumber?: string;
  signatoryCode?: string;
  nationalId?: string;
  date?: string;
}

interface DocumentSecurityStripProps {
  /** Document type for QR verification */
  documentType: DocumentQRType;
  /** Main reference number (shipment number, invoice number, etc.) */
  referenceNumber: string;
  /** Verification code */
  verificationCode?: string;
  /** Serial number (if different from reference) */
  serialNumber?: string;
  /** Signers with their details */
  signers?: DocumentSigner[];
  /** Show compact version (for small documents) */
  compact?: boolean;
  /** Accent color */
  accentColor?: string;
}

const DocumentSecurityStrip: React.FC<DocumentSecurityStripProps> = ({
  documentType,
  referenceNumber,
  verificationCode,
  serialNumber,
  signers = [],
  compact = false,
  accentColor = '#16a34a',
}) => {
  const qrValue = generateDocumentQRValue(documentType, referenceNumber);
  const vCode = verificationCode || `VRF-${referenceNumber.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 border border-gray-200 rounded bg-gray-50 text-[7pt]" dir="rtl">
        <QRCodeSVG value={qrValue} size={40} level="M" />
        <div className="flex-1 text-center">
          <p className="font-mono font-bold" style={{ color: accentColor }}>{referenceNumber}</p>
          <p className="text-gray-500">كود التحقق: <span className="font-mono">{vCode}</span></p>
        </div>
        <div className="flex-shrink-0">
          <Barcode value={referenceNumber} width={0.8} height={22} fontSize={0} displayValue={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="document-security-strip" dir="rtl">
      {/* Security Header */}
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50/80 mb-3">
        {/* QR Code */}
        <div className="text-center flex-shrink-0">
          <QRCodeSVG value={qrValue} size={65} level="H" includeMargin={false} />
          <p className="text-[7pt] mt-1 text-gray-500">امسح للتحقق</p>
        </div>

        {/* Center info */}
        <div className="flex-1 text-center px-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-4 h-4" style={{ color: accentColor }} />
            <span className="text-xs font-bold" style={{ color: accentColor }}>مستند مؤمّن إلكترونياً</span>
          </div>
          <div className="space-y-1">
            <p className="text-[8pt]">
              رقم المرجع: <span className="font-mono font-bold text-gray-800">{referenceNumber}</span>
            </p>
            {serialNumber && serialNumber !== referenceNumber && (
              <p className="text-[8pt]">
                الرقم التسلسلي: <span className="font-mono font-bold text-gray-800">{serialNumber}</span>
              </p>
            )}
            <p className="text-[8pt]">
              <Shield className="w-2.5 h-2.5 inline-block ml-0.5" />
              كود التحقق: <span className="font-mono font-bold" style={{ color: accentColor }}>{vCode}</span>
            </p>
          </div>
        </div>

        {/* Barcode */}
        <div className="text-center flex-shrink-0">
          <Barcode value={referenceNumber} width={1} height={30} fontSize={7} displayValue margin={0} />
        </div>
      </div>

      {/* Signers Section with QR Codes */}
      {signers.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-center text-[8pt] text-gray-500 mb-3 flex items-center justify-center gap-1">
            <Fingerprint className="w-3 h-3" />
            التوقيعات والأختام المعتمدة
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(signers.length, 3)}, 1fr)` }}>
            {signers.map((signer, idx) => {
              const signerQrValue = signer.sealNumber || signer.signatoryCode
                ? `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=signer&code=${encodeURIComponent(signer.sealNumber || signer.signatoryCode || '')}&doc=${encodeURIComponent(referenceNumber)}`
                : '';

              return (
                <div key={idx} className="text-center border border-gray-100 rounded-lg p-2 bg-white">
                  <p className="font-bold text-[9pt] text-gray-800">{signer.title || 'الموقع'}</p>
                  <p className="text-[8pt] text-gray-600 mb-2">{signer.name}</p>

                  <div className="flex justify-center gap-3 my-2">
                    <div className="text-center">
                      {signer.signatureUrl ? (
                        <img src={signer.signatureUrl} alt="التوقيع" className="h-10 mx-auto object-contain" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-20 h-[1px] bg-gray-400 mx-auto mt-8" />
                      )}
                      <p className="text-[6pt] text-gray-400 mt-1">التوقيع</p>
                    </div>
                    <div className="text-center">
                      {signer.stampUrl ? (
                        <img src={signer.stampUrl} alt="الختم" className="h-12 mx-auto object-contain" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-12 h-12 mx-auto rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-[6pt] text-gray-400">الختم</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signer verification QR */}
                  {signerQrValue && (
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center justify-center gap-2">
                      <QRCodeSVG value={signerQrValue} size={30} level="L" />
                      <div className="text-right">
                        {signer.sealNumber && (
                          <p className="text-[6pt] font-mono text-gray-600">
                            <Hash className="w-2 h-2 inline ml-0.5" />
                            {signer.sealNumber}
                          </p>
                        )}
                        {signer.signatoryCode && (
                          <p className="text-[6pt] font-mono text-gray-500">{signer.signatoryCode}</p>
                        )}
                        {signer.nationalId && (
                          <p className="text-[6pt] text-gray-400">هوية: ***{signer.nationalId.slice(-4)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {signer.date && <p className="text-[6pt] text-gray-400 mt-1">{signer.date}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legal digital signature notice */}
      <div className="mt-2 p-2 border border-gray-300 rounded bg-amber-50/60 text-center">
        <p className="text-[7pt] font-bold text-gray-700 mb-0.5">
          <Shield className="w-3 h-3 inline ml-1" style={{ color: accentColor }} />
          إقرار بالحجية الرقمية
        </p>
        <p className="text-[6pt] text-gray-600 leading-relaxed">
          رمز الاستجابة السريعة (QR Code) والباركود المُدرجان على هذا المستند يقومان مقام التوقيع والختم الحيّ، 
          ولا يحتاج المستند إلى إمضاء أو ختم يدوي إضافي، وذلك وفقاً لأحكام قانون التوقيع الإلكتروني المصري رقم 15 لسنة 2004 
          ولائحته التنفيذية. يُعد هذا المستند الإلكتروني حجة قانونية كاملة في الإثبات ما لم يُثبت العكس.
        </p>
      </div>
      {/* Verification instruction */}
      <p className="text-center text-[6pt] text-gray-400 mt-1">
        <CheckCircle2 className="w-2.5 h-2.5 inline ml-0.5" />
        للتحقق من صحة المستند امسح رمز QR أو أدخل كود التحقق في بوابة التحقق الإلكترونية
      </p>
    </div>
  );
};

export default DocumentSecurityStrip;
