import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Shield, CheckCircle2, AlertTriangle, Leaf } from 'lucide-react';

interface SystemEndorsementBadgeProps {
  systemSealNumber: string;
  verificationCode: string;
  endorsedAt: Date;
  verificationUrl: string;
  isValid?: boolean;
  compact?: boolean;
  showDisclaimer?: boolean;
}

const SystemEndorsementBadge = ({
  systemSealNumber,
  verificationCode,
  endorsedAt,
  verificationUrl,
  isValid = true,
  compact = false,
  showDisclaimer = true,
}: SystemEndorsementBadgeProps) => {
  const formattedDate = format(endorsedAt, 'PPpp', { locale: ar });
  
  const qrData = `${window.location.origin}/qr-verify?type=contract&code=${encodeURIComponent(verificationCode)}`;

  if (compact) {
    return (
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ 
          backgroundColor: isValid ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${isValid ? '#86efac' : '#fecaca'}`,
        }}
      >
        {isValid ? (
          <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
        ) : (
          <AlertTriangle className="w-4 h-4" style={{ color: '#dc2626' }} />
        )}
        <span 
          className="font-mono text-xs font-semibold"
          style={{ color: isValid ? '#166534' : '#991b1b' }}
        >
          {systemSealNumber}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-4 mt-4"
      dir="rtl"
      style={{ 
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
        border: '2px solid #86efac',
        boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -2px rgba(22, 163, 74, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="p-2 rounded-full"
            style={{ backgroundColor: '#dcfce7' }}
          >
            <Shield className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <div>
            <h4 className="font-bold" style={{ color: '#166534', fontSize: '11pt' }}>
              اعتماد منصة آي ريسايكل
            </h4>
            <p className="text-xs" style={{ color: '#4ade80' }}>
              iRecycle Platform Endorsement
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Leaf className="w-5 h-5" style={{ color: '#16a34a' }} />
          <Leaf className="w-4 h-4" style={{ color: '#4ade80' }} />
          <Leaf className="w-3 h-3" style={{ color: '#86efac' }} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* QR Code */}
        <div className="flex items-center justify-center">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <QRCodeSVG
              value={qrData}
              size={80}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#166534"
            />
          </div>
        </div>

        {/* Seal Info */}
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: '#16a34a' }} />
            ) : (
              <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
            )}
            <span 
              className="font-semibold"
              style={{ color: isValid ? '#166534' : '#991b1b', fontSize: '10pt' }}
            >
              {isValid ? 'مستند معتمد وموثق' : 'مستند ملغى'}
            </span>
          </div>

          <div className="space-y-1" style={{ fontSize: '8pt' }}>
            <div className="flex items-center gap-2">
              <span style={{ color: '#6b7280' }}>رقم الختم:</span>
              <span 
                className="font-mono font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: '#dcfce7', color: '#166534' }}
              >
                {systemSealNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#6b7280' }}>كود التحقق:</span>
              <span 
                className="font-mono font-semibold"
                style={{ color: '#166534' }}
              >
                {verificationCode}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: '#6b7280' }}>تاريخ الاعتماد:</span>
              <span style={{ color: '#166534' }}>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <div 
          className="mt-3 pt-3 text-center"
          style={{ borderTop: '1px dashed #86efac', fontSize: '7pt', color: '#6b7280' }}
        >
          <p>
            هذا المستند صادر إلكترونياً من منصة آي ريسايكل لإدارة المخلفات.
          </p>
          <p style={{ color: '#9ca3af' }}>
            المنصة غير مسؤولة عن صحة البيانات المدخلة من قبل الأطراف المشاركة.
          </p>
          <p style={{ color: '#9ca3af', marginTop: '2px' }}>
            للتحقق من صحة المستند: {verificationUrl}
          </p>
        </div>
      )}

      {/* Decorative Pattern */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
        style={{
          background: 'repeating-linear-gradient(90deg, #16a34a, #16a34a 10px, #4ade80 10px, #4ade80 20px)',
          opacity: 0.3,
        }}
      />
    </div>
  );
};

export default SystemEndorsementBadge;
