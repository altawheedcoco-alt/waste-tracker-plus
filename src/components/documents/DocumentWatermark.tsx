/**
 * Document Watermark Overlay — طبقة العلامة المائية المتقدمة
 * تُعرض فوق المستند لمنع النسخ والتصوير
 */
import { memo, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface DocumentWatermarkProps {
  enabled: boolean;
  userName?: string;
  orgName?: string;
}

const DocumentWatermark = memo(({ enabled, userName, orgName }: DocumentWatermarkProps) => {
  const { user, profile, organization } = useAuth();

  const watermarkText = useMemo(() => {
    const name = userName || profile?.full_name || user?.email || 'مستخدم';
    const org = orgName || organization?.name || '';
    const time = format(new Date(), 'yyyy/MM/dd HH:mm:ss');
    return [name, org, time].filter(Boolean).join(' • ');
  }, [userName, orgName, profile?.full_name, user?.email, organization?.name]);

  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dense repeating watermark grid */}
      {Array.from({ length: 12 }).map((_, row) => (
        <div key={row} className="flex justify-center">
          {Array.from({ length: 3 }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="whitespace-nowrap font-bold"
              style={{
                position: 'absolute',
                fontSize: '12px',
                color: 'rgba(0,0,0,0.06)',
                transform: 'rotate(-35deg)',
                top: `${row * 90 - 40}px`,
                left: `${col * 350 - 100}px`,
                letterSpacing: '1px',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {watermarkText}
            </div>
          ))}
        </div>
      ))}
      {/* Anti-screenshot gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(-45deg, transparent, transparent 150px, rgba(128,128,128,0.015) 150px, rgba(128,128,128,0.015) 151px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

DocumentWatermark.displayName = 'DocumentWatermark';
export default DocumentWatermark;
