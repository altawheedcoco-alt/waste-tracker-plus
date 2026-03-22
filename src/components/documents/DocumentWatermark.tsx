/**
 * Document Watermark Overlay — طبقة العلامة المائية
 * تُعرض فوق المستند عند تفعيل العلامة المائية
 */
import { memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface DocumentWatermarkProps {
  enabled: boolean;
}

const DocumentWatermark = memo(({ enabled }: DocumentWatermarkProps) => {
  const { user, profile, organization } = useAuth();

  if (!enabled) return null;

  const watermarkText = [
    profile?.full_name || user?.email || 'مستخدم',
    organization?.name || '',
    format(new Date(), 'yyyy/MM/dd HH:mm'),
  ].filter(Boolean).join(' • ');

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Repeating diagonal watermark */}
      <div className="absolute inset-0" style={{
        background: 'repeating-linear-gradient(-45deg, transparent, transparent 200px, rgba(0,0,0,0.02) 200px, rgba(0,0,0,0.02) 201px)',
      }} />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute whitespace-nowrap text-muted-foreground/15 font-bold select-none"
          style={{
            fontSize: '14px',
            transform: 'rotate(-35deg)',
            top: `${i * 120 - 50}px`,
            left: '-50px',
            right: '-50px',
            textAlign: 'center',
            letterSpacing: '2px',
            userSelect: 'none',
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
});

DocumentWatermark.displayName = 'DocumentWatermark';
export default DocumentWatermark;
