import React, { forwardRef, ReactNode } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Leaf, FileCheck, Building2, CheckCircle2 } from 'lucide-react';

interface PrintWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  documentNumber?: string;
  showQR?: boolean;
  showBarcode?: boolean;
  qrValue?: string;
  barcodeValue?: string;
  organizationName?: string;
  organizationLogo?: string | null;
  showWatermark?: boolean;
  watermarkText?: string;
  isOfficial?: boolean;
  showFooter?: boolean;
  footerText?: string;
  className?: string;
}

const PrintWrapper = forwardRef<HTMLDivElement, PrintWrapperProps>(({
  children,
  title,
  subtitle,
  documentNumber,
  showQR = true,
  showBarcode = true,
  qrValue,
  barcodeValue,
  organizationName,
  organizationLogo,
  showWatermark = false,
  watermarkText = 'سري',
  isOfficial = false,
  showFooter = true,
  footerText,
  className = '',
}, ref) => {
  const currentDate = format(new Date(), 'PP', { locale: ar });
  const currentTime = format(new Date(), 'p', { locale: ar });
  const qrContent = qrValue || `DOC-${documentNumber || Date.now()}`;
  const barcodeContent = barcodeValue || documentNumber || `DOC${Date.now()}`;

  return (
    <div
      ref={ref}
      className={`print-container bg-white text-black p-8 ${isOfficial ? 'print-official' : ''} ${className}`}
      dir="rtl"
      style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}
    >
      {/* Watermark */}
      {showWatermark && (
        <div className="print-watermark">
          {watermarkText}
        </div>
      )}

      {/* Header */}
      <header className="print-header flex items-start justify-between mb-6 border-b-2 border-green-600 pb-4">
        {/* QR Code */}
        {showQR && (
          <div className="text-center print-qr">
            <QRCodeSVG
              value={qrContent}
              size={70}
              level="M"
              includeMargin={false}
            />
            <p className="text-xs mt-1 text-gray-500">رمز التحقق</p>
          </div>
        )}

        {/* Title Section */}
        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="w-7 h-7 text-green-600" />
            <h1 className="text-xl font-bold text-green-700 print-title">{title}</h1>
            <Leaf className="w-7 h-7 text-green-600" />
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          {documentNumber && (
            <div className="mt-2 inline-block bg-gray-50 border border-gray-200 rounded px-3 py-1">
              <span className="text-sm">رقم الوثيقة: </span>
              <span className="font-mono font-bold text-green-700 print-certificate-number">
                {documentNumber}
              </span>
            </div>
          )}
        </div>

        {/* Barcode / Logo */}
        <div className="text-center print-barcode">
          {organizationLogo ? (
            <img
              src={organizationLogo}
              alt={organizationName || 'Logo'}
              className="h-12 mx-auto mb-1 object-contain"
              crossOrigin="anonymous"
            />
          ) : showBarcode && barcodeContent ? (
            <>
              <Barcode
                value={barcodeContent}
                width={1}
                height={35}
                fontSize={8}
                displayValue={false}
              />
              <p className="text-xs font-mono mt-1">{barcodeContent}</p>
            </>
          ) : null}
          {organizationName && (
            <p className="text-xs text-gray-600 mt-1">{organizationName}</p>
          )}
        </div>
      </header>

      {/* Document Info Bar */}
      <div className="flex justify-between items-center text-xs text-gray-500 mb-4 pb-2 border-b border-gray-100">
        <span>تاريخ الإصدار: {currentDate}</span>
        <span>الوقت: {currentTime}</span>
      </div>

      {/* Main Content */}
      <main className="print-content">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="print-footer mt-8 pt-4 border-t text-center text-xs text-gray-500">
          <p>
            {footerText || 'هذه الوثيقة صادرة إلكترونياً من نظام إدارة المخلفات وإعادة التدوير - آي ريسايكل'}
          </p>
          <p className="mt-1">
            تاريخ الإصدار: {currentDate} | رقم المرجع: {documentNumber || '-'}
          </p>
          <p className="mt-2 text-gray-400 text-[8pt]">
            هذه الوثيقة تم إنشاؤها آلياً وتعتبر صالحة بدون توقيع في حالة التحقق الإلكتروني
          </p>
        </footer>
      )}
    </div>
  );
});

PrintWrapper.displayName = 'PrintWrapper';

// Sub-components for common print elements
export const PrintSection = ({ 
  title, 
  icon: Icon = FileCheck, 
  children, 
  className = '' 
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
    <div className="text-sm">
      {children}
    </div>
  </div>
);

export const PrintDeclaration = ({ 
  title, 
  children, 
  variant = 'success' 
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
      <div className="print-declaration-content text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export const PrintPartyCard = ({ 
  title, 
  icon: Icon = Building2, 
  name, 
  details, 
  highlighted = false 
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
  signatures 
}: { 
  signatures: {
    title: string;
    name?: string;
    stampUrl?: string | null;
    signatureUrl?: string | null;
    date?: string;
  }[];
}) => (
  <div className="print-signatures grid gap-6 mt-8 pt-6 border-t-2 border-gray-300" style={{ gridTemplateColumns: `repeat(${signatures.length}, 1fr)` }}>
    {signatures.map((sig, index) => (
      <div key={index} className="print-signature-box text-center">
        <p className="font-bold text-gray-800 mb-1 text-sm">{sig.title}</p>
        {sig.name && <p className="text-xs text-gray-600 mb-3">{sig.name}</p>}
        
        <div className="flex justify-center gap-4 mt-3">
          {/* Signature */}
          <div className="text-center">
            {sig.signatureUrl ? (
              <img
                src={sig.signatureUrl}
                alt="التوقيع"
                className="h-12 mx-auto mb-1 object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="print-signature-line w-24 mx-auto" />
            )}
            <p className="text-[8pt] text-gray-500">التوقيع</p>
          </div>

          {/* Stamp */}
          <div className="text-center">
            {sig.stampUrl ? (
              <img
                src={sig.stampUrl}
                alt="الختم"
                className="h-14 mx-auto mb-1 object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="print-stamp-placeholder" />
            )}
            <p className="text-[8pt] text-gray-500">الختم</p>
          </div>
        </div>

        {sig.date && (
          <p className="text-xs text-gray-500 mt-2">التاريخ: {sig.date}</p>
        )}
      </div>
    ))}
  </div>
);

export const PrintTable = ({ 
  headers, 
  rows, 
  className = '' 
}: { 
  headers: string[]; 
  rows: (string | number | ReactNode)[][]; 
  className?: string;
}) => (
  <table className={`w-full border-collapse text-sm mb-4 ${className}`}>
    <thead>
      <tr>
        {headers.map((header, index) => (
          <th
            key={index}
            className="p-2 bg-gray-100 font-semibold text-right border border-gray-300"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-gray-50' : ''}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex} className="p-2 border border-gray-300 text-right">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export const PrintStats = ({ 
  stats 
}: { 
  stats: { label: string; value: string | number; color?: string }[];
}) => (
  <div className="print-grid-4 grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)` }}>
    {stats.map((stat, index) => (
      <div key={index} className="print-stat-card text-center p-3 border rounded-lg">
        <div className={`print-stat-value text-2xl font-bold ${stat.color || 'text-green-600'}`}>
          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
        </div>
        <div className="print-stat-label text-xs text-gray-600 mt-1">
          {stat.label}
        </div>
      </div>
    ))}
  </div>
);

export default PrintWrapper;
