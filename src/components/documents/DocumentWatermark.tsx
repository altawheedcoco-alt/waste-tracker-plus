/**
 * Document Watermark Overlay — طبقة العلامة المائية المتقدمة
 * تغطي كامل صفحات المستند بغض النظر عن الطول
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

  // Generate a repeating tile via canvas for infinite coverage
  const tileUrl = useMemo(() => {
    if (!enabled) return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const w = 500;
    const h = 200;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-35 * Math.PI / 180);
    ctx.font = 'bold 13px system-ui, Arial, sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }, [enabled, watermarkText]);

  if (!enabled || !tileUrl) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-50"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        backgroundImage: `url(${tileUrl})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '500px 200px',
        width: '100%',
        height: '100%',
        minHeight: '100%',
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

DocumentWatermark.displayName = 'DocumentWatermark';
export default DocumentWatermark;
